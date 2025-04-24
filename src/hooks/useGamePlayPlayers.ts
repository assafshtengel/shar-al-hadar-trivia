
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Player, SupabasePlayer, PendingAnswerUpdate } from '@/types/game';

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

  const checkAllPlayersAnswered = useCallback(async () => {
    if (!gameCode) return false;
    const { data } = await supabase
      .from('players')
      .select('hasAnswered')
      .eq('game_code', gameCode);
    if (!data) return false;
    return data.every(player => player.hasAnswered === true);
  }, [gameCode]);

  const checkAllPlayersReady = useCallback(async () => {
    if (!gameCode) return false;
    const { data } = await supabase
      .from('players')
      .select('isReady')
      .eq('game_code', gameCode);
    if (!data) return false;
    return data.every(player => player.isReady === true);
  }, [gameCode]);

  const resetPlayersAnsweredStatus = async () => {
    if (!gameCode) return;
    const { error } = await supabase
      .from('players')
      .update({ hasAnswered: false })
      .eq('game_code', gameCode);
    if (error) {
      console.error('Error resetting players answered status:', error);
      toast({
        title: "שגיאה באיפוס סטטוס השחקנים",
        description: "אירעה שגיאה באיפוס סטטוס השחקנים",
        variant: "destructive"
      });
    }
  };

  const resetPlayersReadyStatus = async () => {
    if (!gameCode) return;
    const { error } = await supabase
      .from('players')
      .update({ isReady: false })
      .eq('game_code', gameCode);
    if (error) {
      console.error('Error resetting players ready status:', error);
      toast({
        title: "שגיאה באיפוס סטטוס מוכנות השחקנים",
        description: "אירעה שגיאה באיפוס סטטוס מוכנות השחקנים",
        variant: "destructive"
      });
    }
  };

  const resetAllPlayerScores = async () => {
    if (!gameCode) return;
    try {
      const { error } = await supabase
        .from('players')
        .update({ score: 0 })
        .eq('game_code', gameCode);
      if (error) {
        console.error('Error resetting player scores:', error);
        toast({
          title: "שגיאה באיפוס הניקוד",
          description: "אירעה שגיאה באיפוס ניקוד השחקנים",
          variant: "destructive"
        });
      } else {
        toast({
          title: "ניקוד אופס",
          description: "ניקוד כל השחקנים אופס בהצלחה"
        });
      }
    } catch (err) {
      console.error('Exception when resetting player scores:', err);
    }
  };

  const batchUpdatePlayerScores = async (updates: PendingAnswerUpdate[]) => {
    if (!gameCode || updates.length === 0) return;
    
    console.log('Batch updating player scores:', updates);
    try {
      for (const update of updates) {
        const { data: playerData, error: fetchError } = await supabase
          .from('players')
          .select('score, hasAnswered')
          .eq('game_code', gameCode)
          .eq('name', update.player_name)
          .maybeSingle();

        if (fetchError) {
          console.error(`Error fetching player ${update.player_name}:`, fetchError);
          continue;
        }

        if (!playerData) {
          console.error(`Player ${update.player_name} not found`);
          continue;
        }

        if (playerData.hasAnswered) {
          console.log(`Player ${update.player_name} has already answered this round. Skipping score update.`);
          continue;
        }

        const currentScore = playerData.score || 0;
        const newScore = currentScore + update.points;
        
        const { error: updateError } = await supabase
          .from('players')
          .update({
            score: newScore,
            hasAnswered: true
          })
          .eq('game_code', gameCode)
          .eq('name', update.player_name);

        if (updateError) {
          console.error(`Error updating player ${update.player_name}:`, updateError);
        } else {
          console.log(`Successfully updated player ${update.player_name} score to ${newScore}`);
        }
      }
    } catch (error) {
      console.error('Error in batchUpdatePlayerScores:', error);
      toast({
        title: "שגיאה בעדכון הניקוד",
        description: "אירעה שגיאה בעדכון הניקוד",
        variant: "destructive"
      });
    }
  };

  return {
    players,
    setPlayers,
    currentPlayer,
    setCurrentPlayer,
    checkAllPlayersAnswered,
    checkAllPlayersReady,
    resetPlayersAnsweredStatus,
    resetPlayersReadyStatus,
    resetAllPlayerScores,
    batchUpdatePlayerScores
  };
};
