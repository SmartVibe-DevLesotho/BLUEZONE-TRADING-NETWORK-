import type { Evidence, SmartVibeGateResult, SmartVibeSetup } from '../adapters/types';

/**
 * The only place where external evidence becomes an execution recommendation.
 * This function deliberately never changes the methodology direction.
 */
export function evaluateSmartVibeGate(
  setup: SmartVibeSetup,
  evidence: Evidence[],
): SmartVibeGateResult {
  const hardFailures = evidence.filter((item) => item.status === 'FAIL');
  const cautions = evidence.filter((item) => item.status === 'NEUTRAL');

  const externalValidation = hardFailures.length > 0
    ? 'REJECTED'
    : cautions.length > 0
      ? 'CAUTION'
      : 'CONFIRMED';

  return {
    signalId: setup.signalId,
    methodologyDecision: setup.direction,
    externalValidation,
    evidence,
    executionAllowed: hardFailures.length === 0,
    reason: hardFailures.length > 0
      ? 'External validation identified an execution risk. SmartVibe methodology direction remains unchanged.'
      : cautions.length > 0
        ? 'SmartVibe setup remains valid; external evidence requires caution before execution.'
        : 'External evidence supports the SmartVibe setup.',
  };
}
