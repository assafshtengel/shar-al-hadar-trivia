
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { GameSettings } from '@/contexts/GameStateContext';
import { toast as sonnerToast } from 'sonner';

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
  const [isStarting, setIsStarting] = useState(false);

  const startGame = async () => {
    if (isStarting) return; // Prevent double-clicks
    
    setIsStarting(true);
    
    try {
      if (players.length === 0) {
        toast({
          title: "אין שחקנים",
          description: "יש להמתין שלפחות שחקן אחד יצטרף למשחק",
          variant: "destructive"
        });
        setIsStarting(false);
        return;
      }

      if (!hostJoined) {
        toast({
          title: "המנחה לא הצטרף",
          description: "עליך להצטרף למשחק כמנחה לפני שאפשר להתחיל",
          variant: "destructive"
        });
        setIsStarting(false);
        return;
      }

      console.log('Starting game with settings:', gameSettings);
      
      // Prepare update data
      const updateData = { 
        game_phase: 'playing',
        host_ready: true,
      };
      
      // Add score limit if set
      if (gameSettings?.scoreLimit) {
        updateData['score_limit'] = gameSettings.scoreLimit;
      }
      
      // Add time limit if set
      if (gameSettings?.gameDuration) {
        updateData['game_duration'] = gameSettings.gameDuration;
      }
      
      console.log('Sending update to database:', updateData);

      const { error } = await supabase
        .from('game_state')
        .update(updateData)
        .eq('game_code', gameCode);

      if (error) {
        console.error('Error updating game state:', error);
        sonnerToast('שגיאה בהתחלת המשחק', {
          description: `אירעה שגיאה בהתחלת המשחק: ${error.message}`,
          position: 'top-center',
        });
        setIsStarting(false);
        return;
      }

      setGameStarted(true);
      
      // Use sonner toast for better visibility
      sonnerToast('המשחק התחיל!', {
        description: gameSettings?.scoreLimit 
          ? `המשחק יסתיים כאשר שחקן יגיע ל-${gameSettings.scoreLimit} נקודות` 
          : gameSettings?.gameDuration
          ? `המשחק יסתיים לאחר ${gameSettings.gameDuration} דקות` 
          : "כעת אתה יכול להשמיע שירים",
        position: 'top-center',
      });

      navigate('/gameplay');
    } catch (err) {
      console.error('Unexpected error starting game:', err);
      sonnerToast('שגיאה בהתחלת המשחק', {
        description: 'אירעה שגיאה לא צפויה, נסה שוב',
        position: 'top-center',
      });
      setIsStarting(false);
    }
  };

  return { gameStarted, startGame, isStarting };
};
