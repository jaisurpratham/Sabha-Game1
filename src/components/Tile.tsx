import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { GameTile } from '../game/types';

interface TileProps {
  tile: GameTile;
  px: number;
  py: number;
  pz: number;
  isFree: boolean;
  isSelected: boolean;
  isHinted: boolean;
  isShaking: boolean;
  isMatched: boolean;
  onClick: (tileId: number) => void;
  tileW: number;
  tileH: number;
}

export default function Tile({
  tile,
  px,
  py,
  pz,
  isFree,
  isSelected,
  isHinted,
  isShaking,
  isMatched,
  onClick,
  tileW,
  tileH,
}: TileProps) {
  const handleClick = useCallback(() => {
    onClick(tile.id);
  }, [onClick, tile.id]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(tile.id);
    }
  }, [onClick, tile.id]);

  // Build CSS class list
  const classNames = [
    'tile',
    isSelected ? 'tile-selected' : '',
    !isFree && !isSelected ? 'tile-disabled' : '',
    isHinted ? 'tile-hint' : '',
  ].filter(Boolean).join(' ');

  const isFaceUp = isSelected || isShaking || isMatched || isHinted;

  // Shake animation
  const shakeAnimation = isShaking
    ? { x: [0, -6, 6, -6, 6, -3, 3, 0] }
    : {};

  // Match animation (disappear)
  const exitAnimation = {
    opacity: 0,
    scale: 0.5,
    y: -30,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  };

  return (
    <motion.div
      className={classNames}
      style={{
        left: px,
        top: py,
        width: tileW,
        height: tileH,
        zIndex: pz * 100 + Math.floor(py / 2),
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isFree ? 0 : -1}
      role="gridcell"
      aria-label={`Tile: ${tile.word}${isFree ? '' : ' (blocked)'}${isSelected ? ' (selected)' : ''}`}
      aria-disabled={!isFree}
      animate={shakeAnimation}
      exit={exitAnimation}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      layout={false}
    >
      <div className="tile-face">
        <div className="tile-inner-border" />
        <AnimatePresence mode="wait">
          {isFaceUp ? (
            <motion.span
              key="word"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'relative',
                zIndex: 1,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {tile.word}
            </motion.span>
          ) : (
            <motion.span
              key="back"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute',
                zIndex: 1,
                fontSize: tileW < 60 ? 18 : 24,
              }}
            >
              🪷
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Golden sparkle particles on match */}
      {isMatched && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="sparkle"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [1, 0.8, 0],
                x: (Math.random() - 0.5) * 40,
                y: (Math.random() - 0.5) * 40,
              }}
              transition={{
                duration: 0.6,
                delay: i * 0.05,
                ease: 'easeOut',
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
}
