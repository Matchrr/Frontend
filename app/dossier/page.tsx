import { PageHeader } from "@/components/PageHeader";

export default function DossierPage() {
  return (
    <div>
      <PageHeader
        title="Dossier"
        description="Tailored resume, cover letter, and ATS Q&A — grounded in verified history, exported as clean PDFs."
      />
      <p className="text-sm text-zinc-500">
        Generation will call the Backend, which delegates to the ai-service Tailoring Agent.
      </p>
    </div>
  );
}
