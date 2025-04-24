
import React from 'react';
import { Youtube } from 'lucide-react';
import AppButton from '@/components/AppButton';
import { GameRound, Player } from '@/types/game';

interface ScoringFeedbackProps {
  userSkippedQuestion: boolean;
  currentPlayer: Player;
  currentRound: GameRound | null;
  isTriviaRound: boolean;
  isHost: boolean;
  onPlayFullSong: () => void;
}

const ScoringFeedback: React.FC<ScoringFeedbackProps> = ({
  userSkippedQuestion,
  currentPlayer,
  currentRound,
  isTriviaRound,
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
            <span className="font-bold text-primary text-2xl">{currentPlayer.lastScore !== undefined ? currentPlayer.lastScore : 0}</span>
            <span>נקודות</span>
          </div>
        </>
      ) : currentPlayer.lastAnswerCorrect !== undefined ? (
        <>
          <div className={`text-3xl font-bold ${currentPlayer.lastAnswerCorrect ? 'text-green-500' : 'text-red-500'} text-center`}>
            {currentPlayer.lastAnswerCorrect ? 'כל הכבוד! ענית נכון!' : 'אוי לא! טעית.'}
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xl">
            <span>קיבלת</span>
            <span className="font-bold text-primary text-2xl">{currentPlayer.lastScore !== undefined ? currentPlayer.lastScore : 0}</span>
            <span>נקודות</span>
          </div>
          
          {currentPlayer.lastAnswer && (
            <div className="text-lg">
              {currentPlayer.lastAnswerCorrect ? 'תשובה נכונה:' : 'בחרת:'} {currentPlayer.lastAnswer}
            </div>
          )}
          
          {!currentPlayer.lastAnswerCorrect && currentRound && !isTriviaRound && (
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
      
      {isHost && currentRound && !isTriviaRound && (
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
