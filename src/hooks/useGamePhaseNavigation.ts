
import { useEffect, useState, useRef, useCallback } from 'react';
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
  const lastNavigatedPhaseRef = useRef<GamePhase | null>(null);
  const navigationInProgressRef = useRef<boolean>(false);

  const handleNavigation = useCallback((phase: GamePhase) => {
    if (navigationInProgressRef.current) return;
    navigationInProgressRef.current = true;
    
    try {
      const currentPath = window.location.pathname;
      console.log(`Navigation for phase=${phase}, path=${currentPath}, isHost=${isHost}, lastNavigated=${lastNavigatedPhaseRef.current}`);

      switch (phase) {
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
            console.log('Navigating to gameplay screen for game phase:', phase);
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
          }
          break;
      }
      
      // Update last navigated phase
      lastNavigatedPhaseRef.current = phase;
    } finally {
      // Allow navigation again after a delay
      setTimeout(() => {
        navigationInProgressRef.current = false;
      }, 300);
    }
  }, [isHost, navigate, isRedirecting]);

  useEffect(() => {
    if (!gamePhase) return;

    // Prevent unnecessary navigation if phase hasn't changed
    if (gamePhase === lastNavigatedPhaseRef.current) {
      console.log(`Skipping navigation - already at phase ${gamePhase}`);
      return;
    }
    
    console.log(`Game phase changed to: ${gamePhase}`);
    handleNavigation(gamePhase);
  }, [gamePhase, handleNavigation]);

  return { isRedirecting };
};
