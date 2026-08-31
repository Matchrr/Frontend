"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthScreen } from "@/components/AuthScreen";
import { useAuth } from "@/components/AuthProvider";
import { Button, Callout, ErrorNote, Field, fieldClass } from "@/components/ui";
import { ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const { status, requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not send a reset email.");
    } finally {
      setSubmitting(false);
    }
  }

  const unavailable = status && !status.available && status.configured;

  return (
    <AuthScreen
      title="Reset your password"
      description="Enter the email on your account. If it exists, we will send a one-time link that expires in 60 minutes."
    >
      {unavailable ? (
        <div className="mt-4">
          <ErrorNote message="Xano is configured, but this API group does not expose password-reset endpoints yet." />
        </div>
      ) : null}

      {error ? (
        <div className="mt-4">
          <ErrorNote message={error} />
        </div>
      ) : null}

      {sent ? (
        <div className="mt-5 space-y-4">
          <Callout tone="positive">
            If an account exists for that email, a reset link is on its way. Check your inbox and spam
            folder.
          </Callout>
          <Link
            href="/login"
            className="block text-center text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
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
          <Button type="submit" className="mt-2 w-full" loading={submitting} disabled={submitting}>
            Send reset link
          </Button>
          <Link
            href="/login"
            className="block text-center text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Back to sign in
          </Link>
        </form>
      )}
    </AuthScreen>
  );
}
