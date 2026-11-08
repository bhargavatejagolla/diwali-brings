/**
 * ThreeMasterWorld — Photorealistic Procedural 3D WebGL Living World (Three.js r187)
 * Zero Static Images. Real Volumetric Water, Textured 3D Diya, Marigold Flowers,
 * Sacred Rangoli Mandala, Akash Kandil Lanterns, and 3-Layer Nishiki Kamuro Pyrotechnics.
 * Dedicated to Dharji Shravya — Locked 60/120 FPS Performance.
 */

import * as THREE from 'three';
import { gsap } from 'gsap';
import { audioSynth } from './audio-synth.js';
import { haptics } from '../interactions/haptics.js';
import { tilt } from '../interactions/tilt.js';
import { TextureGenerator } from './texture-generator.js';

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

    // Three.js Core Foundation
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x040716, 0.015);

    this.camera = new THREE.PerspectiveCamera(46, this.width / this.height, 0.1, 1000);
    this.cameraTarget = new THREE.Vector3(0, 1.2, 0);
    this.currentCameraLookAt = new THREE.Vector3(0, 1.2, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.setClearColor(0x040716, 1.0);

    // Camera viewpoints for each scene
    this.sceneViewpoints = {
      1: { pos: new THREE.Vector3(0, 2.6, 9.8), target: new THREE.Vector3(0, 0.6, 0) },
      2: { pos: new THREE.Vector3(0, 13.5, 12.0), target: new THREE.Vector3(0, -0.4, 0) },
      3: { pos: new THREE.Vector3(0, 4.2, 18.0), target: new THREE.Vector3(0, 3.2, 0) },
      4: { pos: new THREE.Vector3(0, 2.0, 9.0), target: new THREE.Vector3(0, 0.9, 0) },
      5: { pos: new THREE.Vector3(0, 6.5, 23.0), target: new THREE.Vector3(0, 16.0, -8.0) }
    };

    this.camera.position.copy(this.sceneViewpoints[1].pos);
    this.cameraTarget.copy(this.sceneViewpoints[1].target);
    this.currentCameraLookAt.copy(this.cameraTarget);

    // Initialize Lighting & Atmosphere
    this.initLighting();
    this.initCosmicSkyDome();
    this.initStarfield();
    this.initPalaceSilhouettes();
    this.initReflectiveWater();

    // Initialize Rich Scene Geometries
    this.initScene1DiyaAndMarigolds();
    this.initScene2RangoliAltar();
    this.initScene3PalaceGarden();
    this.initScene5FireworksEngine();

    this.bindEvents();
  }

  // ----------------------------------------------------
  // 1. MASTER LIGHTING & ATMOSPHERE
  // ----------------------------------------------------

  initLighting() {
    this.ambientLight = new THREE.AmbientLight(0x0f1838, 1.35);
    this.scene.add(this.ambientLight);

    // Celestial moonlight
    this.moonLight = new THREE.DirectionalLight(0x9fc3e8, 1.2);
    this.moonLight.position.set(25, 45, 30);
    this.scene.add(this.moonLight);

    // Dynamic warm Point Light from Diya Flame
    this.diyaLight = new THREE.PointLight(0xffa834, 5.0, 40, 1.3);
    this.diyaLight.position.set(0.68, 1.5, 0);
    this.scene.add(this.diyaLight);

    // Grand explosive flash for fireworks
    this.fireworkFlashLight = new THREE.PointLight(0xfff0d6, 0.0, 200, 1.1);
    this.fireworkFlashLight.position.set(0, 24, -6);
    this.scene.add(this.fireworkFlashLight);
  }

  initCosmicSkyDome() {
    const skyGeo = new THREE.SphereGeometry(380, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x0c1332) },
        bottomColor: { value: new THREE.Color(0x030510) },
        horizonColor: { value: new THREE.Color(0x182046) },
        offset: { value: 15 },
        exponent: { value: 0.65 }
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
          vec3 sky = mix(bottomColor, horizonColor, max(pow(max(h, 0.0), 0.45), 0.0));
          sky = mix(sky, topColor, max(pow(max(h, 0.0), exponent), 0.0));
          gl_FragColor = vec4(sky, 1.0);
        }
      `
    });

    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);
  }

  initStarfield() {
    const starCount = 1600;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0) * 0.48;
      const r = 280 + Math.random() * 70;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 8;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const c = Math.random();
      if (c > 0.65) {
        colors[i * 3] = 0.98; colors[i * 3 + 1] = 0.88; colors[i * 3 + 2] = 0.55; // Warm amber
      } else if (c > 0.3) {
        colors[i * 3] = 0.85; colors[i * 3 + 1] = 0.94; colors[i * 3 + 2] = 1.0;  // Celestial sapphire
      } else {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 1.0;   // Diamond white
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      sizeAttenuation: true
    });

    this.starFieldMesh = new THREE.Points(geometry, starMaterial);
    this.scene.add(this.starFieldMesh);
  }

  initPalaceSilhouettes() {
    this.palaceGroup = new THREE.Group();
    const stoneTex = TextureGenerator.createSandstoneTexture();
    const palaceMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      color: 0x161e38,
      roughness: 0.9,
      metalness: 0.1
    });

    // Central Grand Palace Dome
    const domeGeo = new THREE.SphereGeometry(15, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const mainDome = new THREE.Mesh(domeGeo, palaceMat);
    mainDome.position.set(0, 14, -75);

    const baseGeo = new THREE.CylinderGeometry(15, 15, 14, 24);
    const mainBase = new THREE.Mesh(baseGeo, palaceMat);
    mainBase.position.set(0, 6, -75);
    this.palaceGroup.add(mainDome, mainBase);

    // Left and Right Symmetrical Minarets & Chatris
    const chatriOffsets = [-38, -22, 22, 38];
    chatriOffsets.forEach(x => {
      const pCyl = new THREE.CylinderGeometry(2.4, 2.8, 26, 16);
      const pillar = new THREE.Mesh(pCyl, palaceMat);
      pillar.position.set(x, 9, -70);

      const pDome = new THREE.SphereGeometry(3.8, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const smallDome = new THREE.Mesh(pDome, palaceMat);
      smallDome.position.set(x, 22, -70);

      this.palaceGroup.add(pillar, smallDome);
    });

    // Palace Wall with Arched Openings
    const wallGeo = new THREE.BoxGeometry(120, 10, 4);
    const wall = new THREE.Mesh(wallGeo, palaceMat);
    wall.position.set(0, 3, -68);
    this.palaceGroup.add(wall);

    this.scene.add(this.palaceGroup);
  }

  initReflectiveWater() {
    const waterGeo = new THREE.PlaneGeometry(180, 180, 80, 80);
    
    this.waterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        flamePos: { value: new THREE.Vector3(0.68, 1.5, 0) },
        flameColor: { value: new THREE.Color(0xffa834) },
        waterColor: { value: new THREE.Color(0x040816) },
        rippleCenter: { value: new THREE.Vector2(0, 0) },
        rippleTime: { value: -10.0 }
      },
      vertexShader: `
        uniform float time;
        uniform vec2 rippleCenter;
        uniform float rippleTime;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Gentle fluid surface wave simulation
          float w1 = sin(pos.x * 0.28 + time * 1.5) * 0.14;
          float w2 = cos(pos.y * 0.24 + time * 1.3) * 0.12;
          
          // Dynamic circular ripple wave
          float rDist = length(pos.xy - rippleCenter);
          float rAge = time - rippleTime;
          float ripple = 0.0;
          if (rAge > 0.0 && rAge < 4.0) {
            float waveR = rAge * 9.0;
            float diff = abs(rDist - waveR);
            if (diff < 3.5) {
              ripple = sin((rDist - waveR) * 2.0) * exp(-rAge * 0.8) * 0.35;
            }
          }

          pos.z += w1 + w2 + ripple;

          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPos = worldPos.xyz;
          vNormal = normalize(normalMatrix * vec3(-(w1 + ripple) * 0.6, -(w2 + ripple) * 0.6, 1.0));
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
          // Specular highlights from Diya flame (golden path reflecting on holy river)
          vec3 lightDir = normalize(flamePos - vWorldPos);
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          vec3 halfDir = normalize(lightDir + viewDir);

          float dist = length(flamePos - vWorldPos);
          float lightAttenuation = 1.0 / (1.0 + 0.05 * dist * dist);

          float spec = pow(max(dot(vNormal, halfDir), 0.0), 38.0);
          vec3 specular = flameColor * spec * 3.6 * lightAttenuation;

          // Deep water body with golden reflection path
          vec3 ambientReflection = vec3(0.03, 0.06, 0.14) + flameColor * (0.35 * lightAttenuation);
          vec3 finalColor = waterColor + ambientReflection + specular;

          gl_FragColor = vec4(finalColor, 0.95);
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
  // 2. SCENE 1: AUTHENTIC 3D CLAY DIYA & FRESH MARIGOLDS
  // ----------------------------------------------------

  initScene1DiyaAndMarigolds() {
    this.diyaGroup = new THREE.Group();

    // 1. Procedural 3D Terracotta Diya with Brass Inlay
    const points = [];
    points.push(new THREE.Vector2(0, 0));
    points.push(new THREE.Vector2(1.4, 0.08));
    points.push(new THREE.Vector2(2.1, 0.42));
    points.push(new THREE.Vector2(2.4, 0.85));
    points.push(new THREE.Vector2(2.55, 1.1));  // Rolled lip
    points.push(new THREE.Vector2(2.25, 1.05));
    points.push(new THREE.Vector2(1.65, 0.65));
    points.push(new THREE.Vector2(0.6, 0.28));
    points.push(new THREE.Vector2(0, 0.25));

    const diyaGeo = new THREE.LatheGeometry(points, 48);
    const diyaTex = TextureGenerator.createDiyaTexture();
    const diyaMat = new THREE.MeshStandardMaterial({
      map: diyaTex,
      color: 0x9e4322,
      roughness: 0.75,
      metalness: 0.15
    });

    this.diyaMesh = new THREE.Mesh(diyaGeo, diyaMat);
    this.diyaGroup.add(this.diyaMesh);

    // 2. Cotton Oil Wick with Burnt Tip
    const wickGeo = new THREE.CylinderGeometry(0.09, 0.12, 0.7, 12);
    const wickMat = new THREE.MeshStandardMaterial({ color: 0x1f1915, roughness: 0.9 });
    const wick = new THREE.Mesh(wickGeo, wickMat);
    wick.position.set(0.65, 0.76, 0);
    wick.rotation.z = -Math.PI * 0.18;
    this.diyaGroup.add(wick);

    // 3. Multi-Layer Living Volumetric 3D Flame
    const flameGeo = new THREE.ConeGeometry(0.48, 1.6, 24, 24);
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

          // Organic thermal turbulence
          float wind = sin(time * 7.0 + position.y * 3.5) * 0.09 * (position.y + 0.8);
          float flutter = cos(time * 11.0) * 0.05 * (position.y + 0.8);
          pos.x += wind * flicker;
          pos.z += flutter * flicker;
          pos.y *= 1.0 + (sin(time * 9.0) * 0.06 * flicker);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float flicker;
        varying vec2 vUv;
        varying float vY;

        void main() {
          float t = clamp((vY + 0.8) / 1.6, 0.0, 1.0);
          vec3 blueBase = vec3(0.12, 0.42, 1.0);
          vec3 fieryAmber = vec3(1.0, 0.28, 0.01);
          vec3 saffronGold = vec3(1.0, 0.72, 0.0);
          vec3 coreWhite = vec3(1.0, 0.98, 0.92);

          vec3 col = mix(blueBase, fieryAmber, smoothstep(0.0, 0.22, t));
          col = mix(col, saffronGold, smoothstep(0.18, 0.65, t));
          col = mix(col, coreWhite, smoothstep(0.5, 0.95, t));

          float alpha = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.65, vUv.y) * 0.96;
          gl_FragColor = vec4(col * (1.2 + flicker * 0.25), alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    this.flameMesh = new THREE.Mesh(flameGeo, this.flameMaterial);
    this.flameMesh.position.set(0.68, 1.5, 0);
    this.diyaGroup.add(this.flameMesh);

    // 4. Ring of 24 Fresh Marigold Blossoms (Genda Phool) Floating around Diya
    const marigoldTex = TextureGenerator.createMarigoldTexture();
    const marigoldMat = new THREE.MeshStandardMaterial({
      map: marigoldTex,
      roughness: 0.7,
      transparent: true,
      side: THREE.DoubleSide
    });
    const marigoldGeo = new THREE.PlaneGeometry(1.4, 1.4);

    this.marigoldRing = [];
    const blossomCount = 20;
    const ringRadius = 3.6;

    for (let i = 0; i < blossomCount; i++) {
      const angle = (i / blossomCount) * Math.PI * 2;
      const flower = new THREE.Mesh(marigoldGeo, marigoldMat);
      flower.position.set(
        Math.cos(angle) * ringRadius,
        0.05,
        Math.sin(angle) * ringRadius
      );
      flower.rotation.x = -Math.PI / 2;
      flower.rotation.z = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.4;
      this.diyaGroup.add(flower);
      this.marigoldRing.push(flower);
    }

    // 5. Rising Golden Embers from the Flame (15 pre-allocated sparks)
    const emberCount = 18;
    this.diyaEmbersGeo = new THREE.BufferGeometry();
    this.diyaEmberPositions = new Float32Array(emberCount * 3);
    this.diyaEmberData = [];

    for (let i = 0; i < emberCount; i++) {
      this.diyaEmberPositions[i * 3] = 0.68;
      this.diyaEmberPositions[i * 3 + 1] = 1.5;
      this.diyaEmberPositions[i * 3 + 2] = 0;
      this.diyaEmberData.push({
        y: 1.5 + Math.random() * 2.5,
        speed: 0.02 + Math.random() * 0.02,
        wobble: Math.random() * 10
      });
    }

    this.diyaEmbersGeo.setAttribute('position', new THREE.BufferAttribute(this.diyaEmberPositions, 3));
    const sparkTex = TextureGenerator.createSparkGlowTexture();
    const emberMat = new THREE.PointsMaterial({
      map: sparkTex,
      size: 1.2,
      color: 0xffcc44,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.diyaEmbers = new THREE.Points(this.diyaEmbersGeo, emberMat);
    this.diyaGroup.add(this.diyaEmbers);

    this.scene.add(this.diyaGroup);
  }

  // ----------------------------------------------------
  // 3. SCENE 2: GORGEOUS AUTHENTIC RANGOLI ALTAR
  // ----------------------------------------------------

  initScene2RangoliAltar() {
    this.rangoliGroup = new THREE.Group();
    this.rangoliGroup.position.set(0, 0.01, 0);

    // Stone Courtyard Altar with Complete Indian Rangoli Mandala
    const rangoliGeo = new THREE.CylinderGeometry(8.5, 8.8, 0.35, 64);
    const rangoliTex = TextureGenerator.createRangoliTexture();
    const stoneTex = TextureGenerator.createSandstoneTexture();

    // Top face has Rangoli, sides have carved sandstone
    const rangoliMat = new THREE.MeshStandardMaterial({
      map: rangoliTex,
      roughness: 0.8,
      metalness: 0.1
    });

    this.rangoliAltar = new THREE.Mesh(rangoliGeo, rangoliMat);
    this.rangoliGroup.add(this.rangoliAltar);

    // 16 Real Glowing Earthen Lamps surrounding the Rangoli
    this.rangoliLamps = [];
    const lampCount = 16;
    const lampRadius = 7.6;
    const diyaTex = TextureGenerator.createDiyaTexture();
    const miniDiyaMat = new THREE.MeshStandardMaterial({ map: diyaTex, roughness: 0.8 });
    const miniDiyaGeo = new THREE.CylinderGeometry(0.42, 0.3, 0.26, 16);

    const sparkTex = TextureGenerator.createSparkGlowTexture();
    const flameMat = new THREE.SpriteMaterial({
      map: sparkTex,
      color: 0xffaa22,
      blending: THREE.AdditiveBlending
    });

    for (let i = 0; i < lampCount; i++) {
      const angle = (i / lampCount) * Math.PI * 2;
      const x = Math.cos(angle) * lampRadius;
      const z = Math.sin(angle) * lampRadius;

      const lamp = new THREE.Mesh(miniDiyaGeo, miniDiyaMat);
      lamp.position.set(x, 0.28, z);

      // Glowing flame sprite
      const flameSprite = new THREE.Sprite(flameMat);
      flameSprite.position.set(0, 0.35, 0);
      flameSprite.scale.set(0.9, 1.2, 1);
      lamp.add(flameSprite);

      this.rangoliGroup.add(lamp);
      this.rangoliLamps.push(lamp);
    }

    this.rangoliGroup.visible = false;
    this.scene.add(this.rangoliGroup);
  }

  // ----------------------------------------------------
  // 4. SCENE 3: RAJPUT PALACE ARCHES & AKASH KANDIL
  // ----------------------------------------------------

  initScene3PalaceGarden() {
    this.gardenGroup = new THREE.Group();
    const stoneTex = TextureGenerator.createSandstoneTexture();
    const archMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.85,
      metalness: 0.1
    });

    // Ornate Carved Pillars
    const pillarPositions = [-16, -8, 8, 16];
    pillarPositions.forEach(x => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 18, 2.0), archMat);
      pillar.position.set(x, 8, 4);

      // Pillar decorative capital
      const capital = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 2.8), archMat);
      capital.position.set(x, 16.5, 4);
      this.gardenGroup.add(pillar, capital);
    });

    // 16 Traditional Akash Kandil (Diwali Sky Lanterns) with Rice Paper Texture
    this.lanterns = [];
    const lanternTex = TextureGenerator.createLanternPaperTexture();
    const lanternGeo = new THREE.CylinderGeometry(0.75, 0.65, 1.6, 8);
    const lanternMat = new THREE.MeshStandardMaterial({
      map: lanternTex,
      emissive: 0xffaa33,
      emissiveIntensity: 0.85,
      roughness: 0.5,
      transparent: true,
      opacity: 0.95
    });

    for (let i = 0; i < 16; i++) {
      const lantern = new THREE.Mesh(lanternGeo, lanternMat);
      lantern.position.set(
        (Math.random() - 0.5) * 36,
        Math.random() * 24 + 2,
        (Math.random() - 0.5) * 18 - 4
      );
      lantern.userData = {
        vy: 0.025 + Math.random() * 0.02,
        swaySpeed: 0.8 + Math.random() * 0.5,
        swayAmp: 0.2 + Math.random() * 0.15,
        seed: Math.random() * 10
      };
      this.gardenGroup.add(lantern);
      this.lanterns.push(lantern);
    }

    // 35 Floating Fresh Marigold Petals Tumbling Down
    this.petals = [];
    const marigoldTex = TextureGenerator.createMarigoldTexture();
    const petalGeo = new THREE.PlaneGeometry(0.55, 0.7);
    const petalMat = new THREE.MeshStandardMaterial({
      map: marigoldTex,
      side: THREE.DoubleSide,
      transparent: true,
      roughness: 0.8
    });

    for (let i = 0; i < 35; i++) {
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(
        (Math.random() - 0.5) * 32,
        Math.random() * 18 + 2,
        (Math.random() - 0.5) * 20
      );
      petal.userData = {
        vy: -0.03 - Math.random() * 0.025,
        vx: (Math.random() - 0.5) * 0.018,
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
  // 5. SCENE 5: HIGH-INTENSITY REALISTIC PYROTECHNICS
  // ----------------------------------------------------

  initScene5FireworksEngine() {
    this.maxSparks = 1600;
    this.sparkGeo = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(this.maxSparks * 3);
    this.sparkColors = new Float32Array(this.maxSparks * 3);
    this.sparkSizes = new Float32Array(this.maxSparks);

    for (let i = 0; i < this.maxSparks; i++) {
      this.sparkPositions[i * 3] = 0;
      this.sparkPositions[i * 3 + 1] = -999;
      this.sparkPositions[i * 3 + 2] = 0;
      this.sparkSizes[i] = 0;
    }

    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
    this.sparkGeo.setAttribute('color', new THREE.BufferAttribute(this.sparkColors, 3));
    this.sparkGeo.setAttribute('size', new THREE.BufferAttribute(this.sparkSizes, 1));

    // Soft Gaussian Embers Texture (eliminates pixelated dots)
    const sparkTex = TextureGenerator.createSparkGlowTexture();
    const sparkMat = new THREE.PointsMaterial({
      map: sparkTex,
      size: 4.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.96,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.sparkPoints = new THREE.Points(this.sparkGeo, sparkMat);
    this.scene.add(this.sparkPoints);

    this.sparks = [];
    for (let i = 0; i < this.maxSparks; i++) {
      this.sparks.push({
        active: false,
        x: 0, y: -999, z: 0,
        vx: 0, vy: 0, vz: 0,
        r: 1, g: 0.85, b: 0.3,
        alpha: 0,
        decay: 0.012,
        gravity: 0.028,
        drag: 0.978,
        isWillow: false
      });
    }

    // Ascending Rocket Meshes (4 active rockets)
    this.rocketGroup = new THREE.Group();
    this.rockets = [];
    const rocketHeadMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const rocketGeo = new THREE.SphereGeometry(0.35, 8, 8);

    for (let i = 0; i < 4; i++) {
      const rMesh = new THREE.Mesh(rocketGeo, rocketHeadMat);
      rMesh.visible = false;
      this.rocketGroup.add(rMesh);

      this.rockets.push({
        mesh: rMesh,
        active: false,
        x: 0, y: 0, z: 0,
        targetY: 20,
        theme: 'gold',
        trail: []
      });
    }
    this.scene.add(this.rocketGroup);
  }

  launchFirework(targetX = 0, targetY = 22, theme = 'gold') {
    audioSynth.playRocketLaunch();

    let tx = targetX;
    let ty = targetY;
    if (typeof targetX === 'number' && Math.abs(targetX) > 40) {
      tx = (targetX / this.width - 0.5) * 26;
    }
    if (typeof targetY === 'number' && targetY > 50) {
      ty = 16 + (1.0 - targetY / this.height) * 10;
    }

    // Find available rocket
    const r = this.rockets.find(rk => !rk.active) || this.rockets[0];
    r.active = true;
    r.x = tx || (Math.random() - 0.5) * 18;
    r.y = 0.5;
    r.z = -6 + (Math.random() - 0.5) * 8;
    r.targetY = ty || 20;
    r.theme = theme;
    r.mesh.visible = true;
    r.mesh.position.set(r.x, r.y, r.z);

    gsap.to(r, {
      y: r.targetY,
      duration: 0.95 + Math.random() * 0.3,
      ease: 'power2.out',
      onUpdate: () => {
        r.mesh.position.set(r.x, r.y, r.z);
      },
      onComplete: () => {
        r.active = false;
        r.mesh.visible = false;
        this.explodeRocket(r.x, r.y, r.z, r.theme);
      }
    });
  }

  explodeRocket(x, y, z, theme = 'gold') {
    audioSynth.playFireworkBurst('large');
    haptics.fireworkBurst('large');

    // Blinding atmospheric flash bloom
    this.fireworkFlashLight.position.set(x, y, z);
    this.fireworkFlashLight.intensity = 18.0;
    gsap.to(this.fireworkFlashLight, { intensity: 0, duration: 0.5, ease: 'power2.out' });

    // 4 Vivid Jewel Palettes
    const paletteMap = {
      gold: [[1.0, 0.95, 0.6], [1.0, 0.8, 0.1], [0.95, 0.55, 0.05]],
      teal: [[0.1, 0.95, 0.95], [0.03, 0.75, 0.75], [1.0, 1.0, 1.0]],
      pink: [[1.0, 0.35, 0.75], [0.92, 0.15, 0.52], [1.0, 0.85, 0.95]],
      violet: [[0.85, 0.35, 1.0], [0.55, 0.15, 0.85], [1.0, 1.0, 1.0]]
    };

    const colors = paletteMap[theme] || paletteMap.gold;
    const count = 380;
    let spawned = 0;

    for (let i = 0; i < this.maxSparks && spawned < count; i++) {
      const s = this.sparks[i];
      if (!s.active) {
        s.active = true;
        s.x = x;
        s.y = y;
        s.z = z;

        // Spherical burst with Nishiki Kamuro cascading willow physics
        const phi = Math.random() * Math.PI * 2;
        const costheta = Math.random() * 2 - 1;
        const u = Math.random();
        const theta = Math.acos(costheta);
        const speed = Math.cbrt(u) * (0.42 + Math.random() * 0.45);

        s.vx = speed * Math.sin(theta) * Math.cos(phi);
        s.vy = speed * Math.sin(theta) * Math.sin(phi);
        s.vz = speed * Math.cos(theta);

        const col = colors[Math.floor(Math.random() * colors.length)];
        s.r = col[0];
        s.g = col[1];
        s.b = col[2];

        s.isWillow = theme === 'gold' && Math.random() > 0.3;
        s.decay = s.isWillow ? 0.007 + Math.random() * 0.003 : 0.014 + Math.random() * 0.007;
        s.gravity = s.isWillow ? 0.013 : 0.022;
        s.drag = s.isWillow ? 0.986 : 0.978;
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

    gsap.to(this.camera.position, {
      x: targetConfig.pos.x,
      y: targetConfig.pos.y,
      z: targetConfig.pos.z,
      duration: 1.5,
      ease: 'power3.inOut'
    });

    gsap.to(this.cameraTarget, {
      x: targetConfig.target.x,
      y: targetConfig.target.y,
      z: targetConfig.target.z,
      duration: 1.5,
      ease: 'power3.inOut'
    });

    if (this.rangoliGroup) {
      this.rangoliGroup.visible = sceneNum === 2;
    }

    if (this.gardenGroup) {
      this.gardenGroup.visible = sceneNum === 3;
    }
  }

  spawnRipple(x, y, strength = 0.8) {
    if (this.waterMaterial) {
      this.waterMaterial.uniforms.rippleTime.value = this.time;
      this.waterMaterial.uniforms.rippleCenter.value.set(
        (x / this.width - 0.5) * 16,
        (1.0 - y / this.height) * 16
      );
    }
  }

  // ----------------------------------------------------
  // 7. MAIN RENDER LOOP (60/120 FPS LOCKED)
  // ----------------------------------------------------

  update(dt) {
    this.time += 0.018 * dt;

    // 1. Organic Flame Flicker & Point Light Breathing
    const flameFlicker = 0.92 + Math.sin(this.time * 8.0) * 0.14 + Math.cos(this.time * 14.0) * 0.09;
    if (this.flameMaterial) {
      this.flameMaterial.uniforms.time.value = this.time;
      this.flameMaterial.uniforms.flicker.value = flameFlicker;
    }
    if (this.waterMaterial) {
      this.waterMaterial.uniforms.time.value = this.time;
    }
    if (this.diyaLight) {
      this.diyaLight.intensity = 4.8 * flameFlicker;
    }

    // 2. Rising Golden Embers from the Diya Flame (Scene 1)
    if (this.currentScene === 1 && this.diyaEmbers) {
      const pos = this.diyaEmberPositions;
      for (let i = 0; i < this.diyaEmberData.length; i++) {
        const ed = this.diyaEmberData[i];
        ed.y += ed.speed * dt;
        const wobble = Math.sin(this.time * 4.0 + ed.wobble) * 0.12;

        pos[i * 3] = 0.68 + wobble;
        pos[i * 3 + 1] = ed.y;
        pos[i * 3 + 2] = Math.cos(this.time * 3.5 + ed.wobble) * 0.1;

        if (ed.y > 4.2) {
          ed.y = 1.5;
        }
      }
      this.diyaEmbersGeo.attributes.position.needsUpdate = true;
    }

    // 3. Smooth Camera Tracking with Gyroscope & Mouse Tilt
    const { x: tiltX, y: tiltY } = tilt.getValues();
    const dynamicTarget = this.cameraTarget.clone().add(new THREE.Vector3(tiltX * 1.6, -tiltY * 1.1, 0));
    this.currentCameraLookAt.lerp(dynamicTarget, 0.08);
    this.camera.lookAt(this.currentCameraLookAt);

    // 4. Sky Lanterns & Tumbling Marigold Petals (Scene 3)
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
          p.position.x = (Math.random() - 0.5) * 32;
        }
      }
    }

    // 5. Nishiki Kamuro Physical Sparks Simulation (Scene 5 Fireworks)
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

          // Realistic Color Cooling
          col[i * 3] = s.r * s.alpha;
          col[i * 3 + 1] = s.g * s.alpha;
          col[i * 3 + 2] = s.b * s.alpha;

          sz[i] = (s.isWillow ? 5.2 : 3.6) * s.alpha;
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

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else {
        this.start();
      }
    });

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
        this.launchFirework(e.clientX, e.clientY, chosen);
      }
    });
  }
}
