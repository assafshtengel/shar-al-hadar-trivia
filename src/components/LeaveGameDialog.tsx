
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useGameState } from '@/contexts/GameStateContext';

interface LeaveGameDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const LeaveGameDialog = ({ isOpen, onClose }: LeaveGameDialogProps) => {
  const navigate = useNavigate();
  const { clearGameData } = useGameState();

  const handleLeaveGame = () => {
    clearGameData();
    onClose();
    navigate('/');
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
