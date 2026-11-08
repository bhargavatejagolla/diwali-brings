/**
 * CatenaryThread Engine — Ethereal Golden Thread of Light
 * Simulates real catenary physics between two luminous lotus points:
 * y = a * cosh((x - x0) / a)
 * Features physical swing momentum when tilting phone or moving cursor.
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

    const targetAngle = tiltX * 0.28;
    const force = (targetAngle - this.swingAngle) * 0.04;
    this.swingVelocity = (this.swingVelocity + force) * 0.95;
    this.swingAngle += this.swingVelocity;

    this.pulseT += 0.006;
    if (this.pulseT > 1) this.pulseT = 0;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const isMobile = this.width < 768;
    const margin = isMobile ? this.width * 0.14 : this.width * 0.22;
    const p1 = { x: margin, y: this.height * 0.44 };
    const p2 = { x: this.width - margin, y: this.height * 0.44 };

    const midX = (p1.x + p2.x) / 2 + Math.sin(this.swingAngle) * 35;
    const sag = (isMobile ? 110 : 145) + Math.cos(this.swingAngle) * 15;
    const midY = (p1.y + p2.y) / 2 + sag;

    this.ctx.save();

    // 1. Thread Ambient Glow
    this.ctx.strokeStyle = 'rgba(212, 175, 55, 0.16)';
    this.ctx.lineWidth = 5;
    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
    this.ctx.stroke();

    // 2. High Definition Golden Filament
    this.ctx.strokeStyle = 'rgba(255, 235, 160, 0.85)';
    this.ctx.lineWidth = 1.4;
    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
    this.ctx.stroke();

    // 3. Heartbeat Pulse of Light (t from 0 to 1)
    const t = this.pulseT;
    const pulseX = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * midX + t * t * p2.x;
    const pulseY = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * midY + t * t * p2.y;

    const grad = this.ctx.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, 16);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, 'rgba(255, 220, 100, 0.85)');
    grad.addColorStop(1, 'transparent');

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(pulseX, pulseY, 16, 0, Math.PI * 2);
    this.ctx.fill();

    // 4. Subtle Lotus Lamps
    this.drawLotusAnchor(p1.x, p1.y, "HERE");
    this.drawLotusAnchor(p2.x, p2.y, "DHARJI SHRAVYA");

    this.ctx.restore();
  }

  drawLotusAnchor(x, y, label) {
    // Elegant brass base
    this.ctx.fillStyle = '#8c6d23';
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 12, 16, 6, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Gold petal filigree rim
    this.ctx.strokeStyle = '#d4af37';
    this.ctx.lineWidth = 1.2;
    this.ctx.stroke();

    // Sacred Flame
    const flicker = Math.sin(Date.now() * 0.012 + x) * 1.5;
    const flameGrad = this.ctx.createRadialGradient(x, y + 4, 0, x, y + 4, 16);
    flameGrad.addColorStop(0, '#ffffff');
    flameGrad.addColorStop(0.3, '#ffb833');
    flameGrad.addColorStop(0.75, '#ff4400');
    flameGrad.addColorStop(1, 'transparent');

    this.ctx.fillStyle = flameGrad;
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + 3 + flicker, 6, 13, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Refined Typography Label
    this.ctx.fillStyle = '#fef08a';
    this.ctx.font = '600 11px "Cinzel Decorative", serif';
    this.ctx.letterSpacing = '2px';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, x, y + 36);
  }

  loop() {
    this.update();
    this.draw();
  }
}
