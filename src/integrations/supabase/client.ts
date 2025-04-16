
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://axkwskgeirvwpyvpktjw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4a3dza2dlaXJ2d3B5dnBrdGp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3ODU0MTQsImV4cCI6MjA2MDM2MTQxNH0.w2GM5cdUgFdIgMkcdSeTMZBFnrIV5_EyKTWVJhVZKLw";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper function to create a realtime channel subscription
export const createRealtimeChannel = (channelName: string) => {
  return supabase.channel(channelName);
};
