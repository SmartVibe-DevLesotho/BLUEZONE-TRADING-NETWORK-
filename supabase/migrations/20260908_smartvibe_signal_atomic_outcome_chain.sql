-- Complete SmartVibe signal transaction: entitlement reservation, signal row,
-- outcome tracking row, and client-approval usage ledger are created together.
-- A pending reservation is held until the client classifies the signal USED/UNUSED.
create or replace function public.create_smartvibe_signal_atomic(
  p_user_id uuid,
  p_signal jsonb
) returns table(
  ok boolean,
  signal_id uuid,
  license_id uuid,
  message text,
  included_signals integer,
  used_signals integer,
  pending_signals integer,
  available_signals integer
)
language plpgsql
security definer
set search_path=public
as $$
declare
  v_license public.licenses%rowtype;
  v_signal_id uuid;
  v_used integer;
  v_pending integer;
  v_included integer;
  v_available integer;
  v_generated_at timestamptz;
  v_direction text;
  v_entry numeric;
  v_evidence jsonb;
begin
  if p_user_id is null then
    return query select false,null::uuid,null::uuid,'USER_REQUIRED',0,0,0,0;
    return;
  end if;

  select l.* into v_license
  from public.licenses l
  where l.user_id=p_user_id
    and coalesce(l.active,false)=true
    and l.revoked_at is null
    and (l.expires_at is null or l.expires_at>now())
  order by l.expires_at nulls last, l.created_at desc
  limit 1
  for update of l;

  if not found then
    return query select false,null::uuid,null::uuid,'LICENSE_REQUIRED',0,0,0,0;
    return;
  end if;

  v_included:=coalesce(v_license.included_signals,0);
  v_used:=coalesce(v_license.used_signals,0);

  select count(*)::integer into v_pending
  from public.smartvibe_signal_usage u
  where u.license_id=v_license.id
    and u.user_id=p_user_id
    and u.status='PENDING';

  v_available:=greatest(0,v_included-v_used-v_pending);
  if v_available<=0 then
    return query select false,null::uuid,v_license.id,'SIGNAL_WALLET_EMPTY',v_included,v_used,v_pending,0;
    return;
  end if;

  v_generated_at:=coalesce((p_signal->>'generated_at')::timestamptz,now());
  v_direction:=upper(coalesce(p_signal->>'direction',''));
  v_entry:=(p_signal->>'entry')::numeric;
  v_evidence:=coalesce(p_signal->'evidence','{}'::jsonb);

  if v_direction not in ('BUY','SELL') or v_entry is null then
    return query select false,null::uuid,v_license.id,'INVALID_SIGNAL_PAYLOAD',v_included,v_used,v_pending,v_available;
    return;
  end if;

  insert into public.signals(
    symbol,direction,score,session,style,entry,sl,tp,strategies,
    generated_at,timeframe,data_source,data_status,data_timestamp,is_live,
    evidence,engine_version,published_at
  ) values (
    p_signal->>'symbol',
    v_direction,
    greatest(0,least(100,coalesce((p_signal->>'score')::numeric,0)))::integer,
    p_signal->>'session',
    coalesce(p_signal->>'style','SmartVibe Trading Network'),
    v_entry,
    (p_signal->>'sl')::numeric,
    (p_signal->>'tp')::numeric,
    coalesce(p_signal->'strategies','{}'::jsonb),
    v_generated_at,
    coalesce(p_signal->>'timeframe','1m'),
    coalesce(p_signal->>'data_source','LIVE'),
    coalesce(p_signal->>'data_status','LIVE'),
    coalesce((p_signal->>'data_timestamp')::timestamptz,now()),
    coalesce((p_signal->>'is_live')::boolean,true),
    v_evidence,
    coalesce(p_signal->>'engine_version','SMARTVIBE-CORE'),
    coalesce((p_signal->>'published_at')::timestamptz,now())
  ) returning id into v_signal_id;

  insert into public.smartvibe_signal_outcomes(
    signal_id,status,direction,entry,opened_at,source,evidence,updated_at
  ) values (
    v_signal_id,'OPEN',v_direction,v_entry,v_generated_at,
    'SmartVibe outcome engine',v_evidence,now()
  );

  insert into public.smartvibe_signal_usage(signal_id,user_id,license_id,status,generated_at)
  values(v_signal_id,p_user_id,v_license.id,'PENDING',v_generated_at);

  update public.licenses
  set reserved_signals=coalesce(reserved_signals,0)+1,
      updated_at=now()
  where id=v_license.id;

  return query select true,v_signal_id,v_license.id,'SIGNAL_RESERVED',v_included,v_used,v_pending+1,v_available-1;
exception when others then
  return query select false,null::uuid,null::uuid,'SIGNAL_ATOMIC_CREATE_FAILED: '||sqlerrm,0,0,0,0;
end;
$$;

revoke all on function public.create_smartvibe_signal_atomic(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.create_smartvibe_signal_atomic(uuid,jsonb) to service_role;
