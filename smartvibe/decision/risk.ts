import type { SmartVibeSetup } from '../adapters/types';
import type { BrokerAccount, BrokerPosition } from '../execution/broker';

export type RiskPolicy = {
  maxRiskPercent: number;
  maxOpenPositions: number;
  maxDailyLossPercent: number;
  maxSpread: number;
  emergencyStop: boolean;
};

export type RiskCheckResult = {
  allowed: boolean;
  reasons: string[];
};

/** Hard execution safety checks. This layer may block execution, never alter direction. */
export function validateExecutionRisk(
  setup: SmartVibeSetup,
  account: BrokerAccount,
  positions: BrokerPosition[],
  spread: number,
  policy: RiskPolicy,
  dailyLossPercent = 0,
): RiskCheckResult {
  const reasons: string[] = [];

  if (policy.emergencyStop) reasons.push('Global emergency kill switch is active.');
  if (account.equity <= 0 || account.marginAvailable <= 0) reasons.push('Account has no available equity/margin for execution.');
  if (positions.length >= policy.maxOpenPositions) reasons.push('Maximum open-position limit reached.');
  if (dailyLossPercent >= policy.maxDailyLossPercent) reasons.push('Daily loss limit reached.');
  if (!Number.isFinite(spread) || spread < 0 || spread > policy.maxSpread) reasons.push('Spread exceeds the configured execution limit.');
  if (!Number.isFinite(setup.entry) || setup.entry <= 0) reasons.push('Setup entry price is invalid.');
  if (setup.sl !== null && (!Number.isFinite(setup.sl) || setup.sl <= 0)) reasons.push('Setup stop-loss price is invalid.');

  return { allowed: reasons.length === 0, reasons };
}
