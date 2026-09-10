create or replace function public.finalize_smartvibe_live_execution(
  p_signal_id uuid,
  p_user_id uuid
) returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  v_usage public.smartvibe_signal_usage%rowtype;
  v_license public.licenses%rowtype;
  v_updated integer;
begin
  if p_signal_id is null or p_user_id is null then
    return false;
  end if;

  select * into v_usage
  from public.smartvibe_signal_usage
  where signal_id=p_signal_id and user_id=p_user_id
  for update;

  if not found or v_usage.status <> 'PENDING' then
    return false;
  end if;

  select * into v_license
  from public.licenses
  where id=v_usage.license_id
    and user_id=p_user_id
  for update;

  if not found then
    return false;
  end if;

  update public.smartvibe_signal_usage
  set status='USED', used_at=now(), updated_at=now()
  where signal_id=p_signal_id
    and user_id=p_user_id
    and status='PENDING';

  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception 'LIVE_ENTITLEMENT_USAGE_UPDATE_FAILED';
  end if;

  update public.licenses
  set reserved_signals=greatest(0,coalesce(reserved_signals,0)-1),
      used_signals=coalesce(used_signals,0)+1,
      updated_at=now()
  where id=v_license.id
    and user_id=p_user_id;

  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception 'LIVE_ENTITLEMENT_LICENSE_UPDATE_FAILED';
  end if;

  return true;
exception when others then
  return false;
end;
$$;

revoke all on function public.finalize_smartvibe_live_execution(uuid,uuid) from public,anon,authenticated;
grant execute on function public.finalize_smartvibe_live_execution(uuid,uuid) to service_role;
