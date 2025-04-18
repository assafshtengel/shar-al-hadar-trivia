
import { useState, useEffect, useRef, useCallback } from 'react';
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
  hasAnswered?: boolean;
  isReady?: boolean;
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
  const fetchingPlayersRef = useRef<boolean>(false);
  const updatingPlayerRef = useRef<boolean>(false);
  const lastUpdateIdRef = useRef<string | null>(null);
  
  // Initial host check
  const checkHostJoined = useCallback(async () => {
    if (hostCheckCompletedRef.current || !playerName || !gameCode) return;
    
    console.log(`Checking if host ${playerName} has already joined game ${gameCode}`);
    hostCheckCompletedRef.current = true;
    
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
    } catch (err) {
      console.error('Error checking if host joined:', err);
    }
  }, [gameCode, playerName, setHostJoined, setStartGameDisabled]);

  // Initial players fetch
  const fetchPlayers = useCallback(async () => {
    if (!gameCode || fetchingPlayersRef.current) return;
    console.log('Initial players fetch starting');
    
    fetchingPlayersRef.current = true;
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
        console.log('Initial players fetch completed:', data);
        setPlayers(data);
        
        if (playerName && data.some(player => player.name === playerName)) {
          console.log(`Host ${playerName} found in players list, enabling start game`);
          setHostJoined(true);
          setStartGameDisabled(false);
          hostCheckCompletedRef.current = true;
        }
      }
    } finally {
      fetchingPlayersRef.current = false;
      console.log('Initial players fetch completed');
    }
  }, [gameCode, playerName, setHostJoined, setStartGameDisabled]);

  // Host check effect - runs once
  useEffect(() => {
    console.log('Starting host check effect');
    if (!hostCheckCompletedRef.current) {
      checkHostJoined();
    }
    return () => {
      console.log('Cleaning up host check effect');
    };
  }, [checkHostJoined]);

  // Main subscription effect
  useEffect(() => {
    if (!gameCode) {
      console.error('No game code provided to usePlayerManagement');
      return;
    }

    console.log('Setting up player tracking for game:', gameCode);
    let isMounted = true;
    
    // Initial fetch only if not already fetching
    if (!fetchingPlayersRef.current) {
      fetchPlayers();
    }

    // Clean up any existing channel
    if (channelRef.current) {
      console.log('Removing existing players channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelId = `players-changes-${gameCode}-${Date.now()}`;
    console.log(`Creating new player channel: ${channelId}`);
    
    // Set up realtime subscription with optimized handlers
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `game_code=eq.${gameCode}`
        },
        (payload) => {
          if (!isMounted) {
            console.log('Component unmounted, ignoring player change');
            return;
          }

          // Skip if this update was triggered by our own code
          if (lastUpdateIdRef.current === payload.new?.id) {
            console.log('Skipping own update:', payload.new?.id);
            return;
          }
          
          console.log('Player change detected:', payload);
          
          // Handle different event types with local state updates
          if (payload.eventType === 'INSERT') {
            setPlayers((prevPlayers) => {
              const newPlayer = payload.new as Player;
              if (prevPlayers.some(p => p.id === newPlayer.id)) {
                return prevPlayers;
              }
              return [...prevPlayers, newPlayer];
            });
            
            if (playerName && payload.new.name === playerName) {
              console.log(`Host ${playerName} joined through realtime, enabling start game`);
              setHostJoined(true);
              setStartGameDisabled(false);
              hostCheckCompletedRef.current = true;
            }
          } else if (payload.eventType === 'UPDATE') {
            setPlayers((prevPlayers) => 
              prevPlayers.map(player => 
                player.id === payload.new.id ? { ...player, ...payload.new } : player
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setPlayers((prevPlayers) => 
              prevPlayers.filter(player => player.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Players subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      console.log('Cleaning up players subscription');
      isMounted = false;
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [gameCode, playerName, fetchPlayers, setHostJoined, setStartGameDisabled]);

  const updatePlayer = useCallback(async (playerId: string, updates: Partial<Player>) => {
    if (updatingPlayerRef.current) {
      console.log('Update already in progress, skipping');
      return;
    }

    try {
      updatingPlayerRef.current = true;
      lastUpdateIdRef.current = playerId;

      const { error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', playerId);

      if (error) {
        console.error('Error updating player:', error);
        throw error;
      }
    } finally {
      updatingPlayerRef.current = false;
      // Reset lastUpdateId after a delay to ensure we catch the realtime update
      setTimeout(() => {
        lastUpdateIdRef.current = null;
      }, 1000);
    }
  }, []);

  return { players, updatePlayer };
};

