/**
 * LightingSystem — Celestial Moonlight, Festive Horizon Fill & Dynamic Atmosphere
 */

import * as THREE from 'three';

export class LightingSystem {
  constructor(scene) {
    this.scene = scene;

    // Rich royal ambient light (deep midnight indigo & sapphire)
    this.ambientLight = new THREE.AmbientLight(0x1a2656, 1.6);
    this.scene.add(this.ambientLight);

    // Celestial moonlight from above
    this.moonLight = new THREE.DirectionalLight(0xb0d2f8, 1.25);
    this.moonLight.position.set(25, 45, 30);
    this.scene.add(this.moonLight);

    // Warm golden festival horizon fill light
    this.warmFillLight = new THREE.DirectionalLight(0xffaa44, 0.85);
    this.warmFillLight.position.set(-20, 25, 10);
    this.scene.add(this.warmFillLight);
  }
}
