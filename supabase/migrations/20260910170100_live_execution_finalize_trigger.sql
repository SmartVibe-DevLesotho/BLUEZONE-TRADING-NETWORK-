-- Broker-confirmed executions consume the reserved signal entitlement exactly once.
-- The trigger is server-side; clients cannot finalize usage by writing to the ledger.
create or replace function public.finalize_smartvibe_live_execution_trigger()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_license_id uuid;
  v_updated integer;
begin
  if new.status='EXECUTED' and coalesce(old.status,'')<>'EXECUTED' then
    select license_id into v_license_id
    from public.smartvibe_signal_usage
    where signal_id=new.signal_id and user_id=new.user_id and status='PENDING'
    for update;

    if v_license_id is null then
      raise exception 'LIVE_EXECUTION_ENTITLEMENT_NOT_PENDING';
    end if;

    update public.smartvibe_signal_usage
    set status='USED'
    where signal_id=new.signal_id and user_id=new.user_id and status='PENDING';
    get diagnostics v_updated = row_count;

    if v_updated <> 1 then
      raise exception 'LIVE_EXECUTION_ENTITLEMENT_FINALIZE_FAILED';
    end if;

    update public.licenses
    set used_signals=coalesce(used_signals,0)+1,
        reserved_signals=greatest(0,coalesce(reserved_signals,0)-1),
        updated_at=now()
    where id=v_license_id;
  end if;

  return new;
end;
$$;

revoke all on function public.finalize_smartvibe_live_execution_trigger() from public,anon,authenticated;
grant execute on function public.finalize_smartvibe_live_execution_trigger() to service_role;

drop trigger if exists trg_finalize_smartvibe_live_execution on public.smartvibe_live_orders;
create trigger trg_finalize_smartvibe_live_execution
after update of status on public.smartvibe_live_orders
for each row execute function public.finalize_smartvibe_live_execution_trigger();
