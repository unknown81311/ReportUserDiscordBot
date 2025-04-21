const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

class AutoSavingCollection extends Collection {
  /**
   * @param {string} filename - JSON file path (relative or absolute).
   */
  constructor(filename) {
    super();
    this._filename = path.resolve(__dirname, "..", "database", filename);
    this._load();
  }

  _save() {
    try {
      const obj = Object.fromEntries(this);
      fs.writeFileSync(this._filename, JSON.stringify(obj, null, 2));
    } catch (err) {
      console.error(`Failed to save to ${this._filename}:`, err);
    }
  }

  _load() {
    try {
      if (fs.existsSync(this._filename)) {
        const raw = fs.readFileSync(this._filename);
        const data = JSON.parse(raw);
        for (const [key, value] of Object.entries(data)) {
          this.set(key, value);
        }
      }
    } catch (err) {
      console.error(`Failed to load from ${this._filename}:`, err);
    }
  }

  // Override mutation methods
  set(key, value) {
    const result = super.set(key, value);
    this._save();
    return result;
  }

  delete(key) {
    const result = super.delete(key);
    
    this._save();
    return result;
  }

  clear() {
    const result = super.clear();
    this._save();
    return result;
  }
}

module.exports = { AutoSavingCollection };
