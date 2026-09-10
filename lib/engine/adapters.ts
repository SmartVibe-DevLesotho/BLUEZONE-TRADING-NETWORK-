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
  approved: boolean;
  authority: 'smartvibe-core';
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
 * Safe no-op adapters keep the mobile app deployable without bundling external
 * trading platforms. Production connectors can be supplied by a server-side
 * worker without changing the SmartVibe Core contract.
 */
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
