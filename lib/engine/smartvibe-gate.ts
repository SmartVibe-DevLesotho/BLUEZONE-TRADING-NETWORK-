import type { ConsensusSignal } from '@/lib/backend';
import type { EvidenceMatrix, SmartVibeEvidence, SmartVibeGateResult } from './evidence';
import { clampEvidenceScore } from './evidence';

/**
 * The final authority remains SmartVibe Core. External evidence can strengthen
 * or invalidate a setup, but it cannot create a setup that Core did not create.
 */
export function buildEvidenceMatrix(
  signal: ConsensusSignal,
  evidence: SmartVibeEvidence[],
  coreMethodologyPass = true,
): EvidenceMatrix {
  const forSymbol = evidence.filter((item) => item.symbol === signal.symbol);
  const riskCase = forSymbol.filter((item) => item.riskStatus === 'warning');
  const bullCase = forSymbol.filter((item) => item.bullCaseStrength >= item.bearCaseStrength);
  const bearCase = forSymbol.filter((item) => item.bearCaseStrength > item.bullCaseStrength);

  return {
    symbol: signal.symbol,
    collectedAt: new Date().toISOString(),
    coreMethodologyPass,
    structurePass: forSymbol.every((item) => item.structureAlignment !== 'warning'),
    liquidityPass: forSymbol.every((item) => item.liquidity !== 'warning'),
    volatilityPass: forSymbol.every((item) => item.volatility !== 'warning'),
    macroPass: forSymbol.every((item) => item.macroRisk !== 'warning'),
    sentimentPass: forSymbol.every((item) => item.sentiment !== 'warning'),
    bullCase,
    bearCase,
    riskCase,
    historicalCase: forSymbol.filter((item) => item.historicalSimilarity === 'confirmed'),
  };
}

export function evaluateSmartVibeGate(
  signal: ConsensusSignal,
  evidence: SmartVibeEvidence[],
  coreMethodologyPass = true,
): SmartVibeGateResult {
  const matrix = buildEvidenceMatrix(signal, evidence, coreMethodologyPass);
  const riskBlocked = matrix.riskCase.length > 0;
  const structuralEvidenceBlocked = !matrix.structurePass || !matrix.liquidityPass || !matrix.volatilityPass;
  const approved = coreMethodologyPass && !riskBlocked && !structuralEvidenceBlocked;

  const averageBull = evidence.length
    ? evidence.reduce((sum, item) => sum + clampEvidenceScore(item.bullCaseStrength), 0) / evidence.length
    : 0;
  const averageBear = evidence.length
    ? evidence.reduce((sum, item) => sum + clampEvidenceScore(item.bearCaseStrength), 0) / evidence.length
    : 0;

  let reason = 'SmartVibe Core setup accepted by the authority gate.';
  if (!coreMethodologyPass) reason = 'Rejected: SmartVibe Core methodology did not pass.';
  else if (riskBlocked) reason = 'Rejected: external risk evidence contains a blocking warning.';
  else if (structuralEvidenceBlocked) reason = 'Rejected: supporting evidence conflicts with required market conditions.';
  else if (averageBear > averageBull) reason = 'Rejected: bear-case evidence outweighs bull-case evidence.';

  return {
    approved: approved && averageBear <= averageBull,
    reason,
    methodologyAuthority: 'smartvibe-core',
    evidenceCount: evidence.length,
    matrix,
  };
}
