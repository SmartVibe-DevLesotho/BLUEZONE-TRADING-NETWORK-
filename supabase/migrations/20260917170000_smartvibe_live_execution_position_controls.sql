create table if not exists public.smartvibe_trading_controls (
  id boolean primary key default true check (id),
  trading_halted boolean not null default false,
  max_open_positions integer not null default 5 check (max_open_positions between 1 and 10),
  max_spread_pips numeric not null default 5,
  updated_at timestamptz not null default now()
);
insert into public.smartvibe_trading_controls(id) values(true) on conflict(id) do nothing;

create table if not exists public.smartvibe_live_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  signal_id uuid references public.signals(id) on delete set null,
  client_order_id text not null unique,
  symbol text not null,
  direction text not null check (direction in ('BUY','SELL')),
  lot numeric not null check (lot > 0),
  requested_entry numeric not null,
  broker_entry numeric,
  sl numeric,
  tp numeric,
  status text not null default 'CLAIMED',
  external_order_id text,
  position_role text not null default 'INITIAL' check (position_role in ('INITIAL','REENTRY')),
  parent_order_id uuid references public.smartvibe_live_orders(id) on delete set null,
  bridge_response jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  executed_at timestamptz,
  updated_at timestamptz not null default now()
);
create unique index if not exists smartvibe_live_orders_external_idx on public.smartvibe_live_orders(external_order_id) where external_order_id is not null;
create index if not exists smartvibe_live_orders_user_status_idx on public.smartvibe_live_orders(user_id,status);
create index if not exists smartvibe_live_orders_parent_idx on public.smartvibe_live_orders(parent_order_id);

create table if not exists public.smartvibe_trade_audit (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  signal_id uuid references public.signals(id) on delete set null,
  order_id uuid references public.smartvibe_live_orders(id) on delete set null,
  methodology_version text not null default 'SMARTVIBE-CORE-1.4.0',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists smartvibe_trade_audit_created_idx on public.smartvibe_trade_audit(created_at desc);

alter table public.smartvibe_live_orders enable row level security;
alter table public.smartvibe_trade_audit enable row level security;
revoke all on public.smartvibe_live_orders from anon,authenticated;
revoke all on public.smartvibe_trade_audit from anon,authenticated;
grant all on public.smartvibe_live_orders to service_role;
grant all on public.smartvibe_trade_audit to service_role;

create or replace function public.finalize_smartvibe_live_execution(p_signal_id uuid,p_user_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_usage public.smartvibe_signal_usage%rowtype; v_result boolean;
begin
 select * into v_usage from public.smartvibe_signal_usage where signal_id=p_signal_id and user_id=p_user_id for update;
 if not found or v_usage.status <> 'PENDING' then return false; end if;
 select (approve_smartvibe_signal_usage(v_usage.id,true,'LIVE_EXECUTED')).ok into v_result;
 return coalesce(v_result,false);
end; $$;
revoke all on function public.finalize_smartvibe_live_execution(uuid,uuid) from public,anon,authenticated;
grant execute on function public.finalize_smartvibe_live_execution(uuid,uuid) to service_role;
