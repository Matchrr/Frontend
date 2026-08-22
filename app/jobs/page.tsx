import { PageHeader } from "@/components/PageHeader";

export default function JobsPage() {
  return (
    <div>
      <PageHeader
        title="Job matches"
        description="Top 5–10 live roles ranked by semantic similarity and an LLM Fit Scorecard — not a 500-application dump."
      />
      <p className="text-sm text-zinc-500">Matches will load from GET /api/jobs/matches.</p>
    </div>
  );
}
