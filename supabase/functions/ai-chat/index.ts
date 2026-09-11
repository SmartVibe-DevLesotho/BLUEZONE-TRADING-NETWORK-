import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type RequestBody = {
  message?: string;
  context?: unknown;
};

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json; charset=utf-8",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

const gatewayUrl = Deno.env.get("CLOUDFLARE_AI_GATEWAY_URL")?.replace(/\/$/, "");
const gatewayToken = Deno.env.get("CLOUDFLARE_AI_GATEWAY_TOKEN");

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (!gatewayUrl) return json({ error: "Cloudflare AI gateway is not configured." }, 503);

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  const message = body.message?.trim();
  if (!message) return json({ error: "A message is required." }, 400);
  if (message.length > 4000) return json({ error: "Message is too long." }, 413);

  try {
    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(gatewayToken ? { Authorization: `Bearer ${gatewayToken}` } : {}),
      },
      body: JSON.stringify({ message, context: body.context }),
    });

    const payload = await response.json().catch(() => ({ error: "Invalid AI gateway response." }));
    if (!response.ok) return json(payload, response.status >= 500 ? 503 : response.status);
    return json(payload);
  } catch (error) {
    console.error("Cloudflare AI gateway request failed", error);
    return json({ error: "AI service is temporarily unavailable." }, 503);
  }
});
