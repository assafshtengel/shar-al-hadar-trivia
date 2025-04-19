import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Music, ExternalLink } from 'lucide-react';
import AppButton from '@/components/AppButton';
import MusicNote from '@/components/MusicNote';
import { useGameState } from '@/contexts/GameStateContext';
import EndGameButton from '@/components/EndGameButton';
import PlayersList from '@/components/GameHostSetup/PlayersList';
import GameCodeDisplay from '@/components/GameHostSetup/GameCodeDisplay';
import HostJoinForm from '@/components/GameHostSetup/HostJoinForm';
import { useHostJoin } from '@/hooks/useHostJoin';
import { useGameStart } from '@/hooks/useGameStart';
import { usePlayerManagement } from '@/hooks/usePlayerManagement';
import LeaveGameButton from '@/components/LeaveGameButton';

const GameHostSetup: React.FC = () => {
  const { gameCode: contextGameCode, setGameData, playerName: contextPlayerName } = useGameState();
  const [gameCode] = React.useState(() => contextGameCode || Math.floor(100000 + Math.random() * 900000).toString());
  
  const {
    hostName,
    setHostName,
    hostJoined,
    setHostJoined,
    joinLoading,
    handleHostJoin,
    startGameDisabled,
    setStartGameDisabled
  } = useHostJoin({
    gameCode,
    setGameData,
    playerName: contextPlayerName
  });

  const { 
    players, 
    playerLimitReached 
  } = usePlayerManagement({
    gameCode,
    playerName: contextPlayerName,
    setHostJoined,
    setStartGameDisabled
  });

  const { gameStarted, startGame } = useGameStart({
    gameCode,
    players,
    hostJoined
  });

  useEffect(() => {
    if (!contextGameCode) {
      setGameData({ gameCode, playerName: hostName || 'מנחה', isHost: true });
    }
  }, [contextGameCode, gameCode, hostName, setGameData]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-accent/10 flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <MusicNote type="note1" className="absolute top-[10%] right-[15%] opacity-20" size={36} animation="float" color="#6446D0" />
        <MusicNote type="note4" className="absolute bottom-[15%] left-[15%] opacity-20" size={32} animation="float-alt" color="#FFC22A" />
      </div>

      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col relative z-10 max-w-md">
        <div className="w-full flex flex-col items-center">
          <div className="mb-8 text-center relative w-full">
            <Link 
              to="/" 
              className="block mb-2 group transition-all duration-300 hover:scale-105"
            >
              <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md hover:shadow-lg">
                <Music className="h-6 w-6 text-primary group-hover:rotate-12 transition-transform" />
                <h1 className="text-3xl font-bold text-primary">שיר על הדרך</h1>
                <ExternalLink className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
            <h2 className="text-lg text-gray-600 mt-2">מסך מנהל המשחק</h2>
            
            <div className="absolute top-0 right-0 flex items-center gap-2">
              <LeaveGameButton gameCode={gameCode} />
              <EndGameButton gameCode={gameCode} />
            </div>
          </div>

          <GameCodeDisplay gameCode={gameCode} />
          
          <HostJoinForm 
            hostName={hostName}
            setHostName={setHostName}
            handleHostJoin={handleHostJoin}
            hostJoined={hostJoined}
            joinLoading={joinLoading}
            playerLimitReached={playerLimitReached}
          />

          <PlayersList players={players} />

          <div className="w-full space-y-4 mt-2">
            <AppButton 
              variant="primary" 
              size="lg" 
              onClick={startGame} 
              disabled={gameStarted || startGameDisabled || playerLimitReached}
            >
              {playerLimitReached ? "המשחק מלא" : 
               gameStarted ? "המשחק כבר התחיל" : 
               startGameDisabled ? "יש להצטרף כמנחה תחילה" : "התחל משחק"}
            </AppButton>
            {(startGameDisabled && !hostJoined || playerLimitReached) && (
              <p className="text-sm text-center text-amber-600 mt-1">
                {playerLimitReached ? "המשחק מלא" : "יש להצטרף כמנחה לפני התחלת המשחק"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHostSetup;
