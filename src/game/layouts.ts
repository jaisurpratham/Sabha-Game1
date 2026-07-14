/**
 * @fileoverview Layout generators for Mandir Mahjong.
 *
 * Each generator takes a **tile count** (always even) and returns an array of
 * `TilePosition` objects whose length is exactly that count. Positions use
 * the half-unit fine grid where each tile occupies a 2×2 block.
 *
 * ## Stacking rules enforced by every generator:
 * 1. Two tiles on the same layer never overlap (x-coords differ by ≥ 2 AND/OR
 *    y-coords differ by ≥ 2).
 * 2. A tile at z > 0 must have structural support — at least one tile at z−1
 *    with overlapping footprint.
 * 3. Positions are centred roughly around the origin (0, 0).
 *
 * ## How generators work:
 * Each layout defines a "full" design (ideal shape) and then the generator
 * trims or pads to hit the exact requested tile count by removing / adding
 * from the outer edges of the lowest layer.
 */

import type { TilePosition, LayoutDefinition, LayoutType } from './types';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Build a flat grid of positions on layer 0.
 * `cols` and `rows` are in *tile* units — each tile gets even fine-grid coords.
 * The grid is centred so that the middle tile sits near (0, 0).
 */
function makeGrid(cols: number, rows: number, z: number = 0): TilePosition[] {
  const positions: TilePosition[] = [];
  const xOffset = -(cols - 1); // centering: cols tiles → fine-grid span = 2*(cols-1)
  const yOffset = -(rows - 1);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      positions.push({ x: xOffset + c * 2, y: yOffset + r * 2, z });
    }
  }
  return positions;
}

/**
 * Centre a set of positions so the bounding-box midpoint is at (0, 0).
 * Layer (z) is untouched.
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

/**
 * Compute the distance from the centre (0, 0) for sorting — tiles further
 * from the centre are removed first when trimming.
 */
function distFromCentre(p: TilePosition): number {
  return p.x * p.x + p.y * p.y; // no need for sqrt, relative ordering suffices
}

/**
 * Check whether a position would have structural support given a set of
 * already-placed positions. Layer-0 tiles always have support (the table).
 */
function hasSupport(pos: TilePosition, placed: readonly TilePosition[]): boolean {
  if (pos.z === 0) return true;
  return placed.some(
    (p) =>
      p.z === pos.z - 1 &&
      Math.abs(p.x - pos.x) < 2 &&
      Math.abs(p.y - pos.y) < 2,
  );
}

/**
 * Check for overlap — two tiles at the same layer overlap if both their
 * x and y coordinates differ by less than 2.
 */
function overlaps(a: TilePosition, b: TilePosition): boolean {
  return a.z === b.z && Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2;
}

/**
 * Validate and de-duplicate a set of positions, removing any that overlap
 * with earlier entries or lack structural support.
 */
function validatePositions(raw: TilePosition[]): TilePosition[] {
  // Sort by z ascending so we process supports bottom-up.
  const sorted = [...raw].sort((a, b) => a.z - b.z);
  const valid: TilePosition[] = [];

  for (const pos of sorted) {
    // Check no overlap with already-accepted positions.
    const overlapExists = valid.some((v) => overlaps(v, pos));
    if (overlapExists) continue;

    // Check structural support.
    if (!hasSupport(pos, valid)) continue;

    valid.push(pos);
  }

  return valid;
}

/**
 * Trim or pad a set of positions to hit exactly `target` count.
 * - Trimming removes outermost base-layer tiles first.
 * - Padding adds new base-layer tiles adjacent to existing ones.
 * The result is always validated for support integrity.
 */
function adjustToCount(positions: TilePosition[], target: number): TilePosition[] {
  let result = [...positions];

  // ---- Trim ----
  if (result.length > target) {
    // Remove from the base layer, outermost first.
    // We must not remove base tiles that support upper tiles.
    const upperPositions = result.filter((p) => p.z > 0);

    while (result.length > target) {
      // Find base-layer tiles that are NOT supporting anything above.
      const removable = result
        .filter((p) => {
          if (p.z !== 0) return false;
          // Check if any upper tile relies solely on this tile for support.
          // Conservative: don't remove if ANY upper tile overlaps.
          return !upperPositions.some(
            (u) => Math.abs(u.x - p.x) < 2 && Math.abs(u.y - p.y) < 2,
          );
        })
        .sort((a, b) => distFromCentre(b) - distFromCentre(a)); // outermost first

      if (removable.length === 0) {
        // Fallback: remove outermost tile regardless of layer.
        result.sort((a, b) => distFromCentre(b) - distFromCentre(a));
        result.pop();
      } else {
        // Remove the outermost removable tile.
        const toRemove = removable[0];
        result = result.filter((p) => p !== toRemove);
      }
    }
  }

  // ---- Pad ----
  if (result.length < target) {
    // Find candidate positions adjacent to existing base-layer tiles.
    const existing = new Set(result.map((p) => `${p.x},${p.y},${p.z}`));
    const baseTiles = result.filter((p) => p.z === 0);

    const candidates: TilePosition[] = [];
    for (const bt of baseTiles) {
      for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) {
        const np: TilePosition = { x: bt.x + dx, y: bt.y + dy, z: 0 };
        const key = `${np.x},${np.y},${np.z}`;
        if (!existing.has(key)) {
          candidates.push(np);
          existing.add(key); // avoid duplicate candidates
        }
      }
    }
    // Sort candidates by distance from centre (closest first — expand evenly).
    candidates.sort((a, b) => distFromCentre(a) - distFromCentre(b));

    for (const c of candidates) {
      if (result.length >= target) break;
      result.push(c);
    }
  }

  // Ensure even count — if still off by 1, add or remove one more base tile.
  if (result.length > target) {
    // Remove outermost base tile.
    const removable = result
      .filter((p) => p.z === 0)
      .sort((a, b) => distFromCentre(b) - distFromCentre(a));
    if (removable.length > 0) {
      result = result.filter((p) => p !== removable[0]);
    }
  }

  return centrePositions(result);
}

// =========================================================================
//  LAYOUT 1 — Classic Turtle
// =========================================================================

/**
 * Classic Mahjong "turtle shell" layout.
 *
 * Full 144-tile design:
 * - Layer 0: Cross-shaped base (~86 tiles)
 * - Layer 1: 6×6 block (36 tiles) centred
 * - Layer 2: 4×4 block (16 tiles)
 * - Layer 3: 2×2 block (4 tiles)
 * - Layer 4: 1 tile cap + 1 wing tile (2 tiles to stay even)
 *
 * For fewer tiles, proportionally scale down.
 */
function generateTurtle(tileCount: number): TilePosition[] {
  if (tileCount < 4) {
    // Minimum: just a flat pair
    return centrePositions(makeGrid(Math.max(tileCount, 2), 1));
  }

  // Determine scale factor relative to 144.
  const scale = Math.sqrt(tileCount / 144);

  // Layer 0: cross-shaped base
  const baseCols = Math.max(4, Math.round(12 * scale));
  const baseRows = Math.max(4, Math.round(8 * scale));

  const layer0: TilePosition[] = [];
  const hcx = baseCols / 2;
  const hcy = baseRows / 2;

  for (let r = 0; r < baseRows; r++) {
    for (let c = 0; c < baseCols; c++) {
      // Cross shape: always include the central rectangle, plus horizontal arms.
      const inVertBand = Math.abs(c - hcx + 0.5) < (baseCols * 0.4);
      const inHorizBand = Math.abs(r - hcy + 0.5) < (baseRows * 0.35);
      const inCentre = Math.abs(c - hcx + 0.5) < (baseCols * 0.25) &&
                        Math.abs(r - hcy + 0.5) < (baseRows * 0.25);

      if (inCentre || inVertBand || inHorizBand) {
        layer0.push({ x: c * 2, y: r * 2, z: 0 });
      }
    }
  }

  // Layer 1
  const l1Size = Math.max(2, Math.round(6 * scale));
  const l1 = makeGrid(l1Size, l1Size, 1);
  // Offset upper layers by 1 for the half-step stacking look.
  const l1Centred = centrePositions(l1).map((p) => ({
    x: p.x + 1, y: p.y + 1, z: p.z,
  }));

  // Layer 2
  const l2Size = Math.max(2, Math.round(4 * scale));
  const l2 = makeGrid(l2Size, l2Size, 2);
  const l2Centred = centrePositions(l2);

  // Layer 3
  const l3Size = Math.max(1, Math.round(2 * scale));
  const l3 = l3Size >= 2
    ? makeGrid(l3Size, l3Size, 3).map((p) => ({ ...p, x: p.x + 1, y: p.y + 1 }))
    : [];
  const l3Centred = centrePositions(l3);

  // Layer 4 cap
  const l4: TilePosition[] = tileCount >= 100 ? [{ x: 0, y: 0, z: 4 }] : [];

  const allRaw = [
    ...centrePositions(layer0),
    ...l1Centred,
    ...l2Centred,
    ...l3Centred,
    ...l4,
  ];

  const validated = validatePositions(allRaw);
  return adjustToCount(validated, tileCount);
}

// =========================================================================
//  LAYOUT 2 — Pyramid
// =========================================================================

/**
 * Pyramid layout — each layer is a smaller rectangle centred on the one below.
 *
 * Layer 0 is the widest; each subsequent layer shrinks by ~2 tiles per
 * dimension and is offset by 1 fine-grid unit (half-step stacking).
 */
function generatePyramid(tileCount: number): TilePosition[] {
  if (tileCount < 4) {
    return centrePositions(makeGrid(Math.max(tileCount, 2), 1));
  }

  const positions: TilePosition[] = [];
  // Estimate base dimensions.
  // With N layers each shrinking by 1 tile per dim, total ≈ Σ (w-2i)(h-2i).
  // We iterate and find a base size that overshoots a bit, then trim.
  const baseCols = Math.max(4, Math.round(Math.sqrt(tileCount) * 1.5));
  const baseRows = Math.max(3, Math.round(Math.sqrt(tileCount) * 1.1));

  let cols = baseCols;
  let rows = baseRows;
  let z = 0;

  while (cols >= 2 && rows >= 2 && positions.length < tileCount * 1.5) {
    const layerGrid = makeGrid(cols, rows, z);
    // For upper layers, apply half-step offset.
    const offset = z % 2 === 1 ? 1 : 0;
    for (const p of layerGrid) {
      positions.push({ x: p.x + offset, y: p.y + offset, z });
    }
    cols -= 2;
    rows -= 2;
    z++;
  }

  const validated = validatePositions(centrePositions(positions));
  return adjustToCount(validated, tileCount);
}

// =========================================================================
//  LAYOUT 3 — Temple (Gopuram)
// =========================================================================

/**
 * Temple / gopuram silhouette — wide base with a tall, narrow central spire.
 *
 * The base is a wide rectangle. The centre has progressively narrower stacks
 * creating the tower effect.  Stepped flanking shoulders add the gopuram look.
 */
function generateTemple(tileCount: number): TilePosition[] {
  if (tileCount < 4) {
    return centrePositions(makeGrid(Math.max(tileCount, 2), 1));
  }

  const scale = Math.sqrt(tileCount / 100);
  const positions: TilePosition[] = [];

  // Base layer — wide rectangle
  const baseCols = Math.max(6, Math.round(10 * scale));
  const baseRows = Math.max(3, Math.round(5 * scale));

  for (let r = 0; r < baseRows; r++) {
    for (let c = 0; c < baseCols; c++) {
      positions.push({ x: c * 2, y: r * 2, z: 0 });
    }
  }

  // Tower layers — progressively narrower columns rising from the centre.
  const towerWidth = Math.max(2, Math.round(4 * scale));
  const maxTowerZ = Math.max(2, Math.round(4 * scale));

  for (let z = 1; z <= maxTowerZ; z++) {
    const cols = Math.max(1, towerWidth - (z - 1));
    const rows = Math.max(1, baseRows - z);
    const offset = z % 2 === 1 ? 1 : 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        positions.push({ x: c * 2 + offset, y: r * 2 + offset, z });
      }
    }
  }

  // Shoulder steps — small stacks flanking the tower.
  const shoulderZ = Math.min(2, maxTowerZ);
  const shoulderRows = Math.max(1, Math.round(2 * scale));

  for (let z = 1; z <= shoulderZ; z++) {
    const offset = z % 2 === 1 ? 1 : 0;
    // Left shoulder
    for (let r = 0; r < shoulderRows; r++) {
      positions.push({ x: -2 + offset, y: r * 2 + offset, z });
    }
    // Right shoulder
    for (let r = 0; r < shoulderRows; r++) {
      positions.push({ x: (baseCols) * 2 + offset, y: r * 2 + offset, z });
    }
  }

  const validated = validatePositions(centrePositions(positions));
  return adjustToCount(validated, tileCount);
}

// =========================================================================
//  LAYOUT 4 — Lotus
// =========================================================================

/**
 * Lotus layout — radiating petals from a central elevated stack.
 *
 * The design is a plus/star shape on the base with a layered central core.
 * Petals extend outward in the four cardinal directions.
 */
function generateLotus(tileCount: number): TilePosition[] {
  if (tileCount < 4) {
    return centrePositions(makeGrid(Math.max(tileCount, 2), 1));
  }

  const scale = Math.sqrt(tileCount / 80);
  const positions: TilePosition[] = [];

  // Central core on base — 4×4 block
  const coreSize = Math.max(2, Math.round(4 * scale));
  positions.push(...makeGrid(coreSize, coreSize, 0));

  // Petals — extend in 4 cardinal directions from the core.
  const petalLength = Math.max(2, Math.round(4 * scale));
  const petalWidth = Math.max(1, Math.round(2 * scale));

  const coreHalf = coreSize; // fine-grid half-span = coreSize (in tile units * 2 / 2)

  // Right petal
  for (let i = 0; i < petalLength; i++) {
    for (let w = 0; w < petalWidth; w++) {
      positions.push({
        x: coreHalf * 2 + i * 2,
        y: w * 2,
        z: 0,
      });
    }
  }

  // Left petal
  for (let i = 0; i < petalLength; i++) {
    for (let w = 0; w < petalWidth; w++) {
      positions.push({
        x: -(i + 1) * 2 - (coreHalf - 1) * 2,
        y: w * 2,
        z: 0,
      });
    }
  }

  // Top petal (negative y direction)
  for (let i = 0; i < petalLength; i++) {
    for (let w = 0; w < petalWidth; w++) {
      positions.push({
        x: w * 2,
        y: -(i + 1) * 2 - (coreHalf - 1) * 2,
        z: 0,
      });
    }
  }

  // Bottom petal
  for (let i = 0; i < petalLength; i++) {
    for (let w = 0; w < petalWidth; w++) {
      positions.push({
        x: w * 2,
        y: coreHalf * 2 + i * 2,
        z: 0,
      });
    }
  }

  // Diagonal petals (for star effect when there are enough tiles)
  if (tileCount >= 60) {
    const diagLen = Math.max(1, Math.round(2 * scale));
    for (let i = 1; i <= diagLen; i++) {
      positions.push({ x: coreHalf * 2 + (i - 1) * 2, y: -(i) * 2, z: 0 });
      positions.push({ x: -(coreHalf) * 2 - (i - 1) * 2 + 2, y: -(i) * 2, z: 0 });
      positions.push({ x: coreHalf * 2 + (i - 1) * 2, y: coreHalf * 2 + (i - 1) * 2, z: 0 });
      positions.push({ x: -(coreHalf) * 2 - (i - 1) * 2 + 2, y: coreHalf * 2 + (i - 1) * 2, z: 0 });
    }
  }

  // Central stack — upper layers over the core
  const stackLayers = Math.max(1, Math.round(3 * scale));
  for (let z = 1; z <= stackLayers; z++) {
    const layerSize = Math.max(1, coreSize - z);
    if (layerSize < 1) break;
    const offset = z % 2 === 1 ? 1 : 0;
    const grid = makeGrid(layerSize, layerSize, z);
    for (const p of grid) {
      positions.push({ x: p.x + offset, y: p.y + offset, z });
    }
  }

  const validated = validatePositions(centrePositions(positions));
  return adjustToCount(validated, tileCount);
}

// =========================================================================
//  LAYOUT 5 — Random Balanced
// =========================================================================

/**
 * Algorithmically generated layout.
 *
 * Builds a rough rectangular base, then stacks successively smaller layers.
 * Each upper layer's footprint is inset and offset by 1 for the half-step
 * look. Uses a seeded random-ish approach (deterministic per tileCount).
 */
function generateRandom(tileCount: number): TilePosition[] {
  if (tileCount < 4) {
    return centrePositions(makeGrid(Math.max(tileCount, 2), 1));
  }

  const positions: TilePosition[] = [];

  // Decide layer distribution: ~60% base, ~25% layer 1, ~10% layer 2, ~5% layer 3+
  const layerFractions = [0.60, 0.25, 0.10, 0.04, 0.01];
  const layerCounts: number[] = [];
  let remaining = tileCount;

  for (let i = 0; i < layerFractions.length && remaining > 0; i++) {
    let count = Math.round(tileCount * layerFractions[i]);
    // Ensure even count per layer for easier pair generation.
    if (count % 2 !== 0) count++;
    count = Math.min(count, remaining);
    if (count < 2 && i > 0) break; // don't create near-empty upper layers
    layerCounts.push(count);
    remaining -= count;
  }
  // Push remainder into layer 0.
  layerCounts[0] += remaining;

  // Generate each layer as a roughly square grid.
  for (let z = 0; z < layerCounts.length; z++) {
    const count = layerCounts[z];
    if (count <= 0) continue;

    const cols = Math.max(2, Math.round(Math.sqrt(count * 1.5)));
    const rows = Math.max(2, Math.ceil(count / cols));
    const grid = makeGrid(cols, rows, z);

    // For upper layers, apply half-step offset.
    const offset = z % 2 === 1 ? 1 : 0;

    // Take only the number of tiles we need for this layer.
    // Centre the grid and then trim from the outside.
    const centred = centrePositions(grid).map((p) => ({
      x: p.x + offset,
      y: p.y + offset,
      z: p.z,
    }));

    // Sort by distance from centre (closest first) and take the required count.
    centred.sort((a, b) => distFromCentre(a) - distFromCentre(b));
    positions.push(...centred.slice(0, count));
  }

  const validated = validatePositions(centrePositions(positions));
  return adjustToCount(validated, tileCount);
}

// =========================================================================
//  Layout registry
// =========================================================================

/** Map of all available layout generators. */
const LAYOUT_GENERATORS: Record<LayoutType, (tileCount: number) => TilePosition[]> = {
  turtle: generateTurtle,
  pyramid: generatePyramid,
  temple: generateTemple,
  lotus: generateLotus,
  random: generateRandom,
};

/**
 * Retrieve positions for a given layout type and tile count.
 *
 * @param layout    Which layout shape to use.
 * @param tileCount Desired number of tiles (must be even and ≥ 2).
 * @returns Exactly `tileCount` valid tile positions.
 * @throws If `tileCount` is odd or < 2.
 */
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

/** All layout definitions with metadata for the UI. */
export const LAYOUT_DEFINITIONS: LayoutDefinition[] = [
  {
    name: 'turtle',
    displayName: 'Classic Turtle',
    description: 'The traditional Mahjong shell shape with stacked layers.',
    getPositions: generateTurtle,
  },
  {
    name: 'pyramid',
    displayName: 'Pyramid',
    description: 'A triangular shape rising to a peak — each layer smaller than the last.',
    getPositions: generatePyramid,
  },
  {
    name: 'temple',
    displayName: 'Temple',
    description: 'Shaped like a mandir gopuram with a tall central spire.',
    getPositions: generateTemple,
  },
  {
    name: 'lotus',
    displayName: 'Lotus',
    description: 'Radiating petals from a central elevated core.',
    getPositions: generateLotus,
  },
  {
    name: 'random',
    displayName: 'Random',
    description: 'An algorithmically generated layout — different every time!',
    getPositions: generateRandom,
  },
];
