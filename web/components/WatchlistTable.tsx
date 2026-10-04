"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatChange, formatPercent, formatPrice, formatVolume, trendColor } from "@/lib/format";
import type { Quote, SparkPoint } from "@/lib/types";
import { FlashValue } from "./FlashValue";
import { Sparkline } from "./Sparkline";

export function WatchlistTable({
  quotes,
  spark,
  onRemove,
}: {
  quotes: Quote[];
  spark: Record<string, SparkPoint[]>;
  onRemove: (symbol: string) => void;
}) {
  const router = useRouter();

  if (!quotes.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-slate-400">
        Your watchlist is empty. Add a stock below.
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Last hour</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 text-right font-medium">Change</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Day range</th>
              <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Volume</th>
              <th className="w-10 px-2" />
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => {
              const up = q.change >= 0;
              const range = q.dayHigh - q.dayLow || 1;
              const position = ((q.price - q.dayLow) / range) * 100;

              return (
                <tr
                  key={q.symbol}
                  onClick={() => router.push(`/stock/${q.symbol}`)}
                  className="group cursor-pointer border-b border-white/5 transition last:border-0 hover:bg-white/[0.04]"
                >
                  <td className="px-4 py-3">
                    <Link href={`/stock/${q.symbol}`} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <span className={`hidden h-9 w-9 shrink-0 place-items-center sm:grid rounded-lg border text-[10px] font-bold ${up ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300"}`}>
                        {q.symbol.slice(0, 4)}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-slate-100">{q.symbol}</span>
                        <span className="block max-w-[7rem] truncate sm:max-w-[10rem] text-xs text-slate-500">{q.name}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <Sparkline values={(spark[q.symbol] ?? []).map((p) => p.value)} up={up} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-100">
                    <FlashValue value={q.price}>{formatPrice(q.price)}</FlashValue>
                  </td>
                  <td className={`px-4 py-3 text-right font-mono tabular-nums ${trendColor(q.change)}`}>
                    <div>{formatPercent(q.changePercent)}</div>
                    <div className="text-xs opacity-70">{formatChange(q.change)}</div>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
                      <span>{q.dayLow.toFixed(2)}</span>
                      <span className="relative h-1 w-20 rounded-full bg-white/10">
                        <span
                          className="absolute top-1/2 h-2.5 w-0.5 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]"
                          style={{ left: `${Math.min(100, Math.max(0, position))}%` }}
                        />
                      </span>
                      <span>{q.dayHigh.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-right font-mono tabular-nums text-slate-400 sm:table-cell">
                    {formatVolume(q.volume)}
                  </td>
                  <td className="px-2 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(q.symbol);
                      }}
                      aria-label={`Remove ${q.symbol}`}
                      className="grid h-7 w-7 place-items-center rounded-md text-slate-500 opacity-60 transition hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
