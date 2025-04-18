
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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const initialCheckDoneRef = useRef<boolean>(false);

  useEffect(() => {
    if (!gameCode) return;

    console.log("Setting up game state monitoring for code:", gameCode);
    let isMounted = true;
    let isSubscribing = false;

    const checkGameState = async () => {
      if (initialCheckDoneRef.current || isSubscribing) return;
      
      try {
        const { data, error } = await supabase
          .from('game_state')
          .select('*')
          .eq('game_code', gameCode)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking game state:', error);
          return;
        }

        // Only create initial state if we're the host and no data exists
        if (!data && isHost && isMounted) {
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
        
        // Mark initial check as complete regardless of outcome
        initialCheckDoneRef.current = true;
      } catch (err) {
        console.error('Exception checking game state:', err);
        // Mark as done even on error to prevent infinite retries
        initialCheckDoneRef.current = true;
      }
    };

    checkGameState();

    // Clean up any existing channel before creating a new one
    if (channelRef.current) {
      console.log('Removing existing game state channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Set subscribing flag to prevent concurrent fetch operations
    isSubscribing = true;

    // Create a unique channel ID to avoid conflicts
    const channelId = `game-state-changes-${gameCode}-${Date.now()}`;
    console.log(`Creating new game state channel: ${channelId}`);

    const channel = supabase
      .channel(channelId)
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
          
          if (!isMounted) {
            console.log('Component unmounted, ignoring game state change');
            return;
          }
          
          if (payload.new && 'game_phase' in payload.new) {
            const newPhase = payload.new.game_phase as GamePhase;
            console.log(`Game phase update: ${newPhase}, isHost: ${isHost}`);
            
            // Process all phases for both host and player
            setGamePhase(newPhase);
            
            if ('host_ready' in payload.new) {
              setHostReady(!!payload.new.host_ready);
            }
          } else if (payload.eventType === 'DELETE') {
            if (!isHost) {
              console.log('Game state deleted by host - ending game for player');
              clearGameData();
              navigate('/');
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Game state subscription status:', status);
        isSubscribing = false;
      });

    // Store the channel reference so we can clean it up properly
    channelRef.current = channel;

    const fetchGameState = async () => {
      if (!isMounted || initialCheckDoneRef.current) return;
      
      try {
        const { data, error } = await supabase
          .from('game_state')
          .select('*')
          .eq('game_code', gameCode)
          .maybeSingle();

        if (error) {
          console.error('Error fetching game state:', error);
          return;
        }

        if (data && data.game_phase && isMounted) {
          console.log('Initial game state:', data);
          const currentPhase = data.game_phase as GamePhase;
          
          // Set the game phase for all players 
          setGamePhase(currentPhase);
          
          if ('host_ready' in data) {
            setHostReady(!!data.host_ready);
          }
        }
        
        // Mark initial fetch as done to prevent duplicated fetches
        initialCheckDoneRef.current = true;
      } catch (err) {
        console.error('Exception fetching game state:', err);
        // Mark as done even on error to prevent infinite retries
        initialCheckDoneRef.current = true;
      }
    };

    // Only fetch game state if we haven't done the initial check yet
    if (!initialCheckDoneRef.current) {
      fetchGameState();
    }

    return () => {
      console.log('Removing game state channel');
      isMounted = false;
      isSubscribing = false;
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [gameCode, isHost, setGamePhase, setHostReady, clearGameData, navigate]);
};
