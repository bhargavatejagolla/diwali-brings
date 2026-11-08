/**
 * StorageEngine — Persistent memory for Dharji Shravya's experience
 * Remembers when the diya was first lit, her visit count, and past wishes.
 */

const STORAGE_KEYS = {
  DIYA_LIT: 'shravya_diya_lit',
  FIRST_LIT_TIME: 'shravya_diya_first_time',
  VISIT_COUNT: 'shravya_visit_count',
  LAST_VISIT: 'shravya_last_visit',
  WISHES: 'shravya_diwali_wishes',
  SECRET_UNLOCKED: 'shravya_secret_unlocked'
};

class StorageEngine {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const isLit = localStorage.getItem(STORAGE_KEYS.DIYA_LIT) === 'true';
      const firstTime = localStorage.getItem(STORAGE_KEYS.FIRST_LIT_TIME);
      let count = parseInt(localStorage.getItem(STORAGE_KEYS.VISIT_COUNT) || '0', 10);
      count += 1;
      localStorage.setItem(STORAGE_KEYS.VISIT_COUNT, count.toString());
      localStorage.setItem(STORAGE_KEYS.LAST_VISIT, new Date().toISOString());

      let wishes = [];
      try {
        wishes = JSON.parse(localStorage.getItem(STORAGE_KEYS.WISHES) || '[]');
      } catch (e) {
        wishes = [];
      }

      return {
        isLit,
        firstTime: firstTime ? new Date(firstTime) : null,
        visitCount: count,
        wishes,
        secretUnlocked: localStorage.getItem(STORAGE_KEYS.SECRET_UNLOCKED) === 'true'
      };
    } catch (e) {
      console.warn("localStorage unavailable", e);
      return {
        isLit: false,
        firstTime: null,
        visitCount: 1,
        wishes: [],
        secretUnlocked: false
      };
    }
  }

  markDiyaLit() {
    try {
      this.data.isLit = true;
      if (!this.data.firstTime) {
        this.data.firstTime = new Date();
        localStorage.setItem(STORAGE_KEYS.FIRST_LIT_TIME, this.data.firstTime.toISOString());
      }
      localStorage.setItem(STORAGE_KEYS.DIYA_LIT, 'true');
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
  }

  addWish(wishText) {
    if (!wishText || !wishText.trim()) return null;
    const wish = {
      id: Date.now(),
      text: wishText.trim(),
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    };
    this.data.wishes.push(wish);
    try {
      localStorage.setItem(STORAGE_KEYS.WISHES, JSON.stringify(this.data.wishes));
    } catch (e) {
      console.warn("Could not save wish", e);
    }
    return wish;
  }

  unlockSecret() {
    this.data.secretUnlocked = true;
    try {
      localStorage.setItem(STORAGE_KEYS.SECRET_UNLOCKED, 'true');
    } catch (e) {
      console.warn("Could not save secret state", e);
    }
  }
}

export const memory = new StorageEngine();
