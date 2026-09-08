import { supabase } from './supabase';
export async function invokeFunction<T>(name: string, body: unknown): Promise<T> { if (!supabase) throw new Error('Supabase is not configured.'); const { data, error } = await supabase.functions.invoke(name, { body: JSON.stringify(body) }); if (error) throw error; return data as T; }
export type MarketQuote = { symbol: string; price: number; change: number; source: string; stale?: boolean };
export type ConsensusSignal = { symbol: string; direction: 'BUY'|'SELL'; score: number; total: 100; session: string; style: 'SmartVibe Trading Network'; entry: number; sl: number|null; tp: number|null; strategies?: unknown; management?: { milestonePips: 150; hardProfitCap: false; runner: true; exitRule: 'STRUCTURAL_INVALIDATION_OR_METHODOLOGY_REVERSAL'; trailingStop?: 'NONE_GENERIC' }; evidence?: unknown };
export type SubscriptionQuota = { plan: string; packageKey?: string | null; packageName?: string | null; pricePaidLsl?: number; includedSignals: number; signalsUsed: number; signalsPending: number; signalsUnused: number; signalsRemaining: number; carryoverSignals: number; carryoverCreditLsl: number; scannerAccess?: boolean; whatsappGroupAccess?: boolean; allServicesAccess?: boolean };
export type LicenseValidation = { valid: boolean; message: string; expiresAt?: string | null; plan?: string; packageKey?: string | null; packageName?: string | null; pricePaidLsl?: number; includedSignals?: number; signalsUsed?: number; signalsPending?: number; signalsUnused?: number; signalsRemaining?: number; carryoverSignals?: number; carryoverCreditLsl?: number; scannerAccess?: boolean; whatsappGroupAccess?: boolean; allServicesAccess?: boolean };
export type ChartScanResult = {
  ok: boolean;
  detectedInstrument: string | null;
  detectedInstrumentLabel: string | null;
  broker: string | null;
  timeframe: string | null;
  chartReadable: boolean;
  direction: 'BUY' | 'SELL' | 'WAIT';
  confidence: number;
  methodology: {
    higherTimeframeDirection: string;
    m30Confirmation: string;
    resistanceSupportRbs: string;
    engulfing: string;
    lowerTimeframeConfirmation: string;
    trendlinePriceAction: string;
    structuralInvalidation: string;
    continuationManagement: string;
  };
  feedback: string;
  warnings: string[];
  evidence: string[];
};
export const getMarketQuotes = (symbols: string[]) => invokeFunction<{quotes: MarketQuote[]}>('market-data', { symbols });
export const getConsensusSignals = (input: {symbols: string[]; threshold?: number; session?: string; style?: string}) => invokeFunction<{ok?: boolean; signals: ConsensusSignal[]; subscription?: SubscriptionQuota}>('consensus-signals', input);
export const validateLicense = (input: {token?: string; action: 'activate'|'status'; deviceId: string}) => invokeFunction<LicenseValidation>('license-validate', input);
export const sendAIMessage = (message: string, context?: unknown) => invokeFunction<{reply: string; status?: string}>('ai-chat', { message, context });
export const scanSmartVibeChart = (imageBase64: string, mimeType = 'image/jpeg') => invokeFunction<ChartScanResult>('smartvibe-chart-scanner', { imageBase64, mimeType });
