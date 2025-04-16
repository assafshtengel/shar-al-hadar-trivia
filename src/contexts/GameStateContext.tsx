
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
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
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

  useEffect(() => {
    if (!gameCode) return;

    console.log("Setting up game state monitoring for code:", gameCode);

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
        console.log("Creating initial game state for host");
        const { error: insertError } = await supabase
          .from('game_state')
          .insert([
            {
              game_code: gameCode,
              game_phase: 'waiting',
              current_round: 1,
              host_ready: false
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

    // הוספת hasAnswered לשחקנים אם לא קיים
    const updatePlayerSchema = async () => {
      if (isHost) {
        try {
          // בדיקה אם השדה כבר קיים לפני הוספה
          const { data: existingPlayers } = await supabase
            .from('players')
            .select('*')
            .eq('game_code', gameCode)
            .limit(1);
            
          if (existingPlayers && existingPlayers.length > 0) {
            // לא צריך לעדכן אם השדה כבר קיים
            if ('hasAnswered' in existingPlayers[0]) {
              console.log('hasAnswered field already exists');
              return;
            }
          }
          
          // עדכון השחקנים הקיימים להוסיף שדה hasAnswered
          const { error: updateError } = await supabase
            .from('players')
            .update({ hasAnswered: false })
            .eq('game_code', gameCode);
            
          if (updateError) {
            console.error('Error updating players schema:', updateError);
          } else {
            console.log('Updated players schema with hasAnswered field');
          }
        } catch (err) {
          console.error('Error checking or updating players schema:', err);
        }
      }
    };

    updatePlayerSchema();

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
            
            // Also update host_ready state
            if ('host_ready' in payload.new) {
              setHostReady(!!payload.new.host_ready);
            }
            
            handleGamePhaseNavigation(newPhase, !!payload.new.host_ready);
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
      .subscribe((status) => {
        console.log('Game state subscription status:', status);
      });

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
        console.log('Initial game state:', data);
        const currentPhase = data.game_phase as GamePhase;
        setGamePhase(currentPhase);
        
        // Also set host_ready state
        if ('host_ready' in data) {
          setHostReady(!!data.host_ready);
        }
        
        handleGamePhaseNavigation(currentPhase, !!data.host_ready, true);
      }
    };

    fetchGameState();

    return () => {
      console.log('Removing game state channel');
      supabase.removeChannel(channel);
    };
  }, [gameCode, isHost]);

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
      case 'end':
        if (!isHost && !isRedirecting) {
          setIsRedirecting(true);
          toast('המשחק הסתיים', {
            description: 'המשחק הסתיים על ידי המארח',
          });
          
          // Show message and redirect after delay
          const currentLocation = window.location.pathname;
          if (currentLocation !== '/') {
            const redirectTimer = setTimeout(() => {
              clearGameData();
              navigate('/');
              setIsRedirecting(false);
            }, 3000);
            
            return () => clearTimeout(redirectTimer);
          }
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
      {gamePhase === 'end' && !isHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md mx-auto animate-scale-in">
            <h2 className="text-2xl font-bold text-primary mb-4">המשחק הסתיים</h2>
            <p className="text-lg text-gray-700">
              המשחק הסתיים. תחזרו לדף הבית להתחיל משחק חדש
            </p>
          </div>
        </div>
      )}
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
