/**
 * SkyAndEnvironment — Cosmic Starfield, Sky Dome, Indian Palace Silhouettes,
 * Polished Marble Terrace, and Drifting Stardust Motes
 */

import * as THREE from 'three';
import { ProceduralTextures } from '../textures/ProceduralTextures.js';

export class SkyAndEnvironment {
  constructor(scene) {
    this.scene = scene;

    this.initSkyDome();
    this.initStarfield();
    this.initPalaceArchitecture();
    this.initPolishedMarbleTerrace();
    this.initStardustMotes();
  }

  initSkyDome() {
    const skyGeo = new THREE.SphereGeometry(380, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x060c24) },
        midColor: { value: new THREE.Color(0x161e46) },
        horizonColor: { value: new THREE.Color(0x352654) }, // Festival horizon glow
        cityGlowColor: { value: new THREE.Color(0x7c3b16) } // Distant city diya glow
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 horizonColor;
        uniform vec3 cityGlowColor;
        varying vec3 vWorldPosition;

        void main() {
          float h = normalize(vWorldPosition).y;
          vec3 col;
          if (h > 0.3) {
            col = mix(midColor, topColor, (h - 0.3) / 0.7);
          } else if (h > 0.05) {
            col = mix(horizonColor, midColor, (h - 0.05) / 0.25);
          } else {
            col = mix(cityGlowColor, horizonColor, max((h + 0.1) / 0.15, 0.0));
          }
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false
    });

    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);
  }

  initStarfield() {
    const starCount = 2400;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    const goldStar = new THREE.Color(0xfff3d4);
    const cyanStar = new THREE.Color(0xd6eaff);
    const sapphireStar = new THREE.Color(0x99bbff);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 260 + Math.random() * 80;

      const y = Math.abs(r * Math.cos(phi)) + 12;
      const x = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.sin(phi) * Math.cos(theta);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      let c = goldStar;
      if (Math.random() > 0.6) c = cyanStar;
      else if (Math.random() > 0.85) c = sapphireStar;

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = 1.4 + Math.random() * 2.2;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const sparkTex = ProceduralTextures.createSparkGlowTexture();
    const starMat = new THREE.PointsMaterial({
      map: sparkTex,
      size: 2.4,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.starPoints = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starPoints);
  }

  initPalaceArchitecture() {
    this.palaceGroup = new THREE.Group();
    const sandstoneMat = new THREE.MeshStandardMaterial({
      color: 0x1e1934,
      roughness: 0.82,
      metalness: 0.12
    });

    // Central Grand Rajput Jharokha Pavilion (z = -48)
    const domeGeo = new THREE.SphereGeometry(14, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const mainDome = new THREE.Mesh(domeGeo, sandstoneMat);
    mainDome.position.set(0, 16, -48);

    // Golden Kalash Spire
    const spireGeo = new THREE.CylinderGeometry(0.2, 0.8, 4.5, 12);
    const spireMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
    const kalash = new THREE.Mesh(spireGeo, spireMat);
    kalash.position.set(0, 31, -48);

    const baseGeo = new THREE.CylinderGeometry(14, 14, 12, 32);
    const mainBase = new THREE.Mesh(baseGeo, sandstoneMat);
    mainBase.position.set(0, 8, -48);

    this.palaceGroup.add(mainDome, kalash, mainBase);

    // Left and Right Symmetrical Minarets & Chatris
    const chatriOffsets = [-36, -20, 20, 36];
    chatriOffsets.forEach(x => {
      const pCyl = new THREE.CylinderGeometry(2.2, 2.6, 24, 16);
      const pillar = new THREE.Mesh(pCyl, sandstoneMat);
      pillar.position.set(x, 10, -46);

      const pDome = new THREE.SphereGeometry(3.4, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const smallDome = new THREE.Mesh(pDome, sandstoneMat);
      smallDome.position.set(x, 22.5, -46);

      const pSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.35, 2.5, 8), spireMat);
      pSpire.position.set(x, 26.5, -46);

      this.palaceGroup.add(pillar, smallDome, pSpire);
    });

    // Terrace Parapet Wall lined with 36 Small Glowing Earthen Diyas
    const wallGeo = new THREE.BoxGeometry(110, 3.2, 3.2);
    const wall = new THREE.Mesh(wallGeo, sandstoneMat);
    wall.position.set(0, 1.6, -42);
    this.palaceGroup.add(wall);

    const sparkTex = ProceduralTextures.createSparkGlowTexture();
    const parapetFlameMat = new THREE.SpriteMaterial({
      map: sparkTex,
      color: 0xffa422,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const diyaCount = 36;
    for (let i = 0; i < diyaCount; i++) {
      const x = -50 + (i / (diyaCount - 1)) * 100;
      const flameSprite = new THREE.Sprite(parapetFlameMat);
      flameSprite.position.set(x, 3.6, -41.5);
      flameSprite.scale.set(0.85, 1.1, 1);
      this.palaceGroup.add(flameSprite);
    }

    this.scene.add(this.palaceGroup);
  }

  initPolishedMarbleTerrace() {
    const terraceGeo = new THREE.PlaneGeometry(160, 160);
    const marbleTex = ProceduralTextures.createMarbleFloorTexture();

    const terraceMat = new THREE.MeshStandardMaterial({
      map: marbleTex,
      color: 0x121832,
      roughness: 0.18,
      metalness: 0.42
    });

    this.terraceMesh = new THREE.Mesh(terraceGeo, terraceMat);
    this.terraceMesh.rotation.x = -Math.PI / 2;
    this.terraceMesh.position.y = 0;
    this.scene.add(this.terraceMesh);
  }

  initStardustMotes() {
    const count = 250;
    this.stardustGeo = new THREE.BufferGeometry();
    this.stardustPositions = new Float32Array(count * 3);
    this.stardustData = [];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 60;
      const y = Math.random() * 18 + 0.5;
      const z = (Math.random() - 0.5) * 50 - 5;

      this.stardustPositions[i * 3] = x;
      this.stardustPositions[i * 3 + 1] = y;
      this.stardustPositions[i * 3 + 2] = z;

      this.stardustData.push({
        vx: (Math.random() - 0.5) * 0.015,
        vy: 0.012 + Math.random() * 0.02,
        vz: (Math.random() - 0.5) * 0.015
      });
    }

    this.stardustGeo.setAttribute('position', new THREE.BufferAttribute(this.stardustPositions, 3));
    const sparkTex = ProceduralTextures.createSparkGlowTexture();
    const stardustMat = new THREE.PointsMaterial({
      map: sparkTex,
      size: 1.4,
      color: 0xffd97d,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.stardustPoints = new THREE.Points(this.stardustGeo, stardustMat);
    this.scene.add(this.stardustPoints);
  }

  update(dt) {
    if (this.stardustPoints) {
      const pos = this.stardustPositions;
      for (let i = 0; i < this.stardustData.length; i++) {
        const sd = this.stardustData[i];
        pos[i * 3] += sd.vx * dt;
        pos[i * 3 + 1] += sd.vy * dt;
        pos[i * 3 + 2] += sd.vz * dt;

        if (pos[i * 3 + 1] > 18.0) {
          pos[i * 3 + 1] = 0.5;
        }
      }
      this.stardustGeo.attributes.position.needsUpdate = true;
    }
  }
}
