import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "./types";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export const SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

// ---------------------------------------------------------------------------
// One socket for the whole app (created the first time someone needs it)
// ---------------------------------------------------------------------------

let socket: AppSocket | null = null;

export function getSocket(): AppSocket {
  if (socket) return socket;

  const s: AppSocket = io(SERVER_URL);
  socket = s;

  s.on("connect", () => {
    setConnection({ status: "connected" });
    // After a reconnect the server has forgotten our rooms, so join them again.
    // The server answers with a fresh snapshot, filling any gap we missed.
    const symbols = [...subscriptions.keys()];
    if (symbols.length) s.emit("subscribe", symbols);
  });
  s.on("disconnect", () => setConnection({ status: "disconnected", latency: null }));
  s.on("connect_error", () => setConnection({ status: "disconnected", latency: null }));
  s.io.on("reconnect_attempt", () => setConnection({ status: "connecting" }));
  s.on("stats", ({ clients }) => setConnection({ clients }));

  // Measure round-trip time every 2 seconds using an acknowledgement
  setInterval(() => {
    if (!s.connected) return;
    s.emit("latency", Date.now(), (sentAt) => setConnection({ latency: Date.now() - sentAt }));
  }, 2000);

  return s;
}

// ---------------------------------------------------------------------------
// Subscriptions: several components may watch the same stock, so we count
// them and only tell the server to unsubscribe when nobody needs it anymore.
// ---------------------------------------------------------------------------

const subscriptions = new Map<string, number>();

export function subscribeSymbols(symbols: string[]) {
  if (!symbols.length) return;
  const s = getSocket();
  for (const symbol of symbols) {
    subscriptions.set(symbol, (subscriptions.get(symbol) ?? 0) + 1);
  }
  // Always ask, even for symbols already joined, so this caller gets a snapshot.
  // If we're offline, the "connect" handler above will do it.
  if (s.connected) s.emit("subscribe", symbols);
}

export function unsubscribeSymbols(symbols: string[]) {
  const s = getSocket();
  const unused: string[] = [];
  for (const symbol of symbols) {
    const count = (subscriptions.get(symbol) ?? 0) - 1;
    if (count > 0) {
      subscriptions.set(symbol, count);
    } else {
      subscriptions.delete(symbol);
      unused.push(symbol);
    }
  }
  if (unused.length && s.connected) s.emit("unsubscribe", unused);
}

// ---------------------------------------------------------------------------
// Connection state as a tiny store, read with useSyncExternalStore
// ---------------------------------------------------------------------------

export interface ConnectionState {
  status: "connecting" | "connected" | "disconnected";
  latency: number | null; // ms
  clients: number | null; // people online
}

const INITIAL: ConnectionState = { status: "connecting", latency: null, clients: null };
let connection = INITIAL;
const listeners = new Set<() => void>();

function setConnection(patch: Partial<ConnectionState>) {
  connection = { ...connection, ...patch };
  listeners.forEach((l) => l());
}

export function subscribeConnection(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getConnection = () => connection;
export const getServerConnection = () => INITIAL;
