/**
 * Scene5Fireworks — Celestial Sky Finale & Wish Lantern Ascension
 * Manages the connection between the UI, the wish release event, and the FireworksController.
 */

import * as THREE from 'three';
import { FireworksController } from '../pyrotechnics/FireworksController.js';
import { ProceduralTextures } from '../textures/ProceduralTextures.js';

export class Scene5Fireworks {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // 1. Master Pyrotechnics Engine
    this.controller = new FireworksController(scene);

    // 2. Ascending Wish Lantern (Liftoff when wish is submitted)
    this.wishLanterns = [];
    const lanternTex = ProceduralTextures.createLanternPaperTexture();
    this.lanternGeo = new THREE.CylinderGeometry(0.85, 0.72, 1.8, 8);
    this.lanternMat = new THREE.MeshStandardMaterial({
      map: lanternTex,
      emissive: 0xffbb44,
      emissiveIntensity: 1.2,
      roughness: 0.35,
      transparent: true,
      opacity: 0.98
    });

    this.group.visible = false;
    this.scene.add(this.group);
  }

  launch(targetX, targetY, theme, type) {
    this.controller.launch(targetX, targetY, theme, type);
  }

  launchFromScreen(clientX, clientY, width, height, theme, type) {
    this.controller.launchFromScreen(clientX, clientY, width, height, theme, type);
  }

  launchBarrage(theme, type) {
    this.controller.launchBarrage(theme, type);
  }

  triggerGrandFinale() {
    this.controller.triggerGrandFinale();
  }

  // Release a personal wish carried aloft by a glowing golden sky lantern
  releaseWish(wishText) {
    const lantern = new THREE.Mesh(this.lanternGeo, this.lanternMat);
    lantern.position.set(0, 1.0, 4.0);
    lantern.userData = {
      vy: 0.08,
      wobble: 0,
      swaySpeed: 1.2
    };
    this.group.add(lantern);
    this.wishLanterns.push(lantern);

    // Flank with celebratory multi-firework barrage
    this.controller.triggerGrandFinale();
  }

  update(dt, time) {
    // Update Pyrotechnics simulation
    this.controller.update(dt);

    // Update ascending wish lanterns
    for (let i = this.wishLanterns.length - 1; i >= 0; i--) {
      const l = this.wishLanterns[i];
      l.position.y += l.userData.vy * dt;
      l.position.x += Math.sin(time * l.userData.swaySpeed) * 0.02 * dt;
      l.position.z -= 0.02 * dt;

      // Remove after drifting into upper cosmos
      if (l.position.y > 45) {
        this.group.remove(l);
        this.wishLanterns.splice(i, 1);
      }
    }
  }

  setVisible(visible) {
    this.group.visible = visible;
  }

  dispose() {
    this.controller.dispose();
    this.scene.remove(this.group);
  }
}
