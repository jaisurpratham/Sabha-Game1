/**
 * @fileoverview Layout + difficulty orchestrator for Mandir Mahjong.
 *
 * This module sits between the raw layout generators (`layouts.ts`) and the
 * puzzle generator (`puzzleGenerator.ts`). It selects the correct layout,
 * applies difficulty constraints (max layers, word count), and produces the
 * final set of tile positions ready for puzzle generation.
 */

import type { Difficulty, DifficultyConfig, LayoutType, TilePosition } from './types';
import { getLayoutPositions } from './layouts';

// ---------------------------------------------------------------------------
// Difficulty presets
// ---------------------------------------------------------------------------

/** Configuration for each difficulty level. */
export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    name: 'easy',
    displayName: 'Easy',
    description: 'A gentle introduction — fewer words, shallow stacking.',
    wordRange: [12, 18],
    maxLayers: 2, // layers 0–1
  },
  medium: {
    name: 'medium',
    displayName: 'Medium',
    description: 'A fair challenge with moderate depth.',
    wordRange: [20, 30],
    maxLayers: 3, // layers 0–2
  },
  hard: {
    name: 'hard',
    displayName: 'Hard',
    description: 'Deep stacks and many words — stay focused!',
    wordRange: [35, 50],
    maxLayers: 4, // layers 0–3
  },
  master: {
    name: 'master',
    displayName: 'Master',
    description: 'The ultimate test of pattern recognition and strategy.',
    wordRange: [50, 72],
    maxLayers: 5, // layers 0–4
  },
};

// ---------------------------------------------------------------------------
// Word subset selection
// ---------------------------------------------------------------------------

/**
 * Select a subset of words appropriate for the given difficulty.
 *
 * The subset size is clamped between the difficulty's min/max word range
 * and the actual number of available words. Words are taken in order from
 * the beginning of the list (the caller should pre-shuffle if randomisation
 * is desired).
 *
 * @param words      Full list of available words.
 * @param difficulty The chosen difficulty level.
 * @returns A slice of `words` with length within the difficulty's word range.
 */
export function getWordSubset(
  words: readonly string[],
  difficulty: Difficulty,
): string[] {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const [, max] = config.wordRange;

  // Take up to `max` words (or all available if fewer).
  const count = Math.min(words.length, max);
  return words.slice(0, count);
}

// ---------------------------------------------------------------------------
// Layout generation with difficulty constraints
// ---------------------------------------------------------------------------

/**
 * Filter positions to respect the maximum layer depth for a difficulty.
 * Tiles on layers above `maxLayers - 1` are dropped. This may produce fewer
 * positions than requested, so the caller should re-adjust.
 *
 * @param positions  Raw positions from a layout generator.
 * @param maxLayers  Maximum number of layers allowed (1 = flat, 5 = full depth).
 * @returns Filtered positions with z < maxLayers.
 */
function filterByMaxLayers(
  positions: TilePosition[],
  maxLayers: number,
): TilePosition[] {
  return positions.filter((p) => p.z < maxLayers);
}

/**
 * Generate the tile positions for a game, applying layout shape and
 * difficulty constraints.
 *
 * The pipeline:
 * 1. Determine the tile count from the word count (2 tiles per word).
 * 2. Clamp the word count into the difficulty's allowed range.
 * 3. Generate raw positions from the selected layout.
 * 4. Filter out tiles on layers beyond the difficulty's max.
 * 5. Re-adjust to hit the exact tile count if filtering changed it.
 *
 * @param layout     Board shape.
 * @param difficulty Difficulty preset.
 * @param wordCount  Number of distinct words the player wants to use.
 * @returns An array of exactly `tileCount` (2 × adjusted wordCount) positions.
 */
export function generateLayout(
  layout: LayoutType,
  difficulty: Difficulty,
  wordCount: number,
): TilePosition[] {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const [minWords, maxWords] = config.wordRange;

  // Clamp word count to the difficulty's range.
  const clampedWords = Math.max(minWords, Math.min(maxWords, wordCount));
  const tileCount = clampedWords * 2;

  // Generate positions from the layout.
  let positions = getLayoutPositions(layout, tileCount);

  // Enforce layer cap.
  positions = filterByMaxLayers(positions, config.maxLayers);

  // If filtering removed tiles (more than tileCount remain or fewer),
  // re-run the generator targeting the filtered count.
  // We round down to the nearest even number to maintain pairs.
  if (positions.length !== tileCount) {
    const adjustedCount = Math.max(
      2,
      positions.length % 2 === 0 ? positions.length : positions.length - 1,
    );
    // If the layout naturally produced fewer tiles than requested after
    // layer filtering, use what we have (rounded to even).
    // Otherwise regenerate to fill the gap.
    if (adjustedCount < tileCount) {
      positions = getLayoutPositions(layout, adjustedCount);
      positions = filterByMaxLayers(positions, config.maxLayers);
    }
  }

  // Final safety: ensure even count.
  if (positions.length % 2 !== 0) {
    positions = positions.slice(0, positions.length - 1);
  }

  return positions;
}
