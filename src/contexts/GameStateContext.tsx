
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStateSubscription } from '@/hooks/useGameStateSubscription';
import GameEndOverlay from '@/components/GameEndOverlay';
import { useGamePhaseNavigation } from '@/hooks/useGamePhaseNavigation';
import { toast } from 'sonner';

type GamePhase = 'waiting' | 'playing' | 'answering' | 'results' | 'end';

interface GameStateContextType {
  gameCode: string | null;
  playerName: string | null;
  gamePhase: GamePhase | null;
  isHost: boolean;
  setGameData: (data: { gameCode: string; playerName: string; isHost?: boolean }) => void;
  clearGameData: () => void;
  answerTimeLimit: number;
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
  const previousGamePhaseRef = useRef<GamePhase | null>(null);
  const answerTimeLimit = 21; // Set answer time limit in seconds

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
        toast('המשחק הסתיים', {
          description: 'המארח סיים את המשחק',
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
    navigate
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
        answerTimeLimit
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
