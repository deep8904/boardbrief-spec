import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "../queryKeys";
import { useUser } from "./useSession";

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  activeNights: number;
  friendsCount: number;
  tournamentsCount: number;
  ruleCardsCount: number;
}

export function useStats() {
  const { user } = useUser();

  return useQuery({
    queryKey: queryKeys.stats(user?.id),
    queryFn: async (): Promise<UserStats> => {
      if (!user?.id) {
        return {
          gamesPlayed: 0,
          wins: 0,
          activeNights: 0,
          friendsCount: 0,
          tournamentsCount: 0,
          ruleCardsCount: 0,
        };
      }

      // Get rating stats
      const { data: rating } = await supabase
        .from("ratings")
        .select("games_played, wins")
        .eq("user_id", user.id)
        .single();

      // Get active nights count
      const { data: nightParticipations } = await supabase
        .from("night_participants")
        .select("game_night_id")
        .eq("user_id", user.id);

      let activeNights = 0;
      if (nightParticipations?.length) {
        const nightIds = nightParticipations.map((p) => p.game_night_id);
        const { count } = await supabase
          .from("game_nights")
          .select("*", { count: "exact", head: true })
          .in("id", nightIds)
          .eq("status", "active");
        activeNights = count || 0;
      }

      // Get friends count
      const { count: friendsCount } = await supabase
        .from("friends")
        .select("*", { count: "exact", head: true })
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      // Get tournaments count
      const { data: tournamentParticipations } = await supabase
        .from("tournament_participants")
        .select("tournament_id")
        .eq("user_id", user.id);

      let tournamentsCount = 0;
      if (tournamentParticipations?.length) {
        const tournamentIds = tournamentParticipations.map((p) => p.tournament_id);
        const { count } = await supabase
          .from("tournaments")
          .select("*", { count: "exact", head: true })
          .in("id", tournamentIds);
        tournamentsCount = count || 0;
      }

      // Get rule cards count
      const { count: ruleCardsCount } = await supabase
        .from("rule_cards")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id);

      return {
        gamesPlayed: rating?.games_played || 0,
        wins: rating?.wins || 0,
        activeNights,
        friendsCount: friendsCount || 0,
        tournamentsCount,
        ruleCardsCount: ruleCardsCount || 0,
      };
    },
    enabled: !!user?.id,
  });
}
