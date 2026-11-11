"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { AdapterRegistry, AdapterNotFoundError } = require("../src/core");

test("registry registers and resolves adapters", () => {
  const registry = new AdapterRegistry("provider");
  const adapter = { id: "baidu" };
  registry.register(adapter);
  assert.equal(registry.get("baidu"), adapter);
  assert.deepEqual(registry.list(), [adapter]);
});

test("registry rejects duplicate ids", () => {
  const registry = new AdapterRegistry("provider");
  registry.register({ id: "baidu" });
  assert.throws(() => registry.register({ id: "baidu" }), /already registered/);
});

test("registry throws a stable not-found error", () => {
  const registry = new AdapterRegistry("downloader");
  assert.throws(() => registry.get("missing"), AdapterNotFoundError);
});
