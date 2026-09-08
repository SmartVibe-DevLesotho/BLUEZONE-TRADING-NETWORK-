-- Apply this migration to the existing SmartVibe Supabase project.
-- It makes license redemption atomic and keeps license tables inaccessible to clients.

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
revoke all on public.licenses from anon, authenticated;
