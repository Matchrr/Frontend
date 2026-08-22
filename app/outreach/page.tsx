import { PageHeader } from "@/components/PageHeader";

export default function OutreachPage() {
  return (
    <div>
      <PageHeader
        title="Outreach"
        description="Draft a grounded cold email, edit it, then send from your own Gmail. Nothing leaves without your approval."
      />
      <form className="max-w-xl space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
        <label className="block text-sm">
          Recipient
          <input
            type="email"
            placeholder="hiring.manager@company.com"
            className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Draft
          <textarea
            rows={8}
            placeholder="AI draft appears here after you generate it."
            className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2"
          />
        </label>
        <div className="flex gap-2">
          <button type="button" className="rounded-md bg-zinc-950 px-3 py-2 text-sm text-white">
            Generate draft
          </button>
          <button type="button" className="rounded-md border border-zinc-200 px-3 py-2 text-sm">
            Send via Gmail
          </button>
        </div>
      </form>
    </div>
  );
}
