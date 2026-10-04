// Copied from server/src/types.ts — keep the two in sync.

export interface Candle {
  time: number; // start of the candle, in seconds (UTC)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  time: number; // ms
}

export interface Tick {
  quote: Quote;
  candle: Candle;
}

export interface SparkPoint {
  time: number;
  value: number;
}

export interface StockSummary {
  quote: Quote;
  spark: SparkPoint[];
}

export interface ServerToClientEvents {
  snapshot: (quotes: Quote[]) => void;
  tick: (tick: Tick) => void;
  stats: (stats: { clients: number }) => void;
}

export interface ClientToServerEvents {
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  latency: (sentAt: number, ack: (sentAt: number) => void) => void;
}
