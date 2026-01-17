import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function callEdgeFunction<T>(
  functionName: string,
  body: Record<string, unknown>
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || `Edge function error: ${response.status}`);
  }

  return result.data;
}

// Friends API
export const friendsApi = {
  sendRequest: (addresseeIdentifier: string) =>
    callEdgeFunction<{ id: string; status: string }>(
      "friends-request",
      { addresseeIdentifier }
    ),

  respond: (requestId: string, action: "accept" | "decline" | "block") =>
    callEdgeFunction<{ id: string; status: string }>(
      "friends-respond",
      { requestId, action }
    ),
};

// Rules API
export interface RulesSearchResult {
  id: string;
  answer: string;
  confidence: number;
  tags: string[];
  citations: Array<{ title: string; url: string; excerpt: string }>;
  why: string;
  game: { id: string; name: string };
}

export const rulesApi = {
  search: (gameId: string, question: string) =>
    callEdgeFunction<RulesSearchResult>("rules-search", { gameId, question }),
};

// Game Nights API
export interface GameNight {
  id: string;
  title: string;
  game_id: string;
  host_id: string;
  status: "active" | "ended" | "cancelled";
  join_code: string;
  created_at: string;
  ended_at: string | null;
  winner_id: string | null;
  summary: Record<string, unknown> | null;
  game?: { id: string; name: string };
}

export interface NightRecap {
  winner: { userId: string; ratingChange: number };
  topScorer: { userId: string; score: number };
  participants: Array<{
    userId: string;
    placement: number;
    totalScore: number;
    ratingChange: number;
  }>;
}

export const gameNightsApi = {
  create: (gameId: string, title: string) =>
    callEdgeFunction<GameNight>("game-night-create", { gameId, title }),

  join: (joinCode: string) =>
    callEdgeFunction<{ nightId: string }>("game-night-join", { joinCode }),

  end: (nightId: string, winnerUserId: string) =>
    callEdgeFunction<{ recap: NightRecap; ratingChanges: Record<string, number> }>(
      "game-night-end",
      { nightId, winnerUserId }
    ),

  updateScore: (nightId: string, userId: string, roundIndex: number, score: number) =>
    callEdgeFunction<void>("game-night-update-score", { nightId, userId, roundIndex, score }),
};

// Tournaments API
export interface Tournament {
  id: string;
  title: string;
  game_id: string;
  host_id: string;
  format: "single_elimination" | "round_robin";
  status: "draft" | "active" | "ended";
  current_round: number;
  total_rounds: number;
  champion_id: string | null;
  created_at: string;
  games_catalog?: { id: string; name: string };
  tournament_participants?: Array<{
    user_id: string;
    seed: number;
    wins: number;
    losses: number;
    points: number;
    profiles?: { username: string; display_name: string | null };
  }>;
  tournament_matches?: Array<{
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

export const tournamentsApi = {
  create: (
    gameId: string,
    title: string,
    format: "single_elimination" | "round_robin",
    participantUserIds: string[]
  ) =>
    callEdgeFunction<Tournament>("tournament-create", {
      gameId,
      title,
      format,
      participantUserIds,
    }),

  reportMatch: (
    tournamentId: string,
    matchId: string,
    winnerUserId: string,
    scoreA: number,
    scoreB: number
  ) =>
    callEdgeFunction<Tournament>("tournament-report", {
      tournamentId,
      matchId,
      winnerUserId,
      scoreA,
      scoreB,
    }),
};
