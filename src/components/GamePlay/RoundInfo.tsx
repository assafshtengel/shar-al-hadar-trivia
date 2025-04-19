
import React from 'react';
import { Music, Clock } from 'lucide-react';
import GameTimer from '@/components/GameTimer';

interface RoundInfoProps {
  roundNumber: number;
  totalRounds: number;
  songTitle: string;
  artist: string;
  timeRemaining: number;
  isTimerRunning: boolean;
  isHost: boolean;
}

const RoundInfo: React.FC<RoundInfoProps> = ({
  roundNumber,
  totalRounds,
  songTitle,
  artist,
  timeRemaining,
  isTimerRunning,
  isHost
}) => {
  return (
    <div className="bg-card rounded-lg shadow-sm p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <Music className="text-primary mr-2" size={18} />
          <h2 className="text-lg font-semibold">סיבוב {roundNumber}/{totalRounds}</h2>
        </div>
        
        {isHost && (
          <GameTimer 
            initialSeconds={timeRemaining} 
            isActive={isTimerRunning} 
            onTimeout={() => console.log('Timer ended')} 
          />
        )}
      </div>
      
      {isHost && (
        <div className="mt-4 p-3 bg-primary/10 rounded-md">
          <p className="text-sm font-medium">מידע למנחה (רק אתה רואה את זה):</p>
          <div className="mt-1 space-y-1">
            <p className="text-sm">שם השיר: <span className="font-semibold">{songTitle}</span></p>
            <p className="text-sm">אמן: <span className="font-semibold">{artist}</span></p>
          </div>
        </div>
      )}
      
      {!isHost && (
        <div className="flex justify-center items-center mt-2">
          <Clock className="text-muted-foreground mr-1" size={16} />
          <span className="text-sm text-muted-foreground">
            זמן נותר: {Math.ceil(timeRemaining)} שניות
          </span>
        </div>
      )}
    </div>
  );
};

export default RoundInfo;
