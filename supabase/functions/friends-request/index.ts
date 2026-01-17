import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, getResponseHeaders } from '../_shared/cors.ts';
import { getAuthContext, getServiceClient } from '../_shared/auth.ts';
import { createAuditLog } from '../_shared/audit.ts';
import { checkRateLimit } from '../_shared/rate-limit.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const RequestSchema = z.object({
  addresseeIdentifier: z.string().min(1, 'Username required').max(50, 'Username too long'),
});

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = getResponseHeaders(req);

  try {
    const auth = await getAuthContext(req);
    
    // Rate limit: 10 requests per 10 minutes
    const rateLimit = await checkRateLimit(auth.userId, 'friends-request', 10);
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
    const { addresseeIdentifier } = RequestSchema.parse(body);

    const supabase = getServiceClient();

    // Find user by username only (no email lookup to prevent enumeration)
    const { data: profileByUsername } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', addresseeIdentifier)
      .single();

    // Use generic error message to prevent enumeration
    if (!profileByUsername) {
      // Log failed attempt for security monitoring
      await createAuditLog({
        actorId: auth.userId,
        action: 'friend_request_failed',
        entityType: 'friends',
        metadata: { reason: 'user_not_found' },
      });
      
      return new Response(
        JSON.stringify({ error: 'Unable to send friend request' }),
        { status: 400, headers }
      );
    }

    const addresseeId = profileByUsername.id;

    if (addresseeId === auth.userId) {
      return new Response(
        JSON.stringify({ error: 'Unable to send friend request' }),
        { status: 400, headers }
      );
    }

    // Check if friend request already exists
    const { data: existing } = await supabase
      .from('friends')
      .select('*')
      .or(`and(requester_id.eq.${auth.userId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${auth.userId})`)
      .single();

    if (existing) {
      // Use generic error for blocked users to prevent enumeration
      if (existing.status === 'blocked') {
        return new Response(
          JSON.stringify({ error: 'Unable to send friend request' }),
          { status: 400, headers }
        );
      }
      if (existing.status === 'pending' || existing.status === 'accepted') {
        return new Response(
          JSON.stringify({ error: 'Friend request already exists', status: existing.status }),
          { status: 409, headers }
        );
      }
    }

    // Create friend request
    const { data: friendRequest, error: insertError } = await supabase
      .from('friends')
      .insert({
        requester_id: auth.userId,
        addressee_id: addresseeId,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Audit log
    await createAuditLog({
      actorId: auth.userId,
      action: 'friend_request_sent',
      entityType: 'friends',
      entityId: friendRequest.id,
      metadata: { addresseeId },
    });

    return new Response(
      JSON.stringify({ data: friendRequest }),
      { status: 201, headers }
    );
  } catch (error) {
    const { handleError } = await import('../_shared/errors.ts');
    const { response, status } = handleError(error, 'friends-request');
    
    return new Response(JSON.stringify(response), { status, headers });
  }
});
