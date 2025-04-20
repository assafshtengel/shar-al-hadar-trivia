
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/contexts/GameStateContext';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import AppButton from './AppButton';

interface GameEndOverlayProps {
  isVisible: boolean;
  isHost: boolean;
}

const GameEndOverlay: React.FC<GameEndOverlayProps> = ({ isVisible, isHost }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const navigate = useNavigate();
  const { clearGameData } = useGameState();
  const lastVisibilityChange = useRef<number>(Date.now());
  const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityChangesRef = useRef<number>(0);
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
      }
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    // Only process visibility changes if there's a significant gap (0.75 seconds)
    // This prevents overlay flashing when quick state changes happen
    const currentTime = Date.now();
    
    if (isVisible !== showOverlay) {
      visibilityChangesRef.current += 1;
      console.log(`Game end visibility changed to ${isVisible}, change #${visibilityChangesRef.current}`);
    }
    
    // Require more time between rapid changes to stabilize
    const requiredInterval = 750; 
    
    if (currentTime - lastVisibilityChange.current < requiredInterval) {
      console.log(`Ignoring rapid game end state change (${currentTime - lastVisibilityChange.current}ms since last change)`);
      return;
    }
    
    lastVisibilityChange.current = currentTime;
    
    // Clear any existing timers
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = null;
    }
    
    // Add a delay before showing the overlay to prevent flashes when joining
    // and to allow time for other state updates to be processed
    if (isVisible) {
      console.log('Game end detected, scheduling overlay display with delay');
      overlayTimerRef.current = setTimeout(() => {
        console.log('Displaying game end overlay');
        setShowOverlay(true);
        overlayTimerRef.current = null;
      }, 1000); // Longer delay to ensure all state updates are processed
    } else {
      console.log('Game end state cleared');
      setShowOverlay(false);
    }
  }, [isVisible]);
  
  useEffect(() => {
    // The overlay should only be visible for 4 seconds before redirecting
    if (showOverlay) {
      // Clear any existing redirect timer
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
      
      console.log('Overlay visible, scheduling redirect with delay');
      redirectTimerRef.current = setTimeout(() => {
        console.log('Auto-redirecting to home and clearing game data');
        handleCloseOverlay();
        redirectTimerRef.current = null;
      }, 4000); // Changed from 8000 to 4000 (4 seconds)
    }
    
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [showOverlay]);

  const handleCloseOverlay = () => {
    console.log('Closing overlay, redirecting to home and clearing game data');
    toast('המשחק הסתיים', {
      description: 'חוזר לדף הבית',
    });
    clearGameData();
    navigate('/');
    setShowOverlay(false);
  };
  
  // Make sure to display it for all players, not just host or top players
  if (!showOverlay) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-white p-6 rounded-lg shadow-lg text-center max-w-md mx-auto animate-scale-in">
        <button 
          onClick={handleCloseOverlay}
          className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="סגור"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-bold text-primary mb-4">המשחק הסתיים</h2>
        <p className="text-lg text-gray-700 mb-4">
          המשחק הסתיים. תחזרו לדף הבית להתחיל משחק חדש
        </p>
        <div className="text-sm text-gray-500 mb-3">
          מועבר לדף הבית באופן אוטומטי...
        </div>
        
        <AppButton 
          variant="primary" 
          size="sm" 
          onClick={handleCloseOverlay}
        >
          סגור וחזור לדף הבית
        </AppButton>
      </div>
    </div>
  );
};

export default GameEndOverlay;
