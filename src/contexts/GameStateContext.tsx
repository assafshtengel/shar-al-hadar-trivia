import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    
    localStorage.removeItem('gameCode');
    localStorage.removeItem('playerName');
    localStorage.removeItem('isHost');
  };

  useEffect(() => {
    if (!gameCode) return;

    const checkGameState = async () => {
      const { data, error } = await supabase
        .from('game_state')
        .select('*')
        .eq('game_code', gameCode)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking game state:', error);
        return;
      }

      if (!data && isHost) {
        const { error: insertError } = await supabase
          .from('game_state')
          .insert([
            {
              game_code: gameCode,
              game_phase: 'waiting',
              current_round: 1
            }
          ]);

        if (insertError) {
          console.error('Error creating game state:', insertError);
          toast('שגיאה ביצירת מצב משחק', {
            description: 'אירעה שגיאה ביצירת מצב המשחק',
          });
        }
      }
    };

    checkGameState();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_state',
          filter: `game_code=eq.${gameCode}`
        },
        (payload) => {
          console.log('Game state change detected:', payload);
          
          if (payload.new && 'game_phase' in payload.new) {
            const newPhase = payload.new.game_phase as GamePhase;
            setGamePhase(newPhase);
            
            handleGamePhaseNavigation(newPhase);
          } else if (payload.eventType === 'DELETE') {
            if (!isHost) {
              toast('המשחק הסתיים', {
                description: 'המשחק הסתיים על ידי המארח',
              });
              clearGameData();
              navigate('/');
            }
          }
        }
      )
      .subscribe();

    const fetchGameState = async () => {
      const { data, error } = await supabase
        .from('game_state')
        .select('*')
        .eq('game_code', gameCode)
        .maybeSingle();

      if (error) {
        console.error('Error fetching game state:', error);
        return;
      }

      if (data && data.game_phase) {
        const currentPhase = data.game_phase as GamePhase;
        setGamePhase(currentPhase);
        handleGamePhaseNavigation(currentPhase, true);
      }
    };

    fetchGameState();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameCode, isHost]);

  const handleGamePhaseNavigation = (phase: GamePhase, isInitial = false) => {
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
        if (currentPath !== '/gameplay') {
          navigate('/gameplay');
        }
        break;
      case 'end':
        if (!isHost) {
          toast('המשחק הסתיים', {
            description: 'המשחק הסתיים על ידי המארח',
          });
          clearGameData();
          navigate('/');
        }
        break;
    }
  };

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
