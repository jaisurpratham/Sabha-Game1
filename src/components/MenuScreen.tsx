import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import WordImporter from './WordImporter';
import type { LayoutType, Difficulty } from '../game/types';

interface MenuScreenProps {
  onStartGame: (words: string[], layout: LayoutType, difficulty: Difficulty) => void;
}

const DEFAULT_WORDS = [
  'Dharma', 'Karma', 'Mantra', 'Seva', 'Bhakti',
  'Puja', 'Shakti', 'Moksha', 'Guru', 'Deva',
  'Atman', 'Brahman', 'Yoga', 'Sutra', 'Veda',
  'Ahimsa', 'Satya', 'Tapas', 'Shraddha', 'Prasad',
  'Murti', 'Mandala', 'Chakra', 'Pranayama', 'Samadhi',
  'Samsara', 'Nirvana', 'Dharana', 'Pratyahara', 'Yama'
];

export default function MenuScreen({ onStartGame }: MenuScreenProps) {
  const [words, setWords] = useState<string[]>(DEFAULT_WORDS);
  const layout: LayoutType = 'grid';
  const difficulty: Difficulty = 'easy';

  const canStart = words.length >= 6;

  const handleWordsChange = useCallback((newWords: string[]) => {
    setWords(newWords);
  }, []);

  const handleStart = useCallback(() => {
    if (canStart) {
      onStartGame(words, layout, difficulty);
    }
  }, [words, layout, difficulty, canStart, onStartGame]);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      minHeight: '100vh',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: 640,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
        }}
      >
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 600,
              color: 'var(--color-maroon)',
              margin: 0,
              letterSpacing: '2px',
            }}>
              Gunn gava tin jeev bhramrup thai
            </h1>
          </div>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--color-temple-text-light)',
            margin: 0,
            fontStyle: 'italic',
          }}>
            A Sacred Word Matching Journey
          </p>
        </motion.div>

        {/* Ornamental Divider */}
        <div className="ornament-divider" style={{ width: '100%', maxWidth: 300 }}>
          <span style={{ fontSize: 12 }}>🪷</span>
        </div>



        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="temple-card"
            style={{
              width: '100%',
              padding: 24,
            }}
          >
            <WordImporter
              words={words}
              onWordsChange={handleWordsChange}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-temple btn-maroon"
            onClick={handleStart}
            disabled={!canStart}
            style={{
              opacity: canStart ? 1 : 0.5,
              padding: '12px 32px',
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            🙏 Begin Journey
          </motion.button>
        </div>

        {!canStart && (
          <p style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 12,
            color: 'var(--color-maroon)',
            margin: 0,
          }}>
            Please enter at least 6 words to begin
          </p>
        )}
      </motion.div>
    </div>
  );
}
