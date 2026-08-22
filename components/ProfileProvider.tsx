"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { api } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import type { Candidate, Overview } from "@/lib/types";

type ProfileState = {
  candidate: Candidate | null;
  overview: Overview | null;
  loading: boolean;
  /**
   * True only until the first load resolves. Refreshes keep the previous
   * profile on screen, so gating a page on `loading` would tear down its local
   * state every time something calls `refresh`.
   */
  initializing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const ProfileContext = createContext<ProfileState | null>(null);

async function loadProfile() {
  const [candidate, overview] = await Promise.all([api.me(), api.overview()]);
  return { candidate, overview };
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { data, loading, error, reload } = useAsync(loadProfile);

  const value = useMemo<ProfileState>(
    () => ({
      candidate: data?.candidate ?? null,
      overview: data?.overview ?? null,
      loading,
      initializing: loading && data === null,
      error,
      refresh: reload,
    }),
    [data, loading, error, reload],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileState {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used inside a ProfileProvider");
  }
  return context;
}
