
import React from 'react';
import { Users } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  game_code: string;
  joined_at: string | null;
  score: number | null;
}

interface PlayersListProps {
  players: Player[];
}

const PlayersList: React.FC<PlayersListProps> = ({ players }) => {
  return (
    <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-6 shadow-md">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">שחקנים שהצטרפו:</h3>
      </div>
      
      <div className="min-h-[120px] border border-gray-200 rounded-md p-2 bg-white">
        {players.length > 0 ? (
          <ul className="space-y-1">
            {players.map((player) => (
              <li key={player.id} className="py-2 px-3 bg-gray-50 rounded-md animate-fade-in flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{player.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            ממתין לשחקנים...
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayersList;
