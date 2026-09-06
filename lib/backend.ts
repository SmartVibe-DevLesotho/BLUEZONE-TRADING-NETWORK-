import { supabase } from './supabase';

export async function invokeFunction<T>(name: string, body: unknown): Promise<T> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.functions.invoke(name, { body: JSON.stringify(body) });
  if (error) throw error;
  return data as T;
}

export type MarketQuote = { symbol: string; price: number; change: number; source: string; stale?: boolean };
export type ConsensusSignal = { symbol: string; direction: 'BUY'|'SELL'; score: number; total: 8; session: string; style: string; entry: number; sl: number; tp: number; strategies: string[] };
export type LicenseValidation = { valid: boolean; message: string; expiresAt?: string | null };

export const getMarketQuotes = (symbols: string[]) => invokeFunction<{quotes: MarketQuote[]}>('market-data', { symbols });
export const getConsensusSignals = (input: {symbols: string[]; threshold: number; session: string; style: string}) => invokeFunction<{signals: ConsensusSignal[]}>('consensus-signals', input);
export const validateLicense = (input: {token: string; action: 'activate'|'status'; deviceId: string}) => invokeFunction<LicenseValidation>('license-validate', input);
export const sendAIMessage = (message: string, context?: unknown) => invokeFunction<{reply: string; status?: string}>('ai-chat', { message, context });
