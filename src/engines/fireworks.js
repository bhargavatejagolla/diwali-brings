/**
 * Photorealistic Fireworks Engine (Authentic Pyrotechnic Simulation)
 * Professional pyrotechnic algorithms: Nishiki Kamuro golden willow waterfalls,
 * Imperial Brocade Crowns, and Diamond Strobe chrysanthemums.
 * Zero cartoon hearts — pure cinematic 4K physics.
 */

import { audioSynth } from './audio-synth.js';
import { haptics } from '../interactions/haptics.js';

export class FireworksEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.rockets = [];
    this.particles = [];
    this.smoke = [];
    this.screenFlashAlpha = 0;
    this.running = false;
    this.resize();

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
  }

  /**
   * Launch high-velocity pyrotechnic rocket
   * Types: 'kamuro' (golden willow), 'brocade' (crackling crown), 'strobe' (diamond stars)
   */
  launchRocket(targetX, targetY, type = 'kamuro') {
    const startX = this.width * 0.25 + Math.random() * (this.width * 0.5);
    const startY = this.height + 25;

    const angle = Math.atan2(targetY - startY, targetX - startX);
    const dist = Math.hypot(targetX - startX, targetY - startY);
    const speed = dist / 42;

    this.rockets.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      targetX,
      targetY,
      type,
      trail: []
    });

    audioSynth.playRocketLaunch();
  }

  explode(x, y, type = 'kamuro') {
    this.screenFlashAlpha = type === 'brocade' ? 0.38 : 0.28;
    const isLarge = type === 'brocade' || type === 'kamuro';
    audioSynth.playFireworkBurst(isLarge ? 'large' : 'medium');
    haptics.fireworkBurst(isLarge ? 'large' : 'medium');

    const count = isLarge ? 280 : 180;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7.5 + 1.2;

      let color, decay, gravity, drag, flicker, secondary;

      if (type === 'kamuro') {
        // Nishiki Kamuro: Long-hanging golden willow rain with slow descent
        color = Math.random() > 0.2 ? '#f5d061' : '#fff5cc';
        decay = 0.005 + Math.random() * 0.004; // Very slow decay
        gravity = 0.065;
        drag = 0.978;
        flicker = Math.random() > 0.4;
        secondary = Math.random() > 0.75;
      } else if (type === 'brocade') {
        // Imperial Brocade Crown: Wide golden burst with micro-sparkles
        color = Math.random() > 0.3 ? '#ffd700' : '#ffffff';
        decay = 0.008 + Math.random() * 0.006;
        gravity = 0.05;
        drag = 0.965;
        flicker = true;
        secondary = Math.random() > 0.6;
      } else {
        // Diamond Strobe: Crisp twinkling celestial white and amber
        color = Math.random() > 0.4 ? '#ffffff' : '#ffd591';
        decay = 0.012 + Math.random() * 0.007;
        gravity = 0.04;
        drag = 0.95;
        flicker = true;
        secondary = false;
      }

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        decay,
        gravity,
        drag,
        size: Math.random() * 2 + 1.4,
        flicker,
        secondary
      });
    }

    // Atmospheric illuminated smoke puffs
    for (let s = 0; s < 5; s++) {
      this.smoke.push({
        x: x + (Math.random() - 0.5) * 25,
        y: y + (Math.random() - 0.5) * 25,
        size: 20 + Math.random() * 25,
        alpha: 0.22,
        growth: 0.4,
        decay: 0.006
      });
    }
  }

  update() {
    // 1. Update Rockets
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.x += r.vx;
      r.y += r.vy;
      r.vy += 0.04;

      r.trail.push({ x: r.x, y: r.y, alpha: 1 });
      if (r.trail.length > 9) r.trail.shift();

      if (Math.random() > 0.4) {
        this.smoke.push({
          x: r.x + (Math.random() - 0.5) * 3,
          y: r.y + (Math.random() - 0.5) * 3,
          size: 4 + Math.random() * 5,
          alpha: 0.2,
          growth: 0.25,
          decay: 0.01
        });
      }

      const dist = Math.hypot(r.targetX - r.x, r.targetY - r.y);
      if (dist < 18 || r.y <= r.targetY) {
        this.explode(r.targetX, r.targetY, r.type);
        this.rockets.splice(i, 1);
      }
    }

    // 2. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
      p.alpha -= p.decay;

      // Kamuro willow secondary golden micro-droplets
      if (p.secondary && Math.random() > 0.88 && p.alpha > 0.25) {
        this.particles.push({
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          color: '#ffffff',
          alpha: p.alpha * 0.9,
          decay: 0.035,
          gravity: 0.03,
          drag: 0.92,
          size: 1.1,
          flicker: false,
          secondary: false
        });
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 3. Update Smoke
    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const s = this.smoke[i];
      s.size += s.growth;
      s.alpha -= s.decay;
      s.y -= 0.12;
      if (s.alpha <= 0) {
        this.smoke.splice(i, 1);
      }
    }

    // 4. Update Screen Flash
    if (this.screenFlashAlpha > 0) {
      this.screenFlashAlpha -= 0.03;
      if (this.screenFlashAlpha < 0) this.screenFlashAlpha = 0;
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Screen Bloom Pulse
    if (this.screenFlashAlpha > 0) {
      this.ctx.fillStyle = `rgba(255, 230, 160, ${this.screenFlashAlpha})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Illuminated Atmospheric Smoke
    for (const s of this.smoke) {
      this.ctx.fillStyle = `rgba(180, 165, 205, ${s.alpha * 0.25})`;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Rocket Trails & Heads
    this.ctx.save();
    this.ctx.lineWidth = 2;
    for (const r of this.rockets) {
      for (let j = 0; j < r.trail.length - 1; j++) {
        const p1 = r.trail[j];
        const p2 = r.trail[j + 1];
        this.ctx.strokeStyle = `rgba(255, 215, 100, ${(j / r.trail.length) * 0.85})`;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
      }

      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowColor = '#ffd700';
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, 2.8, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();

    // High Bloom Light Composite Particles
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';

    for (const p of this.particles) {
      const alpha = p.flicker && Math.random() > 0.35 ? p.alpha * 0.65 : p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 7;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  loop() {
    if (!this.running) return;
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}
