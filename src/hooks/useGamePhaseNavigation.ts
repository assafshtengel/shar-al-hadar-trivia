
import { useEffect, useState, useCallback, useRef } from 'react';
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
  const lastPhaseRef = useRef<GamePhase | null>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  const handleGamePhaseNavigation = useCallback(() => {
    if (!gamePhase) return;
    
    const currentPath = window.location.pathname;
    console.log(`Navigation check: phase=${gamePhase}, path=${currentPath}, isHost=${isHost}, lastPhase=${lastPhaseRef.current}`);

    // Skip navigation if we're already redirecting
    if (isRedirecting) {
      console.log('Already redirecting, skipping navigation logic');
      return;
    }

    // Clear any existing navigation timeouts
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }

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
          navigationTimeoutRef.current = setTimeout(() => {
            navigate('/gameplay');
            navigationTimeoutRef.current = null;
          }, 100); // Small delay to prevent navigation race conditions
        }
        break;
        
      case 'end':
        if (!isHost && !isRedirecting) {
          console.log('Processing game end phase for player');
          setIsRedirecting(true);
          
          // We no longer handle immediate navigation here
          // That's now managed by the GameEndOverlay component
          // This prevents race conditions between different navigation mechanisms
          
          toast('המשחק הסתיים', {
            description: 'המשחק הסתיים על ידי המארח',
          });
        }
        break;
    }
    
    // Update the last phase we saw
    lastPhaseRef.current = gamePhase;
    
  }, [gamePhase, isHost, clearGameData, navigate, isRedirecting]);

  useEffect(() => {
    if (gamePhase) {
      handleGamePhaseNavigation();
    }
  }, [gamePhase, handleGamePhaseNavigation]);

  return { isRedirecting };
};
