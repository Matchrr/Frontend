"use client";

import { RefreshCw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cx } from "@/components/ui";
import { api } from "@/lib/api";
import { NAV_ITEMS } from "@/lib/nav";

type Command = {
  id: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void | Promise<void>;
};

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { open, setOpen };
}

export function CommandPalette({
  open,
  onClose,
  onRefresh,
}: {
  open: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}) {
  // Mounting the body only while open means query and cursor reset on every
  // open without an effect resetting them.
  if (!open) return null;
  return <Palette onClose={onClose} onRefresh={onRefresh} />;
}

function Palette({
  onClose,
  onRefresh,
}: {
  onClose: () => void;
  onRefresh: () => Promise<void>;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const commands: Command[] = [
    ...NAV_ITEMS.map((item) => ({
      id: item.href,
      label: item.label,
      hint: item.hint,
      icon: item.icon,
      run: () => router.push(item.href),
    })),
    {
      id: "sync",
      label: "Refresh listings",
      hint: "Re-score the live corpus",
      icon: RefreshCw,
      run: async () => {
        await api.syncJobs();
        await onRefresh();
      },
    },
  ];

  const needle = query.trim().toLowerCase();
  const results = needle
    ? commands.filter((command) =>
        `${command.label} ${command.hint}`.toLowerCase().includes(needle),
      )
    : commands;
  const active = Math.min(cursor, Math.max(results.length - 1, 0));

  async function select(command: Command | undefined) {
    if (!command) return;
    onClose();
    await command.run();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/20 p-4 pt-[12vh] backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-pop animate-[var(--animate-reveal)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-3.5">
          <Search className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            ref={inputRef}
            value={query}
            placeholder="Jump to a surface or run an action…"
            onChange={(event) => {
              setQuery(event.target.value);
              setCursor(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setCursor((previous) => (previous + 1) % Math.max(results.length, 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setCursor(
                  (previous) => (previous - 1 + results.length) % Math.max(results.length, 1),
                );
              } else if (event.key === "Enter") {
                event.preventDefault();
                void select(results[active]);
              }
            }}
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />
          <kbd className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
            esc
          </kbd>
        </div>

        <ul className="max-h-80 overflow-y-auto p-1.5 scroll-slim">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-zinc-500">No matches.</li>
          ) : (
            results.map((command, index) => (
              <li key={command.id}>
                <button
                  type="button"
                  onMouseEnter={() => setCursor(index)}
                  onClick={() => void select(command)}
                  className={cx(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                    index === active ? "bg-zinc-100" : "hover:bg-zinc-50",
                  )}
                >
                  <command.icon className="h-4 w-4 shrink-0 text-zinc-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-900">
                      {command.label}
                    </span>
                    <span className="block truncate text-xs text-zinc-500">{command.hint}</span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
