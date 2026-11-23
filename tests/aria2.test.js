"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { buildAria2RpcRequest } = require("../src/downloaders/aria2");

test("aria2 request carries URL, filename and request headers", () => {
  const request = buildAria2RpcRequest({
    provider: "quark",
    url: "https://example.com/a.bin",
    filename: "a.bin",
    headers: { Authorization: "Bearer token" },
    referer: "https://pan.quark.cn/",
  }, { secret: "secret", dir: "/downloads" });

  assert.equal(request.method, "aria2.addUri");
  assert.equal(request.params[0], "token:secret");
  assert.deepEqual(request.params[1], ["https://example.com/a.bin"]);
  assert.equal(request.params[2].out, "a.bin");
  assert.equal(request.params[2].dir, "/downloads");
  assert.deepEqual(request.params[2].header.sort(), [
    "Authorization: Bearer token",
    "Referer: https://pan.quark.cn/",
  ].sort());
});
