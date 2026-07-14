import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';

export default function MatchPopup() {
  const { state, dispatch, audio } = useGame();

  if (!state.currentMatch) return null;

  const handleClose = () => {
    audio.playTap();
    dispatch({ type: 'CLEAR_MATCH_POPUP' });
  };

  return (
    <AnimatePresence>
      <motion.div
        key="match-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="temple-card-elevated"
          style={{
            padding: '40px 60px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            maxWidth: '90%',
          }}
          onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
        >
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(24px, 5vw, 36px)',
            color: 'var(--color-maroon)',
            fontWeight: 700,
          }}>
            Match Found!
          </div>

          <div style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'clamp(32px, 8vw, 64px)',
            color: 'var(--color-saffron-dark)',
            fontWeight: 800,
            textShadow: '0 2px 10px rgba(217, 142, 4, 0.2)',
            margin: '20px 0',
          }}>
            {state.currentMatch.word}
          </div>

          <button
            className="btn-temple btn-primary"
            onClick={handleClose}
            style={{ fontSize: 20, padding: '12px 40px' }}
          >
            Continue
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
