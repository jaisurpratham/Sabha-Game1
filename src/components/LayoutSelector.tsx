import { motion } from 'motion/react';
import type { LayoutType } from '../game/types';

interface LayoutSelectorProps {
  selected: LayoutType;
  onSelect: (layout: LayoutType) => void;
}

interface LayoutOption {
  type: LayoutType;
  name: string;
  icon: string;
  description: string;
  /** Miniature preview shape as grid dots */
  preview: boolean[][];
}

const LAYOUTS: LayoutOption[] = [
  {
    type: 'turtle',
    name: 'Classic Turtle',
    icon: '🐢',
    description: 'Traditional Mahjong layout with layered center',
    preview: [
      [false, true, true, true, true, false],
      [true, true, true, true, true, true],
      [true, true, true, true, true, true],
      [true, true, true, true, true, true],
      [false, true, true, true, true, false],
    ],
  },
  {
    type: 'pyramid',
    name: 'Pyramid',
    icon: '🔺',
    description: 'Diamond shape rising to a peak',
    preview: [
      [false, false, true, false, false],
      [false, true, true, true, false],
      [true, true, true, true, true],
      [false, true, true, true, false],
      [false, false, true, false, false],
    ],
  },
  {
    type: 'temple',
    name: 'Temple',
    icon: '🛕',
    description: 'Mandir silhouette with central spire',
    preview: [
      [false, false, true, false, false],
      [false, true, true, true, false],
      [false, true, true, true, false],
      [true, true, true, true, true],
      [true, true, true, true, true],
    ],
  },
  {
    type: 'lotus',
    name: 'Lotus',
    icon: '🪷',
    description: 'Petal arrangement radiating from center',
    preview: [
      [false, true, false, true, false],
      [true, true, true, true, true],
      [false, true, true, true, false],
      [true, true, true, true, true],
      [false, true, false, true, false],
    ],
  },
  {
    type: 'random',
    name: 'Random',
    icon: '✨',
    description: 'Unique algorithmically-generated layout',
    preview: [
      [true, false, true, true, false],
      [true, true, true, false, true],
      [false, true, true, true, true],
      [true, false, true, true, false],
      [true, true, false, true, true],
    ],
  },
];

export default function LayoutSelector({ selected, onSelect }: LayoutSelectorProps) {
  return (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 20,
        fontWeight: 600,
        color: 'var(--color-maroon)',
        margin: '0 0 4px 0',
      }}>
        Choose Layout
      </h2>
      <p style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 13,
        color: 'var(--color-temple-text-light)',
        margin: '0 0 16px 0',
      }}>
        Select the tile arrangement pattern for your puzzle.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12,
      }}>
        {LAYOUTS.map(layout => (
          <motion.button
            key={layout.type}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`layout-option ${selected === layout.type ? 'selected' : ''}`}
            onClick={() => onSelect(layout.type)}
            aria-label={`${layout.name} layout`}
            aria-pressed={selected === layout.type}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
          >
            {/* Mini Preview Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${layout.preview[0].length}, 8px)`,
              gap: 2,
              marginBottom: 4,
            }}>
              {layout.preview.flat().map((filled, i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 10,
                    borderRadius: 2,
                    background: filled
                      ? selected === layout.type
                        ? 'var(--color-saffron)'
                        : 'var(--color-sandstone-dark)'
                      : 'transparent',
                    transition: 'background 0.2s ease',
                  }}
                />
              ))}
            </div>

            <span style={{ fontSize: 20 }}>{layout.icon}</span>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 13,
              fontWeight: 600,
              color: selected === layout.type ? 'var(--color-maroon)' : 'var(--color-temple-text)',
            }}>
              {layout.name}
            </span>
            <span style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 11,
              color: 'var(--color-temple-text-light)',
              lineHeight: 1.3,
            }}>
              {layout.description}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
