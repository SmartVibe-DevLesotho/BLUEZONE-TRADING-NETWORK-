-- SMARTVIBE TRADING NETWORK: autonomous live position management.
-- The automation credential is generated inside Supabase Vault and is never committed to Git.
create extension if not exists pg_cron;
create extension if not exists pg_net;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'smartvibe_automation_key') THEN
    PERFORM vault.create_secret(encode(gen_random_bytes(32), 'base64'), 'smartvibe_automation_key', 'SmartVibe autonomous position manager credential');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.smartvibe_get_automation_key()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'smartvibe_automation_key' LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.smartvibe_get_automation_key() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.smartvibe_get_automation_key() TO service_role;

DO $$
DECLARE
  existing_job_id bigint;
BEGIN
  SELECT jobid INTO existing_job_id FROM cron.job WHERE jobname = 'smartvibe-position-manager';
  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'smartvibe-position-manager',
  '10 seconds',
  $$
    SELECT net.http_post(
      url := 'https://jofbicfjnipiqxxwklcm.supabase.co/functions/v1/smartvibe-position-manager',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-smartvibe-automation-key', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'smartvibe_automation_key' LIMIT 1)
      ),
      body := jsonb_build_object('source', 'SMARTVIBE CRON', 'time', now()),
      timeout_milliseconds := 8000
    ) AS request_id;
  $$
);
