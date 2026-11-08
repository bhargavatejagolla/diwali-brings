/**
 * Rocket — Ascending Pyrotechnic Missile with Tracer Sparks & Physics
 */

import * as THREE from 'three';
import { ProceduralTextures } from '../textures/ProceduralTextures.js';

export class Rocket {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.vy = 0;
    this.targetY = 22;
    this.theme = 'gold';
    this.type = 'chrysanthemum';

    const sparkTex = ProceduralTextures.createSparkGlowTexture();
    const mat = new THREE.SpriteMaterial({
      map: sparkTex,
      color: 0xffffff,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.sprite = new THREE.Sprite(mat);
    this.sprite.visible = false;
    this.sprite.scale.set(1.6, 1.6, 1);
    this.scene.add(this.sprite);
  }

  launch(x, targetY, z, theme = 'gold', type = 'chrysanthemum') {
    this.active = true;
    this.x = x;
    this.y = 0.5;
    this.z = z;
    this.vy = 0.55 + Math.random() * 0.12;
    this.targetY = targetY;
    this.theme = theme;
    this.type = type;

    this.sprite.visible = true;
    this.sprite.position.set(this.x, this.y, this.z);
  }

  update(dt, onDetonate) {
    if (!this.active) return;

    this.y += this.vy * dt;
    this.sprite.position.set(this.x, this.y, this.z);

    // Reached apex / target detonation ceiling
    if (this.y >= this.targetY) {
      this.active = false;
      this.sprite.visible = false;
      if (onDetonate) {
        onDetonate(this.x, this.y, this.z, this.theme, this.type);
      }
    }
  }

  dispose() {
    if (this.sprite) {
      this.scene.remove(this.sprite);
      this.sprite.material.dispose();
    }
  }
}
