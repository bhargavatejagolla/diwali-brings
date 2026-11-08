/**
 * RangoliEngine — Scene 02: The Rangoli of Wishes
 * Procedurally draws a vibrant, symmetrical Indian Rangoli mandala in glowing layers:
 * Peacock Teal (#087E83), Lotus Pink (#D84C87), Royal Violet (#5A267F), and Antique Gold (#E6B94F).
 */

export class RangoliEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.progress = 0;
    this.rotation = 0;
    this.running = false;
    this.currentWishIndex = 0;
    this.onRingComplete = null;
    this.resize();

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  start(onRingComplete) {
    this.progress = 0;
    this.running = true;
    this.onRingComplete = onRingComplete;
    this.loop();
  }

  stop() {
    this.running = false;
  }

  update() {
    if (!this.running) return;

    this.rotation += 0.0015;
    if (this.progress < 1) {
      this.progress += 0.004; // Smooth progressive drawing
      
      const newWishIdx = Math.min(4, Math.floor(this.progress * 5));
      if (newWishIdx !== this.currentWishIndex) {
        this.currentWishIndex = newWishIdx;
        if (this.onRingComplete) {
          this.onRingComplete(this.currentWishIndex);
        }
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height * 0.44;
    const maxRadius = Math.min(this.width, this.height) * 0.38;

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(this.rotation);

    // 1. Concentric Ring 1 (0.0 - 0.2): Core Golden Seed (Warmth)
    if (this.progress > 0.02) {
      const p1 = Math.min(1, this.progress / 0.2);
      this.ctx.strokeStyle = '#e6b94f'; // Antique Gold
      this.ctx.lineWidth = 2;
      this.ctx.shadowColor = '#e6b94f';
      this.ctx.shadowBlur = 10;

      this.ctx.beginPath();
      this.ctx.arc(0, 0, maxRadius * 0.15 * p1, 0, Math.PI * 2 * p1);
      this.ctx.stroke();

      // Inner 8-Petal Star
      const petals = 8;
      for (let i = 0; i < petals; i++) {
        const angle = (Math.PI * 2 * i) / petals;
        const r = maxRadius * 0.18 * p1;
        this.ctx.fillStyle = 'rgba(230, 185, 79, 0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(Math.cos(angle) * r, Math.sin(angle) * r, 6 * p1, 14 * p1, angle, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // 2. Concentric Ring 2 (0.2 - 0.4): Peacock Teal Filigree (Peace)
    if (this.progress > 0.2) {
      const p2 = Math.min(1, (this.progress - 0.2) / 0.2);
      this.ctx.strokeStyle = '#087e83'; // Peacock Teal
      this.ctx.lineWidth = 1.8;
      this.ctx.shadowColor = '#087e83';
      this.ctx.shadowBlur = 12;

      const count = 16;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        if (i / count <= p2) {
          const r = maxRadius * 0.35;
          this.ctx.beginPath();
          this.ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 16 * p2, 0, Math.PI * 2);
          this.ctx.stroke();
        }
      }

      this.ctx.beginPath();
      this.ctx.arc(0, 0, maxRadius * 0.35, 0, Math.PI * 2 * p2);
      this.ctx.stroke();
    }

    // 3. Concentric Ring 3 (0.4 - 0.6): Lotus Pink Petals (Joy)
    if (this.progress > 0.4) {
      const p3 = Math.min(1, (this.progress - 0.4) / 0.2);
      this.ctx.strokeStyle = '#d84c87'; // Lotus Pink
      this.ctx.lineWidth = 2.2;
      this.ctx.shadowColor = '#d84c87';
      this.ctx.shadowBlur = 15;

      const petals = 12;
      for (let i = 0; i < petals; i++) {
        if (i / petals <= p3) {
          const angle = (Math.PI * 2 * i) / petals;
          const r = maxRadius * 0.58;
          
          this.ctx.fillStyle = 'rgba(216, 76, 135, 0.35)';
          this.ctx.beginPath();
          this.ctx.ellipse(Math.cos(angle) * r, Math.sin(angle) * r, 18, 38, angle + Math.PI / 2, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();
        }
      }
    }

    // 4. Concentric Ring 4 (0.6 - 0.8): Royal Violet Radiance (Beginnings)
    if (this.progress > 0.6) {
      const p4 = Math.min(1, (this.progress - 0.6) / 0.2);
      this.ctx.strokeStyle = '#5a267f'; // Royal Violet
      this.ctx.lineWidth = 2;
      this.ctx.shadowColor = '#8b5cf6';
      this.ctx.shadowBlur = 12;

      this.ctx.beginPath();
      this.ctx.arc(0, 0, maxRadius * 0.78, 0, Math.PI * 2 * p4);
      this.ctx.stroke();

      const spikes = 24;
      for (let i = 0; i < spikes; i++) {
        if (i / spikes <= p4) {
          const angle = (Math.PI * 2 * i) / spikes;
          const r1 = maxRadius * 0.78;
          const r2 = maxRadius * 0.88;
          this.ctx.beginPath();
          this.ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
          this.ctx.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
          this.ctx.stroke();
        }
      }
    }

    // 5. Concentric Ring 5 (0.8 - 1.0): Outer Antique Gold Diyas (Endless Light)
    if (this.progress > 0.8) {
      const p5 = Math.min(1, (this.progress - 0.8) / 0.2);
      this.ctx.strokeStyle = '#e6b94f';
      this.ctx.fillStyle = '#e6b94f';
      this.ctx.shadowColor = '#e6b94f';
      this.ctx.shadowBlur = 14;

      const diyas = 16;
      for (let i = 0; i < diyas; i++) {
        if (i / diyas <= p5) {
          const angle = (Math.PI * 2 * i) / diyas;
          const r = maxRadius * 0.96;
          const dx = Math.cos(angle) * r;
          const dy = Math.sin(angle) * r;

          // Tiny golden flame point
          this.ctx.beginPath();
          this.ctx.arc(dx, dy, 4.5, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }

    this.ctx.restore();
  }

  loop() {
    if (!this.running) return;
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}
