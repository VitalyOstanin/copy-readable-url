// Punycode (RFC 3492) decoding of xn-- host labels, limited to labels whose
// letters all belong to one writing system. Mixed-script labels such as
// "аpple" (Cyrillic а + Latin) stay in punycode: decoded, they would pass
// for another domain.
const BASE = 36;
const T_MIN = 1;
const T_MAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;
const MAX_CODE_POINT = 0x10ffff;

function adapt(delta, numPoints, firstTime) {
  delta = firstTime ? Math.floor(delta / DAMP) : delta >> 1;
  delta += Math.floor(delta / numPoints);
  let k = 0;
  while (delta > ((BASE - T_MIN) * T_MAX) >> 1) {
    delta = Math.floor(delta / (BASE - T_MIN));
    k += BASE;
  }
  return k + Math.floor(((BASE - T_MIN + 1) * delta) / (delta + SKEW));
}

function digitOf(code) {
  if (code >= 0x30 && code <= 0x39) return code - 0x30 + 26;
  if (code >= 0x41 && code <= 0x5a) return code - 0x41;
  if (code >= 0x61 && code <= 0x7a) return code - 0x61;
  return BASE;
}

// Throws on malformed input.
export function punycodeDecode(input) {
  const lastDash = input.lastIndexOf('-');
  const output = [];
  for (let j = 0; j < Math.max(lastDash, 0); j++) {
    const code = input.charCodeAt(j);
    if (code >= 0x80) throw new RangeError('non-basic code point');
    output.push(code);
  }
  let n = INITIAL_N;
  let bias = INITIAL_BIAS;
  let i = 0;
  for (let idx = lastDash > 0 ? lastDash + 1 : 0; idx < input.length; ) {
    const oldI = i;
    for (let w = 1, k = BASE; ; k += BASE) {
      if (idx >= input.length) throw new RangeError('truncated input');
      const digit = digitOf(input.charCodeAt(idx++));
      if (digit >= BASE) throw new RangeError('invalid digit');
      i += digit * w;
      const t = k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;
      if (digit < t) break;
      w *= BASE - t;
      if (i > MAX_CODE_POINT * (output.length + 1)) throw new RangeError('overflow');
    }
    const points = output.length + 1;
    bias = adapt(i - oldI, points, oldI === 0);
    n += Math.floor(i / points);
    i %= points;
    if (n > MAX_CODE_POINT) throw new RangeError('overflow');
    output.splice(i++, 0, n);
  }
  return String.fromCodePoint(...output);
}

// Groups of scripts that legitimately share one label count as one alphabet.
// Script_Extensions, not Script: the Japanese prolonged sound mark ー is
// Script=Common but belongs to Hiragana and Katakana by extension.
const ALPHABETS = [
  ['Latin'],
  ['Cyrillic'],
  ['Greek'],
  ['Armenian'],
  ['Georgian'],
  ['Hebrew'],
  ['Arabic'],
  ['Devanagari'],
  ['Bengali'],
  ['Tamil'],
  ['Thai'],
  ['Han', 'Hiragana', 'Katakana'],
  ['Hangul', 'Han'],
].map((scripts) => new RegExp(`^[${scripts.map((s) => `\\p{scx=${s}}`).join('')}\\p{Script=Inherited}0-9-]+$`, 'u'));

export function isSingleAlphabet(label) {
  return ALPHABETS.some((re) => re.test(label));
}

// Cyrillic letters that look like Latin ones. A label made only of them
// ("аррӏе") reads as a Latin name, so outside a Cyrillic TLD it stays in
// punycode, as Chromium does for whole-script confusables.
const LATIN_LOOKALIKES = /^[асԁеһіјкӏорԛѕԝхуъьҽпгѵѡ0-9-]+$/u;
const CYRILLIC = /^[\p{scx=Cyrillic}0-9-]+$/u;

// Returns the readable label, or the original one when it is not punycode,
// is malformed, or mixes alphabets.
export function decodeLabel(label) {
  if (!/^xn--/i.test(label)) return label;
  let decoded;
  try {
    decoded = punycodeDecode(label.slice(4));
  } catch {
    return label;
  }
  if (!isSingleAlphabet(decoded)) return label;
  // Round trip through the URL parser: rejects labels that are valid
  // punycode but not a valid IDNA label.
  try {
    if (new URL(`http://${decoded}/`).hostname !== label.toLowerCase()) return label;
  } catch {
    return label;
  }
  return decoded;
}

export function decodeHost(host) {
  const raw = host.split('.');
  const decoded = raw.map(decodeLabel);
  const cyrillicTld = CYRILLIC.test(decoded.at(-1));
  return decoded
    .map((label, i) => (!cyrillicTld && LATIN_LOOKALIKES.test(label) && label !== raw[i] ? raw[i] : label))
    .join('.');
}
