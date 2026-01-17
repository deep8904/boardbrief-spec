export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      client_errors: {
        Row: {
          component: string | null
          created_at: string
          error_message: string
          error_stack: string | null
          id: string
          metadata: Json | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component?: string | null
          created_at?: string
          error_message: string
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component?: string | null
          created_at?: string
          error_message?: string
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      friends: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["friend_status"]
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["friend_status"]
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["friend_status"]
          updated_at?: string
        }
        Relationships: []
      }
      game_nights: {
        Row: {
          created_at: string
          ended_at: string | null
          game_id: string
          host_id: string
          id: string
          join_code: string
          status: Database["public"]["Enums"]["night_status"]
          summary: Json | null
          title: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          game_id: string
          host_id: string
          id?: string
          join_code?: string
          status?: Database["public"]["Enums"]["night_status"]
          summary?: Json | null
          title: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          game_id?: string
          host_id?: string
          id?: string
          join_code?: string
          status?: Database["public"]["Enums"]["night_status"]
          summary?: Json | null
          title?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_nights_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      game_ratings: {
        Row: {
          created_at: string
          game_id: string
          games_played: number
          id: string
          rating: number
          updated_at: string
          user_id: string
          wins: number
        }
        Insert: {
          created_at?: string
          game_id: string
          games_played?: number
          id?: string
          rating?: number
          updated_at?: string
          user_id: string
          wins?: number
        }
        Update: {
          created_at?: string
          game_id?: string
          games_played?: number
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_ratings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      games_catalog: {
        Row: {
          bgg_id: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          max_players: number | null
          min_players: number | null
          name: string
          play_time_minutes: number | null
          slug: string
        }
        Insert: {
          bgg_id?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          max_players?: number | null
          min_players?: number | null
          name: string
          play_time_minutes?: number | null
          slug: string
        }
        Update: {
          bgg_id?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          max_players?: number | null
          min_players?: number | null
          name?: string
          play_time_minutes?: number | null
          slug?: string
        }
        Relationships: []
      }
      night_participants: {
        Row: {
          game_night_id: string
          id: string
          is_host: boolean
          joined_at: string
          turn_position: number
          user_id: string
        }
        Insert: {
          game_night_id: string
          id?: string
          is_host?: boolean
          joined_at?: string
          turn_position?: number
          user_id: string
        }
        Update: {
          game_night_id?: string
          id?: string
          is_host?: boolean
          joined_at?: string
          turn_position?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "night_participants_game_night_id_fkey"
            columns: ["game_night_id"]
            isOneToOne: false
            referencedRelation: "game_nights"
            referencedColumns: ["id"]
          },
        ]
      }
      night_results: {
        Row: {
          created_at: string
          game_night_id: string
          id: string
          placement: number
          rating_change: number
          total_score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          game_night_id: string
          id?: string
          placement?: number
          rating_change?: number
          total_score?: number
          user_id: string
        }
        Update: {
          created_at?: string
          game_night_id?: string
          id?: string
          placement?: number
          rating_change?: number
          total_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "night_results_game_night_id_fkey"
            columns: ["game_night_id"]
            isOneToOne: false
            referencedRelation: "game_nights"
            referencedColumns: ["id"]
          },
        ]
      }
      night_scores: {
        Row: {
          created_at: string
          game_night_id: string
          id: string
          round_index: number
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game_night_id: string
          id?: string
          round_index?: number
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          game_night_id?: string
          id?: string
          round_index?: number
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "night_scores_game_night_id_fkey"
            columns: ["game_night_id"]
            isOneToOne: false
            referencedRelation: "game_nights"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          ip_address: string | null
          request_count: number
          user_id: string | null
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: string | null
          request_count?: number
          user_id?: string | null
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string | null
          request_count?: number
          user_id?: string | null
          window_start?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string
          games_played: number
          global_rating: number
          id: string
          updated_at: string
          user_id: string
          wins: number
        }
        Insert: {
          created_at?: string
          games_played?: number
          global_rating?: number
          id?: string
          updated_at?: string
          user_id: string
          wins?: number
        }
        Update: {
          created_at?: string
          games_played?: number
          global_rating?: number
          id?: string
          updated_at?: string
          user_id?: string
          wins?: number
        }
        Relationships: []
      }
      rule_answers: {
        Row: {
          answer: string
          citations: Json
          confidence: number | null
          created_at: string
          game_id: string
          id: string
          question: string
          tags: string[] | null
          user_id: string
          why: string | null
        }
        Insert: {
          answer: string
          citations?: Json
          confidence?: number | null
          created_at?: string
          game_id: string
          id?: string
          question: string
          tags?: string[] | null
          user_id: string
          why?: string | null
        }
        Update: {
          answer?: string
          citations?: Json
          confidence?: number | null
          created_at?: string
          game_id?: string
          id?: string
          question?: string
          tags?: string[] | null
          user_id?: string
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rule_answers_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_cards: {
        Row: {
          answer_id: string | null
          content: string
          created_at: string
          game_id: string
          id: string
          is_pinned: boolean | null
          owner_id: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          answer_id?: string | null
          content: string
          created_at?: string
          game_id: string
          id?: string
          is_pinned?: boolean | null
          owner_id: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          answer_id?: string | null
          content?: string
          created_at?: string
          game_id?: string
          id?: string
          is_pinned?: boolean | null
          owner_id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_cards_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "rule_answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_cards_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_sources_cache: {
        Row: {
          created_at: string
          expires_at: string
          game_id: string | null
          id: string
          query: string
          sources: Json
        }
        Insert: {
          created_at?: string
          expires_at?: string
          game_id?: string | null
          id?: string
          query: string
          sources?: Json
        }
        Update: {
          created_at?: string
          expires_at?: string
          game_id?: string | null
          id?: string
          query?: string
          sources?: Json
        }
        Relationships: [
          {
            foreignKeyName: "rule_sources_cache_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_matches: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          match_number: number
          next_match_id: string | null
          player_a_id: string | null
          player_b_id: string | null
          round_number: number
          score_a: number | null
          score_b: number | null
          status: Database["public"]["Enums"]["match_status"]
          tournament_id: string
          winner_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          match_number?: number
          next_match_id?: string | null
          player_a_id?: string | null
          player_b_id?: string | null
          round_number?: number
          score_a?: number | null
          score_b?: number | null
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id: string
          winner_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          match_number?: number
          next_match_id?: string | null
          player_a_id?: string | null
          player_b_id?: string | null
          round_number?: number
          score_a?: number | null
          score_b?: number | null
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matches_next_match_id_fkey"
            columns: ["next_match_id"]
            isOneToOne: false
            referencedRelation: "tournament_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_participants: {
        Row: {
          id: string
          is_eliminated: boolean
          joined_at: string
          losses: number
          points: number
          seed: number
          tournament_id: string
          user_id: string
          wins: number
        }
        Insert: {
          id?: string
          is_eliminated?: boolean
          joined_at?: string
          losses?: number
          points?: number
          seed?: number
          tournament_id: string
          user_id: string
          wins?: number
        }
        Update: {
          id?: string
          is_eliminated?: boolean
          joined_at?: string
          losses?: number
          points?: number
          seed?: number
          tournament_id?: string
          user_id?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          champion_id: string | null
          created_at: string
          current_round: number
          ended_at: string | null
          format: Database["public"]["Enums"]["tournament_format"]
          game_id: string
          host_id: string
          id: string
          standings: Json | null
          status: Database["public"]["Enums"]["tournament_status"]
          title: string
          total_rounds: number
        }
        Insert: {
          champion_id?: string | null
          created_at?: string
          current_round?: number
          ended_at?: string | null
          format?: Database["public"]["Enums"]["tournament_format"]
          game_id: string
          host_id: string
          id?: string
          standings?: Json | null
          status?: Database["public"]["Enums"]["tournament_status"]
          title: string
          total_rounds?: number
        }
        Update: {
          champion_id?: string | null
          created_at?: string
          current_round?: number
          ended_at?: string | null
          format?: Database["public"]["Enums"]["tournament_format"]
          game_id?: string
          host_id?: string
          id?: string
          standings?: Json | null
          status?: Database["public"]["Enums"]["tournament_status"]
          title?: string
          total_rounds?: number
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_friends: {
        Args: { user_a: string; user_b: string }
        Returns: boolean
      }
      generate_join_code: { Args: never; Returns: string }
      is_night_participant: {
        Args: { p_night_id: string; p_user_id: string }
        Returns: boolean
      }
      is_tournament_participant: {
        Args: { p_tournament_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      friend_status: "pending" | "accepted" | "declined" | "blocked"
      match_status: "pending" | "completed"
      night_status: "active" | "ended" | "cancelled"
      tournament_format: "single_elimination" | "round_robin"
      tournament_status: "draft" | "active" | "ended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      friend_status: ["pending", "accepted", "declined", "blocked"],
      match_status: ["pending", "completed"],
      night_status: ["active", "ended", "cancelled"],
      tournament_format: ["single_elimination", "round_robin"],
      tournament_status: ["draft", "active", "ended"],
    },
  },
} as const
