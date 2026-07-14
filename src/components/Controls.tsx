import { useCallback } from 'react';
import { motion } from 'motion/react';
import { useGame } from '../context/GameContext';

export default function Controls() {
  const { dispatch, audio, highContrast, toggleHighContrast, largeText, toggleLargeText } = useGame();

  const handleHint = useCallback(() => {
    dispatch({ type: 'HINT' });
  }, [dispatch]);

  const handleShuffle = useCallback(() => {
    dispatch({ type: 'SHUFFLE' });
  }, [dispatch]);

  const handleRestart = useCallback(() => {
    dispatch({ type: 'RESTART' });
  }, [dispatch]);

  return (
    <div style={{
      position: 'fixed',
      right: 16,
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      zIndex: 40,
    }}>
      {/* Hint */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="btn-icon"
        onClick={handleHint}
        aria-label="Show hint"
        title="Hint (-50 pts)"
        style={{ fontSize: 16 }}
      >
        💡
      </motion.button>

      {/* Shuffle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="btn-icon"
        onClick={handleShuffle}
        aria-label="Shuffle tiles"
        title="Shuffle remaining tiles"
        style={{ fontSize: 16 }}
      >
        🔀
      </motion.button>

      {/* Restart */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="btn-icon"
        onClick={handleRestart}
        aria-label="Restart game"
        title="Restart"
        style={{ fontSize: 16 }}
      >
        🔄
      </motion.button>

      {/* Divider */}
      <div style={{
        width: 24,
        height: 1,
        background: 'var(--color-sandstone-dark)',
        margin: '4px auto',
        opacity: 0.4,
      }} />

      {/* Mute */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="btn-icon"
        onClick={audio.toggleMute}
        aria-label={audio.isMuted ? 'Unmute audio' : 'Mute audio'}
        title={audio.isMuted ? 'Unmute' : 'Mute'}
        style={{ fontSize: 16 }}
      >
        {audio.isMuted ? '🔇' : '🔔'}
      </motion.button>

      {/* High Contrast */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="btn-icon"
        onClick={toggleHighContrast}
        aria-label={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
        title="High Contrast"
        style={{
          fontSize: 14,
          fontWeight: 700,
          fontFamily: 'var(--font-ui)',
          background: highContrast ? 'var(--color-maroon)' : undefined,
          color: highContrast ? 'white' : undefined,
        }}
      >
        Aa
      </motion.button>

      {/* Large Text */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="btn-icon"
        onClick={toggleLargeText}
        aria-label={largeText ? 'Disable large text' : 'Enable large text'}
        title="Large Text"
        style={{
          fontSize: largeText ? 18 : 12,
          fontWeight: 700,
          fontFamily: 'var(--font-heading)',
          background: largeText ? 'var(--color-saffron)' : undefined,
          color: largeText ? 'white' : undefined,
        }}
      >
        T
      </motion.button>
    </div>
  );
}
