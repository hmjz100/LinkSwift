"use strict";

const { DownloaderAdapter } = require("../core/downloader-adapter");
const { DownloadTask } = require("../core/download-task");

function quotePosix(value) {
  return `'${String(value).replace(/'/g, `'"'"'`)}'`;
}

function quotePowerShell(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function mergeHeaders(task) {
  const headers = { ...task.headers };
  if (task.referer && !headers.Referer && !headers.referer) headers.Referer = task.referer;
  if (task.userAgent && !headers["User-Agent"] && !headers["user-agent"]) headers["User-Agent"] = task.userAgent;
  if (task.cookies && !headers.Cookie && !headers.cookie) headers.Cookie = task.cookies;
  return headers;
}

function buildCurlCommand(task, options = {}) {
  if (!(task instanceof DownloadTask)) task = new DownloadTask(task);
  const shell = options.shell || "posix";
  // cmd 的变量展开无法通过简单引号安全处理，暂不生成该格式。
  if (!["posix", "powershell"].includes(shell)) {
    throw new TypeError(`unsupported shell: ${shell}`);
  }
  const quote = shell === "powershell" ? quotePowerShell : quotePosix;
  const args = [shell === "powershell" ? "curl.exe" : "curl", "--fail", "--location", "--continue-at", "-"];

  if (task.method !== "GET") args.push("--request", task.method);
  for (const [key, value] of Object.entries(mergeHeaders(task))) {
    args.push("--header", `${key}: ${value}`);
  }
  if (task.body != null) args.push("--data-raw", typeof task.body === "string" ? task.body : JSON.stringify(task.body));
  if (task.filename) args.push("--output", task.filename);
  else args.push("--remote-name");
  args.push(task.url);

  return args.map((part, index) => index === 0 ? part : quote(part)).join(" ");
}

class CurlDownloader extends DownloaderAdapter {
  constructor() {
    super({ id: "curl", displayName: "cURL" });
  }

  build(task, options = {}) {
    return buildCurlCommand(task, options);
  }
}

module.exports = {
  CurlDownloader,
  buildCurlCommand,
  quotePosix,
  quotePowerShell,
};
