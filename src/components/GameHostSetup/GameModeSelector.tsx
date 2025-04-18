
import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Users, Globe } from 'lucide-react';

interface GameModeSelectorProps {
  selectedMode: 'local' | 'remote';
  onModeChange: (mode: 'local' | 'remote') => void;
  disabled?: boolean;
}

const GameModeSelector: React.FC<GameModeSelectorProps> = ({ selectedMode, onModeChange, disabled }) => {
  const handleOptionClick = (mode: 'local' | 'remote') => {
    if (!disabled) {
      onModeChange(mode);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg transition-all duration-300 hover:shadow-xl">
      <h3 className="text-xl font-bold mb-4 text-center text-primary/80">בחר מצב משחק</h3>
      <RadioGroup
        value={selectedMode}
        onValueChange={(value: 'local' | 'remote') => handleOptionClick(value)}
        disabled={disabled}
        className="flex flex-col gap-4"
      >
        <div 
          className={`
            flex items-center space-x-4 space-x-reverse 
            border-2 border-transparent 
            rounded-xl p-4 
            transition-all duration-300 cursor-pointer
            ${selectedMode === 'local' 
              ? 'bg-primary/10 border-primary/30 shadow-sm' 
              : 'bg-gray-100/50 hover:bg-primary/5'
            }
          `}
          onClick={() => handleOptionClick('local')}
          role="button"
          aria-pressed={selectedMode === 'local'}
        >
          <RadioGroupItem value="local" id="local" className="cursor-pointer" />
          <Label 
            htmlFor="local" 
            className="flex items-center gap-4 cursor-pointer w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-primary/20 p-3 rounded-full">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-primary/90">משחק קרוב</div>
              <p className="text-sm text-gray-600">כל המשתתפים נמצאים באותו מקום</p>
            </div>
          </Label>
        </div>
        <div 
          className={`
            flex items-center space-x-4 space-x-reverse 
            border-2 border-transparent 
            rounded-xl p-4 
            transition-all duration-300 cursor-pointer
            ${selectedMode === 'remote' 
              ? 'bg-accent/10 border-accent/30 shadow-sm' 
              : 'bg-gray-100/50 hover:bg-accent/5'
            }
          `}
          onClick={() => handleOptionClick('remote')}
          role="button"
          aria-pressed={selectedMode === 'remote'}
        >
          <RadioGroupItem value="remote" id="remote" className="cursor-pointer" />
          <Label 
            htmlFor="remote" 
            className="flex items-center gap-4 cursor-pointer w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-accent/20 p-3 rounded-full">
              <Globe className="h-6 w-6 text-accent" />
            </div>
            <div>
              <div className="font-semibold text-accent/90">משחק מרוחק</div>
              <p className="text-sm text-gray-600">המשתתפים נמצאים במקומות שונים</p>
            </div>
          </Label>
        </div>
      </RadioGroup>
      {disabled && (
        <div className="text-sm text-gray-500 text-center mt-4">
          יש להצטרף כמנחה כדי לשנות את מצב המשחק
        </div>
      )}
    </div>
  );
};

export default GameModeSelector;
