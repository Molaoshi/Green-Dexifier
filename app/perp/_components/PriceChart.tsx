"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { usePerp } from "../_lib/store";
import { fetchCandles, subscribeCandle } from "../_lib/hl/adapter";
import { CANDLE_INTERVALS, type CandleInterval } from "../_lib/config";

const LOOKBACK: Record<CandleInterval, number> = {
  "1m": 6 * 3600e3,
  "5m": 24 * 3600e3,
  "15m": 3 * 86400e3,
  "1h": 7 * 86400e3,
  "4h": 30 * 86400e3,
  "1d": 180 * 86400e3,
};

const UP = "#13f187";
const DOWN = "#fb2c36";

export default function PriceChart() {
  const { selected } = usePerp();
  const coin = selected?.coin ?? "BTC";
  const [interval, setChartInterval] = useState<CandleInterval>("15m");
  const boxRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  // Create chart once
  useEffect(() => {
    if (!boxRef.current) return;
    const chart = createChart(boxRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8f8f8f",
        fontFamily: "ui-monospace, Menlo, Consolas, monospace",
        fontSize: 10,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(19,241,135,0.04)" },
        horzLines: { color: "rgba(19,241,135,0.04)" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
      crosshair: {
        vertLine: { color: "rgba(19,241,135,0.25)", labelBackgroundColor: "#0d3b24" },
        horzLine: { color: "rgba(19,241,135,0.25)", labelBackgroundColor: "#0d3b24" },
      },
    });
    chartRef.current = chart;
    return () => {
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volRef.current = null;
    };
  }, []);

  // Load + subscribe per coin/interval
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    let dead = false;
    let sub: { unsubscribe: () => Promise<void> } | null = null;

    if (candleRef.current) chart.removeSeries(candleRef.current);
    if (volRef.current) chart.removeSeries(volRef.current);

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: UP,
      downColor: DOWN,
      wickUpColor: "rgba(19,241,135,0.7)",
      wickDownColor: "rgba(251,44,54,0.7)",
      borderVisible: false,
    });
    const volume = chart.addSeries(HistogramSeries, {
      priceScaleId: "vol",
      priceFormat: { type: "volume" },
    });
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
    candleRef.current = candles;
    volRef.current = volume;

    fetchCandles(coin, interval, LOOKBACK[interval])
      .then((list) => {
        if (dead) return;
        candles.setData(
          list.map((c) => ({
            time: (c.t / 1000) as UTCTimestamp,
            open: c.o,
            high: c.h,
            low: c.l,
            close: c.c,
          })),
        );
        volume.setData(
          list.map((c) => ({
            time: (c.t / 1000) as UTCTimestamp,
            value: c.v,
            color: c.c >= c.o ? "rgba(19,241,135,0.25)" : "rgba(251,44,54,0.25)",
          })),
        );
        chart.timeScale().fitContent();
      })
      .catch(() => {});

    subscribeCandle(coin, interval, (c) => {
      if (dead) return;
      const time = (c.t / 1000) as UTCTimestamp;
      candles.update({ time, open: c.o, high: c.h, low: c.l, close: c.c });
      volume.update({
        time,
        value: c.v,
        color: c.c >= c.o ? "rgba(19,241,135,0.25)" : "rgba(251,44,54,0.25)",
      });
    })
      .then((s) => (sub = s))
      .catch(() => {});

    return () => {
      dead = true;
      sub?.unsubscribe().catch(() => {});
    };
  }, [coin, interval]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-[var(--line)] px-2 py-1.5">
        {CANDLE_INTERVALS.map((i) => (
          <button
            key={i}
            onClick={() => setChartInterval(i)}
            className={`rounded px-2 py-1 text-[11px] font-bold transition-colors ${
              interval === i ? "bg-primary/10 text-primary" : "text-[var(--meta)] hover:text-white/80"
            }`}
          >
            {i}
          </button>
        ))}
      </div>
      <div ref={boxRef} className="min-h-0 flex-1" />
    </div>
  );
}
