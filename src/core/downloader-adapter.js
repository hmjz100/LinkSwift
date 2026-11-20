"use strict";

const { UnsupportedCapabilityError } = require("./errors");

class DownloaderAdapter {
  constructor({ id, displayName } = {}) {
    if (!id) throw new TypeError("downloader id is required");
    this.id = id;
    this.displayName = displayName || id;
  }

  supports() {
    return true;
  }

  build() {
    throw new UnsupportedCapabilityError(`${this.id}: build() is not implemented`);
  }
}

module.exports = { DownloaderAdapter };
