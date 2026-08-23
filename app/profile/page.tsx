"use client";

import {
  ArrowRight,
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  CheckCircle2,
  FileUp,
  FolderKanban,
  Globe,
  GraduationCap,
  HeartHandshake,
  Layers,
  Link2,
  Mail,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  GroundingStatus,
  GroundingWizard,
  LINKEDIN_SKIP_KEY,
  type WizardStep,
} from "@/components/GroundingWizard";
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
import { homeCity } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import type { Experience } from "@/lib/types";

export default function ProfilePage() {
  const { candidate, overview, initializing, error, refresh } = useProfile();
  const { data: integrations, reload: reloadIntegrations } = useAsync(() => api.integrations());

  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [linkedinSkipped, setLinkedinSkipped] = useState(false);
  const urlHandled = useRef(false);

  // Edits override the fetched profile until they are saved, which keeps the
  // fields in sync with the server without an effect.
  const [edits, setEdits] = useState<{ targetTitle: string; location: string } | null>(null);
  const targetTitle = edits?.targetTitle ?? candidate?.target_title ?? "";
  const location = edits?.location ?? homeCity(candidate?.location);
  const setTargetTitle = (value: string) => setEdits({ targetTitle: value, location });
  const setLocation = (value: string) => setEdits({ targetTitle, location: value });

  const linkedinStatus = integrations?.find((item) => item.provider === "linkedin");
  const linkedinConfigured = linkedinStatus?.configured ?? false;
  const nutrientStatus = integrations?.find((item) => item.provider === "nutrient");
  const nutrientConfigured = nutrientStatus?.configured ?? false;
  const linkedinCallback =
    linkedinStatus?.callback_url ?? "http://localhost:4000/api/integrations/linkedin/callback";

  useEffect(() => {
    setLinkedinSkipped(window.sessionStorage.getItem(LINKEDIN_SKIP_KEY) === "1");
  }, []);

  useEffect(() => {
    if (candidate?.linkedin_connected) {
      window.sessionStorage.removeItem(LINKEDIN_SKIP_KEY);
      setLinkedinSkipped(false);
    }
  }, [candidate?.linkedin_connected]);

  useEffect(() => {
    if (initializing || urlHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("linkedin");
    const setup = params.get("setup");
    if (!status && !setup) {
      urlHandled.current = true;
      return;
    }

    urlHandled.current = true;
    const reason = params.get("reason");
    window.history.replaceState({}, "", "/profile");
    const skipped = window.sessionStorage.getItem(LINKEDIN_SKIP_KEY) === "1";

    if (status === "error") {
      setActionError(reason || "LinkedIn sign-in did not complete.");
      setWizardStep(1);
      window.setTimeout(() => setWizardOpen(true), 180);
      return;
    }
    if (status === "identity" || status === "imported") {
      setWizardStep(2);
      window.setTimeout(() => setWizardOpen(true), 180);
      void refresh();
      return;
    }
    if (setup === "1" && !candidate?.grounded) {
      setWizardStep(candidate?.linkedin_connected || skipped ? 2 : 1);
      window.setTimeout(() => setWizardOpen(true), 180);
    }
  }, [initializing, candidate, refresh]);

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

  async function connectLinkedin() {
    setBusy("linkedin");
    setActionError(null);
    try {
      if (linkedinConfigured) {
        const { url } = await api.startLinkedinOAuth();
        window.location.assign(url);
        return;
      }
      await api.connectLinkedin();
      await Promise.all([refresh(), reloadIntegrations()]);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function uploadResume(file: File) {
    setBusy("resume");
    setActionError(null);
    try {
      await api.uploadResume(file);
      await Promise.all([refresh(), reloadIntegrations()]);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Something went wrong.");
      throw cause;
    } finally {
      setBusy(null);
    }
  }

  function skipLinkedin() {
    window.sessionStorage.setItem(LINKEDIN_SKIP_KEY, "1");
    setLinkedinSkipped(true);
  }

  function openWizard(step: WizardStep) {
    setActionError(null);
    setWizardStep(step);
    setWizardOpen(true);
  }

  const closeWizard = useCallback(() => {
    setWizardOpen(false);
  }, []);

  const finishWizard = useCallback(() => {
    setWizardOpen(false);
    setNotice("Integration complete. Matching can now use your verified history.");
  }, []);

  async function saveGoal() {
    await run("goal", () =>
      api.updateMe({ target_title: targetTitle.trim(), location: location.trim() }),
    );
    setEdits(null);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  if (initializing) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-80" />
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const grounded = candidate?.grounded ?? false;
  const completeness = overview?.profile_completeness ?? 0;
  const showProfile = Boolean(candidate && (grounded || candidate.linkedin_connected));
  const identityOnly = Boolean(
    candidate?.linkedin_connected && candidate.linkedin_coverage === "identity" && !grounded,
  );

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
            : candidate?.linkedin_connected
              ? "Identity imported. Upload a LinkedIn PDF or resume so matching can use your work history."
              : "Connect LinkedIn or upload a resume. Matchr extracts a verified career profile so you never fill out a form from scratch — and so no agent can hallucinate on your behalf."
        }
        actions={
          grounded || candidate?.linkedin_connected ? (
            <Button
              variant="danger"
              size="sm"
              loading={busy === "reset"}
              disabled={busy !== null}
              onClick={() => {
                window.sessionStorage.removeItem(LINKEDIN_SKIP_KEY);
                setLinkedinSkipped(false);
                void run("reset", api.resetProfile);
              }}
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
      {actionError && !wizardOpen ? (
        <div className="mb-4">
          <ErrorNote message={actionError} />
        </div>
      ) : null}
      {notice ? (
        <div className="mb-4">
          <Callout tone="info" icon={<ShieldCheck className="h-4 w-4" />}>
            {notice}
          </Callout>
        </div>
      ) : null}

      {/* Sources — compact status; the actual import happens in the wizard. */}
      <Reveal delay={40}>
        <GroundingStatus
          linkedinConnected={Boolean(candidate?.linkedin_connected)}
          linkedinSkipped={linkedinSkipped}
          grounded={grounded}
          sources={candidate?.grounding_sources ?? []}
          onContinue={() => {
            const next: WizardStep =
              candidate?.linkedin_connected || linkedinSkipped ? 2 : 1;
            if (next === 2 && !candidate?.linkedin_connected) skipLinkedin();
            openWizard(next);
          }}
          onOpenStep={(step) => {
            if (step === 2 && !candidate?.linkedin_connected) skipLinkedin();
            openWizard(step);
          }}
        />
      </Reveal>

      <GroundingWizard
        open={wizardOpen}
        initialStep={wizardStep}
        candidate={candidate}
        linkedinConfigured={linkedinConfigured}
        nutrientConfigured={nutrientConfigured}
        linkedinCallback={linkedinCallback}
        busy={busy}
        error={actionError}
        onClose={closeWizard}
        onComplete={finishWizard}
        onConnectLinkedin={connectLinkedin}
        onUpload={uploadResume}
        onSkipLinkedin={skipLinkedin}
      />

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

      {showProfile && candidate ? (
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
                <div className="flex min-w-0 items-start gap-3">
                  {candidate.picture_url ? (
                    // LinkedIn CDN URLs are short-lived; initials remain the fallback.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={candidate.picture_url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold tracking-tight text-zinc-950">
                      {candidate.full_name ?? "Imported LinkedIn member"}
                    </h2>
                    {candidate.headline ? (
                      <p className="mt-0.5 text-sm text-zinc-600">{candidate.headline}</p>
                    ) : null}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                      {homeCity(candidate.location) ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {homeCity(candidate.location)}
                        </span>
                      ) : null}
                      {candidate.email ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {candidate.email}
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
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.linkedin_connected ? (
                    <Badge tone="positive">via linkedin</Badge>
                  ) : null}
                  {candidate.grounding_sources
                    .filter((source) => source !== "linkedin")
                    .map((source) => (
                      <Badge key={source} tone="positive">
                        via {source}
                      </Badge>
                    ))}
                </div>
              </div>

              <div className="space-y-6 px-5 py-5">
                {identityOnly ? (
                  <Callout tone="warning" icon={<FileUp className="h-4 w-4" />}>
                    LinkedIn only shared identity with this app. Continue setup above to import a
                    LinkedIn PDF or resume — no form required.
                  </Callout>
                ) : null}

                {candidate.summary ? (
                  <p className="text-sm leading-6 text-zinc-700">{candidate.summary}</p>
                ) : null}

                {(candidate.websites ?? []).length > 0 ? (
                  <Group icon={<Globe className="h-3.5 w-3.5" />} title="Links">
                    <TimelineList
                      icon={<Link2 className="h-3.5 w-3.5" />}
                      items={candidate.websites.map((url) => ({
                        key: url,
                        title: url.replace(/^https?:\/\//, ""),
                      }))}
                    />
                  </Group>
                ) : null}

                {(candidate.skills ?? []).length > 0 ? (
                  <Group icon={<Wrench className="h-3.5 w-3.5" />} title="Skills">
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.skills.map((skill) => (
                        <Badge key={skill}>{skill}</Badge>
                      ))}
                    </div>
                  </Group>
                ) : null}

                {(candidate.experience ?? []).length > 0 ? (
                  <Group icon={<Briefcase className="h-3.5 w-3.5" />} title="Experience">
                    <RoleList roles={candidate.experience} icon={<Building2 className="h-3.5 w-3.5" />} />
                  </Group>
                ) : null}

                {(candidate.education ?? []).length > 0 ? (
                  <Group icon={<GraduationCap className="h-3.5 w-3.5" />} title="Education">
                    <TimelineList
                      icon={<GraduationCap className="h-3.5 w-3.5" />}
                      items={groupWrappedLines(candidate.education, isEducationHeader).map((item, index) => ({
                        key: `${item.title}-${index}`,
                        title: item.title,
                        subtitle: item.description,
                        date: item.date,
                        tags: item.stack,
                        bullets: item.bullets,
                      }))}
                    />
                  </Group>
                ) : null}

                {(candidate.volunteering ?? []).length > 0 ? (
                  <Group icon={<HeartHandshake className="h-3.5 w-3.5" />} title="Volunteering">
                    <RoleList
                      roles={candidate.volunteering}
                      icon={<HeartHandshake className="h-3.5 w-3.5" />}
                    />
                  </Group>
                ) : null}

                {(candidate.projects ?? []).length > 0 ? (
                  <Group icon={<FolderKanban className="h-3.5 w-3.5" />} title="Projects">
                    <ProjectList projects={candidate.projects} />
                  </Group>
                ) : null}

                {(candidate.languages ?? []).length > 0 ? (
                  <Group icon={<Globe className="h-3.5 w-3.5" />} title="Languages">
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.languages.map((entry) => (
                        <Badge key={entry} tone="neutral">
                          {entry}
                        </Badge>
                      ))}
                    </div>
                  </Group>
                ) : null}

                {(candidate.honors ?? []).length > 0 ? (
                  <Group icon={<Award className="h-3.5 w-3.5" />} title="Honors">
                    <TimelineList
                      icon={<Award className="h-3.5 w-3.5" />}
                      items={groupWrappedLines(candidate.honors, isHonorHeader).map((item, index) => ({
                        key: `${item.title}-${index}`,
                        title: item.title,
                        subtitle: item.description,
                        date: item.date,
                        bullets: item.bullets,
                      }))}
                    />
                  </Group>
                ) : null}

                {(candidate.certifications ?? []).length > 0 ? (
                  <Group icon={<BadgeCheck className="h-3.5 w-3.5" />} title="Certifications">
                    <TimelineList
                      icon={<BadgeCheck className="h-3.5 w-3.5" />}
                      items={groupWrappedLines(candidate.certifications, isCertHeader).map((item, index) => ({
                        key: `${item.title}-${index}`,
                        title: item.title,
                        subtitle: item.description,
                        date: item.date,
                        tags: item.stack,
                        bullets: item.bullets,
                      }))}
                    />
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
                  {integrations
                    .filter((integration) => integration.provider !== "nutrient")
                    .map((integration) => (
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
                          onClick={() => {
                            if (
                              integration.provider === "linkedin" &&
                              !integration.connected &&
                              integration.configured
                            ) {
                              void connectLinkedin();
                              return;
                            }
                            void run(integration.provider, () =>
                              api.connectIntegration(integration.provider, !integration.connected),
                            );
                          }}
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

          {grounded ? (
            <>
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
        </>
      ) : null}
    </div>
  );
}

const DATE_AT_END =
  /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+)?(?:19|20)\d{2}(?:\s*[-–—]\s*(?:Present|(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+)?(?:19|20)\d{2}))?\s*$/i;

type ParsedLine = {
  title: string;
  stack: string[];
  date: string | null;
  description: string | null;
  bullets: string[];
};

type TimelineEntry = {
  key: string;
  title: string;
  subtitle?: string | null;
  date?: string | null;
  location?: string | null;
  tags?: string[];
  description?: string | null;
  bullets?: string[];
};

function parseDatedLine(entry: string): Omit<ParsedLine, "bullets"> {
  const cleaned = entry.replace(/^[•*\-–—]\s*/, "").trim();
  const dateMatch = cleaned.match(DATE_AT_END);
  const date = dateMatch && dateMatch[0].trim().length >= 4 ? dateMatch[0].trim() : null;
  const withoutDate = date ? cleaned.slice(0, cleaned.length - date.length).trim() : cleaned;
  const parts = withoutDate
    .split(/\s*[|·]\s+|\s+[—–]\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const title = parts[0] ?? withoutDate;
  const rest = parts.slice(1).join(" · ").trim();
  const tokens = rest
    .split(/,\s*/)
    .map((token) => token.trim())
    .filter(Boolean);
  const looksLikeStack =
    tokens.length > 1 && tokens.every((token) => token.length <= 28 && token.split(/\s+/).length <= 3);

  return {
    title,
    stack: looksLikeStack ? tokens : [],
    date,
    description: looksLikeStack ? null : rest || null,
  };
}

function isWrappedLine(entry: string): boolean {
  const trimmed = entry.trim();
  return !trimmed || /^[•*\-–—]\s/.test(trimmed) || trimmed[0] === trimmed[0].toLowerCase();
}

function isProjectHeader(entry: string): boolean {
  if (isWrappedLine(entry)) return false;
  return /[|·]/.test(entry) || DATE_AT_END.test(entry);
}

function isEducationHeader(entry: string): boolean {
  if (isWrappedLine(entry) || /coursework\s*:/i.test(entry)) return false;
  return (
    /\b(university|college|school|bachelor|master|diploma|phd|degree)\b/i.test(entry) ||
    DATE_AT_END.test(entry)
  );
}

function isCertHeader(entry: string): boolean {
  if (isWrappedLine(entry)) return false;
  return (
    /\b(certificate|certification|certified|license|nanodegree)\b/i.test(entry) ||
    /[|·]/.test(entry) ||
    DATE_AT_END.test(entry)
  );
}

function isHonorHeader(entry: string): boolean {
  return !isWrappedLine(entry);
}

function groupWrappedLines(entries: string[], isHeader: (entry: string) => boolean): ParsedLine[] {
  const items: ParsedLine[] = [];
  for (const entry of entries) {
    const text = entry.replace(/^[•*\-–—]\s*/, "").trim();
    if (!text) continue;
    if (!items.length || isHeader(entry)) {
      items.push({ ...parseDatedLine(entry), bullets: [] });
      continue;
    }
    const previous = items[items.length - 1];
    const last = previous.bullets.at(-1);
    if (last && (text[0] === text[0].toLowerCase() || last.endsWith(",") || last.endsWith("-"))) {
      previous.bullets[previous.bullets.length - 1] = `${last} ${text}`;
    } else {
      previous.bullets.push(text);
    }
  }
  return items;
}

function TimelineList({ items, icon }: { items: TimelineEntry[]; icon: React.ReactNode }) {
  return (
    <ol className="relative space-y-5">
      {items.map((item, index) => (
        <li key={item.key} className="relative flex gap-3">
          {index < items.length - 1 ? (
            <span className="absolute left-[13px] top-7 bottom-[-20px] w-px bg-zinc-200" />
          ) : null}
          <IconTile tone="neutral" className="mt-0.5">
            {icon}
          </IconTile>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-zinc-900">{item.title}</p>
              {item.date ? <p className="tnum text-xs text-zinc-500">{item.date}</p> : null}
            </div>
            {item.location ? <p className="mt-0.5 text-xs text-zinc-500">{item.location}</p> : null}
            {item.subtitle ? <p className="mt-1 text-sm leading-6 text-zinc-700">{item.subtitle}</p> : null}
            {item.description ? <p className="mt-1 text-sm leading-6 text-zinc-700">{item.description}</p> : null}
            {item.tags && item.tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <Badge key={tag} tone="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
            {item.bullets && item.bullets.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {item.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2 text-sm leading-6 text-zinc-700">
                    <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-zinc-400" />
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function ProjectList({ projects }: { projects: string[] }) {
  return (
    <TimelineList
      icon={<FolderKanban className="h-3.5 w-3.5" />}
      items={groupWrappedLines(projects, isProjectHeader).map((item, index) => ({
        key: `${item.title}-${item.date}-${index}`,
        title: item.title,
        date: item.date,
        description: item.description,
        tags: item.stack,
        bullets: item.bullets,
      }))}
    />
  );
}

function RoleList({
  roles,
  icon,
}: {
  roles: Experience[];
  icon: React.ReactNode;
}) {
  return (
    <TimelineList
      icon={icon}
      items={roles.map((role) => ({
        key: `${role.company}-${role.title}-${role.start_date}`,
        title: [role.title, role.company].filter(Boolean).join(" · "),
        date: [role.start_date, role.end_date].filter(Boolean).join(" – ") || null,
        location: role.location,
        bullets: role.bullets,
      }))}
    />
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
