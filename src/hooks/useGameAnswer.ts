
import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Player {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
  hasAnswered: boolean;
  lastAnswerCorrect?: boolean;
  lastScore?: number;
}

export const useGameAnswer = (
  gameCode: string | null,
  playerName: string | null,
  round: number,
  timeRemaining: number,
  correctAnswer: string | null,
  currentPlayer: Player,
  setCurrentPlayer: (player: Player) => void,
  setPlayers: (players: Player[]) => void,
  setLeaderboard: (players: Player[]) => void,
  endGame: () => void
) => {
  const { toast } = useToast();
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleAnswerSubmit = useCallback(async (selectedAnswer: string | null) => {
    if (!gameCode || !playerName || isAnswerSubmitted) return;

    setIsAnswerSubmitted(true);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const isCorrect = selectedAnswer === correctAnswer;
    let score = isCorrect ? timeRemaining * 10 : 0;

    try {
      setCurrentPlayer(prev => ({
        ...prev,
        hasAnswered: true,
        lastAnswerCorrect: isCorrect,
        lastScore: score
      }));
      
      setPlayers(prevPlayers =>
        prevPlayers.map(p =>
          p.name === playerName ? { ...p, hasAnswered: true, lastAnswerCorrect: isCorrect, lastScore: score } : p
        )
      );
      
      setLeaderboard(prevLeaderboard =>
        prevLeaderboard.map(p =>
          p.name === playerName ? { ...p, hasAnswered: true, lastAnswerCorrect: isCorrect, lastScore: score } : p
        )
      );

      const { error } = await supabase
        .from('players')
        .update({ 
          hasAnswered: true,
          score: currentPlayer.score + score
        })
        .eq('game_code', gameCode)
        .eq('name', playerName);

      if (error) {
        console.error('Error updating player score:', error);
        toast({
          title: "שגיאה בשמירת הניקוד",
          description: "אירעה שגיאה בשמירת הניקוד, נסה שוב",
          variant: "destructive"
        });
        return;
      }

      return { isCorrect, score };
    } catch (err) {
      console.error('Exception when submitting answer:', err);
      toast({
        title: "שגיאה בשמירת הניקוד",
        description: "אירעה שגיאה בלתי צפויה, נסה שוב",
        variant: "destructive"
      });
      return null;
    }
  }, [gameCode, playerName, isAnswerSubmitted, timeRemaining, correctAnswer, currentPlayer, toast, setCurrentPlayer, setPlayers, setLeaderboard]);

  return {
    isAnswerSubmitted,
    setIsAnswerSubmitted,
    handleAnswerSubmit,
    timerRef
  };
};
