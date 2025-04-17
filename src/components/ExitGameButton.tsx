
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGameState } from '@/contexts/GameStateContext';
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

interface ExitGameButtonProps {
  className?: string;
}

const ExitGameButton: React.FC<ExitGameButtonProps> = ({ className }) => {
  const navigate = useNavigate();
  const { clearGameData } = useGameState();

  const handleExitGame = () => {
    clearGameData();
    navigate('/');
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          className={className}
          size="sm"
        >
          יציאה מהמשחק
          <LogOut className="mr-2 h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>לצאת מהמשחק?</AlertDialogTitle>
          <AlertDialogDescription>
            האם אתה בטוח שברצונך לצאת מהמשחק? התוצאות שלך יישמרו, אך תצא מהמשחק הנוכחי.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction onClick={handleExitGame}>יציאה</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ExitGameButton;
