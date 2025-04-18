
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
  const handleLocalClick = () => {
    if (!disabled) {
      onModeChange('local');
    }
  };

  const handleRemoteClick = () => {
    if (!disabled) {
      onModeChange('remote');
    }
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-6 shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-center">בחר מצב משחק</h3>
      <RadioGroup
        value={selectedMode}
        onValueChange={(value: 'local' | 'remote') => onModeChange(value)}
        disabled={disabled}
        className="flex flex-col gap-4"
      >
        <div 
          className={`flex items-center space-x-4 space-x-reverse cursor-pointer rounded-md p-2 transition-colors ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-100'}`}
          onClick={handleLocalClick}
        >
          <RadioGroupItem value="local" id="local" disabled={disabled} />
          <Label htmlFor="local" className="flex items-center gap-2 cursor-pointer w-full">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium">משחק קרוב</div>
              <p className="text-sm text-gray-500">כל המשתתפים נמצאים באותו מקום</p>
            </div>
          </Label>
        </div>
        <div 
          className={`flex items-center space-x-4 space-x-reverse cursor-pointer rounded-md p-2 transition-colors ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-100'}`}
          onClick={handleRemoteClick}
        >
          <RadioGroupItem value="remote" id="remote" disabled={disabled} />
          <Label htmlFor="remote" className="flex items-center gap-2 cursor-pointer w-full">
            <Globe className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium">משחק מרוחק</div>
              <p className="text-sm text-gray-500">המשתתפים נמצאים במקומות שונים</p>
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default GameModeSelector;
