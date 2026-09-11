import type { MarketBar } from './market-data';

export type StructuralRegime =
  | 'BULLISH_TREND'
  | 'BEARISH_TREND'
  | 'RANGE'
  | 'ACCUMULATION'
  | 'DISTRIBUTION'
  | 'CORRECTION'
  | 'TRANSITION'
  | 'HIGH_VOLATILITY'
  | 'LOW_VOLATILITY'
  | 'UNCERTAIN'
  | 'INSUFFICIENT_DATA';

export type StructureState = 'BULLISH' | 'BEARISH' | 'RANGE' | 'TRANSITION' | 'UNCERTAIN' | 'INSUFFICIENT_DATA';
export type RangeLocation = 'LOWER_EXTREME' | 'LOWER_QUARTILE' | 'MID_RANGE' | 'UPPER_QUARTILE' | 'UPPER_EXTREME' | 'UNDEFINED';
export type LiquidityEvent =
  | 'NONE'
  | 'PREVIOUS_HIGH_SWEEP'
  | 'PREVIOUS_LOW_SWEEP'
  | 'PREVIOUS_WEEK_HIGH_SWEEP'
  | 'PREVIOUS_WEEK_LOW_SWEEP'
  | 'PREVIOUS_MONTH_HIGH_SWEEP'
  | 'PREVIOUS_MONTH_LOW_SWEEP'
  | 'EQUAL_HIGH_SWEEP'
  | 'EQUAL_LOW_SWEEP'
  | 'ACCEPTANCE'
  | 'REJECTION'
  | 'FAILED_SWEEP'
  | 'UNCONFIRMED';
export type LiquidityResponse = 'NONE' | 'REJECTION' | 'ACCEPTANCE' | 'FAILED_SWEEP' | 'CONFIRMED_STRUCTURAL_REVERSAL' | 'UNCONFIRMED';
export type TrendTransition = 'EARLY_TRANSITION' | 'POSSIBLE_TREND_FLIP' | 'CONFIRMED_TREND_FLIP' | 'FAILED_TREND_FLIP' | 'NO_STRUCTURAL_CHANGE' | 'UNCERTAIN';
export type InvalidationStatus = 'VALID' | 'WEAK' | 'TOO_WIDE' | 'TOO_CLOSE' | 'UNCERTAIN';

export type StructuralEvidence = {
  macroRegime: StructuralRegime;
  htfStructure: StructureState;
  intermediateStructure: StructureState;
  executionStructure: StructureState;
  rangeState: 'EXPANSION' | 'CONTRACTION' | 'STABLE' | 'INVALIDATED' | 'UNDEFINED';
  rangeHigh: number | null;
  rangeLow: number | null;
  rangeMidpoint: number | null;
  rangePositionPercent: number | null;
  rangeLocation: RangeLocation;
  liquidityEvent: LiquidityEvent;
  liquidityResponse: LiquidityResponse;
  periodicLevels: {
    previousDayHigh: number | null;
    previousDayLow: number | null;
    previousWeekHigh: number | null;
    previousWeekLow: number | null;
    previousMonthHigh: number | null;
    previousMonthLow: number | null;
  };
  trendTransition: TrendTransition;
  correctionProbability: number;
  stageProbability: number;
  possibleCorrectionStage: 'NONE' | 'EARLY_CORRECTION' | 'RELIEF_MOVE' | 'DEEPER_CORRECTION' | 'CAPITULATION' | 'LATE_CORRECTION' | 'POST_CORRECTION_TRANSITION';
  volatilityState: 'EXPANDING' | 'CONTRACTING' | 'NORMAL' | 'ABNORMAL' | 'UNKNOWN';
  atr: number | null;
  structuralInvalidationPrice: number | null;
  invalidationStatus: InvalidationStatus;
  rangeRegimeProbability: number;
  trendProbability: number;
  compressionProbability: number;
  expansionProbability: number;
  supportingBias: 'BUY' | 'SELL' | 'NEUTRAL' | 'UNCONFIRMED';
  supportingConfidence: number;
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
  contradiction: boolean;
  requiresConfirmation: boolean;
};

export type SupportingMechanismInput = {
  monthly?: MarketBar[];
  weekly?: MarketBar[];
  daily?: MarketBar[];
  h4?: MarketBar[];
  h1?: MarketBar[];
  execution?: MarketBar[];
  direction?: 'BUY' | 'SELL';
  entry?: number;
  now?: Date;
};

const clamp = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const sorted = (bars: MarketBar[]) => [...bars].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

function trueRange(bars: MarketBar[]): number[] {
  return bars.slice(1).map((bar, index) => {
    const previous = bars[index];
    return Math.max(bar.high - bar.low, Math.abs(bar.high - previous.close), Math.abs(bar.low - previous.close));
  });
}

function averageTrueRange(bars: MarketBar[], period = 14): number | null {
  if (bars.length < period + 1) return null;
  const values = trueRange(bars).slice(-period);
  return mean(values);
}

function structure(bars: MarketBar[]): StructureState {
  if (bars.length < 12) return 'INSUFFICIENT_DATA';
  const recent = bars.slice(-6);
  const prior = bars.slice(-12, -6);
  const recentHigh = Math.max(...recent.map((bar) => bar.high));
  const recentLow = Math.min(...recent.map((bar) => bar.low));
  const priorHigh = Math.max(...prior.map((bar) => bar.high));
  const priorLow = Math.min(...prior.map((bar) => bar.low));
  const highChange = recentHigh - priorHigh;
  const lowChange = recentLow - priorLow;
  const tolerance = Math.max(Math.abs(priorHigh) * 0.0001, 1e-12);
  if (highChange > tolerance && lowChange > tolerance) return 'BULLISH';
  if (highChange < -tolerance && lowChange < -tolerance) return 'BEARISH';
  if (Math.abs(highChange) <= tolerance && Math.abs(lowChange) <= tolerance) return 'RANGE';
  return 'TRANSITION';
}

function periodHighLow(bars: MarketBar[]): { high: number | null; low: number | null } {
  if (!bars.length) return { high: null, low: null };
  return { high: Math.max(...bars.map((bar) => bar.high)), low: Math.min(...bars.map((bar) => bar.low)) };
}

function previousPeriodLevels(bars: MarketBar[], periodMs: number): { high: number | null; low: number | null } {
  if (bars.length < 2) return { high: null, low: null };
  const ordered = sorted(bars);
  const lastTime = Date.parse(ordered[ordered.length - 1].timestamp);
  const currentBucket = Math.floor(lastTime / periodMs);
  const previous = ordered.filter((bar) => Math.floor(Date.parse(bar.timestamp) / periodMs) === currentBucket - 1);
  return periodHighLow(previous);
}

function rangeStats(bars: MarketBar[]) {
  if (!bars.length) return null;
  const high = Math.max(...bars.map((bar) => bar.high));
  const low = Math.min(...bars.map((bar) => bar.low));
  if (!(high > low)) return null;
  const close = bars[bars.length - 1].close;
  const position = clamp((close - low) / (high - low));
  return { high, low, midpoint: (high + low) / 2, position, width: high - low };
}

function liquidity(bars: MarketBar[], periodic: StructuralEvidence['periodicLevels']): { event: LiquidityEvent; response: LiquidityResponse } {
  if (bars.length < 20) return { event: 'UNCONFIRMED', response: 'UNCONFIRMED' };
  const last = bars[bars.length - 1];
  const previous = bars.slice(-21, -1);
  const localHigh = Math.max(...previous.map((bar) => bar.high));
  const localLow = Math.min(...previous.map((bar) => bar.low));
  const check = (high: number | null, low: number | null, highEvent: LiquidityEvent, lowEvent: LiquidityEvent) => {
    if (high !== null && last.high > high && last.close < high) return { event: highEvent, response: 'REJECTION' as LiquidityResponse };
    if (low !== null && last.low < low && last.close > low) return { event: lowEvent, response: 'REJECTION' as LiquidityResponse };
    return null;
  };
  return check(periodic.previousMonthHigh, periodic.previousMonthLow, 'PREVIOUS_MONTH_HIGH_SWEEP', 'PREVIOUS_MONTH_LOW_SWEEP')
    ?? check(periodic.previousWeekHigh, periodic.previousWeekLow, 'PREVIOUS_WEEK_HIGH_SWEEP', 'PREVIOUS_WEEK_LOW_SWEEP')
    ?? check(periodic.previousDayHigh, periodic.previousDayLow, 'PREVIOUS_HIGH_SWEEP', 'PREVIOUS_LOW_SWEEP')
    ?? check(localHigh, localLow, 'PREVIOUS_HIGH_SWEEP', 'PREVIOUS_LOW_SWEEP')
    ?? (last.high > localHigh ? { event: 'ACCEPTANCE', response: 'ACCEPTANCE' } : last.low < localLow ? { event: 'ACCEPTANCE', response: 'ACCEPTANCE' } : { event: 'NONE', response: 'NONE' });
}

function transition(bars: MarketBar[]): TrendTransition {
  if (bars.length < 24) return 'UNCERTAIN';
  const recent = structure(bars.slice(-12));
  const prior = structure(bars.slice(-24, -12));
  if (recent === prior || recent === 'RANGE') return 'NO_STRUCTURAL_CHANGE';
  if ((prior === 'BEARISH' && recent === 'BULLISH') || (prior === 'BULLISH' && recent === 'BEARISH')) {
    const last = bars[bars.length - 1];
    const reference = bars.slice(-13, -1);
    const breakConfirmed = recent === 'BULLISH'
      ? last.close > Math.max(...reference.map((bar) => bar.high))
      : last.close < Math.min(...reference.map((bar) => bar.low));
    return breakConfirmed ? 'CONFIRMED_TREND_FLIP' : 'POSSIBLE_TREND_FLIP';
  }
  return 'EARLY_TRANSITION';
}

function correctionContext(bars: MarketBar[], regime: StructuralRegime, tr: TrendTransition, volatilityState: StructuralEvidence['volatilityState']) {
  if (bars.length < 30) return { probability: 0, stageProbability: 0, stage: 'NONE' as const };
  const atr = averageTrueRange(bars);
  const recent = bars.slice(-8);
  const prior = bars.slice(-24, -8);
  const impulse = prior.length ? Math.abs(prior[prior.length - 1].close - prior[0].close) : 0;
  const recentMove = recent.length ? Math.abs(recent[recent.length - 1].close - recent[0].close) : 0;
  const ratio = impulse > 0 ? recentMove / impulse : 0;
  const probability = clamp((regime === 'CORRECTION' ? 0.55 : 0.12) + (tr === 'POSSIBLE_TREND_FLIP' ? 0.18 : 0) + (volatilityState === 'CONTRACTING' ? 0.1 : 0));
  let stage: StructuralEvidence['possibleCorrectionStage'] = 'NONE';
  if (probability >= 0.55) {
    if (atr && recentMove > atr * 3) stage = 'SHOCK / IMPULSE' as never;
    else if (ratio > 0.7) stage = 'DEEPER_CORRECTION';
    else if (ratio < 0.25) stage = 'RELIEF_MOVE';
    else stage = 'LATE_CORRECTION';
  }
  return { probability, stageProbability: clamp(probability * (ratio > 0 ? 0.7 + Math.min(ratio, 1) * 0.3 : 0.5)), stage };
}

function classifyRange(position: number | null): RangeLocation {
  if (position === null) return 'UNDEFINED';
  if (position <= 0.1) return 'LOWER_EXTREME';
  if (position <= 0.25) return 'LOWER_QUARTILE';
  if (position < 0.75) return 'MID_RANGE';
  if (position < 0.9) return 'UPPER_QUARTILE';
  return 'UPPER_EXTREME';
}

function dataQuality(bars: MarketBar[], now: Date): StructuralEvidence['dataQuality'] {
  if (bars.length < 30) return 'INSUFFICIENT';
  let bad = 0;
  const recent = sorted(bars).slice(-30);
  for (let i = 0; i < recent.length; i += 1) {
    const bar = recent[i];
    const timestamp = Date.parse(bar.timestamp);
    if (!Number.isFinite(timestamp) || timestamp > now.getTime() + 300_000) bad += 1;
    if (![bar.open, bar.high, bar.low, bar.close].every(Number.isFinite) || bar.high < Math.max(bar.open, bar.close) || bar.low > Math.min(bar.open, bar.close) || bar.high < bar.low) bad += 1;
    if (i > 0 && timestamp <= Date.parse(recent[i - 1].timestamp)) bad += 1;
  }
  if (bad > 2) return 'LOW';
  if (bad) return 'MEDIUM';
  return 'HIGH';
}

export function analyzeSupportingMechanism(input: SupportingMechanismInput): StructuralEvidence {
  const now = input.now ?? new Date();
  const monthly = sorted(input.monthly ?? []);
  const weekly = sorted(input.weekly ?? []);
  const daily = sorted(input.daily ?? []);
  const h4 = sorted(input.h4 ?? []);
  const h1 = sorted(input.h1 ?? []);
  const execution = sorted(input.execution ?? []);
  const source = daily.length ? daily : h4.length ? h4 : h1.length ? h1 : execution;
  const insufficient: StructuralEvidence = {
    macroRegime: 'INSUFFICIENT_DATA', htfStructure: 'INSUFFICIENT_DATA', intermediateStructure: 'INSUFFICIENT_DATA', executionStructure: 'INSUFFICIENT_DATA',
    rangeState: 'UNDEFINED', rangeHigh: null, rangeLow: null, rangeMidpoint: null, rangePositionPercent: null, rangeLocation: 'UNDEFINED',
    liquidityEvent: 'UNCONFIRMED', liquidityResponse: 'UNCONFIRMED',
    periodicLevels: { previousDayHigh: null, previousDayLow: null, previousWeekHigh: null, previousWeekLow: null, previousMonthHigh: null, previousMonthLow: null },
    trendTransition: 'UNCERTAIN', correctionProbability: 0, stageProbability: 0, possibleCorrectionStage: 'NONE', volatilityState: 'UNKNOWN', atr: null,
    structuralInvalidationPrice: null, invalidationStatus: 'UNCERTAIN', rangeRegimeProbability: 0, trendProbability: 0, compressionProbability: 0, expansionProbability: 0,
    supportingBias: 'UNCONFIRMED', supportingConfidence: 0, dataQuality: 'INSUFFICIENT', contradiction: true, requiresConfirmation: true,
  };
  if (source.length < 30) return insufficient;

  const range = rangeStats(source.slice(-30));
  if (!range) return insufficient;
  const htf = structure(weekly.length ? weekly : daily);
  const intermediate = structure(daily.length ? daily : h4);
  const exec = structure(execution.length ? execution : h1.length ? h1 : source);
  const atr = averageTrueRange(source);
  const recentAtr = averageTrueRange(source.slice(-15));
  const volatilityState: StructuralEvidence['volatilityState'] = atr && recentAtr
    ? recentAtr > atr * 1.5 ? 'ABNORMAL' : recentAtr > atr * 1.15 ? 'EXPANDING' : recentAtr < atr * 0.8 ? 'CONTRACTING' : 'NORMAL'
    : 'UNKNOWN';
  const rangeState = atr && recentAtr ? recentAtr > atr * 1.25 ? 'EXPANSION' : recentAtr < atr * 0.75 ? 'CONTRACTION' : 'STABLE' : 'UNDEFINED';
  const periodicLevels = {
    previousDayHigh: previousPeriodLevels(daily, 86_400_000).high,
    previousDayLow: previousPeriodLevels(daily, 86_400_000).low,
    previousWeekHigh: previousPeriodLevels(weekly, 604_800_000).high,
    previousWeekLow: previousPeriodLevels(weekly, 604_800_000).low,
    previousMonthHigh: previousPeriodLevels(monthly, 2_592_000_000).high,
    previousMonthLow: previousPeriodLevels(monthly, 2_592_000_000).low,
  };
  const liquidityResult = liquidity(source, periodicLevels);
  const trendTransition = transition(daily.length ? daily : source);
  const trendProbability = clamp((htf === 'BULLISH' || htf === 'BEARISH' ? 0.35 : 0) + (intermediate === 'BULLISH' || intermediate === 'BEARISH' ? 0.3 : 0) + (exec === 'BULLISH' || exec === 'BEARISH' ? 0.2 : 0) + (trendTransition === 'CONFIRMED_TREND_FLIP' ? 0.15 : 0));
  const macroRegime: StructuralRegime = htf === 'BULLISH' ? 'BULLISH_TREND' : htf === 'BEARISH' ? 'BEARISH_TREND' : intermediate === 'BULLISH' ? 'BULLISH_TREND' : intermediate === 'BEARISH' ? 'BEARISH_TREND' : rangeState === 'CONTRACTION' ? 'CORRECTION' : 'RANGE';
  const rangeRegimeProbability = clamp(1 - trendProbability);
  const compressionProbability = rangeState === 'CONTRACTION' ? 0.8 : rangeState === 'STABLE' ? 0.35 : 0.1;
  const expansionProbability = rangeState === 'EXPANSION' ? 0.8 : rangeState === 'STABLE' ? 0.3 : 0.1;
  const correction = correctionContext(source, macroRegime, trendTransition, volatilityState);
  const invalidation = input.direction && input.entry
    ? input.direction === 'BUY' ? Math.min(...source.slice(-12).map((bar) => bar.low)) : Math.max(...source.slice(-12).map((bar) => bar.high))
    : null;
  const distance = invalidation !== null && input.entry ? Math.abs(input.entry - invalidation) : null;
  const invalidationStatus: InvalidationStatus = distance === null || !atr ? 'UNCERTAIN' : distance < atr * 0.35 ? 'TOO_CLOSE' : distance > atr * 4 ? 'TOO_WIDE' : 'VALID';
  const aligned = input.direction === 'BUY'
    ? macroRegime === 'BULLISH_TREND' || intermediate === 'BULLISH' || htf === 'BULLISH'
    : input.direction === 'SELL'
      ? macroRegime === 'BEARISH_TREND' || intermediate === 'BEARISH' || htf === 'BEARISH'
      : false;
  const contradiction = input.direction === 'BUY'
    ? htf === 'BEARISH' && intermediate === 'BEARISH'
    : input.direction === 'SELL'
      ? htf === 'BULLISH' && intermediate === 'BULLISH'
      : false;
  const rangeLocation = classifyRange(range.position);
  const supportingBias = contradiction ? 'UNCONFIRMED' : aligned ? input.direction ?? 'NEUTRAL' : 'NEUTRAL';
  const quality = dataQuality(source, now);
  const confidence = clamp((quality === 'HIGH' ? 0.35 : quality === 'MEDIUM' ? 0.2 : 0) + trendProbability * 0.35 + (liquidityResult.response === 'REJECTION' ? 0.15 : 0) + (aligned ? 0.15 : 0));
  return {
    macroRegime, htfStructure: htf, intermediateStructure: intermediate, executionStructure: exec, rangeState,
    rangeHigh: range.high, rangeLow: range.low, rangeMidpoint: range.midpoint, rangePositionPercent: Math.round(range.position * 10000) / 100,
    rangeLocation, liquidityEvent: liquidityResult.event, liquidityResponse: liquidityResult.response, periodicLevels, trendTransition,
    correctionProbability: correction.probability, stageProbability: correction.stageProbability, possibleCorrectionStage: correction.stage,
    volatilityState, atr, structuralInvalidationPrice: invalidation, invalidationStatus, rangeRegimeProbability, trendProbability,
    compressionProbability, expansionProbability, supportingBias, supportingConfidence: confidence, dataQuality: quality,
    contradiction, requiresConfirmation: quality !== 'HIGH' || contradiction || liquidityResult.response === 'UNCONFIRMED' || invalidationStatus !== 'VALID',
  };
}
