
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type GamePhase = 'waiting' | 'playing' | 'answering' | 'results' | 'end';

interface UseGameStateSubscriptionProps {
  gameCode: string | null;
  isHost: boolean;
  setGamePhase: (phase: GamePhase | null) => void;
  setHostReady: (ready: boolean) => void;
  clearGameData: () => void;
  navigate: (path: string) => void;
}

export const useGameStateSubscription = ({
  gameCode,
  isHost,
  setGamePhase,
  setHostReady,
  clearGameData,
  navigate
}: UseGameStateSubscriptionProps) => {
  
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
      }
    };

    fetchGameState();

    return () => {
      console.log('Removing game state channel');
      supabase.removeChannel(channel);
    };
  }, [gameCode, isHost, setGamePhase, setHostReady, clearGameData, navigate]);
};

