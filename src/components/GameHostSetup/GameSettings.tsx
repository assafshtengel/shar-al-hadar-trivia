import React, { useState } from 'react';
import { Settings, Trophy, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { GameSettings as GameSettingsType } from '@/contexts/GameStateContext';
interface GameSettingsProps {
  settings: GameSettingsType;
  onSettingsChange: (settings: GameSettingsType) => void;
  disabled?: boolean;
}
const GameSettings: React.FC<GameSettingsProps> = ({
  settings,
  onSettingsChange,
  disabled = false
}) => {
  const [showScoreLimit, setShowScoreLimit] = useState(!!settings.scoreLimit);
  const [showTimeLimit, setShowTimeLimit] = useState(!!settings.gameDuration);
  const handleScoreLimitToggle = (checked: boolean) => {
    setShowScoreLimit(checked);
    onSettingsChange({
      ...settings,
      scoreLimit: checked ? 100 : null
    });
  };
  const handleTimeLimitToggle = (checked: boolean) => {
    setShowTimeLimit(checked);
    onSettingsChange({
      ...settings,
      gameDuration: checked ? 20 : null
    });
  };
  const handleScoreLimitChange = (value: string) => {
    onSettingsChange({
      ...settings,
      scoreLimit: parseInt(value)
    });
  };
  const handleTimeLimitChange = (value: string) => {
    onSettingsChange({
      ...settings,
      gameDuration: parseInt(value)
    });
  };
  return <div className="backdrop-blur-sm rounded-xl p-4 mb-4 shadow-md bg-violet-500">
      <div className="flex items-center mb-3 gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium text-zinc-50">הגדרות משחק</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Trophy className="h-4 w-4 text-amber-500" />
              <Label htmlFor="score-limit" className="bg-transparent">הגבלת ניקוד</Label>
            </div>
            <Switch id="enable-score" checked={showScoreLimit} onCheckedChange={handleScoreLimitToggle} disabled={disabled} />
          </div>
          
          {showScoreLimit && <div className="mt-2">
              <Select value={settings.scoreLimit?.toString() || "100"} onValueChange={handleScoreLimitChange} disabled={disabled}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="בחר ניקוד" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 נקודות</SelectItem>
                  <SelectItem value="100">100 נקודות</SelectItem>
                  <SelectItem value="150">150 נקודות</SelectItem>
                  <SelectItem value="200">200 נקודות</SelectItem>
                  <SelectItem value="300">300 נקודות</SelectItem>
                </SelectContent>
              </Select>
            </div>}
        </div>
        
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Clock className="h-4 w-4 text-blue-500" />
              <Label htmlFor="time-limit" className="bg-transparent">הגבלת זמן</Label>
            </div>
            <Switch id="enable-time" checked={showTimeLimit} onCheckedChange={handleTimeLimitToggle} disabled={disabled} />
          </div>
          
          {showTimeLimit && <div className="mt-2">
              <Select value={settings.gameDuration?.toString() || "20"} onValueChange={handleTimeLimitChange} disabled={disabled}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="בחר זמן" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 דקות</SelectItem>
                  <SelectItem value="15">15 דקות</SelectItem>
                  <SelectItem value="20">20 דקות</SelectItem>
                  <SelectItem value="30">30 דקות</SelectItem>
                  <SelectItem value="45">45 דקות</SelectItem>
                </SelectContent>
              </Select>
            </div>}
        </div>
      </div>
      
      <p className="text-xs mt-3 text-center text-zinc-50">
        מצב ברירת מחדל: משחק פתוח ללא הגבלות
      </p>
    </div>;
};
export default GameSettings;