import type { Evidence, SmartVibeSetup } from '../adapters/types';

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

export function requiredEvidenceDomains(): readonly EvidenceDomain[] {
  return REQUIRED_DOMAINS;
}
