
import React from 'react';

interface ScoringFeedbackProps {
  lastAnswerCorrect?: boolean;
  lastScore?: number;
}

const ScoringFeedback: React.FC<ScoringFeedbackProps> = ({
  lastAnswerCorrect,
  lastScore
}) => {
  if (lastAnswerCorrect === undefined) return null;

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      <div className={`text-3xl font-bold ${lastAnswerCorrect ? 'text-green-500' : 'text-red-500'} text-center`}>
        {lastAnswerCorrect ? 'כל הכבוד! ענית נכון!' : 'אוי לא! טעית.'}
      </div>
      
      <div className="flex items-center justify-center gap-2 text-xl">
        <span>קיבלת</span>
        <span className="font-bold text-primary text-2xl">{lastScore !== undefined ? lastScore : 0}</span>
        <span>נקודות</span>
      </div>
    </div>
  );
};

export default ScoringFeedback;
