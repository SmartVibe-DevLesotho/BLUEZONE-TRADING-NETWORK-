-- Performance read models are not privileged execution surfaces.
-- Use caller permissions rather than view-owner permissions.
alter view public.smartvibe_performance_stats set (security_invoker = true);
alter view public.smartvibe_period_performance set (security_invoker = true);
