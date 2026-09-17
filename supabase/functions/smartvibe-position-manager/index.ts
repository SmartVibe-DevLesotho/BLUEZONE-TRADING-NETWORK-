import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-smartvibe-automation-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};
const ENGINE = 'SMARTVIBE-CORE-1.4.0';
const REQUEST_TIMEOUT_MS = 8000;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: CORS });
const safeFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try { return await fetch(input, { ...init, signal: controller.signal }); } finally { clearTimeout(timer); }
};
const num = (v: unknown) => Number(v);
const finite = (v: unknown) => Number.isFinite(num(v));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, error: 'METHOD_NOT_ALLOWED', mode: 'LIVE_ONLY' }, 405);
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const bridgeUrl = Deno.env.get('MT5_BRIDGE_URL')?.replace(/\/$/, '');
    const bridgeToken = Deno.env.get('MT5_BRIDGE_TOKEN');
    if (!supabaseUrl || !serviceKey || !bridgeUrl || !bridgeToken) return json({ ok: false, error: 'SMARTVIBE_AUTOMATION_NOT_CONFIGURED', mode: 'LIVE_ONLY' }, 503);
    const admin = createClient(supabaseUrl, serviceKey);
    const supplied = req.headers.get('x-smartvibe-automation-key') ?? '';
    const { data: keyData, error: keyError } = await admin.rpc('smartvibe_get_automation_key');
    if (keyError || !keyData || supplied !== keyData) return json({ ok: false, error: 'SMARTVIBE_AUTOMATION_UNAUTHORIZED', mode: 'LIVE_ONLY' }, 401);
    const headers: Record<string, string> = { accept: 'application/json', authorization: `Bearer ${bridgeToken}` };
    const audit = async (event_type: string, payload: Record<string, unknown>, orderId?: string) => { await admin.from('smartvibe_trade_audit').insert({ event_type, order_id: orderId ?? null, methodology_version: ENGINE, payload: { ...payload, system: 'SMARTVIBE POSITION MANAGER' } }); };
    const healthResponse = await safeFetch(`${bridgeUrl}/health`, { headers });
    const health = await healthResponse.json().catch(() => null) as Record<string, unknown> | null;
    if (!healthResponse.ok || !health?.connected || !health?.trade_allowed) { await audit('POSITION_MANAGER_BLOCKED', { reason: 'MT5_TRADING_NOT_AVAILABLE' }); return json({ ok: false, error: 'MT5_TRADING_NOT_AVAILABLE', mode: 'LIVE_ONLY' }, 503); }
    const accountResponse = await safeFetch(`${bridgeUrl}/account`, { headers });
    const account = await accountResponse.json().catch(() => null) as Record<string, unknown> | null;
    if (!accountResponse.ok || !account || !finite(account.equity) || !finite(account.balance)) return json({ ok: false, error: 'MT5_ACCOUNT_UNAVAILABLE', mode: 'LIVE_ONLY' }, 503);
    const equity = num(account.equity), currency = String(account.currency ?? '').toUpperCase();
    let cap: number;
    if (currency === 'USD') cap = equity < 10 ? 5 : 10;
    else if (currency === 'ZAR') cap = equity < 200 ? 5 : 10;
    else { await audit('POSITION_CAP_BLOCKED', { reason: 'UNSUPPORTED_ACCOUNT_CURRENCY', currency, equity }); return json({ ok: false, error: 'UNSUPPORTED_ACCOUNT_CURRENCY', currency, mode: 'LIVE_ONLY' }, 409); }
    await admin.from('smartvibe_trading_controls').update({ max_open_positions: cap, updated_at: new Date().toISOString() }).eq('id', true);
    const positionsResponse = await safeFetch(`${bridgeUrl}/positions`, { headers });
    const positionsBody = await positionsResponse.json().catch(() => null) as any;
    const positions = Array.isArray(positionsBody) ? positionsBody : (Array.isArray(positionsBody?.positions) ? positionsBody.positions : []);
    const orderIds = positions.map((p: any) => String(p.ticket)).filter(Boolean);
    const { data: managedOrders } = orderIds.length ? await admin.from('smartvibe_live_orders').select('id,external_order_id,position_role,parent_order_id,broker_entry,sl,tp,status').in('external_order_id', orderIds) : { data: [] as any[] };
    const managed = new Map((managedOrders ?? []).map((o: any) => [String(o.external_order_id), o]));
    const trailTriggerR = Math.max(0.5, Number(Deno.env.get('SMARTVIBE_TRAIL_TRIGGER_R') ?? '1'));
    const trailDistanceR = Math.max(0.25, Number(Deno.env.get('SMARTVIBE_TRAIL_DISTANCE_R') ?? '0.75'));
    const trailStepR = Math.max(0.05, Number(Deno.env.get('SMARTVIBE_TRAIL_STEP_R') ?? '0.10'));
    const reentryCloseR = Math.max(0.25, Number(Deno.env.get('SMARTVIBE_REENTRY_CLOSE_R') ?? '0.50'));
    let modified = 0, closed = 0, skipped = 0;
    for (const position of positions) {
      const ticket = String(position.ticket), order = managed.get(ticket);
      if (!order || order.status !== 'EXECUTED' || !finite(position.price_open) || !finite(position.sl)) { skipped++; continue; }
      const symbol = String(position.symbol), isBuy = Number(position.type) === 0, entry = num(position.price_open), currentSl = num(position.sl), initialSl = num(order.sl), initialEntry = finite(order.broker_entry) ? num(order.broker_entry) : entry, risk = Math.abs(initialEntry - initialSl);
      if (!finite(risk) || risk <= 0) { skipped++; continue; }
      const quoteResponse = await safeFetch(`${bridgeUrl}/price/${encodeURIComponent(symbol)}`, { headers });
      const quote = await quoteResponse.json().catch(() => null) as Record<string, unknown> | null;
      if (!quoteResponse.ok || !quote || !finite(quote.bid) || !finite(quote.ask)) { skipped++; continue; }
      const market = isBuy ? num(quote.bid) : num(quote.ask), favorable = isBuy ? market - entry : entry - market;
      if (!finite(favorable)) { skipped++; continue; }
      const profitR = favorable / risk;
      if (order.position_role === 'REENTRY' && order.parent_order_id && profitR >= reentryCloseR) {
        const { data: parent } = await admin.from('smartvibe_live_orders').select('id,external_order_id,status').eq('id', order.parent_order_id).maybeSingle();
        if (parent?.status === 'EXECUTED' && parent.external_order_id) {
          const parentOpen = positions.some((p: any) => String(p.ticket) === String(parent.external_order_id));
          if (parentOpen) {
            const closeResponse = await safeFetch(`${bridgeUrl}/position/${encodeURIComponent(ticket)}/close`, { method: 'POST', headers });
            const closeBody = await closeResponse.json().catch(() => null);
            if (closeResponse.ok && [10009, 10010].includes(num(closeBody?.retcode))) {
              closed++; await admin.from('smartvibe_live_orders').update({ status: 'CLOSED_BY_SMARTVIBE', bridge_response: closeBody ?? {}, updated_at: new Date().toISOString() }).eq('id', order.id);
              await audit('REENTRY_CLOSED', { ticket, symbol, profitR, reason: 'INITIAL_POSITION_PRIORITY' }, order.id); continue;
            }
          }
        }
      }
      if (profitR < trailTriggerR) continue;
      const candidate = isBuy ? market - risk * trailDistanceR : market + risk * trailDistanceR;
      const moveEnough = isBuy ? candidate > currentSl + risk * trailStepR : candidate < currentSl - risk * trailStepR;
      const protectsProfit = isBuy ? candidate >= entry : candidate <= entry;
      if (!moveEnough || !protectsProfit) continue;
      const modifyResponse = await safeFetch(`${bridgeUrl}/position/${encodeURIComponent(ticket)}?sl=${encodeURIComponent(String(candidate))}`, { method: 'PATCH', headers });
      const modifyBody = await modifyResponse.json().catch(() => null);
      if (modifyResponse.ok && [10009, 10010].includes(num(modifyBody?.retcode))) {
        modified++; await admin.from('smartvibe_live_orders').update({ sl: candidate, bridge_response: modifyBody ?? {}, updated_at: new Date().toISOString() }).eq('id', order.id);
        await audit('TRAILING_STOP_MOVED', { ticket, symbol, role: order.position_role, profitR, previousSl: currentSl, newSl: candidate }, order.id);
      }
    }
    await audit('POSITION_MANAGER_HEARTBEAT', { equity, currency, maxOpenPositions: cap, openPositions: positions.length, modified, closed, skipped });
    return json({ ok: true, mode: 'LIVE_ONLY', system: 'SMARTVIBE POSITION MANAGER', branding: 'SMARTVIBE TRADING NETWORK', equity, currency, maxOpenPositions: cap, openPositions: positions.length, modified, closed, skipped });
  } catch { return json({ ok: false, error: 'SMARTVIBE_POSITION_MANAGER_INTERNAL_ERROR', mode: 'LIVE_ONLY' }, 500); }
});
