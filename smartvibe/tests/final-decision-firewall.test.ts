import { evaluatePrimaryMethodology } from '../core/primary-methodology';
import { evaluateSmartVibeGate } from '../decision/gate';
import type { Evidence, SmartVibeSetup } from '../adapters/types';

const assertEqual = (actual: unknown, expected: unknown, message: string) => {
  if (actual !== expected) throw new Error(message);
};

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

const primary = evaluatePrimaryMethodology({
  symbol: 'EURUSD', session: 'LONDON', close: 1.105, ema200: 1.1, ema750: 1.09,
  trendUp: true, trendDown: false, engulfingBuy: true, engulfingSell: false,
  rangeBreakoutBuy: false, rangeBreakoutSell: false,
});
assertEqual(primary.finalDecision, 'APPROVED', 'SmartVibe Primary Methodology must approve a complete primary setup.');
assertEqual(primary.direction, 'BUY', 'Primary methodology must own the directional decision.');

const incompletePrimary = evaluatePrimaryMethodology({
  symbol: 'EURUSD', session: 'LONDON', close: 1.105, ema200: 1.1, ema750: 1.09,
  trendUp: true, trendDown: false, engulfingBuy: false, engulfingSell: false,
  rangeBreakoutBuy: false, rangeBreakoutSell: false,
});
assertEqual(incompletePrimary.finalDecision, 'NO SETUP', 'Supporting evidence must not manufacture a primary setup.');

assertEqual(evaluateSmartVibeGate(setup('REJECTED'), [evidence()]).executionAllowed, false, 'Supporting BUY bias cannot override SmartVibe REJECTED.');
assertEqual(evaluateSmartVibeGate(setup('WAIT', 'SELL'), [evidence()]).executionAllowed, false, 'Supporting SELL bias cannot override SmartVibe WAIT.');
assertEqual(evaluateSmartVibeGate(setup('APPROVED'), [evidence({ role: 'CONTRADICTORY', metrics: { contradiction: true } })]).executionAllowed, false, 'A blocking contradiction must prevent execution.');
assertEqual(evaluateSmartVibeGate(setup('APPROVED', 'BUY', { methodologyAuthority: 'invalid' }), [evidence()]).executionAllowed, false, 'Missing SmartVibe authority must prevent execution.');
assertEqual(evaluateSmartVibeGate(setup('APPROVED'), [evidence()]).executionAllowed, true, 'Only explicit SmartVibe APPROVED may reach Risk.');
assertEqual(evaluateSmartVibeGate(setup('APPROVED'), [evidence({ status: 'FAIL' })]).executionAllowed, false, 'A supporting hard failure must prevent execution.');

console.log('SmartVibe final-decision firewall tests: PASS');
