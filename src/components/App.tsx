import { useState, useCallback } from 'react';
import { GameProvider, useGame } from '../context/GameContext';
import MenuScreen from './MenuScreen';
import GameBoard from './GameBoard';
import Header from './Header';
import ProgressBar from './ProgressBar';
import WinModal from './WinModal';
import ParticleSystem from './ParticleSystem';
import MatchPopup from './MatchPopup';
import FoundWordsList from './FoundWordsList';
import type { LayoutType, Difficulty } from '../game/types';

type Screen = 'menu' | 'game';

/** Inner app content that has access to GameContext */
function AppContent() {
  const { state, dispatch, highContrast, largeText } = useGame();
  const [screen, setScreen] = useState<Screen>('menu');

  const handleStartGame = useCallback((words: string[], layout: LayoutType, difficulty: Difficulty) => {
    dispatch({ type: 'NEW_GAME', words, layout, difficulty });
    setScreen('game');
  }, [dispatch]);

  const handleBackToMenu = useCallback(() => {
    setScreen('menu');
  }, []);

  const handlePlayAgain = useCallback(() => {
    dispatch({ type: 'RESTART' });
  }, [dispatch]);

  const handleNewLayout = useCallback(() => {
    setScreen('menu');
  }, []);

  const rootClasses = [
    highContrast ? 'high-contrast' : '',
    largeText ? 'large-text' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={rootClasses} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Temple Background */}
      <div className="temple-bg" />
      
      {/* Floating Particles */}
      <ParticleSystem />

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {screen === 'menu' && (
          <MenuScreen onStartGame={handleStartGame} />
        )}

        {screen === 'game' && (
          <>
            <Header onBack={handleBackToMenu} />
            <GameBoard />
            <FoundWordsList />
            <ProgressBar />
          </>
        )}
      </div>

      <MatchPopup />

      {/* Win Modal */}
      {state.isComplete && (
        <WinModal
          onPlayAgain={handlePlayAgain}
          onNewLayout={handleNewLayout}
        />
      )}
    </div>
  );
}

/** Root App component wrapped in GameProvider */
export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
