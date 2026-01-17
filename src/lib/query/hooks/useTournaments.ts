import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { tournamentsApi, type Tournament } from "@/lib/api/edge-functions";
import { queryKeys } from "../queryKeys";
import { useUser } from "./useSession";
import { useToast } from "@/hooks/use-toast";

export interface TournamentWithDetails extends Tournament {
  participants?: Array<{
    id: string;
    user_id: string;
    seed: number;
    wins: number;
    losses: number;
    points: number;
    is_eliminated: boolean;
    profile?: {
      username: string;
      display_name: string | null;
    };
  }>;
  matches?: Array<{
    id: string;
    round_number: number;
    match_number: number;
    player_a_id: string | null;
    player_b_id: string | null;
    winner_id: string | null;
    score_a: number | null;
    score_b: number | null;
    status: "pending" | "completed";
  }>;
}

export function useTournaments(status?: "draft" | "active" | "ended") {
  const { user } = useUser();

  return useQuery({
    queryKey: queryKeys.tournaments(user?.id, status),
    queryFn: async (): Promise<TournamentWithDetails[]> => {
      if (!user?.id) return [];

      // Get tournaments where user is a participant or host
      const { data: participations } = await supabase
        .from("tournament_participants")
        .select("tournament_id")
        .eq("user_id", user.id);

      const { data: hosted } = await supabase
        .from("tournaments")
        .select("id")
        .eq("host_id", user.id);

      const tournamentIds = [
        ...(participations?.map((p) => p.tournament_id) || []),
        ...(hosted?.map((h) => h.id) || []),
      ];

      if (tournamentIds.length === 0) return [];

      let query = supabase
        .from("tournaments")
        .select("*, games_catalog(id, name)")
        .in("id", [...new Set(tournamentIds)])
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useTournament(tournamentId: string | undefined) {
  const { user } = useUser();

  return useQuery({
    queryKey: queryKeys.tournament(tournamentId),
    queryFn: async (): Promise<TournamentWithDetails | null> => {
      if (!tournamentId || !user?.id) return null;

      const { data: tournament, error } = await supabase
        .from("tournaments")
        .select("*, games_catalog(id, name)")
        .eq("id", tournamentId)
        .single();

      if (error) throw error;

      // Get participants
      const { data: participants } = await supabase
        .from("tournament_participants")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("seed", { ascending: true });

      // Get profiles
      const userIds = participants?.map((p) => p.user_id) || [];
      let profiles: Array<{ id: string; username: string; display_name: string | null }> = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, display_name")
          .in("id", userIds);
        profiles = profilesData || [];
      }

      // Get matches
      const { data: matches } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round_number", { ascending: true })
        .order("match_number", { ascending: true });

      return {
        ...tournament,
        participants: participants?.map((p) => ({
          ...p,
          profile: profiles.find((pr) => pr.id === p.user_id),
        })),
        matches: matches || [],
      };
    },
    enabled: !!tournamentId && !!user?.id,
  });
}

export function useCreateTournament() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      gameId,
      title,
      format,
      participantUserIds,
    }: {
      gameId: string;
      title: string;
      format: "single_elimination" | "round_robin";
      participantUserIds: string[];
    }) => tournamentsApi.create(gameId, title, format, participantUserIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournaments(user?.id) });
      toast({
        title: "Tournament created!",
        description: "Good luck to all participants!",
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

export function useReportMatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      tournamentId,
      matchId,
      winnerUserId,
      scoreA,
      scoreB,
    }: {
      tournamentId: string;
      matchId: string;
      winnerUserId: string;
      scoreA: number;
      scoreB: number;
    }) => tournamentsApi.reportMatch(tournamentId, matchId, winnerUserId, scoreA, scoreB),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament(variables.tournamentId) });
      toast({
        title: "Match reported",
        description: "Standings updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to report",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
