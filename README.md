# Stock Market Pro

A learning project for Socket.IO: live (mock) stock prices with a Next.js frontend.

```
web/     Next.js + Tailwind frontend  -> http://localhost:3000
server/  Express + Socket.IO          -> http://localhost:4000
```

## Run locally

In two terminals:

```bash
cd server
npm install
npm run dev
```

```bash
cd web
npm install
npm run dev
```

## How it works

```
Browser  <== Socket.IO ==>  server  <-- MockProvider (fake prices every second)
         <== REST (history) ==
```

**Server** (`server/src`)

| File | What it does |
|---|---|
| `stocks.ts` | The 12 mock stocks and how jumpy each one is |
| `mockProvider.ts` | Generates 5 hours of fake history, then moves every price once per second and builds 1-minute candles |
| `index.ts` | Express REST endpoints + Socket.IO events |
| `types.ts` | Shapes of the data and of the socket events |

REST endpoints:

- `GET /health` — is the server alive
- `GET /api/stocks` — all stocks, current quote + last hour for sparklines
- `GET /api/history/:symbol` — quote + candles for the chart

Socket.IO events:

| Direction | Event | Meaning |
|---|---|---|
| client → server | `subscribe(symbols)` | Join one room per stock; server replies with `snapshot` |
| client → server | `unsubscribe(symbols)` | Leave those rooms |
| client → server | `latency(sentAt, ack)` | Server calls `ack` right away, client measures round trip |
| server → client | `snapshot(quotes)` | Current prices, sent after subscribing |
| server → client | `tick({ quote, candle })` | One live update, sent only to that stock's room |
| server → client | `stats({ clients })` | Number of people online, sent to everyone |

**Web** (`web/`)

| File | What it does |
|---|---|
| `lib/socket.ts` | The single socket connection, subscription counting, re-subscribing after reconnect, connection status |
| `hooks/useLiveQuotes.ts` | Subscribe to some stocks and get their live quotes |
| `hooks/useConnection.ts` | Live / Connecting / Offline, latency, people online |
| `hooks/useWatchlist.ts` | Watchlist saved in localStorage |
| `components/Dashboard.tsx` | Homepage: ticker tape, stat cards, watchlist table |
| `components/StockDetail.tsx` | `/stock/[symbol]` page with the live chart |
| `components/StockChart.tsx` | Candlestick / line chart (lightweight-charts) |

## Things to try

- Open the site in two browser tabs: the "online" count goes to 2.
- Stop the server: the badge turns red. Start it again: everything reconnects and refills.
- Watch the server terminal while adding/removing stocks: only watched stocks are sent.

## Environment variables

| Where | Variable | Default |
|---|---|---|
| server | `PORT` | `4000` |
| server | `CLIENT_URL` (allowed by CORS) | `http://localhost:3000` |
| web | `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:4000` |
