import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, getResponseHeaders } from '../_shared/cors.ts';
import { getAuthContext, getServiceClient } from '../_shared/auth.ts';
import { createAuditLog } from '../_shared/audit.ts';
import { checkRateLimit } from '../_shared/rate-limit.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const RequestSchema = z.object({
  gameId: z.string().uuid('Invalid game ID'),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
});

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = getResponseHeaders(req);

  try {
    const auth = await getAuthContext(req);
    
    // Rate limit: 15 requests per 10 minutes
    const rateLimit = await checkRateLimit(auth.userId, 'game-night-create', 15);
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
    const { gameId, title } = RequestSchema.parse(body);

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

    // Create the game night
    const { data: night, error: createError } = await supabase
      .from('game_nights')
      .insert({
        game_id: gameId,
        host_id: auth.userId,
        title,
      })
      .select()
      .single();

    if (createError) throw createError;

    // Add host as participant
    const { error: participantError } = await supabase
      .from('night_participants')
      .insert({
        game_night_id: night.id,
        user_id: auth.userId,
        turn_position: 1,
        is_host: true,
      });

    if (participantError) throw participantError;

    // Initialize round 1 score for host
    await supabase.from('night_scores').insert({
      game_night_id: night.id,
      user_id: auth.userId,
      round_index: 1,
      score: 0,
    });

    // Audit log
    await createAuditLog({
      actorId: auth.userId,
      action: 'game_night_created',
      entityType: 'game_nights',
      entityId: night.id,
      metadata: { gameId, title, joinCode: night.join_code },
    });

    return new Response(
      JSON.stringify({ 
        data: {
          ...night,
          game,
        }
      }),
      { status: 201, headers }
    );
  } catch (error) {
    const { handleError } = await import('../_shared/errors.ts');
    const { response, status } = handleError(error, 'game-night-create');
    
    return new Response(JSON.stringify(response), { status, headers });
  }
});
