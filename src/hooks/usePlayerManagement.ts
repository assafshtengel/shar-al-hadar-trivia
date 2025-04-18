
import { useState, useEffect, useRef } from 'react';
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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const hostCheckCompletedRef = useRef<boolean>(false);

  // Check if host is already in the players list
  useEffect(() => {
    // Skip if already checked or if no playerName/gameCode
    if (hostCheckCompletedRef.current || !playerName || !gameCode) return;
    
    const checkHostJoined = async () => {
      try {
        const { exists } = await checkPlayerExists({ 
          game_code: gameCode, 
          player_name: playerName 
        });
        
        if (exists) {
          console.log(`Host ${playerName} already joined, enabling start game`);
          setHostJoined(true);
          setStartGameDisabled(false);
        }
        // Mark check as completed to prevent repeated calls
        hostCheckCompletedRef.current = true;
      } catch (err) {
        console.error('Error checking if host joined:', err);
        // Mark as completed even on error to avoid infinite retries
        hostCheckCompletedRef.current = true;
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
    
    let isMounted = true;
    let fetchingPlayers = false;
    
    // Initial fetch of current players
    const fetchPlayers = async () => {
      if (fetchingPlayers) return;
      
      fetchingPlayers = true;
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

        if (data && isMounted) {
          console.log('Fetched players:', data);
          setPlayers(data);
          
          // Check if host is already in the players list
          if (playerName && data.some(player => player.name === playerName)) {
            console.log(`Host ${playerName} found in players list, enabling start game`);
            setHostJoined(true);
            setStartGameDisabled(false);
            hostCheckCompletedRef.current = true;
          }
        }
      } catch (err) {
        console.error('Exception when fetching players:', err);
      } finally {
        fetchingPlayers = false;
      }
    };

    fetchPlayers();

    // Clean up any existing channel before creating a new one
    if (channelRef.current) {
      console.log('Removing existing players channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create a unique channel ID to avoid conflicts
    const channelId = `players-changes-${gameCode}-${Date.now()}`;
    console.log(`Creating new player channel: ${channelId}`);
    
    // Set up realtime subscription for ALL database changes to the players table
    const channel = supabase
      .channel(channelId)
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
          
          if (!isMounted) {
            console.log('Component unmounted, ignoring player change');
            return;
          }
          
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
              console.log(`Host ${playerName} joined through realtime, enabling start game`);
              setHostJoined(true);
              setStartGameDisabled(false);
              hostCheckCompletedRef.current = true;
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

    // Store the channel reference so we can clean it up properly
    channelRef.current = channel;

    return () => {
      console.log('Cleaning up players subscription');
      isMounted = false;
      fetchingPlayers = false;
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [gameCode, playerName, setHostJoined, setStartGameDisabled]);

  return { players };
};
