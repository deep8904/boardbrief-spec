import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, getResponseHeaders } from '../_shared/cors.ts';
import { getAuthContext, getServiceClient } from '../_shared/auth.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const RequestSchema = z.object({
    nightId: z.string().uuid(),
    userId: z.string().uuid(),
    roundIndex: z.number().int().min(0),
    score: z.number().int(),
});

serve(async (req) => {
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    const headers = getResponseHeaders(req);

    try {
        const auth = await getAuthContext(req);
        const body = await req.json();
        const { nightId, userId, roundIndex, score } = RequestSchema.parse(body);

        const supabase = getServiceClient();

        // Verify user is allowed (Host or Self)
        // We can do this with RLS if we used user client, but passing service role is easier + stronger check here.
        const { data: night, error: nightError } = await supabase
            .from('game_nights')
            .select('host_id')
            .eq('id', nightId)
            .single();

        if (nightError || !night) throw new Error("Night not found");

        // Check permissions
        if (night.host_id !== auth.userId && userId !== auth.userId) {
            throw new Error("Unauthorized: Only host can update other players' scores");
        }

        // Upsert score
        const { error: upsertError } = await supabase
            .from('night_scores')
            .upsert({
                game_night_id: nightId,
                user_id: userId,
                round_index: roundIndex,
                score: score,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'game_night_id,user_id,round_index' });

        if (upsertError) throw upsertError;

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers }
        );
    } catch (error) {
        const { handleError } = await import('../_shared/errors.ts');
        const { response, status } = handleError(error, 'game-night-update-score');
        return new Response(JSON.stringify(response), { status, headers });
    }
});
