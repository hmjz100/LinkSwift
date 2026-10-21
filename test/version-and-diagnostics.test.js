const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const script = fs.readFileSync(
	path.join(__dirname, "..", "（改）网盘直链下载助手.user.js"),
	"utf8"
);
const asciiAlias = fs.readFileSync(
	path.join(__dirname, "..", "LinkSwift.user.js"),
	"utf8"
);

test("repair build has a distinct version and redacted download-state diagnostics", () => {
	assert.match(script, /\/\/ @version\s+1\.1\.4\.1/);
	assert.match(script, /【LinkSwift】下载状态无效/);
	assert.doesNotMatch(script, /下载状态无效[\s\S]{0,500}(?:token|cookie|Authorization|downloadUrl)/i);
});

test("ASCII installation alias contains the same script", () => {
	assert.equal(asciiAlias, script);
});
