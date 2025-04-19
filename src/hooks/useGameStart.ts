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
      
      // Prepare update data with essential game state fields
      const updateData: Record<string, any> = { 
        game_phase: 'playing',
        host_ready: true,
      };
      
      // Add score limit if set (make sure it's a number)
      if (gameSettings?.scoreLimit) {
        const scoreLimitValue = Number(gameSettings.scoreLimit);
        if (!isNaN(scoreLimitValue)) {
          updateData.score_limit = scoreLimitValue;
          console.log(`Setting score limit to ${scoreLimitValue}`);
        } else {
          console.warn('Invalid score limit value, ignoring:', gameSettings.scoreLimit);
        }
      }
      
      // Add time limit if set (make sure it's a number)
      if (gameSettings?.gameDuration) {
        const durationValue = Number(gameSettings.gameDuration);
        if (!isNaN(durationValue)) {
          updateData.game_duration = durationValue;
          console.log(`Setting game duration to ${durationValue} minutes`);
        } else {
          console.warn('Invalid game duration value, ignoring:', gameSettings.gameDuration);
        }
      }
      
      console.log('Sending update to database:', updateData);

      // First check if the game_state record exists
      const { data: existingGameState, error: checkError } = await supabase
        .from('game_state')
        .select('*')
        .eq('game_code', gameCode)
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking game state:', checkError);
        sonnerToast('שגיאה בבדיקת מצב המשחק', {
          description: `אירעה שגיאה בבדיקת מצב המשחק: ${checkError.message}`,
          position: 'top-center',
        });
        setIsStarting(false);
        return;
      }
      
      let updateResult;
      
      if (existingGameState) {
        // Update existing game state
        console.log('Updating existing game state:', existingGameState);
        updateResult = await supabase
          .from('game_state')
          .update(updateData)
          .eq('game_code', gameCode);
      } else {
        // Insert new game state if it doesn't exist
        // Make sure to include all required fields for a new record
        console.log('Creating new game state record');
        updateResult = await supabase
          .from('game_state')
          .insert({
            ...updateData,
            game_code: gameCode,
            current_round: 1,
            game_mode: 'local' // Set default game mode
          });
      }
      
      if (updateResult.error) {
        console.error('Error updating/creating game state:', updateResult.error);
        sonnerToast('שגיאה בהתחלת המשחק', {
          description: `אירעה שגיאה בהתחלת המשחק: ${updateResult.error.message}`,
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

      // Navigate to gameplay
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
