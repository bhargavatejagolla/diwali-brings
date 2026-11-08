/**
 * Master Experience Orchestrator — "A Thousand Lights, One Beautiful Wish"
 * Dedicated to Dharji Shravya
 */

import { audioSynth } from './engines/audio-synth.js';
import { memory } from './engines/storage.js';
import { haptics } from './interactions/haptics.js';
import { breathDetector } from './interactions/breath.js';
import { voiceTrigger } from './interactions/voice.js';

import { WaterPondEngine } from './engines/water-pond.js';
import { RangoliEngine } from './engines/rangoli.js';
import { GardenEngine } from './engines/garden.js';
import { FireworksEngine } from './engines/fireworks.js';

class ExperienceApp {
  constructor() {
    this.currentScene = 1;
    this.totalScenes = 5;

    // Canvases
    this.waterCanvas = document.getElementById('water-canvas');
    this.rangoliCanvas = document.getElementById('rangoli-canvas');
    this.gardenCanvas = document.getElementById('garden-canvas');
    this.fireworksCanvas = document.getElementById('fireworks-canvas');

    // Engines
    this.waterEngine = null;
    this.rangoliEngine = null;
    this.gardenEngine = null;
    this.fireworksEngine = null;

    this.rangoliWishes = [
      { ring: "THE FIRST RING • PEACE", text: "Peace that gently stills every anxious thought." },
      { ring: "THE SECOND RING • JOY", text: "Joy that arrives unexpectedly in quiet moments." },
      { ring: "THE THIRD RING • LAUGHTER", text: "Laughter that stays long after the conversation ends." },
      { ring: "THE FOURTH RING • WARMTH", text: "Warmth that guides you through every tomorrow." },
      { ring: "THE FINAL RING • BEGINNINGS", text: "Beautiful beginnings waiting for you in the year ahead." }
    ];

    this.init();
  }

  init() {
    // 1. Initialize Canvas Engines
    this.waterEngine = new WaterPondEngine(this.waterCanvas);
    this.rangoliEngine = new RangoliEngine(this.rangoliCanvas);
    this.gardenEngine = new GardenEngine(this.gardenCanvas);
    this.fireworksEngine = new FireworksEngine(this.fireworksCanvas);

    // 2. Start Scene 1 Water Pond Loop
    const renderLoop = () => {
      if (this.currentScene === 1) {
        this.waterEngine.loop();
      }
      requestAnimationFrame(renderLoop);
    };
    renderLoop();

    // 3. Audio & Memory Hooks
    this.bindEvents();
    this.renderSavedWishes();

    // 4. Breath detector for Scene 1
    breathDetector.start(() => {
      this.waterEngine.triggerDisturbance();
      audioSynth.ensureContext();
      audioSynth.playIgnition();
      audioSynth.startAmbientDrone();
      haptics.flameIgnited();
      setTimeout(() => this.goToScene(2), 1000);
    });
  }

  goToScene(target) {
    if (target < 1 || target > this.totalScenes) return;

    // Cleanup previous scene
    const prevEl = document.getElementById(`scene-${this.currentScene}`);
    if (prevEl) prevEl.classList.remove('active');

    this.currentScene = target;

    // Activate next scene
    const nextEl = document.getElementById(`scene-${this.currentScene}`);
    if (nextEl) nextEl.classList.add('active');

    // Update Progress Indicator
    document.querySelectorAll('#scene-progress-bar .scene-step-pill').forEach((pill, idx) => {
      pill.classList.toggle('active', idx + 1 === this.currentScene);
    });

    audioSynth.ensureContext();
    haptics.lightTap();

    // Scene Specific Activations
    this.onSceneEntered(target);
  }

  onSceneEntered(scene) {
    switch (scene) {
      case 1:
        breathDetector.stop();
        break;

      case 2:
        // Rangoli of Wishes
        audioSynth.startAmbientDrone();
        audioSynth.playStarlightChime(587.33); // D5
        this.rangoliEngine.start((idx) => {
          this.updateRangoliWish(idx);
        });
        break;

      case 3:
        // Garden of Light (Dharji Shravya)
        this.rangoliEngine.stop();
        audioSynth.playStarlightChime(659.25); // E5
        this.gardenEngine.start();
        break;

      case 4:
        // The Letter
        this.gardenEngine.stop();
        audioSynth.playStarlightChime(523.25); // C5
        break;

      case 5:
        // A Sky Full of Wishes (Fireworks)
        this.fireworksCanvas.style.pointerEvents = 'auto';
        this.fireworksEngine.start();
        
        // Welcoming jewel burst
        setTimeout(() => {
          this.fireworksEngine.launchRocket(window.innerWidth * 0.5, window.innerHeight * 0.3, 'gold');
        }, 500);

        // Voice trigger
        voiceTrigger.start(() => {
          this.fireworksEngine.launchRocket(window.innerWidth * 0.35, window.innerHeight * 0.28, 'teal');
          this.fireworksEngine.launchRocket(window.innerWidth * 0.65, window.innerHeight * 0.28, 'pink');
        });
        break;
    }
  }

  updateRangoliWish(idx) {
    const wishData = this.rangoliWishes[idx];
    if (!wishData) return;

    const ringTag = document.getElementById('rangoli-ring-tag');
    const wishText = document.getElementById('rangoli-wish-text');
    const displayBox = document.getElementById('rangoli-wish-display');

    if (displayBox && ringTag && wishText) {
      displayBox.style.opacity = '0';
      setTimeout(() => {
        ringTag.textContent = wishData.ring;
        wishText.textContent = `"${wishData.text}"`;
        displayBox.style.opacity = '1';
        audioSynth.playStarlightChime(440 + idx * 80);
        haptics.lightTap();
      }, 300);
    }
  }

  renderSavedWishes() {
    const logEl = document.getElementById('wishes-log');
    if (!logEl) return;
    if (memory.data.wishes.length > 0) {
      const latest = memory.data.wishes.slice(-3).reverse();
      logEl.innerHTML = `<strong>✨ Wishes Released Into the Night:</strong><br>` + 
        latest.map(w => `&ldquo;${w.text}&rdquo; <small>(${w.date})</small>`).join('<br>');
    } else {
      logEl.innerHTML = '';
    }
  }

  bindEvents() {
    // 1. Scene Navigation Buttons
    document.querySelectorAll('.awaken-light-btn[data-next]').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = parseInt(btn.getAttribute('data-next'), 10);
        this.goToScene(next);
      });
    });

    // 2. Scene Progress Pills
    document.querySelectorAll('#scene-progress-bar .scene-step-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const step = parseInt(pill.getAttribute('data-step'), 10);
        this.goToScene(step);
      });
    });

    // 3. Audio Toggle
    const audioBtn = document.getElementById('audio-toggle-btn');
    const audioIcon = document.getElementById('audio-icon');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        audioSynth.ensureContext();
        audioSynth.startAmbientDrone();
        const isMuted = audioSynth.toggleMute();
        audioIcon.textContent = isMuted ? '🔇' : '🔊';
        haptics.lightTap();
      });
    }

    // 4. Jewel Fireworks Buttons
    document.querySelectorAll('.jewel-trigger-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme') || 'gold';
        audioSynth.ensureContext();
        this.fireworksEngine.launchRocket(window.innerWidth * 0.5, window.innerHeight * 0.3, theme);
      });
    });

    // Tap on Sky in Scene 5
    const ch5 = document.getElementById('scene-5');
    if (ch5) {
      ch5.addEventListener('pointerdown', (e) => {
        if (!e.target.closest('button') && !e.target.closest('input')) {
          audioSynth.ensureContext();
          const themes = ['gold', 'teal', 'pink', 'violet'];
          const chosen = themes[Math.floor(Math.random() * themes.length)];
          this.fireworksEngine.launchRocket(e.clientX, e.clientY, chosen);
        }
      });
    }

    // 5. Sky Wish Submission
    const releaseWishBtn = document.getElementById('release-wish-btn');
    const wishInput = document.getElementById('wish-input');
    if (releaseWishBtn && wishInput) {
      const submitWish = () => {
        const text = wishInput.value.trim();
        if (!text) return;
        memory.addWish(text);
        wishInput.value = '';
        this.renderSavedWishes();
        
        // Launch celebratory fireworks
        this.fireworksEngine.launchRocket(window.innerWidth * 0.5, window.innerHeight * 0.28, 'gold');
        setTimeout(() => {
          this.fireworksEngine.launchRocket(window.innerWidth * 0.35, window.innerHeight * 0.32, 'teal');
          this.fireworksEngine.launchRocket(window.innerWidth * 0.65, window.innerHeight * 0.32, 'pink');
        }, 300);

        audioSynth.playStarlightChime(880);
        haptics.sealBroken();
      };

      releaseWishBtn.addEventListener('click', submitWish);
      wishInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitWish();
      });
    }
  }
}

// Launch on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new ExperienceApp();
});
