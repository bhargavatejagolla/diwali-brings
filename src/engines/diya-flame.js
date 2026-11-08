/**
 * DiyaFlame Engine — Organic, procedurally animated flame and earthen clay lamp
 * Simulates micro-turbulence, organic flicker, volumetric radial aura,
 * and reflective polished marble surface beneath.
 */

import { tilt } from '../interactions/tilt.js';

export class DiyaFlameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isLit = false;
    this.flameScale = 0;
    this.targetFlameScale = 0;
    this.flickerSpeed = 0.08;
    this.turbulence = 0;
    this.resize();

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  ignite() {
    this.isLit = true;
    this.targetFlameScale = 1;
  }

  extinguish() {
    this.isLit = false;
    this.targetFlameScale = 0;
  }

  update() {
    // Smooth ignition expansion
    this.flameScale += (this.targetFlameScale - this.flameScale) * 0.06;
    this.turbulence = Math.sin(Date.now() * 0.008) * 3 + Math.cos(Date.now() * 0.02) * 2;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    const { x: tiltX, y: tiltY } = tilt.getValues();

    const cx = this.width / 2 + tiltX * 12;
    const cy = this.height * 0.62 + tiltY * 12;

    this.ctx.save();

    // 1. Surface Reflection of Diya
    if (this.flameScale > 0.05) {
      const refGrad = this.ctx.createRadialGradient(cx, cy + 30, 5, cx, cy + 30, 80 * this.flameScale);
      refGrad.addColorStop(0, 'rgba(255, 170, 50, 0.25)');
      refGrad.addColorStop(0.5, 'rgba(255, 100, 20, 0.08)');
      refGrad.addColorStop(1, 'transparent');

      this.ctx.fillStyle = refGrad;
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy + 35, 90 * this.flameScale, 20 * this.flameScale, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 2. Volumetric Glow (Warm Halo)
    if (this.flameScale > 0.05) {
      const haloGrad = this.ctx.createRadialGradient(cx, cy - 25, 10, cx, cy - 25, 180 * this.flameScale);
      haloGrad.addColorStop(0, 'rgba(255, 230, 150, 0.45)');
      haloGrad.addColorStop(0.3, 'rgba(255, 160, 40, 0.25)');
      haloGrad.addColorStop(0.7, 'rgba(255, 80, 20, 0.08)');
      haloGrad.addColorStop(1, 'transparent');

      this.ctx.fillStyle = haloGrad;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy - 25, 180 * this.flameScale, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 3. Earthen Clay Diya Body
    const lampW = Math.min(160, this.width * 0.4);
    const lampH = lampW * 0.42;

    // Outer clay shade
    this.ctx.fillStyle = '#8b3a12';
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy + lampH * 0.4, lampW * 0.5, lampH * 0.5, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Terracotta rim with warm lighting
    const rimGrad = this.ctx.createLinearGradient(cx - lampW * 0.5, cy, cx + lampW * 0.5, cy);
    rimGrad.addColorStop(0, '#5a2208');
    rimGrad.addColorStop(0.5, '#b45309');
    rimGrad.addColorStop(1, '#5a2208');

    this.ctx.fillStyle = rimGrad;
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy + lampH * 0.2, lampW * 0.46, lampH * 0.28, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Golden oil surface
    const oilGrad = this.ctx.createRadialGradient(cx, cy + lampH * 0.2, 5, cx, cy + lampH * 0.2, lampW * 0.4);
    oilGrad.addColorStop(0, '#fef08a');
    oilGrad.addColorStop(0.6, '#d97706');
    oilGrad.addColorStop(1, '#78350f');

    this.ctx.fillStyle = oilGrad;
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy + lampH * 0.2, lampW * 0.4, lampH * 0.22, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Diya Wick (cotton)
    this.ctx.strokeStyle = '#1e1b18';
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy + lampH * 0.2);
    this.ctx.quadraticCurveTo(cx - 2, cy - 5, cx, cy - 12);
    this.ctx.stroke();

    // 4. Procedural Multilayered Flame
    if (this.flameScale > 0.05) {
      const flameH = 65 * this.flameScale;
      const flameW = 24 * this.flameScale;
      const flameTipX = cx + this.turbulence * 0.7 - tiltX * 8;
      const flameTipY = cy - 12 - flameH;

      // Outer Flame (Red/Amber)
      const outerGrad = this.ctx.createRadialGradient(cx, cy - 25, 4, cx, cy - 25, flameH);
      outerGrad.addColorStop(0, 'rgba(255, 255, 200, 0.95)');
      outerGrad.addColorStop(0.25, 'rgba(255, 180, 40, 0.9)');
      outerGrad.addColorStop(0.65, 'rgba(255, 70, 10, 0.7)');
      outerGrad.addColorStop(1, 'transparent');

      this.ctx.fillStyle = outerGrad;
      this.ctx.beginPath();
      this.ctx.moveTo(cx - flameW, cy - 10);
      this.ctx.quadraticCurveTo(cx - flameW * 1.2, cy - 10 - flameH * 0.4, flameTipX, flameTipY);
      this.ctx.quadraticCurveTo(cx + flameW * 1.2, cy - 10 - flameH * 0.4, cx + flameW, cy - 10);
      this.ctx.closePath();
      this.ctx.fill();

      // Inner Core Flame (Luminous Blue & White)
      const innerH = flameH * 0.55;
      const innerW = flameW * 0.45;
      const innerGrad = this.ctx.createLinearGradient(cx, cy - 10, cx, cy - 10 - innerH);
      innerGrad.addColorStop(0, '#60a5fa');
      innerGrad.addColorStop(0.3, '#ffffff');
      innerGrad.addColorStop(1, '#ffedd5');

      this.ctx.fillStyle = innerGrad;
      this.ctx.beginPath();
      this.ctx.moveTo(cx - innerW, cy - 10);
      this.ctx.quadraticCurveTo(cx - innerW * 1.1, cy - 10 - innerH * 0.5, cx + this.turbulence * 0.3, cy - 10 - innerH);
      this.ctx.quadraticCurveTo(cx + innerW * 1.1, cy - 10 - innerH * 0.5, cx + innerW, cy - 10);
      this.ctx.closePath();
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  loop() {
    this.update();
    this.draw();
  }
}
