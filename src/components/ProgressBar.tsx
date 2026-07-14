import { useGame } from '../context/GameContext';

export default function ProgressBar() {
  const { state } = useGame();

  if (!state.gameStarted || state.totalPairs === 0) return null;

  const progress = (state.matches / state.totalPairs) * 100;

  return (
    <div className="progress-bar-container">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        <span style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 11,
          color: 'var(--color-temple-text-light)',
          whiteSpace: 'nowrap',
          minWidth: 60,
        }}>
          {state.matches} / {state.totalPairs} pairs
        </span>
        <div className="progress-bar-track" style={{ flex: 1 }}>
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={state.matches}
            aria-valuemin={0}
            aria-valuemax={state.totalPairs}
            aria-label={`Progress: ${state.matches} of ${state.totalPairs} pairs matched`}
          />
        </div>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--color-saffron-dark)',
          minWidth: 36,
          textAlign: 'right',
        }}>
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}
