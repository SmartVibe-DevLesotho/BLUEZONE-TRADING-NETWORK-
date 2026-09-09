-- Remove legacy PUBLIC owner policies that duplicate authenticated policies.
drop policy if exists "mt5 own row" on public.mt5_connections;
drop policy if exists "positions own rows" on public.positions;
drop policy if exists "profiles own row" on public.profiles;
drop policy if exists "events own rows" on public.trade_events;
drop policy if exists "own license links" on public.user_licenses;
drop policy if exists "preferences own row" on public.user_preferences;

-- Restrict user signal usage to authenticated owners and evaluate auth.uid() once.
drop policy if exists "users approve own signal usage" on public.smartvibe_signal_usage;
drop policy if exists "users read own signal usage" on public.smartvibe_signal_usage;
create policy "users approve own signal usage"
on public.smartvibe_signal_usage
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id and status = any (array['USED'::text,'UNUSED'::text]));
create policy "users read own signal usage"
on public.smartvibe_signal_usage
for select to authenticated
using ((select auth.uid()) = user_id);

-- Optimize existing owner policies without changing their access semantics.
alter policy "ai_conversations_insert_own" on public.ai_conversations with check ((select auth.uid()) = user_id);
alter policy "ai_conversations_select_own" on public.ai_conversations using ((select auth.uid()) = user_id);
alter policy "ai_conversations_update_own" on public.ai_conversations using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "ai_messages_insert_own" on public.ai_messages with check (exists (select 1 from public.ai_conversations c where c.id = ai_messages.conversation_id and c.user_id = (select auth.uid())));
alter policy "ai_messages_select_own" on public.ai_messages using (exists (select 1 from public.ai_conversations c where c.id = ai_messages.conversation_id and c.user_id = (select auth.uid())));
alter policy "mt5_insert_own" on public.mt5_connections with check ((select auth.uid()) = user_id);
alter policy "mt5_select_own" on public.mt5_connections using ((select auth.uid()) = user_id);
alter policy "mt5_update_own" on public.mt5_connections using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "platform_admins_self_read" on public.platform_admins using (user_id = (select auth.uid()));
alter policy "portal_entitlements_admin_read" on public.portal_entitlements using ((user_id = (select auth.uid())) or is_platform_admin());
alter policy "portal_entitlements_owner_read" on public.portal_entitlements using (user_id = (select auth.uid()));
alter policy "positions_delete_own" on public.positions using ((select auth.uid()) = user_id);
alter policy "positions_insert_own" on public.positions with check ((select auth.uid()) = user_id);
alter policy "positions_select_own" on public.positions using ((select auth.uid()) = user_id);
alter policy "positions_update_own" on public.positions using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "profiles_select_own" on public.profiles using ((select auth.uid()) = id);
alter policy "profiles_update_own" on public.profiles using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
alter policy "signal_history_insert_own" on public.user_signal_history with check ((select auth.uid()) = user_id);
alter policy "signal_history_select_own" on public.user_signal_history using ((select auth.uid()) = user_id);
alter policy "trade_events_insert_own" on public.trade_events with check ((select auth.uid()) = user_id);
alter policy "trade_events_select_own" on public.trade_events using ((select auth.uid()) = user_id);
alter policy "user_licenses_select_own" on public.user_licenses using ((select auth.uid()) = user_id);
alter policy "preferences_insert_own" on public.user_preferences with check ((select auth.uid()) = user_id);
alter policy "preferences_select_own" on public.user_preferences using ((select auth.uid()) = user_id);
alter policy "preferences_update_own" on public.user_preferences using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "watchlists_delete_own" on public.watchlists using ((select auth.uid()) = user_id);
alter policy "watchlists_insert_own" on public.watchlists with check ((select auth.uid()) = user_id);
alter policy "watchlists_select_own" on public.watchlists using ((select auth.uid()) = user_id);
alter policy "smartvibe_live_signals_owner_select" on public.smartvibe_live_signals using ((select auth.uid()) = user_id);
alter policy "smartvibe users read own news analyses" on public.smartvibe_news_analyses using ((user_id = (select auth.uid())) and exists (select 1 from public.portal_entitlements pe where pe.user_id = (select auth.uid()) and pe.portal_id = '734825cb-228f-499d-8352-166837bef045'::uuid and pe.status = 'active'::text and (pe.expires_at is null or pe.expires_at > now())));
alter policy "smartvibe premium users read news events" on public.smartvibe_news_events using (exists (select 1 from public.portal_entitlements pe where pe.user_id = (select auth.uid()) and pe.portal_id = '734825cb-228f-499d-8352-166837bef045'::uuid and pe.status = 'active'::text and (pe.expires_at is null or pe.expires_at > now())));
alter policy "smartvibe premium users read news locks" on public.smartvibe_news_execution_locks using (exists (select 1 from public.portal_entitlements pe where pe.user_id = (select auth.uid()) and pe.portal_id = '734825cb-228f-499d-8352-166837bef045'::uuid and pe.status = 'active'::text and (pe.expires_at is null or pe.expires_at > now())));
alter policy "smartvibe premium users read news rules" on public.smartvibe_news_rules using (exists (select 1 from public.portal_entitlements pe where pe.user_id = (select auth.uid()) and pe.portal_id = '734825cb-228f-499d-8352-166837bef045'::uuid and pe.status = 'active'::text and (pe.expires_at is null or pe.expires_at > now())));
