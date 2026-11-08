/**
 * WorldEngine — Unified High-Performance Visual Engine
 * Single Canvas, Single 60/120 FPS Loop, Zero Compositing Overhead.
 * Features: True Night Sky, Star Scintillation, Shooting Stars,
 * Water Ripple Physics, Glowing Rangoli, Floating Lanterns, and Jewel Fireworks.
 */

import { audioSynth } from './audio-synth.js';
import { haptics } from '../interactions/haptics.js';
import { tilt } from '../interactions/tilt.js';

export class WorldEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false }); // High performance opaque canvas
    this.currentScene = 1;
    this.time = 0;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;

    // Background Sky & Stars
    this.stars = [];
    this.shootingStars = [];
    this.fireflies = [];

    // Scene 1: Water & Floating Lotus Diya
    this.ripples = [];
    this.diyaFlameFlicker = 0;

    // Scene 2: Glowing Rangoli
    this.rangoliProgress = 0;
    this.rangoliRotation = 0;
    this.onRingComplete = null;
    this.currentRangoliWish = 0;

    // Scene 3: Garden Lanterns & Marigold Petals
    this.lanterns = [];
    this.petals = [];

    // Scene 5: Fireworks
    this.rockets = [];
    this.particles = [];
    this.smoke = [];
    this.screenFlash = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.initSkyStars();
    this.initGardenElements();
    this.bindInteractions();
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for mobile efficiency
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(this.dpr, this.dpr);

    if (this.stars.length === 0) {
      this.initSkyStars();
    }
  }

  initSkyStars() {
    this.stars = [];
    // Number of stars scaled to viewport
    const count = Math.min(180, Math.floor((this.width * this.height) / 5000));
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.6 + 0.4,
        alpha: Math.random() * 0.7 + 0.2,
        twinkleSpeed: Math.random() * 0.03 + 0.008,
        color: Math.random() > 0.3 ? '#fff5db' : (Math.random() > 0.5 ? '#dbeafe' : '#fef08a'),
        depth: Math.random() * 0.5 + 0.1
      });
    }

    // Atmospheric stardust/fireflies
    this.fireflies = [];
    for (let i = 0; i < 28; i++) {
      this.fireflies.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.3,
        size: Math.random() * 2 + 1,
        glow: Math.random(),
        t: Math.random() * 100
      });
    }
  }

  initGardenElements() {
    this.lanterns = [];
    for (let i = 0; i < 14; i++) {
      this.lanterns.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vy: -0.25 - Math.random() * 0.35,
        size: Math.random() * 10 + 12,
        hue: Math.random() > 0.5 ? '#e6b94f' : '#d84c87',
        flicker: Math.random() * 10,
        depth: Math.random() * 0.5 + 0.3
      });
    }

    this.petals = [];
    for (let i = 0; i < 22; i++) {
      this.petals.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 0.35 + Math.random() * 0.5,
        size: Math.random() * 5 + 4,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.03,
        color: Math.random() > 0.5 ? '#f59e0b' : '#ea580c'
      });
    }
  }

  bindInteractions() {
    // Water Ripples on Scene 1
    window.addEventListener('pointerdown', (e) => {
      if (this.currentScene === 1) {
        this.addRipple(e.clientX, e.clientY);
      } else if (this.currentScene === 5 && !e.target.closest('button') && !e.target.closest('input')) {
        const themes = ['gold', 'teal', 'pink', 'violet'];
        const chosen = themes[Math.floor(Math.random() * themes.length)];
        this.launchFirework(e.clientX, e.clientY, chosen);
      }
    });

    let lastMoveTime = 0;
    window.addEventListener('pointermove', (e) => {
      const now = performance.now();
      if (this.currentScene === 1 && now - lastMoveTime > 120) {
        lastMoveTime = now;
        this.addRipple(e.clientX, e.clientY, 0.35);
      }
    });
  }

  addRipple(x, y, alpha = 0.55) {
    if (this.ripples.length < 12) {
      this.ripples.push({
        x: x || this.width / 2,
        y: y || this.height * 0.62,
        r: 4,
        maxR: Math.min(this.width, this.height) * 0.45,
        alpha,
        speed: 2.0
      });
    }
  }

  setScene(scene) {
    this.currentScene = scene;
    if (scene === 2) {
      this.rangoliProgress = 0;
      this.currentRangoliWish = 0;
    }
  }

  // Launch a Firework in Scene 5
  launchFirework(targetX, targetY, theme = 'gold') {
    const startX = this.width * 0.25 + Math.random() * (this.width * 0.5);
    const startY = this.height + 20;

    const angle = Math.atan2(targetY - startY, targetX - startX);
    const dist = Math.hypot(targetX - startX, targetY - startY);
    const speed = dist / 38;

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

  explodeFirework(x, y, theme = 'gold') {
    this.screenFlash = 0.28;
    audioSynth.playFireworkBurst('large');
    haptics.fireworkBurst('large');

    const palettes = {
      gold: ['#e6b94f', '#fef08a', '#ffffff', '#ffd700'],
      teal: ['#087e83', '#38bdf8', '#a7f3d0', '#ffffff'],
      pink: ['#d84c87', '#f472b6', '#fda4af', '#ffffff'],
      violet: ['#5a267f', '#a855f7', '#e9d5ff', '#ffffff']
    };
    const colors = palettes[theme] || palettes.gold;
    const count = 160; // Optimized count for buttery 60fps

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6.5 + 1.0;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.009 + Math.random() * 0.006,
        gravity: 0.06,
        drag: 0.965,
        size: Math.random() * 2 + 1.2
      });
    }

    // Atmospheric illuminated smoke
    for (let s = 0; s < 3; s++) {
      this.smoke.push({
        x: x + (Math.random() - 0.5) * 15,
        y: y + (Math.random() - 0.5) * 15,
        size: 18 + Math.random() * 20,
        alpha: 0.18,
        growth: 0.3,
        decay: 0.006
      });
    }
  }

  update() {
    this.time += 0.02;
    const { x: tiltX, y: tiltY } = tilt.getValues();

    // 1. Shooting Star Spawner (Real Sky Magic)
    if (Math.random() > 0.992 && this.shootingStars.length < 2) {
      this.shootingStars.push({
        x: Math.random() * this.width * 0.8,
        y: Math.random() * this.height * 0.4,
        length: Math.random() * 80 + 60,
        speed: Math.random() * 12 + 10,
        alpha: 1,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2
      });
    }

    // Update Shooting Stars
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const ss = this.shootingStars[i];
      ss.x += Math.cos(ss.angle) * ss.speed;
      ss.y += Math.sin(ss.angle) * ss.speed;
      ss.alpha -= 0.025;
      if (ss.alpha <= 0 || ss.x > this.width || ss.y > this.height) {
        this.shootingStars.splice(i, 1);
      }
    }

    // 2. Fireflies Update
    for (const f of this.fireflies) {
      f.t += 0.015;
      f.x += f.vx + Math.sin(f.t) * 0.25;
      f.y += f.vy;
      f.glow = 0.3 + Math.sin(f.t * 2) * 0.3;
      if (f.y < -10) {
        f.y = this.height + 10;
        f.x = Math.random() * this.width;
      }
    }

    // 3. Scene 1 Water Ripples Update
    if (this.currentScene === 1) {
      this.diyaFlameFlicker = Math.sin(this.time * 6) * 1.8 + Math.cos(this.time * 9) * 1.2;
      if (Math.random() > 0.985 && this.ripples.length < 6) {
        this.addRipple(this.width / 2, this.height * 0.62, 0.4);
      }
      for (let i = this.ripples.length - 1; i >= 0; i--) {
        const r = this.ripples[i];
        r.r += r.speed;
        r.alpha -= 0.0055;
        if (r.alpha <= 0 || r.r >= r.maxR) {
          this.ripples.splice(i, 1);
        }
      }
    }

    // 4. Scene 2 Rangoli Drawing Update
    if (this.currentScene === 2) {
      this.rangoliRotation += 0.0012;
      if (this.rangoliProgress < 1) {
        this.rangoliProgress += 0.0045;
        const wishIdx = Math.min(4, Math.floor(this.rangoliProgress * 5));
        if (wishIdx !== this.currentRangoliWish) {
          this.currentRangoliWish = wishIdx;
          if (this.onRingComplete) this.onRingComplete(wishIdx);
        }
      }
    }

    // 5. Scene 3 Garden Lanterns & Petals Update
    if (this.currentScene === 3) {
      for (const l of this.lanterns) {
        l.y += l.vy;
        l.x += Math.sin(Date.now() * 0.001 + l.flicker) * 0.3;
        if (l.y < -25) {
          l.y = this.height + 20;
          l.x = Math.random() * this.width;
        }
      }
      for (const p of this.petals) {
        p.y += p.vy;
        p.x += p.vx + Math.sin(Date.now() * 0.002 + p.y * 0.01) * 0.4;
        p.rot += p.vRot;
        if (p.y > this.height + 15) {
          p.y = -10;
          p.x = Math.random() * this.width;
        }
      }
    }

    // 6. Scene 5 Fireworks Update
    if (this.currentScene === 5) {
      // Rockets
      for (let i = this.rockets.length - 1; i >= 0; i--) {
        const r = this.rockets[i];
        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.035;

        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 7) r.trail.shift();

        const dist = Math.hypot(r.targetX - r.x, r.targetY - r.y);
        if (dist < 18 || r.y <= r.targetY) {
          this.explodeFirework(r.targetX, r.targetY, r.theme);
          this.rockets.splice(i, 1);
        }
      }

      // Particles
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

      // Smoke
      for (let i = this.smoke.length - 1; i >= 0; i--) {
        const s = this.smoke[i];
        s.size += s.growth;
        s.alpha -= s.decay;
        s.y -= 0.1;
        if (s.alpha <= 0) {
          this.smoke.splice(i, 1);
        }
      }

      // Screen Flash
      if (this.screenFlash > 0) {
        this.screenFlash -= 0.025;
        if (this.screenFlash < 0) this.screenFlash = 0;
      }
    }
  }

  draw() {
    const { x: tiltX, y: tiltY } = tilt.getValues();

    // 1. High-Performance Deep Night Sky Background
    const bgGrad = this.ctx.createRadialGradient(
      this.width * 0.5 + tiltX * 20,
      this.height * 0.35 + tiltY * 20,
      10,
      this.width * 0.5,
      this.height * 0.4,
      Math.max(this.width, this.height) * 0.8
    );
    bgGrad.addColorStop(0, '#151a3d');  // Deep celestial indigo
    bgGrad.addColorStop(0.55, '#0c1028'); // Nocturnal velvet
    bgGrad.addColorStop(1, '#050713');   // Obsidian horizon

    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 2. Realistic Twinkling Stars (Parallax Layer)
    for (const s of this.stars) {
      const px = s.x + tiltX * s.depth * 25;
      const py = s.y + tiltY * s.depth * 25;
      const alpha = s.alpha + Math.sin(Date.now() * s.twinkleSpeed) * 0.2;

      this.ctx.fillStyle = s.color;
      this.ctx.globalAlpha = Math.max(0.1, Math.min(1, alpha));
      this.ctx.beginPath();
      this.ctx.arc(px, py, s.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;

    // 3. Realistic Shooting Stars
    if (this.shootingStars.length > 0) {
      this.ctx.save();
      for (const ss of this.shootingStars) {
        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;
        const ssGrad = this.ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        ssGrad.addColorStop(0, 'transparent');
        ssGrad.addColorStop(1, `rgba(255, 240, 214, ${ss.alpha})`);

        this.ctx.strokeStyle = ssGrad;
        this.ctx.lineWidth = 1.6;
        this.ctx.beginPath();
        this.ctx.moveTo(tailX, tailY);
        this.ctx.lineTo(ss.x, ss.y);
        this.ctx.stroke();
      }
      this.ctx.restore();
    }

    // 4. Fireflies / Stardust Motes
    for (const f of this.fireflies) {
      const px = f.x + tiltX * 16;
      const py = f.y + tiltY * 16;
      const fGrad = this.ctx.createRadialGradient(px, py, 0, px, py, f.size * 3);
      fGrad.addColorStop(0, `rgba(230, 185, 79, ${f.glow * 0.8})`);
      fGrad.addColorStop(1, 'transparent');

      this.ctx.fillStyle = fGrad;
      this.ctx.beginPath();
      this.ctx.arc(px, py, f.size * 3, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // ----------------------------------------------------
    // SCENE-SPECIFIC RENDERING
    // ----------------------------------------------------

    // SCENE 1: Moonlit Lotus Pond & Diya
    if (this.currentScene === 1) {
      this.drawScene1WaterPond(tiltX, tiltY);
    }

    // SCENE 2: The Rangoli of Wishes
    else if (this.currentScene === 2) {
      this.drawScene2Rangoli();
    }

    // SCENE 3: A Garden of Light (Dharji Shravya)
    else if (this.currentScene === 3) {
      this.drawScene3Garden(tiltX, tiltY);
    }

    // SCENE 5: A Sky Full of Wishes (Fireworks)
    else if (this.currentScene === 5) {
      this.drawScene5Fireworks();
    }
  }

  drawScene1WaterPond(tiltX, tiltY) {
    const cx = this.width / 2;
    const cy = this.height * 0.62;

    // Water Surface Gradient
    const waterGrad = this.ctx.createLinearGradient(0, this.height * 0.45, 0, this.height);
    waterGrad.addColorStop(0, '#0a0d24');
    waterGrad.addColorStop(0.5, '#07162c');
    waterGrad.addColorStop(1, '#050a18');
    this.ctx.fillStyle = waterGrad;
    this.ctx.fillRect(0, this.height * 0.45, this.width, this.height * 0.55);

    // Water Ripples
    for (const r of this.ripples) {
      this.ctx.strokeStyle = `rgba(8, 126, 131, ${r.alpha * 0.45})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.ellipse(r.x, r.y, r.r, r.r * 0.35, 0, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.strokeStyle = `rgba(230, 185, 79, ${r.alpha * 0.25})`;
      this.ctx.lineWidth = 0.8;
      this.ctx.beginPath();
      this.ctx.ellipse(r.x, r.y, r.r * 0.82, r.r * 0.28, 0, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Diya Water Reflection
    const refGrad = this.ctx.createRadialGradient(cx, cy + 22, 5, cx, cy + 22, 50);
    refGrad.addColorStop(0, 'rgba(230, 185, 79, 0.4)');
    refGrad.addColorStop(0.5, 'rgba(216, 76, 135, 0.15)');
    refGrad.addColorStop(1, 'transparent');
    this.ctx.fillStyle = refGrad;
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy + 25, 45, 18, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Floating Lotus
    const petals = 12;
    const lotusR = Math.min(this.width * 0.14, 62);
    for (let i = 0; i < petals; i++) {
      const angle = (Math.PI * 2 * i) / petals + this.time * 0.04;
      const px = cx + Math.cos(angle) * (lotusR * 0.8);
      const py = cy + Math.sin(angle) * (lotusR * 0.34) + 6;

      const pGrad = this.ctx.createRadialGradient(px, py, 2, px, py, 22);
      pGrad.addColorStop(0, '#ffffff');
      pGrad.addColorStop(0.35, '#d84c87'); // Lotus Pink
      pGrad.addColorStop(1, '#5a267f');   // Royal Violet

      this.ctx.fillStyle = pGrad;
      this.ctx.beginPath();
      this.ctx.ellipse(px, py, 13, 20, angle + Math.PI / 2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Terracotta Diya
    this.ctx.fillStyle = '#7a3112';
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy + 6, 28, 12, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#b45309';
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy + 3, 24, 8, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Flame
    const flameH = 46;
    const flameW = 15;
    const tipX = cx + this.diyaFlameFlicker * 0.7;
    const tipY = cy - flameH;

    const aura = this.ctx.createRadialGradient(cx, cy - 12, 4, cx, cy - 12, 85);
    aura.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
    aura.addColorStop(0.5, 'rgba(216, 76, 135, 0.15)');
    aura.addColorStop(1, 'transparent');
    this.ctx.fillStyle = aura;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy - 12, 85, 0, Math.PI * 2);
    this.ctx.fill();

    const flameGrad = this.ctx.createRadialGradient(cx, cy - 8, 4, cx, cy - 8, flameH);
    flameGrad.addColorStop(0, '#fffbeb');
    flameGrad.addColorStop(0.3, '#f59e0b');
    flameGrad.addColorStop(0.75, '#dc2626');
    flameGrad.addColorStop(1, 'transparent');

    this.ctx.fillStyle = flameGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - flameW, cy);
    this.ctx.quadraticCurveTo(cx - flameW * 1.1, cy - flameH * 0.4, tipX, tipY);
    this.ctx.quadraticCurveTo(cx + flameW * 1.1, cy - flameH * 0.4, cx + flameW, cy);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawScene2Rangoli() {
    const cx = this.width / 2;
    const cy = this.height * 0.42;
    const maxR = Math.min(this.width, this.height) * 0.36;

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(this.rangoliRotation);

    // Ring 1: Core Gold
    if (this.rangoliProgress > 0.02) {
      const p1 = Math.min(1, this.rangoliProgress / 0.2);
      this.ctx.strokeStyle = '#e6b94f';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, maxR * 0.16 * p1, 0, Math.PI * 2 * p1);
      this.ctx.stroke();
    }

    // Ring 2: Peacock Teal
    if (this.rangoliProgress > 0.2) {
      const p2 = Math.min(1, (this.rangoliProgress - 0.2) / 0.2);
      this.ctx.strokeStyle = '#087e83';
      this.ctx.lineWidth = 1.8;
      const count = 16;
      for (let i = 0; i < count; i++) {
        if (i / count <= p2) {
          const a = (Math.PI * 2 * i) / count;
          const r = maxR * 0.35;
          this.ctx.beginPath();
          this.ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 14 * p2, 0, Math.PI * 2);
          this.ctx.stroke();
        }
      }
    }

    // Ring 3: Lotus Pink
    if (this.rangoliProgress > 0.4) {
      const p3 = Math.min(1, (this.rangoliProgress - 0.4) / 0.2);
      this.ctx.strokeStyle = '#d84c87';
      this.ctx.lineWidth = 2;
      const petals = 12;
      for (let i = 0; i < petals; i++) {
        if (i / petals <= p3) {
          const a = (Math.PI * 2 * i) / petals;
          const r = maxR * 0.58;
          this.ctx.fillStyle = 'rgba(216, 76, 135, 0.35)';
          this.ctx.beginPath();
          this.ctx.ellipse(Math.cos(a) * r, Math.sin(a) * r, 16, 34, a + Math.PI / 2, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();
        }
      }
    }

    // Ring 4: Royal Violet
    if (this.rangoliProgress > 0.6) {
      const p4 = Math.min(1, (this.rangoliProgress - 0.6) / 0.2);
      this.ctx.strokeStyle = '#5a267f';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, maxR * 0.78, 0, Math.PI * 2 * p4);
      this.ctx.stroke();
    }

    // Ring 5: Outer Gold Diyas
    if (this.rangoliProgress > 0.8) {
      const p5 = Math.min(1, (this.rangoliProgress - 0.8) / 0.2);
      this.ctx.fillStyle = '#e6b94f';
      const count = 16;
      for (let i = 0; i < count; i++) {
        if (i / count <= p5) {
          const a = (Math.PI * 2 * i) / count;
          const r = maxR * 0.94;
          this.ctx.beginPath();
          this.ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 4, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }

    this.ctx.restore();
  }

  drawScene3Garden(tiltX, tiltY) {
    // 1. Floating Paper Lanterns
    for (const l of this.lanterns) {
      const px = l.x + tiltX * l.depth * 25;
      const py = l.y + tiltY * l.depth * 25;

      const aura = this.ctx.createRadialGradient(px, py, 2, px, py, l.size * 2);
      aura.addColorStop(0, l.hue === '#e6b94f' ? 'rgba(230, 185, 79, 0.4)' : 'rgba(216, 76, 135, 0.35)');
      aura.addColorStop(1, 'transparent');
      this.ctx.fillStyle = aura;
      this.ctx.beginPath();
      this.ctx.arc(px, py, l.size * 2, 0, Math.PI * 2);
      this.ctx.fill();

      // Lantern body
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.beginPath();
      this.ctx.roundRect(px - l.size * 0.35, py - l.size * 0.45, l.size * 0.7, l.size * 0.9, 3);
      this.ctx.fill();
    }

    // 2. Marigold Petals
    for (const p of this.petals) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rot);
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  drawScene5Fireworks() {
    // Screen Bloom Flash
    if (this.screenFlash > 0) {
      this.ctx.fillStyle = `rgba(255, 240, 214, ${this.screenFlash})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Atmospheric Smoke
    for (const s of this.smoke) {
      this.ctx.fillStyle = `rgba(90, 38, 127, ${s.alpha * 0.2})`;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Rockets
    this.ctx.save();
    this.ctx.lineWidth = 2;
    for (const r of this.rockets) {
      for (let j = 0; j < r.trail.length - 1; j++) {
        const p1 = r.trail[j];
        const p2 = r.trail[j + 1];
        this.ctx.strokeStyle = `rgba(230, 185, 79, ${(j / r.trail.length) * 0.8})`;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
      }

      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();

    // Burst Particles with Light Blend
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}
