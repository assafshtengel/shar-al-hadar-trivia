
import { Database } from '@/integrations/supabase/types';

export type GameState = Database['public']['Tables']['game_state']['Row'] & {
  game_mode: 'local' | 'remote';
};

export type GameStateInsert = Database['public']['Tables']['game_state']['Insert'] & {
  game_mode?: 'local' | 'remote';
};

export type GameStateUpdate = Database['public']['Tables']['game_state']['Update'] & {
  game_mode?: 'local' | 'remote';
};
