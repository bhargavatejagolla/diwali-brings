/**
 * WaterPondEngine — Scene 01: The First Light
 * Simulates a moonlit lotus pond with procedural water ripples,
 * a floating clay diya in a blooming lotus, and dynamic surface reflections.
 */

export class WaterPondEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ripples = [];
    this.time = 0;
    this.flameFlicker = 0;
    this.resize();

    window.addEventListener('resize', () => this.resize());
    this.bindMouse();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  bindMouse() {
    const addRipple = (x, y) => {
      if (this.ripples.length < 15) {
        this.ripples.push({
          x,
          y,
          radius: 5,
          maxRadius: Math.min(this.width, this.height) * 0.45,
          alpha: 0.5,
          speed: 1.8
        });
      }
    };

    window.addEventListener('pointermove', (e) => {
      if (Math.random() > 0.85) {
        addRipple(e.clientX, e.clientY);
      }
    });

    window.addEventListener('pointerdown', (e) => {
      addRipple(e.clientX, e.clientY);
    });
  }

  triggerDisturbance(x, y) {
    this.ripples.push({
      x: x || this.width / 2,
      y: y || this.height * 0.62,
      radius: 4,
      maxRadius: Math.min(this.width, this.height) * 0.5,
      alpha: 0.6,
      speed: 2.2
    });
  }

  update() {
    this.time += 0.02;
    this.flameFlicker = Math.sin(this.time * 5) * 2 + Math.cos(this.time * 8) * 1.5;

    // Periodic gentle water ripple around floating lotus
    if (Math.random() > 0.97 && this.ripples.length < 8) {
      this.triggerDisturbance(this.width / 2, this.height * 0.62);
    }

    // Update ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += r.speed;
      r.alpha -= 0.005;
      if (r.alpha <= 0 || r.radius >= r.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height * 0.62;

    // 1. Moonlit Water Ambient Gradient
    const waterGrad = this.ctx.createLinearGradient(0, this.height * 0.4, 0, this.height);
    waterGrad.addColorStop(0, '#0a0d24');
    waterGrad.addColorStop(0.5, '#07162c');
    waterGrad.addColorStop(1, '#050a18');
    this.ctx.fillStyle = waterGrad;
    this.ctx.fillRect(0, this.height * 0.45, this.width, this.height * 0.55);

    // 2. Water Horizon Mist / Glow
    const mistGrad = this.ctx.createLinearGradient(0, this.height * 0.42, 0, this.height * 0.55);
    mistGrad.addColorStop(0, 'rgba(8, 126, 131, 0.18)'); // Peacock teal mist
    mistGrad.addColorStop(1, 'transparent');
    this.ctx.fillStyle = mistGrad;
    this.ctx.fillRect(0, this.height * 0.42, this.width, this.height * 0.13);

    // 3. Water Ripples (Concentric Luminous Rings)
    this.ctx.save();
    for (const r of this.ripples) {
      this.ctx.strokeStyle = `rgba(8, 126, 131, ${r.alpha * 0.4})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      // Slight vertical flattening for 3D perspective
      this.ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.35, 0, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.strokeStyle = `rgba(230, 185, 79, ${r.alpha * 0.2})`;
      this.ctx.lineWidth = 0.8;
      this.ctx.beginPath();
      this.ctx.ellipse(r.x, r.y, r.radius * 0.85, r.radius * 0.3, 0, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    this.ctx.restore();

    // 4. Diya Water Reflection (Subtle Amber Shimmer)
    this.ctx.save();
    const refH = 70;
    const refGrad = this.ctx.createLinearGradient(cx, cy + 12, cx, cy + 12 + refH);
    refGrad.addColorStop(0, 'rgba(230, 185, 79, 0.35)');
    refGrad.addColorStop(0.4, 'rgba(216, 76, 135, 0.15)');
    refGrad.addColorStop(1, 'transparent');

    this.ctx.fillStyle = refGrad;
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy + 30, 45 + Math.sin(this.time * 2) * 4, 18, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // 5. Floating Lotus Petals Base
    this.drawFloatingLotus(cx, cy);

    // 6. Floating Terracotta Diya with Flame
    this.drawDiyaAndFlame(cx, cy - 8);
  }

  drawFloatingLotus(cx, cy) {
    this.ctx.save();
    const petalCount = 12;
    const radius = Math.min(this.width * 0.15, 65);

    // Lotus outer leaf pad (water lily leaf)
    this.ctx.fillStyle = 'rgba(12, 60, 45, 0.7)';
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy + 10, radius * 1.35, radius * 0.55, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Pink Lotus Petals
    for (let i = 0; i < petalCount; i++) {
      const angle = (Math.PI * 2 * i) / petalCount + this.time * 0.05;
      const px = cx + Math.cos(angle) * (radius * 0.8);
      const py = cy + Math.sin(angle) * (radius * 0.35) + 6;

      const grad = this.ctx.createRadialGradient(px, py, 2, px, py, 25);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, '#d84c87'); // Lotus Pink
      grad.addColorStop(1, '#5a267f');   // Royal Violet

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.ellipse(px, py, 14, 22, angle + Math.PI / 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  drawDiyaAndFlame(cx, cy) {
    this.ctx.save();

    // Earthen Diya Body
    const lampW = 60;
    const lampH = 22;

    // Clay Base
    this.ctx.fillStyle = '#7a3112';
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy + 12, lampW * 0.5, lampH * 0.55, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Terracotta Rim
    const rimGrad = this.ctx.createLinearGradient(cx - lampW * 0.5, cy, cx + lampW * 0.5, cy);
    rimGrad.addColorStop(0, '#501e0a');
    rimGrad.addColorStop(0.5, '#b45309');
    rimGrad.addColorStop(1, '#501e0a');
    this.ctx.fillStyle = rimGrad;
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy + 8, lampW * 0.46, lampH * 0.38, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Glowing Ghee / Oil
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy + 8, lampW * 0.38, lampH * 0.28, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Flame Core & Aura
    const flameH = 48;
    const flameW = 16;
    const tipX = cx + this.flameFlicker * 0.8;
    const tipY = cy - flameH + 5;

    // Outer Aura
    const auraGrad = this.ctx.createRadialGradient(cx, cy - 15, 6, cx, cy - 15, 90);
    auraGrad.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
    auraGrad.addColorStop(0.5, 'rgba(216, 76, 135, 0.15)');
    auraGrad.addColorStop(1, 'transparent');
    this.ctx.fillStyle = auraGrad;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy - 15, 90, 0, Math.PI * 2);
    this.ctx.fill();

    // Flame Body (Amber/Crimson)
    const flameGrad = this.ctx.createRadialGradient(cx, cy - 10, 4, cx, cy - 10, flameH);
    flameGrad.addColorStop(0, '#fffbeb');
    flameGrad.addColorStop(0.3, '#f59e0b');
    flameGrad.addColorStop(0.7, '#dc2626');
    flameGrad.addColorStop(1, 'transparent');

    this.ctx.fillStyle = flameGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - flameW, cy);
    this.ctx.quadraticCurveTo(cx - flameW * 1.1, cy - flameH * 0.4, tipX, tipY);
    this.ctx.quadraticCurveTo(cx + flameW * 1.1, cy - flameH * 0.4, cx + flameW, cy);
    this.ctx.closePath();
    this.ctx.fill();

    // Inner Luminous Core
    const innerGrad = this.ctx.createLinearGradient(cx, cy, cx, cy - flameH * 0.6);
    innerGrad.addColorStop(0, '#60a5fa');
    innerGrad.addColorStop(0.4, '#ffffff');
    innerGrad.addColorStop(1, '#fef08a');
    this.ctx.fillStyle = innerGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - flameW * 0.4, cy);
    this.ctx.quadraticCurveTo(cx - flameW * 0.5, cy - flameH * 0.3, cx, cy - flameH * 0.6);
    this.ctx.quadraticCurveTo(cx + flameW * 0.5, cy - flameH * 0.3, cx + flameW * 0.4, cy);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  }

  loop() {
    this.update();
    this.draw();
  }
}
