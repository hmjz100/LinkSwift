"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// 直接执行发布脚本中的状态读取和任务桥接，避免测试另一个复制实现。
const source = fs.readFileSync(path.join(__dirname, "../（改）网盘直链下载助手.user.js"), "utf8");
const start = source.indexOf("const download = {");
const end = source.indexOf("async copy(target, content)", start);
assert.ok(start >= 0 && end > start);
function createDownload(files) {
  return vm.runInNewContext(`(${source.slice(start + "const download = ".length, end)} })`, {
    temp: { files },
    base: { isType: (value) => Array.isArray(value) ? "array" : value === null ? "null" : typeof value },
  });
}

test("userscript bridge preserves provider getters and request metadata", () => {
  const file = { url: "https://example.com/a", name: "a.bin", size: 42 };
  const headers = { Authorization: "fixture" };
  const dom = { download: {} };
  const get = { link: (item) => item.url, name: (item) => item.name, size: (item) => item.size };
  const task = createDownload([[file], { get, headers, dom }]).task("0");
  assert.equal(task.url, file.url);
  assert.equal(task.filename, file.name);
  assert.equal(task.size, file.size);
  assert.equal(task.headers, headers);
  assert.equal(task.dom, dom);
  assert.equal(task.file, file);
});

test("userscript bridge rejects missing state, getters and links", () => {
  for (const files of [null, [[], {}], [[{}], null], [[{}], {}], [[{}], { get: {} }], [[{}], { get: { link: () => "" } }]]) {
    assert.equal(createDownload(files).task(0), false);
  }
  const download = createDownload([[{}], { get: { link: () => "https://example.com/a" } }]);
  assert.equal(download.task(-1), false);
  assert.equal(download.task(0.5), false);
  assert.equal(download.task("invalid"), false);
  assert.equal(download.task(0).filename, "");
  assert.equal(download.task(0).size, null);
});
