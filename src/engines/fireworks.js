/**
 * FireworksEngine — Photorealistic physics canvas simulation
 * Features: Rocket smoke trails, white-hot core blooms, willow golden rain,
 * heart-shape detonation mathematics, synchronized procedural sound and haptics.
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

  // Launch a realistic rocket
  launchRocket(targetX, targetY, type = 'gold_willow') {
    const startX = this.width * 0.2 + Math.random() * (this.width * 0.6);
    const startY = this.height + 20;

    const angle = Math.atan2(targetY - startY, targetX - startX);
    const dist = Math.hypot(targetX - startX, targetY - startY);
    const speed = dist / 45; // Arrives in ~45 frames

    this.rockets.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      targetX,
      targetY,
      type,
      trail: [],
      hue: Math.random() > 0.4 ? 42 : Math.floor(Math.random() * 360)
    });

    audioSynth.playRocketLaunch();
  }

  // Explode at coordinates
  explode(x, y, type = 'gold_willow', hue = 42) {
    this.screenFlashAlpha = 0.35;
    const isLarge = type === 'heart' || type === 'grand_finale';
    audioSynth.playFireworkBurst(isLarge ? 'large' : 'medium');
    haptics.fireworkBurst(isLarge ? 'large' : 'medium');

    const count = isLarge ? 260 : 160;

    if (type === 'heart') {
      // Mathematical Heart Curve: x = 16 sin^3(t), y = -(13 cos(t) - 5 cos(2t) - 2 cos(3t) - cos(4t))
      for (let i = 0; i < count; i++) {
        const t = (Math.PI * 2 * i) / count;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        const speed = 0.35 + Math.random() * 0.08;

        this.particles.push({
          x,
          y,
          vx: hx * speed + (Math.random() - 0.5) * 0.4,
          vy: hy * speed + (Math.random() - 0.5) * 0.4,
          color: Math.random() > 0.2 ? '#ff4081' : '#ffd700',
          alpha: 1,
          decay: 0.009 + Math.random() * 0.005,
          gravity: 0.04,
          drag: 0.96,
          size: 2.2,
          flicker: true
        });
      }
    } else {
      // Spherical & Golden Willow Burst
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8.5 + 1.2;
        const isGoldWillow = type === 'gold_willow';

        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: isGoldWillow ? (Math.random() > 0.3 ? '#ffd700' : '#fff8dc') : `hsl(${hue}, 100%, 70%)`,
          alpha: 1,
          decay: isGoldWillow ? 0.007 + Math.random() * 0.005 : 0.012 + Math.random() * 0.008, // Willow lingers
          gravity: isGoldWillow ? 0.07 : 0.05,
          drag: isGoldWillow ? 0.97 : 0.94,
          size: isGoldWillow ? 2.4 : 2.0,
          flicker: isGoldWillow,
          secondarySparks: isGoldWillow && Math.random() > 0.7
        });
      }
    }
  }

  update() {
    // 1. Update Rockets
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.x += r.vx;
      r.y += r.vy;
      r.vy += 0.05; // slight rocket gravity

      // Add to trail
      r.trail.push({ x: r.x, y: r.y, alpha: 1 });
      if (r.trail.length > 8) r.trail.shift();

      // Emit smoke puffs
      if (Math.random() > 0.4) {
        this.smoke.push({
          x: r.x + (Math.random() - 0.5) * 4,
          y: r.y + (Math.random() - 0.5) * 4,
          size: 3 + Math.random() * 4,
          alpha: 0.25,
          growth: 0.2,
          decay: 0.008
        });
      }

      // Check detonation
      const dist = Math.hypot(r.targetX - r.x, r.targetY - r.y);
      if (dist < 20 || r.y <= r.targetY) {
        this.explode(r.targetX, r.targetY, r.type, r.hue);
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

      // Occasional micro-spark for willow
      if (p.secondarySparks && Math.random() > 0.85 && p.alpha > 0.3) {
        this.particles.push({
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          color: '#ffffff',
          alpha: p.alpha * 0.8,
          decay: 0.04,
          gravity: 0.02,
          drag: 0.9,
          size: 1.2,
          flicker: false,
          secondarySparks: false
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
      s.y -= 0.15; // Slow rise
      if (s.alpha <= 0) {
        this.smoke.splice(i, 1);
      }
    }

    // 4. Update Screen Flash
    if (this.screenFlashAlpha > 0) {
      this.screenFlashAlpha -= 0.035;
      if (this.screenFlashAlpha < 0) this.screenFlashAlpha = 0;
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Screen Flash (Bloom simulation)
    if (this.screenFlashAlpha > 0) {
      this.ctx.fillStyle = `rgba(255, 235, 180, ${this.screenFlashAlpha})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Draw Smoke
    for (const s of this.smoke) {
      this.ctx.fillStyle = `rgba(200, 190, 220, ${s.alpha * 0.3})`;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw Rockets
    this.ctx.save();
    this.ctx.lineWidth = 2.5;
    for (const r of this.rockets) {
      for (let j = 0; j < r.trail.length - 1; j++) {
        const p1 = r.trail[j];
        const p2 = r.trail[j + 1];
        this.ctx.strokeStyle = `rgba(255, 215, 0, ${(j / r.trail.length) * 0.9})`;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
      }

      // Glowing head
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowColor = '#ffd700';
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();

    // Draw Particles with Composite Glow
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';

    for (const p of this.particles) {
      const alpha = p.flicker && Math.random() > 0.3 ? p.alpha * 0.7 : p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 8;

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
