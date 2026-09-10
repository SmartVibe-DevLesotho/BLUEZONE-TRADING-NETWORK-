import type { EvidenceSource, SmartVibeEvidence } from './evidence';

export type ResearchRequest = {
  symbol: string;
  timeframe?: string;
  asOf: string;
  coreSetupId: string;
  context?: Record<string, unknown>;
};

export type OperationsRequest = {
  signalId: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entry: number;
  sl: number | null;
  tp: number | null;
};

export type ExecutionIntent = OperationsRequest & {
  approved: true;
  authority: 'smartvibe-core';
};

export type LiveExecutionRequest = ExecutionIntent & {
  clientOrderId: string;
  lot: number;
  quoteBid: number;
  quoteAsk: number;
  quoteTimestamp: string;
  maxEntryDeviationPips: number;
  maxSlippagePips: number;
};

export type LiveExecutionResult = {
  accepted: boolean;
  externalId?: string;
  clientOrderId: string;
  brokerPrice?: number;
  message?: string;
};

/** Research workers are read-only from the strategy's perspective. */
export interface ResearchAdapter {
  readonly source: EvidenceSource;
  research(request: ResearchRequest): Promise<SmartVibeEvidence[]>;
}

/** Operations adapters execute only an already-approved SmartVibe intent. */
export interface OperationsAdapter {
  readonly name: string;
  synchronizeSignal(intent: ExecutionIntent): Promise<{ accepted: boolean; externalId?: string; message?: string }>;
}

/**
 * Live broker adapters are server-side only. Never bundle broker credentials
 * or bridge secrets into the mobile client.
 */
export interface LiveBrokerAdapter {
  readonly name: string;
  execute(request: LiveExecutionRequest): Promise<LiveExecutionResult>;
}

const assertFinitePositive = (name: string, value: number) => {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a positive finite number.`);
};

const assertFinite = (name: string, value: number) => {
  if (!Number.isFinite(value)) throw new Error(`${name} must be finite.`);
};

const assertExecutionRequest = (request: LiveExecutionRequest) => {
  if (request.approved !== true || request.authority !== 'smartvibe-core') {
    throw new Error('Live execution requires an approved SmartVibe authority intent.');
  }
  if (!request.signalId || !request.clientOrderId) throw new Error('signalId and clientOrderId are required.');
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(request.clientOrderId)) throw new Error('Invalid clientOrderId format.');
  if (!request.symbol) throw new Error('symbol is required.');
  assertFinitePositive('lot', request.lot);
  assertFinite('entry', request.entry);
  assertFinite('quoteBid', request.quoteBid);
  assertFinite('quoteAsk', request.quoteAsk);
  if (request.quoteAsk <= request.quoteBid) throw new Error('Broker quote is invalid.');
  if (!Number.isFinite(Date.parse(request.quoteTimestamp))) throw new Error('quoteTimestamp is invalid.');
  assertFinitePositive('maxEntryDeviationPips', request.maxEntryDeviationPips);
  assertFinitePositive('maxSlippagePips', request.maxSlippagePips);
};

/**
 * HTTP adapter for an MT5 terminal bridge such as pyMt5Bridge.
 *
 * This adapter intentionally fails closed when no bridge URL is configured.
 * It performs no paper/demo fallback and never exposes credentials to the app.
 */
export class Mt5BridgeOperationsAdapter implements LiveBrokerAdapter {
  readonly name = 'mt5-http-live';

  constructor(
    private readonly baseUrl: string,
    private readonly bearerToken?: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async execute(request: LiveExecutionRequest): Promise<LiveExecutionResult> {
    assertExecutionRequest(request);
    if (!this.baseUrl) throw new Error('MT5 live bridge is not configured.');

    const url = `${this.baseUrl.replace(/\/$/, '')}/order`;
    const orderType = request.direction === 'BUY' ? 'buy' : 'sell';
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (this.bearerToken) headers.authorization = `Bearer ${this.bearerToken}`;

    const response = await this.fetchImpl(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        symbol: request.symbol,
        lot: request.lot,
        order_type: orderType,
        sl: request.sl ?? 0,
        tp: request.tp ?? 0,
        comment: `SV:${request.clientOrderId}`.slice(0, 31),
      }),
    });

    const body = await response.json().catch(() => null) as Record<string, unknown> | null;
    if (!response.ok) {
      return { accepted: false, clientOrderId: request.clientOrderId, message: `Broker bridge HTTP ${response.status}.` };
    }

    const retcode = typeof body?.retcode === 'number' ? body.retcode : null;
    const externalId = typeof body?.ticket === 'number' || typeof body?.order === 'number'
      ? String(body.ticket ?? body.order)
      : undefined;
    const brokerPrice = typeof body?.price === 'number' ? body.price : undefined;

    if (retcode === null || !externalId) {
      return { accepted: false, clientOrderId: request.clientOrderId, message: 'Broker acknowledgement was incomplete.' };
    }

    // MT5 TRADE_RETCODE_DONE=10009 and TRADE_RETCODE_DONE_PARTIAL=10010.
    const accepted = retcode === 10009 || retcode === 10010;
    return {
      accepted,
      clientOrderId: request.clientOrderId,
      externalId,
      brokerPrice,
      message: typeof body?.comment === 'string' ? body.comment : undefined,
    };
  }
}

/** Research workers remain disabled until concrete read-only providers are wired. */
export const disabledResearchAdapter = (source: EvidenceSource): ResearchAdapter => ({
  source,
  async research() { return []; },
});

/** No broker fallback is permitted. */
export const disabledOperationsAdapter: OperationsAdapter = {
  name: 'disabled',
  async synchronizeSignal() {
    return { accepted: false, message: 'Execution adapter is disabled.' };
  },
};
