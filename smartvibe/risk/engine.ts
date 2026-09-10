import type { SmartVibeSetup } from '../adapters/types';
import type { BrokerAccount, BrokerPosition } from '../execution/broker';

export type RiskLimits = {
  maxRiskPercent: number;
  maxOpenPositions: number;
  maxDailyLossPercent: number;
  maxSpread: number;
  maxSlippage: number;
  maxLeverage: number;
  maxSymbolExposure: number;
  maxCorrelatedExposure?: number;
  maxQuoteAgeSeconds?: number;
  maxEntryDeviation?: number;
  emergencyStop: boolean;
};

export type RiskDecision = {
  allowed: boolean;
  reasons: string[];
  estimatedRiskPercent: number;
  estimatedNotional: number;
};

export type RiskInput = {
  setup: SmartVibeSetup;
  account: BrokerAccount;
  positions: BrokerPosition[];
  quote: { bid: number; ask: number };
  quantity: number;
  limits: RiskLimits;
  dailyLossPercent: number;
  quoteTimestamp?: string;
  now?: Date;
  /** Notional exposure already held in symbols that are configured as correlated. */
  correlatedExposure?: number;
  /** Broker-reported market status when available. Unknown is intentionally rejected. */
  marketStatus?: 'OPEN' | 'CLOSED' | 'HALTED' | 'UNKNOWN';
};

/** Hard pre-trade gate. A caller must not submit an order when allowed=false. */
export function validateLiveRisk(input: RiskInput): RiskDecision {
  const {
    setup,
    account,
    positions,
    quote,
    quantity,
    limits,
    dailyLossPercent,
    quoteTimestamp,
    now = new Date(),
    correlatedExposure = 0,
    marketStatus = 'OPEN',
  } = input;
  const reasons: string[] = [];
  const mid = (quote.bid + quote.ask) / 2;
  const executablePrice = setup.direction === 'BUY' ? quote.ask : quote.bid;
  const stopDistance = setup.sl === null ? null : Math.abs(setup.entry - setup.sl);
  const estimatedRisk = stopDistance === null ? 0 : stopDistance * quantity;
  const estimatedNotional = mid > 0 ? mid * quantity : 0;
  const estimatedRiskPercent = account.equity > 0 ? (estimatedRisk / account.equity) * 100 : Infinity;
  const spread = quote.ask - quote.bid;
  const exposureForSymbol = positions
    .filter((position) => position.symbol === setup.symbol)
    .reduce((sum, position) => sum + Math.abs(position.quantity * position.averagePrice), 0) + estimatedNotional;
  const effectiveLeverage = account.equity > 0 ? estimatedNotional / account.equity : Infinity;
  const slippage = setup.entry > 0 && Number.isFinite(executablePrice)
    ? Math.abs(executablePrice - setup.entry)
    : Infinity;
  const quoteAgeSeconds = quoteTimestamp
    ? (now.getTime() - Date.parse(quoteTimestamp)) / 1000
    : Infinity;

  if (limits.emergencyStop) reasons.push('GLOBAL_EMERGENCY_KILL_SWITCH_ACTIVE');
  if (account.equity <= 0 || account.marginAvailable <= 0) reasons.push('INSUFFICIENT_ACCOUNT_CAPACITY');
  if (positions.length >= limits.maxOpenPositions) reasons.push('MAX_OPEN_POSITIONS_REACHED');
  if (!Number.isFinite(dailyLossPercent) || dailyLossPercent >= limits.maxDailyLossPercent) reasons.push('DAILY_LOSS_LIMIT_REACHED');
  if (!Number.isFinite(quantity) || quantity <= 0) reasons.push('INVALID_POSITION_SIZE');
  if (!Number.isFinite(spread) || spread < 0 || spread > limits.maxSpread) reasons.push('SPREAD_LIMIT_EXCEEDED');
  if (!Number.isFinite(mid) || mid <= 0 || !Number.isFinite(quote.bid) || !Number.isFinite(quote.ask) || quote.bid <= 0 || quote.ask <= 0) reasons.push('INVALID_QUOTE');
  if (setup.entry <= 0 || !Number.isFinite(setup.entry)) reasons.push('INVALID_ENTRY');
  if (setup.sl === null) reasons.push('STOP_LOSS_REQUIRED');
  if (setup.sl !== null && (!Number.isFinite(setup.sl) || setup.sl <= 0)) reasons.push('INVALID_STOP_LOSS');
  if (setup.direction === 'BUY' && setup.sl !== null && setup.sl >= setup.entry) reasons.push('BUY_STOP_INVALID');
  if (setup.direction === 'SELL' && setup.sl !== null && setup.sl <= setup.entry) reasons.push('SELL_STOP_INVALID');
  if (setup.tp !== null && (!Number.isFinite(setup.tp) || setup.tp <= 0)) reasons.push('INVALID_TAKE_PROFIT');
  if (setup.direction === 'BUY' && setup.tp !== null && setup.tp <= setup.entry) reasons.push('BUY_TAKE_PROFIT_INVALID');
  if (setup.direction === 'SELL' && setup.tp !== null && setup.tp >= setup.entry) reasons.push('SELL_TAKE_PROFIT_INVALID');
  if (estimatedRiskPercent > limits.maxRiskPercent) reasons.push('MAX_RISK_PERCENT_EXCEEDED');
  if (effectiveLeverage > Math.min(account.leverage, limits.maxLeverage)) reasons.push('LEVERAGE_LIMIT_EXCEEDED');
  if (exposureForSymbol > limits.maxSymbolExposure) reasons.push('SYMBOL_EXPOSURE_LIMIT_EXCEEDED');
  if (!Number.isFinite(limits.maxSlippage) || limits.maxSlippage < 0) reasons.push('INVALID_SLIPPAGE_LIMIT');
  if (slippage > limits.maxSlippage) reasons.push('MAX_SLIPPAGE_EXCEEDED');
  if (limits.maxCorrelatedExposure !== undefined && correlatedExposure + estimatedNotional > limits.maxCorrelatedExposure) reasons.push('CORRELATED_EXPOSURE_LIMIT_EXCEEDED');
  if (quoteTimestamp && !Number.isFinite(Date.parse(quoteTimestamp))) reasons.push('INVALID_QUOTE_TIMESTAMP');
  const maxQuoteAge = limits.maxQuoteAgeSeconds ?? 30;
  if (!quoteTimestamp || !Number.isFinite(quoteAgeSeconds) || quoteAgeSeconds < 0 || quoteAgeSeconds > maxQuoteAge) reasons.push('STALE_QUOTE');
  if (limits.maxEntryDeviation !== undefined && Math.abs(executablePrice - setup.entry) > limits.maxEntryDeviation) reasons.push('ENTRY_DEVIATION_LIMIT_EXCEEDED');
  if (marketStatus !== 'OPEN') reasons.push('MARKET_NOT_OPEN');

  return { allowed: reasons.length === 0, reasons, estimatedRiskPercent, estimatedNotional };
}
