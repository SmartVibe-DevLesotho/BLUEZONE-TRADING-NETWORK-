export type PrimaryMethodologyInput = {
  symbol: string;
  session: string;
  close: number;
  ema200: number;
  ema750: number;
  trendUp: boolean;
  trendDown: boolean;
  engulfingBuy: boolean;
  engulfingSell: boolean;
  rangeBreakoutBuy: boolean;
  rangeBreakoutSell: boolean;
};

export type PrimaryMethodologyResult = {
  direction: 'BUY' | 'SELL' | null;
  finalDecision: 'APPROVED' | 'WATCH' | 'NO SETUP';
  score: number;
  reason: string;
};

/**
 * SmartVibe Primary Methodology is the sole directional authority.
 * Supporting mechanisms are intentionally not accepted as inputs here.
 */
export function evaluatePrimaryMethodology(input: PrimaryMethodologyInput): PrimaryMethodologyResult {
  const bullish = input.close > input.ema200 && input.close > input.ema750 && input.trendUp;
  const bearish = input.close < input.ema200 && input.close < input.ema750 && input.trendDown;
  const buyConfirmed = input.engulfingBuy || input.rangeBreakoutBuy;
  const sellConfirmed = input.engulfingSell || input.rangeBreakoutSell;
  const inSession = input.session !== 'OFF_SESSION';

  if (bullish && buyConfirmed && inSession) {
    return { direction: 'BUY', finalDecision: 'APPROVED', score: 78, reason: 'SmartVibe Primary Methodology bullish conditions passed.' };
  }
  if (bearish && sellConfirmed && inSession) {
    return { direction: 'SELL', finalDecision: 'APPROVED', score: 78, reason: 'SmartVibe Primary Methodology bearish conditions passed.' };
  }
  if ((bullish && buyConfirmed) || (bearish && sellConfirmed)) {
    return { direction: null, finalDecision: 'WATCH', score: 62, reason: 'Directional conditions exist but the active SmartVibe session gate is not satisfied.' };
  }
  return { direction: null, finalDecision: 'NO SETUP', score: 0, reason: 'SmartVibe Primary Methodology conditions are not complete.' };
}
