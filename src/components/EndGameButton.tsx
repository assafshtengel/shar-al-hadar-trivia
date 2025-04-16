
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { useGameState } from '@/contexts/GameStateContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';

const EndGameButton: React.FC = () => {
  const { gameCode, isHost, clearGameData } = useGameState();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  if (!isHost) return null;

  const handleEndGame = async () => {
    if (!gameCode) return;
    
    setIsLoading(true);
    
    try {
      // First update game_state to "end" to notify all players
      const { error: stateError } = await supabase
        .from('game_state')
        .update({ game_phase: 'end' })
        .eq('game_code', gameCode);
        
      if (stateError) {
        console.error('Error updating game state:', stateError);
        toast('שגיאה בסיום המשחק', {
          description: 'אירעה שגיאה בעדכון מצב המשחק',
        });
        return;
      }
      
      // Wait a moment for all clients to receive the end notification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Delete all players for this game
      const { error: playersError } = await supabase
        .from('players')
        .delete()
        .eq('game_code', gameCode);
        
      if (playersError) {
        console.error('Error deleting players:', playersError);
      }
      
      // Delete the game state
      const { error: gameStateError } = await supabase
        .from('game_state')
        .delete()
        .eq('game_code', gameCode);
        
      if (gameStateError) {
        console.error('Error deleting game state:', gameStateError);
      }
      
      // Clear local game data
      clearGameData();
      
      // Navigate back to home
      navigate('/');
      
      toast('המשחק הסתיים', {
        description: 'כל השחקנים יחזרו למסך הבית',
      });
    } catch (error) {
      console.error('Error ending game:', error);
      toast('שגיאה בסיום המשחק', {
        description: 'אירעה שגיאה לא צפויה',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-white/80 hover:bg-white text-destructive hover:text-destructive border-destructive text-sm"
        >
          <X className="h-4 w-4 mr-1" />
          סיים משחק
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>האם אתה בטוח שברצונך לסיים את המשחק?</AlertDialogTitle>
          <AlertDialogDescription>
            פעולה זו תסיים את המשחק עבור כל השחקנים ותמחק את כל הנתונים הקשורים למשחק זה.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleEndGame}
            className="bg-destructive hover:bg-destructive/90"
            disabled={isLoading}
          >
            {isLoading ? 'מסיים משחק...' : 'כן, סיים משחק'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EndGameButton;
