import type { ReactNode } from "react";
import Link from "next/link";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/jobs", label: "Jobs" },
  { href: "/growth", label: "Growth" },
  { href: "/networking", label: "Networking" },
  { href: "/outreach", label: "Outreach" },
  { href: "/dossier", label: "Dossier" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full bg-zinc-50 text-zinc-950">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white px-5 py-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Matchr
        </Link>
        <p className="mt-1 text-xs text-zinc-500">Career copilot</p>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
