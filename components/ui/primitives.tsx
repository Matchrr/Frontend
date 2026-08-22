import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export type Tone = "neutral" | "brand" | "positive" | "warning" | "info" | "danger";

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

export function Card({
  children,
  className,
  interactive = false,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  as?: "section" | "div" | "article" | "li";
}) {
  return (
    <Tag
      className={cx(
        "rounded-xl border border-line bg-surface shadow-card",
        interactive &&
          "transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-px hover:border-zinc-300 hover:shadow-panel",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Soft tinted square holding an icon — the recurring label mark across the app. */
const TILE_TONES: Record<Tone, string> = {
  neutral: "bg-zinc-100 text-zinc-600",
  brand: "bg-brand-50 text-brand-600",
  positive: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  info: "bg-sky-50 text-sky-600",
  danger: "bg-rose-50 text-rose-600",
};

export function IconTile({
  children,
  tone = "neutral",
  size = "md",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-lg",
        size === "sm" ? "h-6 w-6" : size === "lg" ? "h-10 w-10 rounded-xl" : "h-8 w-8",
        TILE_TONES[tone],
        className,
      )}
      aria-hidden
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Buttons                                                                     */
/* -------------------------------------------------------------------------- */

const BUTTON_VARIANTS = {
  primary: "bg-zinc-950 text-white hover:bg-zinc-800 disabled:hover:bg-zinc-950",
  brand: "bg-brand-600 text-white hover:bg-brand-700 disabled:hover:bg-brand-600",
  secondary: "border border-line bg-surface text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300",
  ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
  danger: "border border-rose-200 bg-surface text-rose-700 hover:bg-rose-50",
} as const;

const BUTTON_SIZES = {
  xs: "h-7 gap-1.5 px-2 text-xs",
  sm: "h-8 gap-1.5 px-2.5 text-xs",
  md: "h-9 gap-2 px-3.5 text-sm",
} as const;

type ButtonBase = {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
  loading?: boolean;
};

const BUTTON_BASE =
  "inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonBase & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cx(BUTTON_BASE, BUTTON_SIZES[size], BUTTON_VARIANTS[variant], className)}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

/** Same visual language as Button, for links that navigate rather than act. */
export function ButtonLink({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: ButtonBase & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      className={cx(BUTTON_BASE, BUTTON_SIZES[size], BUTTON_VARIANTS[variant], className)}
    >
      {children}
    </a>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cx("h-3.5 w-3.5 animate-spin", className)}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path
        d="M14.5 8a6.5 6.5 0 0 0-6.5-6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Badges                                                                      */
/* -------------------------------------------------------------------------- */

const BADGE_TONES: Record<Tone, string> = {
  neutral: "border-zinc-200 bg-zinc-50 text-zinc-700",
  brand: "border-brand-200 bg-brand-50 text-brand-700",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
};

const DOT_TONES: Record<Tone, string> = {
  neutral: "bg-zinc-400",
  brand: "bg-brand-500",
  positive: "bg-emerald-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
  danger: "bg-rose-500",
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        BADGE_TONES[tone],
        className,
      )}
    >
      {dot ? <span className={cx("h-1.5 w-1.5 rounded-full", DOT_TONES[tone])} /> : null}
      {children}
    </span>
  );
}

/** Pulsing dot for anything genuinely live, like an active sync. */
export function LiveDot({ tone = "positive" }: { tone?: Tone }) {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span
        className={cx("absolute inline-flex h-full w-full rounded-full opacity-60", DOT_TONES[tone])}
        style={{ animation: "var(--animate-ping-soft)" }}
      />
      <span className={cx("relative inline-flex h-1.5 w-1.5 rounded-full", DOT_TONES[tone])} />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Inputs                                                                      */
/* -------------------------------------------------------------------------- */

export const fieldClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-zinc-900 " +
  "placeholder:text-zinc-400 outline-none transition-[border-color,box-shadow] " +
  "focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="text-xs font-medium text-zinc-700">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-zinc-500">{hint}</span> : null}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* Tabs                                                                        */
/* -------------------------------------------------------------------------- */

export type TabItem<T extends string> = {
  value: T;
  label: string;
  count?: number;
  attention?: boolean;
};

export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: ReadonlyArray<TabItem<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cx(
        "inline-flex items-center gap-1 rounded-xl border border-line bg-surface p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cx(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-zinc-950 text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
            )}
          >
            {item.label}
            {item.count !== undefined ? (
              <span className={cx("tnum", active ? "text-zinc-400" : "text-zinc-400")}>
                {item.count}
              </span>
            ) : null}
            {item.attention ? <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> : null}
          </button>
        );
      })}
    </div>
  );
}
