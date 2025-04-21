
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStateSubscription } from '@/hooks/useGameStateSubscription';
import GameEndOverlay from '@/components/GameEndOverlay';
import { useGamePhaseNavigation } from '@/hooks/useGamePhaseNavigation';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type GamePhase = 'waiting' | 'playing' | 'answering' | 'results' | 'end';

export interface GameSettings {
  scoreLimit: number | null; // null means no limit
  gameDuration: number | null; // in minutes, null means no time limit
  songFilter?: "all" | "mashina" | "adam";
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

// Create and export the context
export const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

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

  // Track current game stats record ID to update end time and duration
  const currentGameStatsId = useRef<string | null>(null);

  // When phase changes, log start and end times in game_stats table
  useEffect(() => {
    if (previousGamePhaseRef.current !== gamePhase) {
      console.log(`Game phase changed: ${previousGamePhaseRef.current} -> ${gamePhase}`);

      // When game starts playing, create a stats record
      if (gamePhase === 'playing' && gameCode) {
        (async () => {
          // Count players currently in the game
          const { data: playersData, error: playersError } = await supabase
            .from('players')
            .select('id')
            .eq('game_code', gameCode);

          if (playersError) {
            console.error('Error fetching players count for game stats:', playersError);
            return;
          }

          const playerCount = playersData?.length || 0;

          const { data, error } = await supabase
            .from('game_stats')
            .insert({
              game_code: gameCode,
              started_at: new Date().toISOString(),
              players_count: playerCount,
            })
            .select('id')
            .single();
          
          if (error) {
            console.error('Error inserting game stats record:', error);
            return;
          }

          currentGameStatsId.current = data.id;
          console.log('Created game_stats record with id:', currentGameStatsId.current);
        })();
      }


      // When game ends, update the end time and duration in stats
      if (gamePhase === 'end' && currentGameStatsId.current) {
        (async () => {
          try {
            const endedAt = new Date().toISOString();

            // Fetch start time for duration calculation
            const { data: statsData, error: statsError } = await supabase
              .from('game_stats')
              .select('started_at')
              .eq('id', currentGameStatsId.current)
              .single();

            if (statsError) {
              console.error('Error fetching game stats start time:', statsError);
              return;
            }

            const startedAt = new Date(statsData.started_at);
            const endedAtDate = new Date(endedAt);
            const durationSeconds = Math.floor((endedAtDate.getTime() - startedAt.getTime()) / 1000);

            const { error: updateError } = await supabase
              .from('game_stats')
              .update({
                ended_at: endedAt,
                duration_seconds: durationSeconds
              })
              .eq('id', currentGameStatsId.current);

            if (updateError) {
              console.error('Error updating game stats end time and duration:', updateError);
            } else {
              console.log(`Updated game_stats record ${currentGameStatsId.current} with ended_at and duration_seconds`);
            }
          } catch (err) {
            console.error('Exception updating game stats end time:', err);
          }
        })();
      }

      previousGamePhaseRef.current = gamePhase;
    }
  }, [gamePhase, gameCode]);

  useEffect(() => {
    if (gamePhase === 'end' && !isHost) {
      toast('סיבוב הסתיים', {
        description: 'המארח מציג את טבלת המובילים',
      });
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
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};
