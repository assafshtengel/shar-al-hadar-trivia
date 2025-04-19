
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useGameData = (gameCode: string | null) => {
  const [gameData, setGameData] = useState<any>(null);
  const [gameStatus, setGameStatus] = useState<string>('waiting');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!gameCode) {
      setIsLoading(false);
      return;
    }

    const fetchGameData = async () => {
      try {
        const { data, error } = await supabase
          .from('game_state')
          .select('*')
          .eq('game_code', gameCode)
          .single();

        if (error) throw error;

        setGameData({
          totalRounds: data.total_rounds || 5,
          songBank: data.song_bank || 'default',
        });
        setGameStatus(data.game_phase || 'waiting');
        setCurrentRound(data.current_round || 1);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching game data:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    fetchGameData();

    // Subscribe to game state changes
    const gameStateSubscription = supabase
      .channel(`game-state-${gameCode}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'game_state',
          filter: `game_code=eq.${gameCode}`
        }, 
        (payload) => {
          if (payload.new) {
            setGameStatus(payload.new.game_phase || 'waiting');
            setCurrentRound(payload.new.current_round || 1);
          }
        })
      .subscribe();

    return () => {
      gameStateSubscription.unsubscribe();
    };
  }, [gameCode]);

  return { gameData, gameStatus, currentRound, isLoading, error };
};
