import { describe, expect, it } from "vitest";
import { AMBIENT_BOUNDS, AMBIENT_GAP, BURST_KINDS, FINALE, ambientShot, FireworksSim, MAX_SIZE, MIN_SIZE, MIN_STAR_SPEED, PALETTE, SHOW_KINDS, nextShell, type Shell } from "./fireworks";

describe("fireworks sim", () => {
  it("rocket rises, bursts into hundreds of sparks at apex", () => {
    const sim = new FireworksSim();
    const bursts: string[] = [];
    sim.onBurst = (_x, _y, _z, k) => bursts.push(k);
    sim.launch(0, 20, 0, "chrysanthemum", PALETTE.gold);
    for (let t = 0; t < 1.5; t += 1 / 60) sim.step(1 / 60);
    expect(bursts).toEqual(["chrysanthemum"]);
    expect(sim.rockets).toBe(0);
    expect(sim.count).toBeGreaterThan(300);
  });

  it("returns to empty and ready after the burst fades", () => {
    const sim = new FireworksSim();
    sim.launch(0, 20, 0, "grand", PALETTE.gold);
    for (let t = 0; t < 15; t += 1 / 30) sim.step(1 / 30);
    expect(sim.count).toBe(0);
    expect(sim.launch(0, 20, 0, "crackle", PALETTE.teal)).toBe(true);
  });

  it("never exceeds capacity under rapid repeated launches", () => {
    const sim = new FireworksSim(3000);
    for (let n = 0; n < 40; n++) { sim.launch(n, 20, 0, "peony", PALETTE.pink, MAX_SIZE); sim.step(0.1); }
    for (let t = 0; t < 3; t += 0.05) sim.step(0.05);
    expect(sim.count).toBeLessThanOrEqual(3000);
  });

  it("bigger shells burst wider and with more stars than small ones", () => {
    const spreadOf = (size: number) => {
      const sim = new FireworksSim();
      sim.burst(0, 0, 0, "peony", PALETTE.red, size);
      const n = sim.count;
      for (let t = 0; t < 0.5; t += 1 / 60) sim.step(1 / 60);
      let max = 0;
      for (let i = 0; i < sim.count; i++) max = Math.max(max, Math.abs(sim.pos[i * 3]));
      return { n, max };
    };
    const small = spreadOf(MIN_SIZE), big = spreadOf(MAX_SIZE);
    expect(big.n).toBeGreaterThan(small.n);
    expect(big.max).toBeGreaterThan(small.max);
  });
});

describe("firework show variety", () => {
  it("has no heart-shaped fireworks anywhere", () => {
    expect(BURST_KINDS as readonly string[]).not.toContain("heart");
    expect(FINALE.map((f) => f[4] as string)).not.toContain("heart");
  });

  it("has no ring, circle or semi-circle fireworks", () => {
    for (const banned of ["ring", "circle", "semicircle", "halfring"]) {
      expect(BURST_KINDS as readonly string[]).not.toContain(banned);
      expect(FINALE.map((f) => f[4] as string)).not.toContain(banned);
    }
  });

  it("bursts are filled blooms, not hollow outlines: star speeds spread down to the minimum fraction", () => {
    for (const kind of SHOW_KINDS) {
      const sim = new FireworksSim();
      sim.burst(0, 0, 0, kind, PALETTE.gold, 1);
      const speeds: number[] = [];
      for (let i = 0; i < sim.count; i++) speeds.push(Math.hypot(sim.vel[i * 3], sim.vel[i * 3 + 1], sim.vel[i * 3 + 2]));
      const fastest = Math.max(...speeds);
      const inner = speeds.filter((v) => v < fastest * 0.8).length;
      // at least a fifth of the stars sit well inside the outer edge
      expect(inner / speeds.length).toBeGreaterThan(0.2);
    }
    expect(MIN_STAR_SPEED).toBeLessThanOrEqual(0.6);
  });

  it("random shells never repeat the previous shape or colour", () => {
    let prev: Shell | null = null;
    for (let i = 0; i < 500; i++) {
      const next = nextShell(prev);
      if (prev) {
        expect(next.kind).not.toBe(prev.kind);
        expect(next.color).not.toBe(prev.color);
      }
      expect(next.size).toBeGreaterThanOrEqual(MIN_SIZE);
      expect(next.size).toBeLessThanOrEqual(MAX_SIZE);
      prev = next;
    }
  });

  it("random shows use every cracker shape over time", () => {
    const seen = new Set<string>();
    let prev: Shell | null = null;
    for (let i = 0; i < 400; i++) { prev = nextShell(prev); seen.add(prev.kind); }
    expect(seen.size).toBe(SHOW_KINDS.length);
  });

  it("automatic background shells stay inside the visible sky and keep a gentle pace", () => {
    for (let i = 0; i < 500; i++) {
      const s = ambientShot();
      expect(s.x).toBeGreaterThanOrEqual(AMBIENT_BOUNDS.x[0]); expect(s.x).toBeLessThanOrEqual(AMBIENT_BOUNDS.x[1]);
      expect(s.y).toBeGreaterThanOrEqual(AMBIENT_BOUNDS.y[0]); expect(s.y).toBeLessThanOrEqual(AMBIENT_BOUNDS.y[1]);
      expect(s.z).toBeGreaterThanOrEqual(AMBIENT_BOUNDS.z[0]); expect(s.z).toBeLessThanOrEqual(AMBIENT_BOUNDS.z[1]);
      expect(s.wait).toBeGreaterThanOrEqual(AMBIENT_GAP[0]); expect(s.wait).toBeLessThanOrEqual(AMBIENT_GAP[1]);
    }
  });

  it("the grand finale mixes many shapes, colours and sizes", () => {
    expect(new Set(FINALE.map((f) => f[4])).size).toBeGreaterThanOrEqual(7);
    expect(new Set(FINALE.map((f) => f[5])).size).toBeGreaterThanOrEqual(8);
    expect(new Set(FINALE.map((f) => f[6])).size).toBeGreaterThanOrEqual(4);
  });
});
