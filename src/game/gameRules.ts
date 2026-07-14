/**
 * @fileoverview Pure game-rule functions for Mandir Mahjong.
 *
 * Every function in this module is a pure function — no side effects, no
 * mutation of inputs, no React or DOM dependencies. They implement the
 * core Mahjong Solitaire selection constraints on the half-unit fine grid.
 *
 * ## Coordinate Refresher
 * - A tile at (x, y, z) occupies fine-grid cells:
 *     (x, y), (x+1, y), (x, y+1), (x+1, y+1)
 * - **Covered**: another tile at layer z+1 overlaps if
 *     abs(upper.x − x) < 2 AND abs(upper.y − y) < 2
 * - **Side-free**: no tile at (x±2, y', z) with abs(y' − y) < 2
 *     on the SAME layer. A tile is side-free if its LEFT or RIGHT side is open.
 * - **Free (selectable)**: NOT covered AND side-free.
 */

import type { GameTile, TilePosition } from './types';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Return only the tiles still in play (not yet removed).
 * Almost every public function needs this, so we centralise it here.
 */
function activeTiles(tiles: readonly GameTile[]): GameTile[] {
  return tiles.filter((t) => !t.removed);
}

// ---------------------------------------------------------------------------
// Coverage check
// ---------------------------------------------------------------------------

/**
 * Determine whether `tile` is covered by any active tile on the layer above.
 *
 * A tile at (x, y, z) is covered if there exists a non-removed tile u at
 * layer z+1 such that:
 *   abs(u.x − x) < 2  AND  abs(u.y − y) < 2
 *
 * This reflects the 2×2 footprint of each tile — any overlap blocks removal.
 *
 * @param tile    The tile to test.
 * @param allTiles Every tile on the board (removed tiles are filtered out).
 * @returns `true` if the tile is covered from above.
 */
export function isTileCovered(
  tile: GameTile,
  allTiles: readonly GameTile[],
): boolean {
  const { x, y, z } = tile.position;
  const upperLayer = z + 1;

  return activeTiles(allTiles).some(
    (other) =>
      other.position.z === upperLayer &&
      Math.abs(other.position.x - x) < 2 &&
      Math.abs(other.position.y - y) < 2,
  );
}

// ---------------------------------------------------------------------------
// Side-freedom check
// ---------------------------------------------------------------------------

/**
 * Determine whether `tile` has at least one free side (left OR right).
 *
 * A tile's LEFT side is blocked if there exists an active tile at the same
 * layer z with x' = x − 2 and abs(y' − y) < 2. The RIGHT side mirrors this
 * with x' = x + 2.
 *
 * The tile is side-free when at least one side is NOT blocked.
 *
 * @param tile     The tile to test.
 * @param allTiles Every tile on the board.
 * @returns `true` if at least one horizontal side is open.
 */
export function isTileSideFree(
  _tile: GameTile,
  _allTiles: readonly GameTile[],
): boolean {
  // Flat grid: all tiles are accessible, no left/right blocking rules
  return true;
}

// ---------------------------------------------------------------------------
// Combined "free" check
// ---------------------------------------------------------------------------

/**
 * A tile is **free** (selectable by the player) when it is:
 * 1. Not removed.
 * 2. Not covered by any tile on the layer above.
 * 3. Has at least one open horizontal side.
 *
 * @param tile     The tile to test.
 * @param allTiles Every tile on the board.
 * @returns `true` if the tile can be selected.
 */
export function isTileFree(
  tile: GameTile,
  allTiles: readonly GameTile[],
): boolean {
  if (tile.removed) return false;
  return !isTileCovered(tile, allTiles) && isTileSideFree(tile, allTiles);
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/**
 * Check whether two tiles form a valid match.
 *
 * Requirements:
 * - They are different tiles (by id).
 * - They share the same word.
 * - Both are currently free.
 *
 * @param tile1    First selected tile.
 * @param tile2    Second selected tile.
 * @param allTiles All tiles on the board.
 * @returns `true` if the pair can be matched and removed.
 */
export function canMatch(
  tile1: GameTile,
  tile2: GameTile,
  allTiles: readonly GameTile[],
): boolean {
  if (tile1.id === tile2.id) return false;
  if (tile1.word !== tile2.word) return false;
  return isTileFree(tile1, allTiles) && isTileFree(tile2, allTiles);
}

// ---------------------------------------------------------------------------
// Free-tile enumeration
// ---------------------------------------------------------------------------

/**
 * Return every tile that is currently free (selectable).
 *
 * @param tiles All tiles on the board.
 * @returns A new array containing only the free tiles.
 */
export function getFreeTiles(tiles: readonly GameTile[]): GameTile[] {
  return tiles.filter((t) => isTileFree(t, tiles));
}

// ---------------------------------------------------------------------------
// Matching-pair discovery
// ---------------------------------------------------------------------------

/**
 * Find all currently available matching pairs among free tiles.
 *
 * This groups free tiles by word, then generates every valid 2-combination
 * within each group. Useful for hint generation and dead-game detection.
 *
 * @param tiles All tiles on the board.
 * @returns Array of [tileA, tileB] pairs that can be matched right now.
 */
export function findMatchingPairs(
  tiles: readonly GameTile[],
): Array<[GameTile, GameTile]> {
  const free = getFreeTiles(tiles);

  // Group free tiles by word.
  const groups = new Map<string, GameTile[]>();
  for (const tile of free) {
    const arr = groups.get(tile.word);
    if (arr) {
      arr.push(tile);
    } else {
      groups.set(tile.word, [tile]);
    }
  }

  // Collect all valid pairs (combinations, not permutations).
  const pairs: Array<[GameTile, GameTile]> = [];
  for (const group of groups.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        pairs.push([group[i], group[j]]);
      }
    }
  }

  return pairs;
}

// ---------------------------------------------------------------------------
// Dead-game detection
// ---------------------------------------------------------------------------

/**
 * Determine whether the game has reached a dead state — tiles remain on the
 * board but no valid matching pair is available among the free tiles.
 *
 * NOTE: This intentionally ignores whether the game is "complete" (all tiles
 * removed). Callers should check `isComplete` separately.
 *
 * @param tiles All tiles on the board.
 * @returns `true` if there are remaining active tiles but no available match.
 */
export function isDeadGame(tiles: readonly GameTile[]): boolean {
  const active = activeTiles(tiles);
  if (active.length === 0) return false; // game is complete, not dead
  return findMatchingPairs(tiles).length === 0;
}

// ---------------------------------------------------------------------------
// Position-level helpers (used by layout / puzzle generators)
// ---------------------------------------------------------------------------

/**
 * Position-only coverage check — determines if a position is covered given
 * a set of occupied positions. This is the "raw" version of `isTileCovered`
 * that works on bare positions instead of GameTile objects, used during
 * layout validation and puzzle generation.
 *
 * @param pos       The position to test.
 * @param occupied  Set of currently occupied positions.
 * @returns `true` if the position is covered from above.
 */
export function isPositionCovered(
  pos: TilePosition,
  occupied: readonly TilePosition[],
): boolean {
  const { x, y, z } = pos;
  return occupied.some(
    (o) =>
      o.z === z + 1 &&
      Math.abs(o.x - x) < 2 &&
      Math.abs(o.y - y) < 2,
  );
}

/**
 * Position-only side-freedom check. Works like `isTileSideFree` but on raw
 * TilePosition objects. Used during puzzle generation.
 *
 * @param pos      The position to test.
 * @param occupied All occupied positions (same layer filtering is internal).
 * @returns `true` if at least one horizontal side is open.
 */
export function isPositionSideFree(
  _pos: TilePosition,
  _occupied: readonly TilePosition[],
): boolean {
  // Flat grid: all tiles are accessible, no left/right blocking rules
  return true;
}

/**
 * Position-only combined "free" check. A position is free if it is not
 * covered AND is side-free within the provided set of occupied positions.
 *
 * @param pos      The position to test.
 * @param occupied All occupied positions.
 * @returns `true` if the position would be selectable.
 */
export function isPositionFree(
  pos: TilePosition,
  occupied: readonly TilePosition[],
): boolean {
  return !isPositionCovered(pos, occupied) && isPositionSideFree(pos, occupied);
}
