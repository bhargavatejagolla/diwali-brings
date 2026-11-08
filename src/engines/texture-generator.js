/**
 * TextureGenerator — 100% Procedural PBR Textures (Zero External Image Files)
 * Generates photorealistic clay, marigold petals, rangoli mandalas, stone, and lanterns
 * in memory using HTML5 Canvas and converts them to high-performance THREE.CanvasTexture.
 */

import * as THREE from 'three';

export class TextureGenerator {
  // 1. Terracotta Baked Clay Diya Texture with Brass Inlay
  static createDiyaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Rich Indian Baked Terracotta Clay Base
    const bgGrad = ctx.createRadialGradient(256, 256, 10, 256, 256, 256);
    bgGrad.addColorStop(0, '#5a1e0b');
    bgGrad.addColorStop(0.5, '#85391d');
    bgGrad.addColorStop(0.85, '#a34825');
    bgGrad.addColorStop(1, '#662810');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 512, 512);

    // Fine earthen clay grain & pottery wheel rings
    ctx.lineWidth = 1.5;
    for (let r = 20; r < 250; r += 8) {
      ctx.strokeStyle = `rgba(0, 0, 0, ${0.06 + Math.random() * 0.08})`;
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 200, 150, ${0.05 + Math.random() * 0.06})`;
      ctx.beginPath();
      ctx.arc(256, 256, r + 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Outer Royal Brass Filigree Rim
    ctx.strokeStyle = '#e6b94f';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(256, 256, 240, 0, Math.PI * 2);
    ctx.stroke();

    // Engraved Diya Petal Motifs on the rim
    const petalCount = 28;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const x = 256 + Math.cos(angle) * 238;
      const y = 256 + Math.sin(angle) * 238;

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // 2. Fresh Marigold Flower Blossom Texture (Genda Phool)
  static createMarigoldTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Concentric layers of ruffled marigold petals
    const cx = 128;
    const cy = 128;

    // Dark core
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();

    // Layered petals (deep saffron -> fiery orange -> bright golden yellow)
    const layers = [
      { count: 18, radius: 45, color: '#b45309', width: 14, height: 26 },
      { count: 24, radius: 72, color: '#ea580c', width: 18, height: 32 },
      { count: 32, radius: 98, color: '#f59e0b', width: 22, height: 38 },
      { count: 40, radius: 120, color: '#fbbf24', width: 24, height: 42 }
    ];

    layers.forEach(layer => {
      ctx.fillStyle = layer.color;
      for (let i = 0; i < layer.count; i++) {
        const angle = (i / layer.count) * Math.PI * 2;
        const px = cx + Math.cos(angle) * layer.radius;
        const py = cy + Math.sin(angle) * layer.radius;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle + Math.PI / 2);

        // Petal shape with delicate tip ruffle
        ctx.beginPath();
        ctx.moveTo(0, -layer.height / 2);
        ctx.quadraticCurveTo(-layer.width / 2, 0, 0, layer.height / 2);
        ctx.quadraticCurveTo(layer.width / 2, 0, 0, -layer.height / 2);
        ctx.fill();

        // Subtle petal vein highlight
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -layer.height / 2);
        ctx.lineTo(0, layer.height / 2);
        ctx.stroke();

        ctx.restore();
      }
    });

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // 3. Authentic Royal Indian Rangoli Mandala (Crimson Kumkum, Turmeric, Peacock Cyan)
  static createRangoliTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const cx = 512;
    const cy = 512;

    // Dark wet courtyard slate stone base
    const stoneGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, 512);
    stoneGrad.addColorStop(0, '#10152b');
    stoneGrad.addColorStop(0.7, '#080c1a');
    stoneGrad.addColorStop(1, '#040612');
    ctx.fillStyle = stoneGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    // 1. Center Sacred Lotus (Crimson Kumkum & Gold)
    const centerGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 90);
    centerGrad.addColorStop(0, '#ffd700'); // Pure Gold
    centerGrad.addColorStop(0.5, '#dc2626'); // Deep Crimson
    centerGrad.addColorStop(1, '#991b1b');
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 85, 0, Math.PI * 2);
    ctx.fill();

    // 2. 8-Fold Central Lotus Petals (Turmeric Yellow & Saffron)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(0, 75);
      ctx.quadraticCurveTo(45, 130, 0, 175);
      ctx.quadraticCurveTo(-45, 130, 0, 75);
      ctx.fill();

      // White Rice Powder Outline
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();
    }

    // 3. Peacock Feather Ring (Emerald, Sapphire Cyan)
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      ctx.fillStyle = '#087e83'; // Peacock Teal
      ctx.beginPath();
      ctx.ellipse(0, 230, 32, 60, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0284c7'; // Cyan inner
      ctx.beginPath();
      ctx.ellipse(0, 230, 18, 38, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e6b94f'; // Gold dot
      ctx.beginPath();
      ctx.arc(0, 230, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();
    }

    // 4. Outer Lotus Pink & Magenta Petal Crests
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      ctx.fillStyle = '#d84c87'; // Royal Lotus Pink
      ctx.beginPath();
      ctx.moveTo(0, 310);
      ctx.quadraticCurveTo(50, 375, 0, 430);
      ctx.quadraticCurveTo(-50, 375, 0, 310);
      ctx.fill();

      ctx.strokeStyle = '#fef08a'; // Pale gold edge
      ctx.lineWidth = 2.8;
      ctx.stroke();

      ctx.restore();
    }

    // 5. Traditional Rice Powder Kolam Dots around the outer circle
    const dotCount = 48;
    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 2;
      const x = cx + Math.cos(angle) * 460;
      const y = cy + Math.sin(angle) * 460;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 5.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e6b94f';
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // 4. Luminous Glowing Spark Texture for Fireworks Embers (Soft Gaussian Glow)
  static createSparkGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.2, 'rgba(255, 240, 180, 0.95)');
    grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.45)');
    grad.addColorStop(0.85, 'rgba(217, 70, 239, 0.12)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // 5. Traditional Akash Kandil (Diwali Sky Lantern) Translucent Rice Paper Texture
  static createLanternPaperTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Warm glowing paper with gold diamond lattices
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(0.5, '#fef08a');
    grad.addColorStop(1, '#ea580c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Gold diamond grid pattern (traditional kandil paper lattice)
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.6)';
    ctx.lineWidth = 3;
    const step = 32;
    for (let x = -256; x < 512; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 256, 256);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, 256);
      ctx.lineTo(x + 256, 0);
      ctx.stroke();
    }

    // Star cutout in the center
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(128, 128, 28, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // 6. Carved Indian Sandstone Texture for Palace Courtyard Pillars
  static createSandstoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Warm Jaisalmer Yellow/Pink Sandstone
    ctx.fillStyle = '#2d2438';
    ctx.fillRect(0, 0, 512, 512);

    // Stone grain striations
    for (let y = 0; y < 512; y += 4) {
      ctx.fillStyle = `rgba(230, 185, 79, ${0.03 + Math.random() * 0.05})`;
      ctx.fillRect(0, y, 512, 2);
    }

    // Carved Rajput floral relief border
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 492, 492);
    ctx.strokeRect(20, 20, 472, 472);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
}
