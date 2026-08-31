"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthScreen } from "@/components/AuthScreen";
import { useAuth } from "@/components/AuthProvider";
import { Button, ErrorNote, Field, SegmentedTabs, fieldClass } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { passwordPolicyMessage } from "@/lib/password";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const { user, ready, required, status, login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && user) {
      router.replace("/");
    }
  }, [ready, user, router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (mode === "signup" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    const policy = passwordPolicyMessage(password);
    if (policy) {
      setError(policy);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signup(email.trim().toLowerCase(), password);
      } else {
        await login(email.trim().toLowerCase(), password);
      }
      router.replace("/");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not authenticate.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setGoogleSubmitting(true);
    try {
      const { url } = await api.googleAuthorize();
      window.location.assign(url);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Google sign-in is not available yet.",
      );
      setGoogleSubmitting(false);
    }
  }

  const unavailable = status && !status.available && status.configured;
  const googleReady = Boolean(status?.google);

  return (
    <AuthScreen
      title={mode === "login" ? "Sign in" : "Create your account"}
      description={
        required
          ? "Use Google to create an account or sign in. Email and password still work."
          : "Sign in to bind this session to your Xano account. Matching still works if auth is optional."
      }
    >
      <div className="mt-4">
        <SegmentedTabs
          items={[
            { value: "login", label: "Sign in" },
            { value: "signup", label: "Create account" },
          ]}
          value={mode}
          onChange={(next) => {
            setMode(next);
            setError(null);
          }}
        />
      </div>

      {unavailable ? (
        <div className="mt-4">
          <ErrorNote message="Xano is configured, but this API group does not expose /auth/signup, /auth/login, or /auth/me yet. Add those pre-built Authentication endpoints in the Xano dashboard." />
        </div>
      ) : null}

      {error ? (
        <div className="mt-4">
          <ErrorNote message={error} />
        </div>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        className="mt-5 w-full"
        loading={googleSubmitting}
        disabled={googleSubmitting || submitting}
        onClick={() => void onGoogle()}
      >
        <GoogleMark />
        Continue with Google
      </Button>
      {!googleReady ? (
        <p className="mt-2 text-center text-xs text-zinc-500">
          Google sign-in needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the backend.
        </p>
      ) : null}

      <div className="mt-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form className="mt-5 space-y-3.5" onSubmit={(event) => void onSubmit(event)}>
        <Field label="Email">
          <input
            className={fieldClass}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Password" hint="At least 8 characters, with a letter and a number.">
          <input
            className={fieldClass}
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        {mode === "login" ? (
          <p className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
            >
              Forgot password?
            </Link>
          </p>
        ) : (
          <Field label="Confirm password">
            <input
              className={fieldClass}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </Field>
        )}
        <Button type="submit" className="mt-2 w-full" loading={submitting} disabled={submitting || googleSubmitting}>
          {mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </form>
    </AuthScreen>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.46a5.52 5.52 0 0 1-2.4 3.63v3.02h3.88c2.27-2.09 3.55-5.17 3.55-8.68Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.02c-1.08.72-2.47 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.12A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.27V6.61H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.12Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.43-3.43C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.61l4 3.12C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}
