
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAnswerSubmission = (
  gameCode: string | null,
  playerName: string | null,
  roundNumber: number
) => {
  const [answer, setAnswer] = useState<string>('');
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();

  const submitAnswer = async () => {
    if (!gameCode || !playerName || !roundNumber || !answer.trim()) {
      toast({
        title: 'שגיאה',
        description: 'נא למלא תשובה לפני שליחה',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('player_answers').insert({
        game_code: gameCode,
        player_name: playerName,
        round_number: roundNumber,
        answer: answer.trim(),
        submitted_at: new Date().toISOString(),
      });

      if (error) throw error;

      setHasAnswered(true);
      toast({
        title: 'התשובה נשלחה',
        description: 'התשובה שלך נשלחה בהצלחה',
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: 'שגיאה בשליחת התשובה',
        description: 'אירעה שגיאה בשליחת התשובה. נסה שוב.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    answer,
    setAnswer,
    hasAnswered,
    submitAnswer,
    isSubmitting,
  };
};
