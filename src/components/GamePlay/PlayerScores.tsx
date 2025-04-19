
import React from 'react';
import { Users, Trophy } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
}

interface PlayerScoresProps {
  players: Player[];
}

const PlayerScores: React.FC<PlayerScoresProps> = ({ players }) => {
  // Sort players by score (highest first)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-card rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center mb-3">
        <Users className="text-primary mr-2" size={18} />
        <h2 className="text-lg font-semibold">ניקוד שחקנים</h2>
      </div>
      
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => (
          <div 
            key={player.id} 
            className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
          >
            <div className="flex items-center">
              {index === 0 && sortedPlayers.length > 1 && player.score > 0 && (
                <Trophy className="text-yellow-500 mr-1" size={16} />
              )}
              <span className="font-medium">
                {player.name} {player.isHost && <span className="text-xs text-muted-foreground">(מנחה)</span>}
              </span>
            </div>
            <span className="font-bold text-primary">{player.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerScores;
