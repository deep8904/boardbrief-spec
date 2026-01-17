import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, getResponseHeaders } from '../_shared/cors.ts';
import { getAuthContext, getServiceClient } from '../_shared/auth.ts';
import { createAuditLog } from '../_shared/audit.ts';
import { checkRateLimit } from '../_shared/rate-limit.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const RequestSchema = z.object({
  nightId: z.string().uuid('Invalid night ID'),
  winnerUserId: z.string().uuid('Invalid winner ID'),
});

const K_FACTOR = 24;

function calculateEloChange(playerRating: number, opponentRating: number, won: boolean): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const actualScore = won ? 1 : 0;
  return Math.round(K_FACTOR * (actualScore - expectedScore));
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = getResponseHeaders(req);

  try {
    const auth = await getAuthContext(req);
    
    // Rate limit: 10 requests per 10 minutes
    const rateLimit = await checkRateLimit(auth.userId, 'game-night-end', 10);
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
    const { nightId, winnerUserId } = RequestSchema.parse(body);

    const supabase = getServiceClient();

    const { data: night, error: nightError } = await supabase
      .from('game_nights')
      .select('*, games_catalog(id, name)')
      .eq('id', nightId)
      .single();

    if (nightError || !night) {
      return new Response(
        JSON.stringify({ error: 'Resource not found' }),
        { status: 404, headers }
      );
    }

    if (night.host_id !== auth.userId) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers }
      );
    }

    if (night.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Invalid operation' }),
        { status: 400, headers }
      );
    }

    const { data: participants } = await supabase
      .from('night_participants')
      .select('user_id')
      .eq('game_night_id', nightId);

    if (!participants?.length) {
      return new Response(
        JSON.stringify({ error: 'Invalid operation' }),
        { status: 400, headers }
      );
    }

    const { data: allScores } = await supabase
      .from('night_scores')
      .select('user_id, score')
      .eq('game_night_id', nightId);

    const scoreTotals: Record<string, number> = {};
    allScores?.forEach(s => {
      scoreTotals[s.user_id] = (scoreTotals[s.user_id] || 0) + s.score;
    });

    const sortedParticipants = participants
      .map(p => ({
        userId: p.user_id,
        totalScore: scoreTotals[p.user_id] || 0,
      }))
      .sort((a, b) => b.totalScore - a.totalScore);

    const { data: ratings } = await supabase
      .from('ratings')
      .select('user_id, global_rating, games_played, wins')
      .in('user_id', participants.map(p => p.user_id));

    const ratingsMap: Record<string, { global_rating: number; games_played: number; wins: number }> = {};
    ratings?.forEach(r => { ratingsMap[r.user_id] = r; });

    const avgRating = ratings?.length 
      ? ratings.reduce((sum, r) => sum + r.global_rating, 0) / ratings.length 
      : 1000;

    const ratingChanges: Record<string, number> = {};
    
    for (let i = 0; i < sortedParticipants.length; i++) {
      const p = sortedParticipants[i];
      const isWinner = p.userId === winnerUserId;
      const playerRating = ratingsMap[p.userId]?.global_rating || 1000;
      const eloChange = calculateEloChange(playerRating, avgRating, isWinner);
      ratingChanges[p.userId] = eloChange;

      await supabase.from('night_results').insert({
        game_night_id: nightId,
        user_id: p.userId,
        total_score: p.totalScore,
        placement: i + 1,
        rating_change: eloChange,
      });

      const currentRating = ratingsMap[p.userId];
      if (currentRating) {
        await supabase
          .from('ratings')
          .update({
            global_rating: currentRating.global_rating + eloChange,
            games_played: currentRating.games_played + 1,
            wins: isWinner ? currentRating.wins + 1 : currentRating.wins,
          })
          .eq('user_id', p.userId);
      }
    }

    const topScorer = sortedParticipants[0];

    const summary = {
      winner: { userId: winnerUserId, ratingChange: ratingChanges[winnerUserId] },
      topScorer: { userId: topScorer.userId, score: topScorer.totalScore },
      participants: sortedParticipants.map((p, i) => ({
        userId: p.userId,
        placement: i + 1,
        totalScore: p.totalScore,
        ratingChange: ratingChanges[p.userId],
      })),
    };

    await supabase
      .from('game_nights')
      .update({ status: 'ended', winner_id: winnerUserId, summary, ended_at: new Date().toISOString() })
      .eq('id', nightId);

    await createAuditLog({
      actorId: auth.userId,
      action: 'game_night_ended',
      entityType: 'game_nights',
      entityId: nightId,
      metadata: { winnerId: winnerUserId },
    });

    return new Response(
      JSON.stringify({ data: { recap: summary, ratingChanges } }),
      { status: 200, headers }
    );
  } catch (error) {
    const { handleError } = await import('../_shared/errors.ts');
    const { response, status } = handleError(error, 'game-night-end');
    
    return new Response(JSON.stringify(response), { status, headers });
  }
});
