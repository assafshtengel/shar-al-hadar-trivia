
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

// Define song related interfaces and functions
export interface SupabaseSong {
  id: number;
  title: string;
  artist?: string;
  embed_url?: string;
  full_url?: string;
  youtube_url?: string;
  category?: string;
}

// Get songs from Supabase
export const fetchSongsFromSupabase = async (limit = 20, category?: string) => {
  let query = supabase
    .from('songs')
    .select('*');
  
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query.limit(limit);
  
  if (error) {
    console.error('Error fetching songs from Supabase:', error);
    return [];
  }
  
  return data as SupabaseSong[];
};

// Get a random song from Supabase
export const getRandomSongFromSupabase = async (excludedIds: number[] = [], category?: string) => {
  let query = supabase
    .from('songs')
    .select('*');
  
  if (category) {
    query = query.eq('category', category);
  }
  
  if (excludedIds.length > 0) {
    query = query.not('id', 'in', `(${excludedIds.join(',')})`);
  }
  
  // Order randomly to get a random song
  const { data, error } = await query.order('id', { ascending: false }).limit(1);
  
  if (error) {
    console.error('Error fetching random song from Supabase:', error);
    return null;
  }
  
  return data && data.length > 0 ? data[0] as SupabaseSong : null;
};

// Get songs by IDs from Supabase
export const getSongsByIdsFromSupabase = async (songIds: number[]) => {
  if (songIds.length === 0) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .in('id', songIds);
  
  if (error) {
    console.error('Error fetching songs by IDs from Supabase:', error);
    return [];
  }
  
  return data as SupabaseSong[];
};
