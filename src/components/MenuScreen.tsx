import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import WordImporter from './WordImporter';
import LayoutSelector from './LayoutSelector';
import DifficultySelector from './DifficultySelector';
import type { LayoutType, Difficulty } from '../game/types';

interface MenuScreenProps {
  onStartGame: (words: string[], layout: LayoutType, difficulty: Difficulty) => void;
}

/** Lotus SVG decoration */
function LotusDecoration({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 6c-2 5-7 11-7 16s5 7 7 8c2-1 7-3 7-8s-5-11-7-16z" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M24 14c-4 3-10 8-10 13s4 5 5 5.5" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.4" />
      <path d="M24 14c4 3 10 8 10 13s-4 5-5 5.5" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.4" />
      <path d="M24 10c-6 2-14 6-14 12s5 6 7 6.5" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.3" />
      <path d="M24 10c6 2 14 6 14 12s-5 6-7 6.5" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.3" />
      <ellipse cx="24" cy="38" rx="8" ry="3" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.3" />
    </svg>
  );
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
  const [layout, setLayout] = useState<LayoutType>('turtle');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [step, setStep] = useState<1 | 2 | 3>(1);

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
            <LotusDecoration className="text-saffron" />
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 600,
              color: 'var(--color-maroon)',
              margin: 0,
              letterSpacing: '2px',
            }}>
              मंदिर Mahjong
            </h1>
            <LotusDecoration className="text-saffron" />
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

        {/* Step Indicators */}
        <div style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}>
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <button
                onClick={() => setStep(s as 1 | 2 | 3)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  background: step === s
                    ? 'linear-gradient(135deg, var(--color-saffron), var(--color-saffron-dark))'
                    : 'var(--color-sandstone)',
                  color: step === s ? 'white' : 'var(--color-temple-text-light)',
                  boxShadow: step === s ? '0 2px 8px rgba(217,142,4,0.3)' : 'none',
                }}
                aria-label={`Step ${s}`}
              >
                {s}
              </button>
              {s < 3 && (
                <div style={{
                  width: 40,
                  height: 2,
                  background: s < step ? 'var(--color-saffron)' : 'var(--color-sandstone)',
                  borderRadius: 1,
                  transition: 'background 0.3s ease',
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
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
            {step === 1 && (
              <WordImporter
                words={words}
                onWordsChange={handleWordsChange}
              />
            )}
            {step === 2 && (
              <LayoutSelector
                selected={layout}
                onSelect={setLayout}
              />
            )}
            {step === 3 && (
              <DifficultySelector
                selected={difficulty}
                onSelect={setDifficulty}
                wordCount={words.length}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {step > 1 && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-temple btn-secondary"
              onClick={() => setStep((step - 1) as 1 | 2 | 3)}
            >
              ← Back
            </motion.button>
          )}
          {step < 3 ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-temple btn-primary"
              onClick={() => setStep((step + 1) as 1 | 2 | 3)}
              disabled={step === 1 && !canStart}
              style={{ opacity: step === 1 && !canStart ? 0.5 : 1 }}
            >
              Next →
            </motion.button>
          ) : (
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
          )}
        </div>

        {!canStart && step === 1 && (
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
