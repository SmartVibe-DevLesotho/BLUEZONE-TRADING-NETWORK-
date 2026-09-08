-- Canonical SmartVibe subscription catalog and signal wallet.
-- Package totals are entitlements for the full token period, not daily limits.
create table if not exists public.smartvibe_subscription_packages (
 id uuid primary key default gen_random_uuid(), package_key text unique not null, plan_key text not null, display_name text not null,
 duration_days integer not null check(duration_days > 0), price_lsl numeric(12,2) not null check(price_lsl > 0), included_signals integer not null check(included_signals > 0),
 scanner_access boolean not null default false, whatsapp_group_access boolean not null default false, all_services_access boolean not null default false,
 active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
insert into public.smartvibe_subscription_packages(package_key,plan_key,display_name,duration_days,price_lsl,included_signals,scanner_access,whatsapp_group_access,all_services_access) values
('professional_2w','professional','Professional • 2 Weeks',14,300,15,false,false,false),('professional_1m','professional','Professional • 1 Month',30,600,30,false,false,false),('professional_2m','professional','Professional • 2 Months',60,1000,35,false,false,false),
('advanced_1m','advanced','Advanced • 1 Month',30,1000,30,true,true,false),('advanced_2m','advanced','Advanced • 2 Months',60,1600,50,true,true,false),('advanced_3m','advanced','Advanced • 3 Months',90,2500,70,true,true,false),
('premium_pro_1m','elite','Premium Pro • 1 Month',30,2500,100,true,true,true),('premium_pro_2m','elite','Premium Pro • 2 Months',60,3200,200,true,true,true),('premium_pro_3m','elite','Premium Pro • 3 Months',90,3700,300,true,true,true),('premium_pro_4m','elite','Premium Pro • 4 Months',120,4300,400,true,true,true),('premium_pro_5m','elite','Premium Pro • 5 Months',150,5000,500,true,true,true)
on conflict(package_key) do update set plan_key=excluded.plan_key,display_name=excluded.display_name,duration_days=excluded.duration_days,price_lsl=excluded.price_lsl,included_signals=excluded.included_signals,scanner_access=excluded.scanner_access,whatsapp_group_access=excluded.whatsapp_group_access,all_services_access=excluded.all_services_access,updated_at=now();
alter table public.licenses add column if not exists package_key text;
alter table public.licenses add column if not exists included_signals integer;
alter table public.licenses add column if not exists used_signals integer not null default 0;
alter table public.licenses add column if not exists carryover_signals integer not null default 0;
alter table public.licenses add column if not exists carryover_credit_lsl numeric(12,2) not null default 0;
alter table public.licenses add column if not exists price_paid_lsl numeric(12,2);
alter table public.licenses add column if not exists renewal_of_license_id uuid references public.licenses(id);
create table if not exists public.smartvibe_signal_usage (
 id uuid primary key default gen_random_uuid(), signal_id uuid not null references public.signals(id) on delete cascade, user_id uuid not null, license_id uuid not null references public.licenses(id),
 status text not null default 'PENDING' check(status in ('PENDING','USED','UNUSED','EXPIRED')), generated_at timestamptz not null default now(), approved_at timestamptz, approved_by_user boolean, reason text, unique(signal_id,user_id)
);
create index if not exists smartvibe_signal_usage_user_license_idx on public.smartvibe_signal_usage(user_id,license_id,status);
alter table public.smartvibe_subscription_packages enable row level security;
drop policy if exists "subscription packages readable" on public.smartvibe_subscription_packages;
create policy "subscription packages readable" on public.smartvibe_subscription_packages for select using(active=true);
alter table public.smartvibe_signal_usage enable row level security;
drop policy if exists "users read own signal usage" on public.smartvibe_signal_usage;
create policy "users read own signal usage" on public.smartvibe_signal_usage for select using(auth.uid()=user_id);
revoke all on public.smartvibe_subscription_packages from anon; grant select on public.smartvibe_subscription_packages to authenticated;
revoke all on public.smartvibe_signal_usage from anon; grant select,update on public.smartvibe_signal_usage to authenticated;
create or replace function public.approve_smartvibe_signal_usage(p_usage_id uuid,p_used boolean,p_reason text default null) returns table(ok boolean,message text,remaining_signals integer) language plpgsql security definer set search_path=public as $$
declare v public.smartvibe_signal_usage%rowtype; v_remaining integer;
begin
 select * into v from public.smartvibe_signal_usage where id=p_usage_id and user_id=auth.uid() for update;
 if not found then return query select false,'Signal usage record not found.',0; return; end if;
 if v.status <> 'PENDING' then return query select false,'This signal has already been classified.',0; return; end if;
 if p_used then update public.smartvibe_signal_usage set status='USED',approved_at=now(),approved_by_user=true,reason=p_reason where id=v.id; update public.licenses set used_signals=coalesce(used_signals,0)+1,updated_at=now() where id=v.license_id;
 else update public.smartvibe_signal_usage set status='UNUSED',approved_at=now(),approved_by_user=false,reason=p_reason where id=v.id; end if;
 select greatest(0,coalesce(included_signals,0)-coalesce(used_signals,0)) into v_remaining from public.licenses where id=v.license_id;
 return query select true,case when p_used then 'Signal marked USED.' else 'Signal marked UNUSED.' end,v_remaining;
end; $$;
revoke all on function public.approve_smartvibe_signal_usage(uuid,boolean,text) from public,anon; grant execute on function public.approve_smartvibe_signal_usage(uuid,boolean,text) to authenticated;
