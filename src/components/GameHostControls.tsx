import React from 'react';
import AppButton from '@/components/AppButton';
import { Play, Youtube } from 'lucide-react';
interface GameHostControlsProps {
  roundCounter: number;
  isTriviaRound: boolean;
  onPlayNext: () => void;
  onResetScores: () => void;
  onPlayFullSong?: () => void;
  gamePhase: string | null;
}
const GameHostControls: React.FC<GameHostControlsProps> = ({
  roundCounter,
  isTriviaRound,
  onPlayNext,
  onResetScores,
  onPlayFullSong,
  gamePhase
}) => {
  const isPlayingPhase = gamePhase === 'playing';
  const isWaitingPhase = gamePhase === 'waiting' || gamePhase === 'results' || gamePhase === 'end';
  const nextRoundType = (roundCounter + 1) % 5 === 0 ? 'טריוויה' : 'שיר';
  return <div className="flex flex-col items-center gap-4 mt-4">
      <div className="flex gap-4 items-center">
        <AppButton variant="primary" size="lg" onClick={onPlayNext} className="max-w-xs px-[43px] my-0 py-[34px] text-xl" disabled={isPlayingPhase}>
          {isTriviaRound ? 'הצג שאלת טריוויה' : 'התחל סיבוב חדש'}
          <Play className="mr-2" />
        </AppButton>

        
      </div>

      {isWaitingPhase}
    </div>;
};
export default GameHostControls;