
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
  const updatingGameStateRef = useRef<boolean>(false);
  const lastGameStateUpdateRef = useRef<string | null>(null);
  
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

      if (!data && isHost) {
        console.log("Creating initial game state for host");
        const initialState = {
          game_code: gameCode,
          game_phase: 'waiting',
          current_round: 1,
          host_ready: false
        };

        const { error: insertError } = await supabase
          .from('game_state')
          .insert([initialState]);

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
      initialCheckDoneRef.current = true;
      isSubscribingRef.current = false;
    }
  }, [gameCode, isHost]);

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
        setGamePhase(currentPhase);
        
        if ('host_ready' in data) {
          setHostReady(!!data.host_ready);
        }
      }
    } catch (err) {
      console.error('Exception fetching game state:', err);
    } finally {
      initialCheckDoneRef.current = true;
      isSubscribingRef.current = false;
    }
  }, [gameCode, setGamePhase, setHostReady]);

  useEffect(() => {
    if (!gameCode) return;

    console.log("Setting up game state monitoring for code:", gameCode);
    let isMounted = true;
    
    if (channelRef.current) {
      console.log('Removing existing game state channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!initialCheckDoneRef.current && !isSubscribingRef.current) {
      checkGameState();
    }

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
          
          // Skip if this update was triggered by our own code
          if (lastGameStateUpdateRef.current === payload.new?.game_code) {
            console.log('Skipping own game state update');
            return;
          }
          
          console.log('Game state change detected:', payload);
          
          if (payload.new && 'game_phase' in payload.new) {
            const newPhase = payload.new.game_phase as GamePhase;
            console.log(`Game phase update: ${newPhase}, isHost: ${isHost}`);
            
            setGamePhase(newPhase);
            
            if ('host_ready' in payload.new) {
              setHostReady(!!payload.new.host_ready);
            }
          } else if (payload.eventType === 'DELETE' && !isHost) {
            console.log('Game state deleted by host - ending game for player');
            clearGameData();
            navigate('/');
          }
        }
      )
      .subscribe((status) => {
        console.log('Game state subscription status:', status);
      });

    channelRef.current = channel;

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
  }, [gameCode, isHost, checkGameState, fetchGameState, setGamePhase, setHostReady, clearGameData, navigate]);

  const updateGameState = useCallback(async (updates: Partial<{ game_phase: GamePhase, host_ready: boolean }>) => {
    if (!gameCode || updatingGameStateRef.current) {
      console.log('Update already in progress, skipping');
      return;
    }

    try {
      updatingGameStateRef.current = true;
      lastGameStateUpdateRef.current = gameCode;

      const { error } = await supabase
        .from('game_state')
        .update(updates)
        .eq('game_code', gameCode);

      if (error) {
        console.error('Error updating game state:', error);
        throw error;
      }
    } finally {
      updatingGameStateRef.current = false;
      // Reset lastGameStateUpdate after a delay to ensure we catch the realtime update
      setTimeout(() => {
        lastGameStateUpdateRef.current = null;
      }, 1000);
    }
  }, [gameCode]);

  return { updateGameState };
};

