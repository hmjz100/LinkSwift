"use strict";

const { AdapterNotFoundError } = require("./errors");

class AdapterRegistry {
  constructor(kind = "adapter") {
    this.kind = kind;
    this._items = new Map();
  }

  register(adapter) {
    if (!adapter || typeof adapter.id !== "string" || !adapter.id.trim()) {
      throw new TypeError(`${this.kind} must expose a non-empty id`);
    }
    if (this._items.has(adapter.id)) {
      throw new Error(`${this.kind} already registered: ${adapter.id}`);
    }
    this._items.set(adapter.id, adapter);
    return adapter;
  }

  has(id) {
    return this._items.has(id);
  }

  get(id) {
    const adapter = this._items.get(id);
    if (!adapter) throw new AdapterNotFoundError(`${this.kind} not found: ${id}`);
    return adapter;
  }

  list() {
    return [...this._items.values()];
  }

  find(predicate) {
    return this.list().find(predicate) || null;
  }
}

module.exports = { AdapterRegistry };
