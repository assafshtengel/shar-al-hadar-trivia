import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import { useGameState } from '@/contexts/GameStateContext';

// הוספת הגדרת הטיפוס עבור הפרופס של הקומפוננטה
interface EndGameButtonProps {
  gameCode: string | null;
}
const EndGameButton: React.FC<EndGameButtonProps> = ({
  gameCode
}) => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    clearGameData
  } = useGameState();
  const handleEndGame = async () => {
    if (!gameCode) {
      toast({
        title: "שגיאה",
        description: "קוד משחק חסר, לא ניתן לסיים את המשחק",
        variant: "destructive"
      });
      return;
    }
    try {
      // עדכון מצב המשחק ל-'end'
      const {
        error: stateError
      } = await supabase.from('game_state').update({
        game_phase: 'end'
      }).eq('game_code', gameCode);
      if (stateError) {
        throw stateError;
      }

      // המתנה קצרה כדי לאפשר לשחקנים לקבל את העדכון
      setTimeout(async () => {
        try {
          // מחיקת נתוני המשחק מהדאטאבייס
          const {
            error: playersError
          } = await supabase.from('players').delete().eq('game_code', gameCode);
          if (playersError) {
            console.error('Error deleting players:', playersError);
          }
          const {
            error: gameStateError
          } = await supabase.from('game_state').delete().eq('game_code', gameCode);
          if (gameStateError) {
            console.error('Error deleting game state:', gameStateError);
          }

          // ניקוי נתוני המשחק מהמארח ומעבר לדף הבית
          clearGameData();
          navigate('/');
        } catch (deleteError) {
          console.error('Error during game deletion:', deleteError);
        }
      }, 3000); // המתנה של 3 שניות לפני מחיקת הנתונים

      toast({
        title: "המשחק הסתיים",
        description: "המשחק הסתיים בהצלחה"
      });
    } catch (error) {
      console.error('Error ending game:', error);
      toast({
        title: "שגיאה בסיום המשחק",
        description: "אירעה שגיאה בסיום המשחק",
        variant: "destructive"
      });
    }
  };
  return <AlertDialog>
      <AlertDialogTrigger asChild>
        
      </AlertDialogTrigger>
      
    </AlertDialog>;
};
export default EndGameButton;