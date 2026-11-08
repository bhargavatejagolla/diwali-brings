/**
 * Master Experience Orchestrator — "The Diya That Stayed Lit"
 * Dedicated to Dharji Shravya
 */

import { audioSynth } from './engines/audio-synth.js';
import { memory } from './engines/storage.js';
import { haptics } from './interactions/haptics.js';
import { tilt } from './interactions/tilt.js';
import { breathDetector } from './interactions/breath.js';
import { voiceTrigger } from './interactions/voice.js';
import { StarfieldEngine } from './engines/starfield.js';
import { DiyaFlameEngine } from './engines/diya-flame.js';
import { CatenaryThreadEngine } from './engines/catenary-thread.js';
import { FireworksEngine } from './engines/fireworks.js';
import { ScratchFoilEngine } from './engines/scratch-foil.js';

class ExperienceApp {
  constructor() {
    this.currentChapter = 1;
    this.totalChapters = 7;
    
    // Canvas elements
    this.bgCanvas = document.getElementById('bg-canvas');
    this.threadCanvas = document.getElementById('thread-canvas');
    this.diyaCanvas = document.getElementById('diya-canvas');
    this.fireworksCanvas = document.getElementById('fireworks-canvas');
    this.scratchCanvas = document.getElementById('scratch-canvas');

    // Engines
    this.starfield = null;
    this.threadEngine = null;
    this.diyaEngine = null;
    this.fireworksEngine = null;
    this.scratchFoil = null;

    this.init();
  }

  init() {
    // 1. Initialize Canvases & Engines
    this.starfield = new StarfieldEngine(this.bgCanvas);
    this.threadEngine = new CatenaryThreadEngine(this.threadCanvas);
    this.diyaEngine = new DiyaFlameEngine(this.diyaCanvas);
    this.fireworksEngine = new FireworksEngine(this.fireworksCanvas);

    // 2. Start Animation Loops
    this.starfield.loop();

    const mainLoop = () => {
      this.diyaEngine.loop();
      if (this.currentChapter === 4) {
        this.threadEngine.loop();
      } else {
        const ctx = this.threadCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.threadCanvas.width, this.threadCanvas.height);
      }
      requestAnimationFrame(mainLoop);
    };
    mainLoop();

    // 3. Memory & Personalization Hook
    this.applyMemoryState();

    // 4. Bind UI Event Handlers
    this.bindEvents();

    // 5. Start Mic Breath Detection for Chapter 1
    this.setupBreathDetection();
  }

  applyMemoryState() {
    const greetingText = document.getElementById('memory-greeting-text');
    const subText = document.getElementById('memory-sub-text');

    if (memory.data.isLit) {
      greetingText.innerHTML = `"You came back, Shravya.<br>I kept it burning for you."`;
      subText.textContent = `A LIGHT THAT WILL NEVER GO OUT • VISIT #${memory.data.visitCount}`;
      this.diyaEngine.ignite();
    } else {
      greetingText.innerHTML = `"Tonight, every diya has a reason to shine."`;
      subText.textContent = `AND THIS WORLD WAS LIT FOR YOU, SHRAVYA`;
    }

    // Render past wishes if any
    this.renderSavedWishes();
  }

  renderSavedWishes() {
    const logEl = document.getElementById('wishes-log');
    if (!logEl) return;
    if (memory.data.wishes.length > 0) {
      const latest = memory.data.wishes.slice(-3).reverse();
      logEl.innerHTML = `<strong>✨ Floating Wishes in Your Sky:</strong><br>` + 
        latest.map(w => `&ldquo;${w.text}&rdquo; <small>(${w.date})</small>`).join('<br>');
    } else {
      logEl.innerHTML = '';
    }
  }

  setupBreathDetection() {
    breathDetector.start(() => {
      this.handleIgnition();
    });
  }

  handleIgnition() {
    if (this.diyaEngine.isLit && this.currentChapter > 1) return;

    audioSynth.ensureContext();
    audioSynth.playIgnition();
    audioSynth.startAmbientDrone();
    haptics.flameIgnited();
    this.diyaEngine.ignite();
    memory.markDiyaLit();
    breathDetector.stop();

    // Smooth transition to Chapter 2
    setTimeout(() => {
      this.goToChapter(2);
    }, 1200);
  }

  goToChapter(target) {
    if (target < 1 || target > this.totalChapters) return;

    // Previous Chapter cleanup
    const prevEl = document.getElementById(`chapter-${this.currentChapter}`);
    if (prevEl) prevEl.classList.remove('active');

    this.currentChapter = target;

    // Next Chapter setup
    const nextEl = document.getElementById(`chapter-${this.currentChapter}`);
    if (nextEl) nextEl.classList.add('active');

    // Update Dots
    document.querySelectorAll('#chapter-dots .dot').forEach((dot, idx) => {
      dot.classList.toggle('active', idx + 1 === this.currentChapter);
    });

    haptics.lightTap();

    // Chapter Specific Activations
    this.onChapterEntered(target);
  }

  onChapterEntered(chapter) {
    switch (chapter) {
      case 2:
        audioSynth.ensureContext();
        break;

      case 3:
        // Activate Constellation of "DHARJI SHRAVYA"
        this.starfield.activateConstellation();
        break;

      case 4:
        // Catenary Thread between the two souls
        audioSynth.playStarlightChime(523.25);
        break;

      case 5:
        // Initialize Gold Foil Scratch Card
        setTimeout(() => {
          if (!this.scratchFoil && this.scratchCanvas) {
            this.scratchFoil = new ScratchFoilEngine(this.scratchCanvas, () => {
              audioSynth.playSealBreak();
              haptics.sealBroken();
            });
          } else if (this.scratchFoil) {
            this.scratchFoil.resize();
            this.scratchFoil.drawGoldFoil();
          }
        }, 100);
        break;

      case 6:
        // Fireworks Symphony
        this.fireworksCanvas.style.pointerEvents = 'auto';
        this.fireworksEngine.start();
        // Launch welcoming golden willow
        setTimeout(() => {
          this.fireworksEngine.launchRocket(window.innerWidth / 2, window.innerHeight * 0.35, 'heart');
        }, 600);

        // Voice Recognition for "Happy Diwali"
        voiceTrigger.start(() => {
          this.fireworksEngine.launchRocket(window.innerWidth * 0.5, window.innerHeight * 0.3, 'heart');
          setTimeout(() => {
            this.fireworksEngine.launchRocket(window.innerWidth * 0.35, window.innerHeight * 0.25, 'gold_willow');
            this.fireworksEngine.launchRocket(window.innerWidth * 0.65, window.innerHeight * 0.25, 'gold_willow');
          }, 400);
        });
        break;

      case 7:
        this.fireworksCanvas.style.pointerEvents = 'none';
        voiceTrigger.stop();
        break;
    }
  }

  bindEvents() {
    // 1. Diya Ignition Button
    const igniteBtn = document.getElementById('ignite-btn');
    if (igniteBtn) {
      igniteBtn.addEventListener('click', () => this.handleIgnition());
      igniteBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handleIgnition();
      });
    }

    // 2. Chapter Progression Buttons
    document.querySelectorAll('.gold-proceed-btn[data-next]').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = parseInt(btn.getAttribute('data-next'), 10);
        this.goToChapter(next);
      });
    });

    // 3. Audio Toggle
    const audioBtn = document.getElementById('audio-toggle-btn');
    const audioIcon = document.getElementById('audio-icon');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        audioSynth.ensureContext();
        const isMuted = audioSynth.toggleMute();
        audioIcon.textContent = isMuted ? '🔇' : '🔊';
        haptics.lightTap();
      });
    }

    // 4. Fireworks Interactive Click/Tap
    const handleFireworkLaunch = (e) => {
      if (this.currentChapter === 6 && !e.target.closest('button')) {
        audioSynth.ensureContext();
        this.fireworksEngine.launchRocket(e.clientX, e.clientY, Math.random() > 0.4 ? 'gold_willow' : 'heart');
      }
    };

    this.fireworksCanvas.addEventListener('pointerdown', handleFireworkLaunch);
    const ch6 = document.getElementById('chapter-6');
    if (ch6) {
      ch6.addEventListener('pointerdown', handleFireworkLaunch);
    }

    // Chapter 6 Fireworks Control Buttons
    const btnWillow = document.getElementById('fw-willow-btn');
    const btnHeart = document.getElementById('fw-heart-btn');
    const btnFinale = document.getElementById('fw-finale-btn');

    if (btnWillow) {
      btnWillow.addEventListener('click', () => {
        audioSynth.ensureContext();
        this.fireworksEngine.launchRocket(window.innerWidth * 0.5, window.innerHeight * 0.3, 'gold_willow');
      });
    }

    if (btnHeart) {
      btnHeart.addEventListener('click', () => {
        audioSynth.ensureContext();
        this.fireworksEngine.launchRocket(window.innerWidth * 0.5, window.innerHeight * 0.32, 'heart');
      });
    }

    if (btnFinale) {
      btnFinale.addEventListener('click', () => {
        audioSynth.ensureContext();
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.fireworksEngine.launchRocket(w * 0.3, h * 0.3, 'gold_willow');
        setTimeout(() => this.fireworksEngine.launchRocket(w * 0.7, h * 0.28, 'gold_willow'), 250);
        setTimeout(() => this.fireworksEngine.launchRocket(w * 0.5, h * 0.22, 'heart'), 500);
      });
    }

    // 5. Wish Submission in Chapter 7
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
        this.fireworksEngine.start();
        this.fireworksEngine.launchRocket(window.innerWidth * 0.5, window.innerHeight * 0.3, 'heart');
        audioSynth.playStarlightChime(880); // A5
        haptics.sealBroken();
      };

      releaseWishBtn.addEventListener('click', submitWish);
      wishInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitWish();
      });
    }

    // 6. Secret Easter Egg
    const easterEggStar = document.getElementById('easter-egg-star');
    const secretModal = document.getElementById('secret-modal');
    const closeSecretBtn = document.getElementById('close-secret-btn');

    if (easterEggStar && secretModal) {
      easterEggStar.addEventListener('click', () => {
        audioSynth.ensureContext();
        audioSynth.playStarlightChime(987.77); // B5
        haptics.sealBroken();
        secretModal.classList.add('open');
        memory.unlockSecret();
      });
    }

    if (closeSecretBtn && secretModal) {
      closeSecretBtn.addEventListener('click', () => {
        secretModal.classList.remove('open');
        haptics.lightTap();
      });
    }

    // 7. Clickable Navigation Dots
    document.querySelectorAll('#chapter-dots .dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const step = parseInt(dot.getAttribute('data-step'), 10);
        this.goToChapter(step);
      });
    });
  }
}

// Launch on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new ExperienceApp();
});
