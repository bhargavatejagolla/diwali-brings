// Web Audio synthesis. Created only after a user gesture; one shared context.
class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private drone: { stop: () => void } | null = null;
  enabled = false;

  private ensure() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.6;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (on) { this.ensure(); this.startDrone(); }
    else { this.stopDrone(); void this.ctx?.suspend(); }
  }

  private startDrone() {
    if (this.drone || !this.enabled) return;
    const ctx = this.ensure();
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 3);
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 600;
    const oscs = [110, 164.8, 220.4].map((hz) => { const o = ctx.createOscillator(); o.frequency.value = hz; o.type = "sine"; o.connect(f); o.start(); return o; });
    f.connect(g); g.connect(this.master!);
    this.drone = { stop: () => {
      const t = ctx.currentTime;
      g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 1);
      oscs.forEach((o) => o.stop(t + 1.1));
    } };
  }
  private stopDrone() { this.drone?.stop(); this.drone = null; }

  private noise(dur: number) {
    const ctx = this.ensure();
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = b; return s;
  }

  chime(hz = 660) {
    if (!this.enabled) return;
    const ctx = this.ensure(), t = ctx.currentTime;
    [1, 2.01, 3.02].forEach((m, k) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = hz * m; g.gain.setValueAtTime(0.08 / (k + 1), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
      o.connect(g); g.connect(this.master!); o.start(t); o.stop(t + 2.6);
    });
  }

  whoosh() {
    if (!this.enabled) return;
    const ctx = this.ensure(), t = ctx.currentTime;
    const s = this.noise(1.2), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "bandpass"; f.Q.value = 6; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(3000, t + 1);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    s.connect(f); f.connect(g); g.connect(this.master!); s.start(t);
  }

  boom(big = false) {
    if (!this.enabled) return;
    const ctx = this.ensure(), t = ctx.currentTime;
    const s = this.noise(2.5), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "lowpass"; f.frequency.setValueAtTime(big ? 1400 : 900, t); f.frequency.exponentialRampToValueAtTime(80, t + 1.8);
    g.gain.setValueAtTime(big ? 0.7 : 0.45, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    s.connect(f); f.connect(g); g.connect(this.master!); s.start(t);
    // crackle tail
    const c = this.noise(1.5), hp = ctx.createBiquadFilter(), cg = ctx.createGain();
    hp.type = "highpass"; hp.frequency.value = 4000;
    cg.gain.setValueAtTime(0.0001, t + 0.3); cg.gain.linearRampToValueAtTime(0.05, t + 0.5); cg.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    c.connect(hp); hp.connect(cg); cg.connect(this.master!); c.start(t + 0.3);
  }
}

export const audio = new Audio();
