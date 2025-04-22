import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GamePhase, GameSettings } from '@/contexts/GameStateContext';

interface UseGameStateSubscriptionProps {
  gameCode: string | null;
  isHost: boolean;
  setGamePhase: (phase: GamePhase | null) => void;
  setHostReady: (ready: boolean) => void;
  clearGameData: () => void;
  navigate: (path: string) => void;
  gameSettings?: GameSettings;
}

export const useGameStateSubscription = ({
  gameCode,
  isHost,
  setGamePhase,
  setHostReady,
  clearGameData,
  navigate,
  gameSettings
}: UseGameStateSubscriptionProps) => {
  const isSubscribingRef = useRef(false);
  const channelRef = useRef<any>(null);
  const lastGamePhaseRef = useRef<GamePhase | null>(null);
  const phaseUpdateTimeRef = useRef<number>(0);
  const initializingRef = useRef<boolean>(true);
  const gameCodeRef = useRef<string | null>(null);
  const gameStartTimeRef = useRef<number | null>(null);
  const checkScoreIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    gameCodeRef.current = gameCode;
  }, [gameCode]);
  
  useEffect(() => {
    if (!gameCode || !isHost || !gameSettings?.gameDuration) return;
    
    const setupGameDurationTimer = () => {
      if (lastGamePhaseRef.current === 'playing' && !gameStartTimeRef.current) {
        console.log(`Setting up game duration timer for ${gameSettings.gameDuration} minutes`);
        gameStartTimeRef.current = Date.now();
        
        const intervalId = setInterval(async () => {
          if (!gameStartTimeRef.current || !gameSettings.gameDuration) return;
          
          const currentTime = Date.now();
          const elapsedMinutes = (currentTime - gameStartTimeRef.current) / (1000 * 60);
          
          console.log(`Game time elapsed: ${elapsedMinutes.toFixed(2)} minutes of ${gameSettings.gameDuration} limit`);
          
          if (elapsedMinutes >= gameSettings.gameDuration) {
            console.log(`Game duration limit reached (${gameSettings.gameDuration} minutes). Ending game.`);
            
            clearInterval(intervalId);
            
            if (gameCode && isHost) {
              try {
                const { error } = await supabase
                  .from('game_state')
                  .update({ game_phase: 'end' })
                  .eq('game_code', gameCode);
                
                if (error) {
                  console.error('Error ending game due to time limit:', error);
                } else {
                  toast('הזמן נגמר!', {
                    description: `המשחק הסתיים לאחר ${gameSettings.gameDuration} דקות`,
                  });
                }
              } catch (err) {
                console.error('Exception ending game by time limit:', err);
              }
            }
          }
        }, 30000);
        
        checkScoreIntervalRef.current = intervalId;
      }
    };
    
    setupGameDurationTimer();
    
    return () => {
      if (checkScoreIntervalRef.current) {
        clearInterval(checkScoreIntervalRef.current);
        checkScoreIntervalRef.current = null;
      }
    };
  }, [gameCode, isHost, gameSettings, lastGamePhaseRef.current]);

  useEffect(() => {
    if (!gameCode || !isHost || !gameSettings?.scoreLimit) return;
    
    const checkScoreLimit = async () => {
      try {
        if (['playing', 'results', 'answering'].includes(lastGamePhaseRef.current || '')) {
          const { data, error } = await supabase
            .from('players')
            .select('name, score')
            .eq('game_code', gameCode)
            .order('score', { ascending: false });
          
          if (error) {
            console.error('Error checking player scores:', error);
            return;
          }
          
          if (data && data.length > 0) {
            const highestScore = data[0].score;
            console.log(`Checking score limit: Highest score is ${highestScore}, limit is ${gameSettings.scoreLimit}`);
            
            if (highestScore >= gameSettings.scoreLimit) {
              console.log(`Score limit reached! Player ${data[0].name} has reached ${highestScore} points.`);
              
              const { error: updateError } = await supabase
                .from('game_state')
                .update({ game_phase: 'end' })
                .eq('game_code', gameCode);
              
              if (updateError) {
                console.error('Error ending game due to score limit:', updateError);
              } else {
                toast('משחק הסתיים!', {
                  description: `השחקן ${data[0].name} הגיע ל-${highestScore} נקודות והשיג את מגבלת הניקוד`,
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('Exception in checkScoreLimit:', err);
      }
    };
    
    checkScoreLimit();
    const intervalId = setInterval(checkScoreLimit, 15000);
    checkScoreIntervalRef.current = intervalId;
    
    return () => {
      if (checkScoreIntervalRef.current) {
        clearInterval(checkScoreIntervalRef.current);
        checkScoreIntervalRef.current = null;
      }
    };
  }, [gameCode, isHost, gameSettings, lastGamePhaseRef.current]);
  
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
              
              if (
                lastGamePhaseRef.current === null || 
                lastGamePhaseRef.current !== newPhase ||
                (currentTime - phaseUpdateTimeRef.current) > 500
              ) {
                console.log(`Game phase update: ${newPhase}, isHost: ${isHost}, last phase: ${lastGamePhaseRef.current}`);
                
                lastGamePhaseRef.current = newPhase;
                phaseUpdateTimeRef.current = currentTime;
                
                if (newPhase === 'playing' && gameSettings?.gameDuration && isHost) {
                  gameStartTimeRef.current = Date.now();
                  console.log(`Game phase changed to playing, starting duration timer: ${gameSettings.gameDuration} minutes`);
                }
                
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
          
          if (currentPhase === 'playing' && gameSettings?.gameDuration && isHost) {
            gameStartTimeRef.current = Date.now();
            console.log(`Initial game phase is playing, starting duration timer: ${gameSettings.gameDuration} minutes`);
          }
          
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
      
      if (checkScoreIntervalRef.current) {
        clearInterval(checkScoreIntervalRef.current);
        checkScoreIntervalRef.current = null;
      }
    };
  }, [gameCode, isHost, setGamePhase, setHostReady, clearGameData, navigate, gameSettings]);
};
