
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
  showQuestion = true // Default to showing question
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [visibleOptions, setVisibleOptions] = useState(question.options);

  useEffect(() => {
    if (isFinalPhase && !answered && !hasAnsweredEarly) {
      const wrongAnswerIndices = question.options
        .map((_, index) => index)
        .filter(index => index !== question.correctAnswerIndex);
      
      // Only remove two answers if we have at least 3 options
      if (wrongAnswerIndices.length >= 2) {
        const indicesToRemove = wrongAnswerIndices
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);
        
        const filteredOptions = question.options.filter((_, index) => 
          !indicesToRemove.includes(index)
        );
        
        setVisibleOptions(filteredOptions);
      } else {
        setVisibleOptions(question.options);
      }
    } else {
      setVisibleOptions(question.options);
    }
  }, [isFinalPhase, question.options, question.correctAnswerIndex, answered, hasAnsweredEarly]);

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
      {question.question !== "מה השיר?" && (
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">
          שאלת טריוויה במוזיקה ישראלית
        </h2>
      )}
      
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-lg w-full mb-6 border-2 border-primary/20">
        <p className="text-xl font-medium mb-6 text-center">{question.question}</p>
        
        {showOptions && (
          <div className="grid grid-cols-1 gap-4">
            {visibleOptions.map((option, index) => {
              const originalIndex = question.options.indexOf(option);
              return (
                <div key={index} className="relative">
                  <AppButton
                    variant={selectedAnswer === originalIndex ? 'primary' : 'secondary'}
                    className={`w-full justify-start px-4 py-3 ${
                      answered && originalIndex !== question.correctAnswerIndex && selectedAnswer === originalIndex
                        ? 'bg-red-100 border-red-500'
                        : ''
                    } ${
                      answered && originalIndex === question.correctAnswerIndex
                        ? 'bg-green-100 border-green-500'
                        : ''
                    } ${answered && selectedAnswer !== originalIndex ? 'opacity-70' : ''}`}
                    onClick={() => handleSelectAnswer(originalIndex)}
                    disabled={answered || timeUp}
                  >
                    {option}
                    
                    {answered && originalIndex === question.correctAnswerIndex && (
                      <CheckCircle2 className="ml-auto text-green-500" />
                    )}
                    
                    {answered && selectedAnswer === originalIndex && originalIndex !== question.correctAnswerIndex && (
                      <XCircle className="ml-auto text-red-500" />
                    )}
                  </AppButton>
                </div>
              );
            })}
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
