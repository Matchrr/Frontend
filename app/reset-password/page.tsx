"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AuthScreen } from "@/components/AuthScreen";
import { useAuth } from "@/components/AuthProvider";
import { Button, ErrorNote, Field, fieldClass } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { passwordPolicyMessage } from "@/lib/password";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthScreen title="Set a new password" description="Loading your reset link…">
          <p className="mt-5 text-sm text-zinc-500">One moment.</p>
        </AuthScreen>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();
  const token = (searchParams.get("magic_token") ?? searchParams.get("token") ?? "").trim();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkInvalid = !email || !token;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
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
      await resetPassword(email, token, password);
      router.replace("/");
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "This reset link is invalid or has expired. Request a new one.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Set a new password"
      description="Choose a password for this account. The link in your email can only be used once."
    >
      {linkInvalid ? (
        <div className="mt-5 space-y-4">
          <ErrorNote message="This reset link is missing a token or email. Request a new one from the sign-in page." />
          <Link
            href="/forgot-password"
            className="block text-center text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Request a new link
          </Link>
        </div>
      ) : (
        <>
          {error ? (
            <div className="mt-4">
              <ErrorNote message={error} />
            </div>
          ) : null}
          <form className="mt-5 space-y-3.5" onSubmit={(event) => void onSubmit(event)}>
            <Field label="Email">
              <input className={fieldClass} type="email" value={email} readOnly autoComplete="email" />
            </Field>
            <Field label="New password" hint="At least 8 characters, with a letter and a number.">
              <input
                className={fieldClass}
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
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
            <Button type="submit" className="mt-2 w-full" loading={submitting} disabled={submitting}>
              Update password
            </Button>
            <Link
              href="/login"
              className="block text-center text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Back to sign in
            </Link>
          </form>
        </>
      )}
    </AuthScreen>
  );
}
