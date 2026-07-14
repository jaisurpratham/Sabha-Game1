import { useReducer } from 'react';
import type {
  GameState,
  GameAction,
  Difficulty,
  LayoutType,
} from '../game/types';
import { isTileFree, findMatchingPairs } from '../game/gameRules';
import { generateSolvablePuzzle, shuffleRemainingTiles } from '../game/puzzleGenerator';
import { generateLayout, getWordSubset } from '../game/layoutGenerator';
import { calculateMatchScore } from '../game/scoring';

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: GameState = {
  tiles: [],
  selectedTileId: null,
  moves: 0,
  matches: 0,
  score: 0,
  timeElapsed: 0,
  isComplete: false,
  isPaused: false,
  difficulty: 'medium' as Difficulty,
  layout: 'turtle' as LayoutType,
  words: [],
  hintsUsed: 0,
  combo: 0,
  hintPair: null,
  gameStarted: false,
  totalPairs: 0,
  currentMatch: null,
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

/**
 * Pure reducer that drives the entire game state machine.
 *
 * Actions:
 * - `NEW_GAME`      – Generate a fresh solvable puzzle.
 * - `SELECT_TILE`   – Select / deselect / match tiles.
 * - `HINT`          – Reveal one available matching pair (costs 50 pts).
 * - `SHUFFLE`       – Redistribute remaining tiles on the board.
 * - `RESTART`       – Re-generate with the same settings.
 * - `TICK`          – Advance the game clock by one second.
 * - `TOGGLE_PAUSE`  – Pause / resume.
 * - `CLEAR_HINT`    – Remove the hint highlight.
 */
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    // -------------------------------------------------------------------
    // NEW_GAME – build a brand-new puzzle from scratch
    // -------------------------------------------------------------------
    case 'NEW_GAME': {
      const subset = getWordSubset(action.words, action.difficulty);
      const positions = generateLayout(
        action.layout,
        action.difficulty,
        subset.length,
      );
      const tiles = generateSolvablePuzzle(positions, subset);

      return {
        ...initialState,
        tiles,
        words: action.words,
        layout: action.layout,
        difficulty: action.difficulty,
        totalPairs: tiles.length / 2,
        gameStarted: true,
      };
    }

    // -------------------------------------------------------------------
    // SELECT_TILE – first selection, deselection, match, or mismatch
    // -------------------------------------------------------------------
    case 'SELECT_TILE': {
      const tile = state.tiles.find((t) => t.id === action.tileId);

      // Ignore clicks on removed tiles, non-free tiles, or if a match popup is open
      if (!tile || tile.removed || !isTileFree(tile, state.tiles) || state.currentMatch) {
        return state;
      }

      // ── First selection ──────────────────────────────────────────────
      if (state.selectedTileId === null) {
        return {
          ...state,
          selectedTileId: action.tileId,
          hintPair: null,
          tiles: state.tiles.map((t) => ({
            ...t,
            state:
              t.id === action.tileId
                ? 'selected'
                : t.state === 'selected'
                  ? 'normal'
                  : t.state,
          })),
        };
      }

      const firstTile = state.tiles.find(
        (t) => t.id === state.selectedTileId,
      )!;

      // ── Deselect (clicked the same tile again) ───────────────────────
      if (firstTile.id === action.tileId) {
        return {
          ...state,
          selectedTileId: null,
          tiles: state.tiles.map((t) => ({
            ...t,
            state: t.id === action.tileId ? 'normal' : t.state,
          })),
        };
      }

      // ── Match! ───────────────────────────────────────────────────────
      if (firstTile.word === tile.word) {
        const newCombo = state.combo + 1;

        const newTiles = state.tiles.map((t) => {
          if (t.id === firstTile.id || t.id === tile.id) {
            return { ...t, state: 'matched' as const };
          }
          return {
            ...t,
            state: t.state === 'selected' ? ('normal' as const) : t.state,
          };
        });

        return {
          ...state,
          tiles: newTiles,
          selectedTileId: null,
          moves: state.moves + 1,
          combo: newCombo,
          hintPair: null,
          currentMatch: { word: firstTile.word, tileIds: [firstTile.id, tile.id] },
        };
      }

      // ── No match – reset both tiles ──────────────────────────────────
      return {
        ...state,
        selectedTileId: null,
        moves: state.moves + 1,
        combo: 0,
        tiles: state.tiles.map((t) => ({
          ...t,
          state:
            t.id === firstTile.id || t.id === action.tileId
              ? ('normal' as const)
              : t.state,
        })),
      };
    }

    // -------------------------------------------------------------------
    // HINT – reveal one removable pair (costs 50 points)
    // -------------------------------------------------------------------
    case 'HINT': {
      const pairs = findMatchingPairs(state.tiles);
      if (pairs.length > 0) {
        const [t1, t2] = pairs[0];
        return {
          ...state,
          hintPair: [t1.id, t2.id],
          hintsUsed: state.hintsUsed + 1,
          score: Math.max(0, state.score - 50),
        };
      }
      return state;
    }

    // -------------------------------------------------------------------
    // SHUFFLE – redistribute remaining tiles on the layout
    // -------------------------------------------------------------------
    case 'SHUFFLE': {
      const shuffled = shuffleRemainingTiles(state.tiles);
      return {
        ...state,
        tiles: shuffled,
        selectedTileId: null,
        hintPair: null,
        combo: 0,
      };
    }

    // -------------------------------------------------------------------
    // RESTART – same settings, new puzzle
    // -------------------------------------------------------------------
    case 'RESTART': {
      const subset = getWordSubset(state.words, state.difficulty);
      const positions = generateLayout(
        state.layout,
        state.difficulty,
        subset.length,
      );
      const tiles = generateSolvablePuzzle(positions, subset);

      return {
        ...initialState,
        tiles,
        words: state.words,
        layout: state.layout,
        difficulty: state.difficulty,
        totalPairs: tiles.length / 2,
        gameStarted: true,
      };
    }

    // -------------------------------------------------------------------
    // Timer / pause / hint clear
    // -------------------------------------------------------------------
    case 'TICK':
      return { ...state, timeElapsed: state.timeElapsed + 1 };

    case 'TOGGLE_PAUSE':
      return { ...state, isPaused: !state.isPaused };

    case 'CLEAR_MATCH_POPUP': {
      if (!state.currentMatch) return state;
      
      const matchScore = calculateMatchScore(state.combo, state.timeElapsed);
      const newMatches = state.matches + 1;
      const isComplete = newMatches === state.totalPairs;
      
      return {
        ...state,
        currentMatch: null,
        matches: newMatches,
        score: state.score + matchScore,
        isComplete,
        tiles: state.tiles.map(t => 
          state.currentMatch!.tileIds.includes(t.id) 
            ? { ...t, removed: true } 
            : t
        ),
      };
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Thin wrapper around `useReducer` that exposes the game `state` and
 * `dispatch` function.  All mutation logic lives in `gameReducer` above.
 */
export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return { state, dispatch };
}
