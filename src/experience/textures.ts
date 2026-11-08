import * as THREE from "three";

const cache = new Map<string, THREE.Texture>();

function canvasTex(key: string, size: number, draw: (g: CanvasRenderingContext2D, s: number) => void, srgb = true, repeat = 1) {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (!g) throw new Error("The browser could not prepare 3D textures.");
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat !== 1) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
  cache.set(key, t);
  return t;
}

function grain(g: CanvasRenderingContext2D, s: number, amount: number, alpha: number) {
  for (let i = 0; i < amount; i++) {
    const v = Math.random() * 255;
    g.fillStyle = `rgba(${v},${v},${v},${alpha * Math.random()})`;
    g.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}

export const clayTexture = () =>
  canvasTex("clay", 512, (g, s) => {
    g.fillStyle = "#8a4526"; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(${120 + Math.random() * 60},${50 + Math.random() * 30},${25},${0.08})`;
      g.beginPath(); g.arc(Math.random() * s, Math.random() * s, 4 + Math.random() * 30, 0, 7); g.fill();
    }
    grain(g, s, 30000, 0.25);
  });

export const clayBump = () =>
  canvasTex("claybump", 512, (g, s) => { g.fillStyle = "#808080"; g.fillRect(0, 0, s, s); grain(g, s, 50000, 0.6); }, false);

export const stoneTexture = (repeat = 6) =>
  canvasTex("stone" + repeat, 1024, (g, s) => {
    g.fillStyle = "#3b342e"; g.fillRect(0, 0, s, s);
    const n = 8, w = s / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const l = 40 + Math.random() * 22;
      g.fillStyle = `rgb(${l + 14},${l + 6},${l})`;
      g.fillRect(x * w + 3, y * w + 3, w - 6, w - 6);
    }
    grain(g, s, 120000, 0.18);
  }, true, repeat);

/** Procedural powder rangoli: concentric petal rings, dot borders and pigment grain. */
export const rangoliTexture = () =>
  canvasTex("rangoli", 2048, (g, s) => {
    const c = s / 2;
    g.fillStyle = "#1c1612"; g.fillRect(0, 0, s, s);
    grain(g, s, 90000, 0.12);
    g.translate(c, c);
    const cols = ["#d9a441", "#c2410c", "#0f8a85", "#d9467a", "#6d4bd1", "#f2e6c8"];
    const petals = (r: number, n: number, len: number, wid: number, col: string, rot = 0) => {
      g.fillStyle = col;
      for (let i = 0; i < n; i++) {
        g.save(); g.rotate((i / n) * Math.PI * 2 + rot); g.translate(0, -r);
        g.beginPath(); g.moveTo(0, 0);
        g.quadraticCurveTo(wid, -len * 0.5, 0, -len);
        g.quadraticCurveTo(-wid, -len * 0.5, 0, 0); g.fill(); g.restore();
      }
    };
    const dots = (r: number, n: number, rad: number, col: string) => {
      g.fillStyle = col;
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, rad, 0, 7); g.fill(); }
    };
    const ring = (r: number, w: number, col: string) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); };
    // outer to inner
    ring(960, 10, cols[0]); dots(935, 140, 7, cols[5]);
    petals(900, 32, 150, 46, cols[3]); petals(900, 32, 110, 26, cols[0], Math.PI / 32);
    ring(760, 14, cols[2]); dots(735, 96, 8, cols[0]);
    petals(710, 24, 180, 60, cols[2]); petals(710, 24, 130, 28, cols[5]);
    ring(540, 10, cols[0]);
    petals(520, 16, 170, 70, cols[1]); petals(520, 16, 120, 34, cols[0], Math.PI / 16);
    dots(500, 64, 9, cols[5]);
    ring(360, 12, cols[4]);
    petals(340, 12, 140, 60, cols[4]); petals(340, 12, 100, 26, cols[5], Math.PI / 12);
    ring(200, 8, cols[0]); petals(190, 8, 120, 50, cols[3]); dots(170, 32, 6, cols[0]);
    g.fillStyle = cols[0]; g.beginPath(); g.arc(0, 0, 70, 0, 7); g.fill();
    g.fillStyle = cols[1]; g.beginPath(); g.arc(0, 0, 36, 0, 7); g.fill();
    g.setTransform(1, 0, 0, 1, 0, 0);
    // powder grain over pigment
    g.globalCompositeOperation = "multiply"; grain(g, s, 160000, 0.35);
    g.globalCompositeOperation = "source-over";
  });

/** Soft round glow used for burst halos lighting up the night air. */
export const softGlowTexture = () =>
  canvasTex("softglow", 128, (g, s) => {
    const c = s / 2;
    const gr = g.createRadialGradient(c, c, 0, c, c, c);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.45)");
    gr.addColorStop(0.6, "rgba(255,255,255,0.1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  });

/** Glowing paper sky lantern: tapered body lit from a flame near its open base. */
export const lanternTexture = () =>
  canvasTex("lantern", 128, (g, s) => {
    const cx = s / 2;
    // outer halo
    const halo = g.createRadialGradient(cx, s * 0.62, 0, cx, s * 0.62, s * 0.5);
    halo.addColorStop(0, "rgba(255,150,60,0.35)"); halo.addColorStop(1, "rgba(255,120,40,0)");
    g.fillStyle = halo; g.fillRect(0, 0, s, s);
    // tapered paper body (wider at the top, like an akash kandil)
    const top = s * 0.18, bottom = s * 0.82, wTop = s * 0.22, wBot = s * 0.15;
    g.beginPath();
    g.moveTo(cx - wTop, top); g.quadraticCurveTo(cx, top - s * 0.06, cx + wTop, top);
    g.lineTo(cx + wBot, bottom); g.quadraticCurveTo(cx, bottom + s * 0.03, cx - wBot, bottom); g.closePath();
    const body = g.createLinearGradient(0, top, 0, bottom);
    body.addColorStop(0, "rgb(150,45,20)"); body.addColorStop(0.45, "rgb(240,110,35)"); body.addColorStop(0.85, "rgb(255,200,110)"); body.addColorStop(1, "rgb(255,170,80)");
    g.fillStyle = body; g.fill();
    // paper ribs
    g.strokeStyle = "rgba(120,40,15,0.35)"; g.lineWidth = 1.5;
    for (const t of [-0.5, 0, 0.5]) { g.beginPath(); g.moveTo(cx + wTop * t, top); g.lineTo(cx + wBot * t, bottom); g.stroke(); }
    // flame glow at the base
    const fl = g.createRadialGradient(cx, bottom - s * 0.08, 0, cx, bottom - s * 0.08, s * 0.12);
    fl.addColorStop(0, "rgba(255,245,200,1)"); fl.addColorStop(1, "rgba(255,200,100,0)");
    g.fillStyle = fl; g.fillRect(0, 0, s, s);
  });

export const paperTexture = () =>
  canvasTex("paper", 512, (g, s) => { g.fillStyle = "#efe2c4"; g.fillRect(0, 0, s, s); grain(g, s, 40000, 0.08); });

/**
 * Irregular billow of firework smoke: many offset soft puffs, so it never reads as a disc.
 * Drawn white; the sprite tints it.
 */
export const smokeTexture = () =>
  canvasTex("smoke", 256, (g, s) => {
    const c = s / 2;
    for (let i = 0; i < 46; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.pow(Math.random(), 0.7) * s * 0.26;
      const x = c + Math.cos(a) * d, y = c + Math.sin(a) * d * 0.8, r = s * (0.07 + Math.random() * 0.13);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      const o = 0.05 + Math.random() * 0.08;
      gr.addColorStop(0, `rgba(255,255,255,${o})`); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; g.fillRect(0, 0, s, s);
    }
    // keep the edges fully transparent
    g.globalCompositeOperation = "destination-in";
    const mask = g.createRadialGradient(c, c, s * 0.2, c, c, s * 0.5);
    mask.addColorStop(0, "rgba(0,0,0,1)"); mask.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = mask; g.fillRect(0, 0, s, s);
    g.globalCompositeOperation = "source-over";
  });

/** Dark lawn: blades of grass in varied greens over damp soil. */
export const grassTexture = (repeat = 30) =>
  canvasTex("grass" + repeat, 512, (g, s) => {
    g.fillStyle = "#0d1609"; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 9000; i++) {
      const x = Math.random() * s, y = Math.random() * s, h = 4 + Math.random() * 10;
      const l = 14 + Math.random() * 26;
      g.strokeStyle = `rgba(${l * 0.6},${l * 1.4},${l * 0.5},0.55)`;
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 3, y - h); g.stroke();
    }
    grain(g, s, 20000, 0.12);
  }, true, repeat);

/** Polished teak: long grain lines and growth rings. */
export const woodTexture = (repeat = 3) =>
  canvasTex("wood" + repeat, 1024, (g, s) => {
    g.fillStyle = "#3a2214"; g.fillRect(0, 0, s, s);
    const planks = 6, pw = s / planks;
    for (let p = 0; p < planks; p++) {
      const l = 0.85 + Math.random() * 0.3;
      g.fillStyle = `rgb(${58 * l},${34 * l},${20 * l})`;
      g.fillRect(p * pw, 0, pw - 2, s);
      for (let k = 0; k < 70; k++) {
        const x0 = p * pw + Math.random() * pw, amp = 2 + Math.random() * 6, f = 0.004 + Math.random() * 0.01;
        g.strokeStyle = `rgba(${Math.random() < 0.5 ? "20,10,5" : "110,70,40"},${0.08 + Math.random() * 0.14})`;
        g.lineWidth = 0.6 + Math.random() * 1.8;
        g.beginPath();
        for (let y = 0; y <= s; y += 16) { const x = x0 + Math.sin(y * f + k) * amp; if (y === 0) g.moveTo(x, y); else g.lineTo(x, y); }
        g.stroke();
      }
      g.fillStyle = "rgba(0,0,0,0.6)"; g.fillRect(p * pw + pw - 2, 0, 2, s);
    }
    grain(g, s, 60000, 0.08);
  }, true, repeat);

/** Hand-made paper lantern panel: warm glow, darker at the rims, brass frame ribs and a cut-paper motif. */
export const paperLanternTexture = () =>
  canvasTex("paperlantern", 256, (g, s) => {
    const body = g.createLinearGradient(0, 0, 0, s);
    body.addColorStop(0, "rgb(120,40,12)"); body.addColorStop(0.18, "rgb(235,120,40)"); body.addColorStop(0.5, "rgb(255,196,110)");
    body.addColorStop(0.82, "rgb(235,120,40)"); body.addColorStop(1, "rgb(120,40,12)");
    g.fillStyle = body; g.fillRect(0, 0, s, s);
    // paper fibres
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(255,230,190,${Math.random() * 0.08})`; g.fillRect(Math.random() * s, Math.random() * s, 1, 3 + Math.random() * 6); }
    // diamond cut-paper motif
    g.fillStyle = "rgba(120,30,10,0.35)";
    for (let k = 0; k < 4; k++) {
      const cx = (k + 0.5) * (s / 4), cy = s / 2;
      g.beginPath(); g.moveTo(cx, cy - 26); g.lineTo(cx + 12, cy); g.lineTo(cx, cy + 26); g.lineTo(cx - 12, cy); g.closePath(); g.fill();
    }
    // frame ribs
    g.fillStyle = "rgba(60,30,10,0.85)";
    for (let k = 0; k <= 4; k++) g.fillRect(k * (s / 4) - 2, 0, 4, s);
    g.fillRect(0, 0, s, 8); g.fillRect(0, s - 8, s, 8);
  });
