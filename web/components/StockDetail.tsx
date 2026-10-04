"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useConnection } from "@/hooks/useConnection";
import { useLiveQuotes } from "@/hooks/useLiveQuotes";
import { useWatchlist } from "@/hooks/useWatchlist";
import { formatChange, formatPercent, formatPrice, formatVolume, trendColor } from "@/lib/format";
import { SERVER_URL } from "@/lib/socket";
import type { Candle, Quote } from "@/lib/types";
import { FlashValue } from "./FlashValue";
import { StockChart, type ChartType } from "./StockChart";

export function StockDetail({ symbol }: { symbol: string }) {
  const { status } = useConnection();
  const { list, add, remove } = useWatchlist();
  const [history, setHistory] = useState<Candle[]>([]);
  const [initial, setInitial] = useState<Quote | null>(null);
  const [live, setLive] = useState<Candle | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [type, setType] = useState<ChartType>("candles");

  // Load chart history over REST; reload after a reconnect to fill any gap
  useEffect(() => {
    if (status !== "connected") return;
    fetch(`${SERVER_URL}/api/history/${symbol}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json() as Promise<{ quote: Quote; candles: Candle[] }>;
      })
      .then((data) => {
        if (!data) return;
        setInitial(data.quote);
        setHistory(data.candles);
      })
      .catch(() => {});
  }, [symbol, status]);

  // Live updates: newest quote + the candle it belongs to
  const quotes = useLiveQuotes([symbol], (tick) => setLive(tick.candle));
  const quote = quotes[symbol] ?? initial;

  if (notFound) {
    return (
      <div className="pt-16 text-center">
        <p className="text-lg font-medium">Unknown stock &ldquo;{symbol}&rdquo;</p>
        <Link href="/" className="mt-4 inline-block text-sm text-cyan-300 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const watching = list.includes(symbol);

  return (
    <div className="space-y-6 pt-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-cyan-300">
        ← Dashboard
      </Link>

      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{symbol}</h1>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-300">
              Mock data
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">{quote?.name ?? "Loading…"}</p>
        </div>

        {quote && (
          <div className="text-right">
            <p className="font-mono text-4xl font-semibold tabular-nums tracking-tight">
              <FlashValue value={quote.price}>{formatPrice(quote.price)}</FlashValue>
            </p>
            <p className={`mt-1 font-mono text-sm tabular-nums ${trendColor(quote.change)}`}>
              {formatChange(quote.change)} ({formatPercent(quote.changePercent)}) today
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-2 backdrop-blur-xl sm:p-4">
        <div className="mb-2 flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            1-minute candles · live
          </div>
          <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5 text-xs">
            {(["candles", "line"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-md px-3 py-1 capitalize transition ${type === t ? "bg-cyan-400/15 text-cyan-200" : "text-slate-400 hover:text-slate-200"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[380px] sm:h-[460px]">
          <StockChart history={history} live={live} type={type} />
        </div>
      </section>

      {quote && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Open" value={formatPrice(quote.prevClose)} />
          <Stat label="Day high" value={formatPrice(quote.dayHigh)} />
          <Stat label="Day low" value={formatPrice(quote.dayLow)} />
          <Stat label="Volume" value={formatVolume(quote.volume)} />
        </section>
      )}

      <button
        onClick={() => (watching ? remove(symbol) : add(symbol))}
        className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
          watching
            ? "border-white/10 bg-white/[0.03] text-slate-300 hover:border-rose-400/30 hover:text-rose-300"
            : "border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20"
        }`}
      >
        {watching ? "Remove from watchlist" : "+ Add to watchlist"}
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1.5 font-mono text-lg tabular-nums">{value}</p>
    </div>
  );
}
