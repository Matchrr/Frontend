"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";

import { TickMeter } from "@/components/ui/charts";
import { CountUp } from "@/components/ui/motion";
import { Card, IconTile, cx, type Tone } from "@/components/ui/primitives";

/* -------------------------------------------------------------------------- */
/* Headers                                                                     */
/* -------------------------------------------------------------------------- */

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow ? <div className="mb-2 flex items-center gap-2">{eyebrow}</div> : null}
        <h1 className="text-xl font-semibold tracking-tight text-zinc-950">{title}</h1>
        {description ? (
          <p className="mt-1.5 text-sm leading-6 text-zinc-600">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function SectionHeader({
  title,
  description,
  icon,
  tone = "neutral",
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  tone?: Tone;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 items-start gap-2.5">
        {icon ? (
          <IconTile tone={tone} size="sm">
            {icon}
          </IconTile>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-zinc-500">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stats                                                                       */
/* -------------------------------------------------------------------------- */

export function DeltaChip({
  direction,
  children,
}: {
  direction: "up" | "down" | "flat";
  children: ReactNode;
}) {
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  const color =
    direction === "up"
      ? "text-emerald-600"
      : direction === "down"
        ? "text-rose-600"
        : "text-zinc-500";
  return (
    <span className={cx("inline-flex items-center gap-1 text-xs font-medium", color)}>
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {children}
    </span>
  );
}

/**
 * Headline metric card: label, animated value, capacity meter, and a footnote
 * that says what the number is relative to.
 */
export function StatCard({
  label,
  value,
  format,
  suffix,
  icon,
  tone = "brand",
  meterPercent,
  footnote,
  delay = 0,
}: {
  label: string;
  value: number;
  format?: (value: number) => string;
  suffix?: string;
  icon?: ReactNode;
  tone?: Tone;
  meterPercent?: number;
  footnote?: ReactNode;
  delay?: number;
}) {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-center gap-2">
        {icon ? (
          <IconTile tone={tone} size="sm">
            {icon}
          </IconTile>
        ) : null}
        <p className="truncate text-xs font-medium text-zinc-600">{label}</p>
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
        <CountUp value={value} delay={delay} format={format} />
        {suffix ? <span className="text-lg text-zinc-400">{suffix}</span> : null}
      </p>

      {meterPercent !== undefined ? (
        <div className="mt-2.5">
          <TickMeter percent={meterPercent} tone={tone} delay={delay} />
        </div>
      ) : null}

      {footnote ? (
        <div className="mt-2.5 flex flex-1 items-end text-xs leading-5 text-zinc-500">
          <span>{footnote}</span>
        </div>
      ) : null}
    </Card>
  );
}

/** Compact metric for dense strips where a full StatCard would be too heavy. */
export function Stat({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
}) {
  return (
    <Card className="h-full px-4 py-3.5">
      <div className="flex items-center gap-2">
        {icon ? (
          <IconTile tone={tone} size="sm">
            {icon}
          </IconTile>
        ) : null}
        <p className="truncate text-xs font-medium text-zinc-600">{label}</p>
      </div>
      <p className="tnum mt-2 text-xl font-semibold text-zinc-950">{value}</p>
      {hint ? <div className="mt-0.5 text-xs leading-5 text-zinc-500">{hint}</div> : null}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Timeline                                                                    */
/* -------------------------------------------------------------------------- */

export type TimelineItem = {
  id: string;
  title: string;
  detail?: string;
  at?: string;
  tone?: Tone;
  icon?: ReactNode;
};

const MARKER_TONES: Record<Tone, string> = {
  neutral: "border-zinc-200 bg-zinc-100 text-zinc-500",
  brand: "border-brand-200 bg-brand-50 text-brand-600",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-600",
  warning: "border-amber-200 bg-amber-50 text-amber-600",
  info: "border-sky-200 bg-sky-50 text-sky-600",
  danger: "border-rose-200 bg-rose-50 text-rose-600",
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative">
      {items.map((item, index) => (
        <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
          {index < items.length - 1 ? (
            <span
              className="absolute left-[11px] top-6 bottom-0 w-px bg-zinc-200"
              aria-hidden
            />
          ) : null}
          <span
            className={cx(
              "relative z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border",
              MARKER_TONES[item.tone ?? "neutral"],
            )}
          >
            {item.icon ?? <span className="h-1.5 w-1.5 rounded-full bg-current" />}
          </span>
          <div className="-mt-0.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="truncate text-sm font-medium text-zinc-900">{item.title}</p>
              {item.at ? <p className="shrink-0 text-xs text-zinc-400">{item.at}</p> : null}
            </div>
            {item.detail ? (
              <p className="mt-0.5 text-xs leading-5 text-zinc-500">{item.detail}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
