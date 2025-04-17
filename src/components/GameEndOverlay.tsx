
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MusicIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface GameEndOverlayProps {
  isVisible: boolean;
  isHost: boolean;
}

const GameEndOverlay: React.FC<GameEndOverlayProps> = ({ isVisible, isHost }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // If the overlay is visible for a non-host and the player hasn't navigated away,
    // automatically redirect to the home page after 5 seconds
    let redirectTimer: NodeJS.Timeout;
    
    if (isVisible && !isHost) {
      redirectTimer = setTimeout(() => {
        navigate('/');
      }, 5000);
    }
    
    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [isVisible, isHost, navigate]);

  if (!isVisible || isHost) return null;

  return (
    <Sheet open={isVisible} onOpenChange={() => {}}>
      <SheetContent className="max-w-full w-full h-full flex items-center justify-center bg-primary/95" side="bottom">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-primary mb-4">המשחק הסתיים</h2>
          <p className="text-gray-700 mb-6">המשחק הסתיים על ידי המארח. תודה על השתתפותך!</p>
          <div className="flex justify-center mb-3">
            <MusicIcon className="h-12 w-12 text-primary" />
          </div>
          <Button onClick={() => navigate('/')} className="w-full">
            חזרה לדף הבית
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            תועבר אוטומטית לדף הבית בעוד מספר שניות...
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default GameEndOverlay;
