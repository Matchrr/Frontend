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

export async function xanoForgotPassword(email: string, origin: string): Promise<void> {
  try {
    await xanoRequest("/reset/request-reset-link", {
      method: "GET",
      params: { email, origin: origin.replace(/\/$/, "") },
    });
  } catch (cause) {
    if (cause instanceof ApiError && (cause.status === 400 || cause.status === 404)) {
      return;
    }
    throw cause;
  }
}

export async function xanoResetPassword(
  email: string,
  token: string,
  password: string,
): Promise<AuthSession> {
  const session = await completeAuth(
    await xanoRequest("/reset/magic-link-login", {
      method: "POST",
      body: { email, magic_token: token },
    }).catch(rewriteResetError),
  );
  await xanoRequest("/reset/update_password", {
    method: "POST",
    body: { password, confirm_password: password },
    token: session.token,
  });
  return session;
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
  init: { method: string; body?: unknown; token?: string; params?: Record<string, string> },
): Promise<unknown> {
  if (!XANO_AUTH_URL) {
    throw new ApiError(503, "Xano is not configured. Set NEXT_PUBLIC_XANO_API_URL.");
  }

  const url = new URL(`${XANO_AUTH_URL}${path}`);
  if (init.params) {
    for (const [key, value] of Object.entries(init.params)) {
      if (value) url.searchParams.set(key, value);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
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

  if (!response.ok) {
    const message = await readXanoError(response);
    if (response.status === 404 && isMissingXanoRoute(message)) {
      throw new ApiError(
        503,
        "Xano auth endpoints were not found on this API group. Add the pre-built Signup, Login, Auth/me, and password-reset endpoints in the Xano dashboard.",
      );
    }
    throw new ApiError(response.status === 403 ? 401 : response.status, message);
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

function isMissingXanoRoute(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("unable to locate request") ||
    lower.includes("not found on this api") ||
    lower === "404 not found"
  );
}

const RESET_LINK_INVALID =
  "This reset link is invalid or has expired. Request a new one from the sign-in page.";

function rewriteResetError(cause: unknown): never {
  if (
    cause instanceof ApiError &&
    /token did not match|magic token has expired|already been used|password_reset\.token|magic_token is required/i.test(
      cause.message,
    )
  ) {
    throw new ApiError(400, RESET_LINK_INVALID);
  }
  throw cause;
}
