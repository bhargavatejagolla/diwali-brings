/**
 * Scene2Rangoli — Sacred Indian Rangoli Mandala & 16 Real Earthen Lamps
 */

import * as THREE from 'three';
import { ProceduralTextures } from '../textures/ProceduralTextures.js';

export class Scene2Rangoli {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.position.set(0, 0.02, 0);

    // Stone Courtyard Altar with Handcrafted Indian Rangoli Mandala
    const rangoliGeo = new THREE.CylinderGeometry(8.5, 8.8, 0.35, 64);
    const rangoliTex = ProceduralTextures.createRangoliTexture();

    const rangoliMat = new THREE.MeshStandardMaterial({
      map: rangoliTex,
      roughness: 0.78,
      metalness: 0.12
    });

    this.rangoliAltar = new THREE.Mesh(rangoliGeo, rangoliMat);
    this.group.add(this.rangoliAltar);

    // 16 Real Glowing Earthen Lamps around the Rangoli Perimeter
    this.lamps = [];
    const lampCount = 16;
    const lampRadius = 7.6;
    const diyaTex = ProceduralTextures.createDiyaTexture();
    const miniDiyaMat = new THREE.MeshStandardMaterial({ map: diyaTex, roughness: 0.8 });
    const miniDiyaGeo = new THREE.CylinderGeometry(0.42, 0.3, 0.26, 16);

    const sparkTex = ProceduralTextures.createSparkGlowTexture();
    const flameMat = new THREE.SpriteMaterial({
      map: sparkTex,
      color: 0xffa828,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    for (let i = 0; i < lampCount; i++) {
      const angle = (i / lampCount) * Math.PI * 2;
      const x = Math.cos(angle) * lampRadius;
      const z = Math.sin(angle) * lampRadius;

      const lamp = new THREE.Mesh(miniDiyaGeo, miniDiyaMat);
      lamp.position.set(x, 0.28, z);

      const flameSprite = new THREE.Sprite(flameMat);
      flameSprite.position.set(0, 0.35, 0);
      flameSprite.scale.set(0.9, 1.2, 1);
      lamp.add(flameSprite);

      this.group.add(lamp);
      this.lamps.push({ lamp, flame: flameSprite, seed: Math.random() * 10 });
    }

    this.group.visible = false;
    this.scene.add(this.group);
  }

  update(dt, time) {
    if (!this.group.visible) return;

    // Organic lamp flame breathing
    for (const l of this.lamps) {
      const flick = 0.9 + Math.sin(time * 6.0 + l.seed) * 0.12;
      l.flame.scale.set(0.9 * flick, 1.2 * flick, 1);
    }
  }

  setVisible(visible) {
    this.group.visible = visible;
  }

  dispose() {
    this.scene.remove(this.group);
  }
}
