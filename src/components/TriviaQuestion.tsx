
import React, { useState, useEffect } from 'react';
import { TriviaQuestion as TriviaQuestionType } from '@/data/triviaQuestions';
import AppButton from '@/components/AppButton';
import { CheckCircle2, XCircle } from 'lucide-react';

interface TriviaQuestionProps {
  question: TriviaQuestionType;
  onAnswer: (isCorrect: boolean, selectedIndex: number) => void;
  timeUp: boolean;
}

const TriviaQuestion: React.FC<TriviaQuestionProps> = ({ 
  question, 
  onAnswer,
  timeUp
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showAnswerConfirmation, setShowAnswerConfirmation] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setAnswered(false);
    setShowAnswerConfirmation(false);
  }, [question]);

  // Reset when timeUp changes to false (new question)
  useEffect(() => {
    if (!timeUp) {
      setSelectedAnswer(null);
      setAnswered(false);
    }
  }, [timeUp]);

  const handleSelectAnswer = (index: number) => {
    // Don't process if already answered or time is up
    if (answered || timeUp) return;
    
    console.log(`TriviaQuestion: Answer selected: ${index}`);
    
    // Update local state
    setSelectedAnswer(index);
    setAnswered(true);
    setShowAnswerConfirmation(true);
    
    // Notify parent component
    const isCorrect = index === question.correctAnswerIndex;
    onAnswer(isCorrect, index);
    
    // Hide confirmation after 2 seconds
    setTimeout(() => {
      setShowAnswerConfirmation(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-primary mb-6 text-center">
        שאלת טריוויה במוזיקה ישראלית
      </h2>
      
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-lg w-full mb-6 border-2 border-primary/20">
        <p className="text-xl font-medium mb-6 text-center">{question.question}</p>
        
        <div className="grid grid-cols-1 gap-4">
          {question.options.map((option, index) => (
            <div key={index} className="relative">
              <AppButton
                variant={selectedAnswer === index ? 'primary' : 'secondary'}
                className={`w-full justify-start px-4 py-3 ${
                  answered && index !== question.correctAnswerIndex && selectedAnswer === index
                    ? 'bg-red-100 border-red-500'
                    : ''
                } ${
                  answered && index === question.correctAnswerIndex
                    ? 'bg-green-100 border-green-500'
                    : ''
                } ${answered && selectedAnswer !== index ? 'opacity-70' : ''}`}
                onClick={() => handleSelectAnswer(index)}
                disabled={answered || timeUp}
              >
                {option}
                
                {answered && index === question.correctAnswerIndex && (
                  <CheckCircle2 className="ml-auto text-green-500" />
                )}
                
                {answered && selectedAnswer === index && index !== question.correctAnswerIndex && (
                  <XCircle className="ml-auto text-red-500" />
                )}
              </AppButton>
              
              {selectedAnswer === index && showAnswerConfirmation && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-500 text-white px-2 py-1 rounded-md animate-fade-in">
                  ✓ הבחירה שלך נקלטה!
                </div>
              )}
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
