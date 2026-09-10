import type { MarketBar, MarketDataValidationIssue } from './market-data';

export type DataIntegrityResult = {
  valid: boolean;
  issues: MarketDataValidationIssue[];
};

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

/**
 * Reject malformed, duplicated, out-of-order, stale or future-contaminated bars
 * before they can reach SmartVibe analysis or any external intelligence engine.
 */
export function validateMarketBars(
  bars: MarketBar[],
  now = Date.now(),
  maxAgeMs = 5 * 60 * 1000,
): DataIntegrityResult {
  const issues: MarketDataValidationIssue[] = [];
  const seen = new Set<string>();
  let previousTimestamp = -Infinity;

  for (const bar of bars) {
    const timestamp = Date.parse(bar.timestamp);
    const key = `${bar.symbol}|${bar.timeframe}|${bar.timestamp}|${bar.source}`;

    if (!Number.isFinite(timestamp)) {
      issues.push({ code: 'INVALID_TIMESTAMP', message: `${bar.symbol}: timestamp is invalid.` });
      continue;
    }

    if (timestamp > now + MAX_CLOCK_SKEW_MS) {
      issues.push({ code: 'FUTURE_DATA', message: `${bar.symbol}: future-dated market data rejected.` });
    }

    if (timestamp < now - maxAgeMs && bar.marketStatus === 'OPEN') {
      issues.push({ code: 'STALE', message: `${bar.symbol}: market bar is stale.` });
    }

    if (timestamp < previousTimestamp) {
      issues.push({ code: 'OUT_OF_ORDER', message: `${bar.symbol}: bars are out of chronological order.` });
    }
    if (timestamp === previousTimestamp) {
      issues.push({ code: 'DUPLICATE', message: `${bar.symbol}: duplicate timestamp detected.` });
    }
    previousTimestamp = timestamp;

    if (seen.has(key)) {
      issues.push({ code: 'DUPLICATE', message: `${bar.symbol}: duplicate provider bar detected.` });
    }
    seen.add(key);

    const values = [bar.open, bar.high, bar.low, bar.close];
    if (!values.every(Number.isFinite) || bar.high < Math.max(bar.open, bar.close) || bar.low > Math.min(bar.open, bar.close) || bar.high < bar.low || bar.low < 0) {
      issues.push({ code: 'INVALID_OHLC', message: `${bar.symbol}: OHLC relationship is invalid.` });
    }

    if (bar.volume !== null && (!Number.isFinite(bar.volume) || bar.volume < 0)) {
      issues.push({ code: 'NEGATIVE_VOLUME', message: `${bar.symbol}: volume is invalid.` });
    }

    if (bar.bid !== null && bar.ask !== null) {
      const spread = bar.ask - bar.bid;
      if (!Number.isFinite(spread) || spread < 0 || (bar.spread !== null && Math.abs(bar.spread - spread) > Number.EPSILON)) {
        issues.push({ code: 'INVALID_SPREAD', message: `${bar.symbol}: bid/ask spread is invalid or inconsistent.` });
      }
    }

    if (!bar.symbol.trim()) issues.push({ code: 'INVALID_SYMBOL', message: 'Market symbol is empty.' });
  }

  return { valid: issues.length === 0, issues };
}
