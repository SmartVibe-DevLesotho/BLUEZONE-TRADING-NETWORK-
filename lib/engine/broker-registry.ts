/**
 * SmartVibe broker eligibility registry.
 *
 * This registry is deliberately provider-neutral. A broker is eligible for
 * live automation only when the exact legal entity/jurisdiction, regulator
 * status, product permission and automation protocol have been verified.
 * Brand recognition alone is never sufficient.
 */
export type RegulatorId =
  | 'FSCA'
  | 'FCA'
  | 'ASIC'
  | 'CySEC'
  | 'FSA_SC'
  | 'CFTC'
  | 'NFA'
  | 'FINMA'
  | 'MAS'
  | 'JFSA'
  | 'DFSA'
  | 'ADGM_FSRA'
  | 'CIRO'
  | 'FMA_NZ'
  | 'CBI'
  | 'other';

export type BrokerProtocol = 'MT5' | 'MT4' | 'CTRADER' | 'REST' | 'FIX' | 'PROPRIETARY';

export type BrokerEligibility = {
  id: string;
  brand: string;
  legalEntity: string;
  jurisdiction: string;
  regulators: Array<{
    id: RegulatorId;
    licenseOrFsp?: string;
    verificationUrl: string;
  }>;
  automationProtocols: BrokerProtocol[];
  liveAutomationAllowedByBroker: boolean;
  verificationStatus: 'VERIFIED' | 'REQUIRES_LIVE_RECHECK';
  notes: string;
};

/**
 * South Africa launch registry.
 *
 * FSCA sources are authoritative for South African authorisation status.
 * The app must still re-check the exact entity and permissions before enabling
 * a user's live account because an FSP registration does not automatically
 * mean every product, account type or automated strategy is permitted.
 */
export const SOUTH_AFRICA_BROKERS: readonly BrokerEligibility[] = [
  {
    id: 'exness-za',
    brand: 'Exness',
    legalEntity: 'Exness ZA (Pty) Ltd',
    jurisdiction: 'South Africa',
    regulators: [{
      id: 'FSCA',
      licenseOrFsp: '51024',
      verificationUrl: 'https://www.fsca.co.za/FSB-Search/',
    }],
    automationProtocols: ['MT5', 'MT4'],
    liveAutomationAllowedByBroker: true,
    verificationStatus: 'VERIFIED',
    notes: 'FSCA publicly identifies Exness ZA (Pty) Ltd as FSP 51024. Verify the current account/product permission before activation.',
  },
  {
    id: 'hf-markets-za',
    brand: 'HFM',
    legalEntity: 'HF Markets (Pty) Ltd',
    jurisdiction: 'South Africa',
    regulators: [{
      id: 'FSCA',
      licenseOrFsp: '46632',
      verificationUrl: 'https://www.fsca.co.za/FSB-Search/',
    }],
    automationProtocols: ['MT5', 'MT4'],
    liveAutomationAllowedByBroker: true,
    verificationStatus: 'VERIFIED',
    notes: 'FSCA materials identify HF Markets (Pty) Ltd as FSP 46632. Verify the current account/product permission before activation.',
  },
  {
    id: 'ig-markets-sa',
    brand: 'IG',
    legalEntity: 'IG Markets South Africa Limited',
    jurisdiction: 'South Africa',
    regulators: [{
      id: 'FSCA',
      licenseOrFsp: '41393',
      verificationUrl: 'https://www.fsca.co.za/FSB-Search/',
    }],
    automationProtocols: ['REST', 'PROPRIETARY'],
    liveAutomationAllowedByBroker: true,
    verificationStatus: 'REQUIRES_LIVE_RECHECK',
    notes: 'FSCA records identify FSP 41393. Product and ODP permissions have changed historically, so SmartVibe must re-check the current legal entity and product before live activation.',
  },
] as const;

export const BROKER_REGISTRY: readonly BrokerEligibility[] = SOUTH_AFRICA_BROKERS;

export const findEligibleBroker = (brokerId: string): BrokerEligibility | undefined =>
  BROKER_REGISTRY.find((broker) => broker.id === brokerId);

export const assertBrokerEligibleForLiveAutomation = (broker: BrokerEligibility): void => {
  if (!broker.liveAutomationAllowedByBroker) {
    throw new Error(`Live automation is not enabled for broker ${broker.brand}.`);
  }
  if (broker.regulators.length === 0) {
    throw new Error(`No regulator record exists for broker ${broker.brand}.`);
  }
  if (broker.verificationStatus !== 'VERIFIED') {
    throw new Error(`Broker ${broker.brand} requires a fresh regulatory/product verification before live activation.`);
  }
  if (broker.automationProtocols.length === 0) {
    throw new Error(`No supported automation protocol exists for broker ${broker.brand}.`);
  }
};
