alter table public.smartvibe_mt5_commands add column if not exists signal_id uuid references public.signals(id) on delete set null;
create unique index if not exists smartvibe_mt5_commands_auto_signal_uq on public.smartvibe_mt5_commands(device_id, signal_id) where command_type='ORDER' and signal_id is not null;
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
