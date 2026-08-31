import { authHeaders, clearSession, getToken } from "@/lib/session";
import type { AuthSession, AuthStatus, AuthUser } from "@/lib/session";
import type {
  Application,
  Candidate,
  Dossier,
  GrowthPlan,
  Integration,
  Job,
  NetworkingEvent,
  OutreachDraft,
  OutreachThread,
  Overview,
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...authHeaders(),
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, `Cannot reach the Matchr backend at ${API_URL}. Is it running?`);
  }

  if (response.status === 401) {
    handleUnauthorized();
    throw new ApiError(401, await readError(response));
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function readError(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    if (typeof payload?.detail === "string") return payload.detail;
    if (Array.isArray(payload?.detail)) {
      return payload.detail.map((item: { msg?: string }) => item.msg ?? "Invalid input").join("; ");
    }
  } catch {
    // Fall through to the status text.
  }
  return `${response.status} ${response.statusText}`;
}

const post = <T,>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

function handleUnauthorized() {
  if (!getToken()) return;
  clearSession();
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  window.location.assign("/login");
}

export type JobSyncResult = {
  synced: number;
  at: string;
  source?: string;
  inserted?: number;
  updated?: number;
  embedded?: number;
  cached_queries?: number;
  harvested_queries?: number;
  warning?: string | null;
};

export type JobMatchFilters = {
  workModes?: string[];
  employmentTypes?: string[];
  payMin?: number | null;
  payPeriod?: string;
};

export const api = {
  authStatus: () => request<AuthStatus>("/api/auth/status"),
  login: (email: string, password: string) =>
    post<AuthSession>("/api/auth/login", { email, password }),
  signup: (email: string, password: string) =>
    post<AuthSession>("/api/auth/signup", { email, password }),
  authMe: () => request<AuthUser>("/api/auth/me"),
  logout: () => post<{ status: string }>("/api/auth/logout"),

  overview: () => request<Overview>("/api/overview"),

  me: () => request<Candidate>("/api/candidates/me"),
  updateMe: (payload: Partial<Pick<Candidate, "target_title" | "location" | "headline" | "summary">>) =>
    request<Candidate>("/api/candidates/me", { method: "PATCH", body: JSON.stringify(payload) }),
  connectLinkedin: () => post<Candidate>("/api/candidates/linkedin"),
  startLinkedinOAuth: () => request<{ url: string; configured: boolean; scopes: string[] }>(
    "/api/integrations/linkedin/authorize",
  ),
  uploadResume: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<Candidate>("/api/candidates/resume", { method: "POST", body: form });
  },
  resetProfile: () => post<Candidate>("/api/candidates/reset"),

  jobMatches: (limit = 10, filters?: JobMatchFilters) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (filters?.workModes?.length) params.set("work_modes", filters.workModes.join(","));
    if (filters?.employmentTypes?.length) {
      params.set("employment_types", filters.employmentTypes.join(","));
    }
    if (filters?.payMin != null) params.set("pay_min", String(filters.payMin));
    if (filters?.payPeriod) params.set("pay_period", filters.payPeriod);
    return request<Job[]>(`/api/jobs/matches?${params.toString()}`);
  },
  job: (jobId: string) => request<Job>(`/api/jobs/${jobId}`),
  syncJobs: (payload?: {
    work_modes?: string[];
    employment_types?: string[];
    pay_min?: number | null;
    pay_period?: string;
  }) => post<JobSyncResult>("/api/jobs/sync", payload ?? {}),

  applications: () => request<Application[]>("/api/applications"),
  targetJob: (jobId: string) => post<Application>("/api/applications", { job_id: jobId }),
  untargetJob: (jobId: string) =>
    request<void>(`/api/applications/${jobId}`, { method: "DELETE" }),

  growthPlan: () => request<GrowthPlan>("/api/growth/plan"),

  eventMatches: (limit = 8) => request<NetworkingEvent[]>(`/api/events/matches?limit=${limit}`),
  saveEvent: (eventId: string, saved: boolean) =>
    post<NetworkingEvent[]>(`/api/events/${eventId}/save`, { saved }),

  generateDossier: (jobId: string) => post<Dossier>(`/api/dossier/${jobId}`),
  dossier: (jobId: string) => request<Dossier>(`/api/dossier/${jobId}`),

  draftOutreach: (payload: {
    recipient_email: string;
    recipient_name?: string;
    job_id?: string;
    extra_context?: string;
  }) => post<OutreachDraft>("/api/outreach/draft", payload),
  sendOutreach: (payload: {
    recipient_email: string;
    subject: string;
    body: string;
    job_id?: string;
  }) => post<OutreachThread>("/api/outreach/send", { ...payload, approved: true }),
  threads: () => request<OutreachThread[]>("/api/outreach/threads"),

  integrations: () => request<Integration[]>("/api/integrations"),
  connectIntegration: (provider: string, connected: boolean) =>
    post<Integration[]>(`/api/integrations/${provider}/connect`, { connected }),
};
