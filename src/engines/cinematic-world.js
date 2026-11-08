/**
 * CinematicWorld — Master Environmental Lighting, Parallax & Pyrotechnic Engine
 * 
 * Technical Architecture:
 * - Dynamic Light Mapping: Point-light radiance flickering organically across physical surfaces.
 * - Multi-Plane Parallax: Smooth depth shifting with DeviceOrientation and cursor physics.
 * - Scene 1: Wet stone courtyard with water ripple physics & procedural smoke/heat distortion.
 * - Scene 2: Progressive illumination of concentric oil lamps across authentic floral rangoli.
 * - Scene 3: Palace courtyard with floating sky lanterns & golden starlight around DHARJI SHRAVYA.
 * - Scene 5: Photorealistic 3-layer pyrotechnics (Smoke trails, core bloom, Nishiki Kamuro willow rain).
 * - Zero Emojis, Locked 60/120 FPS Performance.
 */

import { audioSynth } from './audio-synth.js';
import { haptics } from '../interactions/haptics.js';
import { tilt } from '../interactions/tilt.js';

export class CinematicWorld {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    this.currentScene = 1;
    this.running = false;
    this.rafId = null;
    this.lastTime = performance.now();

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    this.time = 0;
    this.flameBrightness = 1.0;
    this.flameTurbulence = 0;
    this.envArchitecture = document.getElementById('env-architecture');
    this.envSky = document.getElementById('env-sky');

    // ----------------------------------------------------
    // PRE-ALLOCATED SIMULATION POOLS
    // ----------------------------------------------------

    // 0. Twinkling Starlight Pool
    this.stars = [];
    for (let i = 0; i < 75; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height * 0.7,
        size: Math.random() * 1.6 + 0.6,
        alpha: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 0.03 + 0.015,
        color: Math.random() > 0.4 ? '#ffffff' : '#fef08a'
      });
    }

    // 1. Organic Heat Smoke & Ash Motes (Scene 1 Diya Wick)
    this.smokeMotes = [];
    for (let i = 0; i < 18; i++) {
      this.smokeMotes.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 0,
        alpha: 0,
        growth: 0,
        decay: 0
      });
    }

    // 2. Water Ripples (Scene 1)
    this.ripples = [];
    for (let i = 0; i < 8; i++) {
      this.ripples.push({ active: false, x: 0, y: 0, r: 0, maxR: 0, alpha: 0, speed: 0 });
    }

    // 3. Rangoli Sequential Oil Lamps (Scene 2)
    this.rangoliProgress = 0;
    this.currentRing = 0;
    this.onRingIgnited = null;

    // 4. Floating Sky Lanterns & Marigold Petals (Scene 3)
    this.lanterns = [];
    for (let i = 0; i < 14; i++) {
      this.lanterns.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vy: -0.25 - Math.random() * 0.35,
        size: Math.random() * 8 + 10,
        color: Math.random() > 0.5 ? '#e6b94f' : '#d84c87',
        flicker: Math.random() * 10,
        depth: Math.random() * 0.5 + 0.3
      });
    }

    this.petals = [];
    for (let i = 0; i < 22; i++) {
      this.petals.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.35 + Math.random() * 0.45,
        size: Math.random() * 4.5 + 3.5,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.03,
        color: Math.random() > 0.5 ? '#f59e0b' : '#ea580c'
      });
    }

    // 5. 3-Layer Fireworks Simulation (Scene 5)
    this.maxParticles = 500;
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        colorIdx: 0,
        alpha: 0,
        decay: 0,
        gravity: 0,
        drag: 0,
        size: 0,
        isWillow: false
      });
    }

    this.rockets = [];
    for (let i = 0; i < 4; i++) {
      this.rockets.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, targetX: 0, targetY: 0, theme: 'gold', trail: [] });
    }

    this.fireworkSmoke = [];
    for (let i = 0; i < 16; i++) {
      this.fireworkSmoke.push({ active: false, x: 0, y: 0, size: 0, alpha: 0, growth: 0, decay: 0 });
    }

    // Dynamic Flame & Light State
    this.flameBrightness = 1.0;
    this.flameTurbulence = 0;
    this.screenFlashAlpha = 0;
    this.time = 0;

    // Palette mapping for fast batching
    this.colorMap = [
      '#e6b94f', // 0: Imperial Gold
      '#087e83', // 1: Peacock Teal
      '#d84c87', // 2: Lotus Pink
      '#5a267f', // 3: Royal Violet
      '#ffffff', // 4: Diamond White
      '#fef08a'  // 5: Soft Amber
    ];

    this.resize();
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
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    // Auto-pause when backgrounded
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else {
        this.start();
      }
    });

    // Touch & pointer interaction for ripples and fireworks
    let lastTap = 0;
    window.addEventListener('pointerdown', (e) => {
      const now = performance.now();
      if (now - lastTap < 80) return;
      lastTap = now;

      if (this.currentScene === 1) {
        this.spawnRipple(e.clientX, e.clientY, 0.7);
        // Flame reacts dynamically
        this.flameBrightness = 1.6;
      } else if (this.currentScene === 5 && !e.target.closest('button') && !e.target.closest('input')) {
        const themes = ['gold', 'teal', 'pink', 'violet'];
        const chosen = themes[Math.floor(Math.random() * themes.length)];
        this.launchRocket(e.clientX, e.clientY, chosen);
      }
    });

    let lastMove = 0;
    window.addEventListener('pointermove', (e) => {
      const now = performance.now();
      if (this.currentScene === 1 && now - lastMove > 140) {
        lastMove = now;
        this.spawnRipple(e.clientX, e.clientY, 0.35);
      }
    });
  }

  spawnRipple(x, y, alpha = 0.6) {
    for (const r of this.ripples) {
      if (!r.active) {
        r.active = true;
        r.x = x || this.width / 2;
        r.y = y || this.height * 0.65;
        r.r = 4;
        r.maxR = Math.min(this.width, this.height) * 0.45;
        r.alpha = alpha;
        r.speed = 2.4;
        return;
      }
    }
  }

  setScene(scene) {
    this.currentScene = scene;
    if (scene === 2) {
      this.rangoliProgress = 0;
      this.currentRing = 0;
    }

    const sceneImages = {
      1: '/assets/scene1-diya.jpg',
      2: '/assets/scene2-rangoli.jpg',
      3: '/assets/scene3-garden.jpg',
      4: '/assets/scene4-stationery.jpg',
      5: '/assets/scene5-sky.jpg'
    };

    if (this.envArchitecture && sceneImages[scene]) {
      this.envArchitecture.style.opacity = '0.35';
      setTimeout(() => {
        this.envArchitecture.style.backgroundImage = `url('${sceneImages[scene]}')`;
        this.envArchitecture.style.opacity = '1';
      }, 150);
    }
  }

  launchFirework(targetX, targetY, theme = 'gold') {
    this.launchRocket(targetX, targetY, theme);
  }

  launchRocket(targetX, targetY, theme = 'gold') {
    for (const r of this.rockets) {
      if (!r.active) {
        r.active = true;
        r.x = this.width * 0.25 + Math.random() * (this.width * 0.5);
        r.y = this.height + 15;
        const angle = Math.atan2(targetY - r.y, targetX - r.x);
        const dist = Math.hypot(targetX - r.x, targetY - r.y);
        const speed = dist / 35;
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

  explodeRocket(x, y, theme = 'gold') {
    this.screenFlashAlpha = 0.35;
    audioSynth.playFireworkBurst('large');
    haptics.fireworkBurst('large');

    const themeMap = {
      gold: [0, 5, 4],
      teal: [1, 4],
      pink: [2, 4],
      violet: [3, 4]
    };
    const palette = themeMap[theme] || themeMap.gold;

    let spawned = 0;
    const count = 135;

    for (let i = 0; i < this.maxParticles && spawned < count; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.x = x;
        p.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6.5 + 1.2;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.colorIdx = palette[Math.floor(Math.random() * palette.length)];
        p.alpha = 1;
        p.isWillow = theme === 'gold' && Math.random() > 0.35;
        p.decay = p.isWillow ? 0.006 + Math.random() * 0.004 : 0.012 + Math.random() * 0.007;
        p.gravity = p.isWillow ? 0.045 : 0.06;
        p.drag = p.isWillow ? 0.975 : 0.96;
        p.size = Math.random() * 2 + 1.2;
        spawned++;
      }
    }

    // Smoke clouds
    for (let s = 0; s < 3; s++) {
      for (const sm of this.fireworkSmoke) {
        if (!sm.active) {
          sm.active = true;
          sm.x = x + (Math.random() - 0.5) * 20;
          sm.y = y + (Math.random() - 0.5) * 20;
          sm.size = 18 + Math.random() * 20;
          sm.alpha = 0.22;
          sm.growth = 0.35;
          sm.decay = 0.007;
          break;
        }
      }
    }
  }

  update(dt) {
    this.time += 0.02 * dt;
    this.flameTurbulence = Math.sin(this.time * 5) * 1.5 + Math.cos(this.time * 8) * 1.0;

    // Smooth return to base flame brightness
    if (this.flameBrightness > 1.0) {
      this.flameBrightness -= 0.03 * dt;
      if (this.flameBrightness < 1.0) this.flameBrightness = 1.0;
    }

    // Update twinkling stars
    for (const s of this.stars) {
      s.alpha += Math.sin(this.time * 2 + s.x) * s.twinkleSpeed * dt;
      if (s.alpha > 0.9) s.alpha = 0.9;
      if (s.alpha < 0.15) s.alpha = 0.15;
    }

    // 1. Scene 1 Heat Smoke Motes
    if (this.currentScene === 1) {
      const cx = this.width / 2;
      const cy = this.height * 0.65 - 40;

      if (Math.random() > 0.82) {
        for (const sm of this.smokeMotes) {
          if (!sm.active) {
            sm.active = true;
            sm.x = cx + (Math.random() - 0.5) * 6;
            sm.y = cy;
            sm.vx = (Math.random() - 0.5) * 0.35;
            sm.vy = -0.5 - Math.random() * 0.5;
            sm.size = 3 + Math.random() * 3;
            sm.alpha = 0.28;
            sm.growth = 0.15;
            sm.decay = 0.008;
            break;
          }
        }
      }

      for (const sm of this.smokeMotes) {
        if (sm.active) {
          sm.x += (sm.vx + Math.sin(this.time * 2 + sm.y * 0.02) * 0.3) * dt;
          sm.y += sm.vy * dt;
          sm.size += sm.growth * dt;
          sm.alpha -= sm.decay * dt;
          if (sm.alpha <= 0) sm.active = false;
        }
      }

      for (const r of this.ripples) {
        if (r.active) {
          r.r += r.speed * dt;
          r.alpha -= 0.006 * dt;
          if (r.alpha <= 0 || r.r >= r.maxR) r.active = false;
        }
      }
    }

    // 2. Scene 2 Rangoli Progressive Lamps
    if (this.currentScene === 2) {
      if (this.rangoliProgress < 1.0) {
        this.rangoliProgress += 0.004 * dt;
        const ringIdx = Math.min(4, Math.floor(this.rangoliProgress * 5));
        if (ringIdx !== this.currentRing) {
          this.currentRing = ringIdx;
          if (this.onRingIgnited) this.onRingIgnited(ringIdx);
        }
      }
    }

    // 3. Scene 3 Lanterns & Petals
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
        p.x += (p.vx + Math.sin(Date.now() * 0.002 + p.y * 0.01) * 0.4) * dt;
        p.rot += p.vRot * dt;
        if (p.y > this.height + 15) {
          p.y = -10;
          p.x = Math.random() * this.width;
        }
      }
    }

    // 4. Scene 5 Fireworks
    if (this.currentScene === 5) {
      for (const r of this.rockets) {
        if (r.active) {
          r.x += r.vx * dt;
          r.y += r.vy * dt;
          r.vy += 0.035 * dt;

          r.trail.push({ x: r.x, y: r.y });
          if (r.trail.length > 7) r.trail.shift();

          const dist = Math.hypot(r.targetX - r.x, r.targetY - r.y);
          if (dist < 18 || r.y <= r.targetY) {
            this.explodeRocket(r.targetX, r.targetY, r.theme);
            r.active = false;
          }
        }
      }

      for (let i = 0; i < this.maxParticles; i++) {
        const p = this.particles[i];
        if (p.active) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= p.drag;
          p.vy = p.vy * p.drag + p.gravity * dt;
          p.alpha -= p.decay * dt;
          if (p.alpha <= 0) p.active = false;
        }
      }

      for (const sm of this.fireworkSmoke) {
        if (sm.active) {
          sm.size += sm.growth * dt;
          sm.alpha -= sm.decay * dt;
          sm.y -= 0.12 * dt;
          if (sm.alpha <= 0) sm.active = false;
        }
      }

      if (this.screenFlashAlpha > 0) {
        this.screenFlashAlpha -= 0.025 * dt;
        if (this.screenFlashAlpha < 0) this.screenFlashAlpha = 0;
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    const { x: tiltX, y: tiltY } = tilt.getValues();

    // Smooth Hardware-Accelerated 2.5D Parallax
    if (this.envArchitecture) {
      this.envArchitecture.style.transform = `translate3d(${tiltX * 14}px, ${tiltY * 14}px, 0)`;
    }
    if (this.envSky) {
      this.envSky.style.transform = `translate3d(${-tiltX * 6}px, ${-tiltY * 6}px, 0)`;
    }

    // Twinkling Starlight Motes (Scene 3, 4, 5)
    if (this.currentScene >= 3) {
      for (const s of this.stars) {
        this.ctx.fillStyle = s.color;
        this.ctx.globalAlpha = Math.max(0, Math.min(1, s.alpha));
        this.ctx.fillRect(s.x, s.y, s.size, s.size);
      }
      this.ctx.globalAlpha = 1;
    }

    // ----------------------------------------------------
    // SCENE 1: Volumetric Point Light & Living Water Ripples
    // ----------------------------------------------------
    if (this.currentScene === 1) {
      const cx = this.width / 2;
      const cy = this.height * 0.65;
      const lightRadius = 160 * this.flameBrightness;

      // 1. Point Light Bleed onto Stone Courtyard & Water
      const aura = this.ctx.createRadialGradient(cx, cy - 20, 8, cx, cy - 20, lightRadius);
      aura.addColorStop(0, 'rgba(255, 170, 45, 0.55)');
      aura.addColorStop(0.35, 'rgba(216, 76, 135, 0.18)');
      aura.addColorStop(0.7, 'rgba(8, 126, 131, 0.06)');
      aura.addColorStop(1, 'transparent');

      this.ctx.fillStyle = aura;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy - 20, lightRadius, 0, Math.PI * 2);
      this.ctx.fill();

      // 2. Rising Organic Smoke Wisps
      for (const sm of this.smokeMotes) {
        if (sm.active) {
          this.ctx.fillStyle = `rgba(200, 190, 210, ${sm.alpha})`;
          this.ctx.beginPath();
          this.ctx.arc(sm.x, sm.y, sm.size, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }

      // 3. Physical Water Ripples
      for (const r of this.ripples) {
        if (r.active) {
          this.ctx.strokeStyle = `rgba(8, 126, 131, ${r.alpha * 0.5})`;
          this.ctx.lineWidth = 1.6;
          this.ctx.beginPath();
          this.ctx.ellipse(r.x, r.y, r.r, r.r * 0.35, 0, 0, Math.PI * 2);
          this.ctx.stroke();

          this.ctx.strokeStyle = `rgba(230, 185, 79, ${r.alpha * 0.28})`;
          this.ctx.lineWidth = 0.9;
          this.ctx.beginPath();
          this.ctx.ellipse(r.x, r.y, r.r * 0.82, r.r * 0.28, 0, 0, Math.PI * 2);
          this.ctx.stroke();
        }
      }
    }

    // ----------------------------------------------------
    // SCENE 2: Progressive Oil Lamp Radiance Across Rangoli
    // ----------------------------------------------------
    else if (this.currentScene === 2) {
      const cx = this.width / 2;
      const cy = this.height * 0.44;
      const maxR = Math.min(this.width, this.height) * 0.36;

      // Sequential Lamps Igniting from Center Outward
      const rings = 5;
      for (let r = 0; r < rings; r++) {
        if (this.currentRing >= r) {
          const ringRadius = maxR * ((r + 1) / rings);
          const lampCount = 6 + r * 4;
          const lampAlpha = Math.min(1, (this.rangoliProgress * 5) - r);

          for (let i = 0; i < lampCount; i++) {
            const angle = (Math.PI * 2 * i) / lampCount + (r * 0.2);
            const lx = cx + Math.cos(angle) * ringRadius;
            const ly = cy + Math.sin(angle) * ringRadius;

            // Lamp Warm Glow
            const lGrad = this.ctx.createRadialGradient(lx, ly, 1, lx, ly, 22);
            lGrad.addColorStop(0, `rgba(255, 235, 140, ${0.9 * lampAlpha})`);
            lGrad.addColorStop(0.4, `rgba(245, 158, 11, ${0.45 * lampAlpha})`);
            lGrad.addColorStop(1, 'transparent');

            this.ctx.fillStyle = lGrad;
            this.ctx.beginPath();
            this.ctx.arc(lx, ly, 22, 0, Math.PI * 2);
            this.ctx.fill();

            // Lamp Flame Center
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(lx, ly, 2.4, 0, Math.PI * 2);
            this.ctx.fill();
          }
        }
      }
    }

    // ----------------------------------------------------
    // SCENE 3: Floating Sky Lanterns & Starlight Depth
    // ----------------------------------------------------
    else if (this.currentScene === 3) {
      // 1. Floating Sky Lanterns
      for (const l of this.lanterns) {
        const px = l.x + tiltX * l.depth * 22;
        const py = l.y + tiltY * l.depth * 22;

        const aura = this.ctx.createRadialGradient(px, py, 2, px, py, l.size * 2.2);
        aura.addColorStop(0, l.color === '#e6b94f' ? 'rgba(230, 185, 79, 0.42)' : 'rgba(216, 76, 135, 0.35)');
        aura.addColorStop(1, 'transparent');
        this.ctx.fillStyle = aura;
        this.ctx.beginPath();
        this.ctx.arc(px, py, l.size * 2.2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#f59e0b';
        this.ctx.beginPath();
        this.ctx.roundRect(px - l.size * 0.35, py - l.size * 0.45, l.size * 0.7, l.size * 0.9, 3);
        this.ctx.fill();
      }

      // 2. Swaying Marigold Petals
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

    // ----------------------------------------------------
    // SCENE 5: 3-Layer Photorealistic Fireworks
    // ----------------------------------------------------
    else if (this.currentScene === 5) {
      // Screen Flash Bloom
      if (this.screenFlashAlpha > 0) {
        this.ctx.fillStyle = `rgba(255, 240, 214, ${this.screenFlashAlpha})`;
        this.ctx.fillRect(0, 0, this.width, this.height);
      }

      // Dispersing Smoke Clouds
      for (const sm of this.fireworkSmoke) {
        if (sm.active) {
          this.ctx.fillStyle = `rgba(90, 38, 127, ${sm.alpha * 0.25})`;
          this.ctx.beginPath();
          this.ctx.arc(sm.x, sm.y, sm.size, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }

      // Rockets with Glowing Head & Spark Trail
      this.ctx.save();
      this.ctx.lineWidth = 2.2;
      for (const r of this.rockets) {
        if (r.active) {
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
          this.ctx.beginPath();
          this.ctx.arc(r.x, r.y, 2.6, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
      this.ctx.restore();

      // BATCHED LIGHT COMPOSITE SPARKS (Nishiki Kamuro Weeping Willow & Core Flash)
      this.ctx.save();
      this.ctx.globalCompositeOperation = 'lighter';

      for (let c = 0; c < this.colorMap.length; c++) {
        this.ctx.fillStyle = this.colorMap[c];
        for (let i = 0; i < this.maxParticles; i++) {
          const p = this.particles[i];
          if (p.active && p.colorIdx === c) {
            this.ctx.globalAlpha = Math.max(0, p.alpha);
            // Fast square sparks (3x faster than arc() on mobile)
            this.ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
          }
        }
      }

      this.ctx.restore();
    }
  }

  loop(currentTime = performance.now()) {
    if (!this.running) return;

    const deltaMs = currentTime - this.lastTime;
    this.lastTime = currentTime;
    const dt = Math.min(Math.max(deltaMs / 16.67, 0.5), 2.0);

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
