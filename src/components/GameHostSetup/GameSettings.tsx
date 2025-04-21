
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { GameSettings as GameSettingsType } from '@/contexts/GameStateContext';
import { Users, User, Music } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface CategoryOption {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const categories: CategoryOption[] = [
  { id: 'all', name: 'הכל', icon: <Music className="h-4 w-4" /> },
  { id: 'adam', name: 'עומר אדם', icon: <User className="h-4 w-4" /> },
  { id: 'mashina', name: 'משינה', icon: <Users className="h-4 w-4" /> },
];

type GameSettingsProps = {
  settings: GameSettingsType;
  onSettingsChange: (settings: GameSettingsType) => void;
  disabled?: boolean;
};

const GameSettings: React.FC<GameSettingsProps> = ({
  settings,
  onSettingsChange,
  disabled = false,
}) => {
  const handleChangeScoreLimit = (value: number) => {
    onSettingsChange({ ...settings, scoreLimit: value });
  };

  const handleChangeGameDuration = (value: number) => {
    onSettingsChange({ ...settings, gameDuration: value });
  };

  const handleChangeAnswerTimeLimit = (value: number) => {
    onSettingsChange({ ...settings, answerTimeLimit: value });
  };

  const handleCategoryChange = (value: string) => {
    onSettingsChange({ ...settings, category: value });
  };

  return (
    <div className="w-full space-y-4 p-4 bg-white/70 backdrop-blur-sm rounded-lg shadow-sm mb-4">
      <h3 className="text-lg font-semibold text-primary mb-2">הגדרות משחק</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="category">קטגוריה</Label>
          <ToggleGroup
            type="single"
            value={settings.category || 'all'}
            onValueChange={handleCategoryChange}
            disabled={disabled}
            className="justify-center"
          >
            {categories.map((category) => (
              <ToggleGroupItem
                key={category.id}
                value={category.id}
                aria-label={`קטגוריה ${category.name}`}
                disabled={disabled}
                className="flex items-center gap-1 px-3"
              >
                {category.icon}
                <span>{category.name}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="scoreLimit">מגבלת ניקוד</Label>
            <span className="text-sm font-medium">{settings.scoreLimit}</span>
          </div>
          <Slider
            id="scoreLimit"
            min={20}
            max={200}
            step={10}
            value={[settings.scoreLimit]}
            onValueChange={(values) => handleChangeScoreLimit(values[0])}
            disabled={disabled}
          />
          <p className="text-xs text-gray-500">המשחק מסתיים כאשר שחקן מגיע לניקוד זה</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="gameDuration">זמן משחק (דקות)</Label>
            <span className="text-sm font-medium">{settings.gameDuration}</span>
          </div>
          <Slider
            id="gameDuration"
            min={5}
            max={60}
            step={5}
            value={[settings.gameDuration]}
            onValueChange={(values) => handleChangeGameDuration(values[0])}
            disabled={disabled}
          />
          <p className="text-xs text-gray-500">המשחק מסתיים אחרי זמן זה</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="answerTimeLimit">זמן לתשובה (שניות)</Label>
            <span className="text-sm font-medium">{settings.answerTimeLimit}</span>
          </div>
          <Slider
            id="answerTimeLimit"
            min={10}
            max={60}
            step={5}
            value={[settings.answerTimeLimit]}
            onValueChange={(values) => handleChangeAnswerTimeLimit(values[0])}
            disabled={disabled}
          />
          <p className="text-xs text-gray-500">זמן מקסימלי לענות על שאלה</p>
        </div>
      </div>
    </div>
  );
};

export default GameSettings;
