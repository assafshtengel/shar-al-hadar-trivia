
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Player, SupabasePlayer } from '@/types/game';

export const useGamePlayPlayers = (gameCode: string | null, playerName: string | null) => {
  const { toast } = useToast();
  const [players, setPlayers] = useState<SupabasePlayer[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>({
    name: playerName || "שחקן נוכחי",
    score: 0,
    skipsLeft: 3,
    hasAnswered: false,
    isReady: false,
    pendingAnswer: null,
    pointsAwarded: false
  });

  useEffect(() => {
    if (!gameCode) return;
    
    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('game_code', gameCode)
        .order('score', { ascending: false });

      if (error) {
        console.error('Error fetching players:', error);
        toast({
          title: "שגיאה בטעינת השחקנים",
          description: "אירעה שגיאה בטעינת רשימת השחקנים",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        setPlayers(data as SupabasePlayer[]);
        if (playerName) {
          const currentPlayerData = data.find(p => p.name === playerName);
          if (currentPlayerData) {
            setCurrentPlayer(prev => ({
              ...prev,
              name: currentPlayerData.name,
              score: currentPlayerData.score || 0,
              hasAnswered: currentPlayerData.hasAnswered || false,
              isReady: currentPlayerData.isReady || false,
              lastAnswerCorrect: currentPlayerData.lastanswercorrect || false
            }));
          }
        }
      }
    };

    fetchPlayers();

    const channel = supabase.channel('players-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `game_code=eq.${gameCode}`
      }, payload => {
        console.log('Players table changed:', payload);
        fetchPlayers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameCode, toast, playerName]);

  return { players, setPlayers, currentPlayer, setCurrentPlayer };
};
