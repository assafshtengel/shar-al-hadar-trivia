
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RoundData {
  songTitle: string;
  artist: string;
  songPreviewUrl: string;
  duration: number;
}

export const useGameRound = (gameCode: string | null, roundNumber: number) => {
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!gameCode || !roundNumber) {
      setIsLoading(false);
      return;
    }

    const fetchRoundData = async () => {
      try {
        const { data, error } = await supabase
          .from('game_rounds')
          .select('*')
          .eq('game_code', gameCode)
          .eq('round_number', roundNumber)
          .single();

        if (error) {
          // If no round data exists yet, create dummy data for testing
          if (error.code === 'PGRST116') {
            setRoundData({
              songTitle: 'שיר לדוגמה',
              artist: 'אמן לדוגמה',
              songPreviewUrl: 'https://example.com/preview.mp3',
              duration: 30,
            });
            setIsLoading(false);
            return;
          }
          throw error;
        }

        setRoundData({
          songTitle: data.song_title || '',
          artist: data.artist || '',
          songPreviewUrl: data.song_preview_url || '',
          duration: data.duration || 30,
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching round data:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    fetchRoundData();
  }, [gameCode, roundNumber]);

  return { roundData, isLoading, error };
};
