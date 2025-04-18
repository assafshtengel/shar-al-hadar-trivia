
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
  return (
    <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-6 shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-center">בחר מצב משחק</h3>
      <RadioGroup
        value={selectedMode}
        onValueChange={(value: 'local' | 'remote') => onModeChange(value)}
        disabled={disabled}
        className="flex flex-col gap-4"
      >
        <div className="flex items-center space-x-4 space-x-reverse">
          <RadioGroupItem value="local" id="local" />
          <Label htmlFor="local" className="flex items-center gap-2 cursor-pointer">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium">משחק קרוב</div>
              <p className="text-sm text-gray-500">כל המשתתפים נמצאים באותו מקום</p>
            </div>
          </Label>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <RadioGroupItem value="remote" id="remote" />
          <Label htmlFor="remote" className="flex items-center gap-2 cursor-pointer">
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
