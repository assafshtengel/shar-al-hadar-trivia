
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '@/contexts/GameStateContext';
import { toast } from 'sonner';

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
    // Only process visibility changes if there's a significant gap (0.5 seconds)
    // This prevents overlay flashing when quick state changes happen
    const currentTime = Date.now();
    if (currentTime - lastVisibilityChange.current < 500) {
      console.log('Ignoring rapid game end state change');
      return;
    }
    
    lastVisibilityChange.current = currentTime;
    
    // Clear any existing timers
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = null;
    }
    
    // Add a small delay before showing the overlay to prevent flashes when joining
    // and to allow time for other state updates to be processed
    if (isVisible && !isHost) {
      console.log('Game end detected, scheduling overlay display');
      overlayTimerRef.current = setTimeout(() => {
        console.log('Displaying game end overlay');
        setShowOverlay(true);
        overlayTimerRef.current = null;
      }, 800); // Slightly longer delay to ensure all state updates are processed
    } else {
      console.log('Game end state cleared or host detected');
      setShowOverlay(false);
    }
  }, [isVisible, isHost]);
  
  useEffect(() => {
    // Clear any existing redirect timer
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    
    // Redirect to home and clear game data after showing the overlay
    if (showOverlay && !isHost) {
      console.log('Overlay visible, scheduling redirect');
      redirectTimerRef.current = setTimeout(() => {
        console.log('Redirecting to home and clearing game data');
        toast('המשחק הסתיים', {
          description: 'חוזר לדף הבית',
        });
        clearGameData();
        navigate('/');
        redirectTimerRef.current = null;
      }, 3000); // Give user a bit more time to see the message
    }
    
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [showOverlay, isHost, navigate, clearGameData]);
  
  if (!showOverlay || isHost) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md mx-auto animate-scale-in">
        <h2 className="text-2xl font-bold text-primary mb-4">המשחק הסתיים</h2>
        <p className="text-lg text-gray-700 mb-4">
          המשחק הסתיים. תחזרו לדף הבית להתחיל משחק חדש
        </p>
        <div className="text-sm text-gray-500">
          מועבר לדף הבית באופן אוטומטי...
        </div>
      </div>
    </div>
  );
};

export default GameEndOverlay;
