/**
 * BreathDetector — Mic-based breath detection to light the Diya
 * Listens for sudden RMS energy spikes in low frequencies (blowing on mic).
 */

class BreathDetector {
  constructor() {
    this.stream = null;
    this.audioCtx = null;
    this.analyser = null;
    this.dataArray = null;
    this.isListening = false;
    this.onBlowCallback = null;
    this.animFrame = null;
  }

  async start(onBlow) {
    this.onBlowCallback = onBlow;
    if (this.isListening) return true;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false;
      }

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      
      const source = this.audioCtx.createMediaStreamSource(this.stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.3;

      source.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.isListening = true;

      this.monitor();
      return true;
    } catch (err) {
      console.warn("Microphone breath detection denied or unavailable", err);
      return false;
    }
  }

  monitor() {
    if (!this.isListening || !this.analyser) return;

    this.analyser.getByteFrequencyData(this.dataArray);

    // Blowing on mic generates massive low-to-mid frequency turbulence (bins 0-30)
    let sum = 0;
    const testBins = Math.min(32, this.dataArray.length);
    for (let i = 0; i < testBins; i++) {
      sum += this.dataArray[i];
    }
    const average = sum / testBins;

    // Threshold for deliberate breath
    if (average > 75) {
      if (this.onBlowCallback) {
        this.onBlowCallback(average);
        this.stop();
        return;
      }
    }

    this.animFrame = requestAnimationFrame(() => this.monitor());
  }

  stop() {
    this.isListening = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }
  }
}

export const breathDetector = new BreathDetector();
