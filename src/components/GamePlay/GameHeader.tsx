
import React from 'react';
import { Music } from 'lucide-react';

interface GameHeaderProps {
  gameCode: string | null;
  currentRound: number;
  totalRounds: number;
}

const GameHeader: React.FC<GameHeaderProps> = ({ 
  gameCode, 
  currentRound, 
  totalRounds 
}) => {
  return (
    <div className="flex items-center justify-center mb-6">
      <div className="bg-primary/10 p-4 rounded-lg flex flex-col items-center">
        <div className="flex items-center mb-2">
          <Music className="text-primary mr-2" size={20} />
          <h1 className="text-xl font-bold text-primary">נחש את השיר</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          <span>קוד משחק: {gameCode}</span>
          <span className="mx-2">|</span>
          <span>סיבוב {currentRound}/{totalRounds}</span>
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
