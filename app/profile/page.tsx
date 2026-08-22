"use client";

import {
  ArrowRight,
  Award,
  Briefcase,
  Building2,
  CheckCircle2,
  FileUp,
  GraduationCap,
  Layers,
  Link2,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { useProfile } from "@/components/ProfileProvider";
import {
  Badge,
  Button,
  Callout,
  Card,
  ErrorNote,
  IconTile,
  PageHeader,
  Reveal,
  ScoreRing,
  SectionHeader,
  Skeleton,
  Stagger,
  Stat,
  cx,
  fieldClass,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";

export default function ProfilePage() {
  const { candidate, overview, loading, error, refresh } = useProfile();
  const fileInput = useRef<HTMLInputElement>(null);
  const { data: integrations, reload: reloadIntegrations } = useAsync(() => api.integrations());

  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Edits override the fetched profile until they are saved, which keeps the
  // fields in sync with the server without an effect.
  const [edits, setEdits] = useState<{ targetTitle: string; location: string } | null>(null);
  const targetTitle = edits?.targetTitle ?? candidate?.target_title ?? "";
  const location = edits?.location ?? candidate?.location ?? "";
  const setTargetTitle = (value: string) => setEdits({ targetTitle: value, location });
  const setLocation = (value: string) => setEdits({ targetTitle, location: value });

  async function run(label: string, action: () => Promise<unknown>) {
    setBusy(label);
    setActionError(null);
    try {
      await action();
      await Promise.all([refresh(), reloadIntegrations()]);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function saveGoal() {
    await run("goal", () =>
      api.updateMe({ target_title: targetTitle.trim(), location: location.trim() }),
    );
    setEdits(null);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-80" />
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-52 w-full" />
        </div>
      </div>
    );
  }

  const grounded = candidate?.grounded ?? false;
  const completeness = overview?.profile_completeness ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow={
          grounded ? (
            <Badge tone="positive" dot>
              Grounded via {candidate?.grounding_sources.join(", ")}
            </Badge>
          ) : (
            <Badge tone="warning" dot>
              Not grounded
            </Badge>
          )
        }
        title={grounded ? "Ground Truth Profile" : "Get grounded"}
        description={
          grounded
            ? "Every match, growth recommendation, and generated document may only cite the facts below. Nothing downstream can invent experience you have not listed."
            : "Connect LinkedIn or upload a resume. Matchr extracts a verified career profile so you never fill out a form from scratch — and so no agent can hallucinate on your behalf."
        }
        actions={
          grounded ? (
            <Button
              variant="danger"
              size="sm"
              loading={busy === "reset"}
              disabled={busy !== null}
              onClick={() => run("reset", api.resetProfile)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset profile
            </Button>
          ) : null
        }
      />

      {error ? (
        <div className="mb-4">
          <ErrorNote message={error} />
        </div>
      ) : null}
      {actionError ? (
        <div className="mb-4">
          <ErrorNote message={actionError} />
        </div>
      ) : null}

      {/* Sources */}
      <Stagger className="grid gap-3 md:grid-cols-2" start={40} childClassName="h-full">
        <Card className="flex h-full flex-col p-5">
          <SectionHeader
            icon={<Link2 className="h-3.5 w-3.5" />}
            tone="info"
            title="LinkedIn"
            description="Inbound only — nothing is ever posted"
            action={
              candidate?.linkedin_connected ? (
                <Badge tone="positive" dot>
                  Connected
                </Badge>
              ) : null
            }
          />
          <p className="mt-3 flex-1 text-sm leading-6 text-zinc-600">
            The fast path. Pulls headline, experience, skills, and education straight into your
            profile — and you review everything before it becomes ground truth.
          </p>
          <div className="mt-4">
            <Button
              loading={busy === "linkedin"}
              disabled={busy !== null}
              onClick={() => run("linkedin", api.connectLinkedin)}
            >
              {candidate?.linkedin_connected ? "Re-import from LinkedIn" : "Connect LinkedIn"}
            </Button>
            <p className="mt-2 text-xs text-zinc-500">
              OAuth is not wired up in this build, so this imports a representative profile.
            </p>
          </div>
        </Card>

        <Card className="flex h-full flex-col p-5">
          <SectionHeader
            icon={<FileUp className="h-3.5 w-3.5" />}
            tone="brand"
            title="Resume upload"
            description="Optional enrichment or override path"
          />
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,text/plain,.txt,.md"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void run("resume", () => api.uploadResume(file));
              event.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => fileInput.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const file = event.dataTransfer.files?.[0];
              if (file) void run("resume", () => api.uploadResume(file));
            }}
            className={cx(
              "mt-3 flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-7 text-center transition-colors",
              dragging
                ? "border-brand-400 bg-brand-50/60"
                : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50",
              busy !== null && "cursor-not-allowed opacity-60",
            )}
          >
            <IconTile tone={dragging ? "brand" : "neutral"} size="lg">
              <FileUp className="h-4 w-4" />
            </IconTile>
            <span className="text-sm font-medium text-zinc-900">
              {busy === "resume" ? "Parsing…" : "Drop a resume or click to browse"}
            </span>
            <span className="text-xs text-zinc-500">
              PDF or plain text. Scanned PDFs need OCR, which is not wired up yet.
            </span>
          </button>
        </Card>
      </Stagger>

      {/* Career goal */}
      <Reveal delay={180} className="mt-3">
        <Card className="p-5">
          <SectionHeader
            icon={<Target className="h-3.5 w-3.5" />}
            tone="warning"
            title="Career goal"
            description="The single biggest lever on match quality"
          />
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Your target title drives job ranking, the skill-gap plan, and event compatibility.
            Changing it re-scores everything downstream.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="min-w-56 flex-1">
              <span className="text-xs font-medium text-zinc-700">Target title</span>
              <input
                value={targetTitle}
                onChange={(event) => setTargetTitle(event.target.value)}
                placeholder="Senior Backend Engineer"
                className={cx(fieldClass, "mt-1")}
              />
            </label>
            <label className="min-w-48 flex-1">
              <span className="text-xs font-medium text-zinc-700">Location</span>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="New York, NY"
                className={cx(fieldClass, "mt-1")}
              />
            </label>
            <Button loading={busy === "goal"} disabled={busy !== null} onClick={saveGoal}>
              Save goal
            </Button>
            {saved ? (
              <span className="inline-flex items-center gap-1 pb-2 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Saved
              </span>
            ) : null}
          </div>
        </Card>
      </Reveal>

      {grounded && candidate ? (
        <>
          {/* Completeness + counts */}
          <div className="mt-6 grid gap-3 lg:grid-cols-[280px_1fr]">
            <Reveal delay={240}>
              <Card className="flex h-full items-center gap-4 p-5">
                <ScoreRing
                  percent={completeness}
                  size={72}
                  tone={completeness >= 80 ? "positive" : "warning"}
                  delay={280}
                  label={`Profile ${completeness} percent complete`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">Profile strength</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {completeness >= 90
                      ? "Complete enough for every downstream agent to work from."
                      : "Fill the remaining fields to sharpen ranking and tailoring."}
                  </p>
                </div>
              </Card>
            </Reveal>

            <Stagger
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
              start={280}
              childClassName="h-full"
            >
              <Stat
                label="Verified skills"
                icon={<Wrench className="h-3.5 w-3.5" />}
                tone="brand"
                value={candidate.skills.length}
              />
              <Stat
                label="Roles on file"
                icon={<Briefcase className="h-3.5 w-3.5" />}
                tone="info"
                value={candidate.experience.length}
              />
              <Stat
                label="Live roles scored"
                icon={<Layers className="h-3.5 w-3.5" />}
                tone="neutral"
                value={overview?.jobs_in_corpus ?? 0}
                hint={`${overview?.strong_matches ?? 0} at 75% or better`}
              />
              <Stat
                label="Top match"
                icon={<Sparkles className="h-3.5 w-3.5" />}
                tone="positive"
                value={overview?.top_match_percent ? `${overview.top_match_percent}%` : "—"}
              />
            </Stagger>
          </div>

          {/* The profile itself */}
          <Reveal delay={340} className="mt-3">
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-surface-muted px-5 py-4">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold tracking-tight text-zinc-950">
                    {candidate.full_name}
                  </h2>
                  <p className="mt-0.5 text-sm text-zinc-600">{candidate.headline}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                    {candidate.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {candidate.location}
                      </span>
                    ) : null}
                    {candidate.target_title ? (
                      <span className="inline-flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Targeting {candidate.target_title}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.grounding_sources.map((source) => (
                    <Badge key={source} tone="positive">
                      via {source}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-6 px-5 py-5">
                {candidate.summary ? (
                  <p className="text-sm leading-6 text-zinc-700">{candidate.summary}</p>
                ) : null}

                <Group icon={<Wrench className="h-3.5 w-3.5" />} title="Skills">
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.skills.map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                  </div>
                </Group>

                <Group icon={<Briefcase className="h-3.5 w-3.5" />} title="Experience">
                  <ol className="relative space-y-5">
                    {candidate.experience.map((role, index) => (
                      <li key={`${role.company}-${role.title}`} className="relative flex gap-3">
                        {index < candidate.experience.length - 1 ? (
                          <span className="absolute left-[13px] top-7 bottom-[-20px] w-px bg-zinc-200" />
                        ) : null}
                        <IconTile tone="neutral" className="mt-0.5">
                          <Building2 className="h-3.5 w-3.5" />
                        </IconTile>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-sm font-medium text-zinc-900">
                              {role.title} · {role.company}
                            </p>
                            <p className="tnum text-xs text-zinc-500">
                              {role.start_date} – {role.end_date}
                            </p>
                          </div>
                          <ul className="mt-2 space-y-1.5">
                            {role.bullets.map((bullet) => (
                              <li
                                key={bullet}
                                className="flex gap-2 text-sm leading-6 text-zinc-700"
                              >
                                <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-zinc-400" />
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Group>

                {candidate.education.length > 0 ? (
                  <Group icon={<GraduationCap className="h-3.5 w-3.5" />} title="Education">
                    <ul className="space-y-1">
                      {candidate.education.map((entry) => (
                        <li key={entry} className="text-sm leading-6 text-zinc-700">
                          {entry}
                        </li>
                      ))}
                    </ul>
                  </Group>
                ) : null}

                {candidate.certifications.length > 0 ? (
                  <Group icon={<Award className="h-3.5 w-3.5" />} title="Certifications">
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.certifications.map((entry) => (
                        <Badge key={entry} tone="info">
                          {entry}
                        </Badge>
                      ))}
                    </div>
                  </Group>
                ) : null}
              </div>
            </Card>
          </Reveal>

          {integrations && integrations.length > 0 ? (
            <Reveal delay={400} className="mt-3">
              <Card className="p-5">
                <SectionHeader
                  icon={<Link2 className="h-3.5 w-3.5" />}
                  tone="neutral"
                  title="Connections"
                  description="What Matchr is allowed to read from and send as."
                />
                <ul className="mt-3 divide-y divide-zinc-100">
                  {integrations.map((integration) => (
                    <li
                      key={integration.provider}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900">
                          {integration.label}
                          <span className="ml-2 text-xs font-normal text-zinc-500">
                            {integration.direction}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs leading-5 text-zinc-500">
                          {integration.description}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {integration.connected ? (
                          <Badge tone="positive" dot>
                            Connected
                          </Badge>
                        ) : (
                          <Badge tone="neutral">Not connected</Badge>
                        )}
                        <Button
                          size="sm"
                          variant={integration.connected ? "ghost" : "secondary"}
                          disabled={busy !== null}
                          loading={busy === integration.provider}
                          onClick={() =>
                            run(integration.provider, () =>
                              api.connectIntegration(integration.provider, !integration.connected),
                            )
                          }
                        >
                          {integration.connected ? "Disconnect" : "Connect"}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>
          ) : null}

          <Reveal delay={460} className="mt-3">
            <Callout tone="neutral" icon={<ShieldCheck className="h-4 w-4" />}>
              <span className="font-medium">This is the contract. </span>
              Tailoring may reorder and re-emphasize anything above, but it cannot add to it. Any
              generated technical claim absent from this profile is rejected before you ever see it.
            </Callout>
          </Reveal>

          <div className="mt-4 flex justify-end">
            <Link href="/jobs">
              <Button>
                See your ranked matches
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Group({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-zinc-400">{icon}</span>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</h3>
      </div>
      {children}
    </section>
  );
}
