"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { ApiError, api } from "@/lib/api";
import {
  clearSession,
  getCachedUser,
  getToken,
  setSession,
  subscribeSession,
  type AuthSession,
  type AuthStatus,
  type AuthUser,
} from "@/lib/session";
import { useAsync } from "@/lib/useAsync";
import { xanoAuthConfigured, xanoLogin, xanoMe, xanoSignup } from "@/lib/xano";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  status: AuthStatus | null;
  required: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function authenticate(
  email: string,
  password: string,
  mode: "login" | "signup",
): Promise<AuthSession> {
  const direct = xanoAuthConfigured();
  const send = mode === "signup" ? xanoSignup : xanoLogin;
  const fallback = mode === "signup" ? api.signup : api.login;

  if (direct) {
    try {
      return await send(email, password);
    } catch (cause) {
      // Network/CORS (0) or missing endpoints (503): FastAPI BFF still talks to Xano server-side.
      if (cause instanceof ApiError && (cause.status === 0 || cause.status === 503)) {
        return await fallback(email, password);
      }
      throw cause;
    }
  }
  return fallback(email, password);
}

async function restoreUser(token: string | null): Promise<AuthUser | null> {
  if (!token) return null;
  try {
    if (xanoAuthConfigured()) {
      try {
        const user = await xanoMe(token);
        setSession({ token, user });
        return user;
      } catch (cause) {
        if (!(cause instanceof ApiError) || (cause.status !== 0 && cause.status !== 503)) {
          throw cause;
        }
      }
    }
    const user = await api.authMe();
    setSession({ token, user });
    return user;
  } catch {
    clearSession();
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const token = useSyncExternalStore(subscribeSession, getToken, () => null);
  const cachedUser = useSyncExternalStore(subscribeSession, getCachedUser, () => null);
  const { data: status, loading: statusLoading } = useAsync(api.authStatus, "auth-status");
  const restored = useAsync(() => restoreUser(token), token ?? "anon");

  const login = useCallback(async (email: string, password: string) => {
    setSession(await authenticate(email, password, "login"));
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    setSession(await authenticate(email, password, "signup"));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Client session is the source of truth for JWTs.
    }
    clearSession();
  }, []);

  const required = Boolean(status?.required);
  const user = restored.data ?? cachedUser;
  const ready = !statusLoading && (token === null || user !== null || !restored.loading);

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      ready,
      status: status ?? null,
      required,
      error: restored.error,
      login,
      signup,
      logout,
    }),
    [user, token, ready, status, required, restored.error, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
