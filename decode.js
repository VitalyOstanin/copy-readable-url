import { decodeHost } from './idn.js';

// Decodes only percent-escaped UTF-8 sequences of non-ASCII characters (such
// as Cyrillic). ASCII escapes like %20, %2F, %3F stay encoded, so the URL keeps
// its structure and stays usable as a markdown link target. Each character is
// matched separately, so one malformed byte does not block its neighbours.
const CONT = '%[89ABab][0-9A-Fa-f]';
const UTF8_CHAR = new RegExp(
  `%[CDcd][0-9A-Fa-f]${CONT}|%[Ee][0-9A-Fa-f](?:${CONT}){2}|%[Ff][0-7](?:${CONT}){3}`,
  'g',
);
// Invisible or layout-changing characters (spaces, controls, bidi overrides)
// stay encoded: decoded they are unreadable or let a URL look like another.
// Guillemets and General Punctuation other than dashes (quotes, ellipsis,
// U+2016-U+206F) stay encoded too: Telegram ends a link at them
// (is_url_path_symbol in tdlib's MessageEntity.cpp), so «...» in a decoded
// path would cut the pasted link short.
const KEEP_ENCODED = /[\p{Z}\p{C}\u00AB\u00BB\u2016-\u206F]/u;
// scheme://[userinfo@]host[:port] — only the host part goes through IDN
// decoding.
const AUTHORITY = /^([a-z][a-z0-9+.-]*:\/\/(?:[^/?#@]*@)?)([^/?#:]*)/i;

export function decodeReadable(url) {
  const readable = url.replace(AUTHORITY, (_, prefix, host) => prefix + decodeHost(host));
  return decodePercent(readable);
}

function decodePercent(text) {
  return text.replace(UTF8_CHAR, (seq) => {
    let ch;
    try {
      ch = decodeURIComponent(seq);
    } catch {
      // Overlong or surrogate encoding: keep as is.
      return seq;
    }
    return KEEP_ENCODED.test(ch) ? seq : ch;
  });
}

// Title is the last non-empty path segment, fully decoded, with whitespace
// runs collapsed; the host when the path gives nothing. A literal `+` becomes a
// space first, as wikis such as Confluence use it for spaces in page names; an
// encoded plus (%2B) still decodes to `+`.
export function titleFromUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  const segment = (parsed.pathname.split('/').filter(Boolean).pop() ?? '').replaceAll('+', ' ');
  let title;
  try {
    title = decodeURIComponent(segment);
  } catch {
    title = decodePercent(segment);
  }
  title = title.replace(/[\p{Z}\p{C}\s]+/gu, ' ').trim();
  return title || decodeHost(parsed.hostname) || url;
}

// `_` is left alone: intraword underscores (Красная_площадь) are not emphasis
// in CommonMark, and escaping them would clutter the common case.
export function markdownLink(url) {
  const title = titleFromUrl(url).replace(/([\\[\]*`<])/g, '\\$1');
  const target = decodeReadable(url);
  return `[${title}](${needsAngleBrackets(target) ? `<${target}>` : target})`;
}

function needsAngleBrackets(target) {
  let depth = 0;
  for (const ch of target) {
    if (ch === '(') depth++;
    else if (ch === ')' && --depth < 0) return true;
    else if (ch === ' ' || ch === '<' || ch === '>') return true;
  }
  return depth !== 0;
}
