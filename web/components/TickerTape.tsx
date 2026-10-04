import { formatPercent, formatPrice, trendColor } from "@/lib/format";
import type { Quote } from "@/lib/types";

// Scrolling strip of prices across the top of the dashboard
export function TickerTape({ quotes }: { quotes: Quote[] }) {
  if (!quotes.length) return <div className="h-11" />;

  // render the list twice so the loop is seamless
  const items = [...quotes, ...quotes];

  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-white/[0.02] py-3 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div className="animate-marquee flex w-max gap-10">
        {items.map((q, i) => (
          <span key={`${q.symbol}-${i}`} className="flex items-center gap-2 whitespace-nowrap text-sm">
            <span className="font-semibold text-slate-200">{q.symbol}</span>
            <span className="font-mono text-slate-400">{formatPrice(q.price)}</span>
            <span className={`font-mono ${trendColor(q.change)}`}>{formatPercent(q.changePercent)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
