/**
 * AudioSynthesizer — Standalone Web Audio API Procedural Sound Engine
 * Eliminates external MP3 dependency risks. Generates pristine, atmospheric
 * sounds procedurally directly through browser oscillators & noise buffers.
 */

class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.droneGain = null;
    this.droneOscillators = [];
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.initialized = true;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn("Web Audio not supported or blocked", e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  // Meditative ambient drone (warm Indian festive tanpura & celestial organ harmonics)
  startAmbientDrone() {
    this.ensureContext();
    if (!this.ctx || this.droneGain) return;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.droneGain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 3);
    this.droneGain.connect(this.masterGain);

    // Warm root notes: C#3 (138.59Hz), G#3 (207.65Hz), C#4 (277.18Hz), F4 (349.23Hz)
    const baseFreqs = [138.59, 207.65, 277.18, 349.23];

    baseFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Subtle detune for rich celestial shimmer
      osc.detune.setValueAtTime((idx - 1.5) * 4, this.ctx.currentTime);

      // Low frequency oscillator for gentle breathing pulsation
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.2 + idx * 0.05, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      lfo.connect(lfoGain.gain);

      oscGain.gain.setValueAtTime(0.15 / (idx + 1), this.ctx.currentTime);
      osc.connect(oscGain);
      oscGain.connect(this.droneGain);

      osc.start();
      lfo.start();
      this.droneOscillators.push(osc, lfo);
    });
  }

  // Flame ignition flare
  playIgnition() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    
    // Whoosh filter
    const bufferSize = this.ctx.sampleRate * 1.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.4));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.3);
    filter.frequency.exponentialRampToValueAtTime(300, now + 1.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);

    // Warm fundamental tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.8);
    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  // Starlight chime for constellation
  playStarlightChime(freq = 587.33) { // D5 default
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.6);
  }

  // Wax seal break
  playSealBreak() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Firework launch whoosh
  playRocketLaunch() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.65);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.65);
  }

  // Photorealistic firework burst (sub-bass concussion + shimmering crackle)
  playFireworkBurst(size = 'large') {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;

    // 1. Deep Sub-Bass Thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    const basePitch = size === 'large' ? 80 : 120;
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(basePitch, now);
    subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.5);

    subGain.gain.setValueAtTime(size === 'large' ? 0.6 : 0.35, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 0.6);

    // 2. Sparkle crackle burst (filtered white noise decay)
    const dur = size === 'large' ? 1.8 : 1.2;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.45));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.setValueAtTime(1.5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(size === 'large' ? 0.35 : 0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);
  }

  // Alias for cinematic firework burst boom
  playBurstBoom() {
    this.playFireworkBurst('large');
  }
}

export const audioSynth = new AudioSynthesizer();
