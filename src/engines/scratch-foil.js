/**
 * ScratchFoil Engine — Shimmering gold foil scratch-to-reveal canvas
 * Allows Dharji Shravya to scratch away the golden veil to reveal the letter.
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
    this.clearedCheckTimer = null;

    this.init();
  }

  init() {
    this.resize();
    this.drawGoldFoil();
    this.bindEvents();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  drawGoldFoil() {
    this.ctx.globalCompositeOperation = 'source-over';
    
    // Metallic gold gradient
    const grad = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    grad.addColorStop(0, '#d4af37');
    grad.addColorStop(0.25, '#fef08a');
    grad.addColorStop(0.5, '#b45309');
    grad.addColorStop(0.75, '#fde047');
    grad.addColorStop(1, '#92400e');

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Subtle decorative pattern overlay
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.font = '600 13px "Cinzel Decorative", serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText("✨ GENTLY SCRATCH TO REVEAL ✨", this.width / 2, this.height / 2);

    // Golden border
    this.ctx.strokeStyle = '#ffd700';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(4, 4, this.width - 8, this.height - 8);
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
    this.ctx.arc(x, y, 22, 0, Math.PI * 2);
    this.ctx.fill();

    if (this.lastPoint) {
      this.ctx.lineWidth = 44;
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
      const step = 32; // Sample every 32nd pixel for speed

      for (let i = 3; i < pixels.length; i += step * 4) {
        if (pixels[i] === 0) {
          transparentCount++;
        }
      }

      const totalSampled = pixels.length / (step * 4);
      const ratio = transparentCount / totalSampled;

      if (ratio > 0.42) {
        this.isRevealed = true;
        this.canvas.style.transition = 'opacity 0.8s ease-out';
        this.canvas.style.opacity = '0';
        setTimeout(() => {
          this.canvas.style.display = 'none';
          if (this.onRevealed) this.onRevealed();
        }, 800);
      }
    } catch (e) {
      // Fallback
      this.isRevealed = true;
      if (this.onRevealed) this.onRevealed();
    }
  }
}
