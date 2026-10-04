import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { MockProvider } from "./mockProvider";
import { ClientToServerEvents, ServerToClientEvents } from "./types";

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const provider = new MockProvider();

const app = express();
app.use(cors({ origin: CLIENT_URL }));

// Simple check that the server is alive (useful for hosting later)
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// List of all stocks with their current quote and the last hour of
// closing prices (for the small sparkline charts)
app.get("/api/stocks", (_req, res) => {
  res.json(
    provider.list().map((s) => ({
      quote: provider.getQuote(s.symbol),
      spark: provider
        .getHistory(s.symbol)
        .slice(-60)
        .map((c) => ({ time: c.time, value: c.close })),
    }))
  );
});

// Past candles for one stock, used to draw the chart
app.get("/api/history/:symbol", (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const quote = provider.getQuote(symbol);
  if (!quote) {
    res.status(404).json({ error: `Unknown symbol ${symbol}` });
    return;
  }
  res.json({ quote, candles: provider.getHistory(symbol) });
});

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: CLIENT_URL },
});

const known = new Set(provider.list().map((s) => s.symbol));

// Keep only valid, upper-cased symbols from what the client sent
function cleanSymbols(symbols: unknown): string[] {
  if (!Array.isArray(symbols)) return [];
  return symbols
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.toUpperCase())
    .filter((s) => known.has(s));
}

function broadcastStats() {
  io.emit("stats", { clients: io.engine.clientsCount });
}

io.on("connection", (socket) => {
  console.log(`client connected: ${socket.id}`);
  broadcastStats();

  // Client wants updates for some stocks: join one room per stock,
  // and immediately send the current prices so the UI isn't empty.
  socket.on("subscribe", (symbols) => {
    const valid = cleanSymbols(symbols);
    for (const symbol of valid) socket.join(symbol);
    console.log(`${socket.id} subscribed to ${valid.join(", ")}`);
    socket.emit("snapshot", valid.map((s) => provider.getQuote(s)!));
  });

  socket.on("unsubscribe", (symbols) => {
    const valid = cleanSymbols(symbols);
    for (const symbol of valid) socket.leave(symbol);
    console.log(`${socket.id} unsubscribed from ${valid.join(", ")}`);
  });

  // Client measures round-trip time: we just send its timestamp back
  socket.on("latency", (sentAt, ack) => {
    if (typeof ack === "function") ack(sentAt);
  });

  socket.on("disconnect", () => {
    console.log(`client disconnected: ${socket.id}`);
    broadcastStats();
  });
});

// Every price update goes only to the clients watching that stock
provider.onTick((tick) => {
  io.to(tick.quote.symbol).emit("tick", tick);
});
provider.start();

httpServer.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
