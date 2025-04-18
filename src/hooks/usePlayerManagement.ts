
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
}

export const usePlayerManagement = ({ 
  gameCode, 
  playerName, 
  setHostJoined, 
  setStartGameDisabled 
}: UsePlayerManagementParams) => {
  const [players, setPlayers] = useState<Player[]>([]);

  // Check if host is already in the players list
  useEffect(() => {
    const checkHostJoined = async () => {
      if (playerName) {
        const { exists } = await checkPlayerExists({ 
          game_code: gameCode, 
          player_name: playerName 
        });
        
        if (exists) {
          setHostJoined(true);
          setStartGameDisabled(false);
        }
      }
    };
    
    checkHostJoined();
  }, [playerName, gameCode, setHostJoined, setStartGameDisabled]);

  useEffect(() => {
    if (!gameCode) {
      console.error('No game code provided to usePlayerManagement');
      return;
    }

    console.log('Setting up player tracking for game:', gameCode);
    
    // Initial fetch of current players
    const fetchPlayers = async () => {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .eq('game_code', gameCode);

        if (error) {
          console.error('Error fetching players:', error);
          toast('שגיאה בטעינת השחקנים', {
            description: 'אירעה שגיאה בטעינת רשימת השחקנים',
          });
          return;
        }

        if (data) {
          console.log('Fetched players:', data);
          setPlayers(data);
          
          // Check if host is already in the players list
          if (playerName && data.some(player => player.name === playerName)) {
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
      .channel('players-changes')
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
            setPlayers((prevPlayers) => {
              const newPlayer = payload.new as Player;
              // Check if player already exists to avoid duplicates
              if (prevPlayers.some(p => p.id === newPlayer.id)) {
                return prevPlayers;
              }
              return [...prevPlayers, newPlayer];
            });
            
            // If the new player is the host, enable the start game button
            if (playerName && payload.new.name === playerName) {
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
          } else if (payload.eventType === 'DELETE') {
            // Remove player from the list
            setPlayers((prevPlayers) => 
              prevPlayers.filter(player => player.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Players subscription status:', status);
      });

    return () => {
      console.log('Cleaning up players subscription');
      supabase.removeChannel(channel);
    };
  }, [gameCode, playerName, setHostJoined, setStartGameDisabled]);

  return { players };
};
