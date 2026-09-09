-- Restore authenticated owner policies for tables that intentionally hold user-owned data.
-- Anonymous access remains denied.
create policy "push devices owner access" on public.push_devices
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "alert events owner read" on public.signal_alert_events
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "alert watches owner access" on public.signal_alert_watches
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
