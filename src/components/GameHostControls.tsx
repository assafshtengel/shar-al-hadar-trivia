
import React from 'react';
import AppButton from '@/components/AppButton';
import { Play, AlertCircle, Gauge, Award, Youtube } from 'lucide-react';
import { toast } from 'sonner';
import { Song } from '@/data/songBank';

interface GameHostControlsProps {
  roundCounter: number;
  isTriviaRound: boolean;
  onPlayNext: () => void;
  onResetScores: () => void;
  gamePhase: string | null;
  currentSong?: Song | null;
}

const GameHostControls: React.FC<GameHostControlsProps> = ({
  roundCounter,
  isTriviaRound,
  onPlayNext,
  onResetScores,
  gamePhase,
  currentSong
}) => {
  const isPlayingPhase = gamePhase === 'playing';
  const isWaitingPhase = gamePhase === 'waiting' || gamePhase === 'results' || gamePhase === 'end';
  const nextRoundType = (roundCounter + 1) % 5 === 0 ? 'טריוויה' : 'שיר';

  const playFullSong = () => {
    if (!currentSong?.fullUrl) {
      toast({
        title: "אין קישור לשיר המלא",
        description: "לא נמצא קישור להשמעת השיר המלא",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "משמיע את השיר המלא",
      description: "השיר המלא מתנגן כעת"
    });
    
    window.open(currentSong.fullUrl, '_blank');
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-4">
      <AppButton 
        variant="primary" 
        size="lg" 
        onClick={onPlayNext} 
        className="max-w-xs px-[43px] my-0 py-[34px] text-xl" 
        disabled={isPlayingPhase}
      >
        {isTriviaRound ? 'הצג שאלת טריוויה' : 'התחל סיבוב חדש'}
        <Play className="mr-2" />
      </AppButton>

      {currentSong && currentSong.fullUrl && (
        <AppButton
          variant="secondary"
          size="lg"
          onClick={playFullSong}
          className="max-w-xs px-4 py-2 text-lg"
        >
          {`האזן ל"${currentSong.title}" - ${currentSong.artist || 'אמן לא ידוע'}`}
          <Youtube className="mr-2" />
        </AppButton>
      )}
      
      <AppButton
        variant="outline"
        size="default"
        onClick={onResetScores}
        className="max-w-xs px-4 py-2"
      >
        אפס ניקוד לכל השחקנים
        <Award className="mr-2" />
      </AppButton>
    </div>
  );
};

export default GameHostControls;
