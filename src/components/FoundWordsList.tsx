import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';

export default function FoundWordsList() {
  const { state } = useGame();

  const foundWords = useMemo(() => {
    const words = new Set<string>();
    for (const t of state.tiles) {
      if (t.removed) {
        words.add(t.word);
      }
    }
    return Array.from(words);
  }, [state.tiles]);

  if (state.tiles.length === 0) return null;

  return (
    <div className="found-words-list" style={{
      position: 'absolute',
      top: 80,
      left: 20,
      width: 220,
      maxHeight: 'calc(100vh - 120px)',
      overflowY: 'auto',
      pointerEvents: 'none',
      zIndex: 10,
    }}>
      <h3 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 18,
        color: 'var(--color-maroon)',
        borderBottom: '2px solid var(--color-sandstone)',
        paddingBottom: 8,
        marginBottom: 12,
        marginTop: 0,
      }}>
        WORDS FOUND
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence>
          {foundWords.map(word => (
            <motion.div
              key={word}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 10,
                color: 'var(--color-saffron)',
                background: 'var(--color-temple-surface)',
                padding: '8px 12px',
                border: '2px solid var(--color-saffron-dark)',
                boxShadow: '2px 2px 0px #000000',
                borderLeft: '4px solid var(--color-maroon)'
              }}
            >
              {word}
            </motion.div>
          ))}
          {foundWords.length === 0 && (
            <div style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 13,
              color: 'var(--color-temple-text-light)',
              fontStyle: 'italic',
            }}>
              No matches yet...
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
