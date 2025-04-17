
import React from 'react';
import { ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';

// הוספת הגדרת הטיפוס עבור הפרופס של הקומפוננטה
interface EndGameButtonProps {
  gameCode: string | null;
}

const EndGameButton: React.FC<EndGameButtonProps> = ({ gameCode }) => {
  const { toast } = useToast();

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
      const { error: stateError } = await supabase
        .from('game_state')
        .update({ game_phase: 'end' })
        .eq('game_code', gameCode);

      if (stateError) {
        throw stateError;
      }

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

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="flex items-center gap-2">
          <X className="h-4 w-4" />
          סיים משחק
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>האם אתה בטוח שברצונך לסיים את המשחק?</AlertDialogTitle>
          <AlertDialogDescription>
            פעולה זו תסיים את המשחק לכל השחקנים. לא ניתן לבטל פעולה זו.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction onClick={handleEndGame}>סיים משחק</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EndGameButton;
