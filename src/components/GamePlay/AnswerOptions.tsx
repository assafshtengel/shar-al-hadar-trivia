
import React from 'react';
import AppButton from '@/components/AppButton';
import GameTimer from '@/components/GameTimer';
import { SkipForward } from 'lucide-react';
import { Song } from '@/data/songBank';

interface GameRound {
  correctSong: Song;
  options: Song[];
  correctAnswerIndex: number;
}

interface AnswerOptionsProps {
  currentRound: GameRound | null;
  selectedAnswer: number | null;
  currentPlayer: {
    skipsLeft: number;
    hasAnswered: boolean;
  };
  showAnswerConfirmation: boolean;
  onAnswer: (index: number) => void;
  onSkip: () => void;
  onTimeout: () => void;
}

const AnswerOptions: React.FC<AnswerOptionsProps> = ({
  currentRound,
  selectedAnswer,
  currentPlayer,
  showAnswerConfirmation,
  onAnswer,
  onSkip,
  onTimeout
}) => {
  return (
    <div className="flex flex-col items-center py-6 space-y-6">
      <GameTimer initialSeconds={10} isActive={true} onTimeout={onTimeout} />
      
      <div className="flex items-center">
        <span className="font-bold">{currentPlayer.skipsLeft} דילוגים נותרו</span>
        <SkipForward className="ml-2 text-secondary" />
      </div>
      
      <h2 className="text-2xl font-bold text-primary">מה השיר?</h2>
      
      {currentRound ? (
        <div className="grid grid-cols-1 gap-4 w-full max-w-md">
          {currentRound.options.map((song, index) => (
            <div key={index} className="relative">
              <AppButton 
                variant={selectedAnswer === index ? "primary" : "secondary"}
                className={`${selectedAnswer !== null && selectedAnswer !== index ? "opacity-50" : ""} w-full`}
                disabled={selectedAnswer !== null}
                onClick={() => onAnswer(index)}
              >
                {song.title}
              </AppButton>
              {selectedAnswer === index && showAnswerConfirmation && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-500 text-white px-2 py-1 rounded-md animate-fade-in">
                  ✓ הבחירה שלך נקלטה!
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-lg text-gray-600 animate-pulse">
          טוען אפשרויות...
        </div>
      )}
      
      <AppButton 
        variant="secondary" 
        className="mt-4 max-w-xs" 
        disabled={selectedAnswer !== null || currentPlayer.skipsLeft <= 0}
        onClick={onSkip}
      >
        דלג ({currentPlayer.skipsLeft})
        <SkipForward className="mr-2" />
      </AppButton>
      
      {selectedAnswer !== null && (
        <div className="text-lg text-gray-600 bg-gray-100 p-4 rounded-md w-full text-center">
          הבחירה שלך נקלטה! ממתין לסיום הזמן...
        </div>
      )}
    </div>
  );
};

export default AnswerOptions;
