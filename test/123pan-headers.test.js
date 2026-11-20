const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const script = fs.readFileSync(
	path.join(__dirname, "..", "（改）网盘直链下载助手.user.js"),
	"utf8"
);
const getFileUrl = script.slice(
	script.indexOf("async getFileUrl(item, index, token, uuid, ShareKey)")
);

test("123pan getFileUrl uses the token Authorization header", () => {
	assert.equal((getFileUrl.match(/"Authorization": token/g) || []).length, 2);
	assert.doesNotMatch(getFileUrl, /"Authorization": `\*{6}/);
});
