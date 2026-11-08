/**
 * Scene3Garden — Illuminated Royal Palace Terrace & Akash Kandil Sky Lanterns
 * Dedicated to Dharvi Shravya — Open cinematic composition with carved jali screens
 */

import * as THREE from 'three';
import { ProceduralTextures } from '../textures/ProceduralTextures.js';

export class Scene3Garden {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Elegant carved Rajasthani Jali Screens positioned laterally (x = -19, 19)
    // to frame the scene beautifully without blocking text or camera
    const jaliTex = ProceduralTextures.createJaliScreenTexture();
    const jaliMat = new THREE.MeshStandardMaterial({
      map: jaliTex,
      transparent: true,
      roughness: 0.85,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const jaliGeo = new THREE.PlaneGeometry(6, 12);

    [-19, 19].forEach(x => {
      const screen = new THREE.Mesh(jaliGeo, jaliMat);
      screen.position.set(x, 6, 2);
      screen.rotation.y = (x < 0 ? 1 : -1) * 0.35;
      this.group.add(screen);
    });

    // 24 Traditional Akash Kandil (Diwali Sky Lanterns) with Warm Inner Glow
    this.lanterns = [];
    const lanternTex = ProceduralTextures.createLanternPaperTexture();
    const lanternGeo = new THREE.CylinderGeometry(0.75, 0.65, 1.6, 8);
    const lanternMat = new THREE.MeshStandardMaterial({
      map: lanternTex,
      emissive: 0xffaa33,
      emissiveIntensity: 0.95,
      roughness: 0.45,
      transparent: true,
      opacity: 0.95
    });

    for (let i = 0; i < 24; i++) {
      const lantern = new THREE.Mesh(lanternGeo, lanternMat);
      lantern.position.set(
        (Math.random() - 0.5) * 42,
        Math.random() * 26 + 2,
        (Math.random() - 0.5) * 22 - 2
      );
      lantern.userData = {
        vy: 0.025 + Math.random() * 0.02,
        swaySpeed: 0.8 + Math.random() * 0.5,
        swayAmp: 0.2 + Math.random() * 0.15,
        seed: Math.random() * 10
      };
      this.group.add(lantern);
      this.lanterns.push(lantern);
    }

    // 40 Tumbling Fresh Marigold Petals
    this.petals = [];
    const marigoldTex = ProceduralTextures.createMarigoldTexture();
    const petalGeo = new THREE.PlaneGeometry(0.55, 0.7);
    const petalMat = new THREE.MeshStandardMaterial({
      map: marigoldTex,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.05,
      roughness: 0.8
    });

    for (let i = 0; i < 40; i++) {
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(
        (Math.random() - 0.5) * 35,
        Math.random() * 18 + 2,
        (Math.random() - 0.5) * 22
      );
      petal.userData = {
        vy: -0.03 - Math.random() * 0.025,
        vx: (Math.random() - 0.5) * 0.018,
        vRotX: (Math.random() - 0.5) * 0.04,
        vRotY: (Math.random() - 0.5) * 0.05
      };
      this.group.add(petal);
      this.petals.push(petal);
    }

    this.group.visible = false;
    this.scene.add(this.group);
  }

  update(dt, time) {
    if (!this.group.visible) return;

    // Lanterns floating and swaying
    for (const l of this.lanterns) {
      l.position.y += l.userData.vy * dt;
      l.position.x += Math.sin(time * l.userData.swaySpeed + l.userData.seed) * l.userData.swayAmp * 0.02 * dt;
      if (l.position.y > 28) {
        l.position.y = 1.0;
        l.position.x = (Math.random() - 0.5) * 42;
      }
    }

    // Petals tumbling
    for (const p of this.petals) {
      p.position.y += p.userData.vy * dt;
      p.position.x += p.userData.vx * dt;
      p.rotation.x += p.userData.vRotX * dt;
      p.rotation.y += p.userData.vRotY * dt;
      if (p.position.y < 0.1) {
        p.position.y = 18.0;
        p.position.x = (Math.random() - 0.5) * 35;
      }
    }
  }

  setVisible(visible) {
    this.group.visible = visible;
  }

  dispose() {
    this.scene.remove(this.group);
  }
}
