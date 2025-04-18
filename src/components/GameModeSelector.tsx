
import React from 'react';
import { MapPin, Globe } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export type GameMode = 'local' | 'remote';

interface GameModeSelectorProps {
  value: GameMode;
  onChange: (value: GameMode) => void;
}

const GameModeSelector = ({ value, onChange }: GameModeSelectorProps) => {
  return (
    <RadioGroup
      value={value}
      onValueChange={(value) => onChange(value as GameMode)}
      className="grid grid-cols-1 gap-4 my-6"
    >
      <Label
        htmlFor="local"
        className="flex items-start space-x-4 space-x-reverse border border-primary/20 rounded-lg p-4 cursor-pointer hover:bg-primary/5 transition-colors relative rtl"
      >
        <RadioGroupItem value="local" id="local" className="mt-1" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 text-primary">
            <MapPin className="w-5 h-5" />
            <span className="font-semibold">משחק קרוב</span>
          </div>
          <p className="text-sm text-gray-600">
            כל המשתתפים נמצאים באותו מקום
          </p>
        </div>
      </Label>

      <Label
        htmlFor="remote"
        className="flex items-start space-x-4 space-x-reverse border border-primary/20 rounded-lg p-4 cursor-pointer hover:bg-primary/5 transition-colors relative rtl"
      >
        <RadioGroupItem value="remote" id="remote" className="mt-1" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 text-primary">
            <Globe className="w-5 h-5" />
            <span className="font-semibold">משחק מרחוק</span>
          </div>
          <p className="text-sm text-gray-600">
            המשתתפים נמצאים במיקומים שונים
          </p>
        </div>
      </Label>
    </RadioGroup>
  );
};

export default GameModeSelector;
