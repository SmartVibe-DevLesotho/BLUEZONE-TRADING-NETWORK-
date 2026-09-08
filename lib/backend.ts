import { supabase } from './supabase';
export async function invokeFunction<T>(name: string, body: unknown): Promise<T> { if (!supabase) throw new Error('Supabase is not configured.'); const { data, error } = await supabase.functions.invoke(name, { body: JSON.stringify(body) }); if (error) throw error; return data as T; }
export type MarketQuote = { symbol: string; price: number; change: number; source: string; stale?: boolean };
export type ConsensusSignal = { symbol: string; direction: 'BUY'|'SELL'; score: number; total: 100; session: string; style: 'SmartVibe Trading Network'; entry: number; sl: number; tp: number; strategies: string[]; management?: { milestonePips: 150; hardProfitCap: false; runner: true; exitRule: 'STRUCTURAL_INVALIDATION_OR_METHODOLOGY_REVERSAL'; trailingStop?: 'NONE_GENERIC' }; evidence?: unknown };
export type SubscriptionQuota = { plan: string; dailySignalLimit: number; signalsRemainingToday: number };
export type LicenseValidation = { valid: boolean; message: string; expiresAt?: string | null; plan?: string; dailySignalLimit?: number; signalsUsedToday?: number; signalsRemainingToday?: number };
export const getMarketQuotes = (symbols: string[]) => invokeFunction<{quotes: MarketQuote[]}>('market-data', { symbols });
export const getConsensusSignals = (input: {symbols: string[]; threshold: number; session: string; style: string}) => invokeFunction<{ok?: boolean; signals: ConsensusSignal[]; subscription?: SubscriptionQuota}>('consensus-signals', input);
export const validateLicense = (input: {token?: string; action: 'activate'|'status'; deviceId: string}) => invokeFunction<LicenseValidation>('license-validate', input);
export const sendAIMessage = (message: string, context?: unknown) => invokeFunction<{reply: string; status?: string}>('ai-chat', { message, context });
