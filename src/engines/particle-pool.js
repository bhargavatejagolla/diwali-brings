/**
 * ParticlePool — High performance recycled particle pool for 60 FPS mobile rendering
 */

export class ParticlePool {
  constructor(size, factory) {
    this.size = size;
    this.factory = factory;
    this.pool = [];
    this.active = [];

    for (let i = 0; i < size; i++) {
      this.pool.push(this.factory());
    }
  }

  obtain() {
    if (this.pool.length > 0) {
      const p = this.pool.pop();
      this.active.push(p);
      return p;
    }
    // Expand if needed
    const p = this.factory();
    this.active.push(p);
    return p;
  }

  release(particle) {
    const idx = this.active.indexOf(particle);
    if (idx !== -1) {
      this.active.splice(idx, 1);
      this.pool.push(particle);
    }
  }

  clear() {
    while (this.active.length > 0) {
      this.pool.push(this.active.pop());
    }
  }

  getActive() {
    return this.active;
  }
}
