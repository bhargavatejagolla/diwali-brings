/**
 * TiltParallax — DeviceOrientation gyroscope & Desktop mouse tracker
 * Smoothly interpolates orientation to create a 3D depth feeling.
 */

class TiltParallax {
  constructor() {
    this.targetX = 0;
    this.targetY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.enabled = false;
    this.init();
  }

  init() {
    // Desktop mouse tracking
    window.addEventListener('mousemove', (e) => {
      this.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Mobile gyroscope tracking
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma !== null && e.beta !== null) {
          // gamma: left-to-right [-90, 90]
          // beta: front-to-back [-180, 180]
          this.targetX = Math.max(-1, Math.min(1, e.gamma / 35));
          this.targetY = Math.max(-1, Math.min(1, (e.beta - 45) / 45));
        }
      });
    }

    this.loop();
  }

  async requestPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        return response === 'granted';
      } catch (e) {
        return false;
      }
    }
    return true;
  }

  loop() {
    // Smooth lerp (linear interpolation)
    this.currentX += (this.targetX - this.currentX) * 0.08;
    this.currentY += (this.targetY - this.currentY) * 0.08;
    requestAnimationFrame(() => this.loop());
  }

  getValues() {
    return {
      x: this.currentX,
      y: this.currentY
    };
  }
}

export const tilt = new TiltParallax();
