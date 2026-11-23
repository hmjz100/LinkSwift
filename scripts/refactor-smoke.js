"use strict";

const { DownloadTask } = require("../src/core");
const { createDefaultDownloaderRegistry } = require("../src/downloaders");

const task = new DownloadTask({
  provider: "smoke",
  url: "https://example.com/file.bin",
  filename: "file.bin",
  headers: { Referer: "https://example.com/" },
});

const registry = createDefaultDownloaderRegistry();
for (const adapter of registry.list()) {
  if (!adapter.supports(task)) continue;
  const built = adapter.build(task, { id: "smoke" });
  if (!built) throw new Error(`${adapter.id}: build() returned no output`);
}

console.log(`refactor smoke OK (${registry.list().length} downloader adapters)`);
