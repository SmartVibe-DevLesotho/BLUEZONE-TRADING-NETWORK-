alter table public.signals add column if not exists methodology_version text not null default 'SMARTVIBE-CORE-1.4.0';

create table if not exists public.smartvibe_trading_controls (
  id boolean primary key default true check (id=true),
  trading_halted boolean not null default false,
  halt_reason text,
  max_open_positions integer not null default 5 check (max_open_positions>0),
  max_spread_pips numeric not null default 5 check (max_spread_pips>0),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
insert into public.smartvibe_trading_controls(id) values(true) on conflict(id) do nothing;

create table if not exists public.smartvibe_trade_audit (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid references auth.users(id),
  signal_id uuid references public.signals(id),
  order_id uuid references public.smartvibe_live_orders(id),
  methodology_version text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists smartvibe_trade_audit_signal_idx on public.smartvibe_trade_audit(signal_id,created_at desc);
create index if not exists smartvibe_trade_audit_user_idx on public.smartvibe_trade_audit(user_id,created_at desc);

alter table public.smartvibe_trading_controls enable row level security;
alter table public.smartvibe_trade_audit enable row level security;
revoke all on public.smartvibe_trading_controls from public,anon,authenticated;
revoke all on public.smartvibe_trade_audit from public,anon,authenticated;
grant select,insert,update,delete on public.smartvibe_trading_controls to service_role;
grant select,insert,update,delete on public.smartvibe_trade_audit to service_role;

create or replace function public.create_smartvibe_signal_atomic(p_user_id uuid,p_signal jsonb)
returns table(ok boolean,signal_id uuid,license_id uuid,message text,included_signals integer,used_signals integer,pending_signals integer,available_signals integer)
language plpgsql security definer set search_path=public as $$
declare v_license public.licenses%rowtype; v_signal_id uuid; v_used integer; v_pending integer; v_included integer; v_available integer;
begin
  if p_user_id is null then return query select false,null::uuid,null::uuid,'USER_REQUIRED',0,0,0,0; return; end if;
  select l.* into v_license from public.licenses l where l.user_id=p_user_id and coalesce(l.active,false)=true and coalesce(l.revoked_at,null) is null and (l.expires_at is null or l.expires_at>now()) order by l.expires_at nulls last,l.created_at desc limit 1 for update;
  if not found then return query select false,null::uuid,null::uuid,'LICENSE_REQUIRED',0,0,0,0; return; end if;
  v_included:=coalesce(v_license.included_signals,0); v_used:=coalesce(v_license.used_signals,0);
  select count(*)::integer into v_pending from public.smartvibe_signal_usage u where u.license_id=v_license.id and u.user_id=p_user_id and u.status='PENDING';
  v_available:=greatest(0,v_included-v_used-v_pending);
  if v_available<=0 then return query select false,null::uuid,v_license.id,'SIGNAL_WALLET_EMPTY',v_included,v_used,v_pending,0; return; end if;
  insert into public.signals(symbol,direction,score,session,style,entry,sl,tp,strategies,generated_at,timeframe,data_source,data_status,data_timestamp,is_live,evidence,engine_version,methodology_version,published_at)
  values(p_signal->>'symbol',p_signal->>'direction',greatest(0,least(100,coalesce((p_signal->>'score')::numeric,0))),p_signal->>'session',coalesce(p_signal->>'style','SmartVibe Trading Network'),(p_signal->>'entry')::numeric,(p_signal->>'sl')::numeric,(p_signal->>'tp')::numeric,coalesce(p_signal->'strategies','{}'::jsonb),coalesce((p_signal->>'generated_at')::timestamptz,now()),coalesce(p_signal->>'timeframe','1m'),coalesce(p_signal->>'data_source','LIVE'),coalesce(p_signal->>'data_status','LIVE'),coalesce((p_signal->>'data_timestamp')::timestamptz,now()),coalesce((p_signal->>'is_live')::boolean,true),coalesce(p_signal->'evidence','{}'::jsonb),coalesce(p_signal->>'engine_version','SMARTVIBE-CORE-1.4.0'),coalesce(p_signal->>'methodology_version','SMARTVIBE-CORE-1.4.0'),coalesce((p_signal->>'published_at')::timestamptz,now())) returning id into v_signal_id;
  insert into public.smartvibe_signal_usage(signal_id,user_id,license_id,status,generated_at) values(v_signal_id,p_user_id,v_license.id,'PENDING',coalesce((p_signal->>'generated_at')::timestamptz,now()));
  return query select true,v_signal_id,v_license.id,'SIGNAL_RESERVED',v_included,v_used,v_pending+1,v_available-1;
exception when others then return query select false,null::uuid,null::uuid,'SIGNAL_ATOMIC_CREATE_FAILED',0,0,0,0;
end; $$;
revoke all on function public.create_smartvibe_signal_atomic(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.create_smartvibe_signal_atomic(uuid,jsonb) to service_role;
