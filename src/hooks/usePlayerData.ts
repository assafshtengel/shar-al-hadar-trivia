
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
}

export const usePlayerData = (gameCode: string | null) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!gameCode) {
      setIsLoading(false);
      return;
    }

    const fetchPlayers = async () => {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .eq('game_code', gameCode);

        if (error) throw error;

        const formattedPlayers = data.map((player) => ({
          id: player.id,
          name: player.name,
          score: player.score || 0,
          isHost: player.is_host || false,
        }));

        setPlayers(formattedPlayers);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching players:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    fetchPlayers();

    // Subscribe to player changes
    const playersSubscription = supabase
      .channel(`players-${gameCode}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'players',
          filter: `game_code=eq.${gameCode}`
        }, 
        () => {
          fetchPlayers();
        })
      .subscribe();

    return () => {
      playersSubscription.unsubscribe();
    };
  }, [gameCode]);

  return { players, isLoading, error };
};
