"use client";

import {
  ArrowRight,
  Building2,
  CircleAlert,
  Crosshair,
  ExternalLink,
  FileText,
  Lightbulb,
  MapPin,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  MatchingWizard,
  MATCH_SOURCE_KEY,
  matchSetupSummary,
  readMatchSetup,
  writeMatchSetup,
  type MatchSetup,
} from "@/components/MatchingWizard";
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
  ScoreRing,
  SegmentedTabs,
  SkeletonList,
  matchLabel,
  matchTone,
  type TabItem,
} from "@/components/ui";
import { api } from "@/lib/api";
import { plural } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import type { Job } from "@/lib/types";

type Filter = "all" | "strong" | "targeted";

const STRONG_MATCH = 75;

export default function JobsPage() {
  const { candidate, overview, initializing, refresh: refreshProfile } = useProfile();
  const grounded = candidate?.grounded ?? false;

  const [setup, setSetup] = useState<MatchSetup | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [runId, setRunId] = useState(0);
  const [proceeding, setProceeding] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [jobSource, setJobSource] = useState<string | null>(null);

  useEffect(() => {
    if (!grounded) {
      setHydrated(true);
      return;
    }
    const saved = readMatchSetup();
    try {
      setJobSource(window.sessionStorage.getItem(MATCH_SOURCE_KEY));
    } catch {
      setJobSource(null);
    }
    if (saved) {
      setSetup(saved);
    } else {
      const timer = window.setTimeout(() => setWizardOpen(true), 180);
      setHydrated(true);
      return () => window.clearTimeout(timer);
    }
    setHydrated(true);
  }, [grounded]);

  const fetchKey = setup
    ? `job-matches:${setup.limit}:${setup.workModes.join(",")}:${setup.employmentTypes.join(",")}:${setup.payMin}:${setup.payPeriod}:${runId}`
    : "pending-setup";
  const {
    data: jobs,
    loading,
    error,
    reload,
  } = useAsync(
    () =>
      setup
        ? api.jobMatches(setup.limit, {
            workModes: setup.workModes,
            employmentTypes: setup.employmentTypes,
            payMin: setup.payMin,
            payPeriod: setup.payPeriod,
          })
        : Promise.resolve([] as Job[]),
    fetchKey,
  );

  const closeWizard = useCallback(() => {
    if (!proceeding) setWizardOpen(false);
  }, [proceeding]);

  async function proceed(next: MatchSetup) {
    setProceeding(true);
    setSetupError(null);
    try {
      const primaryRole = next.desiredRoles[0]?.trim() ?? "";
      if (!primaryRole) {
        setSetupError("Add at least one desired role.");
        return;
      }
      if (next.workModes.length === 0) {
        setSetupError("Select at least one work arrangement.");
        return;
      }
      if (next.employmentTypes.length === 0) {
        setSetupError("Select at least one job type.");
        return;
      }
      if (primaryRole !== (candidate?.target_title ?? "").trim()) {
        await api.updateMe({ target_title: primaryRole });
      }
      const synced = await api.syncJobs({
        work_modes: next.workModes,
        employment_types: next.employmentTypes,
        pay_min: next.payMin,
        pay_period: next.payPeriod,
      });
      const source = synced.source ?? "xano";
      try {
        window.sessionStorage.setItem(MATCH_SOURCE_KEY, source);
      } catch {
        // sessionStorage can be unavailable in private contexts.
      }
      setJobSource(source);
      writeMatchSetup(next);
      setSetup(next);
      setRunId((value) => value + 1);
      setWizardOpen(false);
      await refreshProfile();
    } catch (cause) {
      setSetupError(cause instanceof Error ? cause.message : "Could not start matching.");
    } finally {
      setProceeding(false);
    }
  }

  async function toggleTarget(job: Job) {
    setBusyId(job.id);
    setActionError(null);
    try {
      if (job.targeted) {
        await api.untargetJob(job.id);
      } else {
        await api.targetJob(job.id);
      }
      await Promise.all([reload(), refreshProfile()]);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Could not update your targets.");
    } finally {
      setBusyId(null);
    }
  }

  // Without this the ungrounded empty state flashes before the profile lands.
  if (initializing || (grounded && !hydrated)) {
    return (
      <div>
        <PageHeader
          title="Job matches"
          description="Ranked against your profile and target role."
        />
        <SkeletonList rows={4} />
      </div>
    );
  }

  if (!grounded) {
    return (
      <div>
        <PageHeader
          title="Job matches"
          description="A short list of live roles ranked by semantic similarity against your verified history — not a feed to mass-apply into."
        />
        <EmptyState
          icon={<Crosshair className="h-5 w-5" />}
          title="Nothing to match against yet"
          description="Matching runs on your Ground Truth Profile. Connect LinkedIn or upload a resume and these roles will rank themselves against your actual experience."
          action={
            <Link href="/profile">
              <Button>Ground your profile</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const started = setup !== null;
  const matching = started && loading;
  const targetTitle = candidate?.target_title;

  const all = started ? (jobs ?? []) : [];
  const strong = all.filter((job) => (job.scorecard?.match_percent ?? 0) >= STRONG_MATCH);
  const targeted = all.filter((job) => job.targeted);
  const visible = filter === "strong" ? strong : filter === "targeted" ? targeted : all;

  const tabs: ReadonlyArray<TabItem<Filter>> = [
    { value: "all", label: "All scored", count: all.length },
    { value: "strong", label: "Strong fits", count: strong.length },
    { value: "targeted", label: "Targeted", count: targeted.length },
  ];

  const atCap = (overview?.targeted_count ?? 0) >= (overview?.target_limit ?? 5);

  return (
    <div>
      <PageHeader
        eyebrow={
          <Badge tone={atCap ? "warning" : "info"} dot>
            {overview?.targeted_count ?? 0} of {overview?.target_limit ?? 5} targets used
          </Badge>
        }
        title="Job matches"
        description={
          started && setup
            ? `Ranked against your profile and ${matchSetupSummary(setup)}. Select up to ${overview?.target_limit ?? 5} — the cap is the point.`
            : "Choose desired roles, work arrangement, job type, and a pay floor, then proceed."
        }
        actions={
          <Button variant="secondary" size="sm" onClick={() => {
            setSetupError(null);
            setWizardOpen(true);
          }}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {started ? "Adjust matching" : "Set up matching"}
          </Button>
        }
      />

      {started && jobSource === "seed_corpus" ? (
        <Callout className="mb-4" tone="warning" label="Demo corpus.">
          Live listings unavailable — showing demo roles instead of Google Jobs.
        </Callout>
      ) : null}

      {started ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <SegmentedTabs items={tabs} value={filter} onChange={setFilter} />
          {atCap ? (
            <p className="flex items-center gap-1.5 text-xs text-amber-700">
              <CircleAlert className="h-3.5 w-3.5" />
              At the cap. Drop a target before adding another.
            </p>
          ) : null}
        </div>
      ) : null}

      {actionError ? (
        <div className="mb-4">
          <ErrorNote message={actionError} />
        </div>
      ) : null}
      {error ? (
        <div className="mb-4">
          <ErrorNote message={error} />
        </div>
      ) : null}

      {!started ? (
        <EmptyState
          icon={<Crosshair className="h-5 w-5" />}
          title="Matching has not started"
          description="Pick the titles you want, how you want to work, and a pay floor. Nothing is ranked until you proceed."
          action={
            <Button onClick={() => {
              setSetupError(null);
              setWizardOpen(true);
            }}>Set up matching</Button>
          }
        />
      ) : matching ? (
        <SkeletonList rows={4} height="h-44" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Crosshair className="h-5 w-5" />}
          title={filter === "targeted" ? "No targets yet" : "Nothing at this bar"}
          description={
            filter === "targeted"
              ? "Pick 3–5 high-fit roles and they will collect here, ready for dossier generation."
              : "No role in the current corpus cleared the strong-fit threshold. Adjust matching or widen work arrangement, job type, or pay."
          }
          action={
            <Button variant="secondary" onClick={() => setFilter("all")}>
              Show all scored roles
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((job, index) => {
            const score = job.scorecard;
            const open = expanded === job.id;
            return (
              <Reveal key={job.id} delay={index * 55}>
                <Card className="p-5" interactive>
                  <div className="flex items-start gap-4">
                    {score ? (
                      <ScoreRing percent={score.match_percent} delay={index * 55 + 80} />
                    ) : null}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-base font-semibold tracking-tight text-zinc-950">
                            {job.title}
                          </h2>
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {job.company}
                            </span>
                            {job.location ? (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {job.location}
                              </span>
                            ) : null}
                            {job.salary ? (
                              <span className="inline-flex items-center gap-1">
                                <Wallet className="h-3 w-3" />
                                {job.salary}
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                          {job.targeted ? <Badge tone="positive">Targeted</Badge> : null}
                          {score ? (
                            <Badge tone={matchTone(score.match_percent)}>
                              {matchLabel(score.match_percent)}
                            </Badge>
                          ) : null}
                        </div>
                      </div>

                      {score ? (
                        <>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <SkillList
                              label="Matching skills"
                              tone="positive"
                              skills={score.matching_skills}
                              empty="None detected"
                            />
                            <SkillList
                              label="Missing tech"
                              tone="warning"
                              skills={score.missing_tech}
                              empty="Full coverage"
                            />
                          </div>

                          {score.key_angle ? (
                            <Callout
                              className="mt-3"
                              label="Key angle."
                              icon={<Lightbulb className="h-3.5 w-3.5" />}
                            >
                              {score.key_angle}
                            </Callout>
                          ) : null}
                        </>
                      ) : null}

                      {open && job.description ? (
                        <p className="mt-3 rounded-lg bg-surface-muted px-3 py-2.5 text-sm leading-6 text-zinc-700">
                          {job.description}
                        </p>
                      ) : null}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant={job.targeted ? "secondary" : "primary"}
                          loading={busyId === job.id}
                          disabled={busyId !== null}
                          onClick={() => toggleTarget(job)}
                        >
                          <Crosshair className="h-3.5 w-3.5" />
                          {job.targeted ? "Remove target" : "Target this role"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExpanded(open ? null : job.id)}
                        >
                          {open ? "Hide description" : "Read description"}
                        </Button>
                        {job.targeted ? (
                          <Link href={`/dossier?job=${job.id}`}>
                            <Button size="sm" variant="ghost">
                              <FileText className="h-3.5 w-3.5" />
                              Build dossier
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        ) : null}
                        {job.apply_url ? (
                          <a href={job.apply_url} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="ghost">
                              Apply portal
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </a>
                        ) : null}
                        {job.source ? (
                          <span className="ml-auto text-xs text-zinc-400">
                            {job.source}
                            {job.posted_at ? ` · posted ${job.posted_at}` : ""}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>
      )}

      {!matching && visible.length > 0 ? (
        <p className="mt-4 text-center text-xs text-zinc-400">
          {visible.length} {plural(visible.length, "role")} shown · ranked by semantic similarity
          against your Ground Truth Profile
        </p>
      ) : null}

      <MatchingWizard
        open={wizardOpen}
        savedTargetTitle={targetTitle ?? null}
        initial={setup}
        busy={proceeding}
        error={setupError}
        onClose={closeWizard}
        onProceed={proceed}
      />
    </div>
  );
}

function SkillList({
  label,
  tone,
  skills,
  empty,
}: {
  label: string;
  tone: "positive" | "warning";
  skills: string[];
  empty: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {skills.length > 0 ? (
          skills.map((skill) => (
            <Badge key={skill} tone={tone}>
              {skill}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-zinc-400">{empty}</span>
        )}
      </div>
    </div>
  );
}
