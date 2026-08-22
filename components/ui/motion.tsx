"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

import { cx } from "@/components/ui/primitives";

/**
 * Entrance animations are CSS-driven and start on mount, so nothing here blocks
 * paint or ships a runtime animation library. `prefers-reduced-motion` is
 * handled globally in `globals.css`.
 */

const VARIANTS = {
  up: "animate-[var(--animate-reveal)]",
  left: "animate-[var(--animate-reveal-left)]",
  fade: "animate-[var(--animate-fade)]",
} as const;

export function Reveal({
  children,
  delay = 0,
  variant = "up",
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  /** Milliseconds to hold before the entrance starts. */
  delay?: number;
  variant?: keyof typeof VARIANTS;
  as?: ElementType;
  className?: string;
}) {
  return (
    <Tag className={cx(VARIANTS[variant], className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

/**
 * Reveals direct children one after another. `start` offsets the whole group so
 * sections further down the page can trail the ones above them.
 */
export function Stagger({
  children,
  start = 0,
  step = 60,
  variant = "up",
  as: Tag = "div",
  className,
  childClassName,
}: {
  children: ReactNode;
  start?: number;
  step?: number;
  variant?: keyof typeof VARIANTS;
  as?: ElementType;
  className?: string;
  childClassName?: string;
}) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <Tag className={className}>
      {items.flat().map((child, index) => (
        <Reveal
          key={index}
          delay={start + index * step}
          variant={variant}
          className={childClassName}
        >
          {child}
        </Reveal>
      ))}
    </Tag>
  );
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Decelerating curve: fast off the mark, long settle. Reads as a counter
// landing on a value rather than a linear tick.
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/** Animates from the previously displayed value to `value`. */
export function useCountUp(value: number, { duration = 900, delay = 0 } = {}): number {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;

    // Reduced motion still routes through the frame callback rather than
    // writing state synchronously here; it just lands on the first frame.
    const reduced = prefersReducedMotion();
    const span = reduced ? 0 : duration;

    let frame = 0;
    let startedAt = 0;

    const tick = (now: number) => {
      if (!startedAt) startedAt = now;
      const progress = span === 0 ? 1 : Math.min((now - startedAt) / span, 1);
      const next = from + (value - from) * easeOutExpo(progress);
      fromRef.current = next;
      setDisplay(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else fromRef.current = value;
    };

    const timer = window.setTimeout(
      () => {
        frame = requestAnimationFrame(tick);
      },
      reduced ? 0 : delay,
    );

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [value, duration, delay]);

  return display;
}

export function CountUp({
  value,
  duration,
  delay,
  format = (n) => Math.round(n).toLocaleString(),
  className,
}: {
  value: number;
  duration?: number;
  delay?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const display = useCountUp(value, { duration, delay });
  return (
    <span className={cx("tnum", className)} suppressHydrationWarning>
      {format(display)}
    </span>
  );
}
