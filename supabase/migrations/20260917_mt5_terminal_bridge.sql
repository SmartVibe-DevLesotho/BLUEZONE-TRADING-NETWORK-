create extension if not exists pgcrypto;

create table if not exists public.smartvibe_mt5_devices (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My MT5 terminal', token_hash text not null unique, enabled boolean not null default true,
  automation_enabled boolean not null default false, connected boolean not null default false, trade_allowed boolean not null default false,
  account_login bigint, broker_server text, currency text, balance numeric, equity numeric, leverage numeric, terminal_version text,
  last_seen_at timestamptz, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.smartvibe_mt5_commands (
  id uuid primary key default gen_random_uuid(), device_id uuid not null references public.smartvibe_mt5_devices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, signal_id uuid references public.signals(id) on delete set null,
  command_type text not null check (command_type in ('ORDER','CLOSE','MODIFY','PING')),
  payload jsonb not null default '{}'::jsonb, status text not null default 'PENDING' check (status in ('PENDING','CLAIMED','COMPLETED','FAILED','EXPIRED')),
  result jsonb, created_at timestamptz not null default now(), claimed_at timestamptz, completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 seconds')
);
create index if not exists smartvibe_mt5_devices_user_idx on public.smartvibe_mt5_devices(user_id, enabled);
create index if not exists smartvibe_mt5_commands_device_idx on public.smartvibe_mt5_commands(device_id, status, created_at);
create unique index if not exists smartvibe_mt5_commands_auto_signal_uq on public.smartvibe_mt5_commands(device_id, signal_id) where command_type='ORDER' and signal_id is not null;
alter table public.smartvibe_mt5_devices enable row level security;
alter table public.smartvibe_mt5_commands enable row level security;
drop policy if exists mt5_devices_owner_select on public.smartvibe_mt5_devices;
create policy mt5_devices_owner_select on public.smartvibe_mt5_devices for select to authenticated using (user_id = auth.uid());
drop policy if exists mt5_devices_owner_insert on public.smartvibe_mt5_devices;
create policy mt5_devices_owner_insert on public.smartvibe_mt5_devices for insert to authenticated with check (user_id = auth.uid());
drop policy if exists mt5_devices_owner_update on public.smartvibe_mt5_devices;
create policy mt5_devices_owner_update on public.smartvibe_mt5_devices for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists mt5_commands_owner_select on public.smartvibe_mt5_commands;
create policy mt5_commands_owner_select on public.smartvibe_mt5_commands for select to authenticated using (user_id = auth.uid());
create or replace function public.smartvibe_mt5_device_touch(p_device_id uuid,p_token_hash text,p_connected boolean,p_trade_allowed boolean,p_account_login bigint,p_broker_server text,p_currency text,p_balance numeric,p_equity numeric,p_leverage numeric,p_terminal_version text,p_metadata jsonb default '{}'::jsonb) returns boolean language plpgsql security definer set search_path = public as $$ begin update public.smartvibe_mt5_devices set connected=p_connected,trade_allowed=p_trade_allowed,account_login=p_account_login,broker_server=p_broker_server,currency=p_currency,balance=p_balance,equity=p_equity,leverage=p_leverage,terminal_version=p_terminal_version,metadata=coalesce(p_metadata,'{}'::jsonb),last_seen_at=now(),updated_at=now() where id=p_device_id and token_hash=p_token_hash and enabled=true; return found; end; $$;
revoke all on function public.smartvibe_mt5_device_touch(uuid,text,boolean,boolean,bigint,text,text,numeric,numeric,numeric,text,jsonb) from public,anon,authenticated;
grant execute on function public.smartvibe_mt5_device_touch(uuid,text,boolean,boolean,bigint,text,text,numeric,numeric,numeric,text,jsonb) to service_role;
create or replace function public.smartvibe_mt5_automation_tick() returns integer language plpgsql security definer set search_path=public as $$
declare d record; s record; inserted_count integer:=0;
begin
 for d in select * from public.smartvibe_mt5_devices where enabled=true and automation_enabled=true and connected=true and trade_allowed=true and last_seen_at>now()-interval '15 seconds' loop
  select x.* into s from public.signals x join public.user_licenses ul on ul.user_id=d.user_id join public.licenses l on l.id=ul.license_id
  where x.is_live=true and x.data_status='LIVE' and x.direction in ('BUY','SELL') and x.score>=70 and x.style='SmartVibe Trading Network' and x.engine_version='SMARTVIBE-CORE-1.4.0' and x.methodology_version='SMARTVIBE-CORE-1.4.0' and x.entry is not null and x.sl is not null and x.generated_at>now()-interval '2 minutes' and (x.expires_at is null or x.expires_at>now()) and l.active=true and l.revoked_at is null and (l.expires_at is null or l.expires_at>now()) and coalesce(x.evidence->'authority'->>'methodologyAuthority','')='smartvibe-core' and coalesce(x.evidence->'authority'->>'approved','false')='true' and coalesce(x.evidence->>'canonicalMethodology','')='SmartVibe Trading Network' and coalesce(x.evidence->'primaryMethodology'->>'independentAuthorization','true')='false' and coalesce(x.evidence->>'role','')='SUPPORTING_MECHANISM_ONLY' and coalesce(x.evidence->>'dataQuality','')='HIGH' and coalesce(x.evidence->>'contradiction','true')='false' order by x.generated_at desc limit 1;
  if s.id is not null and not exists(select 1 from public.smartvibe_live_orders o where o.user_id=d.user_id and o.signal_id=s.id and o.status='EXECUTED') and exists(select 1 from public.smartvibe_signal_usage u where u.user_id=d.user_id and u.signal_id=s.id and u.status='PENDING') and not exists(select 1 from public.smartvibe_mt5_commands c where c.device_id=d.id and c.signal_id=s.id and c.command_type='ORDER') then
   insert into public.smartvibe_mt5_commands(device_id,user_id,signal_id,command_type,payload) values(d.id,d.user_id,s.id,'ORDER',jsonb_build_object('auto',true,'signal_id',s.id,'symbol',s.symbol,'order_type',lower(s.direction),'lot',0.01,'entry',s.entry,'sl',s.sl,'tp',coalesce(s.tp,0),'comment',left('SV-AUTO-'||replace(s.id::text,'-',''),31)));
   inserted_count:=inserted_count+1;
  end if;
 end loop;
 return inserted_count;
end; $$;
revoke all on function public.smartvibe_mt5_automation_tick() from public,anon,authenticated;
grant execute on function public.smartvibe_mt5_automation_tick() to postgres;
