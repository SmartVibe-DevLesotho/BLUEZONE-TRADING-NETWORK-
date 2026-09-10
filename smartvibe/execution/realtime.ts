import type { BrokerAdapter, ExecutionEvent } from './broker';

export type RealtimeExecutionState = {
  connected: boolean;
  lastEventAt: string | null;
  heartbeatAt: string | null;
  reconnectCount: number;
};

export type RealtimeExecutionMonitor = {
  getState(): RealtimeExecutionState;
  stop(): void;
};

export type RealtimeExecutionOptions = {
  reconnectDelayMs?: number;
  onDisconnect?: (error?: unknown) => void;
};

/**
 * Broker-neutral execution-event monitor. The adapter owns transport details;
 * this layer owns lifecycle state only. Reconnects reattach the real adapter
 * stream; no polling fallback or simulated execution events are created.
 */
export function monitorLiveExecution(
  broker: BrokerAdapter,
  onEvent: (event: ExecutionEvent) => void,
  options: RealtimeExecutionOptions = {},
): RealtimeExecutionMonitor {
  let stopped = false;
  let unsubscribe: (() => void) | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  const reconnectDelayMs = Math.max(0, options.reconnectDelayMs ?? 1000);
  const state: RealtimeExecutionState = {
    connected: false,
    lastEventAt: null,
    heartbeatAt: new Date().toISOString(),
    reconnectCount: 0,
  };

  const scheduleReconnect = (error?: unknown): void => {
    if (stopped || reconnectTimer) return;
    state.connected = false;
    state.reconnectCount += 1;
    options.onDisconnect?.(error);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      attach();
    }, reconnectDelayMs);
  };

  const attach = (): void => {
    if (stopped) return;
    try {
      unsubscribe?.();
      unsubscribe = broker.monitorExecution(
        (event) => {
          if (stopped) return;
          state.connected = true;
          state.lastEventAt = event.timestamp;
          state.heartbeatAt = new Date().toISOString();
          onEvent(event);
        },
        scheduleReconnect,
      );
      state.connected = true;
      state.heartbeatAt = new Date().toISOString();
    } catch (error) {
      scheduleReconnect(error);
    }
  };

  attach();

  return {
    getState: () => ({ ...state }),
    stop: () => {
      stopped = true;
      state.connected = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = null;
      unsubscribe?.();
      unsubscribe = null;
    },
  };
}
