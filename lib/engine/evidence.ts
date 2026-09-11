import type { StructureEvidence } from './market-structure';

export type EvidenceStatus = 'confirmed' | 'neutral' | 'warning' | 'unknown';
export type EvidenceRole = 'PRIMARY' | 'CONFIRMING' | 'CONTEXTUAL' | 'CONTRADICTORY' | 'INSUFFICIENT';
export type EvidenceSource = 'smartvibe-market-structure';

export type SmartVibeEvidence = {
  source: EvidenceSource;
  generatedAt: string;
  symbol: string;
  role: EvidenceRole;
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
  structure?: StructureEvidence;
  provenance?: string;
};

export type EvidenceMatrix = {
  symbol: string;
  collectedAt: string;
  coreMethodologyPass: boolean;
  primary: SmartVibeEvidence[];
  confirming: SmartVibeEvidence[];
  contextual: SmartVibeEvidence[];
  contradictory: SmartVibeEvidence[];
  insufficient: SmartVibeEvidence[];
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
