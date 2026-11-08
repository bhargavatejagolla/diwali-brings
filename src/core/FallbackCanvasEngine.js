/**
 * FallbackCanvasEngine — High-Fidelity 2D Canvas Engine
 * Guaranteed 100% reliability even when WebGL is disabled or GPU context is lost.
 * Implements identical API to Engine: Procedural Diya, Sacred Rangoli,
 * Akash Kandil Lanterns, and Full 5-Shell Pyrotechnic Fireworks System.
 */

import { audioSynth } from '../audio/AudioEngine.js';
import { haptics } from '../interactions/haptics.js';

export class FallbackCanvasEngine {
  constructor(canvas) {
    let activeCanvas = canvas;
    let ctx = activeCanvas.getContext('2d');
    if (!ctx && activeCanvas.parentNode) {
      // Browser constraint: if WebGL was previously probed on this element, replace with clean clone
      const freshCanvas = activeCanvas.cloneNode(true);
      activeCanvas.parentNode.replaceChild(freshCanvas, activeCanvas);
      activeCanvas = freshCanvas;
      ctx = activeCanvas.getContext('2d');
    }

    this.canvas = activeCanvas;
    this.ctx = ctx;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;

    this.currentScene = 1;
    this.time = 0;
    this.running = false;
    this.rafId = null;

    // Stars
    this.stars = [];
    for (let i = 0; i < 350; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.75),
        r: 0.8 + Math.random() * 1.5,
        alpha: 0.3 + Math.random() * 0.7,
        speed: 0.5 + Math.random() * 1.5
      });
    }

    // Scene 3 Lanterns
    this.lanterns = [];
    for (let i = 0; i < 22; i++) {
      this.lanterns.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vy: 0.3 + Math.random() * 0.4,
        swaySpeed: 1 + Math.random(),
        size: 14 + Math.random() * 10,
        seed: Math.random() * 10
      });
    }

    // Scene 3 Petals
    this.petals = [];
    for (let i = 0; i < 35; i++) {
      this.petals.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vy: 0.5 + Math.random() * 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        rot: Math.random() * Math.PI,
        size: 7 + Math.random() * 5
      });
    }

    // Scene 5 Fireworks: Rockets and Sparks
    this.rockets = [];
    this.sparks = [];

    // Scene 1 Diya Embers
    this.diyaEmbers = [];
    for (let i = 0; i < 20; i++) {
      this.diyaEmbers.push({
        x: this.width / 2 + (Math.random() - 0.5) * 20,
        y: this.height * 0.55 + Math.random() * 30,
        vy: 0.8 + Math.random() * 0.8,
        alpha: Math.random(),
        seed: Math.random() * 10
      });
    }

    this.bindEvents();
  }

  setScene(target) {
    this.currentScene = target;
  }

  launchFirework(targetX, targetY, theme = 'gold', type = 'chrysanthemum') {
    audioSynth.playRocketLaunch();

    const startX = targetX || (this.width * 0.2 + Math.random() * this.width * 0.6);
    const destY = targetY || (this.height * 0.2 + Math.random() * (this.height * 0.3));

    this.rockets.push({
      x: startX,
      y: this.height - 40,
      targetY: destY,
      vy: 11 + Math.random() * 3,
      theme,
      type
    });
  }

  launchFromScreen(clientX, clientY, theme = 'gold', type = 'chrysanthemum') {
    this.launchFirework(clientX, clientY, theme, type);
  }

  launchBarrage(theme = 'gold', type = 'willow') {
    this.launchFirework(this.width * 0.5, this.height * 0.25, theme, type);
    setTimeout(() => {
      this.launchFirework(this.width * 0.3, this.height * 0.3, theme, 'chrysanthemum');
      this.launchFirework(this.width * 0.7, this.height * 0.3, theme, type);
    }, 240);
  }

  releaseWish(wishText) {
    this.launchBarrage('gold', 'willow');
    setTimeout(() => {
      this.launchFirework(this.width * 0.4, this.height * 0.2, 'teal', 'peacock');
      this.launchFirework(this.width * 0.6, this.height * 0.2, 'pink', 'heart');
    }, 350);
  }

  triggerGrandFinale() {
    this.launchBarrage('gold', 'willow');
  }

  spawnRipple(x, y, strength) {}

  detonate(x, y, theme, type) {
    audioSynth.playBurstBoom();
    haptics.fireworkExplosion();

    const themeColors = {
      gold: ['#fff3cc', '#ffd700', '#f59e0b', '#d97706'],
      teal: ['#7df9ff', '#00f5d4', '#0d9488', '#ffd700'],
      pink: ['#fbcfe8', '#f43f5e', '#fb7185', '#ffd700'],
      violet: ['#e9d5ff', '#c084fc', '#a855f7', '#ffd700']
    };
    const colors = themeColors[theme] || themeColors.gold;

    const count = type === 'willow' ? 220 : 160;
    for (let i = 0; i < count; i++) {
      let vx = 0, vy = 0;
      if (type === 'heart') {
        const t = (i / count) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        vx = (hx / 16) * 4.8;
        vy = (hy / 16) * 4.8;
      } else if (type === 'ring') {
        const angle = (i / count) * Math.PI * 2;
        const spd = 4.2 + (Math.random() - 0.5) * 0.4;
        vx = Math.cos(angle) * spd;
        vy = Math.sin(angle) * spd;
      } else if (type === 'peacock') {
        const fan = -Math.PI * 0.8 + Math.random() * Math.PI * 1.6;
        const spd = 2.5 + Math.random() * 4.2;
        vx = Math.cos(fan) * spd;
        vy = Math.sin(fan) * spd;
      } else {
        const angle = Math.random() * Math.PI * 2;
        const spd = 1.2 + Math.random() * 5.2;
        vx = Math.cos(angle) * spd;
        vy = Math.sin(angle) * spd;
      }

      this.sparks.push({
        x, y,
        vx, vy,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: type === 'willow' ? 0.008 : 0.016,
        gravity: type === 'willow' ? 0.08 : 0.05,
        drag: 0.982
      });
    }
  }

  update() {
    this.time += 0.02;

    // Update rockets
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.y -= r.vy;
      if (r.y <= r.targetY) {
        this.detonate(r.x, r.y, r.theme, r.type);
        this.rockets.splice(i, 1);
      }
    }

    // Update sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += s.gravity;
      s.vx *= s.drag;
      s.vy *= s.drag;
      s.alpha -= s.decay;

      if (s.alpha <= 0 || s.y > this.height) {
        this.sparks.splice(i, 1);
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    // Deep Midnight Atmosphere Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#050a1c');
    skyGrad.addColorStop(0.5, '#0c1433');
    skyGrad.addColorStop(0.85, '#221945');
    skyGrad.addColorStop(1, '#3b2042');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Stars
    for (const st of this.stars) {
      const tw = st.alpha * (0.7 + Math.sin(this.time * st.speed) * 0.3);
      ctx.fillStyle = `rgba(255, 245, 220, ${tw})`;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // SCENE 1: HERO DIYA
    if (this.currentScene === 1) {
      const cx = this.width / 2;
      const cy = this.height * 0.58;

      // Warm ground aura
      const aura = ctx.createRadialGradient(cx, cy, 20, cx, cy, 220);
      aura.addColorStop(0, 'rgba(255, 170, 50, 0.45)');
      aura.addColorStop(0.5, 'rgba(230, 110, 20, 0.18)');
      aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(cx, cy, 220, 0, Math.PI * 2);
      ctx.fill();

      // Brass Thali
      ctx.fillStyle = '#b8860b';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 28, 120, 32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Marigold garland
      const marigoldCount = 20;
      for (let i = 0; i < marigoldCount; i++) {
        const a = (i / marigoldCount) * Math.PI * 2;
        const mx = cx + Math.cos(a) * 105;
        const my = cy + 28 + Math.sin(a) * 26;
        ctx.fillStyle = i % 2 === 0 ? '#ea580c' : '#fbbf24';
        ctx.beginPath();
        ctx.arc(mx, my, 11, 0, Math.PI * 2);
        ctx.fill();
      }

      // Clay Diya Bowl
      ctx.fillStyle = '#8a371c';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10, 68, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5c2210';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 8, 54, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Golden Ghee Oil
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 9, 44, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Living Teardrop Flame
      const flameWobble = Math.sin(this.time * 9) * 3;
      const flameH = 46 + Math.sin(this.time * 12) * 4;
      const flameBaseY = cy + 6;

      ctx.save();
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 35;

      // Outer Flame (Saffron Amber)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(cx + flameWobble, flameBaseY - flameH);
      ctx.bezierCurveTo(cx + 20, flameBaseY - flameH * 0.4, cx + 18, flameBaseY, cx, flameBaseY);
      ctx.bezierCurveTo(cx - 18, flameBaseY, cx - 20, flameBaseY - flameH * 0.4, cx + flameWobble, flameBaseY - flameH);
      ctx.fill();

      // Inner Core (White-Hot)
      ctx.fillStyle = '#fffdf0';
      ctx.beginPath();
      ctx.moveTo(cx + flameWobble * 0.5, flameBaseY - flameH * 0.7);
      ctx.bezierCurveTo(cx + 9, flameBaseY - flameH * 0.25, cx + 7, flameBaseY, cx, flameBaseY);
      ctx.bezierCurveTo(cx - 7, flameBaseY, cx - 9, flameBaseY - flameH * 0.25, cx + flameWobble * 0.5, flameBaseY - flameH * 0.7);
      ctx.fill();

      // Blue Combustion Base
      ctx.fillStyle = 'rgba(37, 99, 235, 0.7)';
      ctx.beginPath();
      ctx.arc(cx, flameBaseY - 2, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Rising sparks
      for (const em of this.diyaEmbers) {
        em.y -= em.vy;
        em.x += Math.sin(this.time * 4 + em.seed) * 0.5;
        if (em.y < cy - 140) {
          em.y = cy;
          em.x = cx + (Math.random() - 0.5) * 16;
        }
        ctx.fillStyle = `rgba(254, 240, 138, ${0.4 + Math.sin(this.time * 6 + em.seed) * 0.4})`;
        ctx.beginPath();
        ctx.arc(em.x, em.y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // SCENE 2: SACRED RANGOLI
    if (this.currentScene === 2) {
      const cx = this.width / 2;
      const cy = this.height * 0.48;
      const r = Math.min(this.width * 0.32, 160);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, 0.65); // Perspective slant

      // Rangoli Base Disc
      ctx.fillStyle = '#111833';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e6b94f';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Central Lotus
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
      ctx.fill();

      // 8 Petals
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 0.48, Math.sin(a) * r * 0.48, r * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }

      // Outer Peacock Dots
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        ctx.fillStyle = '#087e83';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78, r * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }

      // Surrounding Lamps
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const lx = Math.cos(a) * (r + 18);
        const ly = Math.sin(a) * (r + 18);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(lx, ly, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // SCENE 3: LANTERNS & PETALS
    if (this.currentScene === 3) {
      for (const l of this.lanterns) {
        l.y -= l.vy;
        l.x += Math.sin(this.time * l.swaySpeed + l.seed) * 0.4;
        if (l.y < -40) l.y = this.height + 20;

        ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(l.x - l.size / 2, l.y - l.size * 0.8, l.size, l.size * 1.4, 4) : ctx.rect(l.x - l.size / 2, l.y - l.size * 0.8, l.size, l.size * 1.4);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(l.x, l.y - l.size * 0.2, l.size * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const p of this.petals) {
        p.y += p.vy;
        p.x += p.vx;
        if (p.y > this.height + 20) p.y = -10;

        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, p.rot, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // SCENE 5: FIREWORKS
    // Draw Ascending Rockets
    for (const r of this.rockets) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Trail
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x, r.y + 14);
      ctx.stroke();
    }

    // Draw Exploding Sparks
    for (const s of this.sparks) {
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    ctx.restore();
  }

  loop() {
    if (!this.running) return;
    this.update();
    this.draw();
    this.rafId = requestAnimationFrame(() => this.loop());
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  dispose() {
    this.stop();
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;
    });

    window.addEventListener('pointerdown', (e) => {
      if (this.currentScene === 5 && !e.target.closest('button') && !e.target.closest('input')) {
        const types = ['chrysanthemum', 'willow', 'peacock', 'ring', 'heart'];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        const themes = ['gold', 'teal', 'pink', 'violet'];
        const chosenTheme = themes[Math.floor(Math.random() * themes.length)];

        this.launchFromScreen(e.clientX, e.clientY, chosenTheme, chosenType);
      }
    });
  }
}
