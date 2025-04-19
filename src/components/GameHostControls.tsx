import React from 'react';
import AppButton from '@/components/AppButton';
import { Play, AlertCircle, Gauge, Award } from 'lucide-react';
import { toast } from 'sonner';
interface GameHostControlsProps {
  roundCounter: number;
  isTriviaRound: boolean;
  onPlayNext: () => void;
  onResetScores: () => void;
  gamePhase: string | null;
}
const GameHostControls: React.FC<GameHostControlsProps> = ({
  roundCounter,
  isTriviaRound,
  onPlayNext,
  onResetScores,
  gamePhase
}) => {
  const isPlayingPhase = gamePhase === 'playing';
  const isWaitingPhase = gamePhase === 'waiting' || gamePhase === 'results' || gamePhase === 'end';
  const nextRoundType = (roundCounter + 1) % 5 === 0 ? 'טריוויה' : 'שיר';
  return <div className="flex flex-col items-center gap-4 mt-4">
      
      
      <AppButton variant="primary" size="lg" onClick={onPlayNext} className="max-w-xs px-[43px] my-0 py-[34px] text-xl" disabled={isPlayingPhase}>
        {isTriviaRound ? 'הצג שאלת טריוויה' : 'התחל סיבוב חדש'}
        <Play className="mr-2" />
      </AppButton>
      
      {isWaitingPhase && <AppButton variant="secondary" size="default" onClick={onResetScores} className="text-sm">
          איפוס ניקוד לכל השחקנים
          <Award className="mr-2 h-4 w-4" />
        </AppButton>}
      
      
    </div>;
};
export default GameHostControls;