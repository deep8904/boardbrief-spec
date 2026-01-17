import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "../queryKeys";

export interface Game {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  min_players: number | null;
  max_players: number | null;
  play_time_minutes: number | null;
  bgg_id: number | null;
  created_at: string;
}

export function useGames(search?: string) {
  return useQuery({
    queryKey: queryKeys.games(search),
    queryFn: async (): Promise<Game[]> => {
      let query = supabase
        .from("games_catalog")
        .select("*")
        .order("name", { ascending: true });

      if (search && search.length > 0) {
        query = query.ilike("name", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useGame(gameId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.game(gameId),
    queryFn: async (): Promise<Game | null> => {
      if (!gameId) return null;

      const { data, error } = await supabase
        .from("games_catalog")
        .select("*")
        .eq("id", gameId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!gameId,
  });
}
