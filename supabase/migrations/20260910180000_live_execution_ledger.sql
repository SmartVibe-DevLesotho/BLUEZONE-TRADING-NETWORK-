create table if not exists public.smartvibe_live_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  signal_id uuid not null references public.signals(id) on delete restrict,
  client_order_id text not null unique,
  symbol text not null,
  direction text not null check(direction in ('BUY','SELL')),
  lot numeric not null check(lot > 0),
  requested_entry numeric not null,
  broker_entry numeric,
  sl numeric,
  tp numeric,
  status text not null check(status in ('CLAIMED','EXECUTED','REJECTED','AMBIGUOUS')) default 'CLAIMED',
  external_order_id text,
  bridge_response jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  executed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists smartvibe_live_orders_user_idx on public.smartvibe_live_orders(user_id, created_at desc);
create index if not exists smartvibe_live_orders_signal_idx on public.smartvibe_live_orders(signal_id, created_at desc);
create index if not exists smartvibe_live_orders_status_idx on public.smartvibe_live_orders(status, created_at desc);

alter table public.smartvibe_live_orders enable row level security;
drop policy if exists "live orders readable by owner" on public.smartvibe_live_orders;
create policy "live orders readable by owner" on public.smartvibe_live_orders for select using(auth.uid() = user_id);
revoke insert, update, delete on public.smartvibe_live_orders from anon, authenticated;
grant select on public.smartvibe_live_orders to authenticated;
