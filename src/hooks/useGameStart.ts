
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { GameSettings } from '@/contexts/GameStateContext';

interface UseGameStartParams {
  gameCode: string;
  players: any[];
  hostJoined: boolean;
  gameSettings?: GameSettings;
}

export const useGameStart = ({ 
  gameCode, 
  players, 
  hostJoined,
  gameSettings
}: UseGameStartParams) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = async () => {
    if (players.length === 0) {
      toast({
        title: "אין שחקנים",
        description: "יש להמתין שלפחות שחקן אחד יצטרף למשחק",
        variant: "destructive"
      });
      return;
    }

    if (!hostJoined) {
      toast({
        title: "המנחה לא הצטרף",
        description: "עליך להצטרף למשחק כמנחה לפני שאפשר להתחיל",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('game_state')
      .update({ 
        game_phase: 'playing',
        host_ready: true,
        score_limit: gameSettings?.scoreLimit || null,
        game_duration: gameSettings?.gameDuration || null
      })
      .eq('game_code', gameCode);

    if (error) {
      console.error('Error updating game state:', error);
      toast({
        title: "שגיאה בהתחלת המשחק",
        description: "אירעה שגיאה בהתחלת המשחק, נסה שוב",
        variant: "destructive"
      });
      return;
    }

    setGameStarted(true);
    toast({
      title: "המשחק התחיל!",
      description: gameSettings?.scoreLimit 
        ? `המשחק יסתיים כאשר שחקן יגיע ל-${gameSettings.scoreLimit} נקודות` 
        : gameSettings?.gameDuration
        ? `המשחק יסתיים לאחר ${gameSettings.gameDuration} דקות` 
        : "כעת אתה יכול להשמיע שירים"
    });

    navigate('/gameplay');
  };

  return { gameStarted, startGame };
};
