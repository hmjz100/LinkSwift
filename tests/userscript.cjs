/* global __dirname, process, Blob, URL, URLSearchParams, structuredClone */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

module.exports = function runtime(provider) {
	const filename = process.env.LINKSWIFT_SOURCE || path.join(__dirname, "../（改）网盘直链下载助手.user.js");
	const source = fs.readFileSync(filename, "utf8").replace(/\r\n/g, "\n");
	const start = source.indexOf("\tconst config = {");
	const end = source.indexOf("\n\t/**\n\t * 百度网盘");
	if (start < 0 || end < start) throw new Error("Userscript declaration boundary changed");
	const progress = [], sleeps = [], deleted = [];
	const context = vm.createContext({
		Blob, URL, URLSearchParams, structuredClone,
		navigator: { userAgent: "LinkSwift regression test" },
		location: { origin: "https://example.test", host: "example.test" },
		temp: { glinks: [] },
		$doc: { find: () => ({ html: text => progress.push(text) }) }
	});
	vm.runInContext(source.slice(start, end) + "\nglobalThis.base = base;", context);
	context.base.sleep = async ms => sleeps.push(ms);
	context.base.delValue = key => deleted.push(key);
	context.base.console = { info() {}, error() {} };
	if (provider) {
		const objectStart = source.indexOf(`const $${provider} = {`);
		const methodStart = source.indexOf("async getFilesUrl(", objectStart);
		const methodEnd = source.indexOf("\n\t\t},", methodStart);
		if (objectStart < 0 || methodStart < 0 || methodEnd < 0) throw new Error("Provider method boundary changed");
		context.api = vm.runInContext("({" + source.slice(methodStart, methodEnd + 4) + "})", context);
	}
	return { ...context, progress, sleeps, deleted };
};
