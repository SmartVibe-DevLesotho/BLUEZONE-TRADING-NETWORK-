import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

const empty = (message: string) => ({
  ok: false,
  detectedInstrument: null,
  detectedInstrumentLabel: null,
  broker: null,
  timeframe: null,
  chartReadable: false,
  direction: "WAIT",
  confidence: 0,
  pineSetup: {
    detected: false,
    source: null,
    direction: null,
    entry: null,
    stopLoss: null,
    tp1: null,
    tp2: null,
    tp3: null,
    tp4: null,
    description: null,
  },
  methodology: {
    higherTimeframeDirection: "Not confirmed",
    m30Confirmation: "Not confirmed",
    resistanceSupportRbs: "Not confirmed",
    engulfing: "Not confirmed",
    lowerTimeframeConfirmation: "Not confirmed",
    trendlinePriceAction: "Not confirmed",
    structuralInvalidation: "Not confirmed",
    continuationManagement: "Not confirmed",
  },
  feedback: message,
  warnings: ["No decision was fabricated from an unreadable or unsupported screenshot."],
  evidence: [],
});

async function getUser(accessToken: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${accessToken}` },
  });
  return response.ok ? response.json() : null;
}

async function hasScannerAccess(userId: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/smartvibe_user_has_scanner_access`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_user_id: userId }),
  });
  if (!response.ok) return false;
  return (await response.json()) === true;
}

const prompt = [
  "You are SmartVibe Trading Network's visual chart-analysis engine.",
  "Analyze ONLY the uploaded screenshot. The screenshot is the source of truth for what is visually present.",
  "There are TWO separate jobs: (1) read the chart/Pine annotations faithfully, and (2) decide whether the Canonical SmartVibe methodology is sufficiently confirmed.",
  "Pine/TradingView screenshots are valid inputs. Recognize horizontal lines, colored levels, labels such as ENTRY, SL, TP 1, TP 2, TP 3, TP 4, BUY and SELL, arrows and plotted trade-plan annotations.",
  "If a Pine/TradingView label is readable, transcribe its numeric price exactly. Do not replace it with a calculated or invented value.",
  "If the screenshot has a staged plan with Entry + SL + multiple TPs, preserve ALL visible levels in pineSetup. Never collapse TP1-TP4 into one target.",
  "Infer pineSetup.direction from the visible plan only when the directional evidence is clear (for example BUY label or targets above entry with stop below entry). This is a SCREENSHOT PLAN extraction, not live execution authorization.",
  "Pine setup extraction does NOT require the instrument symbol to be visible. If the chart is readable but the symbol is cropped/unreadable, still extract the Pine plan and say the instrument is unconfirmed.",
  "For the live SmartVibe direction field, instrument and chart readability remain gating requirements. Never silently substitute a default instrument.",
  "Gold/XAUUSD remains Gold; Nasdaq/NAS100/US100 remains Nasdaq. Normalize broker aliases but preserve the visible symbol in evidence.",
  "Identify Deriv, MT5, TradingView or another platform only when visible.",
  "Canonical SmartVibe methodology: H1 direction -> M30 confirmation -> support/resistance/RBS -> EG BUY/EG SELL zone -> M5/M1 confirmation -> trendline/price-action confirmation -> BUY/SELL/WAIT -> structural invalidation -> next major support/resistance -> MANAGE, DON'T CAP THE MOVE.",
  "EG BUY means bullish engulfing; EG SELL means bearish engulfing.",
  "Liquidity, FVG, OB, CRT/session structure and 714 are confluence only.",
  "150-200 pips is a management milestone, never a hard cap; valid 300/400/600+ continuation remains eligible while methodology is valid.",
  "Never invent unreadable prices. Do not promise profits.",
  "Return ONLY JSON with fields: ok, detectedInstrument, detectedInstrumentLabel, broker, timeframe, chartReadable, direction (BUY|SELL|WAIT), confidence (0-100), pineSetup {detected, source, direction, entry, stopLoss, tp1, tp2, tp3, tp4, description}, methodology (higherTimeframeDirection, m30Confirmation, resistanceSupportRbs, engulfing, lowerTimeframeConfirmation, trendlinePriceAction, structuralInvalidation, continuationManagement), feedback, warnings[], evidence[].",
].join("\n");

const modelCandidates = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];

async function callGemini(model: string, mime: string, image: string) {
  return await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: image } }] }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      }),
    },
  );
}

function cleanJson(raw: string) {
  const trimmed = raw.trim();
  const fenced = trimmed.replace(/^\`\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\`$/i, "").trim();
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(fenced.slice(start, end + 1)); } catch { return null; }
}

function normalizeOutput(output: any) {
  const instrument = typeof output?.detectedInstrument === "string" && output.detectedInstrument.trim()
    ? output.detectedInstrument.trim()
    : null;
  const rawSetup = output?.pineSetup ?? {};
  const num = (v: any) => Number.isFinite(Number(v)) ? Number(v) : null;
  const setupDirection = ["BUY", "SELL", "WAIT"].includes(rawSetup?.direction) ? rawSetup.direction : null;
  const chartReadable = Boolean(output?.chartReadable);
  const direction = ["BUY", "SELL", "WAIT"].includes(output?.direction) ? output.direction : "WAIT";
  const pineSetup = {
    detected: Boolean(rawSetup?.detected),
    source: typeof rawSetup?.source === "string" ? rawSetup.source : null,
    direction: setupDirection,
    entry: num(rawSetup?.entry),
    stopLoss: num(rawSetup?.stopLoss),
    tp1: num(rawSetup?.tp1),
    tp2: num(rawSetup?.tp2),
    tp3: num(rawSetup?.tp3),
    tp4: num(rawSetup?.tp4),
    description: typeof rawSetup?.description === "string" ? rawSetup.description : null,
  };
  return {
    ...output,
    ok: Boolean(chartReadable || pineSetup.detected),
    detectedInstrument: instrument,
    direction: !instrument || !chartReadable ? "WAIT" : direction,
    confidence: Math.max(0, Math.min(100, Number(output?.confidence) || 0)),
    pineSetup,
    warnings: Array.isArray(output?.warnings) ? output.warnings.map(String).slice(0, 8) : [],
    evidence: Array.isArray(output?.evidence) ? output.evidence.map(String).slice(0, 12) : [],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  if (!GEMINI_KEY) {
    return json({ ...empty("The visual scanner is awaiting its server-side AI provider key."), status: "provider-pending" }, 503);
  }

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Authentication required." }, 401);

  try {
    const user = await getUser(token);
    if (!user?.id) return json({ error: "Authenticated user could not be verified." }, 401);
    if (!(await hasScannerAccess(user.id))) {
      return json({ error: "Chart Scanner is available on Advanced and Premium Pro subscriptions only." }, 403);
    }

    const body = await req.json();
    const image = String(body?.imageBase64 ?? "").replace(/^data:[^;]+;base64,/, "");
    const mime = String(body?.mimeType ?? "image/jpeg").toLowerCase();
    if (!image) return json({ error: "Chart screenshot is required." }, 400);
    if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) return json({ error: "Use JPEG, PNG or WEBP." }, 400);
    if (image.length > 12000000) return json({ error: "Screenshot is too large." }, 413);

    let response: Response | null = null;
    let data: any = null;
    for (const model of modelCandidates) {
      try {
        response = await callGemini(model, mime, image);
        data = await response.json();
        const raw = data?.candidates?.[0]?.content?.parts?.find((part: any) => typeof part?.text === "string" && part.text.trim())?.text;
        if (response.ok && raw) {
          const output = cleanJson(raw);
          if (output) return json(normalizeOutput(output));
        }
      } catch (providerError) {
        console.error("SmartVibe scanner provider attempt failed", providerError);
      }
    }

    console.error("SmartVibe scanner provider exhausted", {
      status: response?.status ?? null,
      providerError: data?.error?.status ?? data?.error?.message ?? null,
    });
    return json({ ...empty("The visual AI provider did not return usable analysis. No signal was fabricated."), status: "unavailable" }, 503);
  } catch (error) {
    console.error(error);
    return json({ ...empty("The SmartVibe scanner is temporarily unavailable. No signal was fabricated."), status: "unavailable" }, 503);
  }
});
