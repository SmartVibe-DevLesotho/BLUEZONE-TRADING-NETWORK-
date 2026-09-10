export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP';
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED';

export type BrokerAccount = {
  id: string;
  currency: string;
  balance: number;
  equity: number;
  marginUsed: number;
  marginAvailable: number;
  leverage: number;
  broker: string;
};

export type BrokerPosition = {
  id: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  averagePrice: number;
  unrealizedPnl: number;
  stopLoss: number | null;
  takeProfit: number | null;
};

export type BrokerOrder = {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price: number | null;
  status: OrderStatus;
  filledQuantity: number;
  submittedAt: string;
};

export type BrokerQuote = {
  symbol: string;
  bid: number;
  ask: number;
  timestamp: string;
};

export type PlaceOrderRequest = {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  clientOrderId: string;
};

export type ExecutionEvent = {
  orderId: string;
  status: OrderStatus;
  filledQuantity: number;
  fillPrice: number | null;
  timestamp: string;
  message?: string;
};

/**
 * Broker-neutral live execution contract. Implementations must live outside
 * SmartVibe methodology and must never be called without the risk/final gate.
 */
export interface BrokerAdapter {
  readonly id: string;
  authenticate(): Promise<void>;
  getAccount(): Promise<BrokerAccount>;
  getBalance(): Promise<number>;
  getPositions(): Promise<BrokerPosition[]>;
  getOrders(): Promise<BrokerOrder[]>;
  getSymbols(): Promise<string[]>;
  getQuote(symbol: string): Promise<BrokerQuote>;
  placeOrder(request: PlaceOrderRequest): Promise<BrokerOrder>;
  modifyOrder(orderId: string, changes: Partial<Pick<PlaceOrderRequest, 'price' | 'stopLoss' | 'takeProfit'>>): Promise<BrokerOrder>;
  cancelOrder(orderId: string): Promise<void>;
  closePosition(positionId: string): Promise<BrokerOrder>;
  monitorExecution(listener: (event: ExecutionEvent) => void): () => void;
}
