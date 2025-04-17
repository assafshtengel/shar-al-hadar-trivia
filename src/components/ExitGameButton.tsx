
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGameState } from '@/contexts/GameStateContext';

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
    <Button 
      variant="destructive" 
      onClick={handleExitGame}
      className={className}
      size="sm"
    >
      יציאה מהמשחק
      <LogOut className="mr-2 h-4 w-4" />
    </Button>
  );
};

export default ExitGameButton;
