/* global __dirname */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../（改）网盘直链下载助手.user.js"), "utf8").replace(/\r\n/g, "\n");
const start = source.indexOf("\n\t\tgetExtension(name) {");
const end = source.indexOf("\n\t\t},", start);
if (start < 0 || end < 0) throw new Error("getExtension method boundary changed");
const base = vm.runInNewContext("({" + source.slice(start, end + 4) + "})");

for (const [name, expected] of [
	["README", ""], ["CHANGELOG_v2", ""], ["LICENSE", ""], ["图库", ""],
	["setup (1)", ""], ["", ""], ["file.", ""], [".env", ""], [".gitignore", ""],
	["a.mp4", "MP4"], ["archive.tar.gz", "GZ"], ["报告.PdF", "PDF"],
	[".config.json", "JSON"], ["file.a_b2", "A_B2"], ["file.foo-bar", ""],
	["file.中文", ""]
]) {
	test(`extension of ${JSON.stringify(name)} is ${JSON.stringify(expected)}`, () => {
		assert.equal(base.getExtension(name), expected);
	});
}
