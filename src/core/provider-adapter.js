"use strict";

const { UnsupportedCapabilityError } = require("./errors");

/**
 * Provider adapter contract.
 * Concrete adapters should only know about one cloud provider.
 */
class ProviderAdapter {
  constructor({ id, displayName, hosts = [] } = {}) {
    if (!id) throw new TypeError("provider id is required");
    this.id = id;
    this.displayName = displayName || id;
    this.hosts = [...hosts];
  }

  matches(locationLike) {
    const hostname = typeof locationLike === "string"
      ? new URL(locationLike).hostname
      : locationLike?.hostname;
    return Boolean(hostname && this.hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`)));
  }

  async getContext() {
    throw new UnsupportedCapabilityError(`${this.id}: getContext() is not implemented`);
  }

  async listFiles() {
    throw new UnsupportedCapabilityError(`${this.id}: listFiles() is not implemented`);
  }

  async resolveDownload() {
    throw new UnsupportedCapabilityError(`${this.id}: resolveDownload() is not implemented`);
  }
}

module.exports = { ProviderAdapter };
