import { useState, useCallback } from 'react';

/** Key prefix to avoid collisions with other apps in the same origin. */
const KEY_PREFIX = 'mandir-mahjong:';

/**
 * A generic hook that mirrors `useState` but persists the value to
 * `localStorage` under a namespaced key (`mandir-mahjong:<key>`).
 *
 * - The initial read is performed inside a **lazy initializer** so it
 *   only runs once.
 * - The setter accepts either a raw value or an updater function
 *   `(prev: T) => T`, matching the React `useState` API.
 * - JSON parse / stringify errors are caught silently and fall back to
 *   `initialValue`.
 *
 * @template T - The type of the stored value.
 * @param key          - Unique storage key (will be prefixed automatically).
 * @param initialValue - Default value when nothing is stored yet.
 * @returns A `[value, setValue]` tuple identical to `useState`.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const prefixedKey = `${KEY_PREFIX}${key}`;

  // Lazy initializer – reads from localStorage exactly once.
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(prefixedKey);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      // Corrupted JSON or SecurityError (e.g. private browsing) – use default.
      return initialValue;
    }
  });

  /**
   * Wrapped setter that writes to both React state and `localStorage`.
   * Accepts a direct value or an updater function.
   */
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue =
          value instanceof Function ? value(prev) : value;

        try {
          window.localStorage.setItem(
            prefixedKey,
            JSON.stringify(nextValue),
          );
        } catch {
          // Storage full or blocked – state still updates in-memory.
          console.warn(
            `[useLocalStorage] Failed to write key "${prefixedKey}"`,
          );
        }

        return nextValue;
      });
    },
    [prefixedKey],
  );

  return [storedValue, setValue];
}
