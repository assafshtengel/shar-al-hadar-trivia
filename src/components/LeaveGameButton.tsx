
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import { useGameState } from '@/contexts/GameStateContext';

interface LeaveGameButtonProps {
  gameCode: string;
  isHost?: boolean;
}

const LeaveGameButton: React.FC<LeaveGameButtonProps> = ({ gameCode, isHost = false }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { clearGameData, playerName } = useGameState();
  
  const handleLeaveGame = async () => {
    if (!gameCode || !playerName) {
      toast({
        title: "שגיאה",
        description: "מידע חסר, לא ניתן לעזוב את המשחק",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isHost) {
        // אם זה המנחה, נעדכן קודם את מצב המשחק ל-'end'
        const { error: stateError } = await supabase
          .from('game_state')
          .update({ game_phase: 'end' })
          .eq('game_code', gameCode);

        if (stateError) {
          console.error('Error updating game state:', stateError);
          throw stateError;
        }

        // נמתין 2 שניות כדי לתת לשחקנים לקבל את העדכון על סיום המשחק
        setTimeout(async () => {
          try {
            // מחיקת נתוני כל השחקנים מהמשחק הזה
            const { error: playersError } = await supabase
              .from('players')
              .delete()
              .eq('game_code', gameCode);
            
            if (playersError) {
              console.error('Error deleting players:', playersError);
            }

            // מחיקת מצב המשחק
            const { error: gameStateError } = await supabase
              .from('game_state')
              .delete()
              .eq('game_code', gameCode);
            
            if (gameStateError) {
              console.error('Error deleting game state:', gameStateError);
            }

          } catch (deleteError) {
            console.error('Error during game cleanup:', deleteError);
          }
        }, 2000);

      } else {
        // אם זה שחקן רגיל, נמחק רק אותו מהמשחק
        const { error } = await supabase
          .from('players')
          .delete()
          .eq('game_code', gameCode)
          .eq('name', playerName);
          
        if (error) {
          throw error;
        }
      }

      // ניקוי נתוני המשחק המקומיים ומעבר לדף הבית
      clearGameData();
      navigate('/');
      
      toast({
        title: isHost ? "המשחק הסתיים" : "עזבת את המשחק",
        description: isHost ? 
          "המשחק הסתיים וכל הנתונים נמחקו" : 
          "עזבת את המשחק בהצלחה"
      });
    } catch (error) {
      console.error('Error leaving game:', error);
      toast({
        title: "שגיאה בעזיבת המשחק",
        description: "אירעה שגיאה בעזיבת המשחק",
        variant: "destructive"
      });
    }
  };
  
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          עזוב משחק
          <X className="mr-2" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isHost ? 
              "האם אתה בטוח שברצונך לסיים את המשחק?" : 
              "האם אתה בטוח שברצונך לעזוב את המשחק?"
            }
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isHost ? 
              "פעולה זו תסיים את המשחק לכל המשתתפים ותמחק את כל נתוני המשחק. לא ניתן לבטל פעולה זו." : 
              "פעולה זו תוציא אותך מהמשחק ותמחק את השחקן שלך מהשרת. לא ניתן לבטל פעולה זו."
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction onClick={handleLeaveGame}>
            {isHost ? "סיים משחק" : "עזוב משחק"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LeaveGameButton;
