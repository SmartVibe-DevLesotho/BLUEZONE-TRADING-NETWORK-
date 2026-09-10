import { evaluateSmartVibeGate } from '../decision/gate';
import { emitAuditEvent, type AuditEvent, type AuditSink } from '../audit/events';
import { validateLiveRisk, type RiskLimits } from '../risk/engine';
import { findExistingClientOrder } from './idempotency';
import type {
  BrokerAdapter,
  BrokerOrder,
  PlaceOrderRequest,
} from './broker';
import type { Evidence, SmartVibeSetup } from '../adapters/types';

export type ExecutionPipelineInput = {
  setup: SmartVibeSetup;
  evidence: Evidence[];
  quantity: number;
  limits: RiskLimits;
  dailyLossPercent: number;
  broker: BrokerAdapter;
  audit?: AuditSink;
  now?: () => Date;
};

export type ExecutionPipelineResult = {
  status: 'EXECUTED' | 'BLOCKED' | 'FAILED';
  stage: 'GATE' | 'RISK' | 'EXECUTION' | 'BROKER';
  reason: string;
  gate?: ReturnType<typeof evaluateSmartVibeGate>;
  risk?: ReturnType<typeof validateLiveRisk>;
  order?: BrokerOrder;
  clientOrderId?: string;
};

/**
 * Stable execution intent ID: retries of the same SmartVibe signal/version
 * must resolve to the same broker client order ID instead of creating a new one.
 */
function makeClientOrderId(setup: SmartVibeSetup): string {
  const signal = setup.signalId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'signal';
  const version = setup.methodologyVersion.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || 'v1';
  return `sv-${signal}-${version}`;
}

function audit(
  sink: AuditSink | undefined,
  event: Omit<AuditEvent, 'timestamp'>,
  now: Date,
): void {
  emitAuditEvent(sink, { ...event, timestamp: now.toISOString() });
}

/**
 * Single live-order orchestration boundary.
 * SmartVibe methodology decides direction; this pipeline only validates and executes it.
 * No simulated broker, fallback order, or automatic direction rewrite is permitted here.
 */
export async function executeSmartVibeLiveOrder(
  input: ExecutionPipelineInput,
): Promise<ExecutionPipelineResult> {
  const now = (input.now ?? (() => new Date()))();
  const { setup, evidence, quantity, limits, dailyLossPercent, broker, audit: sink } = input;

  const gate = evaluateSmartVibeGate(setup, evidence);
  if (!gate.executionAllowed) {
    audit(sink, {
      type: 'SIGNAL_REJECTED',
      actor: 'SMARTVIBE',
      entityId: setup.signalId,
      symbol: setup.symbol,
      metadata: { reason: gate.reason },
    }, now);
    return { status: 'BLOCKED', stage: 'GATE', reason: gate.reason, gate };
  }

  if (limits.emergencyStop) {
    audit(sink, {
      type: 'EMERGENCY_STOP_ACTIVATED',
      actor: 'SYSTEM',
      entityId: setup.signalId,
      symbol: setup.symbol,
      metadata: { reason: 'GLOBAL_EMERGENCY_KILL_SWITCH_ACTIVE' },
    }, now);
    return { status: 'BLOCKED', stage: 'RISK', reason: 'GLOBAL_EMERGENCY_KILL_SWITCH_ACTIVE', gate };
  }

  const clientOrderId = makeClientOrderId(setup);

  try {
    await broker.authenticate();
    const [account, positions, orders, symbols, quote] = await Promise.all([
      broker.getAccount(),
      broker.getPositions(),
      broker.getOrders(),
      broker.getSymbols(),
      broker.getQuote(setup.symbol),
    ]);

    if (!symbols.includes(setup.symbol)) {
      const reason = 'SYMBOL_NOT_AVAILABLE_AT_BROKER';
      audit(sink, { type: 'RISK_BLOCKED', actor: 'SMARTVIBE', entityId: setup.signalId, symbol: setup.symbol, metadata: { reason } }, now);
      return { status: 'BLOCKED', stage: 'RISK', reason, gate, clientOrderId };
    }

    const existing = findExistingClientOrder(orders, clientOrderId);
    if (existing.duplicate && existing.existingOrder) {
      const reason = 'DUPLICATE_CLIENT_ORDER_ID_BLOCKED';
      audit(sink, {
        type: 'RISK_BLOCKED',
        actor: 'SMARTVIBE',
        entityId: clientOrderId,
        symbol: setup.symbol,
        metadata: { reason, existingOrderId: existing.existingOrder.id, existingStatus: existing.existingOrder.status },
      }, now);
      return { status: 'BLOCKED', stage: 'RISK', reason, gate, order: existing.existingOrder, clientOrderId };
    }

    const duplicateActiveOrder = orders.some((order) =>
      order.symbol === setup.symbol &&
      (order.status === 'PENDING' || order.status === 'ACCEPTED' || order.status === 'PARTIALLY_FILLED') &&
      order.side === setup.direction &&
      order.quantity === quantity,
    );
    if (duplicateActiveOrder) {
      const reason = 'DUPLICATE_ACTIVE_ORDER_BLOCKED';
      audit(sink, { type: 'RISK_BLOCKED', actor: 'SMARTVIBE', entityId: setup.signalId, symbol: setup.symbol, metadata: { reason } }, now);
      return { status: 'BLOCKED', stage: 'RISK', reason, gate, clientOrderId };
    }

    const risk = validateLiveRisk({
      setup,
      account,
      positions,
      quote,
      quantity,
      limits,
      dailyLossPercent,
      quoteTimestamp: quote.timestamp,
      now,
    });
    if (!risk.allowed) {
      audit(sink, {
        type: 'RISK_BLOCKED',
        actor: 'SMARTVIBE',
        entityId: setup.signalId,
        symbol: setup.symbol,
        metadata: { reasons: risk.reasons },
      }, now);
      return { status: 'BLOCKED', stage: 'RISK', reason: risk.reasons.join('|'), gate, risk, clientOrderId };
    }

    const request: PlaceOrderRequest = {
      symbol: setup.symbol,
      side: setup.direction,
      type: 'MARKET',
      quantity,
      stopLoss: setup.sl ?? undefined,
      takeProfit: setup.tp ?? undefined,
      clientOrderId,
    };

    audit(sink, {
      type: 'ORDER_SUBMITTED',
      actor: 'SMARTVIBE',
      entityId: clientOrderId,
      symbol: setup.symbol,
      metadata: { direction: setup.direction, quantity, signalId: setup.signalId, methodologyVersion: setup.methodologyVersion },
    }, now);

    const order = await broker.placeOrder(request);
    audit(sink, {
      type: order.status === 'REJECTED' ? 'ORDER_REJECTED' : 'ORDER_ACCEPTED',
      actor: 'BROKER',
      entityId: order.id,
      symbol: order.symbol,
      metadata: { status: order.status, clientOrderId },
    }, now);

    if (order.status === 'REJECTED' || order.status === 'CANCELLED') {
      return { status: 'FAILED', stage: 'BROKER', reason: `BROKER_ORDER_${order.status}`, gate, risk, order, clientOrderId };
    }

    return { status: 'EXECUTED', stage: 'EXECUTION', reason: 'LIVE_ORDER_ACCEPTED_BY_BROKER', gate, risk, order, clientOrderId };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'BROKER_EXECUTION_ERROR';
    audit(sink, {
      type: 'BROKER_DISCONNECTED',
      actor: 'BROKER',
      entityId: setup.signalId,
      symbol: setup.symbol,
      metadata: { error: reason, clientOrderId },
    }, now);
    return { status: 'FAILED', stage: 'BROKER', reason, gate, clientOrderId };
  }
}
