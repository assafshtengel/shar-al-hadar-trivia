
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type GamePhase = 'waiting' | 'playing' | 'answering' | 'results' | 'end';

interface UseGamePhaseNavigationProps {
  gamePhase: GamePhase | null;
  isHost: boolean;
  clearGameData: () => void;
}

export const useGamePhaseNavigation = ({ 
  gamePhase, 
  isHost, 
  clearGameData 
}: UseGamePhaseNavigationProps) => {
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  useEffect(() => {
    if (!gamePhase) return;
    
    const handleGamePhaseNavigation = () => {
      const currentPath = window.location.pathname;

      switch (gamePhase) {
        case 'waiting':
          // Only navigate to host-setup if user is not already in a gameplay session
          if (isHost && currentPath !== '/host-setup' && currentPath !== '/gameplay') {
            navigate('/host-setup');
          } else if (!isHost && currentPath !== '/waiting-room' && currentPath !== '/gameplay') {
            navigate('/waiting-room');
          }
          break;
        case 'playing':
        case 'answering':
        case 'results':
          // Make sure players stay in the gameplay page
          if (currentPath !== '/gameplay') {
            navigate('/gameplay');
          }
          break;
        case 'end':
          // הניווט לדף הבית עכשיו מתבצע ב-GameEndOverlay
          if (!isHost && !isRedirecting) {
            console.log('Processing game end phase for player');
            setIsRedirecting(true);
            toast('המשחק הסתיים', {
              description: 'המשחק הסתיים על ידי המארח',
            });
            
            // שינוי: לא צריך לנווט כאן, הניווט יתבצע ב-GameEndOverlay
          }
          break;
      }
    };

    handleGamePhaseNavigation();
  }, [gamePhase, isHost, clearGameData, navigate, isRedirecting]);

  return { isRedirecting };
};
