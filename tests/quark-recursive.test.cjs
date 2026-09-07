/* global __dirname */
const { test } = require('node:test');
const { URL } = require('node:url');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../（改）网盘直链下载助手.user.js'), 'utf8').replace(/\r\n/g, '\n');
const quark = source.slice(source.indexOf('const $quark = {'));

function setup(get) {
 const context = { URL, document: { cookie: '' }, config: { $quark: { api: { getLink: 'https://drive-pc.quark.cn/1/clouddrive/file/download?pr=ucpro', ua: { downloadLink: 'test' } } } }, base: { get, sleep: async () => {} } };
 // Extract the method without executing the userscript or accessing an account.
 const end = quark.indexOf('\n\t\t},', quark.indexOf('async collectFiles(')) + '\n\t\t}'.length;
 return vm.runInNewContext('({' + quark.slice(quark.indexOf('async collectFiles('), end) + '})', context);
}

test('nested folders, pagination, duplicate selections and same-name files', async () => {
 const calls = [];
 const root = { fid: 'root', file: false, file_name: 'Root' };
 const child = { fid: 'child', file: false, file_name: 'Child' };
 const first = Array.from({ length: 99 }, (_, i) => ({ fid: 'f' + i, file: true, file_name: 'file' + i }));
 first.push(child);
 const api = setup(async address => {
  const url = new URL(address);
  const dir = url.searchParams.get('pdir_fid');
  const page = url.searchParams.get('_page');
  calls.push([dir, page]);
  const list = dir === 'child' ? [{ fid: 'nested', file: true, file_name: 'file0' }] : page === '1' ? first : [{ fid: 'last', file: true, file_name: 'last' }];
  return { code: 0, data: { list } };
 });
 const files = await api.collectFiles([root, child]);
 assert.equal(files.length, 101);
 assert.equal(files.find(f => f.fid === 'nested').relativeDirectory, 'Root/Child');
 assert.equal(files.find(f => f.fid === 'f0').relativeDirectory, 'Root');
 assert.deepEqual(calls, [['root', '1'], ['child', '1'], ['root', '2']]);
});

test('empty folders and direct files', async () => {
 const api = setup(async () => ({ code: 0, data: { list: [] } }));
 assert.equal((await api.collectFiles([{ fid: 'empty', file: false, file_name: 'Empty' }])).length, 0);
 const files = await api.collectFiles([{ fid: 'file', file: true, file_name: 'a.txt' }]);
 assert.equal(files[0].relativeDirectory, '');
});

test('listing errors do not silently produce a partial result', async () => {
 const api = setup(async () => ({ code: 31001 }));
 await assert.rejects(api.collectFiles([{ fid: 'root', file_name: 'Root' }]), /31001/);
});

test('folder path traversal is rejected', async () => {
 const api = setup(async () => { throw new Error('should not request'); });
 await assert.rejects(api.collectFiles([{ fid: 'root', file_name: '..' }]), /名称/);
});

test('Aria2 directory and headers survive forwarding; ordinary files unchanged', async () => {
 const start = source.indexOf('async sendLinkToAria2(');
 const end = source.indexOf('\n\t\t},', start) + '\n\t\t}'.length;
 const requests = [];
 const base = { getValue: () => [{ default: true, domain: 'http://localhost', port: '16800', path: '/jsonrpc', dir: '/downloads/', token: '' }], post: async (_url, data) => { requests.push(data); return { result: 'gid' }; } };
 const api = vm.runInNewContext('({' + source.slice(start, end) + '})', { base });
 await api.sendLinkToAria2('https://example.org/a', 'a.txt', ['User-Agent:test'], 'Root/Child');
 assert.equal(requests[0].params[1].dir, '/downloads/Root/Child');
 assert.equal(requests[0].params[1].out, 'a.txt');
 assert.equal(requests[0].params[1].header[0], 'User-Agent:test');
 await api.sendLinkToAria2('https://example.org/a', 'a.txt', []);
 assert.equal(requests[1].params[1].dir, '/downloads/');
});

test('getLink keeps directories when download responses arrive in reverse order', async () => {
 const start = quark.indexOf('async getLink(');
 const end = quark.indexOf('\n\t\tgetSelectedList()', start);
 const temp = { page: 'home', mode: 'aria2' };
 const base = {
  getValue: () => [{ default: true, dir: '/downloads' }], sleep: async () => {},
  post: async () => ({ code: 0, data: [
   { fid: 'b', file_name: 'same.txt', download_url: 'https://example.org/b' },
   { fid: 'a', file_name: 'same.txt', download_url: 'https://example.org/a' }
  ] }),
  generateDOM: () => '', showMainDialog: () => {}
 };
 const config = { $quark: { api: { getLink: 'https://example.org/api', ua: { downloadLink: 'test' } }, dom: {} }, base: { dom: { button: { aria2: {} } } } };
 const api = vm.runInNewContext('({' + quark.slice(start, end) + '})', {
  base, temp, config, document: { cookie: '' }, location: { host: 'pan.quark.cn' },
  $doc: { find: () => ({ html() {} }) }
 });
 api.getSelectedList = () => [{ fid: 'root', file: false }];
 api.collectFiles = async () => [
  { fid: 'a', file: true, relativeDirectory: 'Root/A' },
  { fid: 'b', file: true, relativeDirectory: 'Root/B' }
 ];
 await api.getLink();
 assert.equal(temp.links[0][0].relativeDirectory, 'Root/B');
 assert.equal(temp.links[0][1].relativeDirectory, 'Root/A');
});
