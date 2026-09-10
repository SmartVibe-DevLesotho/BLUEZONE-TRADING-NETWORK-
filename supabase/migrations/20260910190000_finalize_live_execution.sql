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
  v_license_id uuid;
begin
  if p_signal_id is null or p_user_id is null then return false; end if;

  select * into v_usage
  from public.smartvibe_signal_usage
  where signal_id=p_signal_id and user_id=p_user_id
  for update;

  if not found or v_usage.status <> 'PENDING' then return false; end if;
  v_license_id:=v_usage.license_id;

  update public.smartvibe_signal_usage
  set status='USED', used_at=now(), updated_at=now()
  where signal_id=p_signal_id and user_id=p_user_id and status='PENDING';
  if not found then return false; end if;

  update public.licenses
  set reserved_signals=greatest(0,coalesce(reserved_signals,0)-1),
      used_signals=coalesce(used_signals,0)+1,
      updated_at=now()
  where id=v_license_id;
  if not found then return false; end if;

  return true;
exception when others then
  return false;
end;
$$;

revoke all on function public.finalize_smartvibe_live_execution(uuid,uuid) from public,anon,authenticated;
grant execute on function public.finalize_smartvibe_live_execution(uuid,uuid) to service_role;
