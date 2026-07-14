import { motion } from 'motion/react';
import { useGame } from '../context/GameContext';

interface HeaderProps {
  onBack: () => void;
}

/** Format seconds as MM:SS */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function Header({ onBack }: HeaderProps) {
  const { state } = useGame();

  return (
    <header className="game-header">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
        gap: 12,
      }}>
        {/* Left: Back button + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-icon"
            onClick={onBack}
            aria-label="Back to menu"
            title="Back to menu"
          >
            ←
          </motion.button>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(18px, 3.5vw, 26px)',
            fontWeight: 600,
            color: 'var(--color-maroon)',
            margin: 0,
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
          }}>
            मंदिर Mahjong
          </h1>
        </div>

        {/* Center: Stats */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(12px, 3vw, 28px)',
        }}>
          <div className="stat-badge">
            <span className="stat-value">{state.moves}</span>
            <span className="stat-label">Moves</span>
          </div>
          <div className="stat-badge">
            <span className="stat-value">{state.matches}/{state.totalPairs}</span>
            <span className="stat-label">Matches</span>
          </div>
          <div className="stat-badge">
            <span className="stat-value">{formatTime(state.timeElapsed)}</span>
            <span className="stat-label">Time</span>
          </div>
          <div className="stat-badge">
            <span className="stat-value" style={{ color: 'var(--color-gold-dark)' }}>{state.score}</span>
            <span className="stat-label">Score</span>
          </div>
        </div>

        {/* Right: Spacer for balance */}
        <div style={{ width: 52 }} />
      </div>
    </header>
  );
}
