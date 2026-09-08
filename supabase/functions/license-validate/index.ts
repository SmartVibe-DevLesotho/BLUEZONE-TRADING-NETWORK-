import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const db = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ valid: false, message: 'Method not allowed.' }, 405);

  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ valid: false, message: 'Authentication required.' }, 401);
    const accessToken = auth.slice('Bearer '.length);
    const supabase = db();
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    const user = userData.user;
    if (userError || !user) return json({ valid: false, message: 'Invalid session.' }, 401);

    const body = await req.json().catch(() => ({}));
    const action = body.action;
    if (action !== 'activate' && action !== 'status') return json({ valid: false, message: 'Unsupported license action.' }, 400);
    if (!body.deviceId || typeof body.deviceId !== 'string' || body.deviceId.length < 8) return json({ valid: false, message: 'Device identity is required.' }, 400);

    if (action === 'status') {
      const { data, error } = await supabase
        .from('user_licenses')
        .select('license_id, licenses!inner(active, expires_at)')
        .eq('user_id', user.id);
      if (error) throw error;
      const now = Date.now();
      const active = (data ?? []).find((row: any) => row.licenses?.active && (!row.licenses.expires_at || new Date(row.licenses.expires_at).getTime() > now));
      return active
        ? json({ valid: true, message: 'License active.', expiresAt: active.licenses.expires_at ?? null })
        : json({ valid: false, message: 'An active SmartVibe license is required.' });
    }

    if (typeof body.token !== 'string' || !/^SVTN-[A-F0-9]{36}$/.test(body.token.trim().toUpperCase())) {
      return json({ valid: false, message: 'Invalid activation token.' }, 400);
    }
    const tokenHash = await sha256(body.token.trim().toUpperCase());
    const { data, error } = await supabase.rpc('redeem_license', { p_token_hash: tokenHash, p_user_id: user.id });
    if (error) throw error;
    const result = data?.[0];
    if (!result) return json({ valid: false, message: 'License service returned no result.' }, 500);
    return json({ valid: !!result.valid, message: result.message, expiresAt: result.expires_at ?? null });
  } catch (error) {
    console.error(error);
    return json({ valid: false, message: 'License service unavailable.' }, 500);
  }
});
