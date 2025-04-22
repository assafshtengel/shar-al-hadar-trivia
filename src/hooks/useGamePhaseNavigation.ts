import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { GamePhase } from '@/contexts/GameStateContext';

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
  const gamePhaseRef = useRef<GamePhase | null>(null);
  const isHostRef = useRef<boolean>(isHost);
  
  useEffect(() => {
    gamePhaseRef.current = gamePhase;
    isHostRef.current = isHost;
  }, [gamePhase, isHost]);

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
    };
  }, []);

  const handleGamePhaseNavigation = useCallback(() => {
    if (!gamePhase) return;
    
    const currentPath = window.location.pathname;
    console.log(`Navigation check: phase=${gamePhase}, path=${currentPath}, isHost=${isHost}, lastPhase=${lastPhaseRef.current}`);

    if (isRedirecting) {
      console.log('Already redirecting, skipping navigation logic');
      return;
    }

    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }

    if (lastPhaseRef.current === gamePhase && currentPath === '/gameplay' && 
        (gamePhase === 'playing' || gamePhase === 'answering' || gamePhase === 'results')) {
      console.log(`Skipping duplicate navigation for phase ${gamePhase}`);
      return;
    }

    switch (gamePhase) {
      case 'waiting':
        if (isHost && currentPath !== '/host-setup' && currentPath !== '/gameplay') {
          console.log('Navigating host to setup screen');
          navigationTimeoutRef.current = setTimeout(() => {
            navigate('/host-setup');
            navigationTimeoutRef.current = null;
          }, 100);
        } else if (!isHost && currentPath !== '/waiting-room' && currentPath !== '/gameplay') {
          console.log('Navigating player to waiting room');
          navigationTimeoutRef.current = setTimeout(() => {
            navigate('/waiting-room');
            navigationTimeoutRef.current = null;
          }, 100);
        }
        break;
        
      case 'playing':
      case 'answering':
      case 'results':
      case 'end':
        if (currentPath !== '/gameplay') {
          console.log(`Navigating to gameplay screen for game phase: ${gamePhase}`);
          setIsRedirecting(true);
          navigationTimeoutRef.current = setTimeout(() => {
            navigate('/gameplay');
            setIsRedirecting(false);
            navigationTimeoutRef.current = null;
          }, 100);
        }
        break;
    }
    
    lastPhaseRef.current = gamePhase;
  }, [gamePhase, isHost, navigate, isRedirecting]);

  useEffect(() => {
    if (gamePhase && gamePhase !== lastPhaseRef.current) {
      console.log(`Game phase changed from ${lastPhaseRef.current} to ${gamePhase}, handling navigation`);
      handleGamePhaseNavigation();
    }
  }, [gamePhase, handleGamePhaseNavigation]);

  return { isRedirecting };
};
