/* global URL, setImmediate */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const http = require("node:http");
const runtime = require("./userscript.cjs");

const baiduFiles = count => Array.from({ length: count }, (_, i) => ({ fs_id: i + 1, isdir: 0 }));
const aliyunFiles = () => ["a", "b", "c"].map(fileId => ({ fileId, driveId: "drive", type: "file", name: fileId }));

test("Baidu: a failed batch reports its error and the next batch still runs", async () => {
	const ctx = runtime("baidu");
	let requests = 0;
	ctx.base.get = async () => ++requests === 1 ? { errno: -6, errmsg: "not verified" } :
		{ errno: 0, list: [{ fs_id: 51, dlink: "https://example.test/51" }] };
	const result = await ctx.api.getFilesUrl(baiduFiles(51), "fixture-token");
	assert.equal(requests, 2);
	assert.ok(result.slice(0, 50).every(item => item.dlink.includes("-6 - not verified")));
	assert.equal(result[50].dlink, "https://example.test/51");
	assert.equal(ctx.temp.glinks.length, 1);
	assert.equal(ctx.progress.at(-1), "已获取 51 / 51 个地址");
	assert.deepEqual(ctx.sleeps, [1000]);
});

for (const response of [null, undefined, {}, { errno: 0 }, { errno: 0, list: {} }, { errno: 0, list: "bad" }]) {
	test(`Baidu: malformed response ${JSON.stringify(response)} produces a useful error`, async () => {
		const ctx = runtime("baidu");
		ctx.base.get = async () => response;
		await assert.rejects(ctx.api.getFilesUrl(baiduFiles(1), "fixture-token"), /获取下载地址失败/);
		assert.equal(ctx.temp.glinks.length, 0);
	});
}

for (const code of [112, 9019]) {
	test(`Baidu: fatal error ${code} stops and preserves token handling`, async () => {
		const ctx = runtime("baidu");
		let calls = 0;
		ctx.base.get = async () => { calls++; return { errno: code }; };
		await assert.rejects(ctx.api.getFilesUrl(baiduFiles(51), "fixture-token"), new RegExp(String(code)));
		assert.equal(calls, 1);
		assert.deepEqual(ctx.deleted, code === 9019 ? ["baidu_access_token"] : []);
	});
}

test("Baidu: reordered/partial results stay matched by ID; failed items are not cached", async () => {
	const ctx = runtime("baidu");
	ctx.base.get = async () => ({ errno: 0, list: [
		null, { fs_id: 2 },
		{ fs_id: 3, dlink: "https://example.test/3" },
		{ fs_id: 1, dlink: "https://example.test/1" }
	] });
	const result = await ctx.api.getFilesUrl(baiduFiles(3), "fixture-token");
	assert.equal(result[0].dlink, "https://example.test/1");
	assert.match(result[1].dlink, /获取下载地址失败/);
	assert.equal(result[2].dlink, "https://example.test/3");
	assert.equal(ctx.temp.glinks.length, 2);
	assert.equal(ctx.progress.at(-1), "已获取 3 / 3 个地址");
});

test("Baidu: valid cache reused; expired entry fetched again; directories ignored", async () => {
	const ctx = runtime("baidu");
	ctx.temp.glinks.push({ id: 1, expires: Date.now() + 10000, data: { dlink: "https://example.test/cached" } },
		{ id: 2, expires: Date.now() - 1, data: { dlink: "https://example.test/stale" } });
	ctx.base.get = async address => {
		assert.equal(new URL(address).searchParams.get("fsids"), "[2]");
		return { errno: 0, list: [{ fs_id: 2, dlink: "https://example.test/fresh" }] };
	};
	const result = await ctx.api.getFilesUrl([...baiduFiles(2), { fs_id: 3, isdir: 1 }], "fixture-token");
	assert.equal(result.length, 2);
	assert.equal(result[0].dlink, "https://example.test/cached");
	assert.equal(result[1].dlink, "https://example.test/fresh");
	assert.equal(ctx.progress.at(-1), "已获取 2 / 2 个地址");
});

test("Aliyun: concurrent responses completing in reverse order affect only their own file", async () => {
	const ctx = runtime("aliyun");
	const pending = [];
	ctx.base.post = (_url, data) => new Promise(resolve => pending.push({ data, resolve }));
	const task = ctx.api.getFilesUrl(aliyunFiles(), "fixture-token");
	assert.equal(pending.length, 3);
	for (const { data, resolve } of [...pending].reverse()) {
		resolve({ url: `https://example.test/${data.file_id}` });
		await new Promise(setImmediate);
	}
	const result = await task;
	assert.deepEqual(result.map(item => [item.fileId, item.name, item.url]),
		["a", "b", "c"].map(id => [id, id, `https://example.test/${id}`]));
	assert.equal(ctx.temp.glinks.length, 3);
	assert.deepEqual(ctx.temp.glinks.map(entry => entry.id).sort(), ["a", "b", "c"]);
	ctx.base.post = async () => { throw new Error("valid cache should avoid network"); };
	const cached = await ctx.api.getFilesUrl(aliyunFiles(), "fixture-token");
	assert.deepEqual(cached.map(item => item.url), result.map(item => item.url));
});

test("Aliyun: one file error leaves successful siblings intact and is not cached", async () => {
	const ctx = runtime("aliyun");
	ctx.base.post = async (_url, data) => data.file_id === "b" ? { code: "Forbidden" } :
		{ url: `https://example.test/${data.file_id}` };
	const result = await ctx.api.getFilesUrl(aliyunFiles(), "fixture-token");
	assert.equal(result[0].url, "https://example.test/a");
	assert.match(result[1].url, /Forbidden/);
	assert.equal(result[2].url, "https://example.test/c");
	assert.deepEqual(ctx.temp.glinks.map(entry => entry.id).sort(), ["a", "c"]);
});

test("Aliyun: expired links refresh and progress includes cached files", async () => {
	const ctx = runtime("aliyun");
	ctx.temp.glinks.push({ id: "a", expires: Date.now() + 10000, data: { url: "https://example.test/cached-a" } },
		{ id: "b", expires: Date.now() - 1, data: { url: "https://example.test/stale-b" } });
	const requested = [];
	ctx.base.post = async (_url, data) => {
		requested.push(data.file_id);
		return { url: `https://example.test/fresh-${data.file_id}` };
	};
	const result = await ctx.api.getFilesUrl(aliyunFiles(), "fixture-token");
	assert.deepEqual(requested, ["b", "c"]);
	assert.equal(result[0].url, "https://example.test/cached-a");
	assert.equal(result[1].url, "https://example.test/fresh-b");
	assert.equal(ctx.progress.at(-1), "已获取 3 / 3 个地址");
});

for (const response of [null, undefined, {}, { code: "AccessTokenInvalid" }]) {
	test(`Aliyun: invalid response ${JSON.stringify(response)} rejects without caching`, async () => {
		const ctx = runtime("aliyun");
		ctx.base.post = async () => response;
		await assert.rejects(ctx.api.getFilesUrl(aliyunFiles().slice(0, 1), "fixture-token"),
			/获取下载地址失败|访问令牌过期/);
		assert.equal(ctx.temp.glinks.length, 0);
	});
}

test("Baidu: real HTTP error JSON travels through base.get and later batches succeed", async t => {
	const server = http.createServer((req, res) => {
		const ids = JSON.parse(new URL(req.url, "http://localhost").searchParams.get("fsids"));
		res.setHeader("Content-Type", "application/json");
		res.end(JSON.stringify(ids[0] === 1 ? { errno: -7, errmsg: "restricted" } :
			{ errno: 0, list: ids.map(fs_id => ({ fs_id, dlink: `https://example.test/${fs_id}` })) }));
	});
	await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
	t.after(() => new Promise(resolve => server.close(resolve)));
	const ctx = runtime("baidu");
	// Retain the real base.get; adapt only the privileged GM transport to Node HTTP.
	ctx.base.xmlHttpRequest = options => {
		const original = new URL(options.url);
		return http.get(`http://127.0.0.1:${server.address().port}/${original.search}`, response => {
			let body = "";
			response.setEncoding("utf8");
			response.on("data", chunk => { body += chunk; });
			response.on("end", () => options.onload({ status: response.statusCode,
				responseHeaders: "Content-Type: application/json", responseText: body }));
		}).on("error", options.onerror);
	};
	const result = await ctx.api.getFilesUrl(baiduFiles(51), "fixture-token");
	assert.match(result[0].dlink, /restricted/);
	assert.equal(result[50].dlink, "https://example.test/51");
});
