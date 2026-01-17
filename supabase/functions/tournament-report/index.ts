import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, getResponseHeaders } from '../_shared/cors.ts';
import { getAuthContext, getServiceClient } from '../_shared/auth.ts';
import { createAuditLog } from '../_shared/audit.ts';
import { checkRateLimit } from '../_shared/rate-limit.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const RequestSchema = z.object({
  tournamentId: z.string().uuid('Invalid tournament ID'),
  matchId: z.string().uuid('Invalid match ID'),
  winnerUserId: z.string().uuid('Invalid winner ID'),
  scoreA: z.number().int().min(0),
  scoreB: z.number().int().min(0),
});

const K_FACTOR_TOURNAMENT = 40;

function calculateEloChange(playerRating: number, opponentRating: number, won: boolean): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  return Math.round(K_FACTOR_TOURNAMENT * ((won ? 1 : 0) - expectedScore));
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = getResponseHeaders(req);

  try {
    const auth = await getAuthContext(req);
    
    // Rate limit: 30 requests per 10 minutes (for reporting multiple matches)
    const rateLimit = await checkRateLimit(auth.userId, 'tournament-report', 30);
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
    const { tournamentId, matchId, winnerUserId, scoreA, scoreB } = RequestSchema.parse(body);

    const supabase = getServiceClient();

    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return new Response(JSON.stringify({ error: 'Resource not found' }), 
        { status: 404, headers });
    }

    if (tournament.host_id !== auth.userId) {
      return new Response(JSON.stringify({ error: 'Access denied' }), 
        { status: 403, headers });
    }

    const { data: match } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (!match) {
      return new Response(JSON.stringify({ error: 'Resource not found' }), 
        { status: 404, headers });
    }

    const loserId = winnerUserId === match.player_a_id ? match.player_b_id : match.player_a_id;

    // Update match
    await supabase.from('tournament_matches').update({
      winner_id: winnerUserId, score_a: scoreA, score_b: scoreB,
      status: 'completed', completed_at: new Date().toISOString(),
    }).eq('id', matchId);

    // Update winner stats
    const { data: winnerParticipant } = await supabase
      .from('tournament_participants')
      .select('wins, points')
      .eq('tournament_id', tournamentId)
      .eq('user_id', winnerUserId)
      .single();

    if (winnerParticipant) {
      await supabase.from('tournament_participants').update({
        wins: winnerParticipant.wins + 1,
        points: winnerParticipant.points + 3,
      }).eq('tournament_id', tournamentId).eq('user_id', winnerUserId);
    }

    // Update loser stats
    if (loserId) {
      const { data: loserParticipant } = await supabase
        .from('tournament_participants')
        .select('losses')
        .eq('tournament_id', tournamentId)
        .eq('user_id', loserId)
        .single();

      if (loserParticipant) {
        await supabase.from('tournament_participants').update({
          losses: loserParticipant.losses + 1,
          is_eliminated: tournament.format === 'single_elimination',
        }).eq('tournament_id', tournamentId).eq('user_id', loserId);
      }
    }

    // Check completion
    const { data: pendingMatches } = await supabase
      .from('tournament_matches')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('status', 'pending');

    const isComplete = !pendingMatches?.length;

    if (isComplete) {
      const { data: standings } = await supabase
        .from('tournament_participants')
        .select('user_id, wins, points')
        .eq('tournament_id', tournamentId)
        .order('wins', { ascending: false });

      const champion = standings?.[0];

      await supabase.from('tournaments').update({
        status: 'ended',
        champion_id: champion?.user_id,
        standings,
        ended_at: new Date().toISOString(),
      }).eq('id', tournamentId);
    }

    await createAuditLog({
      actorId: auth.userId,
      action: 'tournament_match_reported',
      entityType: 'tournament_matches',
      entityId: matchId,
      metadata: { winnerId: winnerUserId },
    });

    const { data: updated } = await supabase
      .from('tournaments')
      .select('*, tournament_participants(*), tournament_matches(*)')
      .eq('id', tournamentId)
      .single();

    return new Response(JSON.stringify({ data: updated, isComplete }), 
      { status: 200, headers });
  } catch (error) {
    const { handleError } = await import('../_shared/errors.ts');
    const { response, status } = handleError(error, 'tournament-report');
    
    return new Response(JSON.stringify(response), { status, headers });
  }
});
