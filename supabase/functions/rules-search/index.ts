import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, getResponseHeaders } from '../_shared/cors.ts';
import { getAuthContext, getServiceClient } from '../_shared/auth.ts';
import { checkRateLimit } from '../_shared/rate-limit.ts';
import { createAuditLog } from '../_shared/audit.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const RequestSchema = z.object({
  gameId: z.string().uuid('Invalid game ID'),
  question: z.string().min(5, 'Question must be at least 5 characters').max(500, 'Question too long'),
});

const CitationSchema = z.object({
  title: z.string(),
  url: z.string(),
  excerpt: z.string(),
});

const AIResponseSchema = z.object({
  answer: z.string(),
  confidence: z.number().min(0).max(1),
  tags: z.array(z.string()),
  citations: z.array(CitationSchema),
  why: z.string(),
});

/**
 * Perform an external web search for board game rules. This function supports
 * multiple providers based on environment configuration. Supported providers
 * include Tavily and Serper. If the provider is not configured, a simple
 * fallback returns common board game rule sources. Provider keys and names
 * must be defined via environment variables:
 *  - SEARCH_API_PROVIDER: "tavily" | "serper" | undefined (defaults to stub)
 *  - TAVILY_API_KEY: API key for Tavily search
 *  - SERPER_API_KEY: API key for Serper search
 */
async function webSearch(query: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
  const provider = (Deno.env.get('SEARCH_API_PROVIDER') || '').toLowerCase();

  // Helper to normalize results to a common shape
  const normalize = (results: any[], titleKey: string, linkKey: string, snippetKey: string) => {
    return results
      .filter((item) => item && item[titleKey] && item[linkKey])
      .map((item) => ({
        title: item[titleKey],
        url: item[linkKey],
        snippet: item[snippetKey] || '',
      }));
  };

  try {
    if (provider === 'tavily') {
      const key = Deno.env.get('TAVILY_API_KEY');
      if (!key) throw new Error('TAVILY_API_KEY not set');
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key },
        body: JSON.stringify({ query, max_results: 5 }),
      });
      if (response.ok) {
        const data = await response.json();
        return normalize(data.results || [], 'title', 'url', 'snippet');
      }
      throw new Error(`Tavily search failed with status ${response.status}`);
    } else if (provider === 'serper') {
      const key = Deno.env.get('SERPER_API_KEY');
      if (!key) throw new Error('SERPER_API_KEY not set');
      const response = await fetch('https://api.serper.dev/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': key },
        body: JSON.stringify({ q: query, num: 5 }),
      });
      if (response.ok) {
        const data = await response.json();
        // Serper returns results in data.organic or data.results
        const results = data.organic || data.results || [];
        return normalize(results, 'title', 'link', 'snippet');
      }
      throw new Error(`Serper search failed with status ${response.status}`);
    }
  } catch (error) {
    console.error('Web search API error:', error);
    // fall through to fallback
  }

  // Fallback: return static rule sources when no provider is configured or an error occurs
  try {
    const searchTerms = encodeURIComponent(query);
    const baseName = query.split(' ')[0];
    return [
      {
        title: `${baseName} - Official Rules | BoardGameGeek`,
        url: `https://boardgamegeek.com/boardgame/search?q=${searchTerms}`,
        snippet: `Find official rules, FAQs, and community discussions about ${baseName} rules.`,
      },
      {
        title: `How to Play - Rules & Setup Guide`,
        url: `https://www.ultraboardgames.com/search.php?q=${searchTerms}`,
        snippet: `Complete rules guide including setup, gameplay, and frequently asked questions.`,
      },
      {
        title: `Rules Reference - FAQ`,
        url: `https://www.wikihow.com/Play-${baseName.replace(/\s+/g, '-')}`,
        snippet: `Step-by-step guide covering all aspects of gameplay, special cases, and common rule questions.`,
      },
    ];
  } catch (error) {
    console.error('Fallback search error:', error);
    return [];
  }
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const headers = getResponseHeaders(req);

  try {
    const auth = await getAuthContext(req);
    const body = await req.json();
    const { gameId, question } = RequestSchema.parse(body);

    // Rate limiting
    const rateLimit = await checkRateLimit(auth.userId, 'rules-search', 30);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded', 
          resetAt: rateLimit.resetAt.toISOString() 
        }),
        { status: 429, headers }
      );
    }

    const supabase = getServiceClient();

    // Get game name
    const { data: game, error: gameError } = await supabase
      .from('games_catalog')
      .select('name, slug')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      return new Response(
        JSON.stringify({ error: 'Resource not found' }),
        { status: 404, headers }
      );
    }

    // Web search for sources
    const searchQuery = `${game.name} rules FAQ ${question}`;
    const sources = await webSearch(searchQuery);

    // Prepare context from sources
    const sourcesContext = sources.map((s, i) => 
      `[${i + 1}] ${s.title}\nURL: ${s.url}\nContent: ${s.snippet}`
    ).join('\n\n');

    // Call Gemini via Google AI Studio API
    // The Gemini endpoint requires an API key (GEMINI_API_KEY). We use a system
    // prompt to enforce strict citation and JSON response. If the call fails
    // or the response cannot be parsed as JSON, we fall back to a generic
    // answer assembled from the sources.
    const aiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + Deno.env.get('GEMINI_API_KEY'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are a board game rules expert. Answer questions about ${game.name} rules ONLY using the provided sources.

CRITICAL RULES:
1. ONLY use information from the provided sources
2. ALWAYS cite your sources using the provided URLs
3. If the sources don't contain enough information, say so clearly
4. Be concise but thorough
5. Provide confidence score based on source quality (0-1)

You MUST respond with valid JSON in this exact format:
{
  \"answer\": \"Your clear, concise answer here\",
  \"confidence\": 0.85,
  \"tags\": [\"setup\", \"scoring\", \"rules\"],
  \"citations\": [
    {\"title\": \"Source Title\", \"url\": \"https://...\", \"excerpt\": \"Relevant quote from source\"}
  ],
  \"why\": \"Brief explanation of how you derived this answer\"
}

SOURCES:
${sourcesContext}

QUESTION about ${game.name}: ${question}`
              },
            ],
          },
        ],
        generation_config: {
          temperature: 0.3,
          max_output_tokens: 1024,
        },
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI service unavailable (status ${aiResponse.status})`);
    }
    const aiData = await aiResponse.json();
    // Gemini returns candidates array with content
    let rawContent: string | undefined;
    if (aiData.candidates && aiData.candidates.length > 0) {
      // Some versions return content.parts[0].text, others direct text
      const content = aiData.candidates[0]?.content;
      if (content?.parts && content.parts.length > 0) {
        rawContent = content.parts[0].text;
      }
    }
    if (!rawContent) {
      throw new Error('AI service returned empty response');
    }
    // Parse and validate AI response
    let parsedResponse;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      parsedResponse = AIResponseSchema.parse(JSON.parse(jsonMatch[0]));
    } catch (parseError) {
      console.error('Failed to parse AI response:', rawContent);
      parsedResponse = {
        answer: rawContent.trim(),
        confidence: 0.5,
        tags: ['general'],
        citations: sources.map((s) => ({ title: s.title, url: s.url, excerpt: s.snippet })),
        why: 'Response generated from available sources',
      };
    }

    // Save to database
    const { data: savedAnswer, error: saveError } = await supabase
      .from('rule_answers')
      .insert({
        user_id: auth.userId,
        game_id: gameId,
        question,
        answer: parsedResponse.answer,
        confidence: parsedResponse.confidence,
        tags: parsedResponse.tags,
        citations: parsedResponse.citations,
        why: parsedResponse.why,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save answer:', saveError);
    }

    // Audit log
    await createAuditLog({
      actorId: auth.userId,
      action: 'rules_search',
      entityType: 'rule_answers',
      entityId: savedAnswer?.id,
      metadata: { gameId, question, confidence: parsedResponse.confidence },
    });

    return new Response(
      JSON.stringify({ 
        data: {
          id: savedAnswer?.id,
          ...parsedResponse,
          game: { id: gameId, name: game.name },
        },
        rateLimit: {
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt.toISOString(),
        }
      }),
      { status: 200, headers }
    );
  } catch (error) {
    const { handleError } = await import('../_shared/errors.ts');
    const { response, status } = handleError(error, 'rules-search');
    
    return new Response(JSON.stringify(response), { status, headers });
  }
});
