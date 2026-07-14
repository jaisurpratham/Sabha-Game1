/**
 * @fileoverview Scoring engine for Mandir Mahjong.
 *
 * All functions are pure — they take numeric inputs and return deterministic
 * results. The scoring model rewards speed, accuracy (combo streaks), and
 * efficiency (no wasted moves), with penalties for hint usage.
 */

// ---------------------------------------------------------------------------
// Per-match scoring
// ---------------------------------------------------------------------------

/**
 * Calculate the score awarded for a single successful match.
 *
 * Scoring formula:
 *   `round(basePoints × comboMultiplier + speedBonus)`
 *
 * - **Base points**: 100.
 * - **Combo multiplier**: starts at 1× and increases by 0.25 for each
 *   consecutive match without a miss. So combo 0 → 1×, combo 1 → 1.25×, etc.
 * - **Speed bonus**: starts at 50 and decays by 1 point every 10 seconds.
 *   Floors at 0 — the player is never penalised for being slow, they just
 *   stop earning the bonus.
 *
 * @param combo        Current combo count (0-based: 0 = first match in streak).
 * @param timeElapsed  Total seconds elapsed since game start.
 * @returns Points to award for this match.
 */
export function calculateMatchScore(
  combo: number,
  timeElapsed: number,
): number {
  const basePoints = 100;
  const comboMultiplier = 1 + combo * 0.25;
  const speedBonus = Math.max(0, 50 - Math.floor(timeElapsed / 10));
  return Math.round(basePoints * comboMultiplier + speedBonus);
}

// ---------------------------------------------------------------------------
// Final score
// ---------------------------------------------------------------------------

/**
 * Compute the final score at game completion (or when the player gives up).
 *
 * Components:
 * - **matchScore**: sum of all per-match scores already accumulated.
 * - **Time bonus**: `totalPairs × 50 − floor(totalTime / 2)`, floored at 0.
 *   Faster completion → bigger bonus.
 * - **Efficiency bonus**: +500 if the player matched every pair on the first
 *   attempt (`totalMoves === totalPairs` — one move per pair, no misses).
 * - **Hint penalty**: −50 per hint used.
 *
 * The result is floored at 0 — the player can never go negative.
 *
 * @param matchScore  Sum of all per-match scores.
 * @param totalTime   Seconds from start to finish (paused time excluded).
 * @param totalMoves  Number of pair-selection attempts.
 * @param hintsUsed   Number of hints consumed.
 * @param totalPairs  Total pairs in the puzzle.
 * @returns The final composite score.
 */
export function calculateFinalScore(
  matchScore: number,
  totalTime: number,
  totalMoves: number,
  hintsUsed: number,
  totalPairs: number,
): number {
  const hintPenalty = hintsUsed * 50;
  const timeBonus = Math.max(0, totalPairs * 50 - Math.floor(totalTime / 2));
  const efficiencyBonus = totalPairs === totalMoves ? 500 : 0;
  return Math.max(0, matchScore + timeBonus + efficiencyBonus - hintPenalty);
}

// ---------------------------------------------------------------------------
// Star rating
// ---------------------------------------------------------------------------

/** Result of a star-rating evaluation. */
export interface ScoreRating {
  /** 1–5 stars. */
  stars: number;
  /** Themed flavour message. */
  message: string;
}

/**
 * Convert a raw score into a 1–5 star rating with a themed message.
 *
 * The rating is based on the ratio of the player's score to a theoretical
 * maximum (`totalPairs × 200`). The thresholds are generous because the
 * theoretical max is hard to achieve.
 *
 * | Ratio     | Stars | Message               |
 * |-----------|-------|-----------------------|
 * | > 80 %    | 5     | Divine Mastery! 🙏     |
 * | > 60 %    | 4     | Enlightened Path! ✨   |
 * | > 40 %    | 3     | Spiritual Growth! 🌸   |
 * | > 20 %    | 2     | Seeking Wisdom 🪷      |
 * | ≤ 20 %    | 1     | Beginning the Journey 🕉️ |
 *
 * @param score      The player's final score.
 * @param totalPairs Total pairs in the puzzle.
 * @returns Star count and themed message.
 */
export function getScoreRating(
  score: number,
  totalPairs: number,
): ScoreRating {
  // Guard against division by zero (shouldn't happen in practice).
  const maxPossible = totalPairs * 200 || 1;
  const ratio = score / maxPossible;

  if (ratio > 0.8) return { stars: 5, message: 'Divine Mastery! 🙏' };
  if (ratio > 0.6) return { stars: 4, message: 'Enlightened Path! ✨' };
  if (ratio > 0.4) return { stars: 3, message: 'Spiritual Growth! 🌸' };
  if (ratio > 0.2) return { stars: 2, message: 'Seeking Wisdom 🪷' };
  return { stars: 1, message: 'Beginning the Journey 🕉️' };
}
