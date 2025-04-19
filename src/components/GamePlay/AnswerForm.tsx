
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';

interface AnswerFormProps {
  answer: string;
  setAnswer: (answer: string) => void;
  onSubmit: () => void;
  hasAnswered: boolean;
  isSubmitting: boolean;
  disabled: boolean;
}

const AnswerForm: React.FC<AnswerFormProps> = ({
  answer,
  setAnswer,
  onSubmit,
  hasAnswered,
  isSubmitting,
  disabled
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || hasAnswered || isSubmitting || disabled) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="bg-card rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3">מה שם השיר?</h2>
        
        <div className="flex gap-2">
          <Input
            placeholder="הקלד את שם השיר..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={hasAnswered || isSubmitting || disabled}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!answer.trim() || hasAnswered || isSubmitting || disabled}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {hasAnswered && (
          <p className="text-sm text-green-600 mt-2">תשובתך נשלחה!</p>
        )}
        
        {disabled && !hasAnswered && (
          <p className="text-sm text-muted-foreground mt-2">זמן התשובות הסתיים</p>
        )}
      </div>
    </form>
  );
};

export default AnswerForm;
