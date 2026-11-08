/**
 * Scene1FirstLight — Photorealistic Handcrafted Terracotta Clay Diya & Living Teardrop Flame
 */

import * as THREE from 'three';
import { ProceduralTextures } from '../textures/ProceduralTextures.js';

export class Scene1FirstLight {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // 1. Handcrafted Heavy Brass Pooja Thali Base
    const thaliGeo = new THREE.CylinderGeometry(5.2, 5.4, 0.18, 48);
    const thaliMat = new THREE.MeshStandardMaterial({
      color: 0xd4a017,
      metalness: 0.85,
      roughness: 0.22
    });
    const thali = new THREE.Mesh(thaliGeo, thaliMat);
    thali.position.set(0, 0.09, 0);
    this.group.add(thali);

    // 2. Authentic Terracotta Clay Diya Bowl with Pinched Spout
    const points = [];
    points.push(new THREE.Vector2(0, 0));
    points.push(new THREE.Vector2(1.3, 0.08));
    points.push(new THREE.Vector2(2.0, 0.38));
    points.push(new THREE.Vector2(2.35, 0.8));
    points.push(new THREE.Vector2(2.5, 1.05)); // Rolled clay lip
    points.push(new THREE.Vector2(2.2, 1.0));
    points.push(new THREE.Vector2(1.6, 0.6));
    points.push(new THREE.Vector2(0.55, 0.26));
    points.push(new THREE.Vector2(0, 0.23));

    const diyaGeo = new THREE.LatheGeometry(points, 48);
    const diyaTex = ProceduralTextures.createDiyaTexture();
    const diyaMat = new THREE.MeshStandardMaterial({
      map: diyaTex,
      color: 0x9e4322,
      roughness: 0.72,
      metalness: 0.16
    });

    this.diyaMesh = new THREE.Mesh(diyaGeo, diyaMat);
    this.diyaMesh.position.set(0, 0.18, 0);
    this.group.add(this.diyaMesh);

    // 3. Liquid Ghee / Sesame Oil Layer inside the bowl
    const oilGeo = new THREE.CylinderGeometry(1.58, 1.58, 0.05, 32);
    const oilTex = ProceduralTextures.createGheeOilTexture();
    const oilMat = new THREE.MeshStandardMaterial({
      map: oilTex,
      roughness: 0.12,
      metalness: 0.3,
      transparent: true,
      opacity: 0.92
    });
    const oilMesh = new THREE.Mesh(oilGeo, oilMat);
    oilMesh.position.set(0, 0.62, 0);
    this.group.add(oilMesh);

    // 4. Hand-Rolled Cotton Oil Wick (Batti) with Charred Carbon Tip
    const wickGeo = new THREE.CylinderGeometry(0.08, 0.11, 0.68, 12);
    const wickMat = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.95 });
    const wick = new THREE.Mesh(wickGeo, wickMat);
    wick.position.set(0.65, 0.92, 0);
    wick.rotation.z = -Math.PI * 0.18;
    this.group.add(wick);

    // 5. Photorealistic Teardrop Flame Geometry & Custom GLSL Shader
    const flameProfile = [];
    flameProfile.push(new THREE.Vector2(0.01, 1.6));  // Tapered tip
    flameProfile.push(new THREE.Vector2(0.2, 1.25));
    flameProfile.push(new THREE.Vector2(0.42, 0.75)); // Bulbous body
    flameProfile.push(new THREE.Vector2(0.35, 0.3));
    flameProfile.push(new THREE.Vector2(0.12, 0.0));  // Base at wick
    flameProfile.push(new THREE.Vector2(0.01, 0.0));

    const flameGeo = new THREE.LatheGeometry(flameProfile, 24);

    this.flameMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        flicker: { value: 1.0 }
      },
      vertexShader: `
        uniform float time;
        uniform float flicker;
        varying vec2 vUv;
        varying float vY;

        void main() {
          vUv = uv;
          vY = position.y;
          vec3 pos = position;

          // Organic thermal draft flutter
          float wind = sin(time * 7.5 + position.y * 3.5) * 0.06 * position.y;
          float flutter = cos(time * 11.0) * 0.04 * position.y;
          pos.x += wind * flicker;
          pos.z += flutter * flicker;
          pos.y *= 1.0 + (sin(time * 9.0) * 0.04 * flicker);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float flicker;
        varying vec2 vUv;
        varying float vY;

        void main() {
          float t = clamp(vY / 1.6, 0.0, 1.0);
          
          // Combustion Zones:
          vec3 blueBase = vec3(0.08, 0.35, 0.95);    // Hydrocarbon radical base
          vec3 fieryAmber = vec3(1.0, 0.28, 0.02);   // Combustion boundary
          vec3 saffronGold = vec3(1.0, 0.72, 0.05);  // Luminous mantle
          vec3 coreWhite = vec3(1.0, 0.98, 0.92);    // Incandescent hot core (>1200C)

          vec3 col = mix(blueBase, fieryAmber, smoothstep(0.0, 0.16, t));
          col = mix(col, saffronGold, smoothstep(0.14, 0.65, t));
          col = mix(col, coreWhite, smoothstep(0.48, 0.92, t));

          float alpha = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.68, vUv.y) * 0.95;
          gl_FragColor = vec4(col * (1.3 + flicker * 0.35), alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.flameMesh = new THREE.Mesh(flameGeo, this.flameMaterial);
    this.flameMesh.position.set(0.68, 0.95, 0);
    this.group.add(this.flameMesh);

    // 6. Garland of 28 Fresh Marigold Blossoms (Genda Phool)
    const marigoldTex = ProceduralTextures.createMarigoldTexture();
    const marigoldMat = new THREE.MeshStandardMaterial({
      map: marigoldTex,
      roughness: 0.65,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide
    });
    const marigoldGeo = new THREE.PlaneGeometry(1.3, 1.3);

    const blossomCount = 28;
    const ringRadius = 3.6;

    for (let i = 0; i < blossomCount; i++) {
      const angle = (i / blossomCount) * Math.PI * 2;
      const flower = new THREE.Mesh(marigoldGeo, marigoldMat);
      flower.position.set(
        Math.cos(angle) * ringRadius,
        0.22,
        Math.sin(angle) * ringRadius
      );
      flower.rotation.x = -Math.PI / 2;
      flower.rotation.z = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.4;
      this.group.add(flower);
    }

    // 7. Rising Golden Embers from the Diya Flame
    const emberCount = 24;
    this.embersGeo = new THREE.BufferGeometry();
    this.emberPositions = new Float32Array(emberCount * 3);
    this.emberData = [];

    for (let i = 0; i < emberCount; i++) {
      this.emberPositions[i * 3] = 0.68;
      this.emberPositions[i * 3 + 1] = 1.68;
      this.emberPositions[i * 3 + 2] = 0;
      this.emberData.push({
        y: 1.68 + Math.random() * 2.8,
        speed: 0.02 + Math.random() * 0.02,
        wobble: Math.random() * 10
      });
    }

    this.embersGeo.setAttribute('position', new THREE.BufferAttribute(this.emberPositions, 3));
    const sparkTex = ProceduralTextures.createSparkGlowTexture();
    const emberMat = new THREE.PointsMaterial({
      map: sparkTex,
      size: 1.2,
      color: 0xffcc44,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.embers = new THREE.Points(this.embersGeo, emberMat);
    this.group.add(this.embers);

    // Dynamic warm Point Light from Diya Flame
    this.pointLight = new THREE.PointLight(0xffa228, 5.5, 45, 1.2);
    this.pointLight.position.set(0.68, 1.5, 0);
    this.group.add(this.pointLight);

    this.scene.add(this.group);
  }

  update(dt, time) {
    if (!this.group.visible) return;

    // Organic flame flicker
    const flameFlicker = 0.92 + Math.sin(time * 8.0) * 0.14 + Math.cos(time * 14.0) * 0.09;
    if (this.flameMaterial) {
      this.flameMaterial.uniforms.time.value = time;
      this.flameMaterial.uniforms.flicker.value = flameFlicker;
    }
    if (this.pointLight) {
      this.pointLight.intensity = 5.2 * flameFlicker;
    }

    // Rising golden sparks
    if (this.embers) {
      const pos = this.emberPositions;
      for (let i = 0; i < this.emberData.length; i++) {
        const ed = this.emberData[i];
        ed.y += ed.speed * dt;
        const wobble = Math.sin(time * 4.0 + ed.wobble) * 0.12;

        pos[i * 3] = 0.68 + wobble;
        pos[i * 3 + 1] = ed.y;
        pos[i * 3 + 2] = Math.cos(time * 3.5 + ed.wobble) * 0.1;

        if (ed.y > 4.2) {
          ed.y = 1.68;
        }
      }
      this.embersGeo.attributes.position.needsUpdate = true;
    }
  }

  setVisible(visible) {
    this.group.visible = visible;
  }

  dispose() {
    this.scene.remove(this.group);
  }
}
