/**
 * TextureGenerator — 100% Procedural High-Fidelity PBR Textures (Zero External Image Files)
 * Generates photorealistic earthenware clay, fresh marigolds, sacred rangoli mandalas,
 * polished royal marble, carved sandstone jali screens, and incandescent pyrotechnic sprites
 * in memory using HTML5 Canvas and converts them to high-performance THREE.CanvasTexture.
 */

import * as THREE from 'three';

export class TextureGenerator {
  // 1. Handcrafted Indian Terracotta Clay Diya Texture with Natural Porosity & Soot
  static createDiyaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Rich Indian Baked Earthen Terracotta Base
    const bgGrad = ctx.createRadialGradient(256, 256, 15, 256, 256, 256);
    bgGrad.addColorStop(0, '#6c2b14');
    bgGrad.addColorStop(0.4, '#8a371c');
    bgGrad.addColorStop(0.75, '#ab4626');
    bgGrad.addColorStop(0.92, '#7a3118');
    bgGrad.addColorStop(1, '#4a1b0c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 512, 512);

    // Fine pottery wheel grooves & clay porous texture
    for (let r = 18; r < 252; r += 6) {
      ctx.strokeStyle = `rgba(0, 0, 0, ${0.05 + Math.random() * 0.08})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 190, 140, ${0.04 + Math.random() * 0.06})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(256, 256, r + 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Natural clay mineral speckles
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const rad = Math.random() * 1.5;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 220, 180, 0.1)';
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Handcrafted 24K Gold Leaf Inlay Rim
    ctx.strokeStyle = '#e6b94f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(256, 256, 242, 0, Math.PI * 2);
    ctx.stroke();

    // Sacred petal notches on the rim
    const petalCount = 32;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const x = 256 + Math.cos(angle) * 240;
      const y = 256 + Math.sin(angle) * 240;

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // 2. Liquid Ghee / Sesame Oil Texture with Meniscus and Flame Reflections
  static createGheeLiquidTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, '#fef08a'); // Warm golden core
    grad.addColorStop(0.4, '#f59e0b'); // Golden amber ghee
    grad.addColorStop(0.8, '#d97706'); // Deep amber
    grad.addColorStop(1, '#92400e'); // Meniscus contact edge
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(128, 128, 128, 0, Math.PI * 2);
    ctx.fill();

    // Subtle liquid surface ripples
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.25)';
    ctx.lineWidth = 1.5;
    for (let r = 25; r < 110; r += 20) {
      ctx.beginPath();
      ctx.arc(128, 128, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // 3. Fresh Marigold Flower Blossom Texture (Genda Phool) with Clean Alpha
  static createMarigoldTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 256);

    const cx = 128;
    const cy = 128;

    // Deep saffron core
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();

    // Layered ruffled petals (deep saffron -> fiery orange -> bright golden yellow)
    const layers = [
      { count: 18, radius: 44, color: '#b45309', width: 16, height: 28 },
      { count: 24, radius: 70, color: '#ea580c', width: 20, height: 34 },
      { count: 32, radius: 94, color: '#f59e0b', width: 24, height: 40 },
      { count: 40, radius: 116, color: '#fbbf24', width: 26, height: 44 }
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

  // 4. Authentic Royal Indian Rangoli Mandala (Kumkum, Turmeric, Peacock Powders)
  static createRangoliTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const cx = 512;
    const cy = 512;

    // Dark polished marble terrace slab base with subtle sheen
    const stoneGrad = ctx.createRadialGradient(cx, cy, 60, cx, cy, 512);
    stoneGrad.addColorStop(0, '#161c38');
    stoneGrad.addColorStop(0.7, '#0d1226');
    stoneGrad.addColorStop(1, '#060814');
    ctx.fillStyle = stoneGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    // 1. Center Sacred Lotus (Crimson Kumkum & Pure Gold)
    const centerGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 95);
    centerGrad.addColorStop(0, '#ffd700');
    centerGrad.addColorStop(0.5, '#dc2626');
    centerGrad.addColorStop(1, '#991b1b');
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 90, 0, Math.PI * 2);
    ctx.fill();

    // 2. 8-Fold Central Lotus Petals (Turmeric Yellow & Saffron)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(0, 80);
      ctx.quadraticCurveTo(48, 135, 0, 180);
      ctx.quadraticCurveTo(-48, 135, 0, 80);
      ctx.fill();

      // White Rice Powder Outline
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      ctx.restore();
    }

    // 3. Peacock Feather Ring (Emerald, Sapphire Cyan & Gold)
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      ctx.fillStyle = '#087e83'; // Peacock Teal
      ctx.beginPath();
      ctx.ellipse(0, 235, 34, 62, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0284c7'; // Sapphire Cyan inner
      ctx.beginPath();
      ctx.ellipse(0, 235, 20, 40, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e6b94f'; // Gold dot
      ctx.beginPath();
      ctx.arc(0, 235, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2.8;
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
      ctx.moveTo(0, 315);
      ctx.quadraticCurveTo(52, 380, 0, 435);
      ctx.quadraticCurveTo(-52, 380, 0, 315);
      ctx.fill();

      ctx.strokeStyle = '#fef08a'; // Pale gold edge
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();
    }

    // 5. Traditional Rice Powder Kolam Dots around the outer circle
    const dotCount = 48;
    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 2;
      const x = cx + Math.cos(angle) * 465;
      const y = cy + Math.sin(angle) * 465;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e6b94f';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // 5. Luminous Incandescent Spark Sprite for Fireworks & Embers (Zero Alpha Box Clipping)
  static createSparkGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.2, 'rgba(255, 245, 200, 0.95)');
    grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.45)');
    grad.addColorStop(0.8, 'rgba(217, 70, 239, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  // 6. Traditional Akash Kandil (Diwali Sky Lantern) Translucent Rice Paper Texture
  static createLanternPaperTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(0.5, '#fef08a');
    grad.addColorStop(1, '#ea580c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = 'rgba(217, 119, 6, 0.65)';
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

    // Traditional 8-Pointed Star Motif on lantern sides
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(128, 128, 26, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // 7. Authentic Rajasthani Jali Screen (Intricate Lattice Screen with Clean Alpha)
  static createJaliScreenTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 512);

    // Warm carved sandstone frame
    ctx.fillStyle = '#4a2f1c';
    ctx.fillRect(0, 0, 512, 512);

    // Cutout geometric star-and-hexagon jali lattice
    ctx.globalCompositeOperation = 'destination-out';
    const hexRadius = 28;
    const rowHeight = hexRadius * 1.5;
    const colWidth = hexRadius * Math.sqrt(3);

    for (let y = 30; y < 490; y += rowHeight) {
      const offsetX = (Math.round(y / rowHeight) % 2 === 0) ? 0 : colWidth / 2;
      for (let x = 30 + offsetX; x < 490; x += colWidth) {
        // Cut out 6-pointed star / flower perforation
        ctx.beginPath();
        for (let a = 0; a < 12; a++) {
          const angle = (a / 12) * Math.PI * 2;
          const r = (a % 2 === 0) ? hexRadius * 0.8 : hexRadius * 0.42;
          const px = x + Math.cos(angle) * r;
          const py = y + Math.sin(angle) * r;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    // Elegant gold border trim
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.6)';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 492, 492);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // 8. Polished Dark Indian Marble Floor with Subtle Golden Veins
  static createMarbleFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Deep midnight slate marble base
    ctx.fillStyle = '#080c1e';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle natural marble clouds
    const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 320);
    grad.addColorStop(0, 'rgba(18, 25, 55, 0.8)');
    grad.addColorStop(1, 'rgba(8, 12, 30, 0.95)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Golden & amber marble veins
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = `rgba(230, 185, 79, ${0.07 + Math.random() * 0.11})`;
      ctx.beginPath();
      let x = Math.random() * 512;
      let y = 0;
      ctx.moveTo(x, y);
      while (y < 512) {
        x += (Math.random() - 0.5) * 40;
        y += 20 + Math.random() * 32;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    return texture;
  }
}
