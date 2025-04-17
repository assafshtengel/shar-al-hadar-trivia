
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
      console.log(`Navigation check: phase=${gamePhase}, path=${currentPath}, isHost=${isHost}`);

      switch (gamePhase) {
        case 'waiting':
          // Only navigate if not already in gameplay or setup screens
          if (isHost && currentPath !== '/host-setup' && currentPath !== '/gameplay') {
            console.log('Navigating host to setup screen');
            navigate('/host-setup');
          } else if (!isHost && currentPath !== '/waiting-room' && currentPath !== '/gameplay') {
            console.log('Navigating player to waiting room');
            navigate('/waiting-room');
          }
          break;
        case 'playing':
        case 'answering':
        case 'results':
          // Make sure players stay in the gameplay page, but don't force navigation if already there
          if (currentPath !== '/gameplay') {
            console.log('Navigating to gameplay screen for game phase:', gamePhase);
            navigate('/gameplay');
          }
          break;
        case 'end':
          if (!isHost && !isRedirecting) {
            console.log('Processing game end phase for player');
            setIsRedirecting(true);
            toast('המשחק הסתיים', {
              description: 'המשחק הסתיים על ידי המארח',
            });
            
            // Game end navigation now handled by GameEndOverlay
          }
          break;
      }
    };

    handleGamePhaseNavigation();
  }, [gamePhase, isHost, clearGameData, navigate, isRedirecting]);

  return { isRedirecting };
};
