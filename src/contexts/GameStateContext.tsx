
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStateSubscription } from '@/hooks/useGameStateSubscription';
import GameEndOverlay from '@/components/GameEndOverlay';
import { useGamePhaseNavigation } from '@/hooks/useGamePhaseNavigation';

export type GamePhase = 'waiting' | 'playing' | 'answering' | 'results' | 'end';

export interface GameStateContextType {
  gameCode: string | null;
  playerName: string | null;
  gamePhase: GamePhase | null;
  isHost: boolean;
  setGameData: (data: { gameCode: string; playerName: string; isHost?: boolean }) => void;
  clearGameData: () => void;
  setGamePhase: (phase: GamePhase | null) => void;
  setHostReady: (ready: boolean) => void;
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
    console.log("Clearing game data");
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

  // Use a separate hook for game phase navigation logic
  useGamePhaseNavigation({
    gamePhase,
    isHost,
    clearGameData
  });

  return (
    <GameStateContext.Provider
      value={{
        gameCode,
        playerName,
        gamePhase,
        isHost,
        setGameData,
        clearGameData,
        setGamePhase,
        setHostReady
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
