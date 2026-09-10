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

export interface ResearchAdapter {
  readonly source: EvidenceSource;
  research(request: ResearchRequest): Promise<SmartVibeEvidence[]>;
}

export interface OperationsAdapter {
  readonly name: string;
  synchronizeSignal(intent: ExecutionIntent): Promise<{ accepted: boolean; externalId?: string; message?: string }>;
}

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
 * HTTP adapter for the open-source pyMt5Bridge HTTP surface.
 * The bridge exposes /order parameters as FastAPI query parameters, not JSON.
 * This adapter is server-side only and has no paper/demo fallback.
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

    const url = new URL(`${this.baseUrl.replace(/\/$/, '')}/order`);
    url.searchParams.set('symbol', request.symbol);
    url.searchParams.set('lot', String(request.lot));
    url.searchParams.set('order_type', request.direction === 'BUY' ? 'buy' : 'sell');
    url.searchParams.set('sl', String(request.sl ?? 0));
    url.searchParams.set('tp', String(request.tp ?? 0));
    url.searchParams.set('comment', `SV:${request.clientOrderId}`.slice(0, 31));

    const headers: Record<string, string> = { accept: 'application/json' };
    if (this.bearerToken) headers.authorization = `Bearer ${this.bearerToken}`;

    let response: Response;
    try {
      response = await this.fetchImpl(url.toString(), { method: 'POST', headers });
    } catch {
      throw new Error('Broker bridge request failed before an acknowledgement was received.');
    }

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

export const disabledResearchAdapter = (source: EvidenceSource): ResearchAdapter => ({
  source,
  async research() { return []; },
});

export const disabledOperationsAdapter: OperationsAdapter = {
  name: 'disabled',
  async synchronizeSignal() {
    return { accepted: false, message: 'Execution adapter is disabled.' };
  },
};
