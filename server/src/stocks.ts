// The stocks our mock market knows about.
// basePrice: roughly where the price starts
// volatility: how much the price jumps each second (0.0003 = 0.03%)

export interface StockConfig {
  symbol: string;
  name: string;
  basePrice: number;
  volatility: number;
}

export const STOCKS: StockConfig[] = [
  { symbol: "AAPL", name: "Apple Inc.", basePrice: 228, volatility: 0.00031 },
  { symbol: "MSFT", name: "Microsoft Corp.", basePrice: 431, volatility: 0.00028 },
  { symbol: "GOOGL", name: "Alphabet Inc.", basePrice: 168, volatility: 0.00035 },
  { symbol: "AMZN", name: "Amazon.com Inc.", basePrice: 187, volatility: 0.00038 },
  { symbol: "NVDA", name: "NVIDIA Corp.", basePrice: 124, volatility: 0.00063 },
  { symbol: "TSLA", name: "Tesla Inc.", basePrice: 249, volatility: 0.0007 },
  { symbol: "META", name: "Meta Platforms Inc.", basePrice: 582, volatility: 0.00042 },
  { symbol: "NFLX", name: "Netflix Inc.", basePrice: 708, volatility: 0.00045 },
  { symbol: "AMD", name: "Advanced Micro Devices", basePrice: 162, volatility: 0.00056 },
  { symbol: "INTC", name: "Intel Corp.", basePrice: 22.5, volatility: 0.00052 },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", basePrice: 211, volatility: 0.00024 },
  { symbol: "DIS", name: "Walt Disney Co.", basePrice: 96, volatility: 0.00031 },
];
