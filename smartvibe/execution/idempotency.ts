import type { BrokerOrder } from './broker';

export type IdempotencyCheck = {
  duplicate: boolean;
  existingOrder?: BrokerOrder;
};

/** Finds an existing broker order using the stable client-side execution intent ID. */
export function findExistingClientOrder(
  orders: BrokerOrder[],
  clientOrderId: string,
): IdempotencyCheck {
  const existingOrder = orders.find((order) => order.clientOrderId === clientOrderId);
  return existingOrder ? { duplicate: true, existingOrder } : { duplicate: false };
}
