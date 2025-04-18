
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type GamePhase = 'waiting' | 'playing' | 'answering' | 'results' | 'end';

interface UseGameStateSubscriptionProps {
  gameCode: string | null;
  isHost: boolean;
  setGamePhase: (phase: GamePhase | null) => void;
  setHostReady: (ready: boolean) => void;
  clearGameData: () => void;
  navigate: (path: string) => void;
}

export const useGameStateSubscription = ({
  gameCode,
  isHost,
  setGamePhase,
  setHostReady,
  clearGameData,
  navigate
}: UseGameStateSubscriptionProps) => {
  const isSubscribingRef = useRef(false);
  const channelRef = useRef<any>(null);
  const lastGamePhaseRef = useRef<GamePhase | null>(null);
  const phaseUpdateTimeRef = useRef<number>(0);
  
  useEffect(() => {
    if (!gameCode) return;

    console.log("Setting up game state monitoring for code:", gameCode);
    isSubscribingRef.current = true;

    const checkGameState = async () => {
      const { data, error } = await supabase
        .from('game_state')
        .select('*')
        .eq('game_code', gameCode)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking game state:', error);
        return;
      }

      if (!data && isHost) {
        console.log("Creating initial game state for host");
        const { error: insertError } = await supabase
          .from('game_state')
          .insert([
            {
              game_code: gameCode,
              game_phase: 'waiting',
              current_round: 1,
              host_ready: false
            }
          ]);

        if (insertError) {
          console.error('Error creating game state:', insertError);
          toast('שגיאה ביצירת מצב משחק', {
            description: 'אירעה שגיאה ביצירת מצב המשחק',
          });
        }
      }
    };

    checkGameState();

    // Ensure we only have one active channel at a time
    if (channelRef.current) {
      console.log('Removing existing game state channel before creating a new one');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Use a stable channel name based on the game code
    const channelName = `game-state-changes-${gameCode}`;
    
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_state',
          filter: `game_code=eq.${gameCode}`
        },
        (payload) => {
          console.log('Game state change detected:', payload);
          
          if (payload.new && 'game_phase' in payload.new) {
            const newPhase = payload.new.game_phase as GamePhase;
            const currentTime = Date.now();
            
            // Add debounce logic to prevent too frequent phase changes
            // Only process if it's been at least 500ms since the last update
            // or if it's the initial update or an 'end' phase
            if (
              newPhase === 'end' || 
              lastGamePhaseRef.current === null || 
              lastGamePhaseRef.current !== newPhase ||
              (currentTime - phaseUpdateTimeRef.current) > 500
            ) {
              console.log(`Game phase update: ${newPhase}, isHost: ${isHost}, last phase: ${lastGamePhaseRef.current}`);
              
              // Update reference values
              lastGamePhaseRef.current = newPhase;
              phaseUpdateTimeRef.current = currentTime;
              
              // For 'end' phase, we now always update regardless of host status
              // The GameEndOverlay component will handle visibility logic
              setGamePhase(newPhase);
              
              if ('host_ready' in payload.new) {
                setHostReady(!!payload.new.host_ready);
              }
            } else {
              console.log(`Ignoring frequent phase update to ${newPhase} (last update was ${currentTime - phaseUpdateTimeRef.current}ms ago)`);
            }
          } else if (payload.eventType === 'DELETE') {
            if (!isHost) {
              console.log('Game state deleted by host - ending game for player');
              clearGameData();
              navigate('/');
              
              toast('המשחק נמחק', {
                description: 'המשחק נמחק על ידי המארח',
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`Game state subscription status for ${channelName}:`, status);
      });

    const fetchGameState = async () => {
      const { data, error } = await supabase
        .from('game_state')
        .select('*')
        .eq('game_code', gameCode)
        .maybeSingle();

      if (error) {
        console.error('Error fetching game state:', error);
        return;
      }

      if (data && data.game_phase) {
        console.log('Initial game state:', data);
        const currentPhase = data.game_phase as GamePhase;
        
        // Set the initial game phase state
        lastGamePhaseRef.current = currentPhase;
        phaseUpdateTimeRef.current = Date.now();
        setGamePhase(currentPhase);
        
        if ('host_ready' in data) {
          setHostReady(!!data.host_ready);
        }
      }
    };

    fetchGameState();
    isSubscribingRef.current = false;

    return () => {
      console.log(`Removing game state channel ${channelName}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [gameCode, isHost, setGamePhase, setHostReady, clearGameData, navigate]);
};
