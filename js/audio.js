/**
 * Singularity Collector — ASMR Tactile Sound Engine
 * Procedural Web Audio with Anti-Phasing micro-randomization for satisfying, organic pop-it cascade.
 * Specialized sounds: Standard Pop, Golden Deep Pop, Cluster Micro-Pop, Aerogel Bubble Plop, and Magnetic Surge.
 */

window.SoundEngine = (function() {
  let ctx = null;
  let isMuted = false;
  let masterGain = null;
  let isInitialized = false;

  function initAudio() {
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtx();
      
      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.85, ctx.currentTime);
      masterGain.connect(ctx.destination);

      isInitialized = true;
    } catch (e) {
      console.warn('Web Audio initialization error:', e);
    }
  }

  /**
   * Main tactile pop sound with micro-pitch anti-phasing
   */
  function playPop(orbType = 'standard') {
    if (isMuted || !ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (orbType === 'micro') {
      playMicroPop();
      return;
    }
    if (orbType === 'bubble') {
      playBubblePop();
      return;
    }
    if (orbType === 'magnet') {
      playMagneticPulse();
      return;
    }

    const now = ctx.currentTime;
    const isGold = (orbType === 'gold');
    const isCluster = (orbType === 'cluster');

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';

    // Anti-phasing pitch jitter: 0.92 to 1.08
    const pitchJitter = 1 + (Math.random() - 0.5) * 0.16;
    let baseStart = 445;
    if (isGold) baseStart = 370;
    if (isCluster) baseStart = 500;

    const startFreq = baseStart * pitchJitter;
    const sweepDuration = (isGold ? 0.035 : 0.027) + (Math.random() - 0.5) * 0.007;
    const endFreq = (isGold ? 50 : 68) * (1 + (Math.random() - 0.5) * 0.1);
    const totalDuration = sweepDuration + (isGold ? 0.018 : 0.012);

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), now + sweepDuration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(startFreq * 1.25, now);
    filter.frequency.exponentialRampToValueAtTime(140, now + sweepDuration);

    const peakGain = (isGold ? 0.92 : 0.72) * (0.94 + Math.random() * 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.0018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + totalDuration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + totalDuration + 0.005);
  }

  /**
   * Crisp micro-pop for cluster fragment pearls (ultra-fast, light, high-pitched)
   */
  function playMicroPop() {
    if (isMuted || !ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';

    // High, crisp micro pitch
    const pitchJitter = 1 + (Math.random() - 0.5) * 0.22;
    const startFreq = 580 * pitchJitter;
    const sweepDuration = 0.018 + (Math.random() - 0.5) * 0.004; // ~18ms
    const endFreq = 120 * pitchJitter;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + sweepDuration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(220, now + sweepDuration);

    const peakGain = 0.45 * (0.9 + Math.random() * 0.2);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + sweepDuration + 0.008);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + sweepDuration + 0.012);
  }

  /**
   * Airy, liquid soap bubble plop for Antigravity Bubble
   */
  function playBubblePop() {
    if (isMuted || !ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';

    const startFreq = 340 * (1 + (Math.random() - 0.5) * 0.1);
    const sweepDuration = 0.038;
    const endFreq = 82;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + sweepDuration);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, now);
    filter.Q.setValueAtTime(1.8, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.75, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + sweepDuration + 0.02);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + sweepDuration + 0.025);
  }

  /**
   * Deep electromagnetic surge pulse for Magnetic Sphere
   */
  function playMagneticPulse() {
    if (isMuted || !ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;

    // 1. Sub-bass magnetic surge oscillator
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(150, now);
    subOsc.frequency.exponentialRampToValueAtTime(42, now + 0.28);

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.85, now + 0.015);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    subOsc.connect(subGain);
    subGain.connect(masterGain);

    subOsc.start(now);
    subOsc.stop(now + 0.36);

    // 2. Resonant magnetic harmonic chirp
    const chirpOsc = ctx.createOscillator();
    const chirpGain = ctx.createGain();
    chirpOsc.type = 'triangle';
    chirpOsc.frequency.setValueAtTime(220, now);
    chirpOsc.frequency.exponentialRampToValueAtTime(90, now + 0.18);

    chirpGain.gain.setValueAtTime(0.001, now);
    chirpGain.gain.linearRampToValueAtTime(0.28, now + 0.02);
    chirpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    chirpOsc.connect(chirpGain);
    chirpGain.connect(masterGain);

    chirpOsc.start(now);
    chirpOsc.stop(now + 0.24);
  }

  /**
   * Compatibility alias for ball absorption
   */
  function playAbsorption(combo = 1, orbType = 'standard', mass = 1) {
    playPop(orbType);
  }

  /**
   * Soft tactile click for UI upgrades
   */
  function playUpgradeSound() {
    if (isMuted || !ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.022);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.035);
  }

  function toggleMute() {
    isMuted = !isMuted;
    if (masterGain && ctx) {
      masterGain.gain.setTargetAtTime(isMuted ? 0 : 0.85, ctx.currentTime, 0.03);
    }
    return isMuted;
  }

  function setMuted(state) {
    isMuted = Boolean(state);
    if (masterGain && ctx) {
      masterGain.gain.setTargetAtTime(isMuted ? 0 : 0.85, ctx.currentTime, 0.03);
    }
  }

  function suspend() {
    if (ctx && ctx.state === 'running') {
      try { ctx.suspend(); } catch (e) {}
    }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended' && !isMuted) {
      try { ctx.resume(); } catch (e) {}
    }
  }

  function getContext() {
    return ctx;
  }

  return {
    init: initAudio,
    playPop,
    playMicroPop,
    playBubblePop,
    playMagneticPulse,
    playAbsorption,
    playUpgradeSound,
    toggleMute,
    setMuted,
    suspend,
    resume,
    getContext,
    isMuted: () => isMuted,
    isReady: () => isInitialized
  };
})();

// Compatibility alias for platform integrations and prompt specification
window.SynthEngine = window.SoundEngine;

