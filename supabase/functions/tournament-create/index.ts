import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, getResponseHeaders } from '../_shared/cors.ts';
import { getAuthContext, getServiceClient } from '../_shared/auth.ts';
import { createAuditLog } from '../_shared/audit.ts';
import { checkRateLimit } from '../_shared/rate-limit.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const RequestSchema = z.object({
  gameId: z.string().uuid('Invalid game ID'),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  format: z.enum(['single_elimination', 'round_robin']),
  participantUserIds: z.array(z.string().uuid()).min(2, 'At least 2 participants required'),
});

function calculateRoundsForElimination(playerCount: number): number {
  return Math.ceil(Math.log2(playerCount));
}

function generateEliminationBracket(playerIds: string[]): Array<{round: number, match: number, playerAId: string | null, playerBId: string | null, nextMatchId?: number}> {
  const matches: Array<{round: number, match: number, playerAId: string | null, playerBId: string | null}> = [];
  
  // Pad to power of 2
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(playerIds.length)));
  const paddedPlayers = [...playerIds];
  while (paddedPlayers.length < bracketSize) {
    paddedPlayers.push(''); // BYE
  }

  // Shuffle for seeding
  const shuffled = paddedPlayers.sort(() => Math.random() - 0.5);

  // First round
  let matchNumber = 1;
  for (let i = 0; i < shuffled.length; i += 2) {
    matches.push({
      round: 1,
      match: matchNumber++,
      playerAId: shuffled[i] || null,
      playerBId: shuffled[i + 1] || null,
    });
  }

  return matches;
}

function generateRoundRobinMatches(playerIds: string[]): Array<{round: number, match: number, playerAId: string, playerBId: string}> {
  const matches: Array<{round: number, match: number, playerAId: string, playerBId: string}> = [];
  let matchNumber = 1;
  let round = 1;

  // Each player plays every other player once
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      matches.push({
        round,
        match: matchNumber++,
        playerAId: playerIds[i],
        playerBId: playerIds[j],
      });
    }
  }

  return matches;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = getResponseHeaders(req);

  try {
    const auth = await getAuthContext(req);
    
    // Rate limit: 5 requests per 10 minutes (tournament creation is expensive)
    const rateLimit = await checkRateLimit(auth.userId, 'tournament-create', 5);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests. Please try again later.',
          resetAt: rateLimit.resetAt.toISOString()
        }),
        { status: 429, headers }
      );
    }

    const body = await req.json();
    const { gameId, title, format, participantUserIds } = RequestSchema.parse(body);

    const supabase = getServiceClient();

    // Verify game exists
    const { data: game, error: gameError } = await supabase
      .from('games_catalog')
      .select('id, name')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      return new Response(
        JSON.stringify({ error: 'Resource not found' }),
        { status: 404, headers }
      );
    }

    // Calculate total rounds
    const totalRounds = format === 'single_elimination' 
      ? calculateRoundsForElimination(participantUserIds.length)
      : 1; // Round robin is typically 1 round of everyone playing everyone

    // Create tournament
    const { data: tournament, error: createError } = await supabase
      .from('tournaments')
      .insert({
        game_id: gameId,
        host_id: auth.userId,
        title,
        format,
        status: 'active',
        total_rounds: totalRounds,
      })
      .select()
      .single();

    if (createError) throw createError;

    // Add participants with seeding
    const participantRecords = participantUserIds.map((userId, index) => ({
      tournament_id: tournament.id,
      user_id: userId,
      seed: index + 1,
    }));

    const { error: participantsError } = await supabase
      .from('tournament_participants')
      .insert(participantRecords);

    if (participantsError) throw participantsError;

    // Generate matches
    const matchRecords = format === 'single_elimination'
      ? generateEliminationBracket(participantUserIds)
      : generateRoundRobinMatches(participantUserIds);

    const matchInserts = matchRecords.map(m => ({
      tournament_id: tournament.id,
      round_number: m.round,
      match_number: m.match,
      player_a_id: m.playerAId || null,
      player_b_id: m.playerBId || null,
      status: 'pending',
    }));

    const { error: matchesError } = await supabase
      .from('tournament_matches')
      .insert(matchInserts);

    if (matchesError) throw matchesError;

    // Audit log
    await createAuditLog({
      actorId: auth.userId,
      action: 'tournament_created',
      entityType: 'tournaments',
      entityId: tournament.id,
      metadata: { gameId, format, participantCount: participantUserIds.length },
    });

    // Get full tournament data
    const { data: fullTournament } = await supabase
      .from('tournaments')
      .select(`
        *,
        games_catalog(id, name),
        tournament_participants(*, profiles(username, display_name)),
        tournament_matches(*)
      `)
      .eq('id', tournament.id)
      .single();

    return new Response(
      JSON.stringify({ data: fullTournament }),
      { status: 201, headers }
    );
  } catch (error) {
    const { handleError } = await import('../_shared/errors.ts');
    const { response, status } = handleError(error, 'tournament-create');
    
    return new Response(JSON.stringify(response), { status, headers });
  }
});
