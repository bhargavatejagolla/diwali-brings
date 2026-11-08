/**
 * Starfield & Constellation Engine
 * Manages cosmic background ambiance, floating fireflies, and coordinates
 * celestial stars to form the constellation of "Dharji Shravya".
 */

import { audioSynth } from './audio-synth.js';
import { tilt } from '../interactions/tilt.js';

export class StarfieldEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.fireflies = [];
    this.constellationStars = [];
    this.constellationActive = false;
    this.constellationProgress = 0;
    this.mandalaAngle = 0;
    this.resize();

    window.addEventListener('resize', () => {
      this.resize();
      if (this.constellationActive) {
        this.generateConstellationTargets();
      }
    });

    this.initBackgroundStars();
    this.initFireflies();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  initBackgroundStars() {
    this.stars = [];
    const count = Math.min(180, Math.floor((this.width * this.height) / 5000));
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.7 + 0.2,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        depth: Math.random() * 0.5 + 0.2
      });
    }
  }

  initFireflies() {
    this.fireflies = [];
    const count = 35;
    for (let i = 0; i < count; i++) {
      this.fireflies.push({
        x: Math.random() * this.width,
        y: this.height * 0.4 + Math.random() * (this.height * 0.6),
        vx: (Math.random() - 0.5) * 0.6,
        vy: -0.2 - Math.random() * 0.4,
        size: Math.random() * 2.2 + 1,
        glow: Math.random() * 0.8 + 0.2,
        pulseSpeed: Math.random() * 0.04 + 0.02,
        t: Math.random() * 100
      });
    }
  }

  // Convert "Dharji Shravya" into letter coordinate targets
  generateConstellationTargets() {
    this.constellationStars = [];

    // Define pixel grid coordinates for "DHARJI" (line 1) and "SHRAVYA" (line 2)
    const line1 = "DHARJI";
    const line2 = "SHRAVYA";

    const isMobile = this.width < 600;
    const scale = isMobile ? Math.min(this.width / 380, 1) : Math.min(this.width / 800, 1.4);
    const letterWidth = 36 * scale;
    const letterHeight = 52 * scale;
    const spacing = 14 * scale;

    // Helper to get normalized dot points for each letter
    const getLetterPoints = (char) => {
      // 3x5 matrix representation for each character
      const map = {
        'D': [[0,0],[0,1],[0,2],[0,3],[0,4],[1,0],[1,4],[2,1],[2,2],[2,3]],
        'H': [[0,0],[0,1],[0,2],[0,3],[0,4],[2,0],[2,1],[2,2],[2,3],[2,4],[1,2]],
        'A': [[1,0],[0,1],[2,1],[0,2],[1,2],[2,2],[0,3],[2,3],[0,4],[2,4]],
        'R': [[0,0],[0,1],[0,2],[0,3],[0,4],[1,0],[2,1],[1,2],[2,3],[2,4]],
        'J': [[2,0],[2,1],[2,2],[2,3],[1,4],[0,3]],
        'I': [[0,0],[1,0],[2,0],[1,1],[1,2],[1,3],[0,4],[1,4],[2,4]],
        'S': [[2,0],[1,0],[0,1],[1,2],[2,3],[1,4],[0,4]],
        'V': [[0,0],[0,1],[0,2],[1,3],[2,2],[2,1],[2,0],[1,4]],
        'Y': [[0,0],[2,0],[0,1],[2,1],[1,2],[1,3],[1,4]]
      };
      return map[char] || [[1,1]];
    };

    const buildLine = (text, startY) => {
      const totalWidth = text.length * letterWidth + (text.length - 1) * spacing;
      let startX = (this.width - totalWidth) / 2;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const points = getLetterPoints(char);
        const lX = startX + i * (letterWidth + spacing);

        points.forEach(([px, py]) => {
          const targetX = lX + (px / 2) * letterWidth;
          const targetY = startY + (py / 4) * letterHeight;

          this.constellationStars.push({
            currentX: Math.random() * this.width,
            currentY: Math.random() * this.height,
            targetX,
            targetY,
            size: Math.random() * 2 + 2,
            alpha: 0,
            targetAlpha: 0.95,
            settled: false,
            sparkle: Math.random() * 10
          });
        });
      }
    };

    const centerY = this.height * 0.44;
    const lineSpacing = isMobile ? 65 * scale : 75 * scale;
    buildLine(line1, centerY - lineSpacing);
    buildLine(line2, centerY + 10);
  }

  activateConstellation() {
    this.constellationActive = true;
    this.generateConstellationTargets();
    audioSynth.playStarlightChime(659.25); // E5
  }

  update() {
    // Background stars twinkle
    for (const s of this.stars) {
      s.alpha += Math.sin(Date.now() * s.twinkleSpeed) * 0.008;
      if (s.alpha > 0.9) s.alpha = 0.9;
      if (s.alpha < 0.2) s.alpha = 0.2;
    }

    // Fireflies float
    for (const f of this.fireflies) {
      f.t += 0.02;
      f.x += f.vx + Math.sin(f.t) * 0.3;
      f.y += f.vy;
      f.glow = 0.4 + Math.sin(f.t * 2) * 0.4;

      if (f.y < -20) {
        f.y = this.height + 10;
        f.x = Math.random() * this.width;
      }
    }

    // Constellation convergence
    if (this.constellationActive) {
      this.mandalaAngle += 0.002;
      let allSettled = true;

      for (const cs of this.constellationStars) {
        const dx = cs.targetX - cs.currentX;
        const dy = cs.targetY - cs.currentY;
        cs.currentX += dx * 0.07;
        cs.currentY += dy * 0.07;

        if (cs.alpha < cs.targetAlpha) {
          cs.alpha += 0.025;
        }

        if (Math.hypot(dx, dy) > 2) {
          allSettled = false;
        } else if (!cs.settled) {
          cs.settled = true;
        }
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    const { x: tiltX, y: tiltY } = tilt.getValues();

    // 1. Draw Background Stars with Parallax
    for (const s of this.stars) {
      const px = s.x + tiltX * s.depth * 25;
      const py = s.y + tiltY * s.depth * 25;
      this.ctx.fillStyle = `rgba(255, 245, 220, ${s.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(px, py, s.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 2. Draw Subtle Sacred Mandala Behind Constellation
    if (this.constellationActive) {
      this.ctx.save();
      const centerX = this.width / 2 + tiltX * 10;
      const centerY = this.height * 0.44 + tiltY * 10;
      const radius = Math.min(this.width, this.height) * 0.35;

      this.ctx.translate(centerX, centerY);
      this.ctx.rotate(this.mandalaAngle);
      this.ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)';
      this.ctx.lineWidth = 1.2;

      for (let i = 0; i < 12; i++) {
        this.ctx.rotate((Math.PI * 2) / 12);
        this.ctx.beginPath();
        this.ctx.arc(0, radius * 0.4, radius * 0.25, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 3. Draw Fireflies
    for (const f of this.fireflies) {
      const px = f.x + tiltX * 18;
      const py = f.y + tiltY * 18;
      
      const grad = this.ctx.createRadialGradient(px, py, 0, px, py, f.size * 4);
      grad.addColorStop(0, `rgba(255, 230, 120, ${f.glow})`);
      grad.addColorStop(0.5, `rgba(255, 180, 50, ${f.glow * 0.4})`);
      grad.addColorStop(1, 'rgba(255, 180, 50, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(px, py, f.size * 4, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(px, py, f.size * 0.6, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 4. Draw Constellation Stars & Filament Lines
    if (this.constellationActive && this.constellationStars.length > 0) {
      // Connect nearby stars with thin golden filaments
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.28)';
      this.ctx.lineWidth = 1;

      for (let i = 0; i < this.constellationStars.length; i++) {
        const s1 = this.constellationStars[i];
        for (let j = i + 1; j < this.constellationStars.length; j++) {
          const s2 = this.constellationStars[j];
          const dist = Math.hypot(s1.currentX - s2.currentX, s1.currentY - s2.currentY);
          if (dist < 26) {
            this.ctx.beginPath();
            this.ctx.moveTo(s1.currentX + tiltX * 8, s1.currentY + tiltY * 8);
            this.ctx.lineTo(s2.currentX + tiltX * 8, s2.currentY + tiltY * 8);
            this.ctx.stroke();
          }
        }
      }

      // Draw Star Nodes with Bloom
      for (const cs of this.constellationStars) {
        const px = cs.currentX + tiltX * 8;
        const py = cs.currentY + tiltY * 8;

        this.ctx.fillStyle = '#fff4d0';
        this.ctx.shadowColor = '#ffd700';
        this.ctx.shadowBlur = 12;

        this.ctx.beginPath();
        this.ctx.arc(px, py, cs.size, 0, Math.PI * 2);
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
