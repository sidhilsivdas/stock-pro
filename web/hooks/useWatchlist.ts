"use client";

import { useSyncExternalStore } from "react";

// The user's watchlist, saved in the browser (localStorage)

const KEY = "watchlist";
const DEFAULT = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL", "NFLX"];

let cache: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? JSON.parse(raw) : DEFAULT;
  } catch {
    cache = DEFAULT;
  }
  return cache!;
}

function write(list: string[]) {
  cache = list;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage blocked (private mode etc.) — keep it in memory only
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useWatchlist() {
  const list = useSyncExternalStore(subscribe, read, () => DEFAULT);
  return {
    list,
    add: (symbol: string) => !list.includes(symbol) && write([...list, symbol]),
    remove: (symbol: string) => write(list.filter((s) => s !== symbol)),
  };
}
