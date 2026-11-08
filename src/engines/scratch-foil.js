/**
 * ScratchFoilEngine — Tactile 24K Gold Foil Scratch-to-Reveal System (Scene 4)
 * Allows Dharji Shravya to physically scratch off the shimmering gold foil veil.
 */

import { haptics } from '../interactions/haptics.js';

export class ScratchFoilEngine {
  constructor(canvas, onRevealed) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    this.onRevealed = onRevealed;
    this.isRevealed = false;
    this.isDrawing = false;
    this.lastPoint = null;

    this.init();
  }

  init() {
    this.resize();
    this.drawGoldFoil();
    this.bindEvents();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  drawGoldFoil() {
    this.ctx.globalCompositeOperation = 'source-over';

    // 24K Metallic Gold Leaf Gradient
    const grad = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    grad.addColorStop(0, '#c59b27');
    grad.addColorStop(0.2, '#f5d77f');
    grad.addColorStop(0.4, '#b38728');
    grad.addColorStop(0.6, '#fbf5b7');
    grad.addColorStop(0.8, '#aa771c');
    grad.addColorStop(1, '#926014');

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Subtle Gold Stamping Pattern
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    this.ctx.font = '600 11.5px "Montserrat", sans-serif';
    this.ctx.letterSpacing = '3px';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText("SCRATCH GENTLY TO REVEAL", this.width / 2, this.height / 2);

    // Delicate Filigree Border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(6, 6, this.width - 12, this.height - 12);
  }

  bindEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const start = (e) => {
      if (this.isRevealed) return;
      this.isDrawing = true;
      this.lastPoint = getPos(e);
      this.scratch(this.lastPoint.x, this.lastPoint.y);
    };

    const move = (e) => {
      if (!this.isDrawing || this.isRevealed) return;
      e.preventDefault();
      const pos = getPos(e);
      this.scratch(pos.x, pos.y);
      this.lastPoint = pos;
    };

    const end = () => {
      this.isDrawing = false;
      this.lastPoint = null;
      this.checkRevealedPercentage();
    };

    this.canvas.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    this.canvas.addEventListener('touchstart', start, { passive: false });
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
  }

  scratch(x, y) {
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 24, 0, Math.PI * 2);
    this.ctx.fill();

    if (this.lastPoint) {
      this.ctx.lineWidth = 48;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    }

    haptics.foilScratch();
  }

  checkRevealedPercentage() {
    if (this.isRevealed) return;

    try {
      const imgData = this.ctx.getImageData(0, 0, this.width, this.height);
      const pixels = imgData.data;
      let transparentCount = 0;
      const step = 28;

      for (let i = 3; i < pixels.length; i += step * 4) {
        if (pixels[i] === 0) transparentCount++;
      }

      const totalSampled = pixels.length / (step * 4);
      const ratio = transparentCount / totalSampled;

      if (ratio > 0.38) {
        this.isRevealed = true;
        this.canvas.style.transition = 'opacity 0.8s ease-out';
        this.canvas.style.opacity = '0';
        setTimeout(() => {
          this.canvas.style.display = 'none';
          if (this.onRevealed) this.onRevealed();
        }, 800);
      }
    } catch (e) {
      this.isRevealed = true;
      if (this.onRevealed) this.onRevealed();
    }
  }
}
