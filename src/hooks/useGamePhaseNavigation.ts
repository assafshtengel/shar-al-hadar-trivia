
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
    
    const handleGamePhaseNavigation = (phase: GamePhase, isHostReady: boolean, isInitial = false) => {
      const currentPath = window.location.pathname;

      switch (phase) {
        case 'waiting':
          if (currentPath !== '/waiting-room' && !isHost) {
            navigate('/waiting-room');
          } else if (isHost && currentPath !== '/host-setup' && isInitial) {
            navigate('/host-setup');
          }
          break;
        case 'playing':
        case 'answering':
        case 'results':
          // Only navigate to gameplay if host is ready or user is not the host
          if (!isHost || (isHost && isHostReady)) {
            if (currentPath !== '/gameplay') {
              navigate('/gameplay');
            }
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

    // Only include this in the dependency array to prevent endless loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePhase, isHost, clearGameData, navigate]);

  return { isRedirecting };
};

