
import React from 'react';
import { TriviaQuestion as TriviaQuestionType } from '@/data/triviaQuestions';
import { SkipForward } from 'lucide-react';
import GameTimer from './GameTimer';
import TriviaQuestion from './TriviaQuestion';
import AppButton from './AppButton';
import { GameRound } from '@/types/game';

interface AnswerOptionsPhaseProps {
  isTriviaRound: boolean;
  currentTriviaQuestion: TriviaQuestionType | null;
  currentRound: GameRound | null;
  timerActive: boolean;
  timeLeft: number;
  onTimerTimeout: () => void;
  isHost: boolean;
  currentPlayerScore: number;
  skipsLeft: number;
  hasAnswered: boolean;
  selectedAnswer: number | null;
  isFinalPhase: boolean;
  answeredEarly: boolean;
  onAnswer: (isCorrect: boolean, selectedIndex: number) => void;
  onSkip: () => void;
  gameStartTime: number | null;
}

const AnswerOptionsPhase: React.FC<AnswerOptionsPhaseProps> = ({
  isTriviaRound,
  currentTriviaQuestion,
  currentRound,
  timerActive,
  timeLeft,
  onTimerTimeout,
  isHost,
  currentPlayerScore,
  skipsLeft,
  hasAnswered,
  selectedAnswer,
  isFinalPhase,
  answeredEarly,
  onAnswer,
  onSkip,
  gameStartTime
}) => {
  if (
    isHost &&
    hasAnswered &&
    isFinalPhase
  ) {
    return (
      <div className="flex flex-col items-center py-6 space-y-6">
        <GameTimer initialSeconds={6} isActive={true} onTimeout={onTimerTimeout} />
        <div className="text-xl font-semibold text-primary">
          הבחירה שלך נקלטה! ממתין לשאר המשתתפים...
        </div>
        <div className="text-md text-gray-600 bg-gray-100 rounded-lg border p-5 max-w-xl mt-8 text-center">
          לאחר שכל המשתתפים יענו או שייגמר הזמן, יעברו כל השחקנים לצפייה בתוצאה, ניקוד, ושם השיר הנכון כולל אפשרות להשמעתו.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-6 space-y-6">
      <GameTimer initialSeconds={8} isActive={timerActive} onTimeout={onTimerTimeout} />

      <div className="text-xl font-semibold text-primary">
        הניקוד שלך בסיבוב זה: {currentPlayerScore}
      </div>

      <div className="flex items-center">
        <span className="font-bold">{skipsLeft} דילוגים נותרו</span>
        <SkipForward className="ml-2 text-secondary" />
      </div>

      {isTriviaRound && currentTriviaQuestion ? (
        <TriviaQuestion
          question={currentTriviaQuestion}
          onAnswer={onAnswer}
          timeUp={timeLeft <= 0}
          answerStartTime={gameStartTime || Date.now()}
          elapsedTime={(Date.now() - (gameStartTime || Date.now())) / 1000}
          isFinalPhase={isFinalPhase}
          hasAnsweredEarly={answeredEarly}
          onTimeUp={() => {
            if (isFinalPhase) {
              onTimerTimeout();
            }
          }}
        />
      ) : currentRound ? (
        <TriviaQuestion
          question={{
            question: "מה השיר?",
            options: currentRound.options.map(song => song.title || ''),
            correctAnswerIndex: currentRound.correctAnswerIndex
          }}
          onAnswer={onAnswer}
          timeUp={timeLeft <= 0}
          answerStartTime={gameStartTime || Date.now()}
          elapsedTime={(Date.now() - (gameStartTime || Date.now())) / 1000}
          isFinalPhase={isFinalPhase}
          hasAnsweredEarly={answeredEarly}
          onTimeUp={() => {
            if (isFinalPhase) {
              onTimerTimeout();
            }
          }}
        />
      ) : (
        <div className="text-lg text-gray-600 animate-pulse">
          טוען אפשרויות...
        </div>
      )}

      {!hasAnswered && (
        <AppButton 
          variant="secondary" 
          className="mt-4 max-w-xs" 
          disabled={selectedAnswer !== null || skipsLeft <= 0} 
          onClick={onSkip}
        >
          דלג ({skipsLeft})
          <SkipForward className="mr-2" />
        </AppButton>
      )}

      {selectedAnswer !== null && (
        <div className="text-lg text-gray-600 bg-gray-100 p-4 rounded-md w-full text-center">
          הבחירה שלך נקלטה! ממתין לסיום הזמן...
        </div>
      )}

      {hasAnswered && !isFinalPhase && (
        <div className="text-lg text-yellow-700 bg-yellow-100 border border-yellow-300 mt-4 p-4 rounded-md w-full text-center">
          בחרת תשובה בסיבוב זה, אנו מחכים לתשובות משאר המשתתפים.
        </div>
      )}
    </div>
  );
};

export default AnswerOptionsPhase;
