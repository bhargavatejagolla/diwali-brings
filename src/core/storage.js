/**
 * StorageEngine — LocalStorage persistence for user wishes
 */

class StorageEngine {
  constructor() {
    this.STORAGE_KEY = 'diwali_brings_wishes_v1';
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : { wishes: [] };
    } catch (e) {
      return { wishes: [] };
    }
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {}
  }

  addWish(text) {
    if (!text || !text.trim()) return;
    this.data.wishes.push({
      text: text.trim(),
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    });
    this.save();
  }
}

export const memory = new StorageEngine();
