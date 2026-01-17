// Centralized query keys for TanStack Query
// This ensures consistent cache invalidation and data fetching

export const queryKeys = {
  // Session
  session: ["session"] as const,

  // Profile
  profile: (userId: string | undefined) => ["profile", userId] as const,

  // Friends
  friends: (userId: string | undefined) => ["friends", userId] as const,
  friendRequests: (userId: string | undefined) => ["friendRequests", userId] as const,

  // Games
  games: (search?: string) => ["games", search] as const,
  game: (gameId: string | undefined) => ["game", gameId] as const,

  // Rules
  ruleCards: (userId: string | undefined, gameId?: string) => ["ruleCards", userId, gameId] as const,
  ruleAnswers: (userId: string | undefined, gameId?: string) => ["ruleAnswers", userId, gameId] as const,

  // Game Nights
  gameNights: (userId: string | undefined, status?: string) => ["gameNights", userId, status] as const,
  gameNight: (nightId: string | undefined) => ["gameNight", nightId] as const,

  // Tournaments
  tournaments: (userId: string | undefined, status?: string) => ["tournaments", userId, status] as const,
  tournament: (tournamentId: string | undefined) => ["tournament", tournamentId] as const,

  // Ratings
  myRating: (userId: string | undefined) => ["myRating", userId] as const,
  myGameRatings: (userId: string | undefined) => ["myGameRatings", userId] as const,
  leaderboard: (limit: number) => ["leaderboard", limit] as const,

  // Stats
  stats: (userId: string | undefined) => ["stats", userId] as const,
};
