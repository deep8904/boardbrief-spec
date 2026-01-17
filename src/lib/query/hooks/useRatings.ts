import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "../queryKeys";
import { useUser } from "./useSession";

export interface Rating {
  id: string;
  user_id: string;
  global_rating: number;
  games_played: number;
  wins: number;
  created_at: string;
  updated_at: string;
  profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface GameRating {
  id: string;
  user_id: string;
  game_id: string;
  rating: number;
  games_played: number;
  wins: number;
  game?: {
    id: string;
    name: string;
  };
}

export function useMyRating() {
  const { user } = useUser();

  return useQuery({
    queryKey: queryKeys.myRating(user?.id),
    queryFn: async (): Promise<Rating | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useLeaderboard(limit = 10) {
  return useQuery({
    queryKey: queryKeys.leaderboard(limit),
    queryFn: async (): Promise<Rating[]> => {
      const { data: ratings, error } = await supabase
        .from("ratings")
        .select("*")
        .order("global_rating", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get profiles
      const userIds = ratings.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds);

      return ratings.map((r) => ({
        ...r,
        profile: profiles?.find((p) => p.id === r.user_id),
      }));
    },
  });
}

export function useMyGameRatings() {
  const { user } = useUser();

  return useQuery({
    queryKey: queryKeys.myGameRatings(user?.id),
    queryFn: async (): Promise<GameRating[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("game_ratings")
        .select("*, games_catalog(id, name)")
        .eq("user_id", user.id);

      if (error) throw error;

      return data.map((r) => ({
        ...r,
        game: r.games_catalog,
      }));
    },
    enabled: !!user?.id,
  });
}
