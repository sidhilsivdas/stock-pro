import { STOCKS, StockConfig } from "./stocks";
import { Candle, Quote, StockInfo, Tick } from "./types";

// A "price provider" is anything that produces prices.
// Today it's this mock. Later a real provider (Finnhub, Binance...) can
// implement the same interface and the rest of the app won't change.
export interface PriceProvider {
  list(): StockInfo[];
  getQuote(symbol: string): Quote | undefined;
  getHistory(symbol: string): Candle[];
  onTick(listener: (tick: Tick) => void): void;
  start(): void;
}

const CANDLE_SECONDS = 60; // 1-minute candles
const HISTORY_CANDLES = 300; // 5 hours of history
const MAX_CANDLES = 1000;

interface StockState {
  config: StockConfig;
  price: number;
  prevClose: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  candles: Candle[];
}

// Random number with a bell-curve shape (most moves small, some big)
function gaussian(): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// Move a price by one random step
function nextPrice(price: number, volatility: number): number {
  return Math.max(0.01, price * (1 + gaussian() * volatility));
}

function randomVolume(): number {
  return Math.floor(50 + Math.random() * 950);
}

export class MockProvider implements PriceProvider {
  private stocks = new Map<string, StockState>();
  private listeners: ((tick: Tick) => void)[] = [];
  private timer?: NodeJS.Timeout;

  constructor() {
    for (const config of STOCKS) {
      this.stocks.set(config.symbol, this.createHistory(config));
    }
  }

  // Generate fake past candles so the chart has something to show
  private createHistory(config: StockConfig): StockState {
    const nowCandle = Math.floor(Date.now() / 1000 / CANDLE_SECONDS) * CANDLE_SECONDS;
    const candles: Candle[] = [];
    let price = config.basePrice;

    for (let i = HISTORY_CANDLES; i > 0; i--) {
      const open = price;
      let high = open;
      let low = open;
      let volume = 0;
      // simulate one tick per second inside each candle
      for (let s = 0; s < CANDLE_SECONDS; s++) {
        price = nextPrice(price, config.volatility);
        high = Math.max(high, price);
        low = Math.min(low, price);
        volume += randomVolume();
      }
      candles.push({
        time: nowCandle - i * CANDLE_SECONDS,
        open: round(open),
        high: round(high),
        low: round(low),
        close: round(price),
        volume,
      });
    }

    const prevClose = candles[0].open;
    return {
      config,
      price,
      prevClose,
      dayHigh: Math.max(...candles.map((c) => c.high)),
      dayLow: Math.min(...candles.map((c) => c.low)),
      volume: candles.reduce((sum, c) => sum + c.volume, 0),
      candles,
    };
  }

  private toQuote(s: StockState): Quote {
    const price = round(s.price);
    const change = round(price - s.prevClose);
    return {
      symbol: s.config.symbol,
      name: s.config.name,
      price,
      prevClose: s.prevClose,
      change,
      changePercent: round((change / s.prevClose) * 100),
      dayHigh: round(s.dayHigh),
      dayLow: round(s.dayLow),
      volume: s.volume,
      time: Date.now(),
    };
  }

  // Advance one stock by one second and return the update
  private step(s: StockState): Tick {
    s.price = nextPrice(s.price, s.config.volatility);
    const price = round(s.price);
    const volume = randomVolume();
    s.dayHigh = Math.max(s.dayHigh, price);
    s.dayLow = Math.min(s.dayLow, price);
    s.volume += volume;

    const candleTime = Math.floor(Date.now() / 1000 / CANDLE_SECONDS) * CANDLE_SECONDS;
    let candle = s.candles[s.candles.length - 1];

    if (candle.time === candleTime) {
      // same minute: update the current candle
      candle.high = Math.max(candle.high, price);
      candle.low = Math.min(candle.low, price);
      candle.close = price;
      candle.volume += volume;
    } else {
      // new minute: start a new candle
      candle = { time: candleTime, open: candle.close, high: price, low: price, close: price, volume };
      candle.high = Math.max(candle.high, candle.open);
      candle.low = Math.min(candle.low, candle.open);
      s.candles.push(candle);
      if (s.candles.length > MAX_CANDLES) s.candles.shift();
    }

    return { quote: this.toQuote(s), candle: { ...candle } };
  }

  list(): StockInfo[] {
    return STOCKS.map(({ symbol, name }) => ({ symbol, name }));
  }

  getQuote(symbol: string): Quote | undefined {
    const s = this.stocks.get(symbol);
    return s && this.toQuote(s);
  }

  getHistory(symbol: string): Candle[] {
    return this.stocks.get(symbol)?.candles.map((c) => ({ ...c })) ?? [];
  }

  onTick(listener: (tick: Tick) => void): void {
    this.listeners.push(listener);
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      for (const s of this.stocks.values()) {
        const tick = this.step(s);
        for (const listener of this.listeners) listener(tick);
      }
    }, 1000);
  }
}
