
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://axkwskgeirvwpyvpktjw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4a3dza2dlaXJ2d3B5dnBrdGp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3ODU0MTQsImV4cCI6MjA2MDM2MTQxNH0.w2GM5cdUgFdIgMkcdSeTMZBFnrIV5_EyKTWVJhVZKLw";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Add the reset_players_answered_status RPC interface
export interface ResetPlayersStatusParams {
  game_code: string;
}

// Add the player ready status RPC interface
export interface UpdatePlayerReadyStatusParams {
  game_code: string;
  player_name: string;
  is_ready: boolean;
}

// Add the check all players answered interface
export interface CheckAllPlayersAnsweredParams {
  game_code: string;
}

// Add new interface for host answer selection
export interface HostAnswerSelectionParams {
  game_code: string;
  player_name: string;
  is_correct: boolean;
  points: number;
}

// Add new interface for batch player updates
export interface BatchPlayerUpdateParams {
  game_code: string;
  player_updates: {
    player_name: string;
    is_correct: boolean;
    points: number;
  }[];
}

// Add interface for game mode update
export interface UpdateGameModeParams {
  p_game_code: string;
  p_game_mode: 'local' | 'remote';
}

// Add function to check if a player exists
export interface CheckPlayerExistsParams {
  game_code: string;
  player_name: string;
}

// Add function to check if a player exists and get their data
export const checkPlayerExists = async ({ game_code, player_name }: CheckPlayerExistsParams) => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('game_code', game_code)
    .eq('name', player_name)
    .maybeSingle();
  
  if (error) {
    console.error('Error checking if player exists:', error);
    return { exists: false, player: null };
  }
  
  return { 
    exists: !!data, 
    player: data 
  };
};

// Debug utility to verify host was added to players table
export const verifyHostInPlayersTable = async ({ game_code, player_name }: CheckPlayerExistsParams) => {
  const { exists, player } = await checkPlayerExists({ game_code, player_name });
  
  if (exists) {
    console.log("✅ Host successfully added to players table", player);
    return true;
  } else {
    console.error("❌ Host was not added to players table", { game_code, player_name });
    return false;
  }
};
