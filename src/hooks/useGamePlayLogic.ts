
import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Song } from '@/data/songBank';

interface GameRound {
  correctSong: Song;
  options: Song[];
  correctAnswerIndex: number;
}

interface Player {
  name: string;
  score: number;
  skipsLeft: number;
  hasAnswered: boolean;
  isReady: boolean;
  pendingAnswer: number | null;
  lastAnswerCorrect?: boolean;
  lastScore?: number;
  lastAnswer?: string;
}

interface SupabasePlayer {
  id: string;
  name: string;
  score: number;
  game_code: string;
  hasAnswered?: boolean;
  isReady?: boolean;
}

interface UseGamePlayLogicProps {
  gameCode: string | null;
  playerName: string | null;
  isHost: boolean;
}

export const useGamePlayLogic = ({ gameCode, playerName, isHost }: UseGamePlayLogicProps) => {
  // This hook is a placeholder for future refactoring
  // You can extract the game logic from GamePlay.tsx into this hook
  
  const checkAllPlayersAnswered = useCallback(async () => {
    if (!gameCode) return false;
    const { data } = await supabase
      .from('players')
      .select('hasAnswered')
      .eq('game_code', gameCode);
    
    if (!data) return false;
    return data.every(player => player.hasAnswered === true);
  }, [gameCode]);
  
  return {
    checkAllPlayersAnswered,
  };
};
