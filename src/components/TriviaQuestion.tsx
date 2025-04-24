
import React, { useState, useEffect } from 'react';
import { TriviaQuestion as TriviaQuestionType } from '@/data/triviaQuestions';
import AppButton from '@/components/AppButton';
import { CheckCircle2, XCircle, SkipForward } from 'lucide-react';

interface TriviaQuestionProps {
  question: TriviaQuestionType | {
    question: string;
    options: string[];
    correctAnswerIndex: number;
  };
  onAnswer: (isCorrect: boolean, selectedIndex: number) => void;
  onSkip?: () => void;
  timeUp: boolean;
  answerStartTime?: number;
  elapsedTime?: number;
  showQuestion?: boolean;
  hasAnsweredEarly?: boolean;
  skipsLeft?: number;
}

const TriviaQuestion: React.FC<TriviaQuestionProps> = ({ 
  question, 
  onAnswer,
  onSkip,
  timeUp,
  answerStartTime = 0,
  elapsedTime = 0,
  showQuestion = true,
  hasAnsweredEarly = false,
  skipsLeft = 0
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [visibleOptions, setVisibleOptions] = useState<{option: string, originalIndex: number}[]>([]);

  const isTrivia = question.question !== "מה השיר?";

  useEffect(() => {
    setVisibleOptions(question.options.map((option, index) => ({ 
      option, 
      originalIndex: index 
    })));
  }, [question.options]);

  const handleSelectAnswer = (index: number) => {
    if (answered || timeUp) return;
    
    setSelectedAnswer(index);
    setAnswered(true);
    
    const isCorrect = index === question.correctAnswerIndex;
    onAnswer(isCorrect, index);
  };

  const handleSkip = () => {
    if (answered || timeUp || skipsLeft <= 0) return;
    if (onSkip) {
      onSkip();
    }
  };

  if (!showQuestion) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto p-4">
      {isTrivia && (
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">
          שאלת טריוויה במוזיקה ישראלית
        </h2>
      )}
      
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-lg w-full mb-6 border-2 border-primary/20">
        <p className="text-xl font-medium mb-6 text-center">{question.question}</p>
        
        <div className="grid grid-cols-1 gap-4">
          {visibleOptions.map((item, index) => (
            <div key={index} className="relative">
              <AppButton
                variant={selectedAnswer === item.originalIndex ? 'primary' : 'secondary'}
                className={`w-full justify-start px-4 py-3 ${
                  answered && item.originalIndex !== question.correctAnswerIndex && selectedAnswer === item.originalIndex
                    ? 'bg-red-100 border-red-500'
                    : ''
                } ${
                  answered && item.originalIndex === question.correctAnswerIndex
                    ? 'bg-green-100 border-green-500'
                    : ''
                } ${answered && selectedAnswer !== item.originalIndex ? 'opacity-70' : ''}`}
                onClick={() => handleSelectAnswer(item.originalIndex)}
                disabled={answered || timeUp}
              >
                {item.option}
                
                {answered && item.originalIndex === question.correctAnswerIndex && (
                  <CheckCircle2 className="ml-auto text-green-500" />
                )}
                
                {answered && selectedAnswer === item.originalIndex && item.originalIndex !== question.correctAnswerIndex && (
                  <XCircle className="ml-auto text-red-500" />
                )}
              </AppButton>
            </div>
          ))}
        </div>

        {!answered && skipsLeft > 0 && (
          <AppButton
            variant="secondary"
            onClick={handleSkip}
            className="mt-4 w-full max-w-xs mx-auto"
            disabled={answered || timeUp}
          >
            דלג ({skipsLeft})
            <SkipForward className="mr-2" />
          </AppButton>
        )}
        
        {answered && (
          <div className="text-center p-4 mt-4 bg-gray-50 rounded-lg">
            <p className="text-lg font-medium">
              התשובה שלך נשלחה! ממתין לתוצאות...
            </p>
          </div>
        )}
      </div>
      
      {answered && (
        <div className={`text-lg font-medium p-4 rounded-lg ${
          selectedAnswer === question.correctAnswerIndex
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {selectedAnswer === question.correctAnswerIndex
            ? 'כל הכבוד! תשובה נכונה!'
            : `התשובה הנכונה היא: ${question.options[question.correctAnswerIndex]}`}
        </div>
      )}
    </div>
  );
};

export default TriviaQuestion;
