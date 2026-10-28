import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeReadable, markdownLink, titleFromUrl } from '../decode.js';

test('decodes Cyrillic in path', () => {
  assert.equal(
    decodeReadable('https://ru.wikipedia.org/wiki/%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0'),
    'https://ru.wikipedia.org/wiki/Москва',
  );
});

test('keeps ASCII escapes encoded', () => {
  assert.equal(
    decodeReadable('https://x.org/a%20b/%D1%8F%2F%3Fq?s=%D0%B4%26%3D'),
    'https://x.org/a%20b/я%2F%3Fq?s=д%26%3D',
  );
});

test('keeps invalid UTF-8 as is', () => {
  assert.equal(decodeReadable('https://x.org/?q=%EF%F0%E8'), 'https://x.org/?q=%EF%F0%E8');
});

test('leaves plain ASCII URL untouched', () => {
  assert.equal(decodeReadable('https://example.com/a?b=c#d'), 'https://example.com/a?b=c#d');
});

test('title is the last path segment, fully decoded', () => {
  assert.equal(titleFromUrl('https://x.org/docs/%D0%9C%D0%BE%D1%8F%20%D0%B7%D0%B0%D0%BC%D0%B5%D1%82%D0%BA%D0%B0'), 'Моя заметка');
  assert.equal(titleFromUrl('https://x.org/a/%D1%8F/?q=1#f'), 'я');
  assert.equal(titleFromUrl('https://x.org/'), 'x.org');
});

test('markdown link with readable target', () => {
  assert.equal(
    markdownLink('https://ru.wikipedia.org/wiki/%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0'),
    '[Москва](https://ru.wikipedia.org/wiki/Москва)',
  );
});

test('markdown link escapes brackets and wraps unbalanced parens', () => {
  assert.equal(markdownLink('https://x.org/a%5Bb%5D'), '[a\\[b\\]](https://x.org/a%5Bb%5D)');
  assert.equal(markdownLink('https://x.org/f(x)'), '[f(x)](https://x.org/f(x))');
  assert.equal(markdownLink('https://x.org/a)b'), '[a)b](<https://x.org/a)b>)');
});
