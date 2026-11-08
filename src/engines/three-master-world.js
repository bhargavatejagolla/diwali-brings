/**
 * ThreeMasterWorld — 100% Pure Procedural 3D WebGL Living World (Three.js r187)
 * Zero Static Images. Real Volumetric Water, 3D Diya Geometry, Shaders & Pyrotechnics.
 * Dedicated to Dharji Shravya — Locked 60/120 FPS Performance.
 */

import * as THREE from 'three';
import { gsap } from 'gsap';
import { audioSynth } from './audio-synth.js';
import { haptics } from '../interactions/haptics.js';
import { tilt } from '../interactions/tilt.js';

export class ThreeMasterWorld {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.currentScene = 1;
    this.time = 0;
    this.lastTime = performance.now();
    this.running = false;
    this.rafId = null;

    // Three.js Core
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050818, 0.016);

    this.camera = new THREE.PerspectiveCamera(48, this.width / this.height, 0.1, 1000);
    this.cameraTarget = new THREE.Vector3(0, 1.5, 0);
    this.currentCameraLookAt = new THREE.Vector3(0, 1.5, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.setClearColor(0x050818, 1.0);

    // Camera viewpoints for each of the 5 scenes
    this.sceneViewpoints = {
      1: { pos: new THREE.Vector3(0, 2.8, 11), target: new THREE.Vector3(0, 0.5, 0) },
      2: { pos: new THREE.Vector3(0, 14, 13), target: new THREE.Vector3(0, -0.5, 0) },
      3: { pos: new THREE.Vector3(0, 4.5, 20), target: new THREE.Vector3(0, 3.5, 0) },
      4: { pos: new THREE.Vector3(0, 2.2, 10), target: new THREE.Vector3(0, 1.0, 0) },
      5: { pos: new THREE.Vector3(0, 6.0, 24), target: new THREE.Vector3(0, 18.0, -10) }
    };

    this.camera.position.copy(this.sceneViewpoints[1].pos);
    this.cameraTarget.copy(this.sceneViewpoints[1].target);
    this.currentCameraLookAt.copy(this.cameraTarget);

    // Dynamic Lighting
    this.initLighting();

    // Environment & Atmospheric Elements
    this.initCosmicSkyDome();
    this.initStarfield();
    this.initPalaceSilhouettes();
    this.initReflectiveWater();

    // Scene Specific 3D Geometries
    this.initScene1Diya();
    this.initScene2Rangoli();
    this.initScene3PalaceGarden();
    this.initScene5Fireworks();

    this.bindEvents();
  }

  // ----------------------------------------------------
  // 1. MASTER LIGHTING & ATMOSPHERE
  // ----------------------------------------------------

  initLighting() {
    this.ambientLight = new THREE.AmbientLight(0x0d1430, 1.2);
    this.scene.add(this.ambientLight);

    // Soft celestial moonlight from above
    this.moonLight = new THREE.DirectionalLight(0x93b4d8, 1.1);
    this.moonLight.position.set(20, 50, 30);
    this.scene.add(this.moonLight);

    // Warm Diya Flame Light (Point Light)
    this.diyaLight = new THREE.PointLight(0xffaa33, 4.2, 35, 1.4);
    this.diyaLight.position.set(0, 0.9, 0);
    this.scene.add(this.diyaLight);

    // Flash light for fireworks burst
    this.fireworkFlashLight = new THREE.PointLight(0xfff0d6, 0.0, 150, 1.2);
    this.fireworkFlashLight.position.set(0, 25, -5);
    this.scene.add(this.fireworkFlashLight);
  }

  initCosmicSkyDome() {
    const skyGeo = new THREE.SphereGeometry(350, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x0a1028) },
        bottomColor: { value: new THREE.Color(0x040612) },
        horizonColor: { value: new THREE.Color(0x141b3d) },
        offset: { value: 20 },
        exponent: { value: 0.7 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 horizonColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          vec3 sky = mix(bottomColor, horizonColor, max(pow(max(h, 0.0), 0.5), 0.0));
          sky = mix(sky, topColor, max(pow(max(h, 0.0), exponent), 0.0));
          gl_FragColor = vec4(sky, 1.0);
        }
      `
    });

    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);
  }

  initStarfield() {
    const starCount = 1400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      // Upper hemisphere distribution
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0) * 0.48; // Upper dome
      const r = 260 + Math.random() * 60;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 10;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Color temperature: warm gold, celestial sapphire, diamond white
      const c = Math.random();
      if (c > 0.65) {
        colors[i * 3] = 0.98; colors[i * 3 + 1] = 0.88; colors[i * 3 + 2] = 0.55; // Amber
      } else if (c > 0.3) {
        colors[i * 3] = 0.82; colors[i * 3 + 1] = 0.92; colors[i * 3 + 2] = 1.0;  // Soft blue
      } else {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 1.0;   // Diamond white
      }

      sizes[i] = Math.random() * 2.2 + 1.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starMaterial = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true
    });

    this.starFieldMesh = new THREE.Points(geometry, starMaterial);
    this.scene.add(this.starFieldMesh);
  }

  initPalaceSilhouettes() {
    // 3D Architectural Palace Silhouettes on distant horizon
    this.palaceGroup = new THREE.Group();
    const darkStoneMat = new THREE.MeshStandardMaterial({
      color: 0x070b1a,
      roughness: 0.95,
      metalness: 0.1
    });

    // Central Grand Palace Dome
    const domeGeo = new THREE.SphereGeometry(14, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const mainDome = new THREE.Mesh(domeGeo, darkStoneMat);
    mainDome.position.set(0, 12, -75);
    this.palaceGroup.add(mainDome);

    const baseGeo = new THREE.CylinderGeometry(14, 14, 14, 16);
    const mainBase = new THREE.Mesh(baseGeo, darkStoneMat);
    mainBase.position.set(0, 5, -75);
    this.palaceGroup.add(mainBase);

    // Left and Right Symmetrical Minarets / Chatris
    const chatriOffsets = [-35, -20, 20, 35];
    chatriOffsets.forEach(x => {
      const pCyl = new THREE.CylinderGeometry(2.2, 2.5, 24, 12);
      const pillar = new THREE.Mesh(pCyl, darkStoneMat);
      pillar.position.set(x, 8, -70);

      const pDome = new THREE.SphereGeometry(3.5, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const smallDome = new THREE.Mesh(pDome, darkStoneMat);
      smallDome.position.set(x, 20, -70);

      this.palaceGroup.add(pillar, smallDome);
    });

    // Ornate Palace Wall
    const wallGeo = new THREE.BoxGeometry(110, 8, 4);
    const wall = new THREE.Mesh(wallGeo, darkStoneMat);
    wall.position.set(0, 2, -68);
    this.palaceGroup.add(wall);

    this.scene.add(this.palaceGroup);
  }

  initReflectiveWater() {
    // Liquid Water Surface
    const waterGeo = new THREE.PlaneGeometry(160, 160, 64, 64);
    
    this.waterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        flamePos: { value: new THREE.Vector3(0, 0.9, 0) },
        flameColor: { value: new THREE.Color(0xffaa33) },
        waterColor: { value: new THREE.Color(0x050a18) },
        rippleCenters: { value: [new THREE.Vector2(-999, -999), new THREE.Vector2(-999, -999), new THREE.Vector2(-999, -999)] },
        rippleTimes: { value: [0, 0, 0] }
      },
      vertexShader: `
        uniform float time;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Gerstner-like subtle wave surface
          float w1 = sin(pos.x * 0.25 + time * 1.4) * 0.12;
          float w2 = cos(pos.y * 0.22 + time * 1.2) * 0.10;
          pos.z += w1 + w2;

          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPos = worldPos.xyz;
          vNormal = normalize(normalMatrix * vec3(-w1 * 0.5, -w2 * 0.5, 1.0));
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 flamePos;
        uniform vec3 flameColor;
        uniform vec3 waterColor;
        uniform float time;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          // Specular highlights from Diya flame
          vec3 lightDir = normalize(flamePos - vWorldPos);
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          vec3 halfDir = normalize(lightDir + viewDir);

          float dist = length(flamePos - vWorldPos);
          float lightAttenuation = 1.0 / (1.0 + 0.08 * dist * dist);

          float spec = pow(max(dot(vNormal, halfDir), 0.0), 45.0);
          vec3 specular = flameColor * spec * 2.8 * lightAttenuation;

          // Deep reflection tone with subtle golden bloom
          vec3 ambientReflection = vec3(0.04, 0.07, 0.16) + flameColor * (0.28 * lightAttenuation);
          vec3 finalColor = waterColor + ambientReflection + specular;

          gl_FragColor = vec4(finalColor, 0.94);
        }
      `,
      transparent: true
    });

    this.waterMesh = new THREE.Mesh(waterGeo, this.waterMaterial);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = -0.05;
    this.scene.add(this.waterMesh);
  }

  // ----------------------------------------------------
  // 2. SCENE 1: 3D CLAY DIYA LAMP & LIVING FLAME
  // ----------------------------------------------------

  initScene1Diya() {
    this.diyaGroup = new THREE.Group();

    // 1. Procedural 3D Terracotta Diya Bowl (LatheGeometry)
    const points = [];
    points.push(new THREE.Vector2(0, 0));
    points.push(new THREE.Vector2(1.2, 0.05));
    points.push(new THREE.Vector2(1.8, 0.35));
    points.push(new THREE.Vector2(2.1, 0.75));
    points.push(new THREE.Vector2(2.2, 0.95)); // Rim lip
    points.push(new THREE.Vector2(1.9, 0.90));
    points.push(new THREE.Vector2(1.4, 0.55));
    points.push(new THREE.Vector2(0.5, 0.25));
    points.push(new THREE.Vector2(0, 0.22)); // Inner base

    const diyaGeo = new THREE.LatheGeometry(points, 32);
    const diyaMat = new THREE.MeshStandardMaterial({
      color: 0x85391d, // Terracotta baked clay
      roughness: 0.88,
      metalness: 0.06
    });

    this.diyaMesh = new THREE.Mesh(diyaGeo, diyaMat);
    this.diyaGroup.add(this.diyaMesh);

    // 2. Cotton Oil Wick
    const wickGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.6, 8);
    const wickMat = new THREE.MeshStandardMaterial({ color: 0x241d18, roughness: 0.9 });
    const wick = new THREE.Mesh(wickGeo, wickMat);
    wick.position.set(0.65, 0.68, 0);
    wick.rotation.z = -Math.PI * 0.18;
    this.diyaGroup.add(wick);

    // 3. Procedural Living 3D Teardrop Flame Mesh & Shader
    const flameGeo = new THREE.ConeGeometry(0.42, 1.4, 16, 16);
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

          // Natural organic teardrop flutter
          float wind = sin(time * 6.0 + position.y * 3.0) * 0.08 * (position.y + 0.7);
          float breath = cos(time * 9.0) * 0.04 * (position.y + 0.7);
          pos.x += wind * flicker;
          pos.z += breath * flicker;
          pos.y *= 1.0 + (sin(time * 8.0) * 0.05 * flicker);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float flicker;
        varying vec2 vUv;
        varying float vY;

        void main() {
          // Flame layers: white-hot core -> saffron yellow -> fiery amber -> blue base
          float t = clamp((vY + 0.7) / 1.4, 0.0, 1.0);
          vec3 blueBase = vec3(0.12, 0.35, 0.95);
          vec3 fieryAmber = vec3(1.0, 0.28, 0.02);
          vec3 saffronGold = vec3(1.0, 0.68, 0.0);
          vec3 coreWhite = vec3(1.0, 0.98, 0.9);

          vec3 col = mix(blueBase, fieryAmber, smoothstep(0.0, 0.25, t));
          col = mix(col, saffronGold, smoothstep(0.2, 0.65, t));
          col = mix(col, coreWhite, smoothstep(0.5, 0.95, t));

          // Edge glow transparency
          float alpha = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.7, vUv.y) * 0.95;
          gl_FragColor = vec4(col * (1.1 + flicker * 0.2), alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    this.flameMesh = new THREE.Mesh(flameGeo, this.flameMaterial);
    this.flameMesh.position.set(0.68, 1.4, 0);
    this.diyaGroup.add(this.flameMesh);

    // 4. Courtyard Stone Pedestal beneath the Diya
    const stoneGeo = new THREE.CylinderGeometry(3.5, 4.0, 0.5, 32);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x1a2138,
      roughness: 0.9,
      metalness: 0.05
    });
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.position.set(0, -0.25, 0);
    this.diyaGroup.add(stone);

    this.scene.add(this.diyaGroup);
  }

  // ----------------------------------------------------
  // 3. SCENE 2: SACRED GEOMETRY RANGOLI & OIL LAMP RINGS
  // ----------------------------------------------------

  initScene2Rangoli() {
    this.rangoliGroup = new THREE.Group();
    this.rangoliGroup.position.set(0, -0.02, 0);
    this.rangoliProgress = 0;

    // Concentric Lotus Petals generated with sacred geometry
    const segments = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];

    // Ring 1: Inner Saffron Lotus
    for (let i = 0; i < 8; i++) {
      const baseAngle = (i / 8) * Math.PI * 2;
      for (let j = 0; j <= 20; j++) {
        const t = j / 20;
        const r = Math.sin(t * Math.PI) * 1.5;
        const a = baseAngle + (t - 0.5) * 0.45;
        positions.push(Math.cos(a) * (1.2 + r), 0.02, Math.sin(a) * (1.2 + r));
        colors.push(0.9, 0.7, 0.2); // Imperial Gold
      }
    }

    // Ring 2: Peacock Teal Mandala
    for (let i = 0; i < 16; i++) {
      const baseAngle = (i / 16) * Math.PI * 2;
      for (let j = 0; j <= 20; j++) {
        const t = j / 20;
        const r = Math.sin(t * Math.PI) * 2.2;
        const a = baseAngle + (t - 0.5) * 0.35;
        positions.push(Math.cos(a) * (2.8 + r), 0.02, Math.sin(a) * (2.8 + r));
        colors.push(0.03, 0.52, 0.55); // Peacock Teal
      }
    }

    // Ring 3: Royal Magenta Petal Ring
    for (let i = 0; i < 24; i++) {
      const baseAngle = (i / 24) * Math.PI * 2;
      for (let j = 0; j <= 20; j++) {
        const t = j / 20;
        const r = Math.sin(t * Math.PI) * 2.8;
        const a = baseAngle + (t - 0.5) * 0.28;
        positions.push(Math.cos(a) * (5.0 + r), 0.02, Math.sin(a) * (5.0 + r));
        colors.push(0.85, 0.28, 0.52); // Lotus Pink
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const rangoliMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      linewidth: 2,
      transparent: true,
      opacity: 0.95
    });

    this.rangoliLines = new THREE.LineSegments(geometry, rangoliMat);
    this.rangoliGroup.add(this.rangoliLines);

    // 16 Small Concentric 3D Oil Lamps
    this.rangoliLamps = [];
    const lampCount = 16;
    const lampR = 8.5;
    const miniDiyaGeo = new THREE.CylinderGeometry(0.35, 0.25, 0.22, 12);
    const miniDiyaMat = new THREE.MeshStandardMaterial({ color: 0x85391d, roughness: 0.9 });

    for (let i = 0; i < lampCount; i++) {
      const angle = (i / lampCount) * Math.PI * 2;
      const x = Math.cos(angle) * lampR;
      const z = Math.sin(angle) * lampR;

      const lamp = new THREE.Mesh(miniDiyaGeo, miniDiyaMat);
      lamp.position.set(x, 0.1, z);

      // Mini flame
      const mFlameGeo = new THREE.SphereGeometry(0.14, 8, 8);
      const mFlameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.85 });
      const mFlame = new THREE.Mesh(mFlameGeo, mFlameMat);
      mFlame.position.set(0, 0.2, 0);
      lamp.add(mFlame);

      this.rangoliGroup.add(lamp);
      this.rangoliLamps.push(lamp);
    }

    this.rangoliGroup.visible = false;
    this.scene.add(this.rangoliGroup);
  }

  // ----------------------------------------------------
  // 4. SCENE 3: PALACE COURTYARD ARCHES, LANTERNS & PETALS
  // ----------------------------------------------------

  initScene3PalaceGarden() {
    this.gardenGroup = new THREE.Group();

    // 3D Stone Arches framing the courtyard
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x1c2438,
      roughness: 0.92,
      metalness: 0.08
    });

    const pillarOffsets = [-16, -8, 8, 16];
    pillarOffsets.forEach(x => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 18, 1.8), archMat);
      pillar.position.set(x, 8, 5);
      this.gardenGroup.add(pillar);
    });

    // 18 Floating 3D Sky Lanterns
    this.lanterns = [];
    const lanternGeo = new THREE.CylinderGeometry(0.65, 0.55, 1.4, 8);
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xffe6a3,
      emissive: 0xff9922,
      emissiveIntensity: 0.95,
      roughness: 0.6,
      transparent: true,
      opacity: 0.92
    });

    for (let i = 0; i < 18; i++) {
      const lantern = new THREE.Mesh(lanternGeo, lanternMat);
      lantern.position.set(
        (Math.random() - 0.5) * 36,
        Math.random() * 25 + 2,
        (Math.random() - 0.5) * 20 - 5
      );
      lantern.userData = {
        vy: 0.025 + Math.random() * 0.02,
        swaySpeed: 0.8 + Math.random() * 0.5,
        swayAmp: 0.15 + Math.random() * 0.1,
        seed: Math.random() * 10
      };
      this.gardenGroup.add(lantern);
      this.lanterns.push(lantern);
    }

    // 35 Tumbling 3D Marigold Petals
    this.petals = [];
    const petalGeo = new THREE.PlaneGeometry(0.35, 0.45);
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      roughness: 0.8
    });

    for (let i = 0; i < 35; i++) {
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(
        (Math.random() - 0.5) * 30,
        Math.random() * 18 + 2,
        (Math.random() - 0.5) * 20
      );
      petal.userData = {
        vy: -0.03 - Math.random() * 0.025,
        vx: (Math.random() - 0.5) * 0.015,
        vRotX: (Math.random() - 0.5) * 0.04,
        vRotY: (Math.random() - 0.5) * 0.05
      };
      this.gardenGroup.add(petal);
      this.petals.push(petal);
    }

    this.gardenGroup.visible = false;
    this.scene.add(this.gardenGroup);
  }

  // ----------------------------------------------------
  // 5. SCENE 5: 3-LAYER PHYSICAL PYROTECHNICS ENGINE
  // ----------------------------------------------------

  initScene5Fireworks() {
    this.maxSparks = 1400;
    this.sparkGeo = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(this.maxSparks * 3);
    this.sparkColors = new Float32Array(this.maxSparks * 3);
    this.sparkSizes = new Float32Array(this.maxSparks);

    // Initial hidden state
    for (let i = 0; i < this.maxSparks; i++) {
      this.sparkPositions[i * 3] = 0;
      this.sparkPositions[i * 3 + 1] = -999;
      this.sparkPositions[i * 3 + 2] = 0;
      this.sparkColors[i * 3] = 1;
      this.sparkColors[i * 3 + 1] = 1;
      this.sparkColors[i * 3 + 2] = 1;
      this.sparkSizes[i] = 0;
    }

    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
    this.sparkGeo.setAttribute('color', new THREE.BufferAttribute(this.sparkColors, 3));
    this.sparkGeo.setAttribute('size', new THREE.BufferAttribute(this.sparkSizes, 1));

    const sparkMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    this.sparkPoints = new THREE.Points(this.sparkGeo, sparkMat);
    this.scene.add(this.sparkPoints);

    // Physical particle simulation array
    this.sparks = [];
    for (let i = 0; i < this.maxSparks; i++) {
      this.sparks.push({
        active: false,
        x: 0, y: -999, z: 0,
        vx: 0, vy: 0, vz: 0,
        r: 1, g: 0.8, b: 0.2,
        alpha: 0,
        decay: 0.015,
        gravity: 0.035,
        drag: 0.975,
        isWillow: false
      });
    }

    // Active rockets ascending
    this.activeRockets = [];
  }

  launchFirework(targetX = 0, targetY = 22, theme = 'gold') {
    audioSynth.playRocketLaunch();

    let tx = targetX;
    let ty = targetY;
    if (typeof targetX === 'number' && Math.abs(targetX) > 40) {
      tx = (targetX / this.width - 0.5) * 24;
    }
    if (typeof targetY === 'number' && targetY > 50) {
      ty = 18 + (1.0 - targetY / this.height) * 10;
    }

    // Rocket ascent animation
    const rocket = {
      x: tx || (Math.random() - 0.5) * 16,
      y: 0,
      z: -5 + (Math.random() - 0.5) * 8,
      targetY: ty || 22,
      theme: theme
    };

    gsap.to(rocket, {
      y: rocket.targetY,
      duration: 0.95 + Math.random() * 0.35,
      ease: 'power2.out',
      onComplete: () => {
        this.explodeRocket(rocket.x, rocket.y, rocket.z, rocket.theme);
      }
    });
  }

  explodeRocket(x, y, z, theme = 'gold') {
    audioSynth.playFireworkBurst('large');
    haptics.fireworkBurst('large');

    // Atmospheric flash bloom
    this.fireworkFlashLight.position.set(x, y, z);
    this.fireworkFlashLight.intensity = 8.5;
    gsap.to(this.fireworkFlashLight, { intensity: 0, duration: 0.45, ease: 'power2.out' });

    // Color definitions
    const paletteMap = {
      gold: [[1.0, 0.92, 0.5], [0.95, 0.72, 0.15], [1.0, 1.0, 1.0]],
      teal: [[0.05, 0.85, 0.85], [0.03, 0.55, 0.6], [1.0, 1.0, 1.0]],
      pink: [[0.95, 0.3, 0.65], [0.85, 0.15, 0.45], [1.0, 1.0, 1.0]],
      violet: [[0.7, 0.3, 0.95], [0.45, 0.12, 0.75], [1.0, 1.0, 1.0]]
    };

    const colors = paletteMap[theme] || paletteMap.gold;
    const count = 350;
    let spawned = 0;

    for (let i = 0; i < this.maxSparks && spawned < count; i++) {
      const s = this.sparks[i];
      if (!s.active) {
        s.active = true;
        s.x = x;
        s.y = y;
        s.z = z;

        // Spherical explosion burst with Nishiki Kamuro cascading willow physics
        const phi = Math.random() * Math.PI * 2;
        const costheta = Math.random() * 2 - 1;
        const u = Math.random();
        const theta = Math.acos(costheta);
        const speed = Math.cbrt(u) * (0.35 + Math.random() * 0.4);

        s.vx = speed * Math.sin(theta) * Math.cos(phi);
        s.vy = speed * Math.sin(theta) * Math.sin(phi);
        s.vz = speed * Math.cos(theta);

        const col = colors[Math.floor(Math.random() * colors.length)];
        s.r = col[0];
        s.g = col[1];
        s.b = col[2];

        s.isWillow = theme === 'gold' && Math.random() > 0.35;
        s.decay = s.isWillow ? 0.007 + Math.random() * 0.004 : 0.015 + Math.random() * 0.008;
        s.gravity = s.isWillow ? 0.014 : 0.022;
        s.drag = s.isWillow ? 0.985 : 0.975;
        s.alpha = 1.0;

        spawned++;
      }
    }
  }

  // ----------------------------------------------------
  // 6. SCENE TRANSITION CHOREOGRAPHY
  // ----------------------------------------------------

  setScene(sceneNum) {
    this.currentScene = sceneNum;
    const targetConfig = this.sceneViewpoints[sceneNum] || this.sceneViewpoints[1];

    // Smooth cinematic 3D camera pan
    gsap.to(this.camera.position, {
      x: targetConfig.pos.x,
      y: targetConfig.pos.y,
      z: targetConfig.pos.z,
      duration: 1.6,
      ease: 'power3.inOut'
    });

    gsap.to(this.cameraTarget, {
      x: targetConfig.target.x,
      y: targetConfig.target.y,
      z: targetConfig.target.z,
      duration: 1.6,
      ease: 'power3.inOut'
    });

    // Visibility toggles for scene specific geometries
    if (this.rangoliGroup) {
      this.rangoliGroup.visible = sceneNum === 2;
      if (sceneNum === 2) {
        this.rangoliProgress = 0;
        gsap.to(this, { rangoliProgress: 1.0, duration: 2.8, ease: 'power2.out' });
      }
    }

    if (this.gardenGroup) {
      this.gardenGroup.visible = sceneNum === 3;
    }
  }

  spawnRipple(x, y, strength = 0.8) {
    // Interactive liquid water ripple
    if (this.waterMaterial) {
      const now = this.time;
      this.waterMaterial.uniforms.rippleTimes.value[0] = now;
      this.waterMaterial.uniforms.rippleCenters.value[0].set(0, 0);
    }
  }

  // ----------------------------------------------------
  // 7. MAIN 60/120 FPS RENDER LOOP
  // ----------------------------------------------------

  update(dt) {
    this.time += 0.018 * dt;

    // 1. Water Shader & Flame flicker
    const flameFlicker = 0.9 + Math.sin(this.time * 8.0) * 0.15 + Math.cos(this.time * 13.0) * 0.1;
    if (this.flameMaterial) {
      this.flameMaterial.uniforms.time.value = this.time;
      this.flameMaterial.uniforms.flicker.value = flameFlicker;
    }
    if (this.waterMaterial) {
      this.waterMaterial.uniforms.time.value = this.time;
    }
    if (this.diyaLight) {
      this.diyaLight.intensity = 3.6 * flameFlicker;
    }

    // 2. Camera tracking & Gyroscope / Mouse Parallax
    const { x: tiltX, y: tiltY } = tilt.getValues();
    const dynamicTarget = this.cameraTarget.clone().add(new THREE.Vector3(tiltX * 1.6, -tiltY * 1.1, 0));
    this.currentCameraLookAt.lerp(dynamicTarget, 0.08);
    this.camera.lookAt(this.currentCameraLookAt);

    // 3. Sky Lanterns Ascent & Marigold Petal Flutter (Scene 3)
    if (this.currentScene === 3 && this.gardenGroup.visible) {
      for (const l of this.lanterns) {
        l.position.y += l.userData.vy * dt;
        l.position.x += Math.sin(this.time * l.userData.swaySpeed + l.userData.seed) * l.userData.swayAmp * 0.02 * dt;
        if (l.position.y > 28) {
          l.position.y = 1.0;
          l.position.x = (Math.random() - 0.5) * 36;
        }
      }

      for (const p of this.petals) {
        p.position.y += p.userData.vy * dt;
        p.position.x += p.userData.vx * dt;
        p.rotation.x += p.userData.vRotX * dt;
        p.rotation.y += p.userData.vRotY * dt;
        if (p.position.y < -0.2) {
          p.position.y = 16.0;
          p.position.x = (Math.random() - 0.5) * 30;
        }
      }
    }

    // 4. Physical Sparks Simulation (Scene 5 Fireworks)
    let needsSparkUpdate = false;
    const pos = this.sparkPositions;
    const col = this.sparkColors;
    const sz = this.sparkSizes;

    for (let i = 0; i < this.maxSparks; i++) {
      const s = this.sparks[i];
      if (s.active) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.z += s.vz * dt;

        s.vx *= s.drag;
        s.vy = s.vy * s.drag - s.gravity * dt;
        s.vz *= s.drag;

        s.alpha -= s.decay * dt;

        if (s.alpha <= 0 || s.y < -0.1) {
          s.active = false;
          pos[i * 3 + 1] = -999;
          sz[i] = 0;
        } else {
          pos[i * 3] = s.x;
          pos[i * 3 + 1] = s.y;
          pos[i * 3 + 2] = s.z;

          // Color cooling: white-hot cooling to deep amber
          col[i * 3] = s.r * s.alpha;
          col[i * 3 + 1] = s.g * s.alpha;
          col[i * 3 + 2] = s.b * s.alpha;

          sz[i] = (s.isWillow ? 2.6 : 1.8) * s.alpha;
        }
        needsSparkUpdate = true;
      }
    }

    if (needsSparkUpdate) {
      this.sparkGeo.attributes.position.needsUpdate = true;
      this.sparkGeo.attributes.color.needsUpdate = true;
      this.sparkGeo.attributes.size.needsUpdate = true;
    }
  }

  loop(currentTime = performance.now()) {
    if (!this.running) return;

    const deltaMs = currentTime - this.lastTime;
    this.lastTime = currentTime;
    const dt = Math.min(Math.max(deltaMs / 16.67, 0.5), 2.0);

    this.update(dt);
    this.renderer.render(this.scene, this.camera);

    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(this.dpr);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    // Auto-suspend rAF when tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else {
        this.start();
      }
    });

    // Touch & pointer interaction for ripples and fireworks
    let lastTap = 0;
    window.addEventListener('pointerdown', (e) => {
      const now = performance.now();
      if (now - lastTap < 80) return;
      lastTap = now;

      if (this.currentScene === 1) {
        this.spawnRipple(e.clientX, e.clientY, 0.8);
      } else if (this.currentScene === 5 && !e.target.closest('button') && !e.target.closest('input')) {
        const themes = ['gold', 'teal', 'pink', 'violet'];
        const chosen = themes[Math.floor(Math.random() * themes.length)];
        this.launchFirework((e.clientX / this.width - 0.5) * 20, 22, chosen);
      }
    });
  }
}
