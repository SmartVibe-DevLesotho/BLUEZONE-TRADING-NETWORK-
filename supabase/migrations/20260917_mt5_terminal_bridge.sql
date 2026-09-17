create extension if not exists pgcrypto;

create table if not exists public.smartvibe_mt5_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My MT5 terminal',
  token_hash text not null unique,
  enabled boolean not null default true,
  automation_enabled boolean not null default false,
  connected boolean not null default false,
  trade_allowed boolean not null default false,
  account_login bigint,
  broker_server text,
  currency text,
  balance numeric,
  equity numeric,
  leverage numeric,
  terminal_version text,
  last_seen_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.smartvibe_mt5_commands (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.smartvibe_mt5_devices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  command_type text not null check (command_type in ('ORDER','CLOSE','MODIFY','PING')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING' check (status in ('PENDING','CLAIMED','COMPLETED','FAILED','EXPIRED')),
  result jsonb,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 seconds')
);

create index if not exists smartvibe_mt5_devices_user_idx on public.smartvibe_mt5_devices(user_id, enabled);
create index if not exists smartvibe_mt5_commands_device_idx on public.smartvibe_mt5_commands(device_id, status, created_at);

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

create or replace function public.smartvibe_mt5_device_touch(
  p_device_id uuid,
  p_token_hash text,
  p_connected boolean,
  p_trade_allowed boolean,
  p_account_login bigint,
  p_broker_server text,
  p_currency text,
  p_balance numeric,
  p_equity numeric,
  p_leverage numeric,
  p_terminal_version text,
  p_metadata jsonb default '{}'::jsonb
) returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  update public.smartvibe_mt5_devices
  set connected=p_connected, trade_allowed=p_trade_allowed, account_login=p_account_login,
      broker_server=p_broker_server, currency=p_currency, balance=p_balance, equity=p_equity,
      leverage=p_leverage, terminal_version=p_terminal_version, metadata=coalesce(p_metadata,'{}'::jsonb),
      last_seen_at=now(), updated_at=now()
  where id=p_device_id and token_hash=p_token_hash and enabled=true;
  return found;
end;
$$;

revoke all on function public.smartvibe_mt5_device_touch(uuid,text,boolean,boolean,bigint,text,text,numeric,numeric,numeric,text,jsonb) from public, anon, authenticated;
grant execute on function public.smartvibe_mt5_device_touch(uuid,text,boolean,boolean,bigint,text,text,numeric,numeric,numeric,text,jsonb) to service_role;
