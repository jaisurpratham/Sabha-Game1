import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';
import Tile from './Tile';
import { isTileFree } from '../game/gameRules';

/** Pixel dimensions for tile rendering */
const TILE_W = 160;
const TILE_H = 90;
const TILE_GAP = 8;
const LAYER_OFFSET_X = -3;
const LAYER_OFFSET_Y = -3;

/** Mobile tile dimensions */
const MOBILE_TILE_W = 120;
const MOBILE_TILE_H = 70;

export default function GameBoard() {
  const { state, dispatch, audio } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [shakeTiles, setShakeTiles] = useState<Set<number>>(new Set());
  const [matchedTiles, setMatchedTiles] = useState<Set<number>>(new Set());
  const lastSelectedRef = useRef<number | null>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate tile pixel dimensions based on screen size
  const tileW = isMobile ? MOBILE_TILE_W : TILE_W;
  const tileH = isMobile ? MOBILE_TILE_H : TILE_H;

  // Calculate board bounds and auto-scale
  const { boardWidth, boardHeight, tilePositions } = useMemo(() => {
    if (state.tiles.length === 0) return { boardWidth: 0, boardHeight: 0, tilePositions: new Map<number, { px: number; py: number; pz: number }>() };

    const positions = new Map<number, { px: number; py: number; pz: number }>();

    // Calculate pixel positions. Each tile position is in fine-grid units (2 units = 1 tile width).
    let minPx = Infinity, maxPx = -Infinity;
    let minPy = Infinity, maxPy = -Infinity;

    for (const tile of state.tiles) {
      const px = (tile.position.x / 2) * (tileW + TILE_GAP) + tile.position.z * LAYER_OFFSET_X;
      const py = (tile.position.y / 2) * (tileH + TILE_GAP) + tile.position.z * LAYER_OFFSET_Y;
      positions.set(tile.id, { px, py, pz: tile.position.z });

      minPx = Math.min(minPx, px);
      maxPx = Math.max(maxPx, px + tileW);
      minPy = Math.min(minPy, py);
      maxPy = Math.max(maxPy, py + tileH);
    }

    // Normalize positions so the board starts at (0, 0)
    for (const [, pos] of positions) {
      pos.px -= minPx;
      pos.py -= minPy;
    }

    return {
      boardWidth: maxPx - minPx,
      boardHeight: maxPy - minPy,
      tilePositions: positions,
    };
  }, [state.tiles, tileW, tileH]);

  // Auto-scale to fit container
  useEffect(() => {
    if (!containerRef.current || boardWidth === 0) return;
    const container = containerRef.current;
    const availW = container.clientWidth - 40;
    const availH = container.clientHeight - 40;
    const scaleX = availW / boardWidth;
    const scaleY = availH / boardHeight;
    const newScale = Math.min(scaleX, scaleY, 1.2);
    setScale(Math.max(0.3, newScale));
    setPanOffset({ x: 0, y: 0 });
  }, [boardWidth, boardHeight]);

  // Handle tile click
  const handleTileClick = useCallback((tileId: number) => {
    const tile = state.tiles.find(t => t.id === tileId);
    if (!tile || tile.removed) return;

    const free = isTileFree(tile, state.tiles);
    if (!free) return;

    if (state.selectedTileId === null) {
      // First selection
      audio.playTap();
      dispatch({ type: 'SELECT_TILE', tileId });
      lastSelectedRef.current = tileId;
    } else if (state.selectedTileId === tileId) {
      // Deselect
      dispatch({ type: 'SELECT_TILE', tileId });
      lastSelectedRef.current = null;
    } else {
      // Second selection — check match
      const firstTile = state.tiles.find(t => t.id === state.selectedTileId);
      if (!firstTile) return;

      if (firstTile.word === tile.word) {
        // Match!
        audio.playBell();
        setMatchedTiles(new Set([firstTile.id, tileId]));
        setTimeout(() => {
          dispatch({ type: 'SELECT_TILE', tileId });
          setMatchedTiles(new Set());
        }, 100);
      } else {
        // No match - shake
        audio.playError();
        setShakeTiles(new Set([firstTile.id, tileId]));
        dispatch({ type: 'SELECT_TILE', tileId });
        setTimeout(() => setShakeTiles(new Set()), 500);
      }
      lastSelectedRef.current = null;
    }
  }, [state.tiles, state.selectedTileId, dispatch, audio]);

  // Pan handling (mouse)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    // Only start drag if clicking on the board background, not a tile
    if ((e.target as HTMLElement).closest('.tile')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: panOffset.x, panY: panOffset.y };
  }, [panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPanOffset({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Scroll to zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setScale(prev => Math.max(0.3, Math.min(2, prev + delta)));
  }, []);

  // Sort tiles for correct rendering order (bottom layers first, then by y, then by x)
  const sortedTiles = useMemo(() => {
    return [...state.tiles]
      .filter(t => !t.removed || matchedTiles.has(t.id))
      .sort((a, b) => {
        if (a.position.z !== b.position.z) return a.position.z - b.position.z;
        if (a.position.y !== b.position.y) return a.position.y - b.position.y;
        return a.position.x - b.position.x;
      });
  }, [state.tiles, matchedTiles]);

  // Determine which tiles are free
  const freeTileIds = useMemo(() => {
    const freeSet = new Set<number>();
    for (const tile of state.tiles) {
      if (!tile.removed && isTileFree(tile, state.tiles)) {
        freeSet.add(tile.id);
      }
    }
    return freeSet;
  }, [state.tiles]);

  return (
    <div
      ref={containerRef}
      className="game-board-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
      role="grid"
      aria-label="Mahjong game board"
    >
      <motion.div
        className="game-board"
        style={{
          width: boardWidth,
          height: boardHeight,
          transform: `scale(${scale}) translate(${panOffset.x / scale}px, ${panOffset.y / scale}px)`,
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <AnimatePresence>
          {sortedTiles.map(tile => {
            const pos = tilePositions.get(tile.id);
            if (!pos) return null;

            const isFree = freeTileIds.has(tile.id);
            const isSelected = state.selectedTileId === tile.id;
            const isHinted = state.hintPair !== null &&
              (state.hintPair[0] === tile.id || state.hintPair[1] === tile.id);
            const isShaking = shakeTiles.has(tile.id);
            const isMatched = matchedTiles.has(tile.id);

            return (
              <Tile
                key={tile.id}
                tile={tile}
                px={pos.px}
                py={pos.py}
                pz={pos.pz}
                isFree={isFree}
                isSelected={isSelected}
                isHinted={isHinted}
                isShaking={isShaking}
                isMatched={isMatched}
                onClick={handleTileClick}
                tileW={tileW}
                tileH={tileH}
              />
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
