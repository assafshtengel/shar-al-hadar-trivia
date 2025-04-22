
import React, { useState, useEffect } from 'react';
import { TriviaQuestion as TriviaQuestionType } from '@/data/triviaQuestions';
import AppButton from '@/components/AppButton';
import { CheckCircle2, XCircle } from 'lucide-react';

interface TriviaQuestionProps {
  question: TriviaQuestionType | {
    question: string;
    options: string[];
    correctAnswerIndex: number;
  };
  onAnswer: (isCorrect: boolean, selectedIndex: number) => void;
  timeUp: boolean;
  answerStartTime?: number;
  elapsedTime?: number;
  showOptions: boolean;
  isFinalPhase: boolean;
  hasAnsweredEarly?: boolean;
  showQuestion?: boolean; // Added to control visibility of question during song playback
  onTimeUp?: () => void; // Callback for when time is up and no selection was made
}

const TriviaQuestion: React.FC<TriviaQuestionProps> = ({ 
  question, 
  onAnswer,
  timeUp,
  answerStartTime = 0,
  elapsedTime = 0,
  showOptions,
  isFinalPhase,
  hasAnsweredEarly = false,
  showQuestion = true, // Default to showing question
  onTimeUp
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [visibleOptions, setVisibleOptions] = useState<{option: string, originalIndex: number}[]>([]);

  // Always show all options for trivia questions, regardless of showOptions prop
  const isTrivia = question.question !== "מה השיר?";

  // Determine if this is a trivia round
  useEffect(() => {
    if (isFinalPhase && !answered && !hasAnsweredEarly) {
      const wrongAnswerIndices = question.options
        .map((_, index) => index)
        .filter(index => index !== question.correctAnswerIndex);
      
      if (wrongAnswerIndices.length >= 2) {
        const indicesToRemove = wrongAnswerIndices
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);
        
        const remainingOptions = question.options
          .map((option, index) => ({ option, originalIndex: index }))
          .filter(item => !indicesToRemove.includes(item.originalIndex));
        
        setVisibleOptions(remainingOptions.sort(() => Math.random() - 0.5));
      } else {
        setVisibleOptions(question.options.map((option, index) => ({ 
          option, 
          originalIndex: index 
        })));
      }
    } else {
      setVisibleOptions(question.options.map((option, index) => ({ 
        option, 
        originalIndex: index 
      })));
    }
  }, [isFinalPhase, question.options, question.correctAnswerIndex, answered, hasAnsweredEarly]);

  useEffect(() => {
    if (timeUp && !answered && onTimeUp) {
      // Don't auto-call onTimeUp here, as we need to show 50-50 options first
      // This will be handled by the parent component based on isFinalPhase
      if (isFinalPhase) {
        onTimeUp();
      }
    }
  }, [timeUp, answered, onTimeUp, isFinalPhase]);

  const handleSelectAnswer = (index: number) => {
    if (answered || timeUp) return;
    
    setSelectedAnswer(index);
    setAnswered(true);
    
    const isCorrect = index === question.correctAnswerIndex;
    onAnswer(isCorrect, index);
  };

  if (!showQuestion) {
    return null;
  }

  if (hasAnsweredEarly && isFinalPhase) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto p-4">
        <div className="bg-gray-100 p-6 rounded-xl text-center">
          <p className="text-lg text-gray-600">
            כבר ענית על השאלה בשלב מוקדם יותר
          </p>
        </div>
      </div>
    );
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
