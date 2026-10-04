"use client";

import { useEffect, useState } from "react";
import { useConnection } from "@/hooks/useConnection";
import { useLiveQuotes } from "@/hooks/useLiveQuotes";
import { useWatchlist } from "@/hooks/useWatchlist";
import { formatPercent, formatPrice, trendColor } from "@/lib/format";
import { SERVER_URL } from "@/lib/socket";
import type { Quote, SparkPoint, StockSummary, Tick } from "@/lib/types";
import { TickerTape } from "./TickerTape";
import { WatchlistTable } from "./WatchlistTable";

export function Dashboard() {
  const { status } = useConnection();
  const { list, add, remove } = useWatchlist();
  const [stocks, setStocks] = useState<Quote[]>([]); // every stock the server knows
  const [spark, setSpark] = useState<Record<string, SparkPoint[]>>({});
  const [loadError, setLoadError] = useState(false);

  // Load the stock list + sparkline history over REST whenever we (re)connect
  useEffect(() => {
    if (status !== "connected") return;
    fetch(`${SERVER_URL}/api/stocks`)
      .then((res) => res.json() as Promise<StockSummary[]>)
      .then((data) => {
        setStocks(data.map((d) => d.quote));
        setSpark(Object.fromEntries(data.map((d) => [d.quote.symbol, d.spark])));
        setLoadError(false);
      })
      .catch(() => setLoadError(true));
  }, [status]);

  // Live prices for the watchlist; each tick also extends its sparkline
  const live = useLiveQuotes(list, ({ quote, candle }: Tick) => {
    setSpark((prev) => {
      const points = prev[quote.symbol];
      if (!points) return prev;
      const point = { time: candle.time, value: candle.close };
      const last = points[points.length - 1];
      const next =
        last && last.time === point.time
          ? [...points.slice(0, -1), point] // same minute: replace the last point
          : [...points.slice(-59), point]; // new minute: add a point
      return { ...prev, [quote.symbol]: next };
    });
  });

  // Prefer the live quote, fall back to the one from the REST call
  const byId = Object.fromEntries(stocks.map((q) => [q.symbol, q]));
  const watched = list.map((s) => live[s] ?? byId[s]).filter((q): q is Quote => !!q);
  const notWatched = stocks.filter((q) => !list.includes(q.symbol));

  const sorted = [...watched].sort((a, b) => b.changePercent - a.changePercent);
  const gainer = sorted[0];
  const loser = sorted[sorted.length - 1];
  const advancing = watched.filter((q) => q.change > 0).length;

  const offline = status === "disconnected" && !stocks.length;

  return (
    <div className="space-y-6">
      <section className="pt-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/80">Real-time market</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Your{" "}
          <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-400 bg-clip-text text-transparent">
            watchlist
          </span>
          , live.
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Prices stream over Socket.IO every second. Mock data for now.
        </p>
      </section>

      {offline || loadError ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-sm">
          <p className="font-medium text-rose-300">Can&apos;t reach the price server at {SERVER_URL}</p>
          <p className="mt-1 text-slate-400">
            Start it with <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-slate-200">cd server && npm run dev</code>{" "}
            — this page reconnects automatically.
          </p>
        </div>
      ) : (
        <>
          <div className="-mx-4 sm:mx-0 sm:rounded-xl sm:overflow-hidden">
            <TickerTape quotes={watched} />
          </div>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Watching" value={`${watched.length}`} sub={`of ${stocks.length || "–"} stocks`} />
            <StatCard
              label="Market mood"
              value={watched.length ? `${advancing} ▲  ${watched.length - advancing} ▼` : "–"}
              sub="advancing vs declining"
            />
            <StatCard
              label="Top gainer"
              value={gainer?.symbol ?? "–"}
              sub={gainer ? formatPercent(gainer.changePercent) : ""}
              subClass={gainer && trendColor(gainer.change)}
            />
            <StatCard
              label="Top loser"
              value={loser?.symbol ?? "–"}
              sub={loser ? formatPercent(loser.changePercent) : ""}
              subClass={loser && trendColor(loser.change)}
            />
          </section>

          <WatchlistTable quotes={watched} spark={spark} onRemove={remove} />

          {notWatched.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-slate-400">Add to watchlist</h2>
              <div className="flex flex-wrap gap-2">
                {notWatched.map((q) => (
                  <button
                    key={q.symbol}
                    onClick={() => add(q.symbol)}
                    className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
                  >
                    <span className="text-cyan-300 transition group-hover:rotate-90">+</span>
                    <span className="font-medium">{q.symbol}</span>
                    <span className="font-mono text-xs text-slate-500">{formatPrice(q.price)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, subClass = "text-slate-500" }: {
  label: string;
  value: string;
  sub: string;
  subClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
      <p className={`mt-0.5 font-mono text-xs ${subClass}`}>{sub}</p>
    </div>
  );
}
