-- SmartVibe Trading Network production hardening
-- Reproducible record of security/performance changes applied to production.

-- SECURITY: privileged SECURITY DEFINER RPCs are not directly callable by client roles.
revoke execute on function public.approve_smartvibe_signal_usage(uuid, boolean, text) from authenticated, anon;
revoke execute on function public.has_portal_access(text) from authenticated, anon;
revoke execute on function public.redeem_portal_access_token(text) from authenticated, anon;
revoke execute on function public.select_portal(text) from authenticated, anon;

-- PERFORMANCE: cover foreign keys flagged by Supabase's database advisor.
create index if not exists ai_conversations_user_id_fk_idx on public.ai_conversations(user_id);
create index if not exists licenses_renewal_of_license_id_fk_idx on public.licenses(renewal_of_license_id);
create index if not exists portal_access_tokens_created_by_fk_idx on public.portal_access_tokens(created_by);
create index if not exists portal_access_tokens_plan_id_fk_idx on public.portal_access_tokens(plan_id);
create index if not exists portal_audit_logs_portal_id_fk_idx on public.portal_audit_logs(portal_id);
create index if not exists portal_audit_logs_target_user_id_fk_idx on public.portal_audit_logs(target_user_id);
create index if not exists portal_audit_logs_token_id_fk_idx on public.portal_audit_logs(token_id);
create index if not exists portal_entitlements_plan_id_fk_idx on public.portal_entitlements(plan_id);
create index if not exists portal_entitlements_portal_id_fk_idx on public.portal_entitlements(portal_id);
create index if not exists trade_events_position_id_fk_idx on public.trade_events(position_id);
create index if not exists user_licenses_license_id_fk_idx on public.user_licenses(license_id);
create index if not exists user_signal_history_signal_id_fk_idx on public.user_signal_history(signal_id);
create index if not exists vck_change_logs_user_id_fk_idx on public.vck_change_logs(user_id);
create index if not exists vck_decisions_created_by_fk_idx on public.vck_decisions(created_by);
create index if not exists vck_developer_credit_project_id_fk_idx on public.vck_developer_credit(project_id);
create index if not exists vck_prompt_runs_step_id_fk_idx on public.vck_prompt_runs(step_id);
