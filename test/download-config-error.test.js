const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const script = fs.readFileSync(
	path.join(__dirname, "..", "（改）网盘直链下载助手.user.js"),
	"utf8"
);

test("download dialog distinguishes an empty file response from an invalid config", () => {
	assert.match(
		script,
		/Array\.isArray\(configs\) && Array\.isArray\(configs\[0\]\) && configs\[0\]\.length === 0/
	);
	assert.match(script, /网盘接口没有返回可下载文件/);
	assert.match(script, /下载配置无效，请刷新页面后重试/);
});
