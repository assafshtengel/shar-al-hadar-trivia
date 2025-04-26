
import React from 'react';
import { Youtube } from 'lucide-react';
import AppButton from './AppButton';
import { GameRound } from '@/types/game';

interface ScoringFeedbackProps {
  userSkippedQuestion: boolean;
  lastScore?: number;
  lastAnswerCorrect?: boolean;
  lastAnswer?: string;
  currentRound: GameRound | null;
  isHost: boolean;
  onPlayFullSong: () => void;
}

const ScoringFeedback: React.FC<ScoringFeedbackProps> = ({
  userSkippedQuestion,
  lastScore,
  lastAnswerCorrect,
  lastAnswer,
  currentRound,
  isHost,
  onPlayFullSong
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      <div className="text-4xl font-bold text-primary text-center animate-pulse">
        משקללים את התוצאות
      </div>

      {userSkippedQuestion ? (
        <>
          <div className="text-2xl font-bold text-secondary text-center">
            דילגת על השאלה
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xl">
            <span>קיבלת</span>
            <span className="font-bold text-primary text-2xl">{lastScore !== undefined ? lastScore : 0}</span>
            <span>נקודות</span>
          </div>
        </>
      ) : lastAnswerCorrect !== undefined ? (
        <>
          <div className={`text-3xl font-bold ${lastAnswerCorrect ? 'text-green-500' : 'text-red-500'} text-center`}>
            {lastAnswerCorrect ? 'כל הכבוד! ענית נכון!' : 'אוי לא! טעית.'}
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xl">
            <span>קיבלת</span>
            <span className="font-bold text-primary text-2xl">{lastScore !== undefined ? lastScore : 0}</span>
            <span>נקודות</span>
          </div>
          
          {lastAnswer && (
            <div className="text-lg">
              {lastAnswerCorrect ? 'תשובה נכונה:' : 'בחרת:'} {lastAnswer}
            </div>
          )}
          
          {!lastAnswerCorrect && currentRound && (
            <div className="text-lg font-semibold text-green-500">
              התשובה הנכונה: {currentRound.correctSong.title}
            </div>
          )}
        </>
      ) : (
        <div className="text-lg text-gray-600 text-center">
          ממתין לתוצאות...
        </div>
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
