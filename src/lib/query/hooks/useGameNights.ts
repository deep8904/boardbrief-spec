import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { gameNightsApi, type GameNight, type NightRecap } from "@/lib/api/edge-functions";
import { queryKeys } from "../queryKeys";
import { useUser } from "./useSession";
import { useToast } from "@/hooks/use-toast";

export interface NightParticipant {
  id: string;
  user_id: string;
  game_night_id: string;
  turn_position: number;
  is_host: boolean;
  joined_at: string;
  profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface NightScore {
  id: string;
  user_id: string;
  game_night_id: string;
  round_index: number;
  score: number;
}

export interface GameNightWithDetails extends Omit<GameNight, 'summary'> {
  summary?: Record<string, unknown> | null;
  participants?: NightParticipant[];
  scores?: NightScore[];
  games_catalog?: { id: string; name: string };
}

export function useGameNights(status?: "active" | "ended") {
  const { user } = useUser();

  return useQuery({
    queryKey: queryKeys.gameNights(user?.id, status),
    queryFn: async (): Promise<GameNightWithDetails[]> => {
      if (!user?.id) return [];

      // Get nights where user is a participant
      const { data: participations } = await supabase
        .from("night_participants")
        .select("game_night_id")
        .eq("user_id", user.id);

      if (!participations?.length) return [];

      const nightIds = participations.map((p) => p.game_night_id);

      let query = supabase
        .from("game_nights")
        .select("*, games_catalog(id, name)")
        .in("id", nightIds)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data.map((n) => ({
        ...n,
        summary: n.summary as Record<string, unknown> | null,
      })) as GameNightWithDetails[];
    },
    enabled: !!user?.id,
  });
}

export function useGameNight(nightId: string | undefined) {
  const { user } = useUser();

  return useQuery({
    queryKey: queryKeys.gameNight(nightId),
    queryFn: async (): Promise<GameNightWithDetails | null> => {
      if (!nightId || !user?.id) return null;

      const { data: night, error } = await supabase
        .from("game_nights")
        .select("*, games_catalog(id, name)")
        .eq("id", nightId)
        .single();

      if (error) throw error;

      // Get participants
      const { data: participants } = await supabase
        .from("night_participants")
        .select("*")
        .eq("game_night_id", nightId)
        .order("turn_position", { ascending: true });

      // Get profiles for participants
      const userIds = participants?.map((p) => p.user_id) || [];
      let profiles: Array<{ id: string; username: string; display_name: string | null; avatar_url: string | null }> = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", userIds);
        profiles = profilesData || [];
      }

      // Get scores
      const { data: scores } = await supabase
        .from("night_scores")
        .select("*")
        .eq("game_night_id", nightId);

      return {
        ...night,
        summary: night.summary as Record<string, unknown> | null,
        participants: participants?.map((p) => ({
          ...p,
          profile: profiles.find((pr) => pr.id === p.user_id),
        })),
        scores: scores || [],
      } as GameNightWithDetails;
    },
    enabled: !!nightId && !!user?.id,
  });
}

export function useCreateGameNight() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ gameId, title }: { gameId: string; title: string }) =>
      gameNightsApi.create(gameId, title),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gameNights(user?.id) });
      toast({
        title: "Game night created!",
        description: `Join code: ${data.join_code}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useJoinGameNight() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (joinCode: string) => gameNightsApi.join(joinCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gameNights(user?.id) });
      toast({
        title: "Joined game night!",
        description: "Have fun!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to join",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateScore() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      nightId,
      userId,
      roundIndex,
      score,
    }: {
      nightId: string;
      userId: string;
      roundIndex: number;
      score: number;
    }) =>
      gameNightsApi.updateScore(nightId, userId, roundIndex, score),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gameNight(variables.nightId) });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update score",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useEndGameNight() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ nightId, winnerUserId }: { nightId: string; winnerUserId: string }) =>
      gameNightsApi.end(nightId, winnerUserId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gameNights(user?.id) });
      toast({
        title: "Game night ended!",
        description: `Winner's rating changed by ${data.ratingChanges[data.recap.winner.userId] > 0 ? "+" : ""}${data.ratingChanges[data.recap.winner.userId]}`,
      });
      return data;
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to end",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
