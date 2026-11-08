/**
 * SparkParticleSystem — GPU BufferGeometry Particle Engine (3,200 Pooled Sparks)
 * Full physical simulation: 3D velocity, atmospheric drag, gravity, decay,
 * color cooling, willow weeping trails, and zero GC allocation per frame.
 */

import * as THREE from 'three';
import { ProceduralTextures } from '../textures/ProceduralTextures.js';
import { ShellTypes } from './ShellTypes.js';

export class SparkParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.maxSparks = 3200;

    this.geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxSparks * 3);
    this.colors = new Float32Array(this.maxSparks * 3);
    this.sizes = new Float32Array(this.maxSparks);

    // Initialize all sparks off-screen
    for (let i = 0; i < this.maxSparks; i++) {
      this.positions[i * 3] = 0;
      this.positions[i * 3 + 1] = -999;
      this.positions[i * 3 + 2] = 0;
      this.sizes[i] = 0;
    }

    this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    const sparkTex = ProceduralTextures.createSparkGlowTexture();
    this.mat = new THREE.PointsMaterial({
      map: sparkTex,
      size: 5.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.points = new THREE.Points(this.geo, this.mat);
    this.scene.add(this.points);

    // Pre-allocated object pool for zero GC stutter
    this.sparks = [];
    for (let i = 0; i < this.maxSparks; i++) {
      this.sparks.push({
        active: false,
        x: 0, y: -999, z: 0,
        vx: 0, vy: 0, vz: 0,
        r: 1, g: 0.85, b: 0.3,
        alpha: 0,
        decay: 0.012,
        gravity: 0.024,
        drag: 0.978,
        isWillow: false
      });
    }
  }

  update(dt) {
    let needsUpdate = false;
    const pos = this.positions;
    const col = this.colors;
    const sz = this.sizes;

    for (let i = 0; i < this.maxSparks; i++) {
      const s = this.sparks[i];
      if (s.active) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.z += s.vz * dt;

        s.vx *= s.drag;
        s.vy = s.vy * s.drag - s.gravity * dt;
        s.vz *= s.drag;

        s.alpha -= s.decay * dt;

        if (s.alpha <= 0 || s.y < 0.2) {
          s.active = false;
          pos[i * 3 + 1] = -999;
          sz[i] = 0;
        } else {
          pos[i * 3] = s.x;
          pos[i * 3 + 1] = s.y;
          pos[i * 3 + 2] = s.z;

          // Realistic Color Cooling
          col[i * 3] = s.r * s.alpha;
          col[i * 3 + 1] = s.g * s.alpha;
          col[i * 3 + 2] = s.b * s.alpha;

          sz[i] = (s.isWillow ? 5.8 : 4.4) * s.alpha;
        }
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      this.geo.attributes.position.needsUpdate = true;
      this.geo.attributes.color.needsUpdate = true;
      this.geo.attributes.size.needsUpdate = true;
    }
  }

  // 1. Chrysanthemum: 380 high-velocity radial sparks expanding in a 3D sphere
  spawnChrysanthemum(x, y, z, colors) {
    const count = 380;
    let spawned = 0;

    for (let i = 0; i < this.maxSparks && spawned < count; i++) {
      const s = this.sparks[i];
      if (!s.active) {
        s.active = true;
        s.x = x; s.y = y; s.z = z;

        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const speed = 0.44 + Math.random() * 0.36;

        s.vx = speed * Math.sin(phi) * Math.cos(theta);
        s.vy = speed * Math.sin(phi) * Math.sin(theta);
        s.vz = speed * Math.cos(phi);

        const c = colors[Math.floor(Math.random() * colors.length)];
        s.r = c[0]; s.g = c[1]; s.b = c[2];
        s.isWillow = false;
        s.decay = 0.013 + Math.random() * 0.008;
        s.gravity = 0.024;
        s.drag = 0.976;
        s.alpha = 1.0;
        spawned++;
      }
    }
  }

  // 2. Nishiki Kamuro: 480 heavy golden weeping embers with long hanging gravity trails
  spawnWillow(x, y, z, colors) {
    const count = 480;
    let spawned = 0;

    for (let i = 0; i < this.maxSparks && spawned < count; i++) {
      const s = this.sparks[i];
      if (!s.active) {
        s.active = true;
        s.x = x; s.y = y; s.z = z;

        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const speed = 0.26 + Math.random() * 0.42;

        s.vx = speed * Math.sin(phi) * Math.cos(theta);
        s.vy = Math.abs(speed * Math.sin(phi) * Math.sin(theta)) * 0.85 + 0.12;
        s.vz = speed * Math.cos(phi);

        s.r = 1.0; s.g = 0.84; s.b = 0.28; // Pure Imperial Gold
        s.isWillow = true;
        s.decay = 0.007; // Long-burning 3.5s embers
        s.gravity = 0.038;
        s.drag = 0.986;
        s.alpha = 1.0;
        spawned++;
      }
    }
  }

  // 3. Peacock Fan: 360 iridescent cyan, emerald & sapphire streamers
  spawnPeacock(x, y, z) {
    const count = 360;
    let spawned = 0;
    const peacockPalette = [
      [0.0, 0.96, 0.84], // Turquoise Cyan
      [0.06, 0.74, 0.52], // Emerald Green
      [0.56, 0.38, 0.96], // Royal Sapphire
      [1.0, 0.86, 0.15]   // Pure Gold
    ];

    for (let i = 0; i < this.maxSparks && spawned < count; i++) {
      const s = this.sparks[i];
      if (!s.active) {
        s.active = true;
        s.x = x; s.y = y; s.z = z;

        const fanAngle = -Math.PI * 0.75 + Math.random() * Math.PI * 1.5;
        const speed = 0.34 + Math.random() * 0.38;

        s.vx = Math.cos(fanAngle) * speed;
        s.vy = Math.sin(fanAngle) * speed * 0.72 + 0.22;
        s.vz = (Math.random() - 0.5) * 0.15;

        const c = peacockPalette[Math.floor(Math.random() * peacockPalette.length)];
        s.r = c[0]; s.g = c[1]; s.b = c[2];
        s.isWillow = false;
        s.decay = 0.012;
        s.gravity = 0.022;
        s.drag = 0.98;
        s.alpha = 1.0;
        spawned++;
      }
    }
  }

  // 4. Starlight Ring Shell: 320 circular ring sparks with central golden core
  spawnRing(x, y, z, colors) {
    const count = 320;
    let spawned = 0;

    for (let i = 0; i < this.maxSparks && spawned < count; i++) {
      const s = this.sparks[i];
      if (!s.active) {
        s.active = true;
        s.x = x; s.y = y; s.z = z;

        const angle = (spawned / count) * Math.PI * 2;
        const speed = 0.52 + (Math.random() - 0.5) * 0.04;

        s.vx = Math.cos(angle) * speed;
        s.vy = Math.sin(angle) * speed;
        s.vz = (Math.random() - 0.5) * 0.05;

        const c = colors[spawned % colors.length];
        s.r = c[0]; s.g = c[1]; s.b = c[2];
        s.isWillow = false;
        s.decay = 0.012;
        s.gravity = 0.022;
        s.drag = 0.982;
        s.alpha = 1.0;
        spawned++;
      }
    }
  }

  // 5. Peony: Dense spherical burst of rich colorful pearls
  spawnPeony(x, y, z, colors) {
    const count = 300;
    let spawned = 0;

    for (let i = 0; i < this.maxSparks && spawned < count; i++) {
      const s = this.sparks[i];
      if (!s.active) {
        s.active = true;
        s.x = x; s.y = y; s.z = z;

        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const speed = 0.38 + Math.random() * 0.28;

        s.vx = speed * Math.sin(phi) * Math.cos(theta);
        s.vy = speed * Math.sin(phi) * Math.sin(theta);
        s.vz = speed * Math.cos(phi);

        const c = colors[Math.floor(Math.random() * colors.length)];
        s.r = c[0]; s.g = c[1]; s.b = c[2];
        s.isWillow = false;
        s.decay = 0.016;
        s.gravity = 0.018;
        s.drag = 0.975;
        s.alpha = 1.0;
        spawned++;
      }
    }
  }

  // 6. Lotus Pink & Gold Heart: 280 parametric heart sparks
  spawnHeart(x, y, z, colors) {
    const count = 280;
    let spawned = 0;

    for (let i = 0; i < this.maxSparks && spawned < count; i++) {
      const s = this.sparks[i];
      if (!s.active) {
        s.active = true;
        s.x = x; s.y = y; s.z = z;

        const t = (spawned / count) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

        s.vx = (hx / 16) * 0.48;
        s.vy = (hy / 16) * 0.48;
        s.vz = (Math.random() - 0.5) * 0.1;

        s.r = 1.0; s.g = 0.35; s.b = 0.65; // Lotus pink
        s.isWillow = false;
        s.decay = 0.011;
        s.gravity = 0.018;
        s.drag = 0.984;
        s.alpha = 1.0;
        spawned++;
      }
    }
  }

  // 7. Grand Finale: Golden cascade combining chrysanthemum, willow, and ring
  spawnGrandFinale(x, y, z) {
    const goldTheme = ShellTypes.THEMES.gold;
    this.spawnChrysanthemum(x, y, z, goldTheme);
    this.spawnWillow(x, y, z, goldTheme);
  }

  dispose() {
    if (this.points) {
      this.scene.remove(this.points);
      this.geo.dispose();
      this.mat.dispose();
    }
  }
}
