
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
          if (currentPath !== '/waiting-room' && !isHost) {
            navigate('/waiting-room');
          } else if (isHost && currentPath !== '/host-setup') {
            navigate('/host-setup');
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
          if (!isHost && !isRedirecting) {
            setIsRedirecting(true);
            toast('המשחק הסתיים', {
              description: 'המשחק הסתיים על ידי המארח',
            });
            
            // Show message and redirect after delay
            const currentLocation = window.location.pathname;
            if (currentLocation !== '/') {
              const redirectTimer = setTimeout(() => {
                clearGameData();
                navigate('/');
                setIsRedirecting(false);
              }, 3000);
              
              return () => clearTimeout(redirectTimer);
            }
          }
          break;
      }
    };

    handleGamePhaseNavigation();
  }, [gamePhase, isHost, clearGameData, navigate, isRedirecting]);

  return { isRedirecting };
};
