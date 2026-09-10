/**
 * SmartVibe Evidence Contract
 *
 * External research/technical systems may provide evidence only. They must not
 * produce or mutate a SmartVibe signal directly.
 */
export type EvidenceStatus = 'confirmed' | 'neutral' | 'warning' | 'unknown';

export type EvidenceSource =
  | 'forextree-swarm'
  | 'tradingbot'
  | 'tradingagents'
  | 'ai-trader'
  | 'quantdinger';

export type SmartVibeEvidence = {
  source: EvidenceSource;
  generatedAt: string;
  symbol: string;
  structureAlignment: EvidenceStatus;
  liquidity: EvidenceStatus;
  volatility: EvidenceStatus;
  macroRisk: EvidenceStatus;
  sentiment: EvidenceStatus;
  bullCaseStrength: number;
  bearCaseStrength: number;
  riskStatus: EvidenceStatus;
  historicalSimilarity: EvidenceStatus;
  notes: string[];
  provenance?: string;
};

export type EvidenceMatrix = {
  symbol: string;
  collectedAt: string;
  coreMethodologyPass: boolean;
  structurePass: boolean;
  liquidityPass: boolean;
  volatilityPass: boolean;
  macroPass: boolean;
  sentimentPass: boolean;
  bullCase: SmartVibeEvidence[];
  bearCase: SmartVibeEvidence[];
  riskCase: SmartVibeEvidence[];
  historicalCase: SmartVibeEvidence[];
};

export type SmartVibeGateResult = {
  approved: boolean;
  reason: string;
  methodologyAuthority: 'smartvibe-core';
  evidenceCount: number;
  matrix: EvidenceMatrix;
};

export function clampEvidenceScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
