/**
 * Engine — Master WebGL Creative Experience Engine (Three.js r187 + UnrealBloomPass)
 * Orchestrates lighting, cosmic environment, post-processing, scenes, and interactions.
 * Features automatic multi-tier WebGL fallbacks and seamless FallbackCanvasEngine activation
 * so the application NEVER crashes or renders a black screen under any browser condition.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { LightingSystem } from './LightingSystem.js';
import { SkyAndEnvironment } from './SkyAndEnvironment.js';
import { SceneManager } from './SceneManager.js';
import { FallbackCanvasEngine } from './FallbackCanvasEngine.js';

import { Scene1FirstLight } from '../scenes/Scene1FirstLight.js';
import { Scene2Rangoli } from '../scenes/Scene2Rangoli.js';
import { Scene3Garden } from '../scenes/Scene3Garden.js';
import { Scene4Letter } from '../scenes/Scene4Letter.js';
import { Scene5Fireworks } from '../scenes/Scene5Fireworks.js';

export class Engine {
  constructor(canvas) {
    // Dispose previous instance on hot-reloading to prevent WebGL context leaks
    if (typeof window !== 'undefined') {
      if (window.__activeEngine) {
        try {
          window.__activeEngine.dispose();
        } catch (e) {}
      }
      window.__activeEngine = this;
    }

    this.canvas = canvas;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    this.time = 0;
    this.lastTime = performance.now();
    this.running = false;
    this.rafId = null;

    // Parallax tracking
    this.targetTiltX = 0;
    this.targetTiltY = 0;
    this.currentTiltX = 0;
    this.currentTiltY = 0;

    // Multi-tier WebGL context attempt
    const result = this.createRenderer(this.canvas);
    this.renderer = result.renderer;
    this.canvas = result.canvas;

    // If WebGL is completely disabled or unsupported, seamlessly switch to 2D Fallback
    if (!this.renderer) {
      console.warn("WebGL unavailable or disabled. Activating FallbackCanvasEngine.");
      this.isFallback = true;
      this.fallbackEngine = new FallbackCanvasEngine(this.canvas);
      return;
    }

    this.isFallback = false;

    // 1. Scene & Atmosphere Fog
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a102c, 0.0075);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(46, this.width / this.height, 0.1, 1000);

    // 3. Renderer configuration
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.setClearColor(0x060c24, 1.0);

    // 4. UnrealBloomPass Post-Processing
    this.initPostProcessing();

    // 5. Environmental Lighting & Atmosphere
    this.lighting = new LightingSystem(this.scene);
    this.environment = new SkyAndEnvironment(this.scene);

    // 6. Five Dedicated Scene Subsystems
    this.scene1 = new Scene1FirstLight(this.scene);
    this.scene2 = new Scene2Rangoli(this.scene);
    this.scene3 = new Scene3Garden(this.scene);
    this.scene4 = new Scene4Letter(this.scene);
    this.scene5 = new Scene5Fireworks(this.scene);

    // 7. Scene Manager
    this.sceneManager = new SceneManager(this.camera, {
      scene1: this.scene1,
      scene2: this.scene2,
      scene3: this.scene3,
      scene4: this.scene4,
      scene5: this.scene5
    });

    this.bindEvents();
  }

  createRenderer(canvas) {
    let activeCanvas = canvas;

    // Attempt Tier 1: High performance WebGL
    try {
      const renderer = new THREE.WebGLRenderer({
        canvas: activeCanvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true
      });
      return { renderer, canvas: activeCanvas };
    } catch (e1) {
      console.warn("WebGL tier 1 context creation failed, trying tier 2 with fresh canvas...", e1);
    }

    // Refresh canvas element in case previous WebGL context was in error state
    if (activeCanvas && activeCanvas.parentNode) {
      const freshCanvas = activeCanvas.cloneNode(true);
      activeCanvas.parentNode.replaceChild(freshCanvas, activeCanvas);
      activeCanvas = freshCanvas;
    }

    // Attempt Tier 2: Standard WebGL
    try {
      const renderer = new THREE.WebGLRenderer({
        canvas: activeCanvas,
        antialias: false,
        alpha: false,
        powerPreference: 'default'
      });
      return { renderer, canvas: activeCanvas };
    } catch (e2) {
      console.warn("WebGL tier 2 context creation failed, trying tier 3...", e2);
    }

    // Attempt Tier 3: WebGL 1
    try {
      const gl = activeCanvas.getContext('webgl') || activeCanvas.getContext('experimental-webgl');
      if (gl) {
        const renderer = new THREE.WebGLRenderer({ canvas: activeCanvas, context: gl });
        return { renderer, canvas: activeCanvas };
      }
    } catch (e3) {
      console.warn("WebGL tier 3 context creation failed.", e3);
    }

    return { renderer: null, canvas: activeCanvas };
  }

  initPostProcessing() {
    try {
      const renderScene = new RenderPass(this.scene, this.camera);
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(this.width, this.height),
        1.3,
        0.55,
        0.72
      );

      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(renderScene);
      this.composer.addPass(this.bloomPass);
    } catch (e) {
      console.warn("EffectComposer post-processing initialization failed, falling back to direct render", e);
      this.composer = null;
    }
  }

  setScene(target) {
    if (this.isFallback) return this.fallbackEngine.setScene(target);
    this.sceneManager.setScene(target);
  }

  launchFirework(targetX, targetY, theme, type) {
    if (this.isFallback) return this.fallbackEngine.launchFirework(targetX, targetY, theme, type);
    this.scene5.launch(targetX, targetY, theme, type);
  }

  launchFromScreen(clientX, clientY, theme, type) {
    if (this.isFallback) return this.fallbackEngine.launchFromScreen(clientX, clientY, theme, type);
    this.scene5.launchFromScreen(clientX, clientY, this.width, this.height, theme, type);
  }

  launchBarrage(theme, type) {
    if (this.isFallback) return this.fallbackEngine.launchBarrage(theme, type);
    this.scene5.launchBarrage(theme, type);
  }

  releaseWish(wishText) {
    if (this.isFallback) return this.fallbackEngine.releaseWish(wishText);
    this.scene5.releaseWish(wishText);
  }

  triggerGrandFinale() {
    if (this.isFallback) return this.fallbackEngine.triggerGrandFinale();
    this.scene5.triggerGrandFinale();
  }

  spawnRipple(x, y, strength) {
    if (this.isFallback) return this.fallbackEngine.spawnRipple(x, y, strength);
  }

  update(dt) {
    this.time += 0.018 * dt;

    this.environment.update(dt);

    this.scene1.update(dt, this.time);
    this.scene2.update(dt, this.time);
    this.scene3.update(dt, this.time);
    this.scene4.update(dt, this.time);
    this.scene5.update(dt, this.time);

    this.currentTiltX += (this.targetTiltX - this.currentTiltX) * 0.04 * dt;
    this.currentTiltY += (this.targetTiltY - this.currentTiltY) * 0.04 * dt;
    this.sceneManager.updateParallax(this.currentTiltX, this.currentTiltY);
  }

  loop(currentTime = performance.now()) {
    if (!this.running) return;

    try {
      const deltaMs = currentTime - this.lastTime;
      this.lastTime = currentTime;
      const dt = Math.min(Math.max(deltaMs / 16.67, 0.5), 2.0);

      this.update(dt);

      if (this.composer) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    } catch (err) {
      console.warn("Render loop frame warning:", err);
    }

    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    if (this.isFallback) return this.fallbackEngine.start();
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  stop() {
    if (this.isFallback) return this.fallbackEngine.stop();
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  dispose() {
    this.stop();
    if (this.isFallback) {
      this.fallbackEngine?.dispose();
      return;
    }
    try {
      this.renderer?.dispose();
      this.renderer?.forceContextLoss();
    } catch (e) {}
  }

  bindEvents() {
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

    window.addEventListener('pointermove', (e) => {
      this.targetTiltX = (e.clientX / this.width - 0.5) * 1.6;
      this.targetTiltY = (e.clientY / this.height - 0.5) * 1.2;
    });

    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma !== null && e.beta !== null) {
        this.targetTiltX = (e.gamma / 30) * 1.4;
        this.targetTiltY = ((e.beta - 45) / 30) * 1.0;
      }
    });

    let lastTap = 0;
    window.addEventListener('pointerdown', (e) => {
      const now = performance.now();
      if (now - lastTap < 100) return;
      lastTap = now;

      if (this.sceneManager.currentScene === 5 && !e.target.closest('button') && !e.target.closest('input')) {
        const types = ['chrysanthemum', 'willow', 'peacock', 'ring', 'heart'];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        const themes = ['gold', 'teal', 'pink', 'violet'];
        const chosenTheme = themes[Math.floor(Math.random() * themes.length)];

        this.launchFromScreen(e.clientX, e.clientY, chosenTheme, chosenType);
      }
    });
  }
}
