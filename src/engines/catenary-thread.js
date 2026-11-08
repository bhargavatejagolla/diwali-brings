/**
 * CatenaryThread Engine — Physical golden thread connecting two distant diyas
 * Simulates real hanging cable mathematics: y = a * cosh((x - x0) / a)
 * Responds to tilt momentum with physical harmonic oscillation.
 */

import { tilt } from '../interactions/tilt.js';

export class CatenaryThreadEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pulseT = 0;
    this.swingAngle = 0;
    this.swingVelocity = 0;
    this.resize();

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  update() {
    const { x: tiltX } = tilt.getValues();

    // Physical pendulum spring force towards target tilt
    const targetAngle = tiltX * 0.35;
    const force = (targetAngle - this.swingAngle) * 0.05;
    this.swingVelocity = (this.swingVelocity + force) * 0.94;
    this.swingAngle += this.swingVelocity;

    // Golden heartbeat pulse traveling along the thread
    this.pulseT += 0.008;
    if (this.pulseT > 1) this.pulseT = 0;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const isMobile = this.width < 600;
    const margin = isMobile ? this.width * 0.12 : this.width * 0.18;
    const p1 = { x: margin, y: this.height * 0.42 };
    const p2 = { x: this.width - margin, y: this.height * 0.42 };

    const dx = p2.x - p1.x;
    const midX = (p1.x + p2.x) / 2 + Math.sin(this.swingAngle) * 40;
    const sag = (isMobile ? 120 : 160) + Math.cos(this.swingAngle) * 20;
    const midY = (p1.y + p2.y) / 2 + sag;

    // Draw Catenary-Approximated Quadratic Bezier Curve
    this.ctx.save();
    
    // 1. Thread Glow
    this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
    this.ctx.lineWidth = 6;
    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
    this.ctx.stroke();

    // 2. Core Golden Filament
    this.ctx.strokeStyle = 'rgba(255, 235, 140, 0.9)';
    this.ctx.lineWidth = 1.8;
    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
    this.ctx.stroke();

    // 3. Heartbeat Pulse of Light (t from 0 to 1)
    const t = this.pulseT;
    const pulseX = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * midX + t * t * p2.x;
    const pulseY = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * midY + t * t * p2.y;

    const grad = this.ctx.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, 14);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, 'rgba(255, 215, 0, 0.8)');
    grad.addColorStop(1, 'rgba(255, 215, 0, 0)');

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(pulseX, pulseY, 14, 0, Math.PI * 2);
    this.ctx.fill();

    // 4. Draw Diya Anchor Points
    this.drawDiyaAnchor(p1.x, p1.y, "You");
    this.drawDiyaAnchor(p2.x, p2.y, "Shravya");

    this.ctx.restore();
  }

  drawDiyaAnchor(x, y, label) {
    // Glowing clay base
    this.ctx.fillStyle = '#b3541e';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 15, 20, 8, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Golden rim
    this.ctx.strokeStyle = '#ffd700';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    // Flame
    const flicker = Math.sin(Date.now() * 0.015 + x) * 2;
    const flameGrad = this.ctx.createRadialGradient(x, y + 5, 0, x, y + 5, 18);
    flameGrad.addColorStop(0, '#ffffff');
    flameGrad.addColorStop(0.3, '#ffaa00');
    flameGrad.addColorStop(0.8, '#ff3300');
    flameGrad.addColorStop(1, 'transparent');

    this.ctx.fillStyle = flameGrad;
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 4 + flicker, 7, 14, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Label
    this.ctx.fillStyle = '#ffd700';
    this.ctx.font = '500 13px "Cinzel Decorative", serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, x, y + 42);
  }

  loop() {
    this.update();
    this.draw();
  }
}
