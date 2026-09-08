import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomHex(bytes = 18) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return Array.from(data).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

const adminClient = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Authentication required.' }, 401);
    const accessToken = auth.slice('Bearer '.length);
    const supabase = adminClient();
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !authData.user) return json({ error: 'Invalid session.' }, 401);

    const configuredOwner = Deno.env.get('SVTN_OWNER_USER_ID');
    const isRoleAdmin = authData.user.app_metadata?.role === 'admin';
    const isOwner = configuredOwner ? authData.user.id === configuredOwner : isRoleAdmin;
    if (!isOwner) return json({ error: 'Administration access denied.' }, 403);

    const body = await req.json().catch(() => ({}));
    if (body.action !== 'issue') return json({ error: 'Unsupported administration action.' }, 400);

    const durationDays = Math.min(3650, Math.max(1, Math.floor(Number(body.durationDays) || 30)));
    const rawToken = `SVTN-${randomHex(18)}`;
    const tokenHash = await sha256(rawToken);
    const expiresAt = new Date(Date.now() + durationDays * 86400000).toISOString();

    const { error: insertError } = await supabase.from('licenses').insert({
      token_hash: tokenHash,
      active: true,
      expires_at: expiresAt,
      max_activations: 1,
      activation_count: 0,
    });
    if (insertError) throw insertError;

    return json({ token: rawToken, expiresAt, maxActivations: 1 });
  } catch (error) {
    console.error(error);
    return json({ error: 'Secure token issuance failed.' }, 500);
  }
});
