"use strict";

const { AdapterRegistry } = require("../core/adapter-registry");
const { Aria2Downloader } = require("./aria2");
const { CurlDownloader } = require("./curl");
const { BrowserDownloader } = require("./browser");

function createDefaultDownloaderRegistry() {
  const registry = new AdapterRegistry("downloader");
  registry.register(new BrowserDownloader());
  registry.register(new Aria2Downloader());
  registry.register(new CurlDownloader());
  return registry;
}

module.exports = {
  createDefaultDownloaderRegistry,
  Aria2Downloader,
  CurlDownloader,
  BrowserDownloader,
};
