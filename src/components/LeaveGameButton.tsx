
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import { useGameState } from '@/contexts/GameStateContext';

// Adding type definition for props
interface LeaveGameButtonProps {
  gameCode: string;
}

const LeaveGameButton: React.FC<LeaveGameButtonProps> = ({ gameCode }) => {
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
      // Remove player from the game
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('game_code', gameCode)
        .eq('name', playerName);
        
      if (error) {
        throw error;
      }

      // Clear local game data
      clearGameData();
      
      // Navigate to home page
      navigate('/');
      
      toast({
        title: "עזבת את המשחק",
        description: "עזבת את המשחק בהצלחה"
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
          <AlertDialogTitle>האם אתה בטוח שברצונך לעזוב את המשחק?</AlertDialogTitle>
          <AlertDialogDescription>
            פעולה זו תוציא אותך מהמשחק ותמחק את השחקן שלך מהשרת. לא ניתן לבטל פעולה זו.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction onClick={handleLeaveGame}>עזוב משחק</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LeaveGameButton;
