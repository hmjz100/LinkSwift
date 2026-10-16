/* global __dirname, process, Buffer, fetch, setTimeout, clearTimeout */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const source = fs.readFileSync(path.join(__dirname, "../（改）网盘直链下载助手.user.js"), "utf8").replace(/\r\n/g, "\n");
const declarations = source.slice(source.indexOf("\tconst config = {"), source.indexOf("\n\t/**\n\t * 百度网盘"));
const fixture = Buffer.alloc(1024 * 1024);
for (let i = 0; i < fixture.length; i++) fixture[i] = i % 251;

// Exercise the real methods with native XHR and jQuery; GM-only forbidden headers are omitted.
const script = `
const mount = 'review';
const temp = { request: {}, files: [], downing: {}, mode: 'api', terminalType: {}, color: '#574AB8', mount: $('<div>').appendTo(document.body) };
const $doc = $(document);
let terminal = 'lt';
const errors = [];
const message = { error: text => errors.push(text) };
function GM_getValue(key) { return key === 'setting_curl_terminal' ? terminal : key === 'setting_idm_rpc' ? 'test' : [{ default: true, domain: location.origin, port: '', path: '/rpc' }]; }
function GM_xmlhttpRequest(options) {
 const xhr = new XMLHttpRequest();
 xhr.open(options.method, options.url);
 xhr.responseType = options.responseType || '';
 for (const [key, value] of Object.entries(options.headers || {})) {
  if (['range', 'content-type'].includes(key.toLowerCase())) xhr.setRequestHeader(key, value);
 }
 const result = () => ({ readyState: xhr.readyState, status: xhr.status, statusText: xhr.statusText,
  finalUrl: xhr.responseURL, response: xhr.response,
  responseText: ['', 'text'].includes(xhr.responseType) ? xhr.responseText : '',
  responseHeaders: xhr.readyState >= 2 ? xhr.getAllResponseHeaders() : '' });
 xhr.onreadystatechange = () => options.onreadystatechange?.(result());
 xhr.onload = () => options.onload?.(result());
 xhr.onerror = () => options.onerror?.(new Error('network error'));
 xhr.onabort = () => options.onabort?.();
 xhr.send(options.data);
 return { abort: () => xhr.abort() };
}
${declarations}
base.console = { info() {}, error() {} };
(async () => {
 const checks = [];
 const check = (name, passed) => { checks.push({ name, passed }); };
 for (const endpoint of ['range', 'ignore-range', 'short-range', 'wrong-range']) {
  try {
   const res = await base.download(location.origin + '/' + endpoint, {}, { index: '0', name: 'test.bin', size: 1048576, retry: 0 });
   const bytes = new Uint8Array(await res.response.arrayBuffer());
   check(endpoint, ['range', 'ignore-range'].includes(endpoint) && bytes.length === 1048576 && bytes.every((b, i) => b === i % 251));
  } catch { check(endpoint, ['short-range', 'wrong-range'].includes(endpoint)); }
 }
 window.reviewExecuted = 0;
 const name = '<img src=/missing onerror="window.reviewExecuted++"> & text';
 const link = location.origin + '/range?name=" onmouseover="window.reviewExecuted++';
 temp.files = [[{ name }], { get: { dir: () => false, name: x => x.name, size: () => 1, link: () => link } }];
 base.createTip();
 for (const mode of ['api', 'curl', 'aria2', 'bitcomet', 'abdm']) {
  temp.mode = mode;
  const content = $('<section>').html(download.generateDOM()).appendTo(document.body);
  check(mode + ' literal name', content.find('.name .name').text() === name);
  check(mode + ' no injected elements', content.find('img,script,[onerror],[onmouseover]').length === 0);
  if (mode === 'api') check('literal data attributes', content.find('.item').attr('data-name') === name && content.find('.item').attr('data-link') === link);
  content.find('.name.tip')[0].dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
  check(mode + ' literal tooltip', document.querySelector('.pl-tooltip').textContent.includes(name) && !document.querySelector('.pl-tooltip img'));
  content.remove();
 }
 terminal = 'wc';
 temp.mode = 'aria2';
 const ariaContent = $('<section>').html(download.generateDOM()).appendTo(document.body);
 check('RPC view does not require shell quoting', ariaContent.find('[action=sendto]').length === 1);
 download.addPageListener();
 const copy = ariaContent.find('[action=copy]');
 copy.trigger('click');
 await new Promise(resolve => setTimeout(resolve, 0));
 check('unsafe CMD copy reports error and unlocks', errors.length === 1 && copy.data('state') === undefined);
 terminal = 'lt';
 let clipboard;
 base.setClipboard = async text => { clipboard = text; };
 base.sleep = async () => {};
 copy.trigger('click');
 await new Promise(resolve => setTimeout(resolve, 0));
 check('copy recovers and uses original data', clipboard === download.tools.convertTo.aira2(link, name) && copy.data('state') === undefined);
 ariaContent.remove();
 temp.mode = 'api';
 temp.files[1].get.link = () => '<img src=/missing onerror="window.reviewExecuted++">';
 const error = $('<section>').html(download.generateDOM()).appendTo(document.body);
 check('literal server error', error.find('.message').text() === temp.files[1].get.link() && error.find('img').length === 0);
 error.remove();
 await new Promise(resolve => setTimeout(resolve, 50));
 check('no event handlers executed', window.reviewExecuted === 0);
 await fetch('/results', { method: 'POST', body: JSON.stringify({ jquery: $.fn.jquery, checks }) });
})().catch(async error => { await fetch('/results', { method: 'POST', body: JSON.stringify({ error: error.stack }) }); });
`;

(async () => {
	const jquery = process.env.JQUERY_PATH ? fs.readFileSync(process.env.JQUERY_PATH) : await (async () => {
		const response = await fetch("https://unpkg.com/jquery@3.6.0/dist/jquery.min.js");
		if (!response.ok) throw new Error(`jQuery download failed: ${response.status}`);
		return await response.text();
	})();
	const profile = fs.mkdtempSync(path.join(os.tmpdir(), "linkswift-browser-"));
	let chrome;
	let timer;
	const server = http.createServer();
	try {
		await new Promise((resolve, reject) => {
			server.on("request", (req, res) => {
				if (req.url === "/results") {
					let body = "";
					req.on("data", chunk => { body += chunk; });
					req.on("end", () => {
						res.end("ok");
						try {
							const report = JSON.parse(body);
							assert.ok(!report.error, report.error);
							assert.equal(report.jquery, "3.6.0");
							for (const check of report.checks) assert.ok(check.passed, check.name);
							process.stdout.write(`Chrome + jQuery ${report.jquery}: ${report.checks.length} checks passed.\n`);
							resolve();
						} catch (error) { reject(error); }
					});
				} else if (req.url === "/") {
					res.setHeader("Content-Type", "text/html; charset=utf-8");
					res.end('<!doctype html><body><script src="/jquery.js"></script><script src="/review.js"></script>');
				} else if (req.url === "/jquery.js" || req.url === "/review.js") {
					res.setHeader("Content-Type", "text/javascript; charset=utf-8");
					res.end(req.url === "/jquery.js" ? jquery : script);
				} else if (["/range", "/ignore-range", "/short-range", "/wrong-range"].includes(req.url)) {
					let body = fixture;
					if (req.url !== "/ignore-range" && req.headers.range) {
						const [, a, b] = /bytes=(\d+)-(\d+)/.exec(req.headers.range);
						const start = Number(a), end = Number(b);
						res.statusCode = 206;
						res.setHeader("Content-Range", `bytes ${req.url === "/wrong-range" && end > 0 ? start + 1 : start}-${end}/${fixture.length}`);
						body = fixture.subarray(start, end + 1);
						if (req.url === "/short-range" && end > 0) body = body.subarray(0, 10);
					}
					res.setHeader("Content-Length", body.length);
					res.end(body);
				} else { res.statusCode = 404; res.end(); }
			});
			server.listen(0, "127.0.0.1", () => {
				chrome = spawn(process.env.CHROME_BIN || "google-chrome", ["--headless", "--disable-gpu", "--no-first-run", "--disable-extensions", `--user-data-dir=${profile}`, `http://127.0.0.1:${server.address().port}`], { stdio: "ignore" });
				chrome.on("error", reject);
				chrome.on("exit", code => { if (code) reject(new Error(`Chrome exited: ${code}`)); });
			});
			timer = setTimeout(() => reject(new Error("Browser test timed out")), 15000);
		});
	} finally {
		clearTimeout(timer);
		if (chrome && chrome.exitCode === null) {
			const exited = new Promise(resolve => chrome.once("exit", resolve));
			chrome.kill();
			await exited;
		}
		server.close();
		server.closeAllConnections();
		fs.rmSync(profile, { recursive: true, force: true });
	}
})().catch(error => { process.stderr.write(error.stack + "\n"); process.exitCode = 1; });
