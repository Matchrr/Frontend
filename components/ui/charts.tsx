"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { cx, type Tone } from "@/components/ui/primitives";

/**
 * Charts are hand-rolled SVG rather than a charting library: the whole surface
 * is a handful of shapes, and drawing them directly is what makes the
 * left-to-right wipe, the axis styling, and the crosshair behave consistently.
 */

export const CHART_COLORS = {
  brand: "#6349da",
  emerald: "#10b981",
  amber: "#f59e0b",
  sky: "#0ea5e9",
  rose: "#f43f5e",
  zinc: "#a1a1aa",
} as const;

export type ChartColor = keyof typeof CHART_COLORS;

const TONE_HEX: Record<Tone, string> = {
  neutral: CHART_COLORS.zinc,
  brand: CHART_COLORS.brand,
  positive: CHART_COLORS.emerald,
  warning: CHART_COLORS.amber,
  info: CHART_COLORS.sky,
  danger: CHART_COLORS.rose,
};

/** Width of the element, tracked so SVG user units can stay 1:1 with pixels. */
function useMeasuredWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(node);
    setWidth(node.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

/* -------------------------------------------------------------------------- */
/* Meters                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Ticked capacity bar. Reads as "how much of something is used" at a glance
 * without needing an axis.
 */
export function TickMeter({
  percent,
  tone = "brand",
  delay = 0,
  className,
}: {
  percent: number;
  tone?: Tone;
  delay?: number;
  className?: string;
}) {
  const target = Math.max(0, Math.min(100, percent));
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setWidth(target), delay + 40);
    return () => window.clearTimeout(timer);
  }, [target, delay]);

  const ticks = (color: string) =>
    `repeating-linear-gradient(to right, ${color} 0 2px, transparent 2px 5px)`;

  return (
    <div
      className={cx("h-4 w-full overflow-hidden rounded-[2px]", className)}
      style={{ backgroundImage: ticks("#e4e4e7") }}
      role="presentation"
    >
      <div
        className="h-full transition-[width] duration-[900ms] ease-[cubic-bezier(0.33,1,0.68,1)]"
        style={{ width: `${width}%`, backgroundImage: ticks(TONE_HEX[tone]) }}
      />
    </div>
  );
}

/** Labelled progress row — the layout used for pipeline and demand breakdowns. */
export function ProgressRow({
  label,
  value,
  percent,
  tone = "brand",
  delay = 0,
  hint,
}: {
  label: string;
  value?: string;
  percent: number;
  tone?: Tone;
  delay?: number;
  hint?: string;
}) {
  const target = Math.max(0, Math.min(100, percent));
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setWidth(target), delay + 40);
    return () => window.clearTimeout(timer);
  }, [target, delay]);

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate text-sm text-zinc-700">{label}</span>
          <span className="tnum shrink-0 text-xs font-medium text-zinc-900">
            {value ?? `${Math.round(target)}%`}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full transition-[width] duration-[900ms] ease-[cubic-bezier(0.33,1,0.68,1)]"
            style={{ width: `${width}%`, backgroundColor: TONE_HEX[tone] }}
          />
        </div>
        {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Rings                                                                       */
/* -------------------------------------------------------------------------- */

export function matchTone(percent: number): Tone {
  if (percent >= 78) return "positive";
  if (percent >= 62) return "brand";
  return "neutral";
}

export function matchLabel(percent: number): string {
  if (percent >= 78) return "Strong fit";
  if (percent >= 62) return "Solid fit";
  return "Stretch";
}

export function ScoreRing({
  percent,
  size = 56,
  tone,
  label,
  delay = 0,
}: {
  percent: number;
  size?: number;
  tone?: Tone;
  label?: string;
  delay?: number;
}) {
  const stroke = size >= 64 ? 6 : size >= 48 ? 5 : 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const resolved = tone ?? matchTone(percent);

  const [offset, setOffset] = useState(circumference);
  useEffect(() => {
    const timer = window.setTimeout(
      () => setOffset(circumference * (1 - Math.max(0, Math.min(100, percent)) / 100)),
      delay + 40,
    );
    return () => window.clearTimeout(timer);
  }, [percent, circumference, delay]);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${percent} percent match`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-zinc-200"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={TONE_HEX[resolved]}
          fill="none"
          className="transition-[stroke-dashoffset] duration-[1000ms] ease-[cubic-bezier(0.33,1,0.68,1)]"
        />
      </svg>
      <span
        className="tnum absolute inset-0 flex items-center justify-center font-semibold"
        style={{ fontSize: size >= 64 ? 16 : size >= 48 ? 14 : 12 }}
      >
        {Math.round(percent)}
        <span className="text-[0.7em] font-normal text-zinc-500">%</span>
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Area chart                                                                  */
/* -------------------------------------------------------------------------- */

export type ChartSeries = {
  key: string;
  label: string;
  color: ChartColor;
  values: number[];
  /** Line only, no gradient fill underneath. */
  lineOnly?: boolean;
};

type Point = { x: number; y: number };

/**
 * Cardinal spline through the data points. Control points are clamped inside
 * each segment's own band so the curve can never overshoot past a data value —
 * an area chart that dips below zero between two positive points reads as a
 * bug.
 */
function smoothPath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const previous = points[i - 1] ?? points[i];
    const current = points[i];
    const next = points[i + 1];
    const after = points[i + 2] ?? next;
    const tension = 0.2;

    const low = Math.min(current.y, next.y);
    const high = Math.max(current.y, next.y);
    const clamp = (value: number) => Math.min(high, Math.max(low, value));

    const c1x = current.x + (next.x - previous.x) * tension;
    const c1y = clamp(current.y + (next.y - previous.y) * tension);
    const c2x = next.x - (after.x - current.x) * tension;
    const c2y = clamp(next.y - (after.y - current.y) * tension);

    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
  }
  return d;
}

function niceCeiling(value: number): number {
  if (value <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function AreaChart({
  labels,
  series,
  height = 240,
  max,
  yTickCount = 4,
  formatValue = (n) => String(Math.round(n)),
  delay = 0,
  className,
}: {
  labels: string[];
  series: ChartSeries[];
  height?: number;
  max?: number;
  yTickCount?: number;
  formatValue?: (value: number) => string;
  delay?: number;
  className?: string;
}) {
  const gradientId = useId();
  const clipId = useId();
  const [containerRef, width] = useMeasuredWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const padding = { top: 12, right: 8, bottom: 26, left: 36 };
  const plotWidth = Math.max(width - padding.left - padding.right, 0);
  const plotHeight = height - padding.top - padding.bottom;

  const dataMax =
    max ?? niceCeiling(Math.max(1, ...series.flatMap((entry) => entry.values)));
  const count = labels.length;

  const xAt = (index: number) =>
    padding.left + (count <= 1 ? plotWidth / 2 : (plotWidth * index) / (count - 1));
  const yAt = (value: number) =>
    padding.top + plotHeight * (1 - Math.max(0, Math.min(dataMax, value)) / dataMax);

  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => (dataMax * i) / yTickCount);
  // Thin out x labels so they never collide on narrow layouts.
  const labelStride = Math.max(1, Math.ceil(count / Math.max(1, Math.floor(plotWidth / 56))));

  const ready = width > 0 && count > 0;

  return (
    <div className={cx("relative w-full", className)} ref={containerRef}>
      {ready ? (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={series.map((entry) => entry.label).join(" and ")}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - bounds.left - padding.left;
            const ratio = plotWidth === 0 ? 0 : x / plotWidth;
            const index = Math.round(ratio * (count - 1));
            setHover(Math.max(0, Math.min(count - 1, index)));
          }}
        >
          <defs>
            {series.map((entry) => (
              <linearGradient
                key={entry.key}
                id={`${gradientId}-${entry.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={CHART_COLORS[entry.color]} stopOpacity="0.22" />
                <stop offset="100%" stopColor={CHART_COLORS[entry.color]} stopOpacity="0" />
              </linearGradient>
            ))}
            <clipPath id={clipId}>
              <rect
                x={padding.left}
                y={0}
                width={plotWidth}
                height={height}
                className="chart-wipe"
                style={{ animationDelay: `${delay}ms` }}
              />
            </clipPath>
          </defs>

          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={padding.left + plotWidth}
                y1={yAt(tick)}
                y2={yAt(tick)}
                stroke="#e4e4e7"
                strokeWidth={1}
                strokeDasharray={tick === 0 ? undefined : "3 4"}
              />
              <text
                x={padding.left - 8}
                y={yAt(tick) + 3.5}
                textAnchor="end"
                className="tnum fill-zinc-400"
                style={{ fontSize: 10 }}
              >
                {formatValue(tick)}
              </text>
            </g>
          ))}

          <g clipPath={`url(#${clipId})`}>
            {series.map((entry) => {
              const points = entry.values.map((value, index) => ({
                x: xAt(index),
                y: yAt(value),
              }));
              const line = smoothPath(points);
              const area = `${line} L ${xAt(count - 1)} ${padding.top + plotHeight} L ${xAt(0)} ${padding.top + plotHeight} Z`;
              return (
                <g key={entry.key}>
                  {entry.lineOnly ? null : (
                    <path d={area} fill={`url(#${gradientId}-${entry.key})`} />
                  )}
                  <path
                    d={line}
                    fill="none"
                    stroke={CHART_COLORS[entry.color]}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
          </g>

          {labels.map((label, index) =>
            index % labelStride === 0 || index === count - 1 ? (
              <text
                key={`${label}-${index}`}
                x={xAt(index)}
                y={height - 8}
                textAnchor={index === 0 ? "start" : index === count - 1 ? "end" : "middle"}
                className="fill-zinc-400"
                style={{ fontSize: 10 }}
              >
                {label}
              </text>
            ) : null,
          )}

          {hover !== null ? (
            <g pointerEvents="none">
              <line
                x1={xAt(hover)}
                x2={xAt(hover)}
                y1={padding.top}
                y2={padding.top + plotHeight}
                stroke="#a1a1aa"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              {series.map((entry) => (
                <circle
                  key={entry.key}
                  cx={xAt(hover)}
                  cy={yAt(entry.values[hover] ?? 0)}
                  r={4}
                  fill="#fff"
                  stroke={CHART_COLORS[entry.color]}
                  strokeWidth={2}
                />
              ))}
            </g>
          ) : null}
        </svg>
      ) : (
        <div style={{ height }} />
      )}

      {hover !== null && ready ? (
        <div
          className="pointer-events-none absolute z-10 min-w-36 -translate-x-1/2 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-xs text-white shadow-pop"
          style={{
            left: Math.min(Math.max(xAt(hover), 80), width - 80),
            top: 4,
          }}
        >
          <p className="font-medium text-zinc-100">{labels[hover]}</p>
          <ul className="mt-1 space-y-0.5">
            {series.map((entry) => (
              <li key={entry.key} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[entry.color] }}
                  />
                  {entry.label}
                </span>
                <span className="tnum font-medium">{formatValue(entry.values[hover] ?? 0)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function ChartLegend({ series }: { series: ChartSeries[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {series.map((entry) => (
        <span key={entry.key} className="flex items-center gap-1.5 text-xs text-zinc-600">
          <span
            className="h-2 w-2 rounded-[3px]"
            style={{ backgroundColor: CHART_COLORS[entry.color] }}
          />
          {entry.label}
        </span>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Bars                                                                        */
/* -------------------------------------------------------------------------- */

/** Compact distribution histogram, e.g. how fit scores cluster across a corpus. */
export function BarGroup({
  bars,
  height = 96,
  delay = 0,
  formatValue = (n) => String(n),
}: {
  bars: Array<{ label: string; value: number; tone?: Tone }>;
  height?: number;
  delay?: number;
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(1, ...bars.map((bar) => bar.value));

  return (
    <div className="flex gap-2" style={{ height }}>
      {bars.map((bar, index) => (
        <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <span className="tnum text-[10px] font-medium text-zinc-500">
            {formatValue(bar.value)}
          </span>
          {/* Absolute positioning so the bar's percentage height resolves
              against the track rather than against an auto-sized parent. */}
          <div className="relative w-full flex-1 border-b border-zinc-200">
            <div
              className="bar-grow absolute inset-x-0 bottom-0 rounded-t-[3px]"
              style={{
                height: bar.value === 0 ? 0 : `${Math.max(4, (bar.value / max) * 100)}%`,
                backgroundColor: TONE_HEX[bar.tone ?? "brand"],
                animationDelay: `${delay + index * 70}ms`,
              }}
            />
          </div>
          <span className="w-full truncate text-center text-[10px] text-zinc-500">
            {bar.label}
          </span>
        </div>
      ))}
    </div>
  );
}
