
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStateSubscription } from '@/hooks/useGameStateSubscription';
import GameEndOverlay from '@/components/GameEndOverlay';

type GamePhase = 'waiting' | 'playing' | 'answering' | 'results' | 'end';

interface GameStateContextType {
  gameCode: string | null;
  playerName: string | null;
  gamePhase: GamePhase | null;
  isHost: boolean;
  setGameData: (data: { gameCode: string; playerName: string; isHost?: boolean }) => void;
  clearGameData: () => void;
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export const GameStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState<string | null>(
    localStorage.getItem('gameCode') || null
  );
  const [playerName, setPlayerName] = useState<string | null>(
    localStorage.getItem('playerName') || null
  );
  const [gamePhase, setGamePhase] = useState<GamePhase | null>(null);
  const [isHost, setIsHost] = useState<boolean>(
    localStorage.getItem('isHost') === 'true'
  );
  const [hostReady, setHostReady] = useState<boolean>(false);

  const setGameData = (data: { gameCode: string; playerName: string; isHost?: boolean }) => {
    setGameCode(data.gameCode);
    setPlayerName(data.playerName);
    setIsHost(data.isHost || false);
    
    localStorage.setItem('gameCode', data.gameCode);
    localStorage.setItem('playerName', data.playerName);
    localStorage.setItem('isHost', (data.isHost || false).toString());
  };

  const clearGameData = () => {
    setGameCode(null);
    setPlayerName(null);
    setIsHost(false);
    setGamePhase(null);
    setHostReady(false);
    
    localStorage.removeItem('gameCode');
    localStorage.removeItem('playerName');
    localStorage.removeItem('isHost');
  };

  // Use the subscription hook to listen for game state changes
  useGameStateSubscription({
    gameCode,
    isHost,
    setGamePhase,
    setHostReady,
    clearGameData,
    navigate
  });

  // Handle navigation based on game phase
  useEffect(() => {
    if (!gamePhase) return;
    
    const handleGamePhaseNavigation = (phase: GamePhase, isHostReady: boolean, isInitial = false) => {
      const currentPath = window.location.pathname;

      switch (phase) {
        case 'waiting':
          if (currentPath !== '/waiting-room' && !isHost) {
            navigate('/waiting-room');
          } else if (isHost && currentPath !== '/host-setup' && isInitial) {
            navigate('/host-setup');
          }
          break;
        case 'playing':
        case 'answering':
        case 'results':
          // Only navigate to gameplay if host is ready or user is not the host
          if (!isHost || (isHost && isHostReady)) {
            if (currentPath !== '/gameplay') {
              navigate('/gameplay');
            }
          }
          break;
      }
    };

    // Handle initial navigation
    handleGamePhaseNavigation(gamePhase, hostReady, true);

    // Set up effect for future game phase changes
    const handlePhaseChange = () => {
      if (gamePhase) {
        handleGamePhaseNavigation(gamePhase, hostReady);
      }
    };

    handlePhaseChange();
  }, [gamePhase, hostReady, isHost, navigate]);

  return (
    <GameStateContext.Provider
      value={{
        gameCode,
        playerName,
        gamePhase,
        isHost,
        setGameData,
        clearGameData
      }}
    >
      <GameEndOverlay 
        isVisible={gamePhase === 'end'} 
        isHost={isHost} 
      />
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = (): GameStateContextType => {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};
