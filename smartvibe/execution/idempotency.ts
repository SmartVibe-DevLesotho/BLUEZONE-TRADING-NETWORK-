import type { BrokerOrder } from './broker';

export type IdempotencyCheck = {
  duplicate: boolean;
  existingOrder?: BrokerOrder;
};

/** Prevents a second submission for the same SmartVibe client order identifier. */
export function findExistingClientOrder(
  orders: BrokerOrder[],
  clientOrderId: string,
): IdempotencyCheck {
  const existingOrder = orders.find((order) => order.id === clientOrderId);
  return existingOrder ? { duplicate: true, existingOrder } : { duplicate: false };
}
