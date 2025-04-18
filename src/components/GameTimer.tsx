
import React, { useState, useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

interface GameTimerProps {
  initialSeconds: number;
  isActive: boolean;
  onTimeout: () => void;
}

const GameTimer: React.FC<GameTimerProps> = ({
  initialSeconds,
  isActive,
  onTimeout
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());
  const timeoutTriggeredRef = useRef<boolean>(false);

  // Reset timer when props change
  useEffect(() => {
    if (isActive) {
      console.log(`Timer started with ${initialSeconds} seconds`);
      setTimeLeft(initialSeconds);
      startTimeRef.current = Date.now();
      lastTickTimeRef.current = Date.now();
      timeoutTriggeredRef.current = false;
    } else {
      if (timerRef.current) {
        console.log('Clearing timer due to isActive change');
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [initialSeconds, isActive]);

  // Handle timer logic
  useEffect(() => {
    if (isActive && !timerRef.current) {
      console.log('Starting game timer interval');

      // Start a new timer
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - lastTickTimeRef.current;
        lastTickTimeRef.current = now;
        
        setTimeLeft(prev => {
          // Calculate new time first
          const newTime = Math.max(prev - elapsed / 1000, 0);
          
          // Force immediate timeout at exactly 0.1 seconds or less
          if (newTime <= 0.1 && !timeoutTriggeredRef.current) {
            console.log(`Timer reached zero threshold (${newTime}s)! Calling onTimeout IMMEDIATELY`);
            timeoutTriggeredRef.current = true;
            
            if (timerRef.current) {
              console.log('Clearing timer interval before calling timeout handler');
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            
            // Execute onTimeout synchronously with no delays
            onTimeout();
            return 0;
          }
          return newTime;
        });
      }, 20); // Update even more frequently (20ms) for more precise timing
    }

    return () => {
      if (timerRef.current) {
        console.log('Cleaning up timer on effect cleanup');
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, onTimeout]);

  // Calculate percentage for progress bar
  const progressPercentage = timeLeft / initialSeconds * 100;
  const isAlmostTimeUp = timeLeft < initialSeconds * 0.3;

  return (
    <div className="flex items-center space-x-2">
      <div className="w-32 relative">
        <Progress value={progressPercentage} className={`h-3 ${isAlmostTimeUp ? 'bg-red-200' : 'bg-primary/20'}`} />
        <div 
          className={`absolute inset-0 h-3 rounded-full transition-all duration-100 ${
            isAlmostTimeUp ? 'bg-red-500' : 'bg-primary'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="flex items-center space-x-1">
        <Timer size={16} className={isAlmostTimeUp ? 'text-red-500 animate-pulse' : 'text-primary'} />
        <span className="text-sm font-medium">{Math.ceil(timeLeft)}s</span>
      </div>
    </div>
  );
};

export default GameTimer;
