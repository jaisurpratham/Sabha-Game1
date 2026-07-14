/**
 * @fileoverview Core type definitions for Mandir Mahjong — a Mahjong Solitaire
 * word-tile game. All types are pure data structures with no runtime dependencies.
 *
 * Coordinate System (half-unit fine grid):
 *   - 1 fine-grid unit = half a tile width/height
 *   - Each tile occupies a 2×2 block: (x,y), (x+1,y), (x,y+1), (x+1,y+1)
 *   - Layer z=0 is the base; higher z = stacked on top
 */

// ---------------------------------------------------------------------------
// Tile position & state
// ---------------------------------------------------------------------------

/**
 * A position on the fine grid. Tiles are placed at even x/y on the base layer,
 * but upper-layer tiles may use odd offsets for the classic Mahjong half-step
 * stacking effect.
 */
export interface TilePosition {
  /** Fine-grid column (half-tile units). */
  x: number;
  /** Fine-grid row (half-tile units). */
  y: number;
  /** Layer index — 0 is the bottommost layer. */
  z: number;
}

/**
 * Visual / interaction state of a single tile.
 *
 * - `normal`   — idle, waiting for interaction
 * - `hover`    — mouse / touch hover
 * - `selected` — first tile of a potential pair has been picked
 * - `matched`  — briefly shown after a successful match before removal
 * - `disabled` — tile is blocked (covered or locked on both sides)
 */
export type TileState = 'normal' | 'hover' | 'selected' | 'matched' | 'disabled';

/**
 * Runtime representation of a single tile on the board.
 */
export interface GameTile {
  /** Unique numeric identifier (stable across shuffles within a game). */
  id: number;
  /** The word printed on this tile — two tiles share the same word to form a pair. */
  word: string;
  /** Position in the fine grid + layer. */
  position: TilePosition;
  /** Current visual / interaction state. */
  state: TileState;
  /** Whether this tile has been matched and removed from play. */
  removed: boolean;
}

// ---------------------------------------------------------------------------
// Layout & difficulty enums
// ---------------------------------------------------------------------------

/**
 * Available board layout shapes.
 *
 * - `turtle`  — classic Mahjong shell/tortoise shape
 * - `pyramid` — triangular/diamond stacking
 * - `temple`  — mandir gopuram silhouette
 * - `lotus`   — circular petal radiating pattern
 * - `random`  — algorithmically generated valid layout
 */
export type LayoutType = 'turtle' | 'pyramid' | 'temple' | 'lotus' | 'random';

/**
 * Difficulty levels that control word count, layer depth, and scoring.
 */
export type Difficulty = 'easy' | 'medium' | 'hard' | 'master';

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

/**
 * Complete, serialisable snapshot of a running game.
 * Designed to be the single source of truth consumed by the React UI via a
 * reducer / context.
 */
export interface GameState {
  /** All tiles on the board (including removed ones for undo/history). */
  tiles: GameTile[];
  /** ID of the currently selected (first-pick) tile, or null. */
  selectedTileId: number | null;
  /** Total selection attempts (each click on a free tile counts). */
  moves: number;
  /** Number of successful pair matches so far. */
  matches: number;
  /** Accumulated score from matched pairs. */
  score: number;
  /** Seconds elapsed since the game started (paused time excluded). */
  timeElapsed: number;
  /** True when every pair has been matched. */
  isComplete: boolean;
  /** True when the timer is paused. */
  isPaused: boolean;
  /** Current difficulty setting. */
  difficulty: Difficulty;
  /** Current layout shape. */
  layout: LayoutType;
  /** Master word list used to generate the puzzle. */
  words: string[];
  /** How many times the player used the hint feature. */
  hintsUsed: number;
  /** Current combo streak — resets on a failed match or timeout. */
  combo: number;
  /** Tile-ID pair currently highlighted as a hint, or null. */
  hintPair: [number, number] | null;
  /** Whether the game clock has started (false until first tile click). */
  gameStarted: boolean;
  /** Total number of pairs to match (tiles.length / 2 at start). */
  totalPairs: number;
}

// ---------------------------------------------------------------------------
// Layout & difficulty config
// ---------------------------------------------------------------------------

/**
 * Descriptor for a layout shape, including its generator function.
 */
export interface LayoutDefinition {
  /** Internal key. */
  name: LayoutType;
  /** Human-readable label for the UI. */
  displayName: string;
  /** Short description shown in layout picker. */
  description: string;
  /**
   * Generate an array of tile positions for the given tile count.
   * The count is always even and the result length MUST equal `tileCount`.
   */
  getPositions: (tileCount: number) => TilePosition[];
}

/**
 * Configuration knobs for a difficulty level.
 */
export interface DifficultyConfig {
  /** Internal key. */
  name: Difficulty;
  /** Human-readable label. */
  displayName: string;
  /** Short flavour-text description. */
  description: string;
  /** [min, max] number of distinct words (each word → 1 pair → 2 tiles). */
  wordRange: [number, number];
  /** Maximum stacking layer index (0 = flat board). */
  maxLayers: number;
}

// ---------------------------------------------------------------------------
// Actions (for reducer / state machine)
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all actions the game reducer can handle.
 * Using a union instead of an enum keeps the type system structural.
 */
export type GameAction =
  | { type: 'SELECT_TILE'; tileId: number }
  | { type: 'HINT' }
  | { type: 'SHUFFLE' }
  | { type: 'RESTART' }
  | { type: 'NEW_GAME'; words: string[]; layout: LayoutType; difficulty: Difficulty }
  | { type: 'TICK' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'CLEAR_HINT' }
  | { type: 'SET_TILE_STATE'; tileId: number; state: TileState }
  | { type: 'COMPLETE_MATCH'; tile1Id: number; tile2Id: number };
