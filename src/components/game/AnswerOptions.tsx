
import React from 'react';
import AppButton from '@/components/AppButton';
import { Clock } from 'lucide-react';

interface AnswerOptionsProps {
  options: string[];
  timeRemaining: number;
  onAnswer: (answer: string) => void;
}

const AnswerOptions: React.FC<AnswerOptionsProps> = ({
  options,
  timeRemaining,
  onAnswer,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      <h2 className="text-2xl font-bold text-primary">מהו שם השיר?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        {options.map((option, index) => (
          <AppButton key={index} onClick={() => onAnswer(option)}>
            {option}
          </AppButton>
        ))}
      </div>
      <div className="flex items-center space-x-2 text-lg">
        <Clock className="text-gray-500" size={20} />
        <span>{timeRemaining}</span>
      </div>
    </div>
  );
};

export default AnswerOptions;
