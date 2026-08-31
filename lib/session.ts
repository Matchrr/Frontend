const TOKEN_KEY = "matchr:auth-token";
const USER_KEY = "matchr:auth-user";
let cachedUserRaw: string | null | undefined;
let cachedUserValue: AuthUser | null = null;

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  created_at?: string | number | null;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type AuthStatus = {
  provider: "xano";
  configured: boolean;
  available: boolean;
  required: boolean;
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeSession(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getCachedUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (raw === cachedUserRaw) return cachedUserValue;
  cachedUserRaw = raw;
  if (!raw) {
    cachedUserValue = null;
    return cachedUserValue;
  }
  try {
    const parsed = JSON.parse(raw) as AuthUser;
    cachedUserValue = parsed?.id ? parsed : null;
  } catch {
    cachedUserValue = null;
  }
  return cachedUserValue;
}

export function setSession(session: AuthSession) {
  window.localStorage.setItem(TOKEN_KEY, session.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  emit();
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  emit();
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
