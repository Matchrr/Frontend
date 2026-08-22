import { PageHeader } from "@/components/PageHeader";

export default function GrowthPage() {
  return (
    <div>
      <PageHeader
        title="Growth plan"
        description="Skill-gap advice for your target role: courses, YouTube, certifications, and other resources. Not grammar nits or vague-bullet feedback."
      />
      <p className="text-sm text-zinc-500">Plan will load from GET /api/growth/plan.</p>
    </div>
  );
}
