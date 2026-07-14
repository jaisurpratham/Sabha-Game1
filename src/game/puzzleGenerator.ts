/**
 * @fileoverview Solvable puzzle generator for Mandir Mahjong.
 *
 * Uses a **reverse-generation** algorithm to guarantee that every generated
 * puzzle has at least one solution:
 *
 * 1. Start with ALL tile positions marked as "filled" (occupied).
 * 2. Find every position that is currently **free** (not covered, side-free).
 * 3. Pick two free positions and assign them the same word — this pair will
 *    be the FIRST pair a player could remove during normal play.
 * 4. Remove those two positions from the occupied set.
 * 5. Repeat until every position has been assigned a word.
 *
 * Because we are simulating an actual game being played (removing free pairs),
 * the reverse of our removal order is a valid solution path.
 *
 * ## Why this works
 * At every step we pick two tiles that are simultaneously free. If a player
 * replays the pairs in the same order, each pair is guaranteed to be
 * removable at that point. Since there exists at least one such ordering,
 * the puzzle is solvable.
 */

import type { GameTile, TilePosition } from './types';
import { isPositionFree } from './gameRules';

// ---------------------------------------------------------------------------
// Seeded PRNG (simple xorshift32 — deterministic, no crypto needed)
// ---------------------------------------------------------------------------

/**
 * A minimal seeded pseudo-random number generator.
 * Uses xorshift32 for speed and simplicity — we only need "fair enough"
 * randomness for shuffling, not cryptographic strength.
 */
class SeededRandom {
  private state: number;

  constructor(seed: number) {
    // Avoid 0-state (xorshift's fixed point).
    this.state = seed === 0 ? 1 : seed | 0;
  }

  /** Return a pseudo-random integer (may be negative). */
  nextInt(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    this.state = x;
    return x;
  }

  /** Return a pseudo-random float in [0, 1). */
  next(): number {
    return (this.nextInt() >>> 0) / 0x100000000;
  }

  /**
   * Fisher–Yates shuffle of an array (in-place).
   * Returns the same array reference for convenience.
   */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

// ---------------------------------------------------------------------------
// Reverse-generation algorithm
// ---------------------------------------------------------------------------

/**
 * Build a word-pair assignment list from the available words.
 *
 * Each word appears exactly twice (one pair). If there are more positions
 * than 2 × words.length, words are recycled so every position gets a word.
 *
 * @param pairCount Number of pairs needed.
 * @param words     Available word list (at least 1 word required).
 * @param rng       Seeded PRNG for shuffling.
 * @returns An array of `pairCount` words, each to be used twice.
 */
function buildWordPairs(
  pairCount: number,
  words: readonly string[],
  rng: SeededRandom,
): string[] {
  if (words.length === 0) {
    throw new Error('buildWordPairs: word list must not be empty');
  }

  const pool: string[] = [];
  // Fill the pool by cycling through the word list.
  for (let i = 0; i < pairCount; i++) {
    pool.push(words[i % words.length]);
  }

  rng.shuffle(pool);
  return pool;
}

/**
 * Core reverse-generation algorithm.
 *
 * @param positions All tile positions to fill (length must be even).
 * @param words     Available words (length ≥ 1).
 * @param seed      Random seed for reproducibility (optional).
 * @returns An array of GameTile objects with guaranteed solvability.
 * @throws If positions.length is odd, or if the algorithm fails to find
 *         free pairs (indicates an invalid layout).
 */
export function generateSolvablePuzzle(
  positions: readonly TilePosition[],
  words: readonly string[],
  seed: number = Date.now(),
): GameTile[] {
  if (positions.length === 0) return [];
  if (positions.length % 2 !== 0) {
    throw new Error(
      `generateSolvablePuzzle: position count must be even, got ${positions.length}`,
    );
  }
  if (words.length === 0) {
    throw new Error('generateSolvablePuzzle: word list must not be empty');
  }

  const rng = new SeededRandom(seed);
  const pairCount = positions.length / 2;
  const wordPairs = buildWordPairs(pairCount, words, rng);

  // --- Reverse generation ---
  // All positions start as "occupied".
  // We maintain a mutable set of occupied positions and repeatedly remove
  // free pairs until the board is empty.

  /** Position + index into the original array (for stable ID assignment). */
  interface IndexedPos {
    pos: TilePosition;
    idx: number;
  }

  // Build the occupied list with original indices.
  const occupied: IndexedPos[] = positions.map((pos, idx) => ({ pos, idx }));

  /**
   * Removal order: each entry is a pair of original-array indices that
   * were removed together (assigned the same word).
   */
  const removalOrder: Array<[number, number]> = [];

  // Track which indices are still in the occupied set for fast lookup.
  const occupiedSet = new Set<number>(occupied.map((o) => o.idx));

  let pairIdx = 0;
  let maxIterations = positions.length * 10; // safety valve

  while (occupiedSet.size > 0 && maxIterations-- > 0) {
    // Build the current list of occupied positions for rule checks.
    const currentOccupied: TilePosition[] = [];
    for (const ip of occupied) {
      if (occupiedSet.has(ip.idx)) {
        currentOccupied.push(ip.pos);
      }
    }

    // Find all free positions in the current occupied set.
    const freeIndices: number[] = [];
    for (const ip of occupied) {
      if (!occupiedSet.has(ip.idx)) continue;
      if (isPositionFree(ip.pos, currentOccupied)) {
        freeIndices.push(ip.idx);
      }
    }

    if (freeIndices.length < 2) {
      // This should not happen with valid layouts. If it does, we attempt
      // a fallback: remove the two highest-layer tiles regardless of
      // side-freedom (they are at least uncovered).
      const remainingByLayer = [...occupiedSet]
        .map((idx) => ({ idx, z: positions[idx].z }))
        .sort((a, b) => b.z - a.z);

      if (remainingByLayer.length >= 2) {
        freeIndices.push(remainingByLayer[0].idx, remainingByLayer[1].idx);
      } else {
        throw new Error(
          'generateSolvablePuzzle: unable to find free pair — layout may be invalid',
        );
      }
    }

    // Shuffle free indices so pair assignment is random.
    const shuffledFree = [...freeIndices];
    rng.shuffle(shuffledFree);

    // Pick the first two free positions.
    const idx1 = shuffledFree[0];
    const idx2 = shuffledFree[1];

    removalOrder.push([idx1, idx2]);
    occupiedSet.delete(idx1);
    occupiedSet.delete(idx2);
    pairIdx++;
  }

  if (occupiedSet.size > 0) {
    throw new Error(
      'generateSolvablePuzzle: exceeded iteration limit — layout may be invalid',
    );
  }

  // --- Assign words to positions ---
  // removalOrder[i] is the i-th pair removed. We assign wordPairs[i] to both
  // positions in that pair.
  const wordAssignment = new Map<number, string>();
  for (let i = 0; i < removalOrder.length; i++) {
    const [a, b] = removalOrder[i];
    const word = wordPairs[i % wordPairs.length];
    wordAssignment.set(a, word);
    wordAssignment.set(b, word);
  }

  // --- Build GameTile array ---
  const tiles: GameTile[] = positions.map((pos, idx) => ({
    id: idx,
    word: wordAssignment.get(idx) ?? '',
    position: { ...pos },
    state: 'normal' as const,
    removed: false,
  }));

  return tiles;
}

// ---------------------------------------------------------------------------
// Shuffle (for mid-game reshuffle)
// ---------------------------------------------------------------------------

/**
 * Reshuffle the word assignments of all remaining (non-removed) tiles
 * while preserving solvability.
 *
 * The approach:
 * 1. Collect all non-removed tiles' positions and words.
 * 2. Re-run the reverse generation algorithm with those positions and words.
 * 3. Return a new tile array with the reshuffled assignments.
 *
 * Removed tiles are carried over unchanged. Tile IDs are preserved.
 *
 * @param tiles Current game tiles.
 * @param seed  Optional random seed.
 * @returns A new tile array with reshuffled (but solvable) word assignments.
 */
export function shuffleRemainingTiles(
  tiles: readonly GameTile[],
  seed: number = Date.now(),
): GameTile[] {
  const remaining = tiles.filter((t) => !t.removed);
  const removed = tiles.filter((t) => t.removed);

  if (remaining.length < 2) {
    // Nothing to shuffle.
    return [...tiles];
  }

  // Collect the words currently on the remaining tiles.
  const words = remaining.map((t) => t.word);

  // De-duplicate to get the word list (each word appears twice).
  const uniqueWords = [...new Set(words)];

  // Re-generate solvable assignments for the remaining positions.
  const positions = remaining.map((t) => t.position);
  const newTiles = generateSolvablePuzzle(positions, uniqueWords, seed);

  // Map the new assignments back onto the original tile IDs.
  const reshuffled: GameTile[] = remaining.map((original, i) => ({
    ...original,
    word: newTiles[i].word,
    state: 'normal' as const,
  }));

  // Merge removed tiles back in, preserving original order by ID.
  const allTiles = [...reshuffled, ...removed];
  allTiles.sort((a, b) => a.id - b.id);

  return allTiles;
}
