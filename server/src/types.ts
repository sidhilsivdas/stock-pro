// Shapes of the data we send to the browser.
// (The same types are copied in web/lib/types.ts)

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
  prevClose: number; // price at the start of the "day", used for change
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  time: number; // when this price was produced, in ms
}

// One live update: the new quote plus the candle it belongs to
export interface Tick {
  quote: Quote;
  candle: Candle;
}

export interface StockInfo {
  symbol: string;
  name: string;
}

// Socket.IO event types. Typing these catches typos in event names.
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
