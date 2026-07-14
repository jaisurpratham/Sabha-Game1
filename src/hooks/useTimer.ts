import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Format a duration in seconds as `MM:SS`.
 *
 * @param seconds - Non-negative integer seconds.
 * @returns A zero-padded string like `"02:37"`.
 */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * A simple elapsed-time counter that ticks every second while `isRunning`
 * is `true`.
 *
 * The hook uses `setInterval` internally and cleans up automatically when
 * `isRunning` flips to `false` or the component unmounts.
 *
 * @param isRunning - Whether the timer should be actively counting.
 * @returns `{ time, reset, formatTime }`
 */
export function useTimer(isRunning: boolean): {
  /** Elapsed seconds since the timer was last reset. */
  time: number;
  /** Resets the timer back to 0. */
  reset: () => void;
  /** Utility to format any second count as `MM:SS`. */
  formatTime: (seconds: number) => string;
} {
  const [time, setTime] = useState(0);

  // Ref keeps the interval id so we can clear it from `reset` without
  // depending on `isRunning` in the reset callback.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1_000);
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  /** Reset elapsed time to zero. */
  const reset = useCallback(() => {
    setTime(0);
  }, []);

  return { time, reset, formatTime };
}
