export type SmartVibeTimeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1';

export type MarketStatus = 'OPEN' | 'CLOSED' | 'UNKNOWN';

/** Canonical market-data contract. Providers must be normalized into this shape. */
export type MarketBar = {
  symbol: string;
  timestamp: string;
  timezone: 'UTC';
  timeframe: SmartVibeTimeframe;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
  bid: number | null;
  ask: number | null;
  spread: number | null;
  source: string;
  marketStatus: MarketStatus;
};

export type MarketDataValidationIssue = {
  code:
  | 'INVALID_TIMESTAMP'
  | 'INVALID_OHLC'
  | 'NEGATIVE_VOLUME'
  | 'OUT_OF_ORDER'
  | 'DUPLICATE'
  | 'STALE'
  | 'INVALID_SPREAD'
  | 'INVALID_SYMBOL'
  | 'INVALID_TIMEFRAME'
  | 'FUTURE_DATA';
  message: string;
};
