import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const locales = readdirSync(new URL('_locales/', root));
const messages = Object.fromEntries(locales.map((l) => [l, JSON.parse(read(`_locales/${l}/messages.json`))]));

test('all locales define the same messages', () => {
  const [first, ...rest] = locales;
  for (const locale of rest) {
    assert.deepEqual(Object.keys(messages[locale]).sort(), Object.keys(messages[first]).sort(), locale);
  }
});

test('every message used in manifest and background exists in every locale', () => {
  const used = new Set([
    ...[...read('manifest.json').matchAll(/__MSG_(\w+)__/g)].map((m) => m[1]),
    ...[...read('background.js').matchAll(/'(menu\w+)'/g)].map((m) => m[1]),
  ]);
  assert.ok(used.size >= 8, `found only ${used.size} message names`);
  for (const locale of locales) {
    for (const name of used) assert.ok(messages[locale][name]?.message, `${locale}: ${name}`);
  }
});
