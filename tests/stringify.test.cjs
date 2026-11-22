/* global __dirname, process */
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const source = readFileSync(process.env.LINKSWIFT_SOURCE || join(__dirname, '..', '（改）网盘直链下载助手.user.js'), 'utf8');
const method = source.match(/\t\tstringify\(obj\) \{[\s\S]*?\n\t\t\},/);
assert.ok(method, 'the distributed userscript must contain base.stringify');
const stringify = vm.runInNewContext(`({${method[0]}}).stringify`);

for (const [name, input, expected] of [
  ['empty form', {}, ''],
  ['authorization permission fields', { grant_permissions_arr: 'netdisk', bdstoken: 'test-token' }, 'grant_permissions_arr=netdisk&bdstoken=test-token'],
  ['OAuth grant type', { grant_type: 'refresh_token', refresh_token: 'token+with&symbols' }, 'grant_type=refresh_token&refresh_token=token%2Bwith%26symbols'],
  ['single field', { code: 'abc' }, 'code=abc'],
  ['Unicode and reserved characters', { '文件名': '你好 +&=' }, '%E6%96%87%E4%BB%B6%E5%90%8D=%E4%BD%A0%E5%A5%BD%20%2B%26%3D'],
  ['repeated array values', { id: ['a b', 'x&y'] }, 'id=a%20b&id=x%26y'],
  ['empty array', { id: [] }, ''],
  ['empty array before field', { id: [], code: 0 }, 'code=0'],
  ['own fields only', Object.assign(Object.create({ inherited: 'ignored' }), { own: true }), 'own=true'],
]) {
  test(`stringify: ${name}`, () => assert.equal(stringify(input), expected));
}
