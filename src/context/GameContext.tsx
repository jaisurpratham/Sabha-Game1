import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useAudio } from '../hooks/useAudio';
import type { AudioControls } from '../hooks/useAudio';
import { useTimer } from '../hooks/useTimer';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { GameState, GameAction } from '../game/types';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface GameContextType {
  /** The current game state (tiles, score, etc.). */
  state: GameState;
  /** Dispatch a game action (SELECT_TILE, NEW_GAME, …). */
  dispatch: React.Dispatch<GameAction>;
  /** Web Audio synthesised sound effects. */
  audio: AudioControls;
  /** Elapsed-time counter and formatter. */
  timer: ReturnType<typeof useTimer>;
  /** Whether high-contrast mode is enabled. */
  highContrast: boolean;
  /** Toggle high-contrast mode (persisted). */
  toggleHighContrast: () => void;
  /** Whether large-text mode is enabled. */
  largeText: boolean;
  /** Toggle large-text mode (persisted). */
  toggleLargeText: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Top-level provider that composes:
 * - `useGameState`    – reducer-based game logic
 * - `useAudio`        – synthesised temple sounds
 * - `useTimer`        – elapsed game clock
 * - `useLocalStorage` – persisted accessibility prefs
 *
 * It also runs a `setInterval` that dispatches `TICK` once per second
 * while the game is active, keeping the reducer's `timeElapsed` in sync.
 *
 * Wrap your `<App />` (or relevant subtree) in `<GameProvider>`.
 */
export function GameProvider({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useGameState();
  const audio = useAudio();
  const timer = useTimer(
    state.gameStarted && !state.isPaused && !state.isComplete,
  );

  // Accessibility preferences (persisted to localStorage).
  const [highContrast, setHighContrast] = useLocalStorage('highContrast', false);
  const [largeText, setLargeText] = useLocalStorage('largeText', false);

  // ── Keep the reducer's `timeElapsed` ticking ───────────────────────────
  useEffect(() => {
    if (state.gameStarted && !state.isPaused && !state.isComplete) {
      const interval = setInterval(() => dispatch({ type: 'TICK' }), 1_000);
      return () => clearInterval(interval);
    }
  }, [state.gameStarted, state.isPaused, state.isComplete, dispatch]);

  // ── Memoised toggles ──────────────────────────────────────────────────
  const toggleHighContrast = useCallback(
    () => setHighContrast((prev) => !prev),
    [setHighContrast],
  );

  const toggleLargeText = useCallback(
    () => setLargeText((prev) => !prev),
    [setLargeText],
  );

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        audio,
        timer,
        highContrast,
        toggleHighContrast,
        largeText,
        toggleLargeText,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

/**
 * Convenience hook for consuming `GameContext`.
 *
 * Throws if called outside of a `<GameProvider>`.
 *
 * @example
 * ```tsx
 * const { state, dispatch, audio } = useGame();
 * ```
 */
export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used within a <GameProvider>');
  }
  return ctx;
}
