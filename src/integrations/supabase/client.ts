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
