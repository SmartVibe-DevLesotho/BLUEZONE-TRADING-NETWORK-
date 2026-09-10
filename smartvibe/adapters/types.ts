export type ValidationStatus = 'PASS' | 'FAIL' | 'NEUTRAL';

export type SmartVibeSetup = {
  signalId: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entry: number;
  sl: number | null;
  tp: number | null;
  methodologyVersion: string;
  methodologySnapshot: Record<string, unknown>;
};

export type Evidence = {
  source: string;
  status: ValidationStatus;
  summary: string;
  confidence?: number;
  metrics?: Record<string, number | string | boolean | null>;
  warnings?: string[];
  observedAt: string;
};

export interface EvidenceAdapter {
  readonly id: string;
  inspect(setup: SmartVibeSetup): Promise<Evidence>;
}

export type SmartVibeGateResult = {
  signalId: string;
  methodologyDecision: 'BUY' | 'SELL';
  externalValidation: 'CONFIRMED' | 'CAUTION' | 'REJECTED';
  evidence: Evidence[];
  executionAllowed: boolean;
  reason: string;
};
