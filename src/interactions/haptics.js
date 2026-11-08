/**
 * HapticFeedback Engine — Tactile micro-vibrations for phone interactions
 */

class HapticEngine {
  constructor() {
    this.supported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  vibrate(pattern) {
    if (!this.supported) return;
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore vibration blocks
    }
  }

  lightTap() {
    this.vibrate(10);
  }

  flameIgnited() {
    this.vibrate([25, 40, 60]);
  }

  foilScratch() {
    this.vibrate(8);
  }

  sealBroken() {
    this.vibrate([40, 20, 30]);
  }

  fireworkBurst(size = 'large') {
    if (size === 'large') {
      this.vibrate([50, 30, 90]);
    } else {
      this.vibrate([25, 20, 45]);
    }
  }

  heartbeat() {
    this.vibrate([35, 100, 40]);
  }
}

export const haptics = new HapticEngine();
