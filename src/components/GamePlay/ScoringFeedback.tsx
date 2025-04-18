
import React from 'react';
import { Youtube } from 'lucide-react';
import AppButton from '@/components/AppButton';
import { Song } from '@/data/songBank';

interface GameRound {
  correctSong: Song;
  options: Song[];
  correctAnswerIndex: number;
}

interface ScoringFeedbackProps {
  isHost: boolean;
  currentRound: GameRound | null;
  currentPlayer: {
    lastAnswerCorrect?: boolean;
    lastScore?: number;
    lastAnswer?: string;
  };
  onPlayFullSong: () => void;
}

const ScoringFeedback: React.FC<ScoringFeedbackProps> = ({
  isHost,
  currentRound,
  currentPlayer,
  onPlayFullSong
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      {currentPlayer.lastAnswerCorrect !== undefined ? (
        <>
          <div className={`text-3xl font-bold ${currentPlayer.lastAnswerCorrect ? 'text-green-500' : 'text-red-500'} text-center`}>
            {currentPlayer.lastAnswerCorrect ? 'כל הכבוד! ענית נכון!' : 'אוי לא! טעית.'}
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xl">
            <span>קיבלת</span>
            <span className="font-bold text-primary text-2xl">
              {currentPlayer.lastScore !== undefined ? currentPlayer.lastScore : 0}
            </span>
            <span>נקודות</span>
          </div>
          
          {currentPlayer.lastAnswer && (
            <div className="text-lg">
              {currentPlayer.lastAnswerCorrect ? 'תשובה נכונה:' : 'בחרת:'} {currentPlayer.lastAnswer}
            </div>
          )}
          
          {!currentPlayer.lastAnswerCorrect && currentRound && (
            <div className="text-lg font-semibold text-green-500">
              התשובה הנכונה: {currentRound.correctSong.title}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="text-2xl font-bold text-secondary text-center">
            דילגת על השאלה
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xl">
            <span>קיבלת</span>
            <span className="font-bold text-primary text-2xl">
              {currentPlayer.lastScore !== undefined ? currentPlayer.lastScore : 0}
            </span>
            <span>נקודות</span>
          </div>
        </>
      )}
      
      {isHost && currentRound && (
        <AppButton 
          variant="secondary" 
          size="lg" 
          onClick={onPlayFullSong} 
          className="max-w-xs mt-4"
        >
          השמע את השיר המלא
          <Youtube className="mr-2" />
        </AppButton>
      )}
    </div>
  );
};

export default ScoringFeedback;
