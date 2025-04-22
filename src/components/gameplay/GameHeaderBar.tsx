
import React from 'react';
import { MusicNote } from '@/components/MusicNote';
import { LeaveGameButton } from '@/components/LeaveGameButton';
import { EndGameButton } from '@/components/EndGameButton';

interface GameHeaderBarProps {
  gameCode: string;
  isHost: boolean;
}

const GameHeaderBar: React.FC<GameHeaderBarProps> = ({ gameCode, isHost }) => (
  <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6 bg-white/50 backdrop-blur-sm p-4 rounded-lg shadow-sm">
    <div className="flex items-center gap-2 order-1 md:order-none">
      <LeaveGameButton gameCode={gameCode} isHost={isHost} />
      {isHost && <EndGameButton gameCode={gameCode} />}
    </div>

    <h1 className="flex items-center justify-center text-5xl font-bold text-primary text-center order-0 md:order-none relative">
      <div className="flex items-center justify-center gap-3">
        <MusicNote type="note3" className="absolute -top-6 -right-8 text-primary" size={32} animation="float" />
        <MusicNote type="note2" className="absolute -top-4 -left-6 text-secondary" size={28} animation="float-alt" />
        שיר על הדרך 🎶
      </div>
    </h1>

    <div className="flex flex-col md:flex-row items-center gap-4 order-2 md:order-none">
      {isHost && <div className="text-sm text-gray-600">מנחה</div>}
      <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-md">
        <span className="text-sm text-gray-600">קוד משחק: </span>
        <span className="font-mono font-bold text-lg">{gameCode}</span>
      </div>
    </div>
  </div>
);

export default GameHeaderBar;
