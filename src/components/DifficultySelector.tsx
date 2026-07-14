import { motion } from 'motion/react';
import type { Difficulty } from '../game/types';

interface DifficultySelectorProps {
  selected: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
  wordCount: number;
}

interface DifficultyOption {
  type: Difficulty;
  name: string;
  icon: string;
  description: string;
  wordRange: [number, number];
  maxLayers: number;
  color: string;
}

const DIFFICULTIES: DifficultyOption[] = [
  {
    type: 'easy',
    name: 'Easy',
    icon: '🌱',
    description: 'Gentle introduction with fewer tiles and layers',
    wordRange: [6, 18],
    maxLayers: 2,
    color: 'var(--color-teal)',
  },
  {
    type: 'medium',
    name: 'Medium',
    icon: '🌿',
    description: 'Balanced challenge with moderate stacking',
    wordRange: [12, 30],
    maxLayers: 3,
    color: 'var(--color-saffron)',
  },
  {
    type: 'hard',
    name: 'Hard',
    icon: '🔥',
    description: 'Dense layout with deep stacking',
    wordRange: [20, 50],
    maxLayers: 4,
    color: 'var(--color-maroon)',
  },
  {
    type: 'master',
    name: 'Master',
    icon: '🕉️',
    description: 'The ultimate spiritual challenge',
    wordRange: [30, 72],
    maxLayers: 5,
    color: 'var(--color-gold-dark)',
  },
];

export default function DifficultySelector({ selected, onSelect, wordCount }: DifficultySelectorProps) {
  return (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 20,
        fontWeight: 600,
        color: 'var(--color-maroon)',
        margin: '0 0 4px 0',
      }}>
        Difficulty
      </h2>
      <p style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 13,
        color: 'var(--color-temple-text-light)',
        margin: '0 0 16px 0',
      }}>
        Higher difficulty uses more of your words with deeper tile stacking.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DIFFICULTIES.map(diff => {
          const wordsUsed = Math.min(wordCount, diff.wordRange[1]);
          const wordsAvailable = wordCount >= diff.wordRange[0];

          return (
            <motion.button
              key={diff.type}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => wordsAvailable && onSelect(diff.type)}
              disabled={!wordsAvailable}
              aria-label={`${diff.name} difficulty`}
              aria-pressed={selected === diff.type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 18px',
                borderRadius: 12,
                border: `2px solid ${selected === diff.type ? diff.color : 'transparent'}`,
                background: selected === diff.type
                  ? 'rgba(217, 142, 4, 0.06)'
                  : 'rgba(245, 239, 228, 0.4)',
                cursor: wordsAvailable ? 'pointer' : 'not-allowed',
                opacity: wordsAvailable ? 1 : 0.45,
                transition: 'all 0.2s ease',
                textAlign: 'left',
                width: '100%',
                boxShadow: selected === diff.type ? `0 0 16px rgba(217,142,4,0.08)` : 'none',
              }}
            >
              <span style={{ fontSize: 28 }}>{diff.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--color-temple-text)',
                  marginBottom: 2,
                }}>
                  {diff.name}
                </div>
                <div style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 12,
                  color: 'var(--color-temple-text-light)',
                }}>
                  {diff.description}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 16,
                  fontWeight: 600,
                  color: diff.color,
                }}>
                  {wordsUsed * 2}
                </div>
                <div style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 10,
                  color: 'var(--color-temple-text-light)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  tiles
                </div>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
              }}>
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 20,
                      height: 3,
                      borderRadius: 1.5,
                      background: i < diff.maxLayers ? diff.color : 'rgba(212,196,168,0.3)',
                      opacity: i < diff.maxLayers ? 0.7 : 1,
                    }}
                  />
                ))}
                <span style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 9,
                  color: 'var(--color-temple-text-light)',
                  marginTop: 2,
                }}>
                  layers
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
