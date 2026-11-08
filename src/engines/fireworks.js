/**
 * FireworksEngine — Scene 05: A Sky Full of Wishes
 * Rich Indian festive jewel-toned pyrotechnics:
 * Peacock Teal (#087E83), Lotus Pink (#D84C87), Royal Violet (#5A267F), and Imperial Gold (#E6B94F).
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

  launchRocket(targetX, targetY, theme = 'gold') {
    const startX = this.width * 0.2 + Math.random() * (this.width * 0.6);
    const startY = this.height + 20;

    const angle = Math.atan2(targetY - startY, targetX - startX);
    const dist = Math.hypot(targetX - startX, targetY - startY);
    const speed = dist / 40;

    this.rockets.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      targetX,
      targetY,
      theme,
      trail: []
    });

    audioSynth.playRocketLaunch();
  }

  explode(x, y, theme = 'gold') {
    this.screenFlashAlpha = 0.32;
    audioSynth.playFireworkBurst('large');
    haptics.fireworkBurst('large');

    const count = 220;
    const jewelPalettes = {
      gold: ['#e6b94f', '#fef08a', '#ffffff', '#ffd700'],
      teal: ['#087e83', '#38bdf8', '#a7f3d0', '#ffffff'],
      pink: ['#d84c87', '#f472b6', '#fda4af', '#ffffff'],
      violet: ['#5a267f', '#a855f7', '#e9d5ff', '#ffffff']
    };

    const palette = jewelPalettes[theme] || jewelPalettes.gold;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7.5 + 1.2;
      const color = palette[Math.floor(Math.random() * palette.length)];

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        decay: 0.007 + Math.random() * 0.006,
        gravity: 0.055,
        drag: 0.968,
        size: Math.random() * 2.2 + 1.2,
        flicker: Math.random() > 0.4
      });
    }

    // Atmospheric illuminated smoke puffs
    for (let s = 0; s < 4; s++) {
      this.smoke.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        size: 20 + Math.random() * 25,
        alpha: 0.22,
        growth: 0.35,
        decay: 0.007
      });
    }
  }

  update() {
    // 1. Update Rockets
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.x += r.vx;
      r.y += r.vy;
      r.vy += 0.035;

      r.trail.push({ x: r.x, y: r.y, alpha: 1 });
      if (r.trail.length > 8) r.trail.shift();

      const dist = Math.hypot(r.targetX - r.x, r.targetY - r.y);
      if (dist < 18 || r.y <= r.targetY) {
        this.explode(r.targetX, r.targetY, r.theme);
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

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 3. Update Smoke
    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const s = this.smoke[i];
      s.size += s.growth;
      s.alpha -= s.decay;
      s.y -= 0.1;
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
      this.ctx.fillStyle = `rgba(255, 240, 214, ${this.screenFlashAlpha})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Illuminated Atmospheric Smoke
    for (const s of this.smoke) {
      this.ctx.fillStyle = `rgba(90, 38, 127, ${s.alpha * 0.2})`;
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
        this.ctx.strokeStyle = `rgba(230, 185, 79, ${(j / r.trail.length) * 0.85})`;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
      }

      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowColor = '#e6b94f';
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
      const alpha = p.flicker && Math.random() > 0.35 ? p.alpha * 0.7 : p.alpha;
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
