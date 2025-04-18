
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface UseGameStartParams {
  gameCode: string;
  players: any[];
  hostJoined: boolean;
  gameMode: 'local' | 'remote';
}

export const useGameStart = ({ gameCode, players, hostJoined, gameMode }: UseGameStartParams) => {
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

    // First check if the game mode is set correctly
    try {
      console.log(`Starting game with mode: ${gameMode}`);
      
      // Make sure the game mode is set using the RPC function
      const { error: modeError } = await supabase.rpc('update_game_mode', {
        p_game_code: gameCode,
        p_game_mode: gameMode
      });

      if (modeError) {
        console.error('Error updating game mode:', modeError);
        toast({
          title: "שגיאה בהגדרת מצב המשחק",
          description: "אירעה שגיאה בהגדרת סוג המשחק, נסה שוב",
          variant: "destructive"
        });
        return;
      }
    } catch (err) {
      console.error('Exception updating game mode:', err);
      toast({
        title: "שגיאה בהגדרת מצב המשחק",
        description: "אירעה שגיאה בהגדרת סוג המשחק, נסה שוב",
        variant: "destructive"
      });
      return;
    }

    // Then update the game phase and host_ready status
    try {
      const { error } = await supabase
        .from('game_state')
        .update({ 
          game_phase: 'playing',
          host_ready: true
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
        description: `המשחק התחיל במצב ${gameMode === 'local' ? 'קרוב' : 'מרוחק'}`
      });

      navigate('/gameplay');
    } catch (err) {
      console.error('Exception updating game state:', err);
      toast({
        title: "שגיאה בהתחלת המשחק",
        description: "אירעה שגיאה בהתחלת המשחק, נסה שוב",
        variant: "destructive"
      });
    }
  };

  return { gameStarted, startGame };
};
