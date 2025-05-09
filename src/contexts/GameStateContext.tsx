import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStateSubscription } from '@/hooks/useGameStateSubscription';
import GameEndOverlay from '@/components/GameEndOverlay';
import { useGamePhaseNavigation } from '@/hooks/useGamePhaseNavigation';
import { toast } from 'sonner';

type GamePhase = 'waiting' | 'playing' | 'answering' | 'results' | 'end';

export interface GameSettings {
  scoreLimit: number | null; // null means no limit
  gameDuration: number | null; // in minutes, null means no time limit
  songFilter?: "all" | "mashina" | "adam" | "gefen" | "skaat";
}

interface GameStateContextType {
  gameCode: string | null;
  playerName: string | null;
  gamePhase: GamePhase | null;
  isHost: boolean;
  setGameData: (data: { gameCode: string; playerName: string; isHost?: boolean }) => void;
  clearGameData: () => void;
  answerTimeLimit: number;
  gameSettings: GameSettings;
  updateGameSettings: (settings: GameSettings) => void;
}

// Create default context values to prevent "undefined" errors
const defaultContextValues: GameStateContextType = {
  gameCode: null,
  playerName: null,
  gamePhase: null,
  isHost: false,
  setGameData: () => {},
  clearGameData: () => {},
  answerTimeLimit: 30,
  gameSettings: { scoreLimit: null, gameDuration: null },
  updateGameSettings: () => {}
};

// Create and export the context with default values
export const GameStateContext = createContext<GameStateContextType>(defaultContextValues);

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
  const previousGamePhaseRef = useRef<GamePhase | null>(null);
  const answerTimeLimit = 30; // Increased from 21 to 30 seconds to give more time to answer
  
  const [gameSettings, setGameSettings] = useState<GameSettings>(() => {
    const savedSettings = localStorage.getItem('gameSettings');
    return savedSettings 
      ? JSON.parse(savedSettings) 
      : { scoreLimit: null, gameDuration: null };
  });
  
  const updateGameSettings = (settings: GameSettings) => {
    setGameSettings(settings);
    localStorage.setItem('gameSettings', JSON.stringify(settings));
  };
  
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

  useEffect(() => {
    if (previousGamePhaseRef.current !== gamePhase) {
      console.log(`Game phase changed: ${previousGamePhaseRef.current} -> ${gamePhase}`);
      previousGamePhaseRef.current = gamePhase;
      
      if (gamePhase === 'end' && !isHost) {
        toast('סיבוב הסתיים', {
          description: 'המארח מציג את טבלת המובילים',
        });
      }
    }
  }, [gamePhase, isHost]);

  useGameStateSubscription({
    gameCode,
    isHost,
    setGamePhase,
    setHostReady,
    clearGameData,
    navigate,
    gameSettings
  });

  const { isRedirecting } = useGamePhaseNavigation({
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
        answerTimeLimit,
        gameSettings,
        updateGameSettings
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
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};
