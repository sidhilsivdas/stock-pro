"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { getSocket, subscribeSymbols, unsubscribeSymbols } from "@/lib/socket";
import type { Quote, Tick } from "@/lib/types";

// Subscribe to live prices for some stocks.
// Returns the latest quote per symbol; onTick (optional) sees every update.
export function useLiveQuotes(symbols: string[], onTick?: (tick: Tick) => void) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const handleTick = useEffectEvent((tick: Tick) => onTick?.(tick));

  // Re-run only when the list actually changes, not on every render
  const key = symbols.join(",");

  useEffect(() => {
    const list = key ? key.split(",") : [];
    const wanted = new Set(list);
    const socket = getSocket();

    // Full current prices: sent right after we subscribe (or reconnect)
    const onSnapshot = (snapshot: Quote[]) => {
      setQuotes((prev) => {
        const next = { ...prev };
        for (const q of snapshot) if (wanted.has(q.symbol)) next[q.symbol] = q;
        return next;
      });
    };

    // One live price update
    const onTickEvent = (tick: Tick) => {
      if (!wanted.has(tick.quote.symbol)) return;
      setQuotes((prev) => ({ ...prev, [tick.quote.symbol]: tick.quote }));
      handleTick(tick);
    };

    socket.on("snapshot", onSnapshot);
    socket.on("tick", onTickEvent);
    subscribeSymbols(list);

    return () => {
      socket.off("snapshot", onSnapshot);
      socket.off("tick", onTickEvent);
      unsubscribeSymbols(list);
    };
  }, [key]);

  return quotes;
}
