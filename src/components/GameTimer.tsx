
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

  // Reset timer when props change
  useEffect(() => {
    if (isActive) {
      console.log(`Timer started with ${initialSeconds} seconds`);
      setTimeLeft(initialSeconds);
      startTimeRef.current = Date.now();
      lastTickTimeRef.current = Date.now();
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
        
        // Use elapsed time to ensure timer accuracy
        setTimeLeft(prev => {
          const newTime = Math.max(prev - elapsed / 1000, 0);
          
          if (newTime <= 0) {
            if (timerRef.current) {
              console.log('Timer reached zero, cleaning up');
              clearInterval(timerRef.current);
              timerRef.current = null;
              onTimeout();
            }
            return 0;
          }
          
          return newTime;
        });
      }, 100); // Update more frequently for smoother countdown
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
  const progressPercentage = (timeLeft / initialSeconds) * 100;
  const isAlmostTimeUp = timeLeft < initialSeconds * 0.3;

  return (
    <div className="w-full mb-4">
      <div className="w-full flex items-center justify-between px-2 mb-2 bg-slate-100 rounded-md p-2">
        <div className="flex items-center gap-2">
          <Timer className={`${isAlmostTimeUp ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
          <span className={`font-bold text-lg ${isAlmostTimeUp ? 'text-red-500' : ''}`}>
            {Math.ceil(timeLeft)} שניות
          </span>
        </div>
        <div className="text-sm font-medium text-gray-600">
          זמן לבחירת תשובה
        </div>
      </div>
      <Progress 
        value={progressPercentage} 
        className={`w-full h-3 mb-4 ${isAlmostTimeUp ? 'bg-red-200' : ''}`}
      />
    </div>
  );
};

export default GameTimer;
