import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, getResponseHeaders } from '../_shared/cors.ts';
import { getAuthContext, getServiceClient } from '../_shared/auth.ts';
import { createAuditLog } from '../_shared/audit.ts';
import { checkRateLimit } from '../_shared/rate-limit.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const RequestSchema = z.object({
  requestId: z.string().uuid('Invalid request ID'),
  action: z.enum(['accept', 'decline', 'block']),
});

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = getResponseHeaders(req);

  try {
    const auth = await getAuthContext(req);
    
    // Rate limit: 20 requests per 10 minutes
    const rateLimit = await checkRateLimit(auth.userId, 'friends-respond', 20);
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
    const { requestId, action } = RequestSchema.parse(body);

    const supabase = getServiceClient();

    // Get the friend request
    const { data: friendRequest, error: fetchError } = await supabase
      .from('friends')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !friendRequest) {
      return new Response(
        JSON.stringify({ error: 'Resource not found' }),
        { status: 404, headers }
      );
    }

    // Only the addressee can respond to a pending request
    // But requester can also decline/cancel their own request
    const isAddressee = friendRequest.addressee_id === auth.userId;
    const isRequester = friendRequest.requester_id === auth.userId;

    if (!isAddressee && !isRequester) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers }
      );
    }

    // Requester can only decline (cancel) their pending request
    if (isRequester && !isAddressee && action !== 'decline') {
      return new Response(
        JSON.stringify({ error: 'Invalid operation' }),
        { status: 403, headers }
      );
    }

    // Map action to status
    const statusMap = {
      accept: 'accepted',
      decline: 'declined',
      block: 'blocked',
    } as const;

    const newStatus = statusMap[action];

    // Update the friend request
    const { data: updated, error: updateError } = await supabase
      .from('friends')
      .update({ status: newStatus })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Audit log
    await createAuditLog({
      actorId: auth.userId,
      action: `friend_request_${action}ed`,
      entityType: 'friends',
      entityId: requestId,
      metadata: { 
        requesterId: friendRequest.requester_id,
        addresseeId: friendRequest.addressee_id,
        newStatus,
      },
    });

    return new Response(
      JSON.stringify({ data: updated }),
      { status: 200, headers }
    );
  } catch (error) {
    const { handleError } = await import('../_shared/errors.ts');
    const { response, status } = handleError(error, 'friends-respond');
    
    return new Response(JSON.stringify(response), { status, headers });
  }
});
