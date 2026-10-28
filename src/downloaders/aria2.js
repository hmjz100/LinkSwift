"use strict";

const { DownloaderAdapter } = require("../core/downloader-adapter");
const { DownloadTask } = require("../core/download-task");

function buildHeaderList(task) {
  const headers = { ...task.headers };
  if (task.referer && !headers.Referer && !headers.referer) headers.Referer = task.referer;
  if (task.userAgent && !headers["User-Agent"] && !headers["user-agent"]) headers["User-Agent"] = task.userAgent;
  if (task.cookies && !headers.Cookie && !headers.cookie) headers.Cookie = task.cookies;
  return Object.entries(headers).map(([key, value]) => `${key}: ${value}`);
}

function buildAria2Options(task, options = {}) {
  if (!(task instanceof DownloadTask)) task = new DownloadTask(task);
  const result = {};
  const header = buildHeaderList(task);
  if (header.length) result.header = header;
  if (task.filename) result.out = task.filename;
  if (options.dir) result.dir = String(options.dir);
  if (options.split != null) result.split = String(options.split);
  if (options.maxConnectionPerServer != null) {
    result["max-connection-per-server"] = String(options.maxConnectionPerServer);
  }
  if (options.continue !== false) result.continue = "true";
  return result;
}

function buildAria2RpcRequest(task, options = {}) {
  if (!(task instanceof DownloadTask)) task = new DownloadTask(task);
  const rpcOptions = buildAria2Options(task, options);
  const params = [];
  if (options.secret) params.push(`token:${options.secret}`);
  params.push([task.url], rpcOptions);

  return {
    jsonrpc: "2.0",
    id: options.id || `linkswift-${Date.now()}`,
    method: "aria2.addUri",
    params,
  };
}

class Aria2Downloader extends DownloaderAdapter {
  constructor() {
    super({ id: "aria2", displayName: "Aria2 / RPC" });
  }

  build(task, options = {}) {
    return buildAria2RpcRequest(task, options);
  }
}

module.exports = {
  Aria2Downloader,
  buildAria2Options,
  buildAria2RpcRequest,
};
