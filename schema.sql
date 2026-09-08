-- SmartVibe Trading Network — Supabase schema
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  token_hash text unique not null,
  active boolean not null default true,
  expires_at timestamptz,
  max_activations integer not null default 1,
  activation_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.user_licenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  license_id uuid not null references public.licenses(id) on delete cascade,
  activated_at timestamptz not null default now(),
  unique(user_id, license_id)
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_instrument text not null default 'XAUUSD',
  selected_strategy text not null default 'SmartVibe Trading Network',
  selected_session text not null default 'London',
  selected_style text not null default 'Day Trading',
  consensus_threshold integer not null default 8 check (consensus_threshold in (4,6,8)),
  paper_trading boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  side text not null check (side in ('BUY','SELL')),
  size numeric not null,
  entry numeric not null,
  sl numeric,
  tp numeric,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  status text not null default 'OPEN' check (status in ('OPEN','CLOSED')),
  pnl numeric default 0
);

create table if not exists public.trade_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  position_id uuid references public.positions(id) on delete set null,
  event_type text not null,
  title text not null,
  detail text,
  amount numeric default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.mt5_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  login_number text,
  server_name text,
  mode text not null default 'MANUAL' check (mode in ('MANUAL','ROBOT')),
  status text not null default 'DISCONNECTED' check (status in ('DISCONNECTED','CONNECTED','ERROR')),
  updated_at timestamptz not null default now()
);

create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  direction text not null check (direction in ('BUY','SELL')),
  score integer not null check (score between 0 and 8),
  session text not null,
  style text not null,
  entry numeric,
  sl numeric,
  tp numeric,
  strategies jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now()
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_licenses enable row level security;
alter table public.user_preferences enable row level security;
alter table public.positions enable row level security;
alter table public.trade_events enable row level security;
alter table public.mt5_connections enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.licenses enable row level security;
alter table public.signals enable row level security;

create policy "profiles own row" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "preferences own row" on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "positions own rows" on public.positions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "events own rows" on public.trade_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mt5 own row" on public.mt5_connections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own license links" on public.user_licenses for select using (auth.uid() = user_id);
create policy "signals readable" on public.signals for select using (true);

revoke all on public.licenses from anon, authenticated;

create or replace function public.redeem_license(p_token_hash text, p_user_id uuid)
returns table(valid boolean, message text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_license public.licenses%rowtype;
begin
  select * into v_license from public.licenses where token_hash = p_token_hash for update;
  if not found then return query select false, 'Invalid activation token.', null::timestamptz; return; end if;
  if not v_license.active then return query select false, 'This license has been revoked.', v_license.expires_at; return; end if;
  if v_license.expires_at is not null and v_license.expires_at <= now() then return query select false, 'This license has expired.', v_license.expires_at; return; end if;
  if exists (select 1 from public.user_licenses where user_id = p_user_id and license_id = v_license.id) then
    return query select true, 'License already active.', v_license.expires_at; return;
  end if;
  if v_license.activation_count >= v_license.max_activations then
    return query select false, 'This license has reached its activation limit.', v_license.expires_at; return;
  end if;
  update public.licenses set activation_count = activation_count + 1 where id = v_license.id;
  insert into public.user_licenses(user_id, license_id) values (p_user_id, v_license.id);
  return query select true, 'License activated.', v_license.expires_at;
end;
$$;
revoke all on function public.redeem_license(text, uuid) from public, anon, authenticated;
grant execute on function public.redeem_license(text, uuid) to service_role;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username) values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))) on conflict (id) do nothing;
  insert into public.user_preferences (user_id) values (new.id) on conflict (user_id) do nothing;
  insert into public.mt5_connections (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
