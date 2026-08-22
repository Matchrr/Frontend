import { PageHeader } from "@/components/PageHeader";

export default function HomePage() {
  return (
    <div>
      <PageHeader
        title="Get grounded"
        description="Connect LinkedIn or upload a resume. Matchr extracts a Ground Truth Profile so you never fill out a form from scratch."
      />
      <div className="grid max-w-3xl gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-medium">LinkedIn</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Pull headline, experience, skills, and education into your profile.
          </p>
          <button
            type="button"
            className="mt-4 rounded-md bg-zinc-950 px-3 py-2 text-sm text-white"
          >
            Connect LinkedIn
          </button>
        </section>
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-medium">Resume PDF</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Optional enrichment or override path via Nutrient document ingest.
          </p>
          <label className="mt-4 inline-block cursor-pointer rounded-md border border-zinc-200 px-3 py-2 text-sm">
            Upload PDF
            <input type="file" accept="application/pdf" className="hidden" />
          </label>
        </section>
      </div>
    </div>
  );
}
