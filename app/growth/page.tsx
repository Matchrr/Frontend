"use client";

import {
  ArrowRight,
  Award,
  BookMarked,
  BookOpen,
  ExternalLink,
  GraduationCap,
  PlayCircle,
  Search,
  Sprout,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { useProfile } from "@/components/ProfileProvider";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorNote,
  IconTile,
  PageHeader,
  ProgressRow,
  Reveal,
  SectionHeader,
  SkeletonList,
  type Tone,
} from "@/components/ui";
import { api } from "@/lib/api";
import { plural } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";

const KIND_META: Record<string, { label: string; tone: Tone; icon: ReactNode }> = {
  course: { label: "Course", tone: "brand", icon: <GraduationCap className="h-3.5 w-3.5" /> },
  certification: { label: "Certification", tone: "positive", icon: <Award className="h-3.5 w-3.5" /> },
  video: { label: "Video", tone: "warning", icon: <PlayCircle className="h-3.5 w-3.5" /> },
  docs: { label: "Docs", tone: "info", icon: <BookOpen className="h-3.5 w-3.5" /> },
  reading: { label: "Reading", tone: "neutral", icon: <BookMarked className="h-3.5 w-3.5" /> },
  search: { label: "Search", tone: "neutral", icon: <Search className="h-3.5 w-3.5" /> },
};

export default function GrowthPage() {
  const { candidate, initializing } = useProfile();
  const grounded = candidate?.grounded ?? false;
  const { data: plan, loading, error } = useAsync(() => api.growthPlan(), String(grounded));

  // Without this the ungrounded empty state flashes before the profile lands.
  if (initializing) {
    return (
      <div>
        <PageHeader
          title="Growth plan"
          description="Skill gaps between where you are and where you want to be, with concrete resources that close them."
        />
        <SkeletonList rows={3} />
      </div>
    );
  }

  if (!grounded) {
    return (
      <div>
        <PageHeader
          title="Growth plan"
          description="Skill gaps between where you are and where you want to be, with concrete resources that close them."
        />
        <EmptyState
          icon={<Sprout className="h-5 w-5" />}
          title="No profile to analyze"
          description="The growth plan is a gap analysis against your verified history and target role. Ground your profile first."
          action={
            <Link href="/profile">
              <Button>Ground your profile</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const gaps = plan?.skill_gaps ?? [];
  const maxDemand = Math.max(1, ...gaps.map((gap) => gap.demand_count));

  return (
    <div>
      <PageHeader
        eyebrow={
          plan?.target_title ? (
            <Badge tone="brand" dot>
              Target: {plan.target_title}
            </Badge>
          ) : null
        }
        title="Growth plan"
        description="Not a resume critique. No grammar notes, no “make this bullet less vague.” These are capability gaps between your verified profile and the roles you are actually matching."
      />

      {error ? (
        <div className="mb-4">
          <ErrorNote message={error} />
        </div>
      ) : null}

      {loading ? (
        <SkeletonList rows={3} height="h-56" />
      ) : plan ? (
        <>
          <div className="grid gap-3 lg:grid-cols-3">
            <Reveal delay={40} className="lg:col-span-2">
              <Card className="h-full p-5">
                <SectionHeader
                  icon={<TrendingUp className="h-3.5 w-3.5" />}
                  tone="positive"
                  title="Where you stand"
                  description="Read against the live postings you already match."
                />
                {plan.summary ? (
                  <p className="mt-3 text-sm leading-6 text-zinc-800">{plan.summary}</p>
                ) : null}
                {plan.strengths.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      What is already carrying you
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {plan.strengths.map((skill) => (
                        <Badge key={skill} tone="positive">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </Card>
            </Reveal>

            <Reveal delay={100}>
              <Card className="h-full p-5">
                <SectionHeader
                  icon={<Sprout className="h-3.5 w-3.5" />}
                  tone="warning"
                  title="Demand"
                  description="How often each gap appears."
                />
                <div className="mt-4 space-y-3">
                  {gaps.map((gap, index) => (
                    <ProgressRow
                      key={gap.skill}
                      label={gap.skill}
                      value={`${gap.demand_count} ${plural(gap.demand_count, "role")}`}
                      percent={(gap.demand_count / maxDemand) * 100}
                      tone={gap.demand_count >= 3 ? "warning" : "brand"}
                      delay={160 + index * 60}
                    />
                  ))}
                </div>
              </Card>
            </Reveal>
          </div>

          <div className="mt-3 space-y-3">
            {gaps.map((gap, index) => (
              <Reveal key={gap.skill} delay={200 + index * 55}>
                <Card className="overflow-hidden" interactive>
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-surface-muted px-5 py-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="tnum mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-xs font-semibold text-white">
                        {gap.priority}
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold tracking-tight text-zinc-950">
                          {gap.skill}
                        </h2>
                        {gap.demand_note ? (
                          <p className="mt-0.5 text-xs leading-5 text-zinc-500">
                            {gap.demand_note}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {gap.demand_count > 0 ? (
                      <Badge tone={gap.demand_count >= 3 ? "warning" : "neutral"}>
                        {gap.demand_count} live {plural(gap.demand_count, "role")}
                      </Badge>
                    ) : null}
                  </div>

                  <ul className="divide-y divide-zinc-100">
                    {gap.resources.map((resource) => {
                      const meta = KIND_META[resource.kind] ?? KIND_META.search;
                      return (
                        <li key={resource.url}>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-zinc-50"
                          >
                            <IconTile tone={meta.tone} className="mt-0.5">
                              {meta.icon}
                            </IconTile>
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-zinc-900 group-hover:underline">
                                  {resource.title}
                                </span>
                                <Badge tone={meta.tone}>{meta.label}</Badge>
                                {resource.provider ? (
                                  <span className="text-xs text-zinc-400">
                                    {resource.provider}
                                  </span>
                                ) : null}
                              </span>
                              {resource.why ? (
                                <span className="mt-1 block text-sm leading-6 text-zinc-600">
                                  {resource.why}
                                </span>
                              ) : null}
                            </span>
                            <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-600" />
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </Reveal>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <Link href="/networking">
              <Button variant="secondary">
                Find events for these skills
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
