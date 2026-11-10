import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('release package includes every file the extension loads', () => {
  const files = read('tools/package.sh').match(/^FILES=\((.*)\)$/m)[1].split(/\s+/);
  const manifest = JSON.parse(read('manifest.json'));
  const loaded = new Set(['manifest.json', '_locales']);
  // Follow script tags and relative imports from the entry points.
  const queue = [manifest.background.service_worker, 'offscreen.html'];
  while (queue.length) {
    const file = queue.pop();
    if (loaded.has(file)) continue;
    loaded.add(file);
    const refs = file.endsWith('.html') ? /src="([^"]+)"/g : /from '\.\/([^']+)'/g;
    for (const [, ref] of read(file).matchAll(refs)) queue.push(ref);
  }
  assert.ok(loaded.has('idn.js'), 'import walk did not reach idn.js');
  for (const file of loaded) assert.ok(files.includes(file), `${file} missing from tools/package.sh`);
});
