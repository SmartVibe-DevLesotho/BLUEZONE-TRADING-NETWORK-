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

/**
 * Broker-neutral execution-event monitor. The adapter owns transport details;
 * this layer owns lifecycle state only. No polling fallback or simulated events.
 */
export function monitorLiveExecution(
  broker: BrokerAdapter,
  onEvent: (event: ExecutionEvent) => void,
  onDisconnect?: (error?: unknown) => void,
): RealtimeExecutionMonitor {
  let stopped = false;
  let unsubscribe: (() => void) | null = null;
  const state: RealtimeExecutionState = {
    connected: false,
    lastEventAt: null,
    heartbeatAt: new Date().toISOString(),
    reconnectCount: 0,
  };

  const attach = (): void => {
    if (stopped) return;
    try {
      unsubscribe = broker.monitorExecution((event) => {
        if (stopped) return;
        state.connected = true;
        state.lastEventAt = event.timestamp;
        state.heartbeatAt = event.timestamp;
        onEvent(event);
      });
      state.connected = true;
      state.heartbeatAt = new Date().toISOString();
    } catch (error) {
      state.connected = false;
      state.reconnectCount += 1;
      onDisconnect?.(error);
    }
  };

  attach();

  return {
    getState: () => ({ ...state }),
    stop: () => {
      stopped = true;
      state.connected = false;
      unsubscribe?.();
      unsubscribe = null;
    },
  };
}
