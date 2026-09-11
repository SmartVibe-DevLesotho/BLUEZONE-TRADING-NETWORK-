create or replace function public.enforce_smartvibe_execution_authority()
returns trigger
language plpgsql
security definer
set search_path=public as $$
declare
  v_signal public.signals%rowtype;
  v_evidence jsonb;
begin
  select * into v_signal from public.signals where id = new.signal_id;
  if not found then
    raise exception 'SMARTVIBE_EXECUTION_BLOCKED:SIGNAL_NOT_FOUND';
  end if;

  v_evidence := case when jsonb_typeof(v_signal.evidence) = 'object' then v_signal.evidence else '{}'::jsonb end;

  if coalesce(v_signal.style,'') <> 'SmartVibe Trading Network'
     or coalesce(v_signal.engine_version,'') <> 'SMARTVIBE-CORE-1.4.0'
     or coalesce(v_signal.methodology_version,'') <> 'SMARTVIBE-CORE-1.4.0'
     or coalesce(v_signal.is_live,false) is not true
     or coalesce(v_signal.data_status,'') <> 'LIVE'
     or coalesce(v_signal.direction,'') not in ('BUY','SELL')
     or coalesce((v_signal.score)::numeric,0) < 70
     or coalesce(v_evidence->'authority'->>'methodologyAuthority','') <> 'smartvibe-core'
     or coalesce((v_evidence->'authority'->>'approved')::boolean,false) is not true
     or coalesce(v_evidence->>'canonicalMethodology','') <> 'SmartVibe Trading Network'
     or coalesce(v_evidence->'primaryMethodology'->>'independentAuthorization','true') <> 'false'
     or coalesce(v_evidence->>'role','') <> 'SUPPORTING_MECHANISM_ONLY'
     or coalesce(v_evidence->>'dataQuality','') <> 'HIGH'
     or coalesce((v_evidence->>'contradiction')::boolean,true) is not false
     or coalesce(v_evidence->>'finalDecision','') <> 'APPROVED'
  then
    raise exception 'SMARTVIBE_EXECUTION_BLOCKED:FINAL_DECISION_AUTHORITY_FAILED';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_smartvibe_execution_authority() from public, anon, authenticated;
grant execute on function public.enforce_smartvibe_execution_authority() to service_role;

drop trigger if exists trg_smartvibe_execution_authority on public.smartvibe_live_orders;
create trigger trg_smartvibe_execution_authority
before insert on public.smartvibe_live_orders
for each row execute function public.enforce_smartvibe_execution_authority();
