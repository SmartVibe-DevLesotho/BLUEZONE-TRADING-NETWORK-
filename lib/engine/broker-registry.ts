/**
 * SmartVibe broker eligibility registry.
 *
 * A broker is eligible for live automation only when the exact legal
 * entity/jurisdiction, regulator status, product permission and automation
 * protocol have been verified. Brand recognition alone is never sufficient.
 */
export type RegulatorId =
  | 'FSCA' | 'FCA' | 'ASIC' | 'CySEC' | 'FSA_SC' | 'CFTC' | 'NFA'
  | 'FINMA' | 'MAS' | 'JFSA' | 'DFSA' | 'ADGM_FSRA' | 'CIRO'
  | 'FMA_NZ' | 'CBI' | 'other';

export type BrokerProtocol = 'MT5' | 'MT4' | 'CTRADER' | 'REST' | 'FIX' | 'PROPRIETARY';

export type BrokerEligibility = {
  id: string;
  brand: string;
  legalEntity: string;
  jurisdiction: string;
  regulators: Array<{ id: RegulatorId; licenseOrFsp?: string; verificationUrl: string }>;
  automationProtocols: BrokerProtocol[];
  liveAutomationAllowedByBroker: boolean;
  verificationStatus: 'VERIFIED' | 'REQUIRES_LIVE_RECHECK';
  notes: string;
};

/** Regulator families supported by the compliance model. */
export const SUPPORTED_GLOBAL_REGULATORS: readonly RegulatorId[] = [
  'FSCA', 'FCA', 'ASIC', 'CySEC', 'FSA_SC', 'CFTC', 'NFA', 'FINMA',
  'MAS', 'JFSA', 'DFSA', 'ADGM_FSRA', 'CIRO', 'FMA_NZ', 'CBI', 'other',
];

/**
 * South Africa launch registry.
 * FSCA status is authoritative for South African authorisation. An FSP
 * registration does not automatically authorise every product or strategy.
 */
export const SOUTH_AFRICA_BROKERS: readonly BrokerEligibility[] = [
  {
    id: 'exness-za', brand: 'Exness', legalEntity: 'Exness ZA (Pty) Ltd', jurisdiction: 'South Africa',
    regulators: [{ id: 'FSCA', licenseOrFsp: '51024', verificationUrl: 'https://www.fsca.co.za/FSB-Search/' }],
    automationProtocols: ['MT5', 'MT4'], liveAutomationAllowedByBroker: true,
    verificationStatus: 'VERIFIED',
    notes: 'FSCA identifies Exness ZA (Pty) Ltd as FSP 51024. Re-check current account/product permission before activation.',
  },
  {
    id: 'hf-markets-za', brand: 'HFM', legalEntity: 'HF Markets (Pty) Ltd', jurisdiction: 'South Africa',
    regulators: [{ id: 'FSCA', licenseOrFsp: '46632', verificationUrl: 'https://www.fsca.co.za/FSB-Search/' }],
    automationProtocols: ['MT5', 'MT4'], liveAutomationAllowedByBroker: true,
    verificationStatus: 'VERIFIED',
    notes: 'FSCA identifies HF Markets (Pty) Ltd as FSP 46632. Re-check current account/product permission before activation.',
  },
  {
    id: 'ig-markets-sa', brand: 'IG', legalEntity: 'IG Markets South Africa Limited', jurisdiction: 'South Africa',
    regulators: [{ id: 'FSCA', licenseOrFsp: '41393', verificationUrl: 'https://www.fsca.co.za/FSB-Search/' }],
    automationProtocols: ['REST', 'PROPRIETARY'], liveAutomationAllowedByBroker: true,
    verificationStatus: 'REQUIRES_LIVE_RECHECK',
    notes: 'FSCA records identify FSP 41393. Product and ODP permissions have changed historically; live activation requires fresh verification.',
  },
] as const;

/** First global expansion: Seychelles FSA. */
export const SEYCHELLES_BROKERS: readonly BrokerEligibility[] = [
  {
    id: 'tickmill-sc', brand: 'Tickmill', legalEntity: 'Tickmill Ltd', jurisdiction: 'Seychelles',
    regulators: [{ id: 'FSA_SC', licenseOrFsp: 'SD008', verificationUrl: 'https://fsaseychelles.sc/regulated-entities/capital-markets/' }],
    automationProtocols: ['MT5', 'MT4'], liveAutomationAllowedByBroker: true,
    verificationStatus: 'VERIFIED',
    notes: 'FSA Seychelles materials identify Tickmill Ltd in the capital-markets register; official correspondence identifies securities dealer licence SD008. Re-check current product/account permission before activation.',
  },
] as const;

export const BROKER_REGISTRY: readonly BrokerEligibility[] = [
  ...SOUTH_AFRICA_BROKERS,
  ...SEYCHELLES_BROKERS,
];

export const findEligibleBroker = (brokerId: string): BrokerEligibility | undefined =>
  BROKER_REGISTRY.find((broker) => broker.id === brokerId);

export const assertBrokerEligibleForLiveAutomation = (broker: BrokerEligibility): void => {
  if (!broker.liveAutomationAllowedByBroker) throw new Error(`Live automation is not enabled for broker ${broker.brand}.`);
  if (broker.regulators.length === 0) throw new Error(`No regulator record exists for broker ${broker.brand}.`);
  if (broker.verificationStatus !== 'VERIFIED') {
    throw new Error(`Broker ${broker.brand} requires fresh regulatory/product verification before live activation.`);
  }
  if (broker.automationProtocols.length === 0) throw new Error(`No supported automation protocol exists for broker ${broker.brand}.`);
};
