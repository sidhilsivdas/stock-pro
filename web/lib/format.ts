const price = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatPrice = (n: number) => price.format(n);

export const formatVolume = (n: number) => compact.format(n);

export const formatChange = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}`;

export const formatPercent = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

// Tailwind text color for a positive / negative number
export const trendColor = (n: number) =>
  n > 0 ? "text-emerald-400" : n < 0 ? "text-rose-400" : "text-slate-400";
