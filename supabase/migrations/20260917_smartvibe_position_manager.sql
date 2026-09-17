-- SMARTVIBE TRADING NETWORK: autonomous live position management.
-- The automation credential is generated inside Postgres and is never committed to Git.
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.smartvibe_automation_keys (
  id boolean primary key default true,
  secret text not null,
  created_at timestamptz not null default now()
);
revoke all on public.smartvibe_automation_keys from public, anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.smartvibe_automation_keys WHERE id = true) THEN
    INSERT INTO public.smartvibe_automation_keys(id, secret)
    VALUES (true, encode(gen_random_bytes(32), 'hex'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.smartvibe_get_automation_key()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT secret FROM public.smartvibe_automation_keys WHERE id = true LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.smartvibe_get_automation_key() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.smartvibe_get_automation_key() TO service_role;

DO $$
DECLARE existing_job_id bigint;
BEGIN
  SELECT jobid INTO existing_job_id FROM cron.job WHERE jobname = 'smartvibe-position-manager';
  IF existing_job_id IS NOT NULL THEN PERFORM cron.unschedule(existing_job_id); END IF;
END $$;

SELECT cron.schedule(
  'smartvibe-position-manager',
  '10 seconds',
  $$
    SELECT net.http_post(
      url := 'https://jofbicfjnipiqxxwklcm.supabase.co/functions/v1/smartvibe-position-manager',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-smartvibe-automation-key', (SELECT secret FROM public.smartvibe_automation_keys WHERE id = true LIMIT 1)
      ),
      body := jsonb_build_object('source', 'SMARTVIBE CRON', 'time', now()),
      timeout_milliseconds := 8000
    ) AS request_id;
  $$
);
