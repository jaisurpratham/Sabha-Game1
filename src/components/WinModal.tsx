import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';
import { calculateFinalScore, getScoreRating } from '../game/scoring';

interface WinModalProps {
  onPlayAgain: () => void;
  onNewLayout: () => void;
}

/** Format seconds as MM:SS */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function WinModal({ onPlayAgain, onNewLayout }: WinModalProps) {
  const { state } = useGame();


  const finalScore = calculateFinalScore(
    state.score,
    state.timeElapsed,
    state.moves,
    state.hintsUsed,
    state.totalPairs,
  );

  const rating = getScoreRating(finalScore, state.totalPairs);

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="temple-card-elevated"
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 30 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          style={{
            padding: 'clamp(24px, 5vw, 40px)',
            maxWidth: 480,
            width: '100%',
            textAlign: 'center',
          }}
        >
          {/* Lotus decoration */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
            style={{ fontSize: 48, marginBottom: 8 }}
          >
            🌸
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(28px, 5vw, 36px)',
              fontWeight: 700,
              color: 'var(--color-maroon)',
              margin: '0 0 8px 0',
              letterSpacing: '1px',
            }}
          >
            Congratulations!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--color-temple-text-light)',
              margin: '0 0 24px 0',
              fontStyle: 'italic',
              lineHeight: 1.6,
            }}
          >
            You have completed the spiritual word matching journey.
          </motion.p>

          {/* Stars */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 4,
              marginBottom: 8,
              fontSize: 28,
            }}
          >
            {[1, 2, 3, 4, 5].map(star => (
              <motion.span
                key={star}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: star <= rating.stars ? 1 : 0.2,
                  scale: 1,
                }}
                transition={{ delay: 0.7 + star * 0.1, duration: 0.3, ease: 'easeOut' }}
              >
                ⭐
              </motion.span>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.3 }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              fontWeight: 500,
              color: 'var(--color-saffron-dark)',
              margin: '0 0 24px 0',
            }}
          >
            {rating.message}
          </motion.p>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
              marginBottom: 28,
              padding: '16px',
              borderRadius: 12,
              background: 'rgba(232, 217, 197, 0.25)',
            }}
          >
            <div className="stat-badge">
              <span className="stat-value">{formatTime(state.timeElapsed)}</span>
              <span className="stat-label">Time</span>
            </div>
            <div className="stat-badge">
              <span className="stat-value">{state.moves}</span>
              <span className="stat-label">Moves</span>
            </div>
            <div className="stat-badge">
              <span className="stat-value" style={{ color: 'var(--color-gold-dark)' }}>
                {finalScore}
              </span>
              <span className="stat-label">Score</span>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.4 }}
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-temple btn-maroon"
              onClick={onPlayAgain}
              style={{ padding: '12px 24px' }}
            >
              🔄 Play Again
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-temple btn-secondary"
              onClick={onNewLayout}
              style={{ padding: '12px 24px' }}
            >
              🛕 New Layout
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
