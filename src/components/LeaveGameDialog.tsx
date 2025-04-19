
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useGameState } from '@/contexts/GameStateContext';
import { toast } from 'sonner';

interface LeaveGameDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const LeaveGameDialog = ({ isOpen, onClose }: LeaveGameDialogProps) => {
  const navigate = useNavigate();
  const { clearGameData, gameCode } = useGameState();

  const handleLeaveGame = () => {
    console.log('Leave game dialog: Clearing game data and navigating to home page');
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
