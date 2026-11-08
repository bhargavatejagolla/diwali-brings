/**
 * HapticFeedback Engine — Tactile micro-vibrations for phone interactions
 */

class HapticEngine {
  constructor() {
    this.supported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
    this.hasUserInteracted = false;

    if (typeof window !== 'undefined') {
      window.addEventListener('pointerdown', () => {
        this.hasUserInteracted = true;
      }, { once: true });
    }
  }

  vibrate(pattern) {
    if (!this.supported || !this.hasUserInteracted) return;
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Silently catch browser interventions
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

  // Alias so both names work seamlessly
  fireworkExplosion() {
    this.fireworkBurst('large');
  }

  heartbeat() {
    this.vibrate([35, 100, 40]);
  }
}

export const haptics = new HapticEngine();
