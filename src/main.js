/**
 * Master Experience Orchestrator — "A Thousand Lights, One Beautiful Wish"
 * Single World Engine Architecture for Ultra-Smooth 60/120 FPS Performance
 */

import { audioSynth } from './engines/audio-synth.js';
import { memory } from './engines/storage.js';
import { haptics } from './interactions/haptics.js';
import { breathDetector } from './interactions/breath.js';
import { voiceTrigger } from './interactions/voice.js';
import { WorldEngine } from './engines/world-engine.js';

class ExperienceApp {
  constructor() {
    this.currentScene = 1;
    this.totalScenes = 5;

    // Master Canvas
    this.canvas = document.getElementById('world-canvas');
    this.world = null;

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
    // 1. Initialize Single Master World Engine
    this.world = new WorldEngine(this.canvas);
    this.world.onRingComplete = (idx) => this.updateRangoliWish(idx);
    this.world.loop(); // Single unified RAF loop

    // 2. Bind DOM Events
    this.bindEvents();
    this.renderSavedWishes();

    // 3. Breath detection on Scene 1
    breathDetector.start(() => {
      this.world.addRipple(window.innerWidth / 2, window.innerHeight * 0.62, 0.7);
      audioSynth.ensureContext();
      audioSynth.playIgnition();
      audioSynth.startAmbientDrone();
      haptics.flameIgnited();
      setTimeout(() => this.goToScene(2), 1000);
    });
  }

  goToScene(target) {
    if (target < 1 || target > this.totalScenes) return;

    // Transition DOM views
    const prevEl = document.getElementById(`scene-${this.currentScene}`);
    if (prevEl) prevEl.classList.remove('active');

    this.currentScene = target;

    const nextEl = document.getElementById(`scene-${this.currentScene}`);
    if (nextEl) nextEl.classList.add('active');

    // Update Progress Navigation
    document.querySelectorAll('#scene-progress-bar .scene-step-pill').forEach((pill, idx) => {
      pill.classList.toggle('active', idx + 1 === this.currentScene);
    });

    // Notify World Engine
    this.world.setScene(target);

    audioSynth.ensureContext();
    haptics.lightTap();

    this.onSceneEntered(target);
  }

  onSceneEntered(scene) {
    switch (scene) {
      case 1:
        breathDetector.stop();
        break;

      case 2:
        audioSynth.startAmbientDrone();
        audioSynth.playStarlightChime(587.33);
        break;

      case 3:
        audioSynth.playStarlightChime(659.25);
        break;

      case 4:
        audioSynth.playStarlightChime(523.25);
        break;

      case 5:
        // Launch welcoming celebratory firework
        setTimeout(() => {
          this.world.launchFirework(window.innerWidth * 0.5, window.innerHeight * 0.3, 'gold');
        }, 400);

        // Voice trigger
        voiceTrigger.start(() => {
          this.world.launchFirework(window.innerWidth * 0.35, window.innerHeight * 0.28, 'teal');
          this.world.launchFirework(window.innerWidth * 0.65, window.innerHeight * 0.28, 'pink');
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
        audioSynth.playStarlightChime(440 + idx * 70);
        haptics.lightTap();
      }, 250);
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
        this.world.launchFirework(window.innerWidth * 0.5, window.innerHeight * 0.3, theme);
      });
    });

    // 5. Sky Wish Submission in Scene 5
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
        this.world.launchFirework(window.innerWidth * 0.5, window.innerHeight * 0.28, 'gold');
        setTimeout(() => {
          this.world.launchFirework(window.innerWidth * 0.35, window.innerHeight * 0.32, 'teal');
          this.world.launchFirework(window.innerWidth * 0.65, window.innerHeight * 0.32, 'pink');
        }, 250);

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
