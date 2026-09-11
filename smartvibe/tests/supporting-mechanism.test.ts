import { analyzeSupportingMechanism } from '../intelligence/supporting-mechanism';
import type { MarketBar } from '../intelligence/market-data';

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

function bars(symbol: string): MarketBar[] {
  const start = Date.parse('2025-01-01T00:00:00.000Z');
  return Array.from({ length: 50 }, (_, index) => {
    const base = 100 + index * 0.5;
    return {
      symbol,
      timestamp: new Date(start + index * 86_400_000).toISOString(),
      timezone: 'UTC',
      timeframe: 'D1',
      open: base,
      high: base + 1,
      low: base - 1,
      close: base + 0.5,
      volume: 1000,
      bid: base + 0.49,
      ask: base + 0.51,
      spread: 0.02,
      source: 'test-fixture',
      marketStatus: 'OPEN',
    };
  });
}

for (const symbol of ['EURUSD', 'BTCUSD', 'XAUUSD']) {
  const result = analyzeSupportingMechanism({ daily: bars(symbol), h4: bars(symbol), h1: bars(symbol), execution: bars(symbol), direction: 'BUY', entry: 125, now: new Date('2025-02-25T00:00:00.000Z') });
  assert(result.dataQuality === 'HIGH', `${symbol}: expected high-quality fixture data.`);
  assert(result.supportingBias === 'BUY', `${symbol}: supporting mechanism must remain instrument-agnostic.`);
  assert(result.rangePositionPercent !== null, `${symbol}: range position must be calculated.`);
  assert(result.structuralInvalidationPrice !== null, `${symbol}: structural invalidation must be calculated.`);
}

const insufficient = analyzeSupportingMechanism({ daily: bars('EURUSD').slice(0, 10), direction: 'BUY', entry: 105 });
assert(insufficient.dataQuality === 'INSUFFICIENT', 'Insufficient history must not fabricate structural evidence.');
assert(insufficient.supportingBias === 'UNCONFIRMED', 'Insufficient history must not create a trade bias.');

console.log('SmartVibe supporting-mechanism tests: PASS');
