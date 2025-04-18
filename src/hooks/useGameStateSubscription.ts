
import { useState, useEffect, useRef, useCallback } from 'react';
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
  const isSubscribingRef = useRef<boolean>(false);
  
  // Create a stable checkGameState function that doesn't depend on changing props
  const checkGameState = useCallback(async () => {
    if (!gameCode || initialCheckDoneRef.current || isSubscribingRef.current) return;
    
    isSubscribingRef.current = true;
    console.log("Performing initial game state check for code:", gameCode);
    
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
    } catch (err) {
      console.error('Exception checking game state:', err);
    } finally {
      // Mark initial check as complete regardless of outcome
      initialCheckDoneRef.current = true;
      isSubscribingRef.current = false;
    }
  }, [gameCode, isHost]);

  // Stable fetchGameState function
  const fetchGameState = useCallback(async () => {
    if (!gameCode || initialCheckDoneRef.current || isSubscribingRef.current) return;
    
    isSubscribingRef.current = true;
    console.log("Fetching game state data for code:", gameCode);
    
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

      if (data && data.game_phase) {
        console.log('Initial game state:', data);
        const currentPhase = data.game_phase as GamePhase;
        
        // Set the game phase for all players 
        setGamePhase(currentPhase);
        
        if ('host_ready' in data) {
          setHostReady(!!data.host_ready);
        }
      }
    } catch (err) {
      console.error('Exception fetching game state:', err);
    } finally {
      // Mark initial fetch as done to prevent duplicated fetches
      initialCheckDoneRef.current = true;
      isSubscribingRef.current = false;
    }
  }, [gameCode, setGamePhase, setHostReady]);

  // Main subscription effect
  useEffect(() => {
    if (!gameCode) return;

    console.log("Setting up game state monitoring for code:", gameCode);
    let isMounted = true;
    
    // Clean up any existing channel before creating a new one
    if (channelRef.current) {
      console.log('Removing existing game state channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Run initial check only once
    if (!initialCheckDoneRef.current && !isSubscribingRef.current) {
      checkGameState();
    }

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
          if (!isMounted) {
            console.log('Component unmounted, ignoring game state change');
            return;
          }
          
          console.log('Game state change detected:', payload);
          
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
      });

    // Store the channel reference so we can clean it up properly
    channelRef.current = channel;

    // Only fetch game state if we haven't done the initial check yet
    if (!initialCheckDoneRef.current && !isSubscribingRef.current) {
      fetchGameState();
    }

    return () => {
      console.log('Cleaning up game state subscription');
      isMounted = false;
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  // Only depend on values that truly require re-subscription
  }, [gameCode, isHost, checkGameState, fetchGameState, setGamePhase, setHostReady, clearGameData, navigate]);
};
