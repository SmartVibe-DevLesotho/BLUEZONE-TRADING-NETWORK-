/**
 * Non-leveraged/spot accumulation planning is deliberately separate from
 * leveraged trade authorization. This module never creates an execution intent.
 */
export type AccumulationPlan = {
  mode: 'ACCUMULATION_PLAN';
  levels: Array<{ price: number; allocationPercent: number }>;
  spacingPercent: number;
  maximumCapitalAllocationPercent: number;
  invalidationPrice: number | null;
  volatilityAdjusted: boolean;
  requiresSmartVibeAuthorization: true;
};

export function createAccumulationPlan(input: {
  lowerPrice: number;
  upperPrice: number;
  levels?: number;
  maximumCapitalAllocationPercent?: number;
  volatilityFactor?: number;
  invalidationPrice?: number | null;
}): AccumulationPlan {
  const levels = Math.max(2, Math.min(20, Math.floor(input.levels ?? 5)));
  if (!Number.isFinite(input.lowerPrice) || !Number.isFinite(input.upperPrice) || input.upperPrice <= input.lowerPrice) {
    throw new Error('Accumulation range is invalid.');
  }
  const allocation = Math.max(0, Math.min(100, input.maximumCapitalAllocationPercent ?? 100));
  const volatilityFactor = Math.max(0.25, Math.min(2, input.volatilityFactor ?? 1));
  const width = input.upperPrice - input.lowerPrice;
  const spacing = width / (levels - 1);
  const equalAllocation = allocation / levels;

  return {
    mode: 'ACCUMULATION_PLAN',
    levels: Array.from({ length: levels }, (_, index) => ({
      price: input.lowerPrice + spacing * index,
      allocationPercent: equalAllocation,
    })),
    spacingPercent: (spacing / input.lowerPrice) * 100 * volatilityFactor,
    maximumCapitalAllocationPercent: allocation,
    invalidationPrice: input.invalidationPrice ?? null,
    volatilityAdjusted: volatilityFactor !== 1,
    requiresSmartVibeAuthorization: true,
  };
}
