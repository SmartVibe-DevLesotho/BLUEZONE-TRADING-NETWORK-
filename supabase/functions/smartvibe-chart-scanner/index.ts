import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const geminiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const emptyResult = (message: string) => ({ ok: false, detectedInstrument: null, detectedInstrumentLabel: null, broker: null, timeframe: null, chartReadable: false, direction: "WAIT", confidence: 0, methodology: { higherTimeframeDirection: "Not confirmed", m30Confirmation: "Not confirmed", resistanceSupportRbs: "Not confirmed", engulfing: "Not confirmed", lowerTimeframeConfirmation: "Not confirmed", trendlinePriceAction: "Not confirmed", structuralInvalidation: "Not confirmed", continuationManagement: "Not confirmed" }, feedback: message, warnings: ["No trading decision was fabricated from an unreadable or unsupported screenshot."], evidence: [] });

async function isLicensed(userId: string) {
  if (!supabaseUrl || !serviceRoleKey) return false;
  const response = await fetch(`${supabaseUrl}/rest/v1/user_licenses?select=license_id,licenses!inner(active,expires_at)&user_id=eq.${encodeURIComponent(userId)}&licenses.active=eq.true&limit=1`, { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } });
  if (!response.ok) return false;
  const rows = await response.json();
  const license = rows?.[0]?.licenses;
  return !!license && (!license.expires_at || new Date(license.expires_at).getTime() > Date.now());
}

const prompt = `You are the visual chart-analysis engine for SmartVibe Trading Network. Analyze ONLY the uploaded trading-chart screenshot. The screenshot itself is the source of truth for the instrument and visible market structure. Do not use a user-selected instrument, memory, or a generic default.

INSTRUMENT LOCK: Read the visible symbol, instrument name, watermark, or chart evidence. Gold/XAUUSD must remain Gold/XAUUSD and must never be silently treated as Nasdaq/NAS100. Nasdaq/NAS100/US100 must remain Nasdaq when shown. Normalize broker aliases to a broker-neutral label while preserving the original visible symbol in evidence. Identify Deriv, MT5, TradingView, or another broker/platform only when visually supported. If the instrument cannot be read reliably, return detectedInstrument=null and WAIT rather than guessing.

SMARTVIBE METHODOLOGY: H1 direction -> M30 confirmation -> support/resistance/RBS context -> EG BUY or EG SELL zone -> M5/M1 confirmation -> trendline/price-action confirmation -> directional decision -> structural invalidation stop -> next major support/resistance target -> MANAGE, DON'T CAP THE MOVE. EG BUY means bullish engulfing; EG SELL means bearish engulfing. Liquidity, FVG, order blocks, CRT/session structure and 714 are confluence only and cannot become independent strategies or override SmartVibe. 150-200 pips is a management milestone, never an automatic profit cap; valid 300/400/600+ pip continuation may remain open while methodology remains valid. Never invent unreadable prices. If evidence conflicts or is incomplete, choose WAIT. Do not promise profits.

Return ONLY JSON: {"ok":true,"detectedInstrument":"XAUUSD or broker-neutral symbol or null","detectedInstrumentLabel":"Gold, Nasdaq 100, EUR/USD, etc. or null","broker":"Deriv/MT5/TradingView/Other/null","timeframe":"visible timeframe or null","chartReadable":true,"direction":"BUY|SELL|WAIT","confidence":0,"methodology":{"higherTimeframeDirection":"...","m30Confirmation":"...","resistanceSupportRbs":"...","engulfing":"...","lowerTimeframeConfirmation":"...","trendlinePriceAction":"...","structuralInvalidation":"...","continuationManagement":"..."},"feedback":"Concise instrument-specific SmartVibe conclusion.","warnings":["..."],"evidence":["Visible screenshot evidence..."]}. Confidence is visual-analysis confidence, not probability of profit.`;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "POST required" }, 405);
  if (!geminiKey) return json({ ...emptyResult("The SmartVibe visual scanner is awaiting its server-side AI provider key."), status: "provider-pending" }, 503);
  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Authentication required." }, 401);
  try {
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${token}` } });
    if (!userResponse.ok) return json({ error: "Authenticated user could not be verified." }, 401);
    const user = await userResponse.json();
    if (!user?.id || !(await isLicensed(user.id))) return json({ error: "An active SmartVibe license is required to use the chart scanner." }, 403);
    const body = await request.json();
    const imageBase64 = String(body?.imageBase64 ?? "").replace(/^data:[^;]+;base64,/, "");
    const mimeType = String(body?.mimeType ?? "image/jpeg").toLowerCase();
    if (!imageBase64) return json({ error: "Chart screenshot is required." }, 400);
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) return json({ error: "Use a JPEG, PNG or WEBP screenshot." }, 400);
    if (imageBase64.length > 12000000) return json({ error: "Screenshot is too large. Please upload a smaller chart image." }, 413);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: imageBase64 } }] }], generationConfig: { temperature: 0.1, responseMimeType: "application/json" } }) });
    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.find((part: any) => part?.text)?.text;
    if (!response.ok || !raw) return json({ ...emptyResult("The visual AI provider did not return a usable chart analysis."), status: "unavailable" }, 503);
    let result: any;
    try { result = JSON.parse(raw); } catch { return json({ ...emptyResult("The visual AI provider returned malformed analysis. No trade decision was created."), status: "unavailable" }, 503); }
    const instrument = typeof result?.detectedInstrument === "string" && result.detectedInstrument.trim() ? result.detectedInstrument.trim() : null;
    const direction = ["BUY", "SELL", "WAIT"].includes(result?.direction) ? result.direction : "WAIT";
    result = { ...result, ok: !!instrument && !!result?.chartReadable, detectedInstrument: instrument, direction: !instrument || !result?.chartReadable ? "WAIT" : direction, confidence: Math.max(0, Math.min(100, Number(result?.confidence) || 0)), warnings: Array.isArray(result?.warnings) ? result.warnings.map(String).slice(0, 8) : [], evidence: Array.isArray(result?.evidence) ? result.evidence.map(String).slice(0, 10) : [] };
    return json(result);
  } catch (error) {
    return json({ ...emptyResult("The SmartVibe scanner is temporarily unavailable. No signal was fabricated."), status: "unavailable", detail: String(error) }, 503);
  }
});
