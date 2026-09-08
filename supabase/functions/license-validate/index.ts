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
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('id, active, expires_at, max_activations, activation_count')
      .eq('token_hash', tokenHash)
      .maybeSingle();
    if (licenseError) throw licenseError;
    if (!license) return json({ valid: false, message: 'Invalid activation token.' });
    if (!license.active) return json({ valid: false, message: 'This license has been revoked.' });
    if (license.expires_at && new Date(license.expires_at).getTime() <= Date.now()) return json({ valid: false, message: 'This license has expired.' });

    const { data: existing } = await supabase.from('user_licenses').select('id').eq('user_id', user.id).eq('license_id', license.id).maybeSingle();
    if (existing) return json({ valid: true, message: 'License already active.', expiresAt: license.expires_at ?? null });
    if (license.activation_count >= license.max_activations) return json({ valid: false, message: 'This license has reached its activation limit.' });

    const { data: claimed, error: claimError } = await supabase
      .from('licenses')
      .update({ activation_count: license.activation_count + 1 })
      .eq('id', license.id)
      .eq('activation_count', license.activation_count)
      .lt('activation_count', license.max_activations)
      .select('id')
      .maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) return json({ valid: false, message: 'This license has already been activated on another account.' });

    const { error: linkError } = await supabase.from('user_licenses').insert({ user_id: user.id, license_id: license.id });
    if (linkError) throw linkError;
    return json({ valid: true, message: 'License activated.', expiresAt: license.expires_at ?? null });
  } catch (error) {
    console.error(error);
    return json({ valid: false, message: 'License service unavailable.' }, 500);
  }
});
