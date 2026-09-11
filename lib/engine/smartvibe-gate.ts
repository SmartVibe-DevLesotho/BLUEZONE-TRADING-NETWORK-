import type { ConsensusSignal } from '@/lib/backend';
import type { EvidenceMatrix, SmartVibeEvidence, SmartVibeGateResult } from './evidence';
import { clampEvidenceScore } from './evidence';

export function buildEvidenceMatrix(signal: ConsensusSignal,evidence: SmartVibeEvidence[],coreMethodologyPass = true): EvidenceMatrix {
  const items=evidence.filter(item=>item.symbol===signal.symbol);
  return {
    symbol:signal.symbol,
    collectedAt:new Date().toISOString(),
    coreMethodologyPass,
    primary:items.filter(item=>item.role==='PRIMARY'),
    confirming:items.filter(item=>item.role==='CONFIRMING'),
    contextual:items.filter(item=>item.role==='CONTEXTUAL'),
    contradictory:items.filter(item=>item.role==='CONTRADICTORY'),
    insufficient:items.filter(item=>item.role==='INSUFFICIENT'),
  };
}

/** Supporting evidence can block a SmartVibe setup, but it can never create one. */
export function evaluateSmartVibeGate(signal: ConsensusSignal,evidence: SmartVibeEvidence[],coreMethodologyPass = true): SmartVibeGateResult {
  const matrix=buildEvidenceMatrix(signal,evidence,coreMethodologyPass);
  const items=[...matrix.primary,...matrix.confirming,...matrix.contextual,...matrix.contradictory,...matrix.insufficient];
  const missing=items.length===0;
  const contradictory=matrix.contradictory.length>0;
  const insufficient=matrix.insufficient.length>0;
  const riskBlocked=items.some(item=>item.riskStatus==='warning');
  const structuralBlocked=items.some(item=>item.structureAlignment==='warning'||item.volatility==='warning'||item.liquidity==='warning');
  const directionalStrength=items.reduce((s,item)=>s+clampEvidenceScore(item.bullCaseStrength)-clampEvidenceScore(item.bearCaseStrength),0);
  const approved=coreMethodologyPass&&!missing&&!contradictory&&!insufficient&&!riskBlocked&&!structuralBlocked&&Number.isFinite(directionalStrength);
  let reason='SmartVibe Primary Methodology remains the final authority; supporting evidence passed without a blocking contradiction.';
  if(!coreMethodologyPass)reason='Rejected: SmartVibe Primary Methodology did not pass.';
  else if(missing)reason='Rejected: supporting evidence is unavailable.';
  else if(insufficient)reason='Rejected: supporting evidence quality is insufficient.';
  else if(contradictory)reason='Rejected: contradictory structural evidence blocks the setup.';
  else if(riskBlocked)reason='Rejected: supporting risk evidence blocks the setup.';
  else if(structuralBlocked)reason='Rejected: structural evidence conflicts with the setup.';
  return {approved,reason,methodologyAuthority:'smartvibe-core',evidenceCount:items.length,matrix};
}
