
import { useState, useEffect } from 'react';
import { supabase, checkPlayerExists } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UsePlayerManagementParams {
  gameCode: string;
  playerName: string | null;
  setHostJoined: (joined: boolean) => void;
  setStartGameDisabled: (disabled: boolean) => void;
}

interface Player {
  id: string;
  name: string;
  game_code: string;
  joined_at: string | null;
  score: number | null;
  hasAnswered?: boolean; // Make sure this field is included
  isReady?: boolean; // Make sure this field is included
}

// Update the constant
const MAX_PLAYERS = 20;  // Changed from 6 to 20 players per game

export const usePlayerManagement = ({ 
  gameCode, 
  playerName, 
  setHostJoined, 
  setStartGameDisabled 
}: UsePlayerManagementParams) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerLimitReached, setPlayerLimitReached] = useState(false);

  // Check if host is already in the players list
  useEffect(() => {
    const checkHostJoined = async () => {
      if (playerName) {
        const { exists } = await checkPlayerExists({ 
          game_code: gameCode, 
          player_name: playerName 
        });
        
        if (exists) {
          console.log(`Host ${playerName} found in players table`);
          setHostJoined(true);
          setStartGameDisabled(false);
        }
      }
    };
    
    checkHostJoined();
  }, [playerName, gameCode, setHostJoined, setStartGameDisabled]);

  useEffect(() => {
    // Initial fetch of current players
    const fetchPlayers = async () => {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .eq('game_code', gameCode);

        if (error) {
          console.error('Error fetching players:', error);
          return;
        }

        if (data) {
          console.log('Fetched players:', data);
          setPlayers(data);
          
          // Check player limit
          const currentPlayerCount = data.length;
          const limitReached = currentPlayerCount >= MAX_PLAYERS;
          setPlayerLimitReached(limitReached);

          if (limitReached && !data.some(player => player.name === playerName)) {
            toast.error('מספר השחקנים המרבי הושג', {
              description: 'המשחק מלא. אנא המתן לסיבוב הבא.'
            });
          }
          
          // Check if host is already in the players list
          if (playerName && data.some(player => player.name === playerName)) {
            console.log(`Host ${playerName} found in initial players fetch`);
            setHostJoined(true);
            setStartGameDisabled(false);
          }
        }
      } catch (err) {
        console.error('Exception when fetching players:', err);
      }
    };

    fetchPlayers();

    // Set up realtime subscription for ALL database changes to the players table
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'players',
          filter: `game_code=eq.${gameCode}`
        },
        (payload) => {
          console.log('Player change detected:', payload);
          
          // Handle different event types
          if (payload.eventType === 'INSERT') {
            // Add new player to the list
            const currentPlayerCount = players.length;
            const limitReached = currentPlayerCount + 1 >= MAX_PLAYERS;
            setPlayerLimitReached(limitReached);

            if (limitReached) {
              toast.warning('המשחק מלא', {
                description: 'מספר השחקנים המרבי הושג.'
              });
            }

            setPlayers((prevPlayers) => [...prevPlayers, payload.new as Player]);
            
            // If the new player is the host, enable the start game button
            if (playerName && payload.new.name === playerName) {
              console.log(`Host ${playerName} added to players table (realtime)`);
              setHostJoined(true);
              setStartGameDisabled(false);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Update existing player in the list
            setPlayers((prevPlayers) => 
              prevPlayers.map(player => 
                player.id === payload.new.id ? { ...player, ...payload.new } : player
              )
            );
            
            // Log score updates to help track potential issues
            if (payload.old.score !== payload.new.score) {
              console.log(`Player ${payload.new.name} score changed: ${payload.old.score} -> ${payload.new.score}`);
            }
            
            // Log hasAnswered changes to debug potential issues
            if (payload.old.hasAnswered !== payload.new.hasAnswered) {
              console.log(`Player ${payload.new.name} hasAnswered changed: ${payload.old.hasAnswered} -> ${payload.new.hasAnswered}`);
            }
          } else if (payload.eventType === 'DELETE') {
            // Remove player from the list
            setPlayers((prevPlayers) => 
              prevPlayers.filter(player => player.id !== payload.old.id)
            );
            setPlayerLimitReached(false);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [gameCode, playerName, setHostJoined, setStartGameDisabled, players, setPlayerLimitReached]);

  // New function to reset player scores when a new game starts
  const resetPlayerScores = async () => {
    if (!gameCode) return;
    
    try {
      console.log('Resetting all player scores to 0');
      const { error } = await supabase
        .from('players')
        .update({ 
          score: 0,
          hasAnswered: false // Also reset hasAnswered flags
        })
        .eq('game_code', gameCode);
        
      if (error) {
        console.error('Error resetting player scores:', error);
      } else {
        console.log('All player scores reset to 0');
        
        // Update local state to reflect the score reset
        setPlayers(prevPlayers => 
          prevPlayers.map(player => ({ ...player, score: 0, hasAnswered: false }))
        );
      }
    } catch (err) {
      console.error('Exception when resetting player scores:', err);
    }
  };

  return { players, resetPlayerScores, playerLimitReached };
};
