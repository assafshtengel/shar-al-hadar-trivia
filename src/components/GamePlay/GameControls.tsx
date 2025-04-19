
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, CheckCircle } from 'lucide-react';

interface GameControlsProps {
  onCalculateScores: () => void;
  timeRemaining: number;
  isTimerRunning: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  onCalculateScores,
  timeRemaining,
  isTimerRunning,
  startTimer,
  stopTimer,
  resetTimer,
}) => {
  return (
    <div className="bg-card rounded-lg shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">בקרת מנחה</h2>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        {isTimerRunning ? (
          <Button 
            variant="outline" 
            onClick={stopTimer}
            className="flex items-center justify-center"
          >
            <Pause className="mr-2 h-4 w-4" />
            עצור טיימר
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={startTimer}
            className="flex items-center justify-center"
            disabled={timeRemaining <= 0}
          >
            <Play className="mr-2 h-4 w-4" />
            הפעל טיימר
          </Button>
        )}
        
        <Button 
          variant="outline" 
          onClick={resetTimer}
          className="flex items-center justify-center"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          אפס טיימר
        </Button>
      </div>
      
      <Button 
        onClick={onCalculateScores}
        className="w-full flex items-center justify-center"
        disabled={timeRemaining > 0 && isTimerRunning}
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        סיים סיבוב וחשב ניקוד
      </Button>
    </div>
  );
};

export default GameControls;
