import { PageHeader } from "@/components/PageHeader";

export default function NetworkingPage() {
  return (
    <div>
      <PageHeader
        title="Networking"
        description="The most compatible live events for your profile and career goals — meetups, conferences, workshops — with a short why-this-event note."
      />
      <p className="text-sm text-zinc-500">Events will load from GET /api/events/matches.</p>
    </div>
  );
}
