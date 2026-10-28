"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { DownloadTask, ValidationError } = require("../src/core");

test("DownloadTask normalizes common fields", () => {
  const task = new DownloadTask({
    provider: "baidu",
    url: "https://example.com/file.bin",
    filename: "file.bin",
    size: 42,
    headers: { Authorization: "Bearer x", Empty: "" },
    expiresAt: "2030-01-01T00:00:00Z",
  });
  assert.equal(task.provider, "baidu");
  assert.equal(task.method, "GET");
  assert.deepEqual(task.headers, { Authorization: "Bearer x" });
  assert.equal(task.size, 42);
  assert.equal(task.isExpired(new Date("2029-01-01T00:00:00Z")), false);
});

test("DownloadTask rejects invalid URLs", () => {
  assert.throws(
    () => new DownloadTask({ provider: "x", url: "javascript:alert(1)" }),
    ValidationError,
  );
});

test("DownloadTask is immutable at the top level", () => {
  const task = new DownloadTask({ provider: "x", url: "https://example.com/a" });
  assert.equal(Object.isFrozen(task), true);
  assert.equal(Object.isFrozen(task.headers), true);
});
