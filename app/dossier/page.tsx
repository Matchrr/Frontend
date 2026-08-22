"use client";

import {
  Check,
  Copy,
  Download,
  FileText,
  MessageSquareQuote,
  PenLine,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { useProfile } from "@/components/ProfileProvider";
import {
  Badge,
  Button,
  Callout,
  Card,
  EmptyState,
  ErrorNote,
  IconTile,
  PageHeader,
  Reveal,
  SectionHeader,
  Skeleton,
  cx,
} from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import type { Dossier } from "@/lib/types";

function toPlainText(dossier: Dossier): string {
  const bullets = dossier.tailored_bullets.map((bullet) => `- ${bullet.tailored}`).join("\n");
  const ats = dossier.ats_answers
    .map((answer) => `Q: ${answer.question}\nA: ${answer.answer}`)
    .join("\n\n");
  return [
    `MATCHR DOSSIER — ${dossier.job_title} at ${dossier.company}`,
    `Generated ${dossier.generated_at}`,
    "",
    "POSITIONING",
    dossier.summary,
    "",
    "TAILORED RESUME BULLETS",
    bullets,
    "",
    "COVER LETTER",
    dossier.cover_letter,
    "",
    "ATS SCREENING ANSWERS",
    ats,
    "",
    `GROUNDING: ${dossier.grounding.note}`,
  ].join("\n");
}

function download(dossier: Dossier) {
  const blob = new Blob([toPlainText(dossier)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `matchr-${dossier.company.toLowerCase().replace(/\W+/g, "-")}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

const DELIVERABLES = [
  {
    icon: <PenLine className="h-4 w-4" />,
    title: "Tailored resume bullets",
    body: "Reordered by relevance to this posting, with measured impact moved to the front.",
  },
  {
    icon: <FileText className="h-4 w-4" />,
    title: "Cover letter",
    body: "A narrative built from projects and metrics that already exist in your profile.",
  },
  {
    icon: <MessageSquareQuote className="h-4 w-4" />,
    title: "ATS screening answers",
    body: "Pre-written, so the application form is not where you improvise.",
  },
];

function DossierWorkspace() {
  const searchParams = useSearchParams();
  const { candidate, initializing, refresh: refreshProfile } = useProfile();
  const grounded = candidate?.grounded ?? false;

  const {
    data: applications,
    loading,
    reload: reloadApplications,
  } = useAsync(() => api.applications(), String(grounded));
  const [picked, setPicked] = useState<string | null>(null);
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Explicit click wins, then the ?job= deep link, then the first target.
  const requested = searchParams.get("job");
  const deepLinked =
    requested && applications?.some((app) => app.job_id === requested) ? requested : null;
  const selected = picked ?? deepLinked ?? applications?.[0]?.job_id ?? null;

  async function generate(jobId: string) {
    setGenerating(true);
    setError(null);
    try {
      setDossier(await api.generateDossier(jobId));
      await Promise.all([reloadApplications(), refreshProfile()]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not generate the dossier.");
    } finally {
      setGenerating(false);
    }
  }

  // Without this the ungrounded empty state flashes before the profile lands.
  if (initializing) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!grounded) {
    return (
      <EmptyState
        icon={<ShieldCheck className="h-5 w-5" />}
        title="Ground your profile first"
        description="Tailoring only rearranges facts you have already verified. Without a Ground Truth Profile there is nothing safe to write from."
        action={
          <Link href="/profile">
            <Button>Ground your profile</Button>
          </Link>
        }
      />
    );
  }

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!applications || applications.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-5 w-5" />}
        title="No targeted roles yet"
        description="Pick 3–5 high-fit roles on the Job matches page. Dossiers are generated per role, because a generic dossier is exactly what Matchr is built to avoid."
        action={
          <Link href="/jobs">
            <Button>Choose targets</Button>
          </Link>
        }
      />
    );
  }

  const active = applications.find((app) => app.job_id === selected);

  return (
    <div className="grid gap-3 lg:grid-cols-[248px_1fr]">
      <Reveal delay={40}>
        <Card className="h-fit p-2">
          <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Targeted roles
          </p>
          <div className="flex flex-col gap-0.5">
            {applications.map((application) => {
              const isActive = selected === application.job_id;
              return (
                <button
                  key={application.job_id}
                  type="button"
                  onClick={() => {
                    setPicked(application.job_id);
                    setDossier(null);
                    setError(null);
                  }}
                  className={cx(
                    "rounded-lg px-2.5 py-2 text-left transition-colors",
                    isActive
                      ? "bg-zinc-100 text-zinc-950"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{application.company}</span>
                    {application.status === "dossier_ready" ? (
                      <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-600" />
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-zinc-500">
                    {application.job_title}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      </Reveal>

      <div className="min-w-0">
        {error ? (
          <div className="mb-3">
            <ErrorNote message={error} />
          </div>
        ) : null}

        {!dossier ? (
          <Reveal delay={100}>
            <Card className="overflow-hidden">
              <div className="border-b border-line bg-gradient-to-br from-brand-50 via-surface to-surface px-5 py-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-lg">
                    <div className="flex items-center gap-2">
                      <IconTile tone="brand" size="sm">
                        <Sparkles className="h-4 w-4" />
                      </IconTile>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                        {active?.company ?? "Select a role"}
                      </p>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold tracking-tight text-zinc-950">
                      {active?.job_title}
                    </h2>
                    <p className="mt-1.5 text-sm leading-6 text-zinc-600">
                      Matchr reorders and re-emphasizes the bullets you already wrote, drafts a
                      cover letter from verified facts, and pre-answers the screening questions.
                      Then it re-reads its own output and rejects any technical claim your profile
                      does not support.
                    </p>
                  </div>
                  <Button
                    loading={generating}
                    disabled={!selected}
                    onClick={() => selected && generate(selected)}
                  >
                    {generating ? "Generating…" : "Generate dossier"}
                  </Button>
                </div>
              </div>

              <div className="grid divide-y divide-zinc-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {DELIVERABLES.map((item) => (
                  <div key={item.title} className="px-5 py-5">
                    <IconTile tone="neutral">{item.icon}</IconTile>
                    <p className="mt-3 text-sm font-medium text-zinc-900">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">{item.body}</p>
                  </div>
                ))}
              </div>
            </Card>
          </Reveal>
        ) : (
          <div className="space-y-3">
            <Reveal>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold tracking-tight text-zinc-950">
                      {dossier.job_title}
                    </h2>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {dossier.company} · generated {formatDateTime(dossier.generated_at)}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-zinc-700">{dossier.summary}</p>
                  </div>
                  <Badge tone={dossier.grounding.passed ? "positive" : "danger"} dot>
                    {dossier.grounding.passed ? "Grounding verified" : "Grounding failed"}
                  </Badge>
                </div>

                <Callout
                  className="mt-4"
                  tone={dossier.grounding.passed ? "positive" : "danger"}
                  icon={
                    dossier.grounding.passed ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <ShieldAlert className="h-4 w-4" />
                    )
                  }
                >
                  {dossier.grounding.note}
                </Callout>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => download(dossier)}>
                    <Download className="h-3.5 w-3.5" />
                    Download dossier
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={generating}
                    disabled={generating}
                    onClick={() => selected && generate(selected)}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Regenerate
                  </Button>
                  <Link href={`/outreach?job=${dossier.job_id}`}>
                    <Button size="sm" variant="ghost">
                      <Send className="h-3.5 w-3.5" />
                      Draft outreach
                    </Button>
                  </Link>
                </div>
              </Card>
            </Reveal>

            <Reveal delay={70}>
              <Card className="p-5">
                <SectionHeader
                  icon={<PenLine className="h-3.5 w-3.5" />}
                  tone="brand"
                  title="Tailored resume bullets"
                  description="Rewrites move measured impact to the front — no new words about work you did not do."
                  action={
                    <CopyButton
                      label="Copy bullets"
                      text={dossier.tailored_bullets.map((b) => `- ${b.tailored}`).join("\n")}
                    />
                  }
                />
                <ul className="mt-4 space-y-2.5">
                  {dossier.tailored_bullets.map((bullet) => (
                    <li
                      key={bullet.original}
                      className="rounded-lg border border-line px-3.5 py-3"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        {bullet.changed ? (
                          <Badge tone="brand">Rewritten</Badge>
                        ) : (
                          <Badge>Kept as written</Badge>
                        )}
                        {bullet.emphasized_skills.map((skill) => (
                          <Badge key={skill} tone="positive">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-zinc-900">{bullet.tailored}</p>
                      {bullet.changed ? (
                        <p className="mt-1.5 border-l-2 border-zinc-200 pl-2.5 text-sm leading-6 text-zinc-400">
                          {bullet.original}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>

            <Reveal delay={140}>
              <Card className="p-5">
                <SectionHeader
                  icon={<FileText className="h-3.5 w-3.5" />}
                  tone="info"
                  title="Cover letter"
                  description="RAG over your own projects, nothing else."
                  action={<CopyButton label="Copy letter" text={dossier.cover_letter} />}
                />
                <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-surface-muted px-4 py-3.5 font-sans text-sm leading-6 text-zinc-800">
                  {dossier.cover_letter}
                </pre>
              </Card>
            </Reveal>

            <Reveal delay={210}>
              <Card className="p-5">
                <SectionHeader
                  icon={<MessageSquareQuote className="h-3.5 w-3.5" />}
                  tone="warning"
                  title="ATS screening answers"
                  description="Pre-written from your verified history."
                />
                <dl className="mt-4 divide-y divide-zinc-100">
                  {dossier.ats_answers.map((answer) => (
                    <div key={answer.question} className="py-3.5 first:pt-0 last:pb-0">
                      <dt className="text-sm font-medium text-zinc-900">{answer.question}</dt>
                      <dd className="mt-1 text-sm leading-6 text-zinc-600">{answer.answer}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            </Reveal>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DossierPage() {
  return (
    <div>
      <PageHeader
        title="Dossier"
        description="A tailored resume, cover letter, and ATS answer set per targeted role — generated only from facts your profile already contains, then verified against it."
      />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <DossierWorkspace />
      </Suspense>
    </div>
  );
}
