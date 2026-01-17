import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, getResponseHeaders } from '../_shared/cors.ts';
import { getAuthContext, getServiceClient } from '../_shared/auth.ts';
import { createAuditLog } from '../_shared/audit.ts';
import { checkRateLimit } from '../_shared/rate-limit.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const RequestSchema = z.object({
  joinCode: z.string().length(6, 'Invalid join code'),
});

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = getResponseHeaders(req);

  try {
    const auth = await getAuthContext(req);
    
    // Rate limit: 30 requests per 10 minutes (to allow joining multiple games)
    const rateLimit = await checkRateLimit(auth.userId, 'game-night-join', 30);
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
    const { joinCode } = RequestSchema.parse(body);

    const supabase = getServiceClient();

    // Find the game night
    const { data: night, error: nightError } = await supabase
      .from('game_nights')
      .select('*, games_catalog(id, name)')
      .eq('join_code', joinCode.toUpperCase())
      .single();

    if (nightError || !night) {
      return new Response(
        JSON.stringify({ error: 'Resource not found' }),
        { status: 404, headers }
      );
    }

    if (night.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Invalid operation' }),
        { status: 400, headers }
      );
    }

    // Check if user is already a participant
    const { data: existingParticipant } = await supabase
      .from('night_participants')
      .select('id')
      .eq('game_night_id', night.id)
      .eq('user_id', auth.userId)
      .single();

    if (existingParticipant) {
      return new Response(
        JSON.stringify({ error: 'Already joined' }),
        { status: 409, headers }
      );
    }

    // Check if user is friends with host
    const { data: friendship } = await supabase
      .from('friends')
      .select('id, status')
      .or(`and(requester_id.eq.${auth.userId},addressee_id.eq.${night.host_id}),and(requester_id.eq.${night.host_id},addressee_id.eq.${auth.userId})`)
      .eq('status', 'accepted')
      .single();

    if (!friendship && night.host_id !== auth.userId) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers }
      );
    }

    // Get current participant count for turn position
    const { count } = await supabase
      .from('night_participants')
      .select('*', { count: 'exact', head: true })
      .eq('game_night_id', night.id);

    const turnPosition = (count || 0) + 1;

    // Add participant
    const { data: participant, error: joinError } = await supabase
      .from('night_participants')
      .insert({
        game_night_id: night.id,
        user_id: auth.userId,
        turn_position: turnPosition,
        is_host: false,
      })
      .select()
      .single();

    if (joinError) throw joinError;

    // Initialize round 1 score
    await supabase.from('night_scores').insert({
      game_night_id: night.id,
      user_id: auth.userId,
      round_index: 1,
      score: 0,
    });

    // Audit log
    await createAuditLog({
      actorId: auth.userId,
      action: 'game_night_joined',
      entityType: 'game_nights',
      entityId: night.id,
      metadata: { turnPosition },
    });

    return new Response(
      JSON.stringify({ 
        data: {
          night,
          participant,
        }
      }),
      { status: 200, headers }
    );
  } catch (error) {
    const { handleError } = await import('../_shared/errors.ts');
    const { response, status } = handleError(error, 'game-night-join');
    
    return new Response(JSON.stringify(response), { status, headers });
  }
});
