
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Trophy, ArrowRight } from 'lucide-react';

interface RoundResult {
  playerName: string;
  answer: string;
  isCorrect: boolean;
  pointsEarned: number;
}

interface RoundResultsProps {
  roundResults: RoundResult[];
  onNextRound: () => void;
  isLastRound: boolean;
  onEndGame: () => void;
  isHost: boolean;
}

const RoundResults: React.FC<RoundResultsProps> = ({
  roundResults,
  onNextRound,
  isLastRound,
  onEndGame,
  isHost
}) => {
  // Sort results: correct answers first, then by points
  const sortedResults = [...roundResults].sort((a, b) => {
    if (a.isCorrect && !b.isCorrect) return -1;
    if (!a.isCorrect && b.isCorrect) return 1;
    return b.pointsEarned - a.pointsEarned;
  });

  return (
    <div className="bg-card rounded-lg shadow-sm p-4 mb-6 animate-fade-in">
      <div className="flex items-center mb-4">
        <Trophy className="text-primary mr-2" size={20} />
        <h2 className="text-xl font-bold">תוצאות הסיבוב</h2>
      </div>
      
      <div className="space-y-3 mb-6">
        {sortedResults.map((result, index) => (
          <div 
            key={index}
            className={`flex justify-between items-center p-3 rounded-md ${
              result.isCorrect ? 'bg-green-100' : 'bg-muted'
            }`}
          >
            <div className="flex items-center">
              {result.isCorrect ? (
                <Check className="text-green-600 mr-2" size={16} />
              ) : (
                <X className="text-red-600 mr-2" size={16} />
              )}
              <div>
                <p className="font-medium">{result.playerName}</p>
                <p className="text-sm text-muted-foreground">
                  תשובה: {result.answer}
                </p>
              </div>
            </div>
            <div className="font-bold">
              {result.pointsEarned > 0 ? `+${result.pointsEarned}` : '0'}
            </div>
          </div>
        ))}
      </div>
      
      {isHost && (
        <div className="flex justify-center">
          {isLastRound ? (
            <Button onClick={onEndGame} className="flex items-center">
              סיים משחק
              <Trophy className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={onNextRound} className="flex items-center">
              לסיבוב הבא
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      
      {!isHost && (
        <div className="text-center text-muted-foreground">
          ממתין למנחה להמשיך לסיבוב הבא...
        </div>
      )}
    </div>
  );
};

export default RoundResults;
