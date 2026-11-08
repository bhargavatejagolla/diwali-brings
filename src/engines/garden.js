/**
 * GardenEngine — Scene 03: A Garden of Light
 * Royal palace garden atmosphere with floating sky lanterns,
 * swaying marigold petals, and warm starlight depth around Dharji Shravya's name.
 */

import { tilt } from '../interactions/tilt.js';

export class GardenEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.lanterns = [];
    this.petals = [];
    this.running = false;
    this.resize();

    window.addEventListener('resize', () => this.resize());
    this.initLanterns();
    this.initPetals();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  initLanterns() {
    this.lanterns = [];
    const count = 18;
    for (let i = 0; i < count; i++) {
      this.lanterns.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vy: -0.3 - Math.random() * 0.4,
        size: Math.random() * 12 + 14,
        hue: Math.random() > 0.5 ? 42 : 340, // Gold and soft lotus pink
        flicker: Math.random() * 10,
        depth: Math.random() * 0.6 + 0.4
      });
    }
  }

  initPetals() {
    this.petals = [];
    const count = 30;
    for (let i = 0; i < count; i++) {
      this.petals.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: 0.4 + Math.random() * 0.6,
        size: Math.random() * 6 + 5,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.04,
        color: Math.random() > 0.4 ? '#f59e0b' : '#ea580c' // Marigold yellow/orange
      });
    }
  }

  start() {
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
  }

  update() {
    // 1. Floating Lanterns
    for (const l of this.lanterns) {
      l.y += l.vy;
      l.x += Math.sin(Date.now() * 0.001 + l.flicker) * 0.35;
      if (l.y < -30) {
        l.y = this.height + 20;
        l.x = Math.random() * this.width;
      }
    }

    // 2. Falling Marigold Petals
    for (const p of this.petals) {
      p.y += p.vy;
      p.x += p.vx + Math.sin(Date.now() * 0.002 + p.y * 0.01) * 0.5;
      p.rotation += p.vRot;
      if (p.y > this.height + 15) {
        p.y = -10;
        p.x = Math.random() * this.width;
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    const { x: tiltX, y: tiltY } = tilt.getValues();

    // 1. Draw Palace Courtyard Silhouettes at the bottom
    this.drawPalaceSilhouette();

    // 2. Draw Floating Lanterns with Glow
    this.ctx.save();
    for (const l of this.lanterns) {
      const px = l.x + tiltX * l.depth * 25;
      const py = l.y + tiltY * l.depth * 25;

      const aura = this.ctx.createRadialGradient(px, py, 2, px, py, l.size * 2.2);
      aura.addColorStop(0, l.hue === 42 ? 'rgba(230, 185, 79, 0.45)' : 'rgba(216, 76, 135, 0.35)');
      aura.addColorStop(1, 'transparent');
      this.ctx.fillStyle = aura;
      this.ctx.beginPath();
      this.ctx.arc(px, py, l.size * 2.2, 0, Math.PI * 2);
      this.ctx.fill();

      // Paper Lantern Body
      const bodyGrad = this.ctx.createLinearGradient(px - l.size * 0.4, py, px + l.size * 0.4, py);
      bodyGrad.addColorStop(0, '#fef08a');
      bodyGrad.addColorStop(0.5, '#f59e0b');
      bodyGrad.addColorStop(1, '#d97706');
      this.ctx.fillStyle = bodyGrad;
      this.ctx.beginPath();
      this.ctx.roundRect(px - l.size * 0.4, py - l.size * 0.5, l.size * 0.8, l.size, 4);
      this.ctx.fill();
    }
    this.ctx.restore();

    // 3. Draw Swaying Marigold Petals
    this.ctx.save();
    for (const p of this.petals) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
    this.ctx.restore();
  }

  drawPalaceSilhouette() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(10, 14, 34, 0.75)';
    const baseH = this.height * 0.88;

    // Subtle dome arches in the background
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.height);
    this.ctx.lineTo(0, baseH);

    const domeW = this.width / 5;
    for (let i = 0; i < 5; i++) {
      const cx = (i + 0.5) * domeW;
      this.ctx.lineTo(cx - domeW * 0.4, baseH);
      this.ctx.quadraticCurveTo(cx, baseH - 45, cx + domeW * 0.4, baseH);
    }

    this.ctx.lineTo(this.width, baseH);
    this.ctx.lineTo(this.width, this.height);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();
  }

  loop() {
    if (!this.running) return;
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}
