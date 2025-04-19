
import React, { useEffect, useState } from 'react';
import { Users, Gamepad2 } from 'lucide-react';

const LiveStats = () => {
  const [stats, setStats] = useState({ games: 72, players: 290 });

  useEffect(() => {
    // Update stats every 30 seconds with random but realistic numbers
    const interval = setInterval(() => {
      const baseGames = 65; // Minimum number of games
      const basePlayers = 260; // Minimum number of players
      
      // Generate random numbers within a realistic range
      const randomGames = baseGames + Math.floor(Math.random() * 20);
      const randomPlayers = basePlayers + Math.floor(Math.random() * 60);
      
      setStats({
        games: randomGames,
        players: randomPlayers
      });
    }, 30000); // 30 seconds interval

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-accent/10 rounded-lg p-4 flex gap-8 justify-center items-center my-6">
      <div className="flex items-center gap-2">
        <Gamepad2 className="text-primary w-5 h-5" />
        <div className="text-center">
          <span className="font-bold text-xl text-primary">{stats.games}</span>
          <p className="text-sm text-gray-600">משחקים פעילים</p>
        </div>
      </div>
      <div className="w-px h-8 bg-gray-300"></div>
      <div className="flex items-center gap-2">
        <Users className="text-primary w-5 h-5" />
        <div className="text-center">
          <span className="font-bold text-xl text-primary">{stats.players}</span>
          <p className="text-sm text-gray-600">שחקנים מחוברים</p>
        </div>
      </div>
    </div>
  );
};

export default LiveStats;

