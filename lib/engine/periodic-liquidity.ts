/** Provider-neutral periodic liquidity evidence. Supporting mechanism only. */
import type { MarketBar } from './market-structure';

export type PeriodicLiquidityPeriod = 'PREVIOUS_MONTH'|'PREVIOUS_WEEK'|'PREVIOUS_DAY'|'CURRENT_SESSION'|'CURRENT_RANGE';
export type PeriodicLiquidityEvent = 'NONE'|'HIGH_SWEEP'|'LOW_SWEEP'|'REJECTION'|'ACCEPTANCE'|'UNCONFIRMED';

export type PeriodicLiquidityLevel = {
  period: PeriodicLiquidityPeriod;
  high: number|null;
  low: number|null;
  open: number|null;
  event: PeriodicLiquidityEvent;
  referenceTimestamp: number|null;
};

export type PeriodicLiquidityEvidence = {
  timezone: string;
  levels: PeriodicLiquidityLevel[];
  hasTradeCommand: false;
};

function bounds(bars: MarketBar[]): { high:number; low:number; open:number }|null {
  if (!bars.length) return null;
  return { high:Math.max(...bars.map(x=>x.h)), low:Math.min(...bars.map(x=>x.l)), open:bars[0].o };
}

function eventFor(current: MarketBar|undefined, reference: {high:number;low:number}|null): PeriodicLiquidityEvent {
  if (!current || !reference) return 'UNCONFIRMED';
  if (current.h > reference.high && current.c < reference.high) return 'HIGH_SWEEP';
  if (current.l < reference.low && current.c > reference.low) return 'LOW_SWEEP';
  if (current.c > reference.high || current.c < reference.low) return 'ACCEPTANCE';
  return 'NONE';
}

/**
 * Builds periodic liquidity context from already-normalized bars.
 * The caller supplies period buckets; this function never authorizes execution.
 */
export function analyzePeriodicLiquidity(input: {
  previousMonth?: MarketBar[];
  previousWeek?: MarketBar[];
  previousDay?: MarketBar[];
  currentSession?: MarketBar[];
  currentRange?: MarketBar[];
  current?: MarketBar;
  timezone?: string;
}): PeriodicLiquidityEvidence {
  const current=input.current ?? input.currentSession?.at(-1) ?? input.currentRange?.at(-1);
  const make=(period:PeriodicLiquidityPeriod,bars?:MarketBar[]):PeriodicLiquidityLevel=>{
    const b=bounds(bars??[]);
    return {period,high:b?.high??null,low:b?.low??null,open:b?.open??null,event:eventFor(current,b),referenceTimestamp:bars?.[0]?.t??null};
  };
  return {
    timezone: input.timezone ?? 'UTC',
    levels:[make('PREVIOUS_MONTH',input.previousMonth),make('PREVIOUS_WEEK',input.previousWeek),make('PREVIOUS_DAY',input.previousDay),make('CURRENT_SESSION',input.currentSession),make('CURRENT_RANGE',input.currentRange)],
    hasTradeCommand:false,
  };
}
