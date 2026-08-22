"use client";

import {
  CheckCircle2,
  Inbox,
  Mail,
  PenLine,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
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
  PageHeader,
  Reveal,
  SectionHeader,
  Skeleton,
  cx,
  fieldClass,
} from "@/components/ui";
import { api } from "@/lib/api";
import { relativeTime } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";

function ComposeWorkspace() {
  const searchParams = useSearchParams();
  const { candidate, initializing, refresh: refreshProfile } = useProfile();
  const grounded = candidate?.grounded ?? false;

  const { data: applications } = useAsync(() => api.applications(), String(grounded));
  const { data: threads, setData: setThreads } = useAsync(() => api.threads(), String(grounded));

  const [pickedJobId, setPickedJobId] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [context, setContext] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [facts, setFacts] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  // An explicit selection wins over the ?job= deep link.
  const jobId = pickedJobId ?? searchParams.get("job") ?? "";

  async function generateDraft() {
    setBusy("draft");
    setError(null);
    setConfirmation(null);
    try {
      const draft = await api.draftOutreach({
        recipient_email: recipientEmail.trim(),
        recipient_name: recipientName.trim() || undefined,
        job_id: jobId || undefined,
        extra_context: context.trim() || undefined,
      });
      setSubject(draft.subject);
      setBody(draft.body);
      setFacts(draft.grounded_facts);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not generate a draft.");
    } finally {
      setBusy(null);
    }
  }

  async function send() {
    setBusy("send");
    setError(null);
    try {
      const recipient = recipientEmail.trim();
      await api.sendOutreach({ recipient_email: recipient, subject, body, job_id: jobId || undefined });
      setThreads(await api.threads());
      setSubject("");
      setBody("");
      setFacts([]);
      setConfirmation(recipient);
      await refreshProfile();
      window.setTimeout(() => setConfirmation(null), 4000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send.");
    } finally {
      setBusy(null);
    }
  }

  // Without this the ungrounded empty state flashes before the profile lands.
  if (initializing) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!grounded) {
    return (
      <EmptyState
        icon={<Send className="h-5 w-5" />}
        title="Ground your profile first"
        description="Outreach drafts cite your verified history and a specific role's Fit Scorecard. Without those, the draft would be the generic template Matchr exists to replace."
        action={
          <Link href="/profile">
            <Button>Ground your profile</Button>
          </Link>
        }
      />
    );
  }

  const canDraft = recipientEmail.includes("@") && busy === null;
  const canSend = subject.trim().length > 0 && body.trim().length > 0 && busy === null;
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const hasDraft = Boolean(subject || body);

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {error ? <ErrorNote message={error} /> : null}
        {confirmation ? (
          <Callout tone="positive" icon={<CheckCircle2 className="h-4 w-4" />}>
            <span className="font-medium">Sent to {confirmation}.</span> It is logged in your
            thread list so follow-ups stay intentional.
          </Callout>
        ) : null}

        <Reveal delay={40}>
          <Card className="p-5">
            <SectionHeader
              icon={<UserRound className="h-3.5 w-3.5" />}
              tone="info"
              title="Recipient"
              description="A person and a specific role. Both make the draft sharper."
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label>
                <span className="text-xs font-medium text-zinc-700">Email</span>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(event) => setRecipientEmail(event.target.value)}
                  placeholder="hiring.manager@company.com"
                  className={cx(fieldClass, "mt-1")}
                />
              </label>
              <label>
                <span className="text-xs font-medium text-zinc-700">Name (optional)</span>
                <input
                  value={recipientName}
                  onChange={(event) => setRecipientName(event.target.value)}
                  placeholder="Maya Chen"
                  className={cx(fieldClass, "mt-1")}
                />
              </label>
              <label>
                <span className="text-xs font-medium text-zinc-700">Role context</span>
                <select
                  value={jobId}
                  onChange={(event) => setPickedJobId(event.target.value)}
                  className={cx(fieldClass, "mt-1")}
                >
                  <option value="">No specific role</option>
                  {applications?.map((application) => (
                    <option key={application.job_id} value={application.job_id}>
                      {application.company} — {application.job_title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-xs font-medium text-zinc-700">
                  Anything to add (optional)
                </span>
                <input
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                  placeholder="We met at PGConf last year."
                  className={cx(fieldClass, "mt-1")}
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button loading={busy === "draft"} disabled={!canDraft} onClick={generateDraft}>
                <Sparkles className="h-4 w-4" />
                Generate draft
              </Button>
              {applications && applications.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  Target a role on Job matches to ground the draft in a real Fit Scorecard.
                </p>
              ) : null}
            </div>
          </Card>
        </Reveal>

        {hasDraft ? (
          <Reveal>
            <Card className="p-5">
              <SectionHeader
                icon={<PenLine className="h-3.5 w-3.5" />}
                tone="warning"
                title="Review and edit"
                description="This is the approval gate. Nothing leaves until you press send."
                action={
                  <Badge tone="warning" dot>
                    Awaiting your approval
                  </Badge>
                }
              />

              {facts.length > 0 ? (
                <div className="mt-4 rounded-lg border border-line bg-surface-muted px-3.5 py-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    <ShieldCheck className="h-3 w-3" />
                    Grounded in
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {facts.map((fact) => (
                      <li
                        key={fact}
                        className="flex gap-2 text-sm leading-6 text-zinc-700"
                      >
                        <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-zinc-400" />
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <label className="mt-4 block">
                <span className="text-xs font-medium text-zinc-700">Subject</span>
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className={cx(fieldClass, "mt-1 font-medium")}
                />
              </label>
              <label className="mt-3 block">
                <span className="flex items-baseline justify-between text-xs font-medium text-zinc-700">
                  Body
                  <span
                    className={cx(
                      "tnum font-normal",
                      wordCount > 180 ? "text-amber-600" : "text-zinc-400",
                    )}
                  >
                    {wordCount} words
                    {wordCount > 180 ? " — long for a cold email" : ""}
                  </span>
                </span>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={14}
                  className={cx(fieldClass, "mt-1 font-sans leading-6")}
                />
              </label>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button loading={busy === "send"} disabled={!canSend} onClick={send}>
                  <Send className="h-4 w-4" />
                  Approve and send via Gmail
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSubject("");
                    setBody("");
                    setFacts([]);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Discard
                </Button>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Gmail OAuth is not wired up in this build, so sends are recorded locally rather
                than delivered.
              </p>
            </Card>
          </Reveal>
        ) : null}
      </div>

      <Reveal delay={100}>
        <Card className="h-full p-5">
          <SectionHeader
            icon={<Inbox className="h-3.5 w-3.5" />}
            tone="positive"
            title="Sent"
            description="A handful of specific emails, not a campaign."
          />
          {threads && threads.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {threads.map((thread) => (
                <li key={thread.id} className="rounded-lg border border-line px-3.5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900">
                      {thread.subject}
                    </p>
                    <span className="shrink-0 text-xs text-zinc-400">
                      {relativeTime(thread.sent_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
                    <Mail className="h-3 w-3" />
                    {thread.recipient_email}
                  </p>
                  {thread.job_title ? (
                    <p className="mt-1 truncate text-xs text-zinc-500">Re: {thread.job_title}</p>
                  ) : null}
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-500">
                    {thread.body}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-6 text-zinc-500">
              No outreach yet. One specific email to a person who owns the role beats another
              submission into an applicant tracking system.
            </p>
          )}
        </Card>
      </Reveal>
    </div>
  );
}

export default function OutreachPage() {
  return (
    <div>
      <PageHeader
        title="Outreach"
        description="Draft a short, specific cold email grounded in your profile and a role's Fit Scorecard. You edit it, you approve it, and it sends from your own inbox — never automatically."
      />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <ComposeWorkspace />
      </Suspense>
    </div>
  );
}
