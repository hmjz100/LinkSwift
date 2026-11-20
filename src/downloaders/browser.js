"use strict";

const { DownloaderAdapter } = require("../core/downloader-adapter");
const { DownloadTask } = require("../core/download-task");

class BrowserDownloader extends DownloaderAdapter {
  constructor() {
    super({ id: "browser", displayName: "Browser" });
  }

  supports(task) {
    return (task.method || "GET") === "GET" && !task.body;
  }

  build(task) {
    if (!(task instanceof DownloadTask)) task = new DownloadTask(task);
    return {
      url: task.url,
      filename: task.filename || null,
      headers: { ...task.headers },
      referer: task.referer,
    };
  }
}

module.exports = { BrowserDownloader };
