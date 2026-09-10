import type { DataIntegrityIssue, DataIntegrityResult, MarketBar } from './types';

const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

function issue(issues: DataIntegrityIssue[], code: string, message: string, bar?: MarketBar, severity: 'ERROR' | 'WARNING' = 'ERROR') {
  issues.push({ code, message, severity, symbol: bar?.symbol, timestamp: bar?.timestamp });
}

/** Validates provider data before it can enter SmartVibe analysis. */
export function validateMarketBars(input: MarketBar[], now = new Date()): DataIntegrityResult {
  const issues: DataIntegrityIssue[] = [];
  const clean: MarketBar[] = [];
  const seen = new Set<string>();
  const groups = new Map<string, MarketBar[]>();

  for (const bar of input) {
    const time = Date.parse(bar.timestamp);
    const key = `${bar.source}|${bar.symbol}|${bar.timeframe}|${bar.timestamp}`;
    const groupKey = `${bar.source}|${bar.symbol}|${bar.timeframe}`;

    if (!bar.symbol || !bar.source || !bar.timeframe) issue(issues, 'MISSING_IDENTITY', 'Source, symbol and timeframe are required.', bar);
    if (!Number.isFinite(time)) issue(issues, 'INVALID_TIMESTAMP', 'Timestamp is not a valid ISO date.', bar);
    else if (time > now.getTime() + MAX_FUTURE_SKEW_MS) issue(issues, 'FUTURE_DATA', 'Future-dated market data rejected.', bar);
    if (!bar.timezone) issue(issues, 'MISSING_TIMEZONE', 'Timezone is required for session/SAST normalization.', bar);

    const prices = [bar.open, bar.high, bar.low, bar.close];
    if (prices.some((value) => !Number.isFinite(value) || value <= 0)) issue(issues, 'INVALID_OHLC', 'OHLC values must be finite and positive.', bar);
    if (Number.isFinite(bar.high) && Number.isFinite(bar.low) && bar.high < bar.low) issue(issues, 'IMPOSSIBLE_RANGE', 'High cannot be below low.', bar);
    if (Number.isFinite(bar.open) && Number.isFinite(bar.high) && Number.isFinite(bar.low) && (bar.open > bar.high || bar.open < bar.low)) issue(issues, 'OPEN_OUTSIDE_RANGE', 'Open must be between low and high.', bar);
    if (Number.isFinite(bar.close) && Number.isFinite(bar.high) && Number.isFinite(bar.low) && (bar.close > bar.high || bar.close < bar.low)) issue(issues, 'CLOSE_OUTSIDE_RANGE', 'Close must be between low and high.', bar);
    if (!Number.isFinite(bar.volume) || bar.volume < 0) issue(issues, 'INVALID_VOLUME', 'Volume must be finite and non-negative.', bar);

    if ((bar.bid === null) !== (bar.ask === null)) issue(issues, 'INCOMPLETE_QUOTE', 'Bid and ask must both be present or both be null.', bar);
    if (bar.bid !== null && (!Number.isFinite(bar.bid) || bar.bid <= 0)) issue(issues, 'INVALID_BID', 'Bid must be finite and positive.', bar);
    if (bar.ask !== null && (!Number.isFinite(bar.ask) || bar.ask <= 0)) issue(issues, 'INVALID_ASK', 'Ask must be finite and positive.', bar);
    if (bar.bid !== null && bar.ask !== null && bar.ask < bar.bid) issue(issues, 'CROSSED_QUOTE', 'Ask cannot be below bid.', bar);
    if (bar.spread !== null && (!Number.isFinite(bar.spread) || bar.spread < 0)) issue(issues, 'INVALID_SPREAD', 'Spread must be finite and non-negative.', bar);
    if (bar.bid !== null && bar.ask !== null && bar.spread !== null && Math.abs(bar.spread - (bar.ask - bar.bid)) > Math.max(1e-10, Math.abs(bar.spread) * 0.01)) issue(issues, 'SPREAD_MISMATCH', 'Reported spread does not match bid/ask.', bar, 'WARNING');

    if (seen.has(key)) issue(issues, 'DUPLICATE_CANDLE', 'Duplicate candle rejected.', bar);
    seen.add(key);
    const group = groups.get(groupKey) ?? [];
    group.push(bar);
    groups.set(groupKey, group);
  }

  for (const bars of groups.values()) {
    for (let i = 1; i < bars.length; i += 1) {
      const previous = Date.parse(bars[i - 1].timestamp);
      const current = Date.parse(bars[i].timestamp);
      if (Number.isFinite(previous) && Number.isFinite(current) && current <= previous) {
        issue(issues, 'OUT_OF_ORDER', 'Candles must be strictly chronological within each source/symbol/timeframe stream.', bars[i]);
      }
    }
  }

  const errorKeys = new Set(issues.filter((item) => item.severity === 'ERROR').map((item) => `${item.symbol ?? ''}|${item.timestamp ?? ''}`));
  for (const bar of input) {
    if (!errorKeys.has(`${bar.symbol}|${bar.timestamp}`)) clean.push(bar);
  }

  return { valid: issues.every((item) => item.severity !== 'ERROR'), bars: clean, issues };
}
