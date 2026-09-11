import type { Evidence, SmartVibeFinalDecision, SmartVibeGateResult, SmartVibeSetup } from '../adapters/types';

const FINAL_DECISIONS = new Set<SmartVibeFinalDecision>([
  'NO SETUP', 'WATCH', 'FORMING', 'VALIDATED', 'APPROVED', 'REJECTED', 'EXPIRED', 'EXECUTED', 'CLOSED', 'WAIT',
]);

function readFinalDecision(setup: SmartVibeSetup): SmartVibeFinalDecision {
  const snapshot = setup.methodologySnapshot ?? {};
  const candidate = snapshot.finalDecision ?? snapshot.decision;
  return typeof candidate === 'string' && FINAL_DECISIONS.has(candidate as SmartVibeFinalDecision)
    ? candidate as SmartVibeFinalDecision
    : 'WAIT';
}

function hasAuthoritySnapshot(setup: SmartVibeSetup): boolean {
  const snapshot = setup.methodologySnapshot ?? {};
  return snapshot.methodologyAuthority === 'smartvibe-core'
    && snapshot.independentAuthorization !== true
    && snapshot.canonicalMethodology === 'SmartVibe Trading Network';
}

/**
 * Supporting evidence is descriptive. Only an explicit SmartVibe APPROVED
 * methodology decision can authorize the downstream risk/execution stages.
 */
export function evaluateSmartVibeGate(
  setup: SmartVibeSetup,
  evidence: Evidence[],
): SmartVibeGateResult {
  const finalDecision = readFinalDecision(setup);
  const hardFailures = evidence.filter((item) => item.status === 'FAIL');
  const contradictions = evidence.filter((item) => item.role === 'CONTRADICTORY' || item.metrics?.contradiction === true);
  const cautions = evidence.filter((item) => item.status === 'NEUTRAL');
  const authorityValid = hasAuthoritySnapshot(setup);
  const methodologyApproved = finalDecision === 'APPROVED';
  const externalValidation = hardFailures.length > 0 || contradictions.length > 0
    ? 'REJECTED'
    : cautions.length > 0
      ? 'CAUTION'
      : 'CONFIRMED';
  const executionAllowed = authorityValid && methodologyApproved && hardFailures.length === 0 && contradictions.length === 0;

  let reason = 'SmartVibe final methodology decision is required before execution.';
  if (!authorityValid) reason = 'SmartVibe authority snapshot is missing or invalid.';
  else if (!methodologyApproved) reason = `SmartVibe final decision is ${finalDecision}; only APPROVED may continue to Risk.`;
  else if (hardFailures.length > 0) reason = 'Supporting evidence contains a hard failure.';
  else if (contradictions.length > 0) reason = 'Supporting evidence contains a blocking contradiction.';
  else if (cautions.length > 0) reason = 'SmartVibe is APPROVED; supporting evidence contains cautionary conditions.';
  else reason = 'SmartVibe APPROVED and supporting evidence passed the authority gate.';

  return {
    signalId: setup.signalId,
    methodologyDecision: setup.direction,
    finalDecision,
    externalValidation,
    evidence,
    executionAllowed,
    reason,
  };
}
