"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { buildCurlCommand } = require("../src/downloaders/curl");

test("curl command preserves headers and filename", () => {
  const command = buildCurlCommand({
    provider: "aliyun",
    url: "https://example.com/file?a=1&b=2",
    filename: "my file.bin",
    headers: { Authorization: "Bearer abc" },
  });

  assert.match(command, /^curl /);
  assert.match(command, /Authorization: Bearer abc/);
  assert.match(command, /my file\.bin/);
  assert.match(command, /https:\/\/example\.com\/file\?a=1&b=2/);
});

test("curl command supports PowerShell quoting", () => {
  const command = buildCurlCommand({
    provider: "x",
    url: "https://example.com/a",
    filename: "it's.bin",
  }, { shell: "powershell" });
  assert.match(command, /it''s\.bin/);
  assert.match(command, /^curl\.exe /);
});

test("curl rejects unsupported shells before generating a command", () => {
  for (const shell of ["cmd", "unknown"]) {
    assert.throws(() => buildCurlCommand({
      provider: "x",
      url: "https://example.com/a",
      filename: "%PATH%.bin",
    }, { shell }), /unsupported shell/);
  }
});
