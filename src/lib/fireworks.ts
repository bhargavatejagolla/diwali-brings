// Pure fireworks simulation: no React, no three.js. The scene only draws this state.
export type RGB = [number, number, number];

/**
 * Firecracker shapes. Hearts, rings and other outline shapes are intentionally excluded:
 * the sky shows realistic, filled crackers only.
 */
export const BURST_KINDS = ["chrysanthemum", "peony", "willow", "crackle", "palm", "glitter", "multi", "crossette", "grand"] as const;
export type BurstKind = (typeof BURST_KINDS)[number];

export const PALETTE = {
  gold: [1.0, 0.72, 0.32],
  orange: [1.0, 0.48, 0.12],
  red: [1.0, 0.2, 0.18],
  pink: [1.0, 0.42, 0.62],
  magenta: [1.0, 0.28, 0.88],
  violet: [0.62, 0.42, 1.0],
  blue: [0.28, 0.5, 1.0],
  teal: [0.15, 0.85, 0.8],
  green: [0.3, 1.0, 0.38],
  silver: [0.88, 0.92, 1.0],
  white: [1.0, 0.92, 0.8],
} satisfies Record<string, RGB>;
export type ColorName = keyof typeof PALETTE;

/** Colours the random picker draws from (white is reserved for rockets and glitter). */
export const SHOW_COLORS: ColorName[] = ["gold", "orange", "red", "pink", "magenta", "violet", "blue", "teal", "green", "silver"];
/** Shapes the random picker draws from (the grand shell is saved for the finale). */
export const SHOW_KINDS: BurstKind[] = ["chrysanthemum", "peony", "willow", "crackle", "palm", "glitter", "multi", "crossette"];
/** Shell stars leave the break at between this fraction and 1x the shell speed, so bursts read as filled, organic blooms rather than crisp outlines. */
export const MIN_STAR_SPEED = 0.55;
export const MIN_SIZE = 0.6;
export const MAX_SIZE = 1.4;

export type Shell = { kind: BurstKind; color: ColorName; size: number };

/** Next random shell: never the same shape or colour as the previous one, size between MIN_SIZE and MAX_SIZE. */
export function nextShell(prev: Shell | null, rand: () => number = Math.random): Shell {
  const pick = <T,>(list: T[], avoid?: T) => {
    const options = avoid === undefined ? list : list.filter((v) => v !== avoid);
    return options[Math.min(options.length - 1, Math.floor(rand() * options.length))];
  };
  return {
    kind: pick(SHOW_KINDS, prev?.kind),
    color: pick(SHOW_COLORS, prev?.color),
    size: MIN_SIZE + rand() * (MAX_SIZE - MIN_SIZE),
  };
}

/** Background show: seconds between automatic shells, and where they may burst so they stay on screen. */
export const AMBIENT_GAP: [number, number] = [1.6, 3.2];
export const AMBIENT_BOUNDS = { x: [-26, 26], y: [20, 28], z: [-40, -22] } as const;

/** Where and when the next automatic shell goes off. */
export function ambientShot(rand: () => number = Math.random) {
  const lerp = ([a, b]: readonly [number, number], t: number) => a + (b - a) * t;
  return {
    x: lerp(AMBIENT_BOUNDS.x, rand()),
    y: lerp(AMBIENT_BOUNDS.y, rand()),
    z: lerp(AMBIENT_BOUNDS.z, rand()),
    wait: lerp(AMBIENT_GAP, rand()),
  };
}

export const GRAVITY = -5.2;
export const ROCKET_SPEED = 26;
export const MAX_PARTICLES = 16000;

const enum Role {
  Rocket = 0,
  Spark = 1,
  Trail = 2,
  Ember = 3,
}

const SHOW_RGB: RGB[] = SHOW_COLORS.map((c) => PALETTE[c]);

export class FireworksSim {
  readonly max: number;
  count = 0;
  pos: Float32Array;
  vel: Float32Array;
  col: Float32Array;
  life: Float32Array;
  maxLife: Float32Array;
  size: Float32Array;
  drag: Float32Array;
  role: Uint8Array;
  trailRate: Float32Array; // trail sparks per second (0 = none)
  splitAt: Float32Array; // remaining-life fraction at which a spark splits (0 = never)
  splitKind: Uint8Array; // 0 = crossette (coloured fragments), 1 = crackle (tiny white-hot pops)
  // Rocket payload
  payload: (BurstKind | null)[];
  payloadColor: RGB[];
  payloadSize: Float32Array;
  apexY: Float32Array;
  trailAcc: Float32Array;
  onBurst: ((x: number, y: number, z: number, kind: BurstKind, size: number, color: RGB) => void) | undefined = undefined;

  constructor(max = MAX_PARTICLES) {
    this.max = max;
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.size = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.role = new Uint8Array(max);
    this.trailRate = new Float32Array(max);
    this.splitAt = new Float32Array(max);
    this.splitKind = new Uint8Array(max);
    this.apexY = new Float32Array(max);
    this.trailAcc = new Float32Array(max);
    this.payloadSize = new Float32Array(max);
    this.payload = new Array(max).fill(null);
    this.payloadColor = new Array(max).fill(PALETTE.gold);
  }

  get rockets() {
    let n = 0;
    for (let i = 0; i < this.count; i++) if (this.role[i] === Role.Rocket) n++;
    return n;
  }

  private spawn(
    x: number, y: number, z: number,
    vx: number, vy: number, vz: number,
    c: RGB, life: number, size: number, drag: number, role: Role,
  ): number {
    if (this.count >= this.max) return -1;
    const i = this.count++;
    this.pos.set([x, y, z], i * 3);
    this.vel.set([vx, vy, vz], i * 3);
    this.col.set(c, i * 3);
    this.life[i] = life;
    this.maxLife[i] = life;
    this.size[i] = size;
    this.drag[i] = drag;
    this.role[i] = role;
    this.trailRate[i] = 0;
    this.splitAt[i] = 0;
    this.splitKind[i] = 0;
    this.payload[i] = null;
    this.trailAcc[i] = 0;
    return i;
  }

  /** Launch a rocket from the ground toward (x, apexY, z). `size` scales the burst (1 = standard shell). */
  launch(x: number, apexY: number, z: number, kind: BurstKind, color: RGB, size = 1) {
    const startX = x + (Math.random() - 0.5) * 2;
    const i = this.spawn(startX, -2, z, (x - startX) * 0.35, ROCKET_SPEED, 0, PALETTE.white, 6, 2.2, 0, Role.Rocket);
    if (i < 0) return false;
    this.payload[i] = kind;
    this.payloadColor[i] = color;
    this.payloadSize[i] = size;
    this.apexY[i] = apexY;
    this.trailRate[i] = 90;
    return true;
  }

  burst(x: number, y: number, z: number, kind: BurstKind, c: RGB, sizeRaw = 1) {
    const size = Math.min(MAX_SIZE * 1.3, Math.max(0.4, sizeRaw));
    const spread = size; // spark speed scales the burst radius
    const density = Math.pow(size, 1.3); // bigger shells carry more stars
    const star = 0.8 + 0.25 * size; // and slightly brighter stars
    const n = (base: number) => Math.round(base * density);
    // A contrasting colour from the show palette for two-tone shells.
    const others = SHOW_RGB.filter((rgb) => rgb !== c);
    const alt = others[Math.floor(Math.random() * others.length)];
    // The whole shell drifts a little with the wind and its own momentum.
    const wx = (Math.random() - 0.5) * 1.6, wy = Math.random() * 0.8;
    const sphere = (count: number, speed: number, life: number, starSize: number, drag: number, color: RGB | "mixed", trail = 0, split = 0, upward = 0, splitKind = 0) => {
      for (let k = 0; k < count; k++) {
        let u = Math.random() * 2 - 1;
        if (upward) u = Math.max(u, -1 + upward * 2); // bias directions upward (palm fronds)
        const t = Math.random() * Math.PI * 2;
        const r = Math.sqrt(1 - u * u);
        // Most stars fly near full speed but plenty lag behind, filling the bloom (no hollow outline).
        const s = speed * spread * (MIN_STAR_SPEED + (1 - MIN_STAR_SPEED) * Math.pow(Math.random(), 0.45));
        const rgb = color === "mixed" ? SHOW_RGB[Math.floor(Math.random() * SHOW_RGB.length)] : color;
        const j = this.spawn(x, y, z, r * Math.cos(t) * s + wx, u * s + wy, r * Math.sin(t) * s, rgb, life * (0.7 + Math.random() * 0.6), starSize * star * (0.8 + Math.random() * 0.4), drag * (0.8 + Math.random() * 0.4), Role.Spark);
        if (j >= 0) { this.trailRate[j] = trail * (0.7 + Math.random() * 0.6); this.splitAt[j] = split ? split * (0.85 + Math.random() * 0.3) : 0; this.splitKind[j] = splitKind; }
      }
    };
    switch (kind) {
      case "chrysanthemum": sphere(n(420), 13, 2.4, 1.4, 1.6, c, 22); break;
      case "peony": sphere(n(480), 14, 1.8, 1.7, 2.0, c); sphere(n(140), 6, 1.6, 1.4, 2.2, alt); break;
      case "willow": sphere(n(300), 9, 4.2, 1.2, 1.1, PALETTE.gold, 40); sphere(n(60), 4, 1.4, 1.3, 2, c); break;
      case "crackle": sphere(n(220), 11, 1.5, 1.3, 1.8, c, 16, 0.5, 0, 1); sphere(n(60), 5, 1.2, 1.2, 2, PALETTE.gold); break;
      case "palm": sphere(Math.max(6, Math.round(9 * size)), 11, 2.6, 2.6, 1.0, PALETTE.gold, 70, 0, 0.35); sphere(n(80), 5, 1.4, 1.3, 2, c); break;
      case "glitter": sphere(n(320), 12, 2.2, 1.3, 1.7, c, 30); sphere(n(120), 8, 2.6, 0.9, 1.6, PALETTE.silver, 0, 0.5); break;
      case "multi": sphere(n(460), 13, 2.0, 1.5, 1.8, "mixed"); break;
      case "crossette": sphere(n(36), 10, 1.6, 1.9, 1.4, c, 18, 0.55); break;
      case "grand":
        sphere(n(900), 17, 3.6, 1.8, 1.3, PALETTE.gold, 30, 0.35);
        sphere(n(260), 9, 2.4, 1.5, 1.8, PALETTE.white);
        sphere(n(200), 12, 2.0, 1.4, 1.8, "mixed");
        break;
    }
    this.onBurst?.(x, y, z, kind, size, c);
  }

  step(dtRaw: number) {
    const dt = Math.min(dtRaw, 0.05);
    const { pos, vel } = this;
    let i = 0;
    while (i < this.count) {
      this.life[i] -= dt;
      const role = this.role[i];
      if (role === Role.Rocket && pos[i * 3 + 1] >= this.apexY[i]) {
        this.burst(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], this.payload[i]!, this.payloadColor[i], this.payloadSize[i]);
        this.life[i] = 0;
      }
      if (this.life[i] <= 0) { this.kill(i); continue; }
      const p = i * 3;
      const g = role === Role.Rocket ? GRAVITY * 0.3 : role === Role.Trail ? GRAVITY * 0.25 : GRAVITY;
      const damp = Math.exp(-this.drag[i] * dt);
      vel[p] *= damp; vel[p + 1] = vel[p + 1] * damp + g * dt; vel[p + 2] *= damp;
      pos[p] += vel[p] * dt; pos[p + 1] += vel[p + 1] * dt; pos[p + 2] += vel[p + 2] * dt;

      if (this.trailRate[i] > 0) {
        this.trailAcc[i] += this.trailRate[i] * dt;
        const c: RGB = [this.col[p], this.col[p + 1], this.col[p + 2]];
        const warm: RGB = role === Role.Rocket ? [1, 0.6, 0.25] : c;
        while (this.trailAcc[i] >= 1) {
          this.trailAcc[i] -= 1;
          this.spawn(pos[p], pos[p + 1], pos[p + 2], (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, 0, warm, 0.5 + Math.random() * 0.5, role === Role.Rocket ? 1.3 : 0.8, 3, Role.Trail);
        }
      }
      if (this.splitAt[i] > 0 && this.life[i] / this.maxLife[i] < this.splitAt[i]) {
        this.splitAt[i] = 0;
        if (this.splitKind[i] === 1) {
          // crackle: a handful of tiny white-hot pops that vanish almost at once
          for (let k = 0; k < 5; k++) {
            this.spawn(pos[p], pos[p + 1], pos[p + 2], (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, PALETTE.silver, 0.18 + Math.random() * 0.22, 1.1, 4, Role.Spark);
          }
          i++;
          continue;
        }
        const c: RGB = [this.col[p], this.col[p + 1], this.col[p + 2]];
        for (let k = 0; k < 6; k++) {
          this.spawn(pos[p], pos[p + 1], pos[p + 2], (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, c, 0.9, 0.9, 2.5, Role.Spark);
        }
        if (Math.random() < 0.15) {
          this.spawn(pos[p], pos[p + 1], pos[p + 2], 0, -0.5, 0, PALETTE.gold, 3.5, 0.9, 1.5, Role.Ember);
        }
      }
      i++;
    }
  }

  private kill(i: number) {
    const last = --this.count;
    if (i === last) return;
    this.pos.copyWithin(i * 3, last * 3, last * 3 + 3);
    this.vel.copyWithin(i * 3, last * 3, last * 3 + 3);
    this.col.copyWithin(i * 3, last * 3, last * 3 + 3);
    this.life[i] = this.life[last]; this.maxLife[i] = this.maxLife[last];
    this.size[i] = this.size[last]; this.drag[i] = this.drag[last];
    this.role[i] = this.role[last]; this.trailRate[i] = this.trailRate[last];
    this.splitAt[i] = this.splitAt[last]; this.splitKind[i] = this.splitKind[last]; this.payload[i] = this.payload[last];
    this.payloadColor[i] = this.payloadColor[last]; this.payloadSize[i] = this.payloadSize[last];
    this.apexY[i] = this.apexY[last];
    this.trailAcc[i] = this.trailAcc[last];
  }

  clear() { this.count = 0; }
}

/** Grand finale choreography: [delay seconds, x, apexY, z, kind, color, size]. */
export const FINALE: [number, number, number, number, BurstKind, ColorName, number][] = [
  // Grand bursts open ~13 units wide; keep them low and deep enough to stay fully on screen.
  [0, 0, 25, -26, "grand", "gold", 1],
  [1.4, -22, 22, -40, "peony", "teal", 0.8],
  [1.8, 22, 24, -40, "peony", "red", 0.8],
  [2.8, -10, 26, -22, "crackle", "violet", 1],
  [3.2, 12, 25, -22, "chrysanthemum", "green", 1.1],
  [4.4, 0, 27, -18, "glitter", "blue", 1.2],
  [5.2, -24, 20, -34, "crossette", "orange", 0.7],
  [5.4, 24, 20, -34, "crossette", "magenta", 0.7],
  [6.0, -16, 27, -26, "willow", "gold", 1],
  [6.2, 16, 27, -26, "willow", "pink", 1],
  [7.2, 0, 24, -30, "palm", "red", 1.3],
  [7.6, -8, 22, -32, "multi", "teal", 0.9],
  [7.8, 8, 22, -32, "multi", "violet", 0.9],
  [9.0, 0, 26, -24, "grand", "gold", 1.1],
];
