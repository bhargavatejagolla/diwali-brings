/**
 * SceneManager — Coordinates Camera Choreography, Viewpoints,
 * Strict Scene Isolation, and Parallax Dynamics.
 */

import * as THREE from 'three';
import { gsap } from 'gsap';

export class SceneManager {
  constructor(camera, scenes) {
    this.camera = camera;
    this.scenes = scenes;
    this.currentScene = 1;

    this.sceneViewpoints = {
      1: { pos: new THREE.Vector3(0, 2.4, 9.2), target: new THREE.Vector3(0, 0.65, 0) },
      2: { pos: new THREE.Vector3(0, 13.0, 11.5), target: new THREE.Vector3(0, -0.2, 0) },
      3: { pos: new THREE.Vector3(0, 4.2, 18.5), target: new THREE.Vector3(0, 3.5, 0) },
      4: { pos: new THREE.Vector3(0, 1.8, 8.5), target: new THREE.Vector3(0, 0.85, 0) },
      5: { pos: new THREE.Vector3(0, 6.0, 23.0), target: new THREE.Vector3(0, 17.5, -8.0) }
    };

    this.cameraTarget = new THREE.Vector3().copy(this.sceneViewpoints[1].target);
    this.currentLookAt = new THREE.Vector3().copy(this.cameraTarget);

    // Initial setup
    this.camera.position.copy(this.sceneViewpoints[1].pos);
    this.applyIsolation(1);
  }

  setScene(target) {
    if (target < 1 || target > 5) return;
    this.currentScene = target;
    const vp = this.sceneViewpoints[target] || this.sceneViewpoints[1];

    // Smooth Dolly Camera Choreography
    gsap.to(this.camera.position, {
      x: vp.pos.x,
      y: vp.pos.y,
      z: vp.pos.z,
      duration: 1.5,
      ease: 'power3.inOut'
    });

    gsap.to(this.cameraTarget, {
      x: vp.target.x,
      y: vp.target.y,
      z: vp.target.z,
      duration: 1.5,
      ease: 'power3.inOut'
    });

    this.applyIsolation(target);
  }

  applyIsolation(sceneNum) {
    if (this.scenes.scene1) this.scenes.scene1.setVisible(sceneNum === 1);
    if (this.scenes.scene2) this.scenes.scene2.setVisible(sceneNum === 2);
    if (this.scenes.scene3) this.scenes.scene3.setVisible(sceneNum === 3);
    if (this.scenes.scene4) this.scenes.scene4.setVisible(sceneNum === 4);
    if (this.scenes.scene5) this.scenes.scene5.setVisible(sceneNum === 5);
  }

  updateParallax(tiltX, tiltY) {
    this.currentLookAt.x = this.cameraTarget.x + tiltX * 0.6;
    this.currentLookAt.y = this.cameraTarget.y + tiltY * 0.4;
    this.currentLookAt.z = this.cameraTarget.z;
    this.camera.lookAt(this.currentLookAt);
  }
}
