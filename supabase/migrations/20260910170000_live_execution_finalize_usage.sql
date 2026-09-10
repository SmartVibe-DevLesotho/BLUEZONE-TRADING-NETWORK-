-- Finalize a live execution only after the broker has acknowledged a successful fill.
-- This is service-role only so the mobile client cannot mark an entitlement as used by itself.
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
begin
  select * into v_usage
  from public.smartvibe_signal_usage
  where signal_id=p_signal_id and user_id=p_user_id
  for update;

  if not found or v_usage.status <> 'PENDING' then
    return false;
  end if;

  update public.smartvibe_signal_usage
  set status='USED'
  where signal_id=p_signal_id and user_id=p_user_id and status='PENDING';

  update public.licenses
  set used_signals=coalesce(used_signals,0)+1,
      reserved_signals=greatest(0,coalesce(reserved_signals,0)-1),
      updated_at=now()
  where id=v_usage.license_id;

  return true;
end;
$$;

revoke all on function public.finalize_smartvibe_live_execution(uuid,uuid) from public,anon,authenticated;
grant execute on function public.finalize_smartvibe_live_execution(uuid,uuid) to service_role;
