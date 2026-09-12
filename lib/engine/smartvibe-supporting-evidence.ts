import type { ConsensusSignal } from '@/lib/backend';
import type { SmartVibeEvidence } from './evidence';
import { evaluateSmartVibeGate, type SmartVibeGateResult } from './smartvibe-gate';
import { buildSmartVibeMechanicEvidence, type SmartVibeBar } from './smartvibe-supporting-mechanics';
import { buildSmartVibeRobotMechanicEvidence } from './smartvibe-robot-mechanics';

/**
 * Single integration point for robot-derived mechanics.
 * They are converted into supporting evidence and then passed through the
 * existing SmartVibe firewall. They can block a setup but cannot create one.
 */
export function evaluateSmartVibeWithSupportingMechanics(params: {
  signal: ConsensusSignal;
  bars: SmartVibeBar[];
  hourSast: number;
  coreMethodologyPass: boolean;
  balance?: number;
  riskPercent?: number;
  entry?: number;
  stop?: number;
  target?: number;
  direction?: 'BUY' | 'SELL';
  sessionAllowed?: boolean;
  spreadDistance?: number;
  maxSpreadDistance?: number;
  dailyLossPercent?: number;
  maxDailyLossPercent?: number;
  openPositions?: number;
  maxOpenPositions?: number;
}): SmartVibeGateResult {
  const base = buildSmartVibeMechanicEvidence({
    symbol: params.signal.symbol,
    bars: params.bars,
    hourSast: params.hourSast,
  });
  const robot = buildSmartVibeRobotMechanicEvidence({
    bars: params.bars,
    balance: params.balance,
    riskPercent: params.riskPercent,
    entry: params.entry,
    stop: params.stop,
    target: params.target,
    direction: params.direction,
    sessionAllowed: params.sessionAllowed,
    spreadDistance: params.spreadDistance,
    maxSpreadDistance: params.maxSpreadDistance,
    dailyLossPercent: params.dailyLossPercent,
    maxDailyLossPercent: params.maxDailyLossPercent,
    openPositions: params.openPositions,
    maxOpenPositions: params.maxOpenPositions,
  });

  const riskBlocked = !robot.risk.valid || !robot.guardrails.dailyLossLimit || !robot.guardrails.maxOpenPositions || !robot.guardrails.spreadLimit || !robot.sessionAllowed;
  const dataBlocked = !Number.isFinite(robot.volatility.atr) || !Number.isFinite(robot.trend.emaFast) || !Number.isFinite(robot.trend.emaSlow);
  const role: SmartVibeEvidence['role'] = riskBlocked ? 'CONTRADICTORY' : dataBlocked ? 'INSUFFICIENT' : 'CONTEXTUAL';
  const direction = robot.trend.direction;

  const supporting: SmartVibeEvidence = {
    source: 'smartvibe-supporting-mechanics',
    generatedAt: new Date().toISOString(),
    symbol: params.signal.symbol,
    role,
    structureAlignment: direction === 'WAIT' ? 'neutral' : direction === params.direction ? 'confirmed' : 'warning',
    liquidity: base.candlesticks.length || base.chartPatterns.length ? 'confirmed' : 'neutral',
    volatility: robot.volatility.regime === 'EXTREME' ? 'warning' : robot.volatility.regime === 'UNKNOWN' ? 'unknown' : 'confirmed',
    macroRisk: 'neutral',
    sentiment: 'neutral',
    bullCaseStrength: direction === 'BUY' ? 0.5 : 0,
    bearCaseStrength: direction === 'SELL' ? 0.5 : 0,
    riskStatus: riskBlocked ? 'warning' : 'confirmed',
    historicalSimilarity: 'unknown',
    notes: [
      'Robot-derived mechanics are supporting evidence only.',
      `Trend evidence: ${direction}.`,
      `Volatility regime: ${robot.volatility.regime}.`,
      `Session cycle matches: ${base.sessionPhases.length}.`,
      `Price-action patterns: ${base.candlesticks.length + base.chartPatterns.length}.`,
      ...robot.risk.reasons,
    ],
    provenance: 'Open-source robot engineering patterns reduced to provider-neutral SmartVibe supporting mechanics.',
  };

  return evaluateSmartVibeGate(params.signal, [supporting], params.coreMethodologyPass);
}
