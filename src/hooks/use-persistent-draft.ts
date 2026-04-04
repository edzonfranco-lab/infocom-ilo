import { useCallback, useEffect, useRef } from "react";

interface UsePersistentDraftOptions<T> {
  enabled?: boolean;
  isEmpty?: (value: T) => boolean;
  onRestore: (value: T) => void;
  storageKey: string;
  value: T;
}

interface StoredDraft<T> {
  updatedAt: number;
  value: T;
}

const MAX_DRAFT_AGE = 1000 * 60 * 60 * 24 * 7;

export function usePersistentDraft<T>({
  enabled = true,
  isEmpty,
  onRestore,
  storageKey,
  value,
}: UsePersistentDraftOptions<T>) {
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current || typeof window === "undefined") return;

    hydratedRef.current = true;

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw) as StoredDraft<T>;
      if (!parsed?.updatedAt || Date.now() - parsed.updatedAt > MAX_DRAFT_AGE) {
        window.localStorage.removeItem(storageKey);
        return;
      }

      onRestore(parsed.value);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [onRestore, storageKey]);

  useEffect(() => {
    if (!hydratedRef.current || typeof window === "undefined") return;

    if (!enabled) return;

    if (isEmpty?.(value)) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    const timeout = window.setTimeout(() => {
      const payload: StoredDraft<T> = {
        updatedAt: Date.now(),
        value,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [enabled, isEmpty, storageKey, value]);

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(storageKey);
  }, [storageKey]);

  return { clearDraft };
}