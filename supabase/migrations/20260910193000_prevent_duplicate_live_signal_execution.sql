-- Prevent duplicate live broker orders for the same SmartVibe signal.
-- A signal may have at most one non-rejected execution attempt; rejected attempts may be retried.
create unique index if not exists smartvibe_live_orders_signal_active_unique
  on public.smartvibe_live_orders(signal_id)
  where status in ('CLAIMED','EXECUTED','AMBIGUOUS');
