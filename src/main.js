/**
 * Master Experience Orchestrator — "A Thousand Lights, One Beautiful Wish"
 * Cinematic Photorealistic Living World & Pyrotechnics Engine
 * Dedicated to Dharvi Shravya — Zero Emojis, Locked 60/120 FPS
 */

import { Engine } from './core/Engine.js';
import { audioSynth } from './audio/AudioEngine.js';
import { memory } from './core/storage.js';
import { haptics } from './interactions/haptics.js';
import { breathDetector } from './interactions/breath.js';
import { voiceTrigger } from './interactions/voice.js';
import { gsap } from 'gsap';

class ExperienceApp {
  constructor() {
    this.currentScene = 1;
    this.totalScenes = 5;

    // Real-Time 3D WebGL Canvas
    this.webglCanvas = document.getElementById('webgl-canvas');
    this.world = null;

    this.rangoliWishes = [
      { ring: "THE FIRST RING / PEACE", text: "Peace that gently stills every anxious thought." },
      { ring: "THE SECOND RING / JOY", text: "Joy that arrives unexpectedly in quiet moments." },
      { ring: "THE THIRD RING / LAUGHTER", text: "Laughter that stays long after the conversation ends." },
      { ring: "THE FOURTH RING / WARMTH", text: "Warmth that guides you through every tomorrow." },
      { ring: "THE FINAL RING / BEGINNINGS", text: "Beautiful beginnings waiting for you in the year ahead." }
    ];

    this.rangoliInterval = null;
    this.rangoliIndex = 0;

    this.init();
  }

  init() {
    // 1. Initialize Master Real-Time 3D WebGL World Engine
    if (this.webglCanvas) {
      this.world = new Engine(this.webglCanvas);
      this.world.start();
    }

    // 2. Bind DOM Events
    this.bindEvents();
    this.renderSavedWishes();

    // 3. Breath Detection on Scene 1
    breathDetector.start(() => {
      if (this.world) {
        this.world.spawnRipple(window.innerWidth / 2, window.innerHeight * 0.65, 0.85);
      }
      audioSynth.ensureContext();
      audioSynth.playIgnition();
      audioSynth.startAmbientDrone();
      haptics.flameIgnited();
      setTimeout(() => this.goToScene(2), 900);
    });
  }

  goToScene(target) {
    if (target < 1 || target > this.totalScenes || target === this.currentScene) return;

    const prevEl = document.getElementById(`scene-${this.currentScene}`);
    const nextEl = document.getElementById(`scene-${target}`);

    if (prevEl && nextEl) {
      const tl = gsap.timeline();

      tl.to(prevEl, {
        opacity: 0,
        y: -12,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => {
          prevEl.classList.remove('active');
          gsap.set(prevEl, { clearProps: 'opacity,transform' });
        }
      });

      tl.call(() => {
        this.currentScene = target;
        nextEl.classList.add('active');

        // Update Progress Navigation
        document.querySelectorAll('#scene-progress-bar .scene-step-pill').forEach((pill, idx) => {
          pill.classList.toggle('active', idx + 1 === this.currentScene);
        });

        // Notify Cinematic World Engine
        if (this.world) {
          this.world.setScene(target);
        }

        this.onSceneEntered(target);
      });

      tl.fromTo(nextEl,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }
      );
    } else {
      if (prevEl) prevEl.classList.remove('active');
      this.currentScene = target;
      if (nextEl) nextEl.classList.add('active');
      if (this.world) this.world.setScene(target);
      this.onSceneEntered(target);
    }

    audioSynth.ensureContext();
    haptics.lightTap();
  }

  onSceneEntered(scene) {
    if (this.rangoliInterval) {
      clearInterval(this.rangoliInterval);
      this.rangoliInterval = null;
    }

    switch (scene) {
      case 1:
        breathDetector.stop();
        break;

      case 2:
        audioSynth.startAmbientDrone();
        audioSynth.playStarlightChime(587.33);
        this.rangoliIndex = 0;
        this.updateRangoliWish(0);
        this.rangoliInterval = setInterval(() => {
          this.rangoliIndex = (this.rangoliIndex + 1) % this.rangoliWishes.length;
          this.updateRangoliWish(this.rangoliIndex);
        }, 3200);
        break;

      case 3:
        audioSynth.playStarlightChime(659.25);
        break;

      case 4:
        audioSynth.playStarlightChime(523.25);
        haptics.lightTap();
        // Subtle luxurious focus on the letter
        const letterCard = document.querySelector('.luxury-letter-card');
        if (letterCard) {
          gsap.fromTo(letterCard, 
            { scale: 0.96, opacity: 0.8 }, 
            { scale: 1, opacity: 1, duration: 0.8, ease: 'power2.out' }
          );
        }
        break;

      case 5:
        // Launch welcoming celebratory firework barrage
        setTimeout(() => {
          if (this.world) {
            this.world.launchBarrage('gold', 'willow');
            setTimeout(() => {
              this.world.launchFirework(-7, 21, 'teal', 'peacock');
              this.world.launchFirework(7, 21, 'pink', 'heart');
            }, 300);
          }
        }, 350);

        // Voice trigger
        voiceTrigger.start(() => {
          if (this.world) {
            this.world.triggerGrandFinale();
          }
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
      logEl.innerHTML = `<strong>Wishes Released Into the Night:</strong><br>` + 
        latest.map(w => `&ldquo;${w.text}&rdquo; <small>(${w.date})</small>`).join('<br>');
    } else {
      logEl.innerHTML = '';
    }
  }

  bindEvents() {
    // 0. Ensure audio unlocks on first user touch anywhere
    window.addEventListener('pointerdown', () => {
      audioSynth.ensureContext();
    }, { once: true });

    // 1. Scene Navigation Buttons
    document.querySelectorAll('.luxury-action-btn[data-next]').forEach(btn => {
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

    // 3. Audio Toggle (Zero Emojis)
    const audioBtn = document.getElementById('audio-toggle-btn');
    const audioLabel = document.getElementById('audio-label');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        audioSynth.ensureContext();
        audioSynth.startAmbientDrone();
        const isMuted = audioSynth.toggleMute();
        audioLabel.textContent = isMuted ? 'SOUND MUTED' : 'SOUND ON';
        haptics.lightTap();
      });
    }

    // 4. Jewel Fireworks Buttons (Grand Barrages)
    document.querySelectorAll('.jewel-trigger-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme') || 'gold';
        audioSynth.ensureContext();
        if (this.world) {
          const typeMap = {
            gold: 'willow',
            teal: 'peacock',
            pink: 'heart',
            violet: 'ring'
          };
          const type = typeMap[theme] || 'chrysanthemum';
          this.world.launchBarrage(theme, type);
        }
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
        
        // Launch ascending wish lantern and grand celebratory fireworks barrage
        if (this.world) {
          this.world.releaseWish(text);
        }

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
