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

const timeframeMs = (timeframe: string): number | null => {
  const match = timeframe.trim().toUpperCase().match(/^(\d+)\s*([SMHDW])$/);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2];
  const multiplier = unit === 'S' ? 1_000 : unit === 'M' ? 60_000 : unit === 'H' ? 3_600_000 : unit === 'D' ? 86_400_000 : 604_800_000;
  return Number.isFinite(amount) && amount > 0 ? amount * multiplier : null;
};

const barFingerprint = (bar: NormalizedMarketBar): string => JSON.stringify([
  bar.open,
  bar.high,
  bar.low,
  bar.close,
  bar.volume ?? null,
  bar.bid ?? null,
  bar.ask ?? null,
  bar.spread ?? null,
]);

export function validateMarketData(
  bars: readonly NormalizedMarketBar[],
  now = Date.now(),
  maxAgeMs = 5 * 60_000,
): MarketDataIntegrity {
  const issues: string[] = [];
  let duplicateCandles = 0;
  let outOfOrderCandles = 0;
  let missingCandles = 0;
  let stale = false;
  let ohlcValid = true;
  let timestampsValid = true;
  let bidAskConsistent = true;
  let spreadValid = true;
  let symbolConsistent = true;
  let timeframeValid = true;
  let providerConflict = false;

  const seen = new Set<string>();
  const sourceSnapshots = new Map<string, string>();
  const first = bars[0];
  const expectedStep = first ? timeframeMs(first.timeframe) : null;

  for (let i = 0; i < bars.length; i += 1) {
    const bar = bars[i];
    const time = Date.parse(bar.timestamp);
    if (!Number.isFinite(time) || bar.timezone !== 'UTC') {
      timestampsValid = false;
      issues.push(`Invalid UTC timestamp at index ${i}.`);
    }
    if (!bar.timeframe || timeframeMs(bar.timeframe) === null) {
      timeframeValid = false;
      issues.push(`Invalid timeframe at index ${i}.`);
    }
    if (!bar.symbol || !bar.source) issues.push(`Missing symbol or source at index ${i}.`);
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

    if (i > 0) {
      const previousTime = Date.parse(bars[i - 1].timestamp);
      if (Number.isFinite(time) && Number.isFinite(previousTime) && time <= previousTime) outOfOrderCandles += 1;
      if (expectedStep && Number.isFinite(time) && Number.isFinite(previousTime) && time > previousTime + expectedStep) {
        missingCandles += Math.max(0, Math.round((time - previousTime) / expectedStep) - 1);
      }
    }

    if (bar.bid !== undefined && bar.ask !== undefined && (bar.ask < bar.bid || bar.bid < 0 || bar.ask < 0)) bidAskConsistent = false;
    if (bar.spread !== undefined && (bar.spread < 0 || (bar.bid !== undefined && bar.ask !== undefined && Math.abs((bar.ask - bar.bid) - bar.spread) > Math.max(Math.abs(bar.spread) * 0.01, 1e-12)))) spreadValid = false;
    if (first && bar.symbol !== first.symbol) symbolConsistent = false;

    const snapshotKey = `${bar.symbol}:${bar.timeframe}:${bar.timestamp}`;
    const fingerprint = barFingerprint(bar);
    const prior = sourceSnapshots.get(snapshotKey);
    if (prior && prior !== fingerprint) providerConflict = true;
    sourceSnapshots.set(snapshotKey, fingerprint);
  }

  if (bars.length > 0) {
    const latest = Date.parse(bars[bars.length - 1].timestamp);
    stale = !Number.isFinite(latest) || now - latest > maxAgeMs;
  }

  if (duplicateCandles) issues.push('Duplicate candles detected.');
  if (outOfOrderCandles) issues.push('Out-of-order candles detected.');
  if (missingCandles) issues.push(`${missingCandles} missing candle interval(s) detected.`);
  if (stale) issues.push('Market data is stale.');
  if (!bidAskConsistent) issues.push('Bid/ask inconsistency detected.');
  if (!spreadValid) issues.push('Invalid spread detected.');
  if (!symbolConsistent) issues.push('Mixed symbols detected.');
  if (providerConflict) issues.push('Conflicting provider snapshots detected.');

  const lookAheadDetected = bars.some((bar) => {
    const t = Date.parse(bar.timestamp);
    return Number.isFinite(t) && t > now + 30_000;
  });
  if (lookAheadDetected) issues.push('Future-dated market data detected.');

  const quality: DataQuality = bars.length === 0 || !timestampsValid || !ohlcValid || !timeframeValid || lookAheadDetected
    ? 'INSUFFICIENT'
    : issues.length === 0
      ? 'HIGH'
      : stale || missingCandles > 0 || duplicateCandles > 0 || outOfOrderCandles > 0 || !bidAskConsistent || providerConflict
        ? 'LOW'
        : 'MEDIUM';

  return {
    quality,
    timestampsValid,
    timezoneValid: bars.every((bar) => bar.timezone === 'UTC'),
    timeframeValid,
    ohlcValid,
    missingCandles,
    duplicateCandles,
    outOfOrderCandles,
    stale,
    bidAskConsistent,
    spreadValid,
    symbolConsistent,
    providerConflict,
    lookAheadDetected,
    issues,
  };
}
