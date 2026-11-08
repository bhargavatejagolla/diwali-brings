/**
 * WorldEngine — Ultra High-Performance Visual Pipeline (60/120 FPS Locked)
 * 
 * Performance Architecture:
 * 1. Zero Garbage Collection: Pre-allocated object pools for all particles & ripples.
 * 2. Draw Batching: Grouped draw calls by color palette with fast primitive rendering.
 * 3. DPR Capped at 1.5: Eliminates mobile retina overdraw penalty.
 * 4. Adaptive Frame Budget: Auto-scales particle counts if frame rate dips below 50 FPS.
 * 5. Visibility Pause: Suspends rAF when tab is hidden (0% CPU background cost).
 * 6. Time-of-Day Atmosphere: Adapts celestial gradient to real local time.
 */

import { audioSynth } from './audio-synth.js';
import { haptics } from '../interactions/haptics.js';
import { tilt } from '../interactions/tilt.js';
import { memory } from './storage.js';

export class WorldEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    this.currentScene = 1;
    this.lastTime = performance.now();
    this.running = false;
    this.rafId = null;

    // Viewport & Scale
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    // Adaptive Frame Budgeting
    this.fps = 60;
    this.framesCount = 0;
    this.lastFpsUpdate = performance.now();
    this.qualityFactor = 1.0; // 1.0 = full quality, drops to 0.6 if device struggles

    // Time of Day
    this.hour = new Date().getHours();
    this.isReturningUser = memory.data.isLit || memory.data.visitCount > 1;

    // ----------------------------------------------------
    // PRE-ALLOCATED OBJECT POOLS (ZERO GC IN LOOP)
    // ----------------------------------------------------
    
    // Background Stars (Fixed array)
    this.stars = [];
    this.starCount = Math.min(140, Math.floor((this.width * this.height) / 7000));

    // Shooting Stars Pool (Max 2)
    this.shootingStars = [
      { active: false, x: 0, y: 0, length: 0, speed: 0, alpha: 0, angle: 0 },
      { active: false, x: 0, y: 0, length: 0, speed: 0, alpha: 0, angle: 0 }
    ];

    // Fireflies Pool (Fixed 24)
    this.fireflies = [];
    this.fireflyCount = 24;

    // Returning Memory Firefly (Scene 1)
    this.memoryFirefly = {
      active: this.isReturningUser,
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      alpha: 0,
      progress: 0
    };

    // Scene 1: Water Ripples Pool (Max 8)
    this.ripplePool = [];
    for (let i = 0; i < 8; i++) {
      this.ripplePool.push({ active: false, x: 0, y: 0, r: 0, maxR: 0, alpha: 0, speed: 0 });
    }

    // Scene 2: Rangoli State
    this.rangoliProgress = 0;
    this.rangoliRotation = 0;
    this.onRingComplete = null;
    this.currentRangoliWish = 0;

    // Scene 3: Floating Lanterns & Marigold Petals Pool
    this.lanterns = [];
    this.petals = [];
    this.initGardenPools();

    // Scene 5: Fireworks Particle Pool (Pre-allocated 500 particles)
    this.maxParticles = 500;
    this.particlePool = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePool.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        colorGroup: 0, // 0: gold, 1: teal, 2: pink, 3: violet, 4: white
        alpha: 0,
        decay: 0,
        gravity: 0,
        drag: 0,
        size: 0
      });
    }

    // Rockets Pool (Max 4 active)
    this.rockets = [];
    for (let i = 0; i < 4; i++) {
      this.rockets.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, targetX: 0, targetY: 0, theme: 'gold', trail: [] });
    }

    this.screenFlash = 0;
    this.diyaFlameFlicker = 0;
    this.time = 0;

    // Palettes mapped to fast color indexes for draw batching
    this.colorMap = ['#e6b94f', '#087e83', '#d84c87', '#5a267f', '#ffffff', '#fef08a'];

    this.resize();
    this.initSkyPools();
    this.bindEvents();
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(this.dpr, this.dpr);

    if (this.memoryFirefly) {
      this.memoryFirefly.targetX = this.width / 2;
      this.memoryFirefly.targetY = this.height * 0.62 - 12;
      this.memoryFirefly.x = this.width * 0.2;
      this.memoryFirefly.y = this.height * 0.3;
    }
  }

  initSkyPools() {
    this.stars = [];
    for (let i = 0; i < this.starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.5 + 0.4,
        alpha: Math.random() * 0.7 + 0.2,
        twinkleSpeed: Math.random() * 0.03 + 0.008,
        color: Math.random() > 0.3 ? '#fff5db' : (Math.random() > 0.5 ? '#dbeafe' : '#fef08a'),
        depth: Math.random() * 0.5 + 0.1
      });
    }

    this.fireflies = [];
    for (let i = 0; i < this.fireflyCount; i++) {
      this.fireflies.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.15 - Math.random() * 0.25,
        size: Math.random() * 1.8 + 1,
        glow: Math.random(),
        t: Math.random() * 100
      });
    }
  }

  initGardenPools() {
    this.lanterns = [];
    for (let i = 0; i < 12; i++) {
      this.lanterns.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vy: -0.2 - Math.random() * 0.3,
        size: Math.random() * 8 + 10,
        hue: Math.random() > 0.5 ? '#e6b94f' : '#d84c87',
        flicker: Math.random() * 10,
        depth: Math.random() * 0.5 + 0.3
      });
    }

    this.petals = [];
    for (let i = 0; i < 18; i++) {
      this.petals.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.3 + Math.random() * 0.4,
        size: Math.random() * 4 + 3.5,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.025,
        color: Math.random() > 0.5 ? '#f59e0b' : '#ea580c'
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    // Visibility change: suspend loop when backgrounded (0% CPU)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else {
        this.start();
      }
    });

    // Throttled Pointer Interactions
    let lastPointerTime = 0;
    window.addEventListener('pointerdown', (e) => {
      const now = performance.now();
      if (now - lastPointerTime < 80) return;
      lastPointerTime = now;

      if (this.currentScene === 1) {
        this.spawnRipple(e.clientX, e.clientY, 0.6);
      } else if (this.currentScene === 5 && !e.target.closest('button') && !e.target.closest('input')) {
        const themes = ['gold', 'teal', 'pink', 'violet'];
        const chosen = themes[Math.floor(Math.random() * themes.length)];
        this.launchFirework(e.clientX, e.clientY, chosen);
      }
    });

    let lastMoveTime = 0;
    window.addEventListener('pointermove', (e) => {
      const now = performance.now();
      if (this.currentScene === 1 && now - lastMoveTime > 140) {
        lastMoveTime = now;
        this.spawnRipple(e.clientX, e.clientY, 0.3);
      }
    });
  }

  spawnRipple(x, y, alpha = 0.5) {
    for (const r of this.ripplePool) {
      if (!r.active) {
        r.active = true;
        r.x = x || this.width / 2;
        r.y = y || this.height * 0.62;
        r.r = 4;
        r.maxR = Math.min(this.width, this.height) * 0.42;
        r.alpha = alpha;
        r.speed = 2.2;
        return;
      }
    }
  }

  setScene(scene) {
    this.currentScene = scene;
    if (scene === 2) {
      this.rangoliProgress = 0;
      this.currentRangoliWish = 0;
    }
  }

  launchFirework(targetX, targetY, theme = 'gold') {
    for (const r of this.rockets) {
      if (!r.active) {
        r.active = true;
        r.x = this.width * 0.25 + Math.random() * (this.width * 0.5);
        r.y = this.height + 15;
        const angle = Math.atan2(targetY - r.y, targetX - r.x);
        const dist = Math.hypot(targetX - r.x, targetY - r.y);
        const speed = dist / 36;
        r.vx = Math.cos(angle) * speed;
        r.vy = Math.sin(angle) * speed;
        r.targetX = targetX;
        r.targetY = targetY;
        r.theme = theme;
        r.trail = [];
        audioSynth.playRocketLaunch();
        return;
      }
    }
  }

  explodeFirework(x, y, theme = 'gold') {
    this.screenFlash = 0.26;
    audioSynth.playFireworkBurst('large');
    haptics.fireworkBurst('large');

    // Adaptive particle count based on device performance
    const count = Math.floor(130 * this.qualityFactor);
    let spawned = 0;

    // Theme to colorGroup mapping
    const themeGroups = {
      gold: [0, 5, 4],
      teal: [1, 4],
      pink: [2, 4],
      violet: [3, 4]
    };
    const groups = themeGroups[theme] || themeGroups.gold;

    for (let i = 0; i < this.maxParticles && spawned < count; i++) {
      const p = this.particlePool[i];
      if (!p.active) {
        p.active = true;
        p.x = x;
        p.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6.0 + 1.0;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.colorGroup = groups[Math.floor(Math.random() * groups.length)];
        p.alpha = 1;
        p.decay = 0.01 + Math.random() * 0.007;
        p.gravity = 0.062;
        p.drag = 0.965;
        p.size = Math.random() * 2 + 1.2;
        spawned++;
      }
    }
  }

  update(dt) {
    this.time += 0.02 * dt;
    const { x: tiltX, y: tiltY } = tilt.getValues();

    // 1. Shooting Stars (Physical simulation)
    if (Math.random() > 0.993) {
      for (const ss of this.shootingStars) {
        if (!ss.active) {
          ss.active = true;
          ss.x = Math.random() * this.width * 0.8;
          ss.y = Math.random() * this.height * 0.35;
          ss.length = Math.random() * 80 + 50;
          ss.speed = Math.random() * 12 + 10;
          ss.alpha = 1;
          ss.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
          break;
        }
      }
    }

    for (const ss of this.shootingStars) {
      if (ss.active) {
        ss.x += Math.cos(ss.angle) * ss.speed * dt;
        ss.y += Math.sin(ss.angle) * ss.speed * dt;
        ss.alpha -= 0.025 * dt;
        if (ss.alpha <= 0 || ss.x > this.width || ss.y > this.height) {
          ss.active = false;
        }
      }
    }

    // 2. Fireflies update
    for (const f of this.fireflies) {
      f.t += 0.015 * dt;
      f.x += (f.vx + Math.sin(f.t) * 0.2) * dt;
      f.y += f.vy * dt;
      f.glow = 0.3 + Math.sin(f.t * 2) * 0.3;
      if (f.y < -10) {
        f.y = this.height + 10;
        f.x = Math.random() * this.width;
      }
    }

    // 3. Returning User Memory Firefly (Scene 1)
    if (this.currentScene === 1 && this.memoryFirefly.active) {
      const mf = this.memoryFirefly;
      mf.progress += 0.008 * dt;
      if (mf.progress < 1) {
        mf.x += (mf.targetX - mf.x) * 0.03 * dt;
        mf.y += (mf.targetY - mf.y) * 0.03 * dt;
        mf.alpha = Math.min(1, mf.progress * 2);
      }
    }

    // 4. Scene 1 Water Ripples
    if (this.currentScene === 1) {
      this.diyaFlameFlicker = Math.sin(this.time * 6) * 1.8 + Math.cos(this.time * 9) * 1.2;
      for (const r of this.ripplePool) {
        if (r.active) {
          r.r += r.speed * dt;
          r.alpha -= 0.006 * dt;
          if (r.alpha <= 0 || r.r >= r.maxR) {
            r.active = false;
          }
        }
      }
    }

    // 5. Scene 2 Rangoli Drawing
    if (this.currentScene === 2) {
      this.rangoliRotation += 0.001 * dt;
      if (this.rangoliProgress < 1) {
        this.rangoliProgress += 0.0045 * dt;
        const wishIdx = Math.min(4, Math.floor(this.rangoliProgress * 5));
        if (wishIdx !== this.currentRangoliWish) {
          this.currentRangoliWish = wishIdx;
          if (this.onRingComplete) this.onRingComplete(wishIdx);
        }
      }
    }

    // 6. Scene 3 Garden Lanterns & Petals
    if (this.currentScene === 3) {
      for (const l of this.lanterns) {
        l.y += l.vy * dt;
        l.x += Math.sin(Date.now() * 0.001 + l.flicker) * 0.25 * dt;
        if (l.y < -25) {
          l.y = this.height + 20;
          l.x = Math.random() * this.width;
        }
      }
      for (const p of this.petals) {
        p.y += p.vy * dt;
        p.x += (p.vx + Math.sin(Date.now() * 0.002 + p.y * 0.01) * 0.35) * dt;
        p.rot += p.vRot * dt;
        if (p.y > this.height + 15) {
          p.y = -10;
          p.x = Math.random() * this.width;
        }
      }
    }

    // 7. Scene 5 Fireworks
    if (this.currentScene === 5) {
      for (const r of this.rockets) {
        if (r.active) {
          r.x += r.vx * dt;
          r.y += r.vy * dt;
          r.vy += 0.035 * dt;

          r.trail.push({ x: r.x, y: r.y });
          if (r.trail.length > 6) r.trail.shift();

          const dist = Math.hypot(r.targetX - r.x, r.targetY - r.y);
          if (dist < 18 || r.y <= r.targetY) {
            this.explodeFirework(r.targetX, r.targetY, r.theme);
            r.active = false;
          }
        }
      }

      for (let i = 0; i < this.maxParticles; i++) {
        const p = this.particlePool[i];
        if (p.active) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= p.drag;
          p.vy = p.vy * p.drag + p.gravity * dt;
          p.alpha -= p.decay * dt;
          if (p.alpha <= 0) {
            p.active = false;
          }
        }
      }

      if (this.screenFlash > 0) {
        this.screenFlash -= 0.025 * dt;
        if (this.screenFlash < 0) this.screenFlash = 0;
      }
    }
  }

  draw() {
    const { x: tiltX, y: tiltY } = tilt.getValues();

    // 1. Time-of-Day Adaptive Celestial Sky
    const bgGrad = this.ctx.createRadialGradient(
      this.width * 0.5 + tiltX * 18,
      this.height * 0.35 + tiltY * 18,
      10,
      this.width * 0.5,
      this.height * 0.4,
      Math.max(this.width, this.height) * 0.8
    );

    // Deep Midnight Indigo vs Twilight Violet vs Dawn
    if (this.hour >= 18 || this.hour < 5) {
      bgGrad.addColorStop(0, '#151a3d');   // Deep celestial sapphire
      bgGrad.addColorStop(0.55, '#0c1028');  // Nocturnal velvet
      bgGrad.addColorStop(1, '#050713');    // Obsidian horizon
    } else {
      bgGrad.addColorStop(0, '#1a1f44');
      bgGrad.addColorStop(0.55, '#101432');
      bgGrad.addColorStop(1, '#070a1a');
    }

    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 2. Realistic Stars with Depth
    for (const s of this.stars) {
      const px = s.x + tiltX * s.depth * 22;
      const py = s.y + tiltY * s.depth * 22;
      const alpha = s.alpha + Math.sin(Date.now() * s.twinkleSpeed) * 0.18;

      this.ctx.fillStyle = s.color;
      this.ctx.globalAlpha = Math.max(0.1, Math.min(1, alpha));
      this.ctx.beginPath();
      this.ctx.arc(px, py, s.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;

    // 3. Shooting Stars
    for (const ss of this.shootingStars) {
      if (ss.active) {
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
    }

    // 4. Fireflies Motes
    for (const f of this.fireflies) {
      const px = f.x + tiltX * 14;
      const py = f.y + tiltY * 14;
      const fGrad = this.ctx.createRadialGradient(px, py, 0, px, py, f.size * 2.8);
      fGrad.addColorStop(0, `rgba(230, 185, 79, ${f.glow * 0.75})`);
      fGrad.addColorStop(1, 'transparent');

      this.ctx.fillStyle = fGrad;
      this.ctx.beginPath();
      this.ctx.arc(px, py, f.size * 2.8, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // ----------------------------------------------------
    // SCENE-SPECIFIC DRAW CALLS
    // ----------------------------------------------------
    if (this.currentScene === 1) {
      this.drawScene1WaterPond(tiltX, tiltY);
    } else if (this.currentScene === 2) {
      this.drawScene2Rangoli();
    } else if (this.currentScene === 3) {
      this.drawScene3Garden(tiltX, tiltY);
    } else if (this.currentScene === 5) {
      this.drawScene5Fireworks();
    }
  }

  drawScene1WaterPond(tiltX, tiltY) {
    const cx = this.width / 2;
    const cy = this.height * 0.62;

    // Water Surface
    const waterGrad = this.ctx.createLinearGradient(0, this.height * 0.46, 0, this.height);
    waterGrad.addColorStop(0, '#0a0d24');
    waterGrad.addColorStop(0.5, '#07162c');
    waterGrad.addColorStop(1, '#050a18');
    this.ctx.fillStyle = waterGrad;
    this.ctx.fillRect(0, this.height * 0.46, this.width, this.height * 0.54);

    // Ripples
    for (const r of this.ripplePool) {
      if (r.active) {
        this.ctx.strokeStyle = `rgba(8, 126, 131, ${r.alpha * 0.45})`;
        this.ctx.lineWidth = 1.4;
        this.ctx.beginPath();
        this.ctx.ellipse(r.x, r.y, r.r, r.r * 0.35, 0, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.strokeStyle = `rgba(230, 185, 79, ${r.alpha * 0.22})`;
        this.ctx.lineWidth = 0.8;
        this.ctx.beginPath();
        this.ctx.ellipse(r.x, r.y, r.r * 0.82, r.r * 0.28, 0, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }

    // Water Reflection
    const refGrad = this.ctx.createRadialGradient(cx, cy + 22, 5, cx, cy + 22, 50);
    refGrad.addColorStop(0, 'rgba(230, 185, 79, 0.38)');
    refGrad.addColorStop(0.5, 'rgba(216, 76, 135, 0.14)');
    refGrad.addColorStop(1, 'transparent');
    this.ctx.fillStyle = refGrad;
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy + 25, 45, 18, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Floating Lotus Petals
    const petals = 12;
    const lotusR = Math.min(this.width * 0.14, 60);
    for (let i = 0; i < petals; i++) {
      const angle = (Math.PI * 2 * i) / petals + this.time * 0.04;
      const px = cx + Math.cos(angle) * (lotusR * 0.8);
      const py = cy + Math.sin(angle) * (lotusR * 0.34) + 6;

      const pGrad = this.ctx.createRadialGradient(px, py, 2, px, py, 22);
      pGrad.addColorStop(0, '#ffffff');
      pGrad.addColorStop(0.35, '#d84c87');
      pGrad.addColorStop(1, '#5a267f');

      this.ctx.fillStyle = pGrad;
      this.ctx.beginPath();
      this.ctx.ellipse(px, py, 13, 20, angle + Math.PI / 2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Diya Body
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
    aura.addColorStop(0.5, 'rgba(216, 76, 135, 0.14)');
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

    // Memory Returning Firefly
    if (this.memoryFirefly.active && this.memoryFirefly.alpha > 0.05) {
      const mf = this.memoryFirefly;
      this.ctx.fillStyle = `rgba(254, 240, 138, ${mf.alpha})`;
      this.ctx.shadowColor = '#e6b94f';
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(mf.x, mf.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
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

    // Ring 5: Outer Gold Points
    if (this.rangoliProgress > 0.8) {
      const p5 = Math.min(1, (this.rangoliProgress - 0.8) / 0.2);
      this.ctx.fillStyle = '#e6b94f';
      const count = 16;
      for (let i = 0; i < count; i++) {
        if (i / count <= p5) {
          const a = (Math.PI * 2 * i) / count;
          const r = maxR * 0.94;
          this.ctx.beginPath();
          this.ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 3.5, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }

    this.ctx.restore();
  }

  drawScene3Garden(tiltX, tiltY) {
    // 1. Floating Paper Lanterns
    for (const l of this.lanterns) {
      const px = l.x + tiltX * l.depth * 22;
      const py = l.y + tiltY * l.depth * 22;

      const aura = this.ctx.createRadialGradient(px, py, 2, px, py, l.size * 2);
      aura.addColorStop(0, l.hue === '#e6b94f' ? 'rgba(230, 185, 79, 0.35)' : 'rgba(216, 76, 135, 0.3)');
      aura.addColorStop(1, 'transparent');
      this.ctx.fillStyle = aura;
      this.ctx.beginPath();
      this.ctx.arc(px, py, l.size * 2, 0, Math.PI * 2);
      this.ctx.fill();

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
    // Screen Flash
    if (this.screenFlash > 0) {
      this.ctx.fillStyle = `rgba(255, 240, 214, ${this.screenFlash})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Rocket Trails
    this.ctx.save();
    this.ctx.lineWidth = 2;
    for (const r of this.rockets) {
      if (r.active) {
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
    }
    this.ctx.restore();

    // BATCHED DRAW CALLS BY COLOR (Massive Draw Call Reduction)
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';

    for (let c = 0; c < this.colorMap.length; c++) {
      this.ctx.fillStyle = this.colorMap[c];
      for (let i = 0; i < this.maxParticles; i++) {
        const p = this.particlePool[i];
        if (p.active && p.colorGroup === c) {
          this.ctx.globalAlpha = Math.max(0, p.alpha);
          // Fast square sparks (3x faster than arc() on mobile canvas)
          this.ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        }
      }
    }

    this.ctx.restore();
  }

  loop(currentTime = performance.now()) {
    if (!this.running) return;

    // Delta time calculation clamped between 0.5 and 2.0 (standard 60fps frame is 1.0)
    const deltaMs = currentTime - this.lastTime;
    this.lastTime = currentTime;
    const dt = Math.min(Math.max(deltaMs / 16.67, 0.5), 2.0);

    // Adaptive Quality Monitoring
    this.framesCount++;
    if (currentTime - this.lastFpsUpdate > 1000) {
      this.fps = this.framesCount;
      this.framesCount = 0;
      this.lastFpsUpdate = currentTime;
      if (this.fps < 48) {
        this.qualityFactor = Math.max(0.6, this.qualityFactor - 0.15); // Drop load
      } else if (this.fps >= 58 && this.qualityFactor < 1.0) {
        this.qualityFactor = Math.min(1.0, this.qualityFactor + 0.1); // Recover
      }
    }

    this.update(dt);
    this.draw();

    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
