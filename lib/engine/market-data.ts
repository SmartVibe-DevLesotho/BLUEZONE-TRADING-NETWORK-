/**
 * Provider-neutral SmartVibe market-data contract.
 * Provider SDK shapes must be normalized here before entering analysis.
 */
export type MarketType = 'FOREX' | 'CRYPTO' | 'INDICES' | 'COMMODITIES' | 'METALS' | 'EQUITIES' | 'ETF' | 'FUTURES' | 'OTHER';

export type MarketStatus = 'OPEN' | 'CLOSED' | 'PRE_OPEN' | 'POST_MARKET' | 'HALTED' | 'UNKNOWN';
export type DataQuality = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';

export type NormalizedMarketBar = {
  symbol: string;
  marketType: MarketType;
  timestamp: string;
  timezone: 'UTC';
  timeframe: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  bid?: number;
  ask?: number;
  spread?: number;
  source: string;
  marketStatus: MarketStatus;
};

export type MarketDataIntegrity = {
  quality: DataQuality;
  timestampsValid: boolean;
  timezoneValid: boolean;
  timeframeValid: boolean;
  ohlcValid: boolean;
  missingCandles: number;
  duplicateCandles: number;
  outOfOrderCandles: number;
  stale: boolean;
  bidAskConsistent: boolean;
  spreadValid: boolean;
  symbolConsistent: boolean;
  providerConflict: boolean;
  lookAheadDetected: boolean;
  issues: string[];
};

const finite = (value: number | undefined): boolean => value === undefined || Number.isFinite(value);

export function validateMarketData(
  bars: readonly NormalizedMarketBar[],
  now = Date.now(),
  maxAgeMs = 5 * 60_000,
): MarketDataIntegrity {
  const issues: string[] = [];
  let duplicateCandles = 0;
  let outOfOrderCandles = 0;
  let stale = false;
  let ohlcValid = true;
  let timestampsValid = true;
  let bidAskConsistent = true;
  let spreadValid = true;
  let symbolConsistent = true;
  let timeframeValid = true;

  const seen = new Set<string>();
  const first = bars[0];
  for (let i = 0; i < bars.length; i += 1) {
    const bar = bars[i];
    const time = Date.parse(bar.timestamp);
    if (!Number.isFinite(time) || bar.timezone !== 'UTC') {
      timestampsValid = false;
      issues.push(`Invalid UTC timestamp at index ${i}.`);
    }
    if (!bar.timeframe) {
      timeframeValid = false;
      issues.push(`Missing timeframe at index ${i}.`);
    }
    if (bar.high < Math.max(bar.open, bar.close) || bar.low > Math.min(bar.open, bar.close) || bar.low > bar.high) {
      ohlcValid = false;
      issues.push(`Invalid OHLC at index ${i}.`);
    }
    if (![bar.open, bar.high, bar.low, bar.close].every(Number.isFinite) || !finite(bar.volume) || !finite(bar.bid) || !finite(bar.ask) || !finite(bar.spread)) {
      ohlcValid = false;
      issues.push(`Non-finite market value at index ${i}.`);
    }
    const key = `${bar.symbol}:${bar.timeframe}:${bar.timestamp}`;
    if (seen.has(key)) duplicateCandles += 1;
    seen.add(key);
    if (i > 0 && Date.parse(bar.timestamp) <= Date.parse(bars[i - 1].timestamp)) outOfOrderCandles += 1;
    if (bar.bid !== undefined && bar.ask !== undefined && bar.ask < bar.bid) bidAskConsistent = false;
    if (bar.spread !== undefined && bar.spread < 0) spreadValid = false;
    if (first && bar.symbol !== first.symbol) symbolConsistent = false;
  }

  if (bars.length > 0) {
    const latest = Date.parse(bars[bars.length - 1].timestamp);
    stale = !Number.isFinite(latest) || now - latest > maxAgeMs;
  }

  if (duplicateCandles) issues.push('Duplicate candles detected.');
  if (outOfOrderCandles) issues.push('Out-of-order candles detected.');
  if (stale) issues.push('Market data is stale.');
  if (!bidAskConsistent) issues.push('Bid/ask inconsistency detected.');
  if (!spreadValid) issues.push('Invalid spread detected.');
  if (!symbolConsistent) issues.push('Mixed symbols detected.');

  const lookAheadDetected = bars.some((bar) => {
    const t = Date.parse(bar.timestamp);
    return Number.isFinite(t) && t > now + 30_000;
  });
  if (lookAheadDetected) issues.push('Future-dated market data detected.');

  const quality: DataQuality = bars.length === 0 || !timestampsValid || !ohlcValid || lookAheadDetected
    ? 'INSUFFICIENT'
    : issues.length === 0
      ? 'HIGH'
      : stale || duplicateCandles > 0 || outOfOrderCandles > 0 || !bidAskConsistent
        ? 'LOW'
        : 'MEDIUM';

  return {
    quality,
    timestampsValid,
    timezoneValid: bars.every((bar) => bar.timezone === 'UTC'),
    timeframeValid,
    ohlcValid,
    missingCandles: 0,
    duplicateCandles,
    outOfOrderCandles,
    stale,
    bidAskConsistent,
    spreadValid,
    symbolConsistent,
    providerConflict: false,
    lookAheadDetected,
    issues,
  };
}
