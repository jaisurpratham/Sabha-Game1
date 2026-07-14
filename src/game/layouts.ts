/**
 * @fileoverview Layout generators for Mandir Mahjong.
 * Now simplified to only generate a single flat rectangular grid.
 */

import type { TilePosition, LayoutDefinition, LayoutType } from './types';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Centre a set of positions so the bounding-box midpoint is at (0, 0).
 */
function centrePositions(positions: TilePosition[]): TilePosition[] {
  if (positions.length === 0) return positions;
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const p of positions) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const cx = Math.round((minX + maxX) / 2);
  const cy = Math.round((minY + maxY) / 2);
  return positions.map((p) => ({ x: p.x - cx, y: p.y - cy, z: p.z }));
}

// =========================================================================
//  LAYOUT — Rectangular Grid
// =========================================================================

/**
 * Generates a simple 1-layer rectangular grid.
 */
function generateGrid(tileCount: number): TilePosition[] {
  if (tileCount < 2) {
    return [];
  }

  const positions: TilePosition[] = [];
  
  // Calculate columns and rows to form a rectangle.
  // We prefer landscape (wider than tall).
  let cols = Math.ceil(Math.sqrt(tileCount * 1.5));
  let rows = Math.ceil(tileCount / cols);

  let added = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (added < tileCount) {
        positions.push({ x: c * 2, y: r * 2, z: 0 });
        added++;
      }
    }
  }

  return centrePositions(positions);
}

// =========================================================================
//  Layout registry
// =========================================================================

const LAYOUT_GENERATORS: Record<LayoutType, (tileCount: number) => TilePosition[]> = {
  grid: generateGrid,
};

export function getLayoutPositions(
  layout: LayoutType,
  tileCount: number,
): TilePosition[] {
  if (tileCount < 2 || tileCount % 2 !== 0) {
    throw new Error(
      `getLayoutPositions: tileCount must be even and ≥ 2, got ${tileCount}`,
    );
  }

  const generator = LAYOUT_GENERATORS[layout];
  return generator(tileCount);
}

export const LAYOUT_DEFINITIONS: LayoutDefinition[] = [
  {
    name: 'grid',
    displayName: 'Grid',
    description: 'A simple rectangular matching grid.',
    getPositions: generateGrid,
  },
];
