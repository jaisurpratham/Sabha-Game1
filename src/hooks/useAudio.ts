import { useRef, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AudioControls {
  /** Resonant temple bell – play on a successful match. */
  playBell: () => void;
  /** Soft wooden tap – play on tile selection. */
  playTap: () => void;
  /** Majestic conch horn – play on puzzle completion. */
  playConch: () => void;
  /** Gentle two-tone descending error – play on mismatch. */
  playError: () => void;
  /** Whether all sound is muted. */
  isMuted: boolean;
  /** Toggle the mute state (persisted in localStorage). */
  toggleMute: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Provides four synthesised temple-themed sounds using the **Web Audio API**.
 *
 * No external audio files are required – every sound is generated
 * procedurally at playback time.  The `AudioContext` is created lazily on
 * the first call to any `play*` function so the browser's autoplay policy
 * is satisfied (user gesture triggers context creation).
 *
 * Mute state is persisted to `localStorage` via `useLocalStorage`.
 */
export function useAudio(): AudioControls {
  const ctxRef = useRef<AudioContext | null>(null);
  const [isMuted, setIsMuted] = useLocalStorage<boolean>('audioMuted', false);

  /** Lazily initialise the AudioContext on first interaction. */
  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    // Resume if the browser suspended it before a user gesture.
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // -----------------------------------------------------------------------
  // 🔔  Temple bell – sine fundamental + two inharmonic partials,
  //     exponential decay, slight detuning for warmth.
  // -----------------------------------------------------------------------
  const playBell = useCallback(() => {
    if (isMuted) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.35, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    masterGain.connect(ctx.destination);

    // Fundamental
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(830, now);
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(1.0, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    osc1.connect(g1).connect(masterGain);

    // 2nd partial – slightly inharmonic for that "bell" character
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(830 * 2.08, now);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.4, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    osc2.connect(g2).connect(masterGain);

    // 3rd partial – high shimmer
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(830 * 3.15, now);
    const g3 = ctx.createGain();
    g3.gain.setValueAtTime(0.15, now);
    g3.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc3.connect(g3).connect(masterGain);

    [osc1, osc2, osc3].forEach((o) => {
      o.start(now);
      o.stop(now + 2.2);
    });
  }, [isMuted, getCtx]);

  // -----------------------------------------------------------------------
  // 🪵  Wooden tap – short noise burst through a bandpass filter.
  // -----------------------------------------------------------------------
  const playTap = useCallback(() => {
    if (isMuted) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    const duration = 0.06;

    // White noise buffer
    const bufferSize = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Bandpass to make it sound "woody"
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1800, now);
    bp.Q.setValueAtTime(2.5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(bp).connect(gain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);
  }, [isMuted, getCtx]);

  // -----------------------------------------------------------------------
  // 🐚  Conch horn – low frequency sweep with harmonics, long sustain.
  // -----------------------------------------------------------------------
  const playConch = useCallback(() => {
    if (isMuted) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    const totalDuration = 3.0;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    // Gentle attack
    masterGain.gain.linearRampToValueAtTime(0.3, now + 0.3);
    // Sustain
    masterGain.gain.setValueAtTime(0.3, now + totalDuration - 0.8);
    // Fade out
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + totalDuration);
    masterGain.connect(ctx.destination);

    // Fundamental – sweeps upward slightly for that blown-horn feel
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(140, now);
    osc1.frequency.linearRampToValueAtTime(160, now + 0.6);
    osc1.frequency.setValueAtTime(160, now + totalDuration);

    // Low-pass to soften the sawtooth edge
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(600, now);
    lp.Q.setValueAtTime(1.0, now);

    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.7, now);
    osc1.connect(lp).connect(g1).connect(masterGain);

    // Second harmonic – adds body
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(280, now);
    osc2.frequency.linearRampToValueAtTime(320, now + 0.6);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.25, now);
    osc2.connect(g2).connect(masterGain);

    // Breathy noise layer
    const noiseLen = Math.ceil(ctx.sampleRate * totalDuration);
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      nd[i] = Math.random() * 2 - 1;
    }
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    const noiseBP = ctx.createBiquadFilter();
    noiseBP.type = 'bandpass';
    noiseBP.frequency.setValueAtTime(500, now);
    noiseBP.Q.setValueAtTime(0.8, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.06, now);
    noiseSrc.connect(noiseBP).connect(noiseGain).connect(masterGain);

    [osc1, osc2].forEach((o) => {
      o.start(now);
      o.stop(now + totalDuration + 0.1);
    });
    noiseSrc.start(now);
    noiseSrc.stop(now + totalDuration + 0.1);
  }, [isMuted, getCtx]);

  // -----------------------------------------------------------------------
  // ❌  Error – two short descending sine tones.
  // -----------------------------------------------------------------------
  const playError = useCallback(() => {
    if (isMuted) return;
    const ctx = getCtx();
    const now = ctx.currentTime;

    const playTone = (freq: number, startAt: number, dur: number) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startAt);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.75, startAt + dur);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + dur);

      osc.connect(gain).connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + dur + 0.01);
    };

    playTone(520, now, 0.12);
    playTone(400, now + 0.14, 0.15);
  }, [isMuted, getCtx]);

  // -----------------------------------------------------------------------
  // Mute toggle
  // -----------------------------------------------------------------------
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, [setIsMuted]);

  return { playBell, playTap, playConch, playError, isMuted, toggleMute };
}
