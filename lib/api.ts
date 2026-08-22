const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string }>("/api/health"),
  me: () => request("/api/candidates/me"),
  jobMatches: () => request("/api/jobs/matches"),
  growthPlan: () => request("/api/growth/plan"),
  eventMatches: () => request("/api/events/matches"),
  integrations: () => request("/api/integrations"),
};
