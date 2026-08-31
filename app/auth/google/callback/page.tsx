"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AuthScreen } from "@/components/AuthScreen";
import { ErrorNote } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { setSession } from "@/lib/session";

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <AuthScreen title="Signing you in" description="Finishing Google sign-in…">
          <p className="mt-5 text-sm text-zinc-500">One moment.</p>
        </AuthScreen>
      }
    >
      <GoogleCallback />
    </Suspense>
  );
}

function GoogleCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");
  const [message, setMessage] = useState<string | null>(error);

  useEffect(() => {
    if (error || !token) {
      if (!error && !token) {
        setMessage("Google sign-in did not return a session. Try again.");
      }
      return;
    }

    let active = true;
    (async () => {
      try {
        window.localStorage.setItem("matchr:auth-token", token);
        const user = await api.authMe();
        if (!active) return;
        setSession({ token, user });
        router.replace("/");
      } catch (cause) {
        if (!active) return;
        window.localStorage.removeItem("matchr:auth-token");
        setMessage(cause instanceof ApiError ? cause.message : "Could not finish Google sign-in.");
      }
    })();

    return () => {
      active = false;
    };
  }, [error, token, router]);

  if (!message && token) {
    return (
      <AuthScreen title="Signing you in" description="Google confirmed the account. Loading Matchr…">
        <p className="mt-5 text-sm text-zinc-500">One moment.</p>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen title="Google sign-in" description="This Google account could not be signed in.">
      <div className="mt-5 space-y-4">
        {message ? <ErrorNote message={message} /> : null}
        <Link
          href="/login"
          className="block text-center text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          Back to sign in
        </Link>
      </div>
    </AuthScreen>
  );
}
