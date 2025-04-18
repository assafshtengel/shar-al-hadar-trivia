
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
  const initializingRef = useRef<boolean>(true);
  const gameCodeRef = useRef<string | null>(null);
  
  useEffect(() => {
    gameCodeRef.current = gameCode;
  }, [gameCode]);
  
  useEffect(() => {
    if (!gameCode) return;

    console.log("Setting up game state monitoring for code:", gameCode);
    
    if (isSubscribingRef.current) {
      console.log("Already subscribing to game state, skipping");
      return;
    }
    
    isSubscribingRef.current = true;

    const checkGameState = async () => {
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
        } else if (data && data.game_phase === 'end' && isHost) {
          // Reset round and prepare for a new game
          console.log("Resetting game state for a new game");
          const { error: resetError } = await supabase
            .from('game_state')
            .update({
              game_phase: 'waiting',
              current_round: 1,
              host_ready: false
            })
            .eq('game_code', gameCode);
          
          if (resetError) {
            console.error('Error resetting game state:', resetError);
          }
          
          // We should also reset all player scores here for a new game
          const { error: resetScoreError } = await supabase
            .from('players')
            .update({ score: 0, hasAnswered: false, isReady: false })
            .eq('game_code', gameCode);
          
          if (resetScoreError) {
            console.error('Error resetting player scores:', resetScoreError);
          } else {
            console.log('All player scores reset for new game');
          }
        }
      } catch (err) {
        console.error("Exception in checkGameState:", err);
      }
    };

    const cleanup = () => {
      if (channelRef.current) {
        console.log('Removing existing game state channel before creating a new one');
        try {
          supabase.removeChannel(channelRef.current);
        } catch (err) {
          console.error("Error removing channel:", err);
        }
        channelRef.current = null;
      }
    };

    cleanup();
    checkGameState();

    const channelName = `game-state-changes-${gameCode}`;
    
    try {
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
              
              // Always process the update regardless of whether we've seen this phase before
              // This ensures that all players transition to the correct state
              console.log(`Game phase update: ${newPhase}, isHost: ${isHost}, last phase: ${lastGamePhaseRef.current}`);
              
              lastGamePhaseRef.current = newPhase;
              phaseUpdateTimeRef.current = currentTime;
              
              // Always set the game phase, regardless of the player rank
              setGamePhase(newPhase);
              
              if ('host_ready' in payload.new) {
                setHostReady(!!payload.new.host_ready);
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
          
          if (status === 'SUBSCRIBED') {
            isSubscribingRef.current = false;
            
            fetchGameState();
          }
        });
    } catch (err) {
      console.error("Error setting up channel:", err);
      isSubscribingRef.current = false;
    }

    const fetchGameState = async () => {
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
          
          lastGamePhaseRef.current = currentPhase;
          phaseUpdateTimeRef.current = Date.now();
          
          setGamePhase(currentPhase);
          
          if ('host_ready' in data) {
            setHostReady(!!data.host_ready);
          }
        }
      } catch (err) {
        console.error("Exception in fetchGameState:", err);
      } finally {
        initializingRef.current = false;
      }
    };

    return () => {
      console.log(`Cleaning up game state subscription for code: ${gameCodeRef.current}`);
      isSubscribingRef.current = false;
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (err) {
          console.error("Error removing channel in cleanup:", err);
        }
        channelRef.current = null;
      }
    };
  }, [gameCode, isHost, setGamePhase, setHostReady, clearGameData, navigate]);
};
