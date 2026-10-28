import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeHost, decodeLabel, punycodeDecode } from '../idn.js';
import { decodeReadable, markdownLink } from '../decode.js';

// Punycode forms come from the URL parser itself, not from hand-written
// constants.
const ascii = (host) => new URL(`http://${host}/`).hostname;

test('punycode round trip for several scripts', () => {
  for (const host of ['пример.рф', 'кремль.рф', 'παράδειγμα.ελ', 'münchen.de', '例え.テスト', '한국.kr', 'ไทย.th', 'a-b1.рф']) {
    assert.equal(decodeHost(ascii(host)), host, host);
  }
});

test('RFC 3492 sample: mixed basic and non-basic code points', () => {
  // RFC 3492, 7.1 (L): 3<nen>B<gumi><kinpachi><sensei>
  assert.equal(punycodeDecode('3B-ww4c5e180e575a65lsy2b'), '3年B組金八先生');
});

test('mixed-alphabet label stays in punycode', () => {
  const spoof = ascii('аpple.com'); // Cyrillic а + Latin pple
  assert.match(spoof, /^xn--/);
  assert.equal(decodeHost(spoof), spoof);
});

test('malformed or non-canonical punycode stays as is', () => {
  for (const label of ['xn--', 'xn--!!!', 'xn--99999999999999999999999', 'xn--abc-']) {
    const decoded = decodeLabel(label);
    assert.ok(decoded === label, `${label} -> ${decoded}`);
  }
});

test('host decoding keeps userinfo, port, path and query', () => {
  const url = new URL('https://user@пример.рф:8080/путь?q=xn--e1afmkfd#xn--p1ai').href;
  assert.equal(decodeReadable(url), 'https://user@пример.рф:8080/путь?q=xn--e1afmkfd#xn--p1ai');
});

test('markdown title falls back to decoded host', () => {
  assert.equal(markdownLink(new URL('https://пример.рф/').href), '[пример.рф](https://пример.рф/)');
});

test('IPv6 and plain hosts untouched', () => {
  assert.equal(decodeReadable('http://[::1]:80/a'), 'http://[::1]:80/a');
  assert.equal(decodeReadable('https://example.com/'), 'https://example.com/');
});

test('uppercase punycode prefix is decoded', () => {
  assert.equal(decodeLabel('XN--E1AFMKFD'), 'пример');
});

test('Japanese prolonged sound mark (Script=Common) is accepted', () => {
  for (const host of ['ラーメン.jp', 'コーヒー.テスト']) {
    assert.equal(decodeHost(ascii(host)), host, host);
  }
});

test('Cyrillic look-alikes of Latin names stay in punycode outside Cyrillic TLDs', () => {
  for (const host of ['аррӏе.com', 'сосо.com', 'www.раураӏ.com']) {
    const encoded = ascii(host);
    assert.equal(decodeHost(encoded), encoded, host);
  }
  assert.equal(decodeHost(ascii('ехрресс.рф')), 'ехрресс.рф');
  assert.equal(decodeHost(ascii('пример.com')), 'пример.com');
});
