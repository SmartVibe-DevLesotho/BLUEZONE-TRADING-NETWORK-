type Env = {
  AI: { run: (model: string, input: unknown) => Promise<unknown> };
  AI_MODEL?: string;
  AI_GATEWAY_TOKEN?: string;
};

type ChatRequest = {
  message?: string;
  context?: unknown;
};

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json; charset=utf-8',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function authorized(request: Request, env: Env): boolean {
  if (!env.AI_GATEWAY_TOKEN) return true;
  return request.headers.get('authorization') === `Bearer ${env.AI_GATEWAY_TOKEN}`;
}

function normalizeContext(context: unknown): string {
  if (context === undefined || context === null) return 'No additional trading context was supplied.';
  try {
    const text = JSON.stringify(context);
    return text.length > 4000 ? `${text.slice(0, 4000)}…` : text;
  } catch {
    return 'Trading context was supplied but could not be serialized.';
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
    if (!authorized(request, env)) return json({ error: 'Unauthorized.' }, 401);

    let body: ChatRequest;
    try {
      body = await request.json<ChatRequest>();
    } catch {
      return json({ error: 'Request body must be valid JSON.' }, 400);
    }

    const message = body.message?.trim();
    if (!message) return json({ error: 'A message is required.' }, 400);
    if (message.length > 4000) return json({ error: 'Message is too long.' }, 413);

    const system = [
      'You are the SmartVibe Trading Network assistant.',
      'SmartVibe Trading Strategy is the primary methodology.',
      'Supporting mechanisms provide evidence only and cannot override the primary methodology.',
      'Do not claim certainty, guaranteed profits, or access to live broker execution unless the request explicitly provides verified execution results.',
      'When market data is absent or stale, say that the evidence is insufficient instead of inventing prices or signals.',
      'Treat BUY, SELL, and WAIT as methodology decisions, not financial guarantees.',
      'Prefer disciplined risk management, structural invalidation, and confirmation over prediction.',
    ].join(' ');

    const model = env.AI_MODEL || '@cf/meta/llama-3.1-8b-instruct';

    try {
      const result = await env.AI.run(model, {
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `Trading context:\n${normalizeContext(body.context)}\n\n${message}` },
        ],
        max_tokens: 700,
        temperature: 0.2,
      });

      const reply = typeof result === 'object' && result !== null && 'response' in result
        ? String((result as { response?: unknown }).response ?? '')
        : '';
      if (!reply.trim()) return json({ error: 'AI service returned an empty response.' }, 502);
      return json({ reply: reply.trim(), status: 'ok', model });
    } catch (error) {
      console.error('Workers AI request failed', error);
      return json({ error: 'AI service is temporarily unavailable.' }, 503);
    }
  },
};
