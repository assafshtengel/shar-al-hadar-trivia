
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface GameSettings {
  scoreLimit: number;
  gameDuration: number;
  answerTimeLimit: number;
  category?: string;
}

interface GameData {
  gameCode: string | null;
  playerName: string | null;
  isHost: boolean;
  gameSettings: GameSettings;
  gamePhase: string | null;
  hostReady: boolean;
}

interface GameStateContextType {
  gameCode: string | null;
  playerName: string | null;
  isHost: boolean;
  gameSettings: GameSettings;
  gamePhase: string | null;
  hostReady: boolean;
  scoreLimit: number;
  gameDuration: number;
  answerTimeLimit: number;
  category?: string;
  setGameData: (data: Partial<GameData>) => void;
  updateGameSettings: (settings: GameSettings) => void;
  setGamePhase: (phase: string | null) => void;
  setHostReady: (ready: boolean) => void;
  clearGameData: () => void;
}

const defaultSettings: GameSettings = {
  scoreLimit: 100,
  gameDuration: 20,
  answerTimeLimit: 30,
  category: 'all'
};

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export const GameStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [gameSettings, setGameSettings] = useState<GameSettings>(defaultSettings);
  const [gamePhase, setGamePhase] = useState<string | null>(null);
  const [hostReady, setHostReady] = useState(false);

  const setGameData = (data: Partial<GameData>) => {
    if (data.gameCode !== undefined) setGameCode(data.gameCode);
    if (data.playerName !== undefined) setPlayerName(data.playerName);
    if (data.isHost !== undefined) setIsHost(data.isHost);
    if (data.gameSettings !== undefined) setGameSettings(data.gameSettings);
    if (data.gamePhase !== undefined) setGamePhase(data.gamePhase);
    if (data.hostReady !== undefined) setHostReady(data.hostReady);
  };

  const updateGameSettings = (settings: GameSettings) => {
    setGameSettings(settings);
  };

  const clearGameData = () => {
    setGameCode(null);
    setPlayerName(null);
    setIsHost(false);
    setGameSettings(defaultSettings);
    setGamePhase(null);
    setHostReady(false);
  };

  return (
    <GameStateContext.Provider
      value={{
        gameCode,
        playerName,
        isHost,
        gameSettings,
        gamePhase,
        hostReady,
        scoreLimit: gameSettings.scoreLimit,
        gameDuration: gameSettings.gameDuration,
        answerTimeLimit: gameSettings.answerTimeLimit,
        category: gameSettings.category,
        setGameData,
        updateGameSettings,
        setGamePhase,
        setHostReady,
        clearGameData,
      }}
    >
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
