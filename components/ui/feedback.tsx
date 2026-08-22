import type { ReactNode } from "react";

import { Card, IconTile, cx, type Tone } from "@/components/ui/primitives";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("shimmer rounded-lg", className)} />;
}

export function SkeletonList({ rows = 3, height = "h-28" }: { rows?: number; height?: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className={cx("w-full", height)} />
      ))}
    </div>
  );
}

/** Loading shape for a stat strip, so the layout does not jump when data lands. */
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-32 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon ? (
        <IconTile tone="neutral" size="lg">
          {icon}
        </IconTile>
      ) : null}
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      <p className="max-w-md text-sm leading-6 text-zinc-600">{description}</p>
      {action ? <div className="mt-1">{action}</div> : null}
    </Card>
  );
}

export function ErrorNote({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
    >
      <span>{message}</span>
      {action}
    </div>
  );
}

const CALLOUT_TONES: Record<Tone, string> = {
  neutral: "border-zinc-200 bg-zinc-50 text-zinc-800",
  brand: "border-brand-100 bg-brand-50/70 text-brand-950",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
  danger: "border-rose-200 bg-rose-50 text-rose-900",
};

/** Short piece of reasoning attached to a result, like "why this match". */
export function Callout({
  label,
  children,
  tone = "brand",
  icon,
  className,
}: {
  label?: string;
  children: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex gap-2.5 rounded-lg border px-3 py-2.5 text-sm leading-6",
        CALLOUT_TONES[tone],
        className,
      )}
    >
      {icon ? <span className="mt-1 shrink-0 opacity-70">{icon}</span> : null}
      <p className="min-w-0">
        {label ? <span className="font-medium">{label} </span> : null}
        {children}
      </p>
    </div>
  );
}
