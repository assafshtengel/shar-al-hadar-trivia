
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
  const gamePhaseRef = useRef<GamePhase | null>(null);
  const isHostRef = useRef<boolean>(isHost);
  
  // Update refs when dependencies change
  useEffect(() => {
    gamePhaseRef.current = gamePhase;
    isHostRef.current = isHost;
  }, [gamePhase, isHost]);

  // Clean up timers on unmount
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

    // Don't navigate if we just saw this phase (prevents double navigation)
    // IMPORTANT: Removed the condition that prevented phase transitions when on the gameplay page
    // This was causing the issue where players weren't seeing the leaderboard
    if (lastPhaseRef.current === gamePhase) {
      console.log(`Same phase as before ${gamePhase}, checking if navigation is needed`);
    }

    switch (gamePhase) {
      case 'waiting':
        // Only navigate if not already in gameplay or setup screens
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
        // Make sure ALL players stay in the gameplay page
        if (currentPath !== '/gameplay') {
          console.log(`Navigating to gameplay screen for game phase: ${gamePhase}`);
          setIsRedirecting(true);
          navigationTimeoutRef.current = setTimeout(() => {
            navigate('/gameplay');
            setIsRedirecting(false);
            navigationTimeoutRef.current = null;
          }, 100); // Small delay to prevent navigation race conditions
        }
        break;
        
      case 'end':
        // All players should still go to gameplay for the end screen
        if (currentPath !== '/gameplay') {
          console.log('Navigating to gameplay for end screen');
          setIsRedirecting(true);
          navigationTimeoutRef.current = setTimeout(() => {
            navigate('/gameplay');
            setIsRedirecting(false);
            navigationTimeoutRef.current = null;
          }, 100);
        }
        break;
    }
    
    // Update the last phase we saw
    lastPhaseRef.current = gamePhase;
    
  }, [gamePhase, isHost, navigate, isRedirecting]);

  // Watch for game phase changes and navigate accordingly
  useEffect(() => {
    if (gamePhase) {
      console.log(`Game phase changed to ${gamePhase}, handling navigation`);
      handleGamePhaseNavigation();
    }
  }, [gamePhase, handleGamePhaseNavigation]);

  return { isRedirecting };
};
