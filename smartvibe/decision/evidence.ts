import type { Evidence, SmartVibeSetup } from '../adapters/types';
import { analyzeSupportingMechanism, type SupportingMechanismInput, type StructuralEvidence } from '../intelligence/supporting-mechanism';

export type EvidenceDomain =
  | 'structure' | 'liquidity' | 'displacement' | 'order_block' | 'fvg'
  | 'crt' | 'session' | 'av' | '714' | 'ema' | 'volatility'
  | 'news' | 'fundamentals' | 'sentiment' | 'correlation' | 'risk';

export type EvidenceItem = Evidence & { domain: EvidenceDomain };

export type EvidenceMatrix = {
  signalId: string;
  methodologyDirection: SmartVibeSetup['direction'];
  items: EvidenceItem[];
  complete: boolean;
};

const REQUIRED_DOMAINS: EvidenceDomain[] = [
  'structure', 'liquidity', 'displacement', 'order_block', 'fvg', 'crt',
  'session', 'av', '714', 'ema', 'volatility', 'news', 'fundamentals',
  'sentiment', 'correlation', 'risk',
];

/** Evidence is descriptive only; it cannot change the SmartVibe direction. */
export function buildEvidenceMatrix(setup: SmartVibeSetup, items: EvidenceItem[]): EvidenceMatrix {
  const domains = new Set(items.map((item) => item.domain));
  return {
    signalId: setup.signalId,
    methodologyDirection: setup.direction,
    items: [...items],
    complete: REQUIRED_DOMAINS.every((domain) => domains.has(domain)),
  };
}

/**
 * Converts the universal structural analyzer into normalized SmartVibe evidence.
 * It remains subordinate to the primary methodology and never emits an order command.
 */
export function buildStructuralSupportingEvidence(input: SupportingMechanismInput): EvidenceItem {
  const structure: StructuralEvidence = analyzeSupportingMechanism(input);
  const blocking = structure.dataQuality === 'INSUFFICIENT' || structure.dataQuality === 'LOW' || structure.contradiction;
  const role = structure.contradiction ? 'CONTRADICTORY' : structure.dataQuality === 'INSUFFICIENT' ? 'INSUFFICIENT' : 'CONFIRMING';
  return {
    domain: 'structure',
    source: 'smartvibe-supporting-mechanism',
    status: blocking ? 'FAIL' : structure.requiresConfirmation ? 'NEUTRAL' : 'PASS',
    role,
    summary: `Regime=${structure.macroRegime}; HTF=${structure.htfStructure}; range=${structure.rangeLocation}; liquidity=${structure.liquidityEvent}; transition=${structure.trendTransition}.`,
    confidence: structure.supportingConfidence,
    metrics: {
      rangePositionPercent: structure.rangePositionPercent,
      rangeRegimeProbability: structure.rangeRegimeProbability,
      trendProbability: structure.trendProbability,
      compressionProbability: structure.compressionProbability,
      expansionProbability: structure.expansionProbability,
      correctionProbability: structure.correctionProbability,
      stageProbability: structure.stageProbability,
      structuralInvalidationPrice: structure.structuralInvalidationPrice,
      invalidationStatus: structure.invalidationStatus,
      volatilityState: structure.volatilityState,
      dataQuality: structure.dataQuality,
      contradiction: structure.contradiction,
      requiresConfirmation: structure.requiresConfirmation,
    },
    warnings: structure.requiresConfirmation ? ['Supporting evidence requires confirmation before it can be considered execution-ready.'] : undefined,
    observedAt: new Date().toISOString(),
  };
}

export function requiredEvidenceDomains(): readonly EvidenceDomain[] {
  return REQUIRED_DOMAINS;
}
