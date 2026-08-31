import { ApiError } from "@/lib/api";
import type { AuthSession, AuthUser } from "@/lib/session";

const XANO_URL = (process.env.NEXT_PUBLIC_XANO_API_URL ?? "").replace(/\/$/, "");
const XANO_AUTH_URL = (process.env.NEXT_PUBLIC_XANO_AUTH_API_URL ?? XANO_URL).replace(/\/$/, "");

export function xanoAuthConfigured(): boolean {
  return Boolean(XANO_AUTH_URL);
}

export async function xanoSignup(email: string, password: string): Promise<AuthSession> {
  return completeAuth(await xanoRequest("/auth/signup", { method: "POST", body: { email, password } }));
}

export async function xanoLogin(email: string, password: string): Promise<AuthSession> {
  return completeAuth(await xanoRequest("/auth/login", { method: "POST", body: { email, password } }));
}

export async function xanoMe(token: string): Promise<AuthUser> {
  const payload = await xanoRequest("/auth/me", { method: "GET", token });
  const user = readUser(payload);
  if (!user) {
    throw new ApiError(502, "Xano /auth/me did not return a user record.");
  }
  return user;
}

async function completeAuth(payload: unknown): Promise<AuthSession> {
  const token = readToken(payload);
  const user = readUser(payload);
  if (user?.email) {
    return { token, user };
  }
  return { token, user: await xanoMe(token) };
}

async function xanoRequest(
  path: string,
  init: { method: string; body?: unknown; token?: string },
): Promise<unknown> {
  if (!XANO_AUTH_URL) {
    throw new ApiError(503, "Xano is not configured. Set NEXT_PUBLIC_XANO_API_URL.");
  }

  let response: Response;
  try {
    response = await fetch(`${XANO_AUTH_URL}${path}`, {
      method: init.method,
      cache: "no-store",
      headers: {
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(0, `Cannot reach Xano at ${XANO_AUTH_URL}.`);
  }

  if (response.status === 404) {
    throw new ApiError(
      503,
      "Xano auth endpoints were not found on this API group. Add the pre-built Signup, Login, and Auth/me endpoints in the Xano dashboard.",
    );
  }

  if (!response.ok) {
    throw new ApiError(response.status === 403 ? 401 : response.status, await readXanoError(response));
  }

  if (response.status === 204) return {};
  return response.json();
}

function readToken(payload: unknown): string {
  if (typeof payload === "string" && payload.includes(".")) return payload;
  if (!payload || typeof payload !== "object") {
    throw new ApiError(502, "Xano did not return an auth token.");
  }
  const record = payload as Record<string, unknown>;
  for (const key of ["authToken", "auth_token", "AuthToken", "token"]) {
    const value = record[key];
    if (typeof value === "string" && value) return value;
  }
  throw new ApiError(502, "Xano did not return an auth token.");
}

function readUser(payload: unknown): AuthUser | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const raw = (record.user && typeof record.user === "object" ? record.user : record) as Record<
    string,
    unknown
  >;
  const rawId = raw.id ?? raw.user_id;
  if (rawId === undefined || rawId === null) return null;
  const name =
    (typeof raw.name === "string" && raw.name.trim() ? raw.name : null) ??
    (typeof raw.full_name === "string" && raw.full_name.trim() ? raw.full_name : null);
  return {
    id: String(rawId),
    email: typeof raw.email === "string" && raw.email ? raw.email : null,
    name,
    created_at: (raw.created_at as string | number | null | undefined) ?? null,
  };
}

async function readXanoError(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    if (typeof payload?.message === "string") return payload.message;
    if (typeof payload?.detail === "string") return payload.detail;
  } catch {
    // Fall through.
  }
  return `${response.status} ${response.statusText}`;
}
