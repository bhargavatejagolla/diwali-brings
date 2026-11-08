/**
 * FireworksController — Event-Driven Master Pyrotechnics Engine
 * Manages rocket trajectories, spark physics, shell types, environmental flash lights,
 * sound synchrony, and grand finale sequences.
 */

import * as THREE from 'three';
import { Rocket } from './Rocket.js';
import { SparkParticleSystem } from './SparkParticleSystem.js';
import { ShellTypes } from './ShellTypes.js';
import { audioSynth } from '../audio/AudioEngine.js';
import { haptics } from '../interactions/haptics.js';
import { gsap } from 'gsap';

export class FireworksController {
  constructor(scene) {
    this.scene = scene;

    // 1. Particle Sparks System
    this.sparkSystem = new SparkParticleSystem(scene);

    // 2. Rocket Projectiles Pool (8 reusable rockets)
    this.rockets = [];
    for (let i = 0; i < 8; i++) {
      this.rockets.push(new Rocket(scene));
    }

    // 3. Environmental Explosive Flash Light (Illuminates Palace & Sky)
    this.flashLight = new THREE.PointLight(0xffeedd, 0.0, 260, 1.1);
    this.flashLight.position.set(0, 24, -6);
    this.scene.add(this.flashLight);
  }

  // Launch a firework by 3D world target
  launch(targetX = 0, targetY = 22, theme = 'gold', type = 'chrysanthemum') {
    audioSynth.playRocketLaunch();

    const r = this.rockets.find(rk => !rk.active) || this.rockets[0];
    const z = -6 + (Math.random() - 0.5) * 8;
    r.launch(targetX, targetY, z, theme, type);
  }

  // Launch a firework by screen click / tap coordinates
  launchFromScreen(clientX, clientY, width, height, theme = 'gold', type = 'chrysanthemum') {
    const targetX = (clientX / width - 0.5) * 28;
    const targetY = 16 + (1.0 - clientY / height) * 12;
    this.launch(targetX, targetY, theme, type);
  }

  // Detonation Phase: Audio + Environmental Flash + Spark Shell
  detonate(x, y, z, theme = 'gold', type = 'chrysanthemum') {
    // 1. Audio Concussion & Haptics (Safely guarded)
    try {
      if (audioSynth?.playBurstBoom) audioSynth.playBurstBoom();
      if (haptics?.fireworkExplosion) haptics.fireworkExplosion();
      else if (haptics?.fireworkBurst) haptics.fireworkBurst();
    } catch (e) {
      // Non-blocking
    }

    // 2. Dynamic Explosive Flash
    if (this.flashLight) {
      this.flashLight.position.set(x, y, z);
      const hex = ShellTypes.FLASH_COLORS[theme] || 0xffeedd;
      this.flashLight.color.setHex(hex);
      this.flashLight.intensity = 24.0;

      gsap.to(this.flashLight, {
        intensity: 0,
        duration: 0.65,
        ease: 'power2.out'
      });
    }

    // 3. Dispatch to Spark System
    const colors = ShellTypes.THEMES[theme] || ShellTypes.THEMES.gold;

    switch (type) {
      case 'willow':
        this.sparkSystem.spawnWillow(x, y, z, colors);
        break;
      case 'peacock':
        this.sparkSystem.spawnPeacock(x, y, z);
        break;
      case 'ring':
        this.sparkSystem.spawnRing(x, y, z, colors);
        break;
      case 'peony':
        this.sparkSystem.spawnPeony(x, y, z, colors);
        break;
      case 'heart':
        this.sparkSystem.spawnHeart(x, y, z, colors);
        break;
      case 'chrysanthemum':
      default:
        this.sparkSystem.spawnChrysanthemum(x, y, z, colors);
        break;
    }
  }

  // Choreographed Multi-Gun Barrage
  launchBarrage(theme = 'gold', type = 'willow') {
    this.launch(0, 23, theme, type);
    setTimeout(() => {
      this.launch(-7, 21, theme, 'chrysanthemum');
      this.launch(7, 21, theme, type);
    }, 240);
  }

  // Grand Golden Finale Sequence
  triggerGrandFinale() {
    this.launch(0, 24, 'gold', 'willow');
    setTimeout(() => {
      this.launch(-8, 22, 'teal', 'peacock');
      this.launch(8, 22, 'pink', 'heart');
    }, 280);
    setTimeout(() => {
      this.launch(-4, 25, 'violet', 'ring');
      this.launch(4, 25, 'gold', 'chrysanthemum');
    }, 560);
    setTimeout(() => {
      this.launch(0, 26, 'gold', 'willow');
    }, 900);
  }

  update(dt) {
    // 1. Update Rockets
    for (const r of this.rockets) {
      r.update(dt, (x, y, z, theme, type) => {
        this.detonate(x, y, z, theme, type);
      });
    }

    // 2. Update Sparks
    this.sparkSystem.update(dt);
  }

  dispose() {
    this.sparkSystem.dispose();
    this.rockets.forEach(r => r.dispose());
    if (this.flashLight) this.scene.remove(this.flashLight);
  }
}
