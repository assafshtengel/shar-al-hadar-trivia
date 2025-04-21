
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
  const timeoutTriggeredRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset timer when props change
  useEffect(() => {
    // Clear any existing timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Reset state
    timeoutTriggeredRef.current = false;
    
    if (isActive) {
      console.log(`Timer initialized with ${initialSeconds} seconds`);
      setTimeLeft(initialSeconds);
      
      // Create an absolute timeout that will fire regardless of intervals
      // This is our safety mechanism
      timeoutRef.current = setTimeout(() => {
        console.log('Safety timeout triggered');
        if (!timeoutTriggeredRef.current) {
          timeoutTriggeredRef.current = true;
          onTimeout();
        }
      }, initialSeconds * 1000 + 100); // Small buffer to ensure it triggers after visual countdown
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [initialSeconds, isActive, onTimeout]);

  // Handle the actual countdown
  useEffect(() => {
    if (isActive && !timerRef.current) {
      console.log('Starting timer interval');
      
      const startTime = Date.now(); // Capture exact start time
      
      timerRef.current = setInterval(() => {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const newTimeLeft = Math.max(initialSeconds - elapsedSeconds, 0);
        
        setTimeLeft(newTimeLeft);
        
        // Check if timer has reached zero
        if (newTimeLeft <= 0.05 && !timeoutTriggeredRef.current) {
          console.log('Timer interval detected zero - triggering callback');
          
          // Prevent multiple calls
          timeoutTriggeredRef.current = true;
          
          // Clean up
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          
          // Trigger the callback
          onTimeout();
        }
      }, 50); // More frequent updates for smoother countdown
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, initialSeconds, onTimeout]);

  // Calculate percentage for progress bar
  const progressPercentage = (timeLeft / initialSeconds) * 100;
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
