"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setData: (value: T) => void;
};

type Resolved<T> = {
  key: string;
  data: T | null;
  error: string | null;
};

// Sentinel key meaning "nothing has resolved for the current key yet", which is
// what `loading` is derived from. Deriving it avoids a redundant state write.
const PENDING = "\u0000pending";

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Something went wrong.";
}

/**
 * Runs `loader` on mount and whenever `key` changes.
 *
 * `key` rather than a dependency array so the dependency list stays a literal,
 * which the React Compiler lint rules require.
 */
export function useAsync<T>(loader: () => Promise<T>, key = "default"): AsyncState<T> {
  const [state, setState] = useState<Resolved<T>>({ key: PENDING, data: null, error: null });

  const loaderRef = useRef(loader);
  const keyRef = useRef(key);
  useEffect(() => {
    loaderRef.current = loader;
    keyRef.current = key;
  });

  useEffect(() => {
    let active = true;
    loaderRef
      .current()
      .then((data) => {
        if (active) setState({ key, data, error: null });
      })
      .catch((cause: unknown) => {
        if (active) setState({ key, data: null, error: describe(cause) });
      });
    return () => {
      active = false;
    };
  }, [key]);

  const reload = useCallback(async () => {
    setState((previous) => ({ ...previous, key: PENDING }));
    try {
      setState({ key: keyRef.current, data: await loaderRef.current(), error: null });
    } catch (cause) {
      setState({ key: keyRef.current, data: null, error: describe(cause) });
    }
  }, []);

  const setData = useCallback((value: T) => {
    setState((previous) => ({ ...previous, data: value, error: null }));
  }, []);

  return {
    data: state.data,
    loading: state.key !== key,
    error: state.error,
    reload,
    setData,
  };
}
