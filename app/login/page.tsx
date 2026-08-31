"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { Button, ErrorNote, Field, SegmentedTabs, fieldClass } from "@/components/ui";
import { ApiError } from "@/lib/api";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const { user, ready, required, status, login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
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

  const unavailable = status && !status.available && status.configured;

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white">
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-zinc-950">Matchr</p>
            <p className="text-[11px] text-zinc-500">Precision career copilot</p>
          </div>
        </div>

        <section className="rounded-2xl border border-line bg-surface p-6 shadow-card">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-950">
            {mode === "login" ? "Sign in" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-zinc-600">
            {required
              ? "Xano issues a JWT for this session. Subsequent API calls send it as a Bearer token."
              : "Sign in to bind this session to your Xano account. Matching still works if auth is optional."}
          </p>

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
            <Field label="Password" hint="At least 8 characters. Hashed with bcrypt on Xano.">
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
            {mode === "signup" ? (
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
            ) : null}
            <Button type="submit" className="mt-2 w-full" loading={submitting} disabled={submitting}>
              {mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
