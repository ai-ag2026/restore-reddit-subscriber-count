// Checks cache/fetch logic against stubs instead of a browser: node check.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert';
const src = readFileSync(new URL('./restore-reddit-subscriber-count.user.js', import.meta.url), 'utf8');
const store = {};
globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; } };
async function run(path, resp) {
  let fetches = 0, chip = null, hidden = false;
  const header = { after: el => { chip = el; } };
  globalThis.location = { pathname: path };
  globalThis.document = {
    querySelector: s => s.includes('redditname') ? header : { style: { setProperty: () => { hidden = true; } } },
    getElementById: () => null,
    createElement: () => ({ style: {} }),
  };
  globalThis.fetch = async () => { fetches++; return resp; };
  await eval(src);
  return { fetches, chip, hidden };
}
const ok = n => ({ status: 200, ok: true, json: async () => ({ data: { subscribers: n } }) });
let r = await run('/r/Linux/', ok(1234567));
assert.equal(r.fetches, 1); assert.match(r.chip.innerHTML, /<strong>.*567<\/strong> subscribers/); assert(r.hidden);
r = await run('/r/linux/comments/x', ok(1)); assert.equal(r.fetches, 0, 'cache hit, case-insensitive'); assert.match(r.chip.innerHTML, /567/);
r = await run('/r/private/', { status: 403, ok: false }); assert.equal(r.fetches, 1); assert.equal(r.chip, null);
r = await run('/r/private/', ok(5)); assert.equal(r.fetches, 0, 'failure cached');
r = await run('/r/null/', ok(0)); assert.equal(r.chip, null, '0 not shown');
r = await run('/r/a+b/', ok(5)); assert.equal(r.fetches, 0, 'multireddit skipped');
r = await run('/r/all/', ok(5)); assert.equal(r.fetches, 0);
r = await run('/r/new1/', { status: 429, ok: false }); assert.equal(r.fetches, 1);
r = await run('/r/new2/', ok(5)); assert.equal(r.fetches, 0, 'pause after 429');
console.log('all checks passed');
