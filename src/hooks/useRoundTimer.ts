
import { useState, useEffect, useCallback, useRef } from 'react';

export const useRoundTimer = (initialDuration: number) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(initialDuration);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsTimerRunning(false);
    }
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    setTimeRemaining(initialDuration);
  }, [initialDuration, stopTimer]);

  const startTimer = useCallback(() => {
    if (isTimerRunning) return;
    
    resetTimer();
    startTimeRef.current = Date.now();
    setIsTimerRunning(true);
    
    timerRef.current = setInterval(() => {
      const elapsedSeconds = (Date.now() - (startTimeRef.current || 0)) / 1000;
      const remaining = Math.max(0, initialDuration - elapsedSeconds);
      
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        stopTimer();
      }
    }, 100);
  }, [initialDuration, isTimerRunning, resetTimer, stopTimer]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    timeRemaining,
    isTimerRunning,
    startTimer,
    stopTimer,
    resetTimer,
  };
};
