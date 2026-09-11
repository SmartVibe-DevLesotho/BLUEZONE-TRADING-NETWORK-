export type BrokerAccount = {
  balance: number;
  equity: number;
  leverage: number;
  currency?: string;
  login?: string;
  server?: string;
  timestamp: string;
};

export type BrokerQuote = {
  symbol: string;
  bid: number;
  ask: number;
  timestamp: string;
};

export type BrokerPosition = {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  volume: number;
  entry: number;
  stopLoss: number | null;
  takeProfit: number | null;
  profit: number;
};

export type BrokerOrder = {
  id: string;
  symbol: string;
  status: string;
  volume: number;
  price?: number;
};

export type BrokerSymbol = {
  symbol: string;
  minVolume: number;
  maxVolume: number;
  volumeStep: number;
  tickSize: number;
  tickValue: number;
  point: number;
  digits: number;
};

export type BrokerExecutionRequest = {
  symbol: string;
  direction: 'BUY' | 'SELL';
  volume: number;
  stopLoss: number | null;
  takeProfit: number | null;
  clientOrderId: string;
};

export type BrokerExecutionResult = {
  accepted: boolean;
  externalId?: string;
  price?: number;
  message?: string;
};

/**
 * Provider-neutral live broker contract. Strategy and methodology code must
 * depend on this interface rather than on an individual broker SDK.
 */
export interface BrokerAdapter {
  readonly name: string;
  authenticate(): Promise<void>;
  getAccount(): Promise<BrokerAccount>;
  getBalance(): Promise<number>;
  getPositions(): Promise<BrokerPosition[]>;
  getOrders(): Promise<BrokerOrder[]>;
  getSymbols(): Promise<BrokerSymbol[]>;
  getQuote(symbol: string): Promise<BrokerQuote>;
  placeOrder(request: BrokerExecutionRequest): Promise<BrokerExecutionResult>;
  modifyOrder(orderId: string, stopLoss: number | null, takeProfit: number | null): Promise<BrokerExecutionResult>;
  cancelOrder(orderId: string): Promise<BrokerExecutionResult>;
  closePosition(positionId: string): Promise<BrokerExecutionResult>;
  monitorExecution(externalId: string): Promise<BrokerOrder | BrokerPosition | null>;
}
