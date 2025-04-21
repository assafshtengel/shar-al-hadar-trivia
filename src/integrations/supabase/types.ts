export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      game_state: {
        Row: {
          current_round: number | null
          current_song_name: string | null
          current_song_url: string | null
          game_code: string
          game_duration: number | null
          game_mode: string
          game_phase: string
          host_ready: boolean
          round_started_at: string | null
          score_limit: number | null
        }
        Insert: {
          current_round?: number | null
          current_song_name?: string | null
          current_song_url?: string | null
          game_code: string
          game_duration?: number | null
          game_mode?: string
          game_phase: string
          host_ready?: boolean
          round_started_at?: string | null
          score_limit?: number | null
        }
        Update: {
          current_round?: number | null
          current_song_name?: string | null
          current_song_url?: string | null
          game_code?: string
          game_duration?: number | null
          game_mode?: string
          game_phase?: string
          host_ready?: boolean
          round_started_at?: string | null
          score_limit?: number | null
        }
        Relationships: []
      }
      game_stats: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          game_code: string
          id: string
          players_count: number | null
          started_at: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          game_code: string
          id?: string
          players_count?: number | null
          started_at?: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          game_code?: string
          id?: string
          players_count?: number | null
          started_at?: string
        }
        Relationships: []
      }
      improvements: {
        Row: {
          created_at: string
          feedback: string
          id: string
          name: string
          phone: string
          status: string
        }
        Insert: {
          created_at?: string
          feedback: string
          id?: string
          name: string
          phone: string
          status?: string
        }
        Update: {
          created_at?: string
          feedback?: string
          id?: string
          name?: string
          phone?: string
          status?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          game_code: string
          hasAnswered: boolean | null
          id: string
          isReady: boolean | null
          joined_at: string | null
          name: string
          score: number | null
        }
        Insert: {
          game_code: string
          hasAnswered?: boolean | null
          id?: string
          isReady?: boolean | null
          joined_at?: string | null
          name: string
          score?: number | null
        }
        Update: {
          game_code?: string
          hasAnswered?: boolean | null
          id?: string
          isReady?: boolean | null
          joined_at?: string | null
          name?: string
          score?: number | null
        }
        Relationships: []
      }
      songs: {
        Row: {
          artist: string | null
          artist_arik_ainshtain: boolean | null
          artist_aviv_gefen: boolean | null
          artist_fortis: boolean | null
          artist_idan_raichel: boolean | null
          artist_kaveret: boolean | null
          artist_mashina: boolean | null
          artist_noa_kirel: boolean | null
          artist_omer_adam: boolean | null
          artist_osher_cohen: boolean | null
          artist_rita: boolean | null
          artist_shalom_hanoch: boolean | null
          artist_shlomo_artzi: boolean | null
          category: string | null
          created_at: string | null
          embed_url: string | null
          eurovision_hits: boolean | null
          full_url: string | null
          id: number
          indie_alternative: boolean | null
          israeli_2000s_hits: boolean | null
          israeli_80s_hits: boolean | null
          israeli_90s_hits: boolean | null
          israeli_dance: boolean | null
          israeli_hiphop: boolean | null
          kids_nostalgia: boolean | null
          love_ballads: boolean | null
          military_classics: boolean | null
          title: string
          youtube_url: string | null
        }
        Insert: {
          artist?: string | null
          artist_arik_ainshtain?: boolean | null
          artist_aviv_gefen?: boolean | null
          artist_fortis?: boolean | null
          artist_idan_raichel?: boolean | null
          artist_kaveret?: boolean | null
          artist_mashina?: boolean | null
          artist_noa_kirel?: boolean | null
          artist_omer_adam?: boolean | null
          artist_osher_cohen?: boolean | null
          artist_rita?: boolean | null
          artist_shalom_hanoch?: boolean | null
          artist_shlomo_artzi?: boolean | null
          category?: string | null
          created_at?: string | null
          embed_url?: string | null
          eurovision_hits?: boolean | null
          full_url?: string | null
          id?: never
          indie_alternative?: boolean | null
          israeli_2000s_hits?: boolean | null
          israeli_80s_hits?: boolean | null
          israeli_90s_hits?: boolean | null
          israeli_dance?: boolean | null
          israeli_hiphop?: boolean | null
          kids_nostalgia?: boolean | null
          love_ballads?: boolean | null
          military_classics?: boolean | null
          title: string
          youtube_url?: string | null
        }
        Update: {
          artist?: string | null
          artist_arik_ainshtain?: boolean | null
          artist_aviv_gefen?: boolean | null
          artist_fortis?: boolean | null
          artist_idan_raichel?: boolean | null
          artist_kaveret?: boolean | null
          artist_mashina?: boolean | null
          artist_noa_kirel?: boolean | null
          artist_omer_adam?: boolean | null
          artist_osher_cohen?: boolean | null
          artist_rita?: boolean | null
          artist_shalom_hanoch?: boolean | null
          artist_shlomo_artzi?: boolean | null
          category?: string | null
          created_at?: string | null
          embed_url?: string | null
          eurovision_hits?: boolean | null
          full_url?: string | null
          id?: never
          indie_alternative?: boolean | null
          israeli_2000s_hits?: boolean | null
          israeli_80s_hits?: boolean | null
          israeli_90s_hits?: boolean | null
          israeli_dance?: boolean | null
          israeli_hiphop?: boolean | null
          kids_nostalgia?: boolean | null
          love_ballads?: boolean | null
          military_classics?: boolean | null
          title?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_game_mode: {
        Args: { p_game_code: string; p_game_mode: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
