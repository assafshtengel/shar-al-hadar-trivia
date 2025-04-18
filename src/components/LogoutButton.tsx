
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
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
import { Button } from "@/components/ui/button";
import { useGameState } from '@/contexts/GameStateContext';

const LogoutButton = () => {
  const navigate = useNavigate();
  const { clearGameData } = useGameState();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    clearGameData();
    navigate('/');
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="absolute top-4 left-4 hover:bg-red-100"
        >
          <LogOut className="h-5 w-5 text-red-600" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>יציאה מהמשחק</AlertDialogTitle>
          <AlertDialogDescription>
            האם אתה בטוח שברצונך לצאת מהמשחק? פעולה זו תמחק את פרטי המשחק מהמכשיר שלך.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse sm:justify-start">
          <AlertDialogCancel className="sm:mr-3">ביטול</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700"
          >
            יציאה מהמשחק
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LogoutButton;
