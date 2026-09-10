export type MarketStatus = 'OPEN' | 'CLOSED' | 'UNKNOWN';

export type MarketBar = {
  symbol: string;
  timestamp: string;
  timezone: string;
  timeframe: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  bid: number | null;
  ask: number | null;
  spread: number | null;
  source: string;
  marketStatus: MarketStatus;
};

export type DataIntegrityIssue = {
  code: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
  symbol?: string;
  timestamp?: string;
};

export type DataIntegrityResult = {
  valid: boolean;
  bars: MarketBar[];
  issues: DataIntegrityIssue[];
};
