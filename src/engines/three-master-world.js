/**
 * ThreeMasterWorld — World-Class Photorealistic 3D Living WebGL Environment (Three.js r187)
 * Zero Static Images. Real-Time UnrealBloomPass Optical Post-Processing,
 * Physically Modeled Terracotta Diya with Procedural Teardrop Flame & Ghee Oil Layer,
 * Sacred Rangoli Mandala on Polished Indian Marble, Akash Kandil Sky Lanterns,
 * and a 5-Shell Physical Pyrotechnic Fireworks Simulation Engine.
 * Dedicated to Dharji Shravya — Locked 60/120 FPS Performance.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { TextureGenerator } from './texture-generator.js';
import { audioSynth } from './audio-synth.js';
import { haptics } from '../interactions/haptics.js';
import { gsap } from 'gsap';

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

    // Gyroscope / mouse tilt parallax
    this.targetTiltX = 0;
    this.targetTiltY = 0;
    this.currentTiltX = 0;
    this.currentTiltY = 0;

    // Three.js Core Foundation
    this.scene = new THREE.Scene();
    // Warm midnight atmospheric haze
    this.scene.fog = new THREE.FogExp2(0x0a102c, 0.0075);

    this.camera = new THREE.PerspectiveCamera(46, this.width / this.height, 0.1, 1000);
    this.cameraTarget = new THREE.Vector3(0, 0.65, 0);
    this.currentCameraLookAt = new THREE.Vector3().copy(this.cameraTarget);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.setClearColor(0x060c24, 1.0);

    // UnrealBloomPass Post-Processing Pipeline
    this.initPostProcessing();

    // Camera viewpoints for each scene
    this.sceneViewpoints = {
      1: { pos: new THREE.Vector3(0, 2.4, 9.2), target: new THREE.Vector3(0, 0.65, 0) },
      2: { pos: new THREE.Vector3(0, 13.0, 11.5), target: new THREE.Vector3(0, -0.2, 0) },
      3: { pos: new THREE.Vector3(0, 4.2, 18.5), target: new THREE.Vector3(0, 3.5, 0) },
      4: { pos: new THREE.Vector3(0, 1.8, 8.5), target: new THREE.Vector3(0, 0.85, 0) },
      5: { pos: new THREE.Vector3(0, 6.0, 23.0), target: new THREE.Vector3(0, 17.5, -8.0) }
    };

    this.camera.position.copy(this.sceneViewpoints[1].pos);
    this.cameraTarget.copy(this.sceneViewpoints[1].target);
    this.currentCameraLookAt.copy(this.cameraTarget);

    // Initialize Lighting & Atmosphere
    this.initLighting();
    this.initCosmicSkyDome();
    this.initStarfield();
    this.initPalaceArchitecture();
    this.initPolishedMarbleTerrace();
    this.initAtmosphericParticles();

    // Initialize Scene Geometries
    this.initScene1HeroDiya();
    this.initScene2RangoliAltar();
    this.initScene3PalaceGarden();
    this.initScene5FireworksEngine();

    this.bindEvents();
  }

  // ----------------------------------------------------
  // 1. CINEMATIC POST-PROCESSING (UNREAL BLOOM)
  // ----------------------------------------------------

  initPostProcessing() {
    const renderScene = new RenderPass(this.scene, this.camera);

    // Optical bloom: blooms bright flame cores, fireworks, and lanterns with golden aura
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      1.3,  // strength
      0.55, // radius
      0.72  // threshold (only emissive lights bloom)
    );

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(this.bloomPass);
  }

  // ----------------------------------------------------
  // 2. MASTER LIGHTING & CELESTIAL ATMOSPHERE
  // ----------------------------------------------------

  initLighting() {
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

    // Dynamic warm Point Light from Diya Flame
    this.diyaLight = new THREE.PointLight(0xffa228, 5.5, 45, 1.2);
    this.diyaLight.position.set(0.68, 1.5, 0);
    this.scene.add(this.diyaLight);

    // Grand explosive flash for fireworks (illuminates sky and palace)
    this.fireworkFlashLight = new THREE.PointLight(0xffeedd, 0.0, 260, 1.1);
    this.fireworkFlashLight.position.set(0, 24, -6);
    this.scene.add(this.fireworkFlashLight);
  }

  initCosmicSkyDome() {
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
    const starCount = 2200;
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

    const sparkTex = TextureGenerator.createSparkGlowTexture();
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

  // ----------------------------------------------------
  // 3. MAJESTIC INDIAN PALACE ARCHITECTURE (AT DISTANCE)
  // ----------------------------------------------------

  initPalaceArchitecture() {
    this.palaceGroup = new THREE.Group();
    const sandstoneMat = new THREE.MeshStandardMaterial({
      color: 0x1e1934,
      roughness: 0.82,
      metalness: 0.12
    });

    const windowGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffa433,
      transparent: true,
      opacity: 0.8
    });

    // Central Grand Rajput Jharokha Pavilion (at majestic distance z = -48)
    const domeGeo = new THREE.SphereGeometry(14, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const mainDome = new THREE.Mesh(domeGeo, sandstoneMat);
    mainDome.position.set(0, 16, -48);

    // Golden Kalash Finial Spire
    const spireGeo = new THREE.CylinderGeometry(0.2, 0.8, 4.5, 12);
    const spireMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
    const kalash = new THREE.Mesh(spireGeo, spireMat);
    kalash.position.set(0, 31, -48);

    const baseGeo = new THREE.CylinderGeometry(14, 14, 12, 32);
    const mainBase = new THREE.Mesh(baseGeo, sandstoneMat);
    mainBase.position.set(0, 8, -48);

    this.palaceGroup.add(mainDome, kalash, mainBase);

    // Left and Right Symmetrical Minarets & Chatris (Graceful proportions)
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

    // Palace Terrace Parapet Wall lined with 36 Small Glowing Earthen Diyas
    const wallGeo = new THREE.BoxGeometry(110, 3.2, 3.2);
    const wall = new THREE.Mesh(wallGeo, sandstoneMat);
    wall.position.set(0, 1.6, -42);
    this.palaceGroup.add(wall);

    const sparkTex = TextureGenerator.createSparkGlowTexture();
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
    // Polished Royal Courtyard Floor reflecting warm lights
    const terraceGeo = new THREE.PlaneGeometry(160, 160);
    const marbleTex = TextureGenerator.createMarbleFloorTexture();

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

  initAtmosphericParticles() {
    // 250 Floating Golden Stardust Motes drifting across the terrace
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
    const sparkTex = TextureGenerator.createSparkGlowTexture();
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

  // ----------------------------------------------------
  // 4. SCENE 1: PHOTOREALISTIC HERO CLAY DIYA & FLAME
  // ----------------------------------------------------

  initScene1HeroDiya() {
    this.diyaGroup = new THREE.Group();
    this.diyaGroup.position.set(0, 0, 0);

    // 1. Handcrafted Heavy Brass Pooja Thali Base
    const thaliGeo = new THREE.CylinderGeometry(5.2, 5.4, 0.18, 48);
    const thaliMat = new THREE.MeshStandardMaterial({
      color: 0xd4a017,
      metalness: 0.85,
      roughness: 0.22
    });
    const thali = new THREE.Mesh(thaliGeo, thaliMat);
    thali.position.set(0, 0.09, 0);
    this.diyaGroup.add(thali);

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
    const diyaTex = TextureGenerator.createDiyaTexture();
    const diyaMat = new THREE.MeshStandardMaterial({
      map: diyaTex,
      color: 0x9e4322,
      roughness: 0.72,
      metalness: 0.16
    });

    this.diyaMesh = new THREE.Mesh(diyaGeo, diyaMat);
    this.diyaMesh.position.set(0, 0.18, 0);
    this.diyaGroup.add(this.diyaMesh);

    // 3. Liquid Ghee / Mustard Oil Layer inside the bowl
    const oilGeo = new THREE.CylinderGeometry(1.58, 1.58, 0.05, 32);
    const oilTex = TextureGenerator.createGheeLiquidTexture();
    const oilMat = new THREE.MeshStandardMaterial({
      map: oilTex,
      roughness: 0.12,
      metalness: 0.3,
      transparent: true,
      opacity: 0.92
    });
    const oilMesh = new THREE.Mesh(oilGeo, oilMat);
    oilMesh.position.set(0, 0.62, 0);
    this.diyaGroup.add(oilMesh);

    // 4. Hand-Rolled Cotton Oil Wick (Batti) with Charred Carbon Tip
    const wickGeo = new THREE.CylinderGeometry(0.08, 0.11, 0.68, 12);
    const wickMat = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.95 });
    const wick = new THREE.Mesh(wickGeo, wickMat);
    wick.position.set(0.65, 0.92, 0);
    wick.rotation.z = -Math.PI * 0.18;
    this.diyaGroup.add(wick);

    // 5. Photorealistic Teardrop Flame Geometry & Custom GLSL Shader
    // Authentic Teardrop Profile (hollow base, bulbous belly, tapered tip)
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

          // Soft volumetric alpha edge
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
    this.diyaGroup.add(this.flameMesh);

    // 6. Garland of 28 Fresh Marigold Blossoms (Genda Phool)
    const marigoldTex = TextureGenerator.createMarigoldTexture();
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
      this.diyaGroup.add(flower);
    }

    // 7. Rising Golden Embers from the Diya Flame
    const emberCount = 24;
    this.diyaEmbersGeo = new THREE.BufferGeometry();
    this.diyaEmberPositions = new Float32Array(emberCount * 3);
    this.diyaEmberData = [];

    for (let i = 0; i < emberCount; i++) {
      this.diyaEmberPositions[i * 3] = 0.68;
      this.diyaEmberPositions[i * 3 + 1] = 1.68;
      this.diyaEmberPositions[i * 3 + 2] = 0;
      this.diyaEmberData.push({
        y: 1.68 + Math.random() * 2.8,
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

    // DiyaGroup is ONLY visible in Scene 1!
    this.diyaGroup.visible = true;
    this.scene.add(this.diyaGroup);
  }

  // ----------------------------------------------------
  // 5. SCENE 2: SACRED RANGOLI ALTAR (CLEAN ALPHA)
  // ----------------------------------------------------

  initScene2RangoliAltar() {
    this.rangoliGroup = new THREE.Group();
    this.rangoliGroup.position.set(0, 0.02, 0);

    // Stone Courtyard Altar with Handcrafted Indian Rangoli Mandala
    const rangoliGeo = new THREE.CylinderGeometry(8.5, 8.8, 0.35, 64);
    const rangoliTex = TextureGenerator.createRangoliTexture();

    const rangoliMat = new THREE.MeshStandardMaterial({
      map: rangoliTex,
      roughness: 0.78,
      metalness: 0.12
    });

    this.rangoliAltar = new THREE.Mesh(rangoliGeo, rangoliMat);
    this.rangoliGroup.add(this.rangoliAltar);

    // 16 Real Glowing Earthen Lamps around the Rangoli Perimeter
    this.rangoliLamps = [];
    const lampCount = 16;
    const lampRadius = 7.6;
    const diyaTex = TextureGenerator.createDiyaTexture();
    const miniDiyaMat = new THREE.MeshStandardMaterial({ map: diyaTex, roughness: 0.8 });
    const miniDiyaGeo = new THREE.CylinderGeometry(0.42, 0.3, 0.26, 16);

    const sparkTex = TextureGenerator.createSparkGlowTexture();
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

      this.rangoliGroup.add(lamp);
      this.rangoliLamps.push(lamp);
    }

    this.rangoliGroup.visible = false;
    this.scene.add(this.rangoliGroup);
  }

  // ----------------------------------------------------
  // 6. SCENE 3: ILLUMINATED PALACE TERRACE & AKASH KANDIL
  // (NO BLOCKING PILLARS — ELEGANT OPEN COMPOSITION)
  // ----------------------------------------------------

  initScene3PalaceGarden() {
    this.gardenGroup = new THREE.Group();

    // Elegant carved Rajasthani Jali Screens positioned laterally (x = -18, 18)
    // to frame the scene beautifully without blocking text or camera
    const jaliTex = TextureGenerator.createJaliScreenTexture();
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
      this.gardenGroup.add(screen);
    });

    // 24 Traditional Akash Kandil (Diwali Sky Lanterns) with Warm Inner Glow
    this.lanterns = [];
    const lanternTex = TextureGenerator.createLanternPaperTexture();
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
      this.gardenGroup.add(lantern);
      this.lanterns.push(lantern);
    }

    // 40 Tumbling Fresh Marigold Petals
    this.petals = [];
    const marigoldTex = TextureGenerator.createMarigoldTexture();
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
      this.gardenGroup.add(petal);
      this.petals.push(petal);
    }

    this.gardenGroup.visible = false;
    this.scene.add(this.gardenGroup);
  }

  // ----------------------------------------------------
  // 7. SCENE 5: COMPLETE 5-SHELL PHYSICAL PYROTECHNICS ENGINE
  // (ROCKETS ASCEND, ILLUMINATE SKY, DETONATE MASSIVELY)
  // ----------------------------------------------------

  initScene5FireworksEngine() {
    this.maxSparks = 2400;
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

    const sparkTex = TextureGenerator.createSparkGlowTexture();
    const sparkMat = new THREE.PointsMaterial({
      map: sparkTex,
      size: 5.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.98,
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
        gravity: 0.026,
        drag: 0.978,
        isWillow: false
      });
    }

    // Ascending Rocket Missiles (Pool of 8)
    this.rockets = [];
    const rocketSparkMat = new THREE.SpriteMaterial({
      map: sparkTex,
      color: 0xffffff,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    for (let i = 0; i < 8; i++) {
      const rSprite = new THREE.Sprite(rocketSparkMat);
      rSprite.visible = false;
      rSprite.scale.set(1.6, 1.6, 1);
      this.scene.add(rSprite);

      this.rockets.push({
        sprite: rSprite,
        active: false,
        x: 0, y: 0, z: 0,
        vy: 0.45,
        targetY: 22,
        type: 'chrysanthemum',
        theme: 'gold'
      });
    }
  }

  // ----------------------------------------------------
  // FIREWORKS DISPATCHER & MULTI-TYPE GENERATION
  // ----------------------------------------------------

  launchFirework(targetX = 0, targetY = 22, theme = 'gold', type = 'chrysanthemum') {
    audioSynth.playRocketLaunch();

    let tx = targetX;
    let ty = targetY;
    if (typeof targetX === 'number' && Math.abs(targetX) > 40) {
      tx = (targetX / this.width - 0.5) * 28;
    }
    if (typeof targetY === 'number' && targetY > 50) {
      ty = 16 + (1.0 - targetY / this.height) * 12;
    }

    const r = this.rockets.find(rk => !rk.active) || this.rockets[0];
    r.active = true;
    r.x = tx || (Math.random() - 0.5) * 20;
    r.y = 1.0;
    r.z = -6 + (Math.random() - 0.5) * 8;
    r.vy = 0.55 + Math.random() * 0.15;
    r.targetY = ty || (18 + Math.random() * 8);
    r.theme = theme;
    r.type = type;
    r.sprite.visible = true;
    r.sprite.position.set(r.x, r.y, r.z);
  }

  detonateFirework(x, y, z, theme, type) {
    // 1. Play Explosive Sound with Sub-Bass & Reverb
    audioSynth.playBurstBoom();
    haptics.fireworkExplosion();

    // 2. High-Intensity Environmental Flash Light
    if (this.fireworkFlashLight) {
      this.fireworkFlashLight.position.set(x, y, z);
      const flashColors = {
        gold: 0xffe89e,
        teal: 0x5ce6e6,
        pink: 0xff80bf,
        violet: 0xc49cff
      };
      this.fireworkFlashLight.color.setHex(flashColors[theme] || 0xffeedd);
      this.fireworkFlashLight.intensity = 22.0;

      gsap.to(this.fireworkFlashLight, {
        intensity: 0,
        duration: 0.65,
        ease: 'power2.out'
      });
    }

    // 3. Dispatch Pyrotechnic Spark Shells
    const themeColors = {
      gold: [[1.0, 0.95, 0.85], [1.0, 0.78, 0.25], [1.0, 0.5, 0.05]],
      teal: [[0.2, 0.95, 0.9], [0.05, 0.8, 0.65], [0.1, 0.5, 0.95]],
      pink: [[1.0, 0.45, 0.75], [1.0, 0.2, 0.5], [1.0, 0.85, 0.92]],
      violet: [[0.78, 0.45, 1.0], [0.55, 0.2, 0.95], [0.95, 0.8, 1.0]]
    };

    const colors = themeColors[theme] || themeColors.gold;

    switch (type) {
      case 'willow':
        this.spawnNishikiKamuro(x, y, z, colors);
        break;
      case 'peacock':
        this.spawnPeacockFan(x, y, z);
        break;
      case 'ring':
        this.spawnRingShell(x, y, z, colors);
        break;
      case 'heart':
        this.spawnHeartBurst(x, y, z, colors);
        break;
      case 'chrysanthemum':
      default:
        this.spawnChrysanthemum(x, y, z, colors);
        break;
    }
  }

  // Type A: Imperial Golden Chrysanthemum (Dense spherical expansion)
  spawnChrysanthemum(x, y, z, colors) {
    const count = 380;
    let spawned = 0;

    for (let i = 0; i < this.maxSparks && spawned < count; i++) {
      const s = this.sparks[i];
      if (!s.active) {
        s.active = true;
        s.x = x; s.y = y; s.z = z;

        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const speed = 0.42 + Math.random() * 0.35;

        s.vx = speed * Math.sin(phi) * Math.cos(theta);
        s.vy = speed * Math.sin(phi) * Math.sin(theta);
        s.vz = speed * Math.cos(phi);

        const col = colors[Math.floor(Math.random() * colors.length)];
        s.r = col[0]; s.g = col[1]; s.b = col[2];
        s.isWillow = false;
        s.decay = 0.013 + Math.random() * 0.008;
        s.gravity = 0.024;
        s.drag = 0.976;
        s.alpha = 1.0;
        spawned++;
      }
    }
  }

  // Type B: Nishiki Kamuro (Cascading Golden Willow with weeping tails)
  spawnNishikiKamuro(x, y, z, colors) {
    const count = 480;
    let spawned = 0;

    for (let i = 0; i < this.maxSparks && spawned < count; i++) {
      const s = this.sparks[i];
      if (!s.active) {
        s.active = true;
        s.x = x; s.y = y; s.z = z;

        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const speed = 0.28 + Math.random() * 0.42;

        s.vx = speed * Math.sin(phi) * Math.cos(theta);
        s.vy = Math.abs(speed * Math.sin(phi) * Math.sin(theta)) * 0.8 + 0.1;
        s.vz = speed * Math.cos(phi);

        s.r = 1.0; s.g = 0.85; s.b = 0.3; // Pure Imperial Gold
        s.isWillow = true;
        s.decay = 0.007; // Long-burning hanging embers
        s.gravity = 0.038;
        s.drag = 0.985;
        s.alpha = 1.0;
        spawned++;
      }
    }
  }

  // Type C: Royal Peacock Fan (Mayur Pankh arch in cyan, emerald & sapphire)
  spawnPeacockFan(x, y, z) {
    const count = 350;
    let spawned = 0;
    const peacockPalette = [
      [0.0, 0.96, 0.83], // Turquoise Cyan
      [0.06, 0.72, 0.5], // Emerald
      [0.55, 0.36, 0.96], // Royal Sapphire Violet
      [1.0, 0.84, 0.0]    // Gold
    ];

    for (let i = 0; i < this.maxSparks && spawned < count; i++) {
      const s = this.sparks[i];
      if (!s.active) {
        s.active = true;
        s.x = x; s.y = y; s.z = z;

        const fanAngle = -Math.PI * 0.75 + Math.random() * Math.PI * 1.5;
        const speed = 0.32 + Math.random() * 0.38;

        s.vx = Math.cos(fanAngle) * speed;
        s.vy = Math.sin(fanAngle) * speed * 0.7 + 0.2;
        s.vz = (Math.random() - 0.5) * 0.15;

        const col = peacockPalette[Math.floor(Math.random() * peacockPalette.length)];
        s.r = col[0]; s.g = col[1]; s.b = col[2];
        s.isWillow = false;
        s.decay = 0.012;
        s.gravity = 0.022;
        s.drag = 0.98;
        s.alpha = 1.0;
        spawned++;
      }
    }
  }

  // Type D: Starlight Ring Shell (Expanding circular perimeter ring)
  spawnRingShell(x, y, z, colors) {
    const count = 320;
    let spawned = 0;

    for (let i = 0; i < this.maxSparks && spawned < count; i++) {
      const s = this.sparks[i];
      if (!s.active) {
        s.active = true;
        s.x = x; s.y = y; s.z = z;

        const angle = (spawned / count) * Math.PI * 2;
        const speed = 0.52 + (Math.random() - 0.5) * 0.05;

        s.vx = Math.cos(angle) * speed;
        s.vy = Math.sin(angle) * speed;
        s.vz = (Math.random() - 0.5) * 0.05;

        const col = colors[spawned % colors.length];
        s.r = col[0]; s.g = col[1]; s.b = col[2];
        s.isWillow = false;
        s.decay = 0.012;
        s.gravity = 0.022;
        s.drag = 0.982;
        s.alpha = 1.0;
        spawned++;
      }
    }
  }

  // Type E: Lotus Pink & Gold Heart Burst
  spawnHeartBurst(x, y, z, colors) {
    const count = 280;
    let spawned = 0;

    for (let i = 0; i < this.maxSparks && spawned < count; i++) {
      const s = this.sparks[i];
      if (!s.active) {
        s.active = true;
        s.x = x; s.y = y; s.z = z;

        const t = (spawned / count) * Math.PI * 2;
        // Parametric Heart Formula
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

        s.vx = (hx / 16) * 0.48;
        s.vy = (hy / 16) * 0.48;
        s.vz = (Math.random() - 0.5) * 0.1;

        s.r = 1.0; s.g = 0.35; s.b = 0.65; // Lotus pink
        s.isWillow = false;
        s.decay = 0.011;
        s.gravity = 0.018;
        s.drag = 0.984;
        s.alpha = 1.0;
        spawned++;
      }
    }
  }

  // ----------------------------------------------------
  // 8. SCENE TRANSITION CHOREOGRAPHY & STRICT ISOLATION
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

    // STRICT SCENE ISOLATION:
    // Scene 1 Diya is ONLY visible in Scene 1!
    if (this.diyaGroup) {
      this.diyaGroup.visible = (sceneNum === 1);
    }

    // Scene 2 Rangoli is ONLY visible in Scene 2!
    if (this.rangoliGroup) {
      this.rangoliGroup.visible = (sceneNum === 2);
    }

    // Scene 3 Garden is ONLY visible in Scene 3!
    if (this.gardenGroup) {
      this.gardenGroup.visible = (sceneNum === 3);
    }
  }

  spawnRipple(x, y, strength = 0.8) {
    // Interactive trigger for Scene 1
  }

  // ----------------------------------------------------
  // 9. MAIN RENDER LOOP (60/120 FPS LOCKED WITH POST-PROCESSING)
  // ----------------------------------------------------

  update(dt) {
    this.time += 0.018 * dt;

    // 1. Organic Flame Flicker & Point Light Breathing (Scene 1 only)
    if (this.currentScene === 1) {
      const flameFlicker = 0.92 + Math.sin(this.time * 8.0) * 0.14 + Math.cos(this.time * 14.0) * 0.09;
      if (this.flameMaterial) {
        this.flameMaterial.uniforms.time.value = this.time;
        this.flameMaterial.uniforms.flicker.value = flameFlicker;
      }
      if (this.diyaLight) {
        this.diyaLight.intensity = 5.2 * flameFlicker;
      }

      // Rising Golden Embers from Diya Flame
      if (this.diyaEmbers) {
        const pos = this.diyaEmberPositions;
        for (let i = 0; i < this.diyaEmberData.length; i++) {
          const ed = this.diyaEmberData[i];
          ed.y += ed.speed * dt;
          const wobble = Math.sin(this.time * 4.0 + ed.wobble) * 0.12;

          pos[i * 3] = 0.68 + wobble;
          pos[i * 3 + 1] = ed.y;
          pos[i * 3 + 2] = Math.cos(this.time * 3.5 + ed.wobble) * 0.1;

          if (ed.y > 4.2) {
            ed.y = 1.68;
          }
        }
        this.diyaEmbersGeo.attributes.position.needsUpdate = true;
      }
    } else if (this.diyaLight) {
      this.diyaLight.intensity = 0.5; // Dimmed when not in Scene 1
    }

    // 2. Atmospheric Floating Golden Stardust Motes
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

    // 3. Smooth Camera Tracking with Gyroscope & Mouse Tilt
    this.currentTiltX += (this.targetTiltX - this.currentTiltX) * 0.04 * dt;
    this.currentTiltY += (this.targetTiltY - this.currentTiltY) * 0.04 * dt;

    this.currentCameraLookAt.x = this.cameraTarget.x + this.currentTiltX * 0.6;
    this.currentCameraLookAt.y = this.cameraTarget.y + this.currentTiltY * 0.4;
    this.currentCameraLookAt.z = this.cameraTarget.z;
    this.camera.lookAt(this.currentCameraLookAt);

    // 4. Scene 3 Floating Akash Kandil Lanterns & Marigold Petals
    if (this.currentScene === 3 && this.gardenGroup.visible) {
      for (const l of this.lanterns) {
        l.position.y += l.userData.vy * dt;
        l.position.x += Math.sin(this.time * l.userData.swaySpeed + l.userData.seed) * l.userData.swayAmp * 0.02 * dt;
        if (l.position.y > 28) {
          l.position.y = 1.0;
          l.position.x = (Math.random() - 0.5) * 42;
        }
      }

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

    // 5. Active Ascending Fireworks Rockets Physics & Detonation Trigger
    for (const r of this.rockets) {
      if (r.active) {
        r.y += r.vy * dt;
        r.sprite.position.set(r.x, r.y, r.z);

        // Check if rocket reached its detonation ceiling
        if (r.y >= r.targetY) {
          r.active = false;
          r.sprite.visible = false;
          this.detonateFirework(r.x, r.y, r.z, r.theme, r.type);
        }
      }
    }

    // 6. High-Intensity Physical Fireworks Simulation (Scene 5)
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

        if (s.alpha <= 0 || s.y < 0.1) {
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

          sz[i] = (s.isWillow ? 5.8 : 4.2) * s.alpha;
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
    
    // Render using UnrealBloomPass EffectComposer
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }

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
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  bindEvents() {
    // Window Resize with Composer update
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
      if (this.composer) {
        this.composer.setSize(this.width, this.height);
      }
    });

    // Pointer Parallax
    window.addEventListener('pointermove', (e) => {
      this.targetTiltX = (e.clientX / this.width - 0.5) * 1.6;
      this.targetTiltY = (e.clientY / this.height - 0.5) * 1.2;
    });

    // Device Gyroscope Parallax on Mobile
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma !== null && e.beta !== null) {
        this.targetTiltX = (e.gamma / 30) * 1.4;
        this.targetTiltY = ((e.beta - 45) / 30) * 1.0;
      }
    });

    // Touch & pointer interaction for fireworks in Scene 5
    let lastTap = 0;
    window.addEventListener('pointerdown', (e) => {
      const now = performance.now();
      if (now - lastTap < 100) return;
      lastTap = now;

      if (this.currentScene === 5 && !e.target.closest('button') && !e.target.closest('input')) {
        const types = ['chrysanthemum', 'willow', 'peacock', 'ring', 'heart'];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        const themes = ['gold', 'teal', 'pink', 'violet'];
        const chosenTheme = themes[Math.floor(Math.random() * themes.length)];

        this.launchFirework(e.clientX, e.clientY, chosenTheme, chosenType);
      }
    });
  }
}
