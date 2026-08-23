"use client";

import {
  ArrowRight,
  CalendarDays,
  Crosshair,
  FileText,
  Gauge,
  Info,
  Layers,
  Link2,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  Upload,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { useProfile } from "@/components/ProfileProvider";
import {
  AreaChart,
  Badge,
  BarGroup,
  Button,
  Callout,
  Card,
  ChartLegend,
  CountUp,
  ErrorNote,
  IconTile,
  PageHeader,
  ProgressRow,
  Reveal,
  ScoreRing,
  SectionHeader,
  Skeleton,
  SkeletonStats,
  StatCard,
  Stagger,
  Timeline,
  cx,
  matchLabel,
  matchTone,
  type ChartSeries,
  type TimelineItem,
} from "@/components/ui";
import { api } from "@/lib/api";
import { plural, relativeTime } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import type { ActivityKind, Overview } from "@/lib/types";

const ACTIVITY_ICONS: Record<ActivityKind, ReactNode> = {
  grounded: <ShieldCheck className="h-3 w-3" />,
  goal: <Target className="h-3 w-3" />,
  sync: <RefreshCw className="h-3 w-3" />,
  targeted: <Crosshair className="h-3 w-3" />,
  untargeted: <TrendingDown className="h-3 w-3" />,
  dossier: <FileText className="h-3 w-3" />,
  event: <CalendarDays className="h-3 w-3" />,
  outreach: <Send className="h-3 w-3" />,
};

/* -------------------------------------------------------------------------- */
/* Action cards                                                                */
/* -------------------------------------------------------------------------- */

function ActionCard({
  label,
  icon,
  tone,
  value,
  unit,
  hint,
  href,
  cta,
  emphasis = false,
  delay = 0,
}: {
  label: string;
  icon: ReactNode;
  tone: "brand" | "positive" | "warning" | "info";
  value: number;
  unit?: string;
  hint: string;
  href: string;
  cta: string;
  emphasis?: boolean;
  delay?: number;
}) {
  return (
    <Card className="flex h-full flex-col p-4" interactive>
      <div className="flex items-center gap-2">
        <IconTile tone={tone} size="sm">
          {icon}
        </IconTile>
        <p className="truncate text-xs font-medium text-zinc-700">{label}</p>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight text-zinc-950">
          <CountUp value={value} delay={delay} />
          {unit ? <span className="ml-1 text-sm font-medium text-zinc-400">{unit}</span> : null}
        </p>
        <Link href={href} className="shrink-0">
          <Button size="sm" variant={emphasis ? "primary" : "secondary"}>
            {cta}
          </Button>
        </Link>
      </div>

      <p className="mt-2.5 flex items-start gap-1.5 text-xs leading-5 text-zinc-500">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        {hint}
      </p>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Not-grounded onboarding                                                     */
/* -------------------------------------------------------------------------- */

const ONBOARDING_STEPS = [
  {
    icon: <Link2 className="h-4 w-4" />,
    title: "Sign in with LinkedIn",
    body: "A short setup popup walks you through it. Matchr pulls identity immediately — or you can skip and start from a document.",
  },
  {
    icon: <Upload className="h-4 w-4" />,
    title: "LinkedIn PDF or resume",
    body: "Choose which file to import, then drop it. Nutrient extracts experience, education, and skills into verified history.",
  },
  {
    icon: <Target className="h-4 w-4" />,
    title: "Name a target role",
    body: "The single biggest lever on match quality. It drives ranking, growth, and event compatibility.",
  },
];

function OnboardingHero({ overview }: { overview: Overview }) {
  const router = useRouter();
  return (
    <div>
      <PageHeader
        eyebrow={<Badge tone="warning" dot>Profile not grounded</Badge>}
        title="Overview"
        description="Matching, tailoring, and outreach all read from one immutable set of verified career facts. Until that exists, Matchr keeps every downstream agent switched off rather than letting it guess."
      />

      <Reveal delay={60}>
        <Card className="overflow-hidden">
          <div className="border-b border-line bg-gradient-to-br from-brand-50 via-surface to-surface px-5 py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-lg">
                <div className="flex items-center gap-2">
                  <IconTile tone="brand" size="sm">
                    <Sparkles className="h-4 w-4" />
                  </IconTile>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    Start here
                  </p>
                </div>
                <h2 className="mt-3 text-lg font-semibold tracking-tight text-zinc-950">
                  Ground your profile to switch the engine on
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-zinc-600">
                  {overview.jobs_in_corpus} live roles are already in the corpus, waiting to be
                  ranked. They stay unscored until there is verified history to rank them against.
                </p>
              </div>
              <Button onClick={() => router.push("/profile?setup=1")}>
                Get grounded
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Stagger className="grid divide-y divide-zinc-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0" start={160}>
            {ONBOARDING_STEPS.map((step) => (
              <div key={step.title} className="px-5 py-5">
                <IconTile tone="neutral">{step.icon}</IconTile>
                <p className="mt-3 text-sm font-medium text-zinc-900">{step.title}</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">{step.body}</p>
              </div>
            ))}
          </Stagger>
        </Card>
      </Reveal>

      <Reveal delay={380} className="mt-3">
        <Callout tone="neutral" icon={<ShieldCheck className="h-4 w-4" />}>
          <span className="font-medium">Why the gate. </span>
          Every generated bullet, cover letter, and cold email is checked back against this profile.
          An agent with nothing to cite is an agent that invents — so Matchr would rather show you
          an empty dashboard than a confident one built on nothing.
        </Callout>
      </Reveal>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                   */
/* -------------------------------------------------------------------------- */

function DashboardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-16 w-80" />
      <div className="grid gap-3 md:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-32 w-full" />
        ))}
      </div>
      <SkeletonStats />
      <div className="grid gap-3 lg:grid-cols-3">
        <Skeleton className="h-80 w-full lg:col-span-2" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { candidate, overview, loading, error, refresh } = useProfile();
  const grounded = candidate?.grounded ?? false;
  const { data: jobs } = useAsync(() => api.jobMatches(5), String(grounded));

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div>
        <PageHeader title="Overview" description="Your search at a glance." />
        <ErrorNote
          message={error}
          action={
            <Button size="sm" variant="secondary" onClick={refresh}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  if (!overview) return null;
  if (!grounded) return <OnboardingHero overview={overview} />;

  const {
    jobs_in_corpus,
    strong_matches,
    top_match_percent,
    average_match_percent,
    targeted_count,
    target_limit,
    dossiers_ready,
    outreach_sent,
    outreach_goal,
    recruiters_emailed,
    events_saved,
    events_matched,
    open_skill_gaps,
    skill_count,
    match_curve,
    pipeline,
    score_bands,
    activity,
    next_action,
  } = overview;

  const series: ChartSeries[] = [
    {
      key: "match",
      label: "Fit score",
      color: "brand",
      values: match_curve.map((point) => point.match),
    },
    {
      key: "coverage",
      label: "Skill coverage",
      color: "emerald",
      values: match_curve.map((point) => point.coverage),
      lineOnly: true,
    },
  ];

  const timeline: TimelineItem[] = activity.map((entry) => ({
    id: entry.id,
    title: entry.title,
    detail: entry.detail ?? undefined,
    at: relativeTime(entry.at) ?? undefined,
    tone: entry.tone,
    icon: ACTIVITY_ICONS[entry.kind],
  }));

  const pendingDossiers = Math.max(targeted_count - dossiers_ready, 0);

  return (
    <div>
      <PageHeader
        eyebrow={
          <>
            <Badge tone="positive" dot>
              Grounded via {overview.grounding_sources.join(", ") || "profile"}
            </Badge>
            <span className="text-xs text-zinc-500">
              {skill_count} verified skills · targeting {overview.target_title ?? "no role yet"}
            </span>
          </>
        }
        title="Overview"
        description={`${jobs_in_corpus} live roles scored against your verified history. ${strong_matches} cleared the strong-fit bar — the rest are noise you do not need to read.`}
        actions={
          <>
            <Link href="/jobs">
              <Button variant="secondary" size="sm">
                <Crosshair className="h-3.5 w-3.5" />
                Review matches
              </Button>
            </Link>
            {next_action ? (
              <Link href={next_action.href}>
                <Button size="sm">
                  {next_action.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : null}
          </>
        }
      />

      {/* What needs a decision from you */}
      <Stagger className="grid gap-3 md:grid-cols-3" start={40} step={70} childClassName="h-full">
        <ActionCard
          label="Matches to review"
          icon={<Crosshair className="h-4 w-4" />}
          tone="brand"
          value={strong_matches}
          unit={plural(strong_matches, "role")}
          hint={`Out of ${jobs_in_corpus} scored. Top match sits at ${top_match_percent ?? 0}%.`}
          href="/jobs"
          cta="Review"
          emphasis={targeted_count === 0}
          delay={40}
        />
        <ActionCard
          label="Targets in play"
          icon={<Target className="h-4 w-4" />}
          tone="info"
          value={targeted_count}
          unit={`of ${target_limit}`}
          hint="The cap is the product. Five deliberate applications beat five hundred blind ones."
          href="/jobs"
          cta="Manage"
          delay={110}
        />
        <ActionCard
          label="Dossiers to build"
          icon={<FileText className="h-4 w-4" />}
          tone="warning"
          value={pendingDossiers}
          unit={plural(pendingDossiers, "role")}
          hint={`${dossiers_ready} ready. Each is tailored per role, then verified back against your profile.`}
          href="/dossier"
          cta="Build"
          emphasis={targeted_count > 0 && pendingDossiers > 0}
          delay={180}
        />
      </Stagger>

      {/* Headline metrics */}
      <div className="mt-6">
        <Reveal delay={250}>
          <SectionHeader
            icon={<Gauge className="h-3.5 w-3.5" />}
            tone="neutral"
            title="Search performance"
            description="Everything below is computed from your Ground Truth Profile, not self-reported."
          />
        </Reveal>

        <Stagger
          className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          start={300}
          step={60}
          childClassName="h-full"
        >
          <StatCard
            label="Roles scored"
            icon={<Layers className="h-3.5 w-3.5" />}
            tone="brand"
            value={jobs_in_corpus}
            meterPercent={jobs_in_corpus ? (strong_matches / jobs_in_corpus) * 100 : 0}
            delay={300}
            footnote={
              <>
                <span className="font-medium text-zinc-700">{strong_matches}</span> cleared 75%,
                averaging {average_match_percent ?? 0}% across the corpus
              </>
            }
          />
          <StatCard
            label="Top match"
            icon={<Sparkles className="h-3.5 w-3.5" />}
            tone="positive"
            value={top_match_percent ?? 0}
            suffix="%"
            meterPercent={top_match_percent ?? 0}
            delay={360}
            footnote={
              match_curve[0]
                ? `${match_curve[0].title} at ${match_curve[0].company}`
                : "No scored roles yet"
            }
          />
          <StatCard
            label="Targets used"
            icon={<Target className="h-3.5 w-3.5" />}
            tone="info"
            value={targeted_count}
            suffix={` / ${target_limit}`}
            meterPercent={(targeted_count / target_limit) * 100}
            delay={420}
            footnote={
              targeted_count >= target_limit
                ? "At the cap. Drop one before adding another."
                : `${target_limit - targeted_count} ${plural(target_limit - targeted_count, "slot")} left`
            }
          />
          <StatCard
            label="Recruiters emailed"
            icon={<Mail className="h-3.5 w-3.5" />}
            tone="warning"
            value={recruiters_emailed}
            meterPercent={(outreach_sent / outreach_goal) * 100}
            delay={480}
            footnote={`${outreach_sent} ${plural(outreach_sent, "email")} sent, each approved by you`}
          />
        </Stagger>
      </div>

      {/* Fit curve + pipeline */}
      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        <Reveal delay={560} className="lg:col-span-2">
          <Card className="h-full p-5">
            <SectionHeader
              icon={<TrendingDown className="h-3.5 w-3.5" />}
              tone="brand"
              title="Fit curve"
              description="How sharply match quality drops off once you leave the top of your ranked corpus."
              action={<ChartLegend series={series} />}
            />

            <div className="mt-4 flex flex-wrap items-baseline gap-2">
              <p className="tnum text-2xl font-semibold tracking-tight text-zinc-950">
                <CountUp value={top_match_percent ?? 0} delay={560} />%
              </p>
              <p className="text-xs text-zinc-500">
                best fit · {average_match_percent ?? 0}% average across {jobs_in_corpus} roles
              </p>
            </div>

            {match_curve.length > 0 ? (
              <AreaChart
                className="mt-2"
                labels={match_curve.map((point) => point.label)}
                series={series}
                height={232}
                max={100}
                delay={640}
                formatValue={(value) => `${Math.round(value)}%`}
              />
            ) : (
              <p className="py-16 text-center text-sm text-zinc-500">
                No scored roles yet. Refresh the listings to populate the curve.
              </p>
            )}

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              The gap between the two lines is where your growth plan lives: a role can score well
              on overall similarity while still asking for tools you have not used.
            </p>
          </Card>
        </Reveal>

        <Reveal delay={620}>
          <Card className="h-full p-5">
            <SectionHeader
              icon={<Layers className="h-3.5 w-3.5" />}
              tone="info"
              title="Pipeline"
              description="Corpus down to sent."
            />

            <div className="mt-4 space-y-3.5">
              {pipeline.map((stage, index) => (
                <ProgressRow
                  key={stage.key}
                  label={stage.label}
                  value={String(stage.count)}
                  percent={stage.percent}
                  tone={stage.tone}
                  hint={stage.hint ?? undefined}
                  delay={680 + index * 70}
                />
              ))}
            </div>

            <div className="mt-5 border-t border-line pt-4">
              <p className="text-xs font-medium text-zinc-700">Score distribution</p>
              <div className="mt-2">
                <BarGroup
                  bars={score_bands.map((band) => ({
                    label: band.label,
                    value: band.count,
                    tone: band.tone,
                  }))}
                  height={84}
                  delay={900}
                />
              </div>
            </div>
          </Card>
        </Reveal>
      </div>

      {/* Top matches + activity */}
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Reveal delay={700} className="lg:col-span-2">
          <Card className="h-full p-5">
            <SectionHeader
              icon={<Crosshair className="h-3.5 w-3.5" />}
              tone="brand"
              title="Top matches"
              description="Your best-scoring live roles right now."
              action={
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900"
                >
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Link>
              }
            />

            <ul className="mt-3 divide-y divide-zinc-100">
              {jobs?.map((job, index) => {
                const score = job.scorecard?.match_percent ?? 0;
                return (
                  <li key={job.id}>
                    <Link
                      href="/jobs"
                      className="-mx-2 flex items-center gap-3.5 rounded-lg px-2 py-3 transition-colors hover:bg-zinc-50"
                    >
                      <ScoreRing percent={score} size={44} delay={760 + index * 60} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900">{job.title}</p>
                        <p className="truncate text-xs text-zinc-500">
                          {job.company}
                          {job.location ? ` · ${job.location}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {job.targeted ? <Badge tone="positive">Targeted</Badge> : null}
                        <Badge tone={matchTone(score)}>{matchLabel(score)}</Badge>
                      </div>
                    </Link>
                  </li>
                );
              }) ?? <li className="py-6 text-center text-sm text-zinc-500">Loading matches…</li>}
            </ul>
          </Card>
        </Reveal>

        <Reveal delay={760}>
          <Card className="h-full p-5">
            <SectionHeader
              icon={<Sparkles className="h-3.5 w-3.5" />}
              tone="positive"
              title="Recent activity"
              description="What the engine did, and when."
            />
            <div className="mt-4">
              {timeline.length > 0 ? (
                <Timeline items={timeline} />
              ) : (
                <p className="py-8 text-center text-sm text-zinc-500">
                  Nothing yet. Target a role or refresh the listings to get started.
                </p>
              )}
            </div>
          </Card>
        </Reveal>
      </div>

      {/* Secondary surfaces */}
      <Stagger className="mt-3 grid gap-3 sm:grid-cols-3" start={840} childClassName="h-full">
        <MiniLink
          href="/growth"
          icon={<UserRound className="h-4 w-4" />}
          tone="warning"
          title={`${open_skill_gaps} open skill ${plural(open_skill_gaps, "gap")}`}
          body="Capability gaps between your profile and the roles you actually match — with resources that close them."
        />
        <MiniLink
          href="/networking"
          icon={<CalendarDays className="h-4 w-4" />}
          tone="info"
          title={`${events_matched} compatible ${plural(events_matched, "event")}`}
          body={`${events_saved} saved. Ranked with the same profile signal as jobs, weighted toward your growth plan.`}
        />
        <MiniLink
          href="/outreach"
          icon={<Send className="h-4 w-4" />}
          tone="positive"
          title={`${outreach_sent} ${plural(outreach_sent, "email")} sent`}
          body="Short, specific, grounded in a real Fit Scorecard. Nothing leaves your inbox without your approval."
        />
      </Stagger>
    </div>
  );
}

function MiniLink({
  href,
  icon,
  tone,
  title,
  body,
}: {
  href: string;
  icon: ReactNode;
  tone: "brand" | "positive" | "warning" | "info";
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className="block h-full">
      <Card className="group h-full p-4" interactive>
        <div className="flex items-start justify-between gap-2">
          <IconTile tone={tone}>{icon}</IconTile>
          <ArrowRight className="h-3.5 w-3.5 text-zinc-300 transition-colors group-hover:text-zinc-600" />
        </div>
        <p className={cx("mt-3 text-sm font-medium text-zinc-900")}>{title}</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">{body}</p>
      </Card>
    </Link>
  );
}
