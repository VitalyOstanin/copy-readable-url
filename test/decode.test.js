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
    decodeReadable('https://example.org/a%20b/%D1%8F%2F%3Fq?s=%D0%B4%26%3D'),
    'https://example.org/a%20b/я%2F%3Fq?s=д%26%3D',
  );
});

test('keeps invalid UTF-8 as is', () => {
  assert.equal(decodeReadable('https://example.org/?q=%EF%F0%E8'), 'https://example.org/?q=%EF%F0%E8');
});

test('leaves plain ASCII URL untouched', () => {
  assert.equal(decodeReadable('https://example.com/a?b=c#d'), 'https://example.com/a?b=c#d');
});

test('title is the last path segment, fully decoded', () => {
  assert.equal(titleFromUrl('https://example.org/docs/%D0%9C%D0%BE%D1%8F%20%D0%B7%D0%B0%D0%BC%D0%B5%D1%82%D0%BA%D0%B0'), 'Моя заметка');
  assert.equal(titleFromUrl('https://example.org/a/%D1%8F/?q=1#f'), 'я');
  assert.equal(titleFromUrl('https://example.org/'), 'example.org');
});

test('markdown link with readable target', () => {
  assert.equal(
    markdownLink('https://ru.wikipedia.org/wiki/%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0'),
    '[Москва](https://ru.wikipedia.org/wiki/Москва)',
  );
});

test('markdown link escapes brackets and wraps unbalanced parens', () => {
  assert.equal(markdownLink('https://example.org/a%5Bb%5D'), '[a\\[b\\]](https://example.org/a%5Bb%5D)');
  assert.equal(markdownLink('https://example.org/f(x)'), '[f(x)](https://example.org/f(x))');
  assert.equal(markdownLink('https://example.org/a)b'), '[a)b](<https://example.org/a)b>)');
});

test('decodes valid characters next to a malformed byte', () => {
  assert.equal(decodeReadable('https://example.org/%D0%B4%FF%D1%8F'), 'https://example.org/д%FFя');
});

test('keeps invisible and bidi characters encoded', () => {
  // NBSP, zero-width space, right-to-left override
  assert.equal(
    decodeReadable('https://example.org/a%C2%A0b%E2%80%8Bc%E2%80%AEd'),
    'https://example.org/a%C2%A0b%E2%80%8Bc%E2%80%AEd',
  );
});

test('keeps guillemets and quotes encoded so messengers keep the whole link', () => {
  // «Ab» “c” d…e, en dash stays decoded
  assert.equal(
    decodeReadable('https://example.org/%C2%AB%D0%90b%C2%BB+%E2%80%9Cc%E2%80%9D+d%E2%80%A6e%E2%80%93f'),
    'https://example.org/%C2%ABАb%C2%BB+%E2%80%9Cc%E2%80%9D+d%E2%80%A6e–f',
  );
  assert.equal(
    markdownLink('https://example.org/%C2%AB%D0%90b%C2%BB'),
    '[«Аb»](https://example.org/%C2%ABАb%C2%BB)',
  );
});

test('title collapses newlines and falls back to host', () => {
  assert.equal(titleFromUrl('https://example.org/a%0A%0Ab'), 'a b');
  assert.equal(titleFromUrl('https://example.org/%20/'), 'example.org');
});

test('decodes 4-byte characters', () => {
  assert.equal(decodeReadable('https://example.org/%F0%9F%98%80'), 'https://example.org/😀');
});

test('title escapes emphasis, code and HTML starters', () => {
  assert.equal(markdownLink('https://example.org/a*b*%60c%60%3Cd%3E'), '[a\\*b\\*\\`c\\`\\<d>](https://example.org/a*b*%60c%60%3Cd%3E)');
  assert.equal(markdownLink('https://example.org/a_b'), '[a_b](https://example.org/a_b)');
});
