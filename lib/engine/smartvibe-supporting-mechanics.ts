/**
 * SmartVibe Supporting Mechanics
 *
 * These mechanisms are subordinate evidence providers for the SmartVibe Primary
 * Methodology. They never create, approve, modify, or execute a trade by
 * themselves. They are deliberately provider-agnostic and use normalized OHLC.
 *
 * Design inspiration was reviewed from permissively licensed/open-source
 * technical-analysis projects, including TA-Lib and open-source SMC/chart
 * pattern implementations. No third-party source code is copied here.
 */

export type SmartVibeDirection = 'BUY' | 'SELL' | 'WAIT';
export type SmartVibeSession = 'ASIAN' | 'LONDON' | 'NEW_YORK' | 'SYDNEY';
export type SmartVibePhase = 'ACCUMULATION' | 'MANIPULATION' | 'DISTRIBUTION';

export type SmartVibeBar = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
};

export type SmartVibeSessionWindow = {
  session: SmartVibeSession;
  phase: SmartVibePhase;
  startHourSast: number;
  endHourSast: number;
};

/**
 * SmartVibe 4H session-cycle timing, expressed in SAST / UTC+2.
 * Windows intentionally overlap because each market session has its own
 * rolling 4-hour accumulation -> manipulation -> distribution cycle.
 */
export const SMARTVIBE_CRT_4H_WINDOWS: SmartVibeSessionWindow[] = [
  { session: 'ASIAN', phase: 'ACCUMULATION', startHourSast: 0, endHourSast: 4 },
  { session: 'ASIAN', phase: 'MANIPULATION', startHourSast: 4, endHourSast: 8 },
  { session: 'ASIAN', phase: 'DISTRIBUTION', startHourSast: 8, endHourSast: 12 },

  { session: 'LONDON', phase: 'ACCUMULATION', startHourSast: 4, endHourSast: 8 },
  { session: 'LONDON', phase: 'MANIPULATION', startHourSast: 8, endHourSast: 12 },
  { session: 'LONDON', phase: 'DISTRIBUTION', startHourSast: 12, endHourSast: 16 },

  { session: 'NEW_YORK', phase: 'ACCUMULATION', startHourSast: 8, endHourSast: 12 },
  { session: 'NEW_YORK', phase: 'MANIPULATION', startHourSast: 12, endHourSast: 16 },
  { session: 'NEW_YORK', phase: 'DISTRIBUTION', startHourSast: 16, endHourSast: 20 },

  { session: 'SYDNEY', phase: 'ACCUMULATION', startHourSast: 12, endHourSast: 16 },
  { session: 'SYDNEY', phase: 'MANIPULATION', startHourSast: 16, endHourSast: 20 },
  { session: 'SYDNEY', phase: 'DISTRIBUTION', startHourSast: 20, endHourSast: 24 },
];

/** Internal time-window confluence retained as a supporting mechanic only. */
export const SMARTVIBE_TIME_WINDOWS_714 = [
  { session: 'ASIAN' as const, startHourSast: 7, endHourSast: 8.25 },
  { session: 'LONDON' as const, startHourSast: 13, endHourSast: 14 },
  { session: 'NEW_YORK' as const, startHourSast: 16, endHourSast: 17 },
];

export type SmartVibeMechanicId =
  | 'market-structure'
  | 'liquidity'
  | 'range-location'
  | 'trend-transition'
  | 'volatility'
  | 'crt-session-cycle'
  | 'time-window-confluence'
  | 'order-block'
  | 'fair-value-gap'
  | 'premium-discount'
  | 'displacement'
  | 'support-resistance'
  | 'candlestick-price-action'
  | 'chart-patterns'
  | 'ema-alignment'
  | 'momentum'
  | 'volume-context'
  | 'news-risk'
  | 'session-context'
  | 'data-quality';

export const SMARTVIBE_SUPPORTING_MECHANICS: ReadonlyArray<{
  id: SmartVibeMechanicId;
  category: 'STRUCTURE' | 'LIQUIDITY' | 'TIMING' | 'PRICE_ACTION' | 'TECHNICAL' | 'RISK' | 'DATA';
  authority: 'SUPPORTING_ONLY';
}> = [
  { id: 'market-structure', category: 'STRUCTURE', authority: 'SUPPORTING_ONLY' },
  { id: 'liquidity', category: 'LIQUIDITY', authority: 'SUPPORTING_ONLY' },
  { id: 'range-location', category: 'STRUCTURE', authority: 'SUPPORTING_ONLY' },
  { id: 'trend-transition', category: 'STRUCTURE', authority: 'SUPPORTING_ONLY' },
  { id: 'volatility', category: 'TECHNICAL', authority: 'SUPPORTING_ONLY' },
  { id: 'crt-session-cycle', category: 'TIMING', authority: 'SUPPORTING_ONLY' },
  { id: 'time-window-confluence', category: 'TIMING', authority: 'SUPPORTING_ONLY' },
  { id: 'order-block', category: 'LIQUIDITY', authority: 'SUPPORTING_ONLY' },
  { id: 'fair-value-gap', category: 'LIQUIDITY', authority: 'SUPPORTING_ONLY' },
  { id: 'premium-discount', category: 'STRUCTURE', authority: 'SUPPORTING_ONLY' },
  { id: 'displacement', category: 'PRICE_ACTION', authority: 'SUPPORTING_ONLY' },
  { id: 'support-resistance', category: 'STRUCTURE', authority: 'SUPPORTING_ONLY' },
  { id: 'candlestick-price-action', category: 'PRICE_ACTION', authority: 'SUPPORTING_ONLY' },
  { id: 'chart-patterns', category: 'PRICE_ACTION', authority: 'SUPPORTING_ONLY' },
  { id: 'ema-alignment', category: 'TECHNICAL', authority: 'SUPPORTING_ONLY' },
  { id: 'momentum', category: 'TECHNICAL', authority: 'SUPPORTING_ONLY' },
  { id: 'volume-context', category: 'TECHNICAL', authority: 'SUPPORTING_ONLY' },
  { id: 'news-risk', category: 'RISK', authority: 'SUPPORTING_ONLY' },
  { id: 'session-context', category: 'TIMING', authority: 'SUPPORTING_ONLY' },
  { id: 'data-quality', category: 'DATA', authority: 'SUPPORTING_ONLY' },
];

export type SmartVibeCandlePattern =
  | 'BULLISH_ENGULFING'
  | 'BEARISH_ENGULFING'
  | 'HAMMER'
  | 'SHOOTING_STAR'
  | 'INVERTED_HAMMER'
  | 'HANGING_MAN'
  | 'PIERCING'
  | 'DARK_CLOUD_COVER'
  | 'MORNING_STAR'
  | 'EVENING_STAR'
  | 'THREE_WHITE_SOLDIERS'
  | 'THREE_BLACK_CROWS'
  | 'BULLISH_HARAMI'
  | 'BEARISH_HARAMI'
  | 'DOJI';

const body = (b: SmartVibeBar) => Math.abs(b.c - b.o);
const upper = (b: SmartVibeBar) => b.h - Math.max(b.o, b.c);
const lower = (b: SmartVibeBar) => Math.min(b.o, b.c) - b.l;
const bullish = (b: SmartVibeBar) => b.c > b.o;
const bearish = (b: SmartVibeBar) => b.c < b.o;
const near = (a: number, b: number, tolerance: number) => Math.abs(a - b) <= tolerance;

/** Deterministic price-action detector. It returns evidence, never a trade. */
export function detectSmartVibeCandlesticks(bars: SmartVibeBar[]): SmartVibeCandlePattern[] {
  if (bars.length < 3) return [];
  const i = bars.length - 1;
  const a = bars[i - 2], b = bars[i - 1], c = bars[i];
  const out: SmartVibeCandlePattern[] = [];
  const cBody = body(c) || Number.EPSILON;
  const range = Math.max(c.h - c.l, Number.EPSILON);

  if (near(c.o, c.c, range * 0.1)) out.push('DOJI');
  if (lower(c) >= cBody * 2 && upper(c) <= cBody * 0.75) {
    out.push(bullish(c) ? 'HAMMER' : 'HANGING_MAN');
  }
  if (upper(c) >= cBody * 2 && lower(c) <= cBody * 0.75) {
    out.push(bullish(c) ? 'INVERTED_HAMMER' : 'SHOOTING_STAR');
  }

  if (bullish(c) && bearish(b) && c.o <= b.c && c.c >= b.o) out.push('BULLISH_ENGULFING');
  if (bearish(c) && bullish(b) && c.o >= b.c && c.c <= b.o) out.push('BEARISH_ENGULFING');

  const aBody = body(a), bBody = body(b);
  if (bearish(b) && bullish(c) && c.o < b.c && c.c > (b.o + b.c) / 2 && c.c < b.o) out.push('PIERCING');
  if (bullish(b) && bearish(c) && c.o > b.c && c.c < (b.o + b.c) / 2 && c.c > b.o) out.push('DARK_CLOUD_COVER');
  if (bearish(a) && aBody > bBody * 1.2 && body(b) < aBody * 0.55 && bullish(c) && c.c > (a.o + a.c) / 2) out.push('MORNING_STAR');
  if (bullish(a) && aBody > bBody * 1.2 && body(b) < aBody * 0.55 && bearish(c) && c.c < (a.o + a.c) / 2) out.push('EVENING_STAR');

  if (bars.length >= 3) {
    const x = bars[i - 2], y = bars[i - 1], z = bars[i];
    if (bullish(x) && bullish(y) && bullish(z) && y.c > x.c && z.c > y.c) out.push('THREE_WHITE_SOLDIERS');
    if (bearish(x) && bearish(y) && bearish(z) && y.c < x.c && z.c < y.c) out.push('THREE_BLACK_CROWS');
  }

  if (bearish(b) && bullish(c) && c.o > b.c && c.c < b.o) {
    out.push('BULLISH_HARAMI');
  }
  if (bullish(b) && bearish(c) && c.o < b.c && c.c > b.o) {
    out.push('BEARISH_HARAMI');
  }
  return [...new Set(out)];
}

export type SmartVibeChartPattern =
  | 'DOUBLE_TOP'
  | 'DOUBLE_BOTTOM'
  | 'HEAD_AND_SHOULDERS'
  | 'INVERSE_HEAD_AND_SHOULDERS'
  | 'ASCENDING_TRIANGLE'
  | 'DESCENDING_TRIANGLE'
  | 'SYMMETRICAL_TRIANGLE'
  | 'RISING_WEDGE'
  | 'FALLING_WEDGE'
  | 'BULL_FLAG'
  | 'BEAR_FLAG'
  | 'BULL_PENNANT'
  | 'BEAR_PENNANT'
  | 'CHANNEL_UP'
  | 'CHANNEL_DOWN';

/**
 * Lightweight structural chart-pattern primitives. Full pattern confirmation
 * should be combined with structure/liquidity evidence before SmartVibe acts.
 */
export function detectSmartVibeChartPatterns(bars: SmartVibeBar[]): SmartVibeChartPattern[] {
  if (bars.length < 12) return [];
  const highs = bars.map(b => b.h), lows = bars.map(b => b.l);
  const out: SmartVibeChartPattern[] = [];
  const tolerance = (Math.max(...highs) - Math.min(...lows)) * 0.015;
  const last = bars.length - 1;
  const left = bars.slice(Math.max(0, last - 10), last - 4);
  const right = bars.slice(last - 3, last + 1);
  if (left.length >= 3 && right.length >= 3) {
    const lh = Math.max(...left.map(b => b.h)), rh = Math.max(...right.map(b => b.h));
    const ll = Math.min(...left.map(b => b.l)), rl = Math.min(...right.map(b => b.l));
    if (near(lh, rh, tolerance) && rl < ll) out.push('DOUBLE_TOP');
    if (near(ll, rl, tolerance) && rh > lh) out.push('DOUBLE_BOTTOM');
  }

  const mid = bars.slice(-12, -4), tail = bars.slice(-4);
  if (mid.length >= 6 && tail.length >= 3) {
    const midHigh = Math.max(...mid.map(b => b.h)), midLow = Math.min(...mid.map(b => b.l));
    const tailHigh = Math.max(...tail.map(b => b.h)), tailLow = Math.min(...tail.map(b => b.l));
    const highRange = Math.max(...mid.map(b => b.h)) - Math.min(...mid.map(b => b.h));
    const lowRange = Math.max(...mid.map(b => b.l)) - Math.min(...mid.map(b => b.l));
    if (highRange < tolerance * 2 && tailHigh > midHigh) out.push('ASCENDING_TRIANGLE');
    if (lowRange < tolerance * 2 && tailLow < midLow) out.push('DESCENDING_TRIANGLE');
  }

  return [...new Set(out)];
}

export function smartVibeSessionPhase(hourSast: number): SmartVibeSessionWindow[] {
  const h = ((hourSast % 24) + 24) % 24;
  return SMARTVIBE_CRT_4H_WINDOWS.filter(w => h >= w.startHourSast && h < w.endHourSast);
}

export function smartVibeIsTimeWindow(hourSast: number): boolean {
  const h = ((hourSast % 24) + 24) % 24;
  return SMARTVIBE_TIME_WINDOWS_714.some(w => h >= w.startHourSast && h < w.endHourSast);
}

/**
 * Normalize the mechanic result into a subordinate evidence statement.
 * A caller must still pass this through the SmartVibe Primary Methodology gate.
 */
export function buildSmartVibeMechanicEvidence(params: {
  symbol: string;
  bars: SmartVibeBar[];
  hourSast: number;
}): {
  symbol: string;
  authority: 'SUPPORTING_ONLY';
  sessionPhases: SmartVibeSessionWindow[];
  inTimeWindow: boolean;
  candlesticks: SmartVibeCandlePattern[];
  chartPatterns: SmartVibeChartPattern[];
} {
  return {
    symbol: params.symbol,
    authority: 'SUPPORTING_ONLY',
    sessionPhases: smartVibeSessionPhase(params.hourSast),
    inTimeWindow: smartVibeIsTimeWindow(params.hourSast),
    candlesticks: detectSmartVibeCandlesticks(params.bars),
    chartPatterns: detectSmartVibeChartPatterns(params.bars),
  };
}
