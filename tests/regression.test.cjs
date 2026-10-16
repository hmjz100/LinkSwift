/* global __dirname, Blob, URL, URLSearchParams, setTimeout, queueMicrotask */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { test } = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../（改）网盘直链下载助手.user.js"), "utf8").replace(/\r\n/g, "\n");
const declarations = source.slice(source.indexOf("\tconst config = {"), source.indexOf("\n\t/**\n\t * 百度网盘"));

function runtime(terminal = "lt") {
	const context = vm.createContext({
		Blob, URL, URLSearchParams,
		navigator: { userAgent: "LinkSwift test" },
		location: { origin: "https://example.test", host: "example.test" },
		temp: { request: {}, downing: {}, files: [] },
		setTimeout: callback => setTimeout(callback, 0),
		GM_getValue: key => key === "setting_curl_terminal" ? terminal : key === "setting_idm_rpc" ? "client" : [{ default: true, domain: "http://localhost", port: 6800, path: "/rpc" }]
	});
	vm.runInContext(declarations + "\nglobalThis.base = base; globalThis.download = download;", context);
	context.base.console = { info() {}, error() {} };
	return context;
}

for (const terminal of ["lt", "ls", "mt"]) {
	for (const type of ["curl", "aira2"]) {
		test(`${terminal}: ${type} preserves literal URL, name and headers`, () => {
			const { base, download } = runtime(terminal);
			const link = "https://example.test/$(printf INJECTED)?a='&b=$HOME";
			const name = "$(printf INJECTED).txt";
			const header = 'quote " apostrophe \' $(printf INJECTED) `printf INJECTED` $HOME \\';
			const command = download.tools.convertTo[type](link, name, { "X-Test": header });
			const shell = spawnSync("bash", ["--noprofile", "--norc", "-c", 'curl(){ printf "%s\\0" "$@"; }; aria2c(){ printf "%s\\0" "$@"; }; ' + command], { encoding: "utf8" });
			assert.equal(shell.status, 0, shell.stderr);
			const args = shell.stdout.split("\0");
			assert.equal(args[args.indexOf("--") + 1], link);
			assert.equal(args[args.indexOf(type === "curl" ? "-o" : "--out") + 1], base.fixFilename(name));
			assert.ok(args.includes(type === "curl" ? `X-Test: ${header}` : `--header=X-Test: ${header}`));
		});
	}
}

test("PowerShell uses literal strings; CMD rejects expansion and quote injection", () => {
	const { base } = runtime();
	assert.equal(base.quoteArgument("a'b $(command) `command`", "wp"), "'a''b $(command) `command`'");
	assert.equal(base.quoteArgument("a\u2019b", "wp"), "'a\u2019\u2019b'");
	assert.equal(base.quoteArgument("C:\\files\\", "wc"), '"C:\\files\\\\"');
	for (const value of ['x" & command', "%PATH%", "!PATH!"]) assert.throws(() => base.quoteArgument(value, "wc"), /CMD/);
	for (const terminal of ["lt", "wp", "wc"]) {
		for (const value of ["a\nb", "a\rb", "a\0b"]) assert.throws(() => base.quoteArgument(value, terminal), /空字符或换行/);
	}
});

test("HTML escaping handles both text and quoted attributes", () => {
	const { base } = runtime();
	assert.equal(base.escapeHTML('<img src=x onerror="alert(1)"> & \'text\''), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;text&#39;");
	assert.equal(base.escapeHTML("&lt;img&gt;"), "&amp;lt;img&amp;gt;");
});

async function fileDownload(mode) {
	const { base } = runtime();
	const fixture = Uint8Array.from({ length: 1024 * 1024 }, (_, i) => i % 251);
	const requests = [];
	let probe;
	base.getFinal = async (url, headers, usingGET) => {
		probe = { headers, usingGET };
		return { status: mode.startsWith("fallback") ? 200 : 206, finalUrl: url, responseHeaders: { "Content-Range": `bytes 0-0/${fixture.length}` } };
	};
	base.xmlHttpRequest = options => {
		requests.push(options);
		queueMicrotask(() => {
			if (options.responseType === "blob") {
				options.onload({ status: mode === "fallback-error" ? 403 : 200, response: new Blob([mode === "fallback-short" ? fixture.slice(0, 10) : fixture]) });
				return;
			}
			if (mode.startsWith("fallback")) {
				options.onload({ status: 200, response: fixture.buffer });
				return;
			}
			const [, a, b] = /bytes=(\d+)-(\d+)/.exec(options.headers.Range);
			const start = Number(a), end = Number(b);
			const chunk = fixture.slice(start, end + 1);
			options.onload({
				status: mode === "ignored" ? 200 : 206,
				responseHeaders: mode === "missing-range" ? "" : `content-range: bytes ${mode === "wrong-range" ? start + 1 : start}-${end}/${fixture.length}`,
				response: (mode === "short" ? chunk.slice(0, 10) : chunk).buffer
			});
		});
		return { abort() {} };
	};
	const promise = base.download("https://example.test/file", {}, { index: "0", name: "test.bin", size: fixture.length, retry: 0 });
	return { promise, fixture, requests, probe };
}

for (const mode of ["range", "fallback"]) {
	test(`download ${mode} returns the original file`, async () => {
		const { promise, fixture, requests, probe } = await fileDownload(mode);
		const result = await promise;
		const actual = new Uint8Array(await result.response.arrayBuffer());
		assert.equal(actual.byteLength, fixture.byteLength);
		assert.ok(actual.every((value, i) => value === fixture[i]), "downloaded bytes differ");
		assert.equal(probe.headers.Range, "bytes=0-0");
		assert.equal(probe.usingGET, true);
		if (mode === "fallback") {
			assert.equal(requests.length, 1);
			assert.equal(requests[0].headers.Range, undefined);
		}
	});
}

for (const mode of ["short", "ignored", "wrong-range", "missing-range", "fallback-error", "fallback-short"]) {
	test(`download rejects ${mode} responses`, async () => {
		const { promise } = await fileDownload(mode);
		await assert.rejects(promise, /不完整|范围不匹配|状态异常/);
	});
}

for (const type of ["idm", "aria2", "abdm", "bitcomet"]) {
	test(`${type} queue recovers from rejection and stays serial`, async () => {
		const { base, download } = runtime();
		const send = () => download.tools.sendTo[type]("https://example.test/file", "test.bin", ...(type === "idm" ? [1, {}] : [{}]));
		const standHeaders = base.standHeaders;
		base.standHeaders = () => { throw new Error("first failure"); };
		await assert.rejects(send(), /first failure/);
		base.standHeaders = standHeaders;
		let calls = 0, active = 0;
		base.post = async () => {
			calls++;active++;assert.equal(active, 1);
			await new Promise(resolve => setTimeout(resolve, 1));active--;
			return type === "aria2" ? { result: "gid" } : type === "abdm" ? "OK" : type === "idm" ? `${calls}:3;` : "OK";
		};
		assert.deepEqual(await Promise.all([send(), send()]), ["success", "success"]);
		assert.equal(calls, 2);
	});
}

for (const type of ["idm", "aria2", "abdm"]) {
	test(`${type} can retry after a network error`, async () => {
		const { base, download } = runtime();
		let calls = 0;
		base.post = async () => {
			if (++calls === 1) throw new Error("offline");
			return type === "aria2" ? { result: "gid" } : type === "abdm" ? "OK" : "1:3;";
		};
		const send = () => download.tools.sendTo[type]("https://example.test/file", "test.bin", ...(type === "idm" ? [1, {}] : [{}]));
		await assert.rejects(send(), /offline/);
		assert.equal(await send(), "success");
		assert.equal(calls, 2);
	});
}
