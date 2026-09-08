import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });

function randomHex(bytes = 18) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return Array.from(data).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}
async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
const db = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Authentication required.' }, 401);
    const supabase = db();
    const { data, error } = await supabase.auth.getUser(auth.slice(7));
    if (error || !data.user) return json({ error: 'Invalid session.' }, 401);

    // The existing Supabase platform-admin registry is the authoritative owner/admin gate.
    const { data: adminRecord, error: adminError } = await supabase
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', data.user.id)
      .maybeSingle();
    if (adminError) throw adminError;
    if (!adminRecord) return json({ error: 'Administration access denied.' }, 403);

    const body = await req.json().catch(() => ({}));
    if (body.action !== 'issue') return json({ error: 'Unsupported administration action.' }, 400);
    const durationDays = Math.min(3650, Math.max(1, Math.floor(Number(body.durationDays) || 30)));
    const token = `SVTN-${randomHex()}`;
    const tokenHash = await sha256(token);
    const expiresAt = new Date(Date.now() + durationDays * 86400000).toISOString();
    const { error: insertError } = await supabase.from('licenses').insert({ token_hash: tokenHash, active: true, expires_at: expiresAt, max_activations: 1, activation_count: 0 });
    if (insertError) throw insertError;
    return json({ token, expiresAt, maxActivations: 1 });
  } catch (error) {
    console.error(error);
    return json({ error: 'Secure token issuance failed.' }, 500);
  }
});
