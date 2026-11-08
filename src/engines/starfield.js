/**
 * Starfield & Constellation Engine (Luxury Cinematic Typography)
 * Uses high-resolution offscreen text rasterization to map exact typographical
 * curves for "DHARJI SHRAVYA", bringing hundreds of golden stardust embers to life.
 */

import { audioSynth } from './audio-synth.js';
import { tilt } from '../interactions/tilt.js';

export class StarfieldEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.fireflies = [];
    this.constellationParticles = [];
    this.constellationActive = false;
    this.constellationAlpha = 0;
    this.mandalaAngle = 0;
    this.lightSweepX = -500;
    this.resize();

    window.addEventListener('resize', () => {
      this.resize();
      if (this.constellationActive) {
        this.generateTypographicConstellation();
      }
    });

    this.initBackgroundStars();
    this.initAtmosphericEmbers();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  initBackgroundStars() {
    this.stars = [];
    const count = Math.min(220, Math.floor((this.width * this.height) / 4500));
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.5 + 0.3,
        baseAlpha: Math.random() * 0.6 + 0.15,
        twinkleSpeed: Math.random() * 0.02 + 0.008,
        depth: Math.random() * 0.4 + 0.1
      });
    }
  }

  initAtmosphericEmbers() {
    this.fireflies = [];
    const count = 40;
    for (let i = 0; i < count; i++) {
      this.fireflies.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.15 - Math.random() * 0.35,
        size: Math.random() * 2 + 0.8,
        glow: Math.random() * 0.7 + 0.2,
        t: Math.random() * 100
      });
    }
  }

  /**
   * High-Resolution Typographic Rasterizer:
   * Draws "DHARJI SHRAVYA" into an offscreen canvas with luxury serif styling,
   * samples pixel coordinates, and creates physical stardust attractors.
   */
  generateTypographicConstellation() {
    this.constellationParticles = [];
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    
    offCanvas.width = this.width;
    offCanvas.height = this.height;

    const isMobile = this.width < 768;
    const fontSize = isMobile ? Math.floor(this.width * 0.088) : Math.floor(Math.min(this.width * 0.055, 68));
    
    offCtx.fillStyle = '#ffffff';
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.font = `700 ${fontSize}px "Cinzel Decorative", "Playfair Display", Georgia, serif`;

    const centerY = this.height * 0.42;
    const lineGap = fontSize * 1.25;

    if (isMobile) {
      offCtx.fillText("DHARJI", this.width / 2, centerY - lineGap * 0.55);
      offCtx.fillText("SHRAVYA", this.width / 2, centerY + lineGap * 0.55);
    } else {
      offCtx.fillText("DHARJI  SHRAVYA", this.width / 2, centerY);
    }

    // Sample pixel data with step density
    const imgData = offCtx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;
    const step = isMobile ? 5 : 4; // High fidelity sampling

    for (let y = 0; y < this.height; y += step) {
      for (let x = 0; x < this.width; x += step) {
        const index = (y * this.width + x) * 4;
        if (data[index + 3] > 128) {
          // Point belongs to the typographic glyph
          this.constellationParticles.push({
            currentX: x + (Math.random() - 0.5) * this.width * 0.8,
            currentY: y + (Math.random() - 0.5) * this.height * 0.8,
            targetX: x,
            targetY: y,
            size: Math.random() * 1.6 + 0.8,
            alpha: 0,
            targetAlpha: Math.random() * 0.4 + 0.65,
            color: Math.random() > 0.25 ? '#f5d77f' : '#ffffff',
            spring: 0.045 + Math.random() * 0.02,
            friction: 0.88 + Math.random() * 0.04,
            vx: 0,
            vy: 0
          });
        }
      }
    }
  }

  activateConstellation() {
    this.constellationActive = true;
    this.lightSweepX = -this.width * 0.5;
    this.generateTypographicConstellation();
    audioSynth.playStarlightChime(659.25);
    setTimeout(() => audioSynth.playStarlightChime(880), 800);
  }

  update() {
    // 1. Background stars subtle scintillation
    for (const s of this.stars) {
      s.alpha = s.baseAlpha + Math.sin(Date.now() * s.twinkleSpeed) * 0.15;
    }

    // 2. Atmospheric golden embers
    for (const f of this.fireflies) {
      f.t += 0.015;
      f.x += f.vx + Math.sin(f.t) * 0.25;
      f.y += f.vy;
      f.glow = 0.35 + Math.sin(f.t * 2) * 0.35;

      if (f.y < -10) {
        f.y = this.height + 10;
        f.x = Math.random() * this.width;
      }
    }

    // 3. Typographic particle convergence with spring mechanics
    if (this.constellationActive) {
      this.mandalaAngle += 0.0015;
      this.lightSweepX += 4;
      if (this.lightSweepX > this.width * 1.5) {
        this.lightSweepX = -this.width * 0.8;
      }

      if (this.constellationAlpha < 1) {
        this.constellationAlpha += 0.018;
      }

      for (const p of this.constellationParticles) {
        const dx = p.targetX - p.currentX;
        const dy = p.targetY - p.currentY;

        p.vx = (p.vx + dx * p.spring) * p.friction;
        p.vy = (p.vy + dy * p.spring) * p.friction;

        p.currentX += p.vx;
        p.currentY += p.vy;

        if (p.alpha < p.targetAlpha) {
          p.alpha += 0.02;
        }
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    const { x: tiltX, y: tiltY } = tilt.getValues();

    // 1. Draw Deep Space Background Stars with 3D Depth
    for (const s of this.stars) {
      const px = s.x + tiltX * s.depth * 25;
      const py = s.y + tiltY * s.depth * 25;
      this.ctx.fillStyle = `rgba(255, 245, 230, ${Math.max(0.05, Math.min(1, s.alpha))})`;
      this.ctx.beginPath();
      this.ctx.arc(px, py, s.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 2. Draw Luxury Golden Geometric Mandala Behind Name
    if (this.constellationActive && this.constellationAlpha > 0.1) {
      this.ctx.save();
      const centerX = this.width / 2 + tiltX * 10;
      const centerY = this.height * 0.42 + tiltY * 10;
      const radius = Math.min(this.width, this.height) * 0.36;

      this.ctx.translate(centerX, centerY);
      this.ctx.rotate(this.mandalaAngle);
      this.ctx.strokeStyle = `rgba(212, 175, 55, ${0.1 * this.constellationAlpha})`;
      this.ctx.lineWidth = 1;

      // Sacred 16-point geometric petals
      for (let i = 0; i < 16; i++) {
        this.ctx.rotate((Math.PI * 2) / 16);
        this.ctx.beginPath();
        this.ctx.arc(0, radius * 0.45, radius * 0.28, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius * 0.95, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 3. Draw Atmospheric Embers
    for (const f of this.fireflies) {
      const px = f.x + tiltX * 18;
      const py = f.y + tiltY * 18;

      const grad = this.ctx.createRadialGradient(px, py, 0, px, py, f.size * 3.5);
      grad.addColorStop(0, `rgba(255, 230, 140, ${f.glow})`);
      grad.addColorStop(0.5, `rgba(255, 170, 40, ${f.glow * 0.35})`);
      grad.addColorStop(1, 'transparent');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(px, py, f.size * 3.5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 4. Draw Typography Particles with Golden Light Shimmer
    if (this.constellationActive && this.constellationParticles.length > 0) {
      this.ctx.save();
      this.ctx.globalCompositeOperation = 'lighter';

      for (const p of this.constellationParticles) {
        const px = p.currentX + tiltX * 8;
        const py = p.currentY + tiltY * 8;

        // Light sweep highlight
        const distFromSweep = Math.abs(px - this.lightSweepX);
        const sweepBonus = distFromSweep < 100 ? (1 - distFromSweep / 100) * 0.5 : 0;
        const alpha = Math.min(1, (p.alpha + sweepBonus) * this.constellationAlpha);

        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = alpha;
        this.ctx.shadowColor = '#d4af37';
        this.ctx.shadowBlur = 6;

        this.ctx.beginPath();
        this.ctx.arc(px, py, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}
