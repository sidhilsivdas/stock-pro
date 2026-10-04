"use client";

import { useEffect, useRef } from "react";
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/lib/types";

export type ChartType = "candles" | "line";

const UP = "#34d399";
const DOWN = "#fb7185";

// Show chart times in the viewer's local time (the data is in UTC seconds)
const localTime = (time: Time) =>
  new Date((time as number) * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

interface Series {
  candles: ISeriesApi<"Candlestick">;
  line: ISeriesApi<"Area">;
  volume: ISeriesApi<"Histogram">;
}

function toPoints(c: Candle) {
  const time = c.time as UTCTimestamp;
  return {
    candle: { time, open: c.open, high: c.high, low: c.low, close: c.close },
    line: { time, value: c.close },
    volume: { time, value: c.volume, color: c.close >= c.open ? `${UP}55` : `${DOWN}55` },
  };
}

// Price chart using TradingView's lightweight-charts.
// `history` loads the whole chart; `live` updates (or adds) the latest candle.
export function StockChart({ history, live, type }: { history: Candle[]; live: Candle | null; type: ChartType }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<Series | null>(null);

  // Create the chart once
  useEffect(() => {
    const chart = createChart(containerRef.current!, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#64748b",
        fontFamily: "var(--font-geist-mono), monospace",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(148,163,184,0.06)" },
        horzLines: { color: "rgba(148,163,184,0.06)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(103,232,249,0.4)", labelBackgroundColor: "#0e7490" },
        horzLine: { color: "rgba(103,232,249,0.4)", labelBackgroundColor: "#0e7490" },
      },
      rightPriceScale: { borderColor: "rgba(148,163,184,0.1)" },
      timeScale: {
        borderColor: "rgba(148,163,184,0.1)",
        timeVisible: true,
        tickMarkFormatter: localTime,
      },
      localization: { timeFormatter: localTime },
    });

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: UP,
      downColor: DOWN,
      wickUpColor: UP,
      wickDownColor: DOWN,
      borderVisible: false,
    });
    const line = chart.addSeries(AreaSeries, {
      lineColor: "#22d3ee",
      topColor: "rgba(34,211,238,0.25)",
      bottomColor: "rgba(34,211,238,0)",
      lineWidth: 2,
      visible: false,
    });
    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "", // own scale, overlaid at the bottom
    });

    candles.priceScale().applyOptions({ scaleMargins: { top: 0.08, bottom: 0.25 } });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    chartRef.current = chart;
    seriesRef.current = { candles, line, volume };

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Load the full history
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !history.length) return;
    const points = history.map(toPoints);
    series.candles.setData(points.map((p) => p.candle));
    series.line.setData(points.map((p) => p.line));
    series.volume.setData(points.map((p) => p.volume));
    chartRef.current?.timeScale().scrollToRealTime();
  }, [history]);

  // Apply each live candle (same time = update, newer time = new bar)
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !live || !history.length) return;
    if (live.time < history[history.length - 1].time) return; // older than our data
    const p = toPoints(live);
    series.candles.update(p.candle);
    series.line.update(p.line);
    series.volume.update(p.volume);
  }, [live, history]);

  // Switch between candles and line
  useEffect(() => {
    seriesRef.current?.candles.applyOptions({ visible: type === "candles" });
    seriesRef.current?.line.applyOptions({ visible: type === "line" });
  }, [type]);

  return <div ref={containerRef} className="h-full w-full" />;
}
