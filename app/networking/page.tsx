"use client";

import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  ExternalLink,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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
  type Tone,
} from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate, plural } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";

type Filter = "all" | "saved" | "virtual";

const FORMAT_TONES: Record<string, Tone> = {
  virtual: "info",
  hybrid: "brand",
  "in-person": "neutral",
};

export default function NetworkingPage() {
  const { candidate, initializing, refresh: refreshProfile } = useProfile();
  const grounded = candidate?.grounded ?? false;
  const {
    data: events,
    loading,
    error,
    setData,
  } = useAsync(() => api.eventMatches(10), String(grounded));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  async function toggleSave(eventId: string, saved: boolean) {
    setBusyId(eventId);
    try {
      setData(await api.saveEvent(eventId, saved));
      await refreshProfile();
    } finally {
      setBusyId(null);
    }
  }

  // Without this the ungrounded empty state flashes before the profile lands.
  if (initializing) {
    return (
      <div>
        <PageHeader
          title="Networking"
          description="The most compatible live events for your profile and career goals."
        />
        <SkeletonList rows={4} />
      </div>
    );
  }

  if (!grounded) {
    return (
      <div>
        <PageHeader
          title="Networking"
          description="The most compatible live events for your profile and career goals — a short list, not an unfiltered calendar."
        />
        <EmptyState
          icon={<CalendarDays className="h-5 w-5" />}
          title="No profile to match events against"
          description="Events are ranked using the same profile and career-goal signal as jobs, weighted toward the skills in your growth plan."
          action={
            <Link href="/profile">
              <Button>Ground your profile</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const all = events ?? [];
  const saved = all.filter((event) => event.saved);
  const virtual = all.filter((event) => event.format !== "in-person");
  const visible = filter === "saved" ? saved : filter === "virtual" ? virtual : all;

  const tabs: ReadonlyArray<TabItem<Filter>> = [
    { value: "all", label: "All matched", count: all.length },
    { value: "virtual", label: "Remote-friendly", count: virtual.length },
    { value: "saved", label: "Saved", count: saved.length },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={
          <Badge tone="brand" dot>
            {all.length} compatible {plural(all.length, "event")}
          </Badge>
        }
        title="Networking"
        description="Meetups, conferences, workshops, and office hours ranked against your target role and your open skill gaps. Each one comes with a reason it is worth your evening."
      />

      <div className="mb-4">
        <SegmentedTabs items={tabs} value={filter} onChange={setFilter} />
      </div>

      {error ? (
        <div className="mb-4">
          <ErrorNote message={error} />
        </div>
      ) : null}

      {loading ? (
        <SkeletonList rows={4} height="h-44" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="h-5 w-5" />}
          title={filter === "saved" ? "Nothing saved yet" : "No events at this filter"}
          description={
            filter === "saved"
              ? "Save the events worth your evening and they will collect here."
              : "Widen the filter or refresh your target role to pull a different slice of the calendar."
          }
          action={
            <Button variant="secondary" onClick={() => setFilter("all")}>
              Show all matched events
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((event, index) => (
            <Reveal key={event.id} delay={index * 55}>
              <Card className="p-5" interactive>
                <div className="flex items-start gap-4">
                  {event.match_percent !== null ? (
                    <ScoreRing
                      percent={event.match_percent}
                      size={48}
                      delay={index * 55 + 80}
                      label={`${event.match_percent} percent compatible`}
                    />
                  ) : null}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold tracking-tight text-zinc-950">
                          {event.name}
                        </h2>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                          {event.organizer ? (
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {event.organizer}
                            </span>
                          ) : null}
                          {event.location ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          ) : null}
                          {formatDate(event.starts_at) ? (
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(event.starts_at)}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {event.saved ? <Badge tone="positive">Saved</Badge> : null}
                        <Badge tone={FORMAT_TONES[event.format] ?? "neutral"}>
                          {event.format}
                        </Badge>
                        {event.match_percent !== null ? (
                          <Badge tone={matchTone(event.match_percent)}>
                            {matchLabel(event.match_percent)}
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    {event.why_this_event ? (
                      <Callout
                        className="mt-3"
                        label="Why this event."
                        icon={<Sparkles className="h-3.5 w-3.5" />}
                      >
                        {event.why_this_event}
                      </Callout>
                    ) : null}

                    {event.attendee_profile ? (
                      <p className="mt-2 text-xs text-zinc-500">
                        Room is mostly {event.attendee_profile}
                      </p>
                    ) : null}

                    {event.topics.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {event.topics.map((topic) => (
                          <Badge key={topic}>{topic}</Badge>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant={event.saved ? "secondary" : "primary"}
                        loading={busyId === event.id}
                        disabled={busyId !== null}
                        onClick={() => toggleSave(event.id, !event.saved)}
                      >
                        {event.saved ? (
                          <BookmarkCheck className="h-3.5 w-3.5" />
                        ) : (
                          <Bookmark className="h-3.5 w-3.5" />
                        )}
                        {event.saved ? "Saved" : "Save event"}
                      </Button>
                      <Link href="/outreach">
                        <Button size="sm" variant="ghost">
                          Draft a note to the organizer
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                      {event.url ? (
                        <a href={event.url} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="ghost">
                            Event page
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
