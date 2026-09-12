/**
 * SmartVibe Robot-Derived Supporting Mechanics
 *
 * Engineering patterns reviewed from open-source MT5/EA projects are reduced
 * to provider-neutral evidence/risk calculations. These functions NEVER place,
 * approve, reject, modify, or execute orders. SmartVibe Primary Methodology
 * remains the sole trade authority.
 */

import type { SmartVibeBar, SmartVibeDirection } from './smartvibe-supporting-mechanics';

export type SmartVibeRiskAssessment = {
  valid: boolean;
  riskPercent: number;
  riskAmount: number;
  stopDistance: number;
  rewardDistance: number;
  rewardRisk: number;
  reasons: string[];
};

export type SmartVibeTrendAssessment = {
  direction: SmartVibeDirection;
  emaFast: number;
  emaSlow: number;
  momentum: number;
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
};

export type SmartVibeVolatilityAssessment = {
  atr: number;
  averageRange: number;
  regime: 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREME' | 'UNKNOWN';
};

export type SmartVibeRobotMechanicEvidence = {
  authority: 'SUPPORTING_ONLY';
  risk: SmartVibeRiskAssessment;
  trend: SmartVibeTrendAssessment;
  volatility: SmartVibeVolatilityAssessment;
  spreadDistance?: number;
  sessionAllowed: boolean;
  guardrails: {
    dailyLossLimit: boolean;
    maxOpenPositions: boolean;
    spreadLimit: boolean;
  };
};

const finitePositive = (n: number) => Number.isFinite(n) && n > 0;

export function smartVibeEma(values: number[], period: number): number {
  if (!values.length || period <= 0) return Number.NaN;
  const alpha = 2 / (period + 1);
  let ema = values[0];
  for (let i = 1; i < values.length; i += 1) ema = values[i] * alpha + ema * (1 - alpha);
  return ema;
}

export function smartVibeAtr(bars: SmartVibeBar[], period = 14): number {
  if (bars.length < 2 || period <= 0) return Number.NaN;
  const trs: number[] = [];
  for (let i = 1; i < bars.length; i += 1) {
    const b = bars[i];
    const prev = bars[i - 1];
    trs.push(Math.max(b.h - b.l, Math.abs(b.h - prev.c), Math.abs(b.l - prev.c)));
  }
  const window = trs.slice(-period);
  return window.length ? window.reduce((a, b) => a + b, 0) / window.length : Number.NaN;
}

export function assessSmartVibeTrend(bars: SmartVibeBar[], fastPeriod = 14, slowPeriod = 50): SmartVibeTrendAssessment {
  const closes = bars.map(b => b.c);
  const fast = smartVibeEma(closes, fastPeriod);
  const slow = smartVibeEma(closes, slowPeriod);
  const recent = closes.slice(-Math.min(5, closes.length));
  const momentum = recent.length > 1 ? recent[recent.length - 1] - recent[0] : 0;
  const scale = Math.max(Math.abs(slow), Number.EPSILON);
  const normalized = Math.abs((fast - slow) / scale);
  const strength: SmartVibeTrendAssessment['strength'] = normalized > 0.01 ? 'STRONG' : normalized > 0.003 ? 'MODERATE' : 'WEAK';
  const direction: SmartVibeDirection = fast > slow && momentum > 0 ? 'BUY' : fast < slow && momentum < 0 ? 'SELL' : 'WAIT';
  return { direction, emaFast: fast, emaSlow: slow, momentum, strength };
}

export function assessSmartVibeVolatility(bars: SmartVibeBar[], period = 14): SmartVibeVolatilityAssessment {
  const atr = smartVibeAtr(bars, period);
  if (!finitePositive(atr)) return { atr: Number.NaN, averageRange: Number.NaN, regime: 'UNKNOWN' };
  const ranges = bars.slice(-Math.max(period * 2, period)).map(b => b.h - b.l).filter(finitePositive);
  const averageRange = ranges.length ? ranges.reduce((a, b) => a + b, 0) / ranges.length : Number.NaN;
  if (!finitePositive(averageRange)) return { atr, averageRange, regime: 'UNKNOWN' };
  const ratio = atr / averageRange;
  const regime = ratio > 2 ? 'EXTREME' : ratio > 1.35 ? 'HIGH' : ratio < 0.65 ? 'LOW' : 'NORMAL';
  return { atr, averageRange, regime };
}

export function assessSmartVibeRisk(params: {
  balance: number;
  riskPercent: number;
  entry: number;
  stop: number;
  target: number;
  direction: Exclude<SmartVibeDirection, 'WAIT'>;
  maxRiskPercent?: number;
  minimumRewardRisk?: number;
}): SmartVibeRiskAssessment {
  const maxRiskPercent = params.maxRiskPercent ?? 1;
  const minimumRewardRisk = params.minimumRewardRisk ?? 1.5;
  const stopDistance = Math.abs(params.entry - params.stop);
  const rewardDistance = Math.abs(params.target - params.entry);
  const rewardRisk = stopDistance > 0 ? rewardDistance / stopDistance : 0;
  const riskAmount = params.balance * Math.max(0, params.riskPercent) / 100;
  const reasons: string[] = [];
  if (!finitePositive(params.balance)) reasons.push('Invalid account balance.');
  if (!finitePositive(stopDistance)) reasons.push('Invalid stop distance.');
  if (params.riskPercent <= 0 || params.riskPercent > maxRiskPercent) reasons.push('Risk percentage exceeds the supporting risk guardrail.');
  if (rewardRisk < minimumRewardRisk) reasons.push('Reward-to-risk is below the supporting minimum.');
  if (params.direction === 'BUY' && !(params.stop < params.entry && params.target > params.entry)) reasons.push('BUY geometry is inconsistent.');
  if (params.direction === 'SELL' && !(params.stop > params.entry && params.target < params.entry)) reasons.push('SELL geometry is inconsistent.');
  return { valid: reasons.length === 0, riskPercent: params.riskPercent, riskAmount, stopDistance, rewardDistance, rewardRisk, reasons };
}

export function buildSmartVibeRobotMechanicEvidence(params: {
  bars: SmartVibeBar[];
  balance?: number;
  riskPercent?: number;
  entry?: number;
  stop?: number;
  target?: number;
  direction?: Exclude<SmartVibeDirection, 'WAIT'>;
  sessionAllowed?: boolean;
  spreadDistance?: number;
  maxSpreadDistance?: number;
  dailyLossPercent?: number;
  maxDailyLossPercent?: number;
  openPositions?: number;
  maxOpenPositions?: number;
}): SmartVibeRobotMechanicEvidence {
  const balance = params.balance ?? 0;
  const direction = params.direction ?? 'BUY';
  const entry = params.entry ?? 1;
  const stop = params.stop ?? entry;
  const target = params.target ?? entry;
  const risk = assessSmartVibeRisk({ balance, riskPercent: params.riskPercent ?? 0, entry, stop, target, direction });
  const spreadOk = params.spreadDistance === undefined || params.spreadDistance <= (params.maxSpreadDistance ?? Number.POSITIVE_INFINITY);
  const dailyLossOk = params.dailyLossPercent === undefined || params.dailyLossPercent < (params.maxDailyLossPercent ?? 3);
  const positionsOk = params.openPositions === undefined || params.openPositions < (params.maxOpenPositions ?? 3);
  return {
    authority: 'SUPPORTING_ONLY',
    risk,
    trend: assessSmartVibeTrend(params.bars),
    volatility: assessSmartVibeVolatility(params.bars),
    spreadDistance: params.spreadDistance,
    sessionAllowed: params.sessionAllowed ?? true,
    guardrails: { dailyLossLimit: dailyLossOk, maxOpenPositions: positionsOk, spreadLimit: spreadOk },
  };
}
