create or replace function public.prevent_smartvibe_trade_audit_mutation()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  raise exception 'SMARTVIBE_TRADE_AUDIT_IMMUTABLE';
end;
$$;

revoke all on function public.prevent_smartvibe_trade_audit_mutation() from public,anon,authenticated;
grant execute on function public.prevent_smartvibe_trade_audit_mutation() to service_role;

drop trigger if exists smartvibe_trade_audit_no_update on public.smartvibe_trade_audit;
create trigger smartvibe_trade_audit_no_update
before update on public.smartvibe_trade_audit
for each row execute function public.prevent_smartvibe_trade_audit_mutation();

drop trigger if exists smartvibe_trade_audit_no_delete on public.smartvibe_trade_audit;
create trigger smartvibe_trade_audit_no_delete
before delete on public.smartvibe_trade_audit
for each row execute function public.prevent_smartvibe_trade_audit_mutation();

revoke update,delete on public.smartvibe_trade_audit from public,anon,authenticated,service_role;
grant select,insert on public.smartvibe_trade_audit to service_role;
