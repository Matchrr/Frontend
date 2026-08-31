"use client";

import {
  ChevronsLeft,
  ChevronsRight,
  LogIn,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

import { CommandPalette, useCommandPalette } from "@/components/CommandPalette";
import { useAuth } from "@/components/AuthProvider";
import { ProfileProvider, useProfile } from "@/components/ProfileProvider";
import { Button, ButtonLink, LiveDot, Reveal, cx } from "@/components/ui";
import { api } from "@/lib/api";
import { relativeTime } from "@/lib/format";
import { NAV_GROUPS, findNavItem } from "@/lib/nav";
import type { Overview } from "@/lib/types";

const COLLAPSE_KEY = "matchr:sidebar-collapsed";

/**
 * The sidebar collapse preference lives in localStorage, which the server
 * cannot see. Reading it through a store keeps the server snapshot `false` so
 * hydration matches, then swaps in the stored value on the client.
 */
const collapseListeners = new Set<() => void>();

function subscribeCollapse(onChange: () => void) {
  collapseListeners.add(onChange);
  return () => {
    collapseListeners.delete(onChange);
  };
}

function getCollapsed(): boolean {
  return window.localStorage.getItem(COLLAPSE_KEY) === "1";
}

function setCollapsedPreference(next: boolean) {
  window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  collapseListeners.forEach((listener) => listener());
}

function initials(name: string | null | undefined): string {
  if (!name) return "M";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/* -------------------------------------------------------------------------- */
/* Sidebar                                                                     */
/* -------------------------------------------------------------------------- */

function BrandMark() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white">
      <Sparkles className="h-4 w-4" strokeWidth={2.25} />
    </span>
  );
}

function NavLink({
  href,
  label,
  hint,
  icon: Icon,
  count,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  count: number | null;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? `${label} — ${hint}` : undefined}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cx(
        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "border border-line bg-surface text-zinc-950 shadow-card"
          : "border border-transparent text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900",
      )}
    >
      <Icon
        className={cx("h-4 w-4 shrink-0", active ? "text-brand-600" : "text-zinc-500")}
        strokeWidth={2}
      />
      {collapsed ? null : (
        <>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>
          {count ? (
            <span
              className={cx(
                "tnum shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
                active ? "bg-brand-50 text-brand-700" : "bg-zinc-200/70 text-zinc-600",
              )}
            >
              {count}
            </span>
          ) : null}
        </>
      )}
    </Link>
  );
}

function ProfileStrengthCard({ overview }: { overview: Overview | null }) {
  const completeness = overview?.profile_completeness ?? 0;
  const action = overview?.next_action;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setWidth(completeness), 250);
    return () => window.clearTimeout(timer);
  }, [completeness]);

  return (
    <div className="rounded-xl border border-line bg-surface p-3 shadow-card">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-zinc-900">Profile strength</p>
        <span className="tnum text-xs font-semibold text-zinc-900">{completeness}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-brand-500 transition-[width] duration-[900ms] ease-[cubic-bezier(0.33,1,0.68,1)]"
          style={{ width: `${width}%` }}
        />
      </div>
      {action ? (
        <>
          <p className="mt-2.5 text-xs font-medium text-zinc-800">{action.label}</p>
          <p className="mt-0.5 line-clamp-3 text-xs leading-5 text-zinc-500">
            {action.description}
          </p>
          <Link href={action.href} className="mt-2.5 block">
            <Button size="xs" className="w-full">
              {action.cta}
            </Button>
          </Link>
        </>
      ) : null}
    </div>
  );
}

function SidebarContent({
  collapsed,
  onToggleCollapse,
  onOpenPalette,
  onNavigate,
}: {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onOpenPalette: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { candidate, overview } = useProfile();
  const { user, logout } = useAuth();

  return (
    <>
      <div className={cx("flex items-center gap-2.5", collapsed ? "justify-center" : "px-1.5")}>
        <BrandMark />
        {collapsed ? null : (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight text-zinc-950">Matchr</p>
            <p className="truncate text-[11px] text-zinc-500">Precision career copilot</p>
          </div>
        )}
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-200/60 hover:text-zinc-700 lg:inline-flex"
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onOpenPalette}
        className={cx(
          "mt-4 flex items-center gap-2 rounded-lg border border-line bg-surface/70 text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700",
          collapsed ? "justify-center px-0 py-2" : "px-2.5 py-2",
        )}
      >
        <Search className="h-4 w-4 shrink-0" />
        {collapsed ? null : (
          <>
            <span className="flex-1 text-left text-sm">Search</span>
            <kbd className="rounded border border-line px-1 py-0.5 text-[10px] font-medium">
              ⌘K
            </kbd>
          </>
        )}
      </button>

      <nav className="mt-5 flex-1 space-y-5 overflow-y-auto scroll-slim">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-zinc-200" />
            ) : (
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                {group.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  hint={item.hint}
                  icon={item.icon}
                  count={item.badge?.(overview) ?? null}
                  active={pathname === item.href}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-4 space-y-2.5">
        {collapsed ? null : <ProfileStrengthCard overview={overview} />}
        <div
          className={cx(
            "flex items-center gap-2.5 rounded-lg px-1.5 py-1.5",
            collapsed && "justify-center px-0",
          )}
        >
          {candidate?.picture_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={candidate.picture_url}
              alt=""
              className="h-7 w-7 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="tnum flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-semibold text-white">
              {initials(candidate?.full_name)}
            </span>
          )}
          {collapsed ? null : (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-900">
                {candidate?.full_name ?? user?.name ?? user?.email ?? "Not grounded yet"}
              </p>
              <p className="truncate text-[11px] text-zinc-500">
                {candidate?.target_title ?? user?.email ?? "No target role set"}
              </p>
            </div>
          )}
        </div>
        {collapsed ? (
          user ? (
            <button
              type="button"
              onClick={() => void logout()}
              aria-label="Log out"
              className="flex h-8 w-full items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href="/login"
              aria-label="Sign in"
              className="flex h-8 w-full items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700"
            >
              <LogIn className="h-4 w-4" />
            </Link>
          )
        ) : user ? (
          <Button variant="ghost" size="xs" className="w-full justify-start" onClick={() => void logout()}>
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </Button>
        ) : (
          <ButtonLink href="/login" variant="secondary" size="xs" className="w-full">
            <LogIn className="h-3.5 w-3.5" />
            Sign in
          </ButtonLink>
        )}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Topbar                                                                      */
/* -------------------------------------------------------------------------- */

function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const pathname = usePathname();
  const { overview, refresh } = useProfile();
  const item = findNavItem(pathname);
  const [syncing, setSyncing] = useState(false);

  async function sync() {
    setSyncing(true);
    try {
      await api.syncJobs();
      await refresh();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 rounded-t-2xl border-b border-line bg-surface/85 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="-ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 lg:hidden"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
        {item ? <item.icon className="hidden h-4 w-4 shrink-0 text-zinc-400 sm:block" /> : null}
        <p className="truncate text-sm font-medium text-zinc-900">{item?.label ?? "Matchr"}</p>
        {item?.hint ? (
          <>
            <span className="hidden text-zinc-300 sm:inline">/</span>
            <p className="hidden truncate text-xs text-zinc-500 sm:block">{item.hint}</p>
          </>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden items-center gap-1.5 text-xs text-zinc-500 md:flex">
          <LiveDot tone={overview?.grounded ? "positive" : "warning"} />
          {overview?.last_sync
            ? `synced ${relativeTime(overview.last_sync)}`
            : "not yet synced"}
        </span>
        <Button variant="secondary" size="sm" onClick={sync} disabled={syncing}>
          <RefreshCw className={cx("h-3.5 w-3.5", syncing && "animate-spin")} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Shell                                                                       */
/* -------------------------------------------------------------------------- */

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { refresh } = useProfile();
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette();
  const collapsed = useSyncExternalStore(subscribeCollapse, getCollapsed, () => false);
  const [mobileNav, setMobileNav] = useState(false);

  function toggleCollapse() {
    setCollapsedPreference(!collapsed);
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside
        className={cx(
          "sticky top-0 hidden h-screen shrink-0 flex-col px-3 py-4 transition-[width] duration-300 ease-out lg:flex",
          collapsed ? "w-[76px]" : "w-[252px]",
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          onOpenPalette={() => setPaletteOpen(true)}
        />
      </aside>

      {mobileNav ? (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/30 lg:hidden"
          onClick={() => setMobileNav(false)}
          role="presentation"
        >
          <div
            className="flex h-full w-[264px] flex-col bg-canvas px-3 py-4 shadow-pop animate-[var(--animate-reveal-left)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setMobileNav(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-4 inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-200/60"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent
              collapsed={false}
              onOpenPalette={() => {
                setMobileNav(false);
                setPaletteOpen(true);
              }}
              onNavigate={() => setMobileNav(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="min-w-0 flex-1 p-2.5 lg:pl-0">
        <div className="flex min-h-[calc(100vh-1.25rem)] flex-col rounded-2xl border border-line bg-surface shadow-card">
          <Topbar onOpenMobileNav={() => setMobileNav(true)} />
          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Reveal key={pathname} className="mx-auto w-full max-w-6xl" variant="fade">
              {children}
            </Reveal>
          </div>
        </div>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onRefresh={refresh}
      />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, required } = useAuth();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (!ready || isLogin) return;
    if (required && !user) router.replace("/login");
  }, [ready, required, user, isLogin, router]);

  if (isLogin) {
    return <>{children}</>;
  }

  if (!ready || (required && !user)) {
    return <ShellSkeleton />;
  }

  return (
    <ProfileProvider>
      <Shell>{children}</Shell>
    </ProfileProvider>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="hidden w-[252px] shrink-0 lg:block" />
      <div className="min-w-0 flex-1 p-2.5 lg:pl-0">
        <div className="flex min-h-[calc(100vh-1.25rem)] items-center justify-center rounded-2xl border border-line bg-surface shadow-card">
          <p className="text-sm text-zinc-500">Loading session…</p>
        </div>
      </div>
    </div>
  );
}
