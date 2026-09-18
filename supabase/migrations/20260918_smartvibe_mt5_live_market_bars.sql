create table if not exists public.smartvibe_mt5_market_bars (
  device_id uuid not null references public.smartvibe_mt5_devices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  timeframe text not null,
  bar_time timestamptz not null,
  open numeric not null,
  high numeric not null,
  low numeric not null,
  close numeric not null,
  created_at timestamptz not null default now(),
  primary key (device_id,symbol,timeframe,bar_time),
  constraint smartvibe_mt5_market_bars_ohlc_valid check (high >= greatest(open,close) and low <= least(open,close) and high >= low)
);
create index if not exists smartvibe_mt5_market_bars_user_symbol_time_idx
on public.smartvibe_mt5_market_bars(user_id,symbol,timeframe,bar_time desc);
alter table public.smartvibe_mt5_market_bars enable row level security;
