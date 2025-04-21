
import React, { useState } from 'react';
import AppButton from '@/components/AppButton';
import { Play, Award } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

interface GameHostControlsProps {
  roundCounter: number;
  isTriviaRound: boolean;
  onPlayNext: () => void;
  onResetScores: () => void;
  gamePhase: string | null;
  // New props
  onPlaySong?: () => Promise<void>;
  isPlaying?: boolean;
  gameCode?: string;
  playerCount?: number;
}

const GameHostControls: React.FC<GameHostControlsProps> = ({
  roundCounter,
  isTriviaRound,
  onPlayNext,
  onResetScores,
  gamePhase,
  onPlaySong,
  isPlaying,
  playerCount
}) => {
  const [showResetDialog, setShowResetDialog] = useState(false);
  const isPlayingPhase = gamePhase === 'playing';
  const isWaitingPhase = gamePhase === 'waiting' || gamePhase === 'results' || gamePhase === 'end';
  const nextRoundType = (roundCounter + 1) % 5 === 0 ? 'טריוויה' : 'שיר';

  const handleResetConfirm = () => {
    onResetScores();
    setShowResetDialog(false);
    toast('הניקוד אופס', {
      description: 'ניקוד כל השחקנים אופס בהצלחה',
      duration: 4000,
    });
  };

  // Add handler for play song button if provided
  const handlePlaySong = () => {
    if (onPlaySong) {
      onPlaySong();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-4">
      {onPlaySong && (
        <AppButton 
          variant="primary" 
          size="lg" 
          onClick={handlePlaySong} 
          className="max-w-xs px-[43px] my-0 py-[34px] text-xl" 
          disabled={isPlaying}
        >
          השמע שיר
          <Play className="mr-2" />
        </AppButton>
      )}
      
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
      
      {isWaitingPhase && (
        <>
          <AppButton 
            variant="secondary" 
            size="default" 
            onClick={() => setShowResetDialog(true)} 
            className="text-sm"
          >
            איפוס ניקוד לכל השחקנים
            <Award className="mr-2 h-4 w-4" />
          </AppButton>

          <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>איפוס ניקוד</AlertDialogTitle>
                <AlertDialogDescription>
                  האם אתה בטוח שברצונך לאפס את הניקוד של כל השחקנים? פעולה זו לא ניתנת לביטול.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse gap-2">
                <AlertDialogAction onClick={handleResetConfirm}>
                  אישור
                </AlertDialogAction>
                <AlertDialogCancel>ביטול</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};

export default GameHostControls;
