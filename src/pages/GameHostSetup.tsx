
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Music } from 'lucide-react';
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

const GameHostSetup: React.FC = () => {
  const location = useLocation();
  const gameMode = location.state?.gameMode || 'local';
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

  const { players } = usePlayerManagement({
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
      setGameData({ 
        gameCode, 
        playerName: hostName || 'מנחה', 
        isHost: true
      });
      
      // Here we should separately update the game state in the database
      // with the game_mode, but we're not modifying the GameState interface
    }
  }, [contextGameCode, gameCode, hostName, setGameData, gameMode]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-accent/10 flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <MusicNote type="note1" className="absolute top-[10%] right-[15%] opacity-20" size={36} animation="float" color="#6446D0" />
        <MusicNote type="note4" className="absolute bottom-[15%] left-[15%] opacity-20" size={32} animation="float-alt" color="#FFC22A" />
      </div>

      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col relative z-10 max-w-md">
        <div className="w-full flex flex-col items-center">
          <div className="mb-8 text-center relative w-full">
            <Link to="/" className="block mb-2">
              <h1 className="text-3xl font-bold text-primary inline-flex items-center gap-2">
                <Music className="h-6 w-6" />
                שיר על הדרך
              </h1>
            </Link>
            <h2 className="text-lg text-gray-600">מסך מנהל המשחק</h2>
            
            <div className="absolute top-0 right-0">
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
          />

          <PlayersList players={players} />

          <div className="w-full space-y-4 mt-2">
            <AppButton 
              variant="primary" 
              size="lg" 
              onClick={startGame} 
              disabled={gameStarted || startGameDisabled}
            >
              {gameStarted ? "המשחק כבר התחיל" : 
               startGameDisabled ? "יש להצטרף כמנחה תחילה" : "התחל משחק"}
            </AppButton>
            {startGameDisabled && !hostJoined && (
              <p className="text-sm text-center text-amber-600 mt-1">
                יש להצטרף כמנחה לפני התחלת המשחק
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHostSetup;
