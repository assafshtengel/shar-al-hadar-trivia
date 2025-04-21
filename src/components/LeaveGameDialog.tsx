
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useGameState } from '@/contexts/GameStateContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LeaveGameDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const LeaveGameDialog = ({ isOpen, onClose }: LeaveGameDialogProps) => {
  const navigate = useNavigate();
  const { clearGameData, gameCode, isHost } = useGameState();

  const handleLeaveGame = async () => {
    console.log('Leave game dialog: Clearing game data and navigating to home page');
    
    // If the player is the host, reset player scores when leaving
    if (isHost && gameCode) {
      try {
        console.log('Host is leaving - resetting player scores');
        const { error } = await supabase
          .from('players')
          .update({ score: 0, hasAnswered: false, isReady: false })
          .eq('game_code', gameCode);
          
        if (error) {
          console.error('Error resetting player scores when leaving:', error);
        } else {
          console.log('Successfully reset all player scores when leaving game');
        }
      } catch (err) {
        console.error('Exception when resetting scores on leave:', err);
      }
    }
    
    clearGameData();
    onClose();
    navigate('/');
    
    toast('עזבת את המשחק', {
      description: 'חזרת לדף הבית בהצלחה',
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>יציאה מהמשחק</AlertDialogTitle>
          <AlertDialogDescription>
            האם אתה בטוח שברצונך לצאת מהמשחק?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:space-x-reverse">
          <Button onClick={handleLeaveGame} variant="destructive">
            כן
          </Button>
          <AlertDialogCancel>לא</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LeaveGameDialog;
