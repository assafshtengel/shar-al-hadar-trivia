
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, checkPlayerExists } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UsePlayerManagementParams {
  gameCode: string | null;
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
  const channelRef = useRef<RealtimeChannel | null>(null);
  const hostCheckCompletedRef = useRef<boolean>(false);
  const updatingPlayerRef = useRef<boolean>(false);
  const lastUpdateIdRef = useRef<string | null>(null);
  const fetchingPlayersRef = useRef<boolean>(false);
  const channelName = `players-changes-${gameCode}`;

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

  const handlePlayerChange = useCallback((payload: any) => {
    if (!payload || updatingPlayerRef.current) {
      return;
    }

    if (payload.eventType === 'INSERT') {
      setPlayers((prevPlayers) => {
        const newPlayer = payload.new as Player;
        if (prevPlayers.some(p => p.id === newPlayer.id)) {
          return prevPlayers;
        }
        return [...prevPlayers, newPlayer];
      });
    } else if (payload.eventType === 'UPDATE') {
      setPlayers((prevPlayers) => 
        prevPlayers.map(player => 
          player.id === payload.new.id ? { ...player, ...payload.new } : player
        )
      );
    } else if (payload.eventType === 'DELETE' && payload.old?.id) {
      setPlayers((prevPlayers) => 
        prevPlayers.filter(player => player.id !== payload.old.id)
      );
    }
  }, []);

  useEffect(() => {
    if (!gameCode) return;
    
    if (channelRef.current) return;

    console.log(`Setting up player tracking for ${channelName}`);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `game_code=eq.${gameCode}`
        },
        handlePlayerChange
      )
      .subscribe();

    channelRef.current = channel;

    if (!hostCheckCompletedRef.current) {
      fetchPlayers();
    }

    return () => {
      console.log('Cleaning up players subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [gameCode, handlePlayerChange, fetchPlayers]);

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
      setTimeout(() => {
        lastUpdateIdRef.current = null;
      }, 1000);
    }
  }, []);

  return { players, updatePlayer };
};
