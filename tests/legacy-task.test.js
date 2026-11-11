"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createLegacyDownloadTask } = require("../src/compat/legacy-task");
const { ValidationError } = require("../src/core/errors");

test("legacy state is normalized into a DownloadTask", () => {
  const state = {
    files: [{ id: 1, name: "demo.bin", size: "1024", link: "https://example.test/demo.bin" }],
    headers: { Referer: "https://example.test/" },
    get: {
      link: (file) => file.link,
      name: (file) => file.name,
      size: (file) => file.size,
    },
  };

  const task = createLegacyDownloadTask(state, 0, { provider: "fixture" });
  assert.equal(task.provider, "fixture");
  assert.equal(task.url, "https://example.test/demo.bin");
  assert.equal(task.filename, "demo.bin");
  assert.equal(task.size, 1024);
  assert.equal(task.headers.Referer, "https://example.test/");
  assert.equal(task.meta.legacyIndex, 0);
});

test("legacy state validation fails with a stable error", () => {
  assert.throws(
    () => createLegacyDownloadTask({ files: [], get: {} }, 0),
    (error) => error instanceof ValidationError && /file not found/.test(error.message),
  );
});
