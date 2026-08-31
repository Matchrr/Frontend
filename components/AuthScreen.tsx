import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function AuthScreen({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white">
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-zinc-950">Matchr</p>
            <p className="text-[11px] text-zinc-500">Precision career copilot</p>
          </div>
        </div>

        <section className="rounded-2xl border border-line bg-surface p-6 shadow-card">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-950">{title}</h1>
          <p className="mt-1.5 text-sm leading-6 text-zinc-600">{description}</p>
          {children}
        </section>
      </div>
    </div>
  );
}
