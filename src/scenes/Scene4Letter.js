/**
 * Scene4Letter — Serene Moonlit Terrace Alcove for Dharvi Shravya's Letter
 */

import * as THREE from 'three';

export class Scene4Letter {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Soft warm candlelight alcove light
    this.alcoveLight = new THREE.PointLight(0xffbe5c, 2.2, 20, 1.4);
    this.alcoveLight.position.set(0, 2.5, 2.0);
    this.group.add(this.alcoveLight);

    this.group.visible = false;
    this.scene.add(this.group);
  }

  update(dt, time) {
    if (!this.group.visible) return;
    // Gentle breathing pulsation of alcove light
    this.alcoveLight.intensity = 2.0 + Math.sin(time * 3.0) * 0.25;
  }

  setVisible(visible) {
    this.group.visible = visible;
  }

  dispose() {
    this.scene.remove(this.group);
  }
}
