import assert from 'node:assert/strict';
import { evaluateSmartVibeGate } from '../decision/gate';
import type { Evidence, SmartVibeSetup } from '../adapters/types';

const evidence = (overrides: Partial<Evidence> = {}): Evidence => ({
  source: 'universal-supporting-mechanism',
  status: 'PASS',
  role: 'CONFIRMING',
  summary: 'Supporting evidence only.',
  observedAt: new Date().toISOString(),
  ...overrides,
});

const setup = (finalDecision: string, direction: 'BUY' | 'SELL' = 'BUY', overrides: Record<string, unknown> = {}): SmartVibeSetup => ({
  signalId: 'test-signal-001', symbol: 'EURUSD', direction, entry: 1.1, sl: 1.09, tp: 1.12,
  methodologyVersion: 'SMARTVIBE-CORE-1.4.0',
  methodologySnapshot: {
    finalDecision,
    methodologyAuthority: 'smartvibe-core',
    independentAuthorization: false,
    canonicalMethodology: 'SmartVibe Trading Network',
    ...overrides,
  },
});

{
  const result = evaluateSmartVibeGate(setup('REJECTED'), [evidence()]);
  assert.equal(result.executionAllowed, false, 'Supporting BUY bias cannot override SmartVibe REJECTED.');
}

{
  const result = evaluateSmartVibeGate(setup('WAIT', 'SELL'), [evidence()]);
  assert.equal(result.executionAllowed, false, 'Supporting SELL bias cannot override SmartVibe WAIT.');
}

{
  const result = evaluateSmartVibeGate(setup('APPROVED'), [evidence({ role: 'CONTRADICTORY', metrics: { contradiction: true } })]);
  assert.equal(result.executionAllowed, false, 'A blocking contradiction must prevent execution.');
}

{
  const result = evaluateSmartVibeGate(setup('APPROVED', 'BUY', { methodologyAuthority: 'invalid' }), [evidence()]);
  assert.equal(result.executionAllowed, false, 'Missing SmartVibe authority must prevent execution.');
}

{
  const result = evaluateSmartVibeGate(setup('APPROVED'), [evidence()]);
  assert.equal(result.executionAllowed, true, 'Only explicit SmartVibe APPROVED may reach Risk.');
}

{
  const result = evaluateSmartVibeGate(setup('APPROVED'), [evidence({ status: 'FAIL' })]);
  assert.equal(result.executionAllowed, false, 'A supporting hard failure must prevent execution.');
}

console.log('SmartVibe final-decision firewall tests: PASS');
