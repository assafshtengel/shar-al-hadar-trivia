
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
}

interface RoundResult {
  playerName: string;
  answer: string;
  isCorrect: boolean;
  pointsEarned: number;
}

export const useScoreCalculation = (
  gameCode: string | null,
  roundNumber: number,
  players: Player[]
) => {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const { toast } = useToast();

  const calculateScores = async () => {
    if (!gameCode || !roundNumber || players.length === 0) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לחשב ניקוד',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Fetch all answers for this round
      const { data: answers, error: answersError } = await supabase
        .from('player_answers')
        .select('*')
        .eq('game_code', gameCode)
        .eq('round_number', roundNumber);

      if (answersError) throw answersError;

      // Fetch the correct answer for this round
      const { data: roundData, error: roundError } = await supabase
        .from('game_rounds')
        .select('correct_answer')
        .eq('game_code', gameCode)
        .eq('round_number', roundNumber)
        .single();

      if (roundError) {
        // Simulate for testing
        const correctAnswer = "תשובה נכונה לדוגמה";
        
        // Create mock results
        const mockResults = players.map(player => {
          const playerAnswer = answers?.find(a => a.player_name === player.name)?.answer || '';
          const isCorrect = playerAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
          const pointsEarned = isCorrect ? 10 : 0;
          
          return {
            playerName: player.name,
            answer: playerAnswer || 'לא ענה',
            isCorrect,
            pointsEarned,
          };
        });
        
        setRoundResults(mockResults);
        setShowResults(true);
        return;
      }

      const correctAnswer = roundData.correct_answer;

      // Calculate results for each player
      const results = players.map(player => {
        const playerAnswer = answers?.find(a => a.player_name === player.name)?.answer || '';
        const isCorrect = playerAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
        const pointsEarned = isCorrect ? 10 : 0;
        
        return {
          playerName: player.name,
          answer: playerAnswer || 'לא ענה',
          isCorrect,
          pointsEarned,
        };
      });

      // Update player scores in the database
      for (const result of results) {
        if (result.pointsEarned > 0) {
          const player = players.find(p => p.name === result.playerName);
          if (player) {
            const newScore = player.score + result.pointsEarned;
            
            await supabase
              .from('players')
              .update({ score: newScore })
              .eq('name', result.playerName)
              .eq('game_code', gameCode);
            
            scores[result.playerName] = newScore;
          }
        }
      }

      setRoundResults(results);
      setShowResults(true);
      
      toast({
        title: 'הניקוד חושב',
        description: 'תוצאות הסיבוב מוצגות כעת',
      });
    } catch (error) {
      console.error('Error calculating scores:', error);
      toast({
        title: 'שגיאה בחישוב הניקוד',
        description: 'אירעה שגיאה בחישוב הניקוד. נסה שוב.',
        variant: 'destructive',
      });
    }
  };

  const hideResults = () => {
    setShowResults(false);
  };

  return {
    scores,
    roundResults,
    showResults,
    calculateScores,
    hideResults,
  };
};
