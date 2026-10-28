// Decodes only percent-escaped non-ASCII bytes (UTF-8 sequences such as
// Cyrillic). ASCII escapes like %20, %2F, %3F stay encoded, so the URL keeps
// its structure and stays usable as a markdown link target.
const NON_ASCII_RUN = /(?:%[89A-Fa-f][0-9A-Fa-f])+/g;

export function decodeReadable(url) {
  return url.replace(NON_ASCII_RUN, (run) => {
    try {
      return decodeURIComponent(run);
    } catch {
      // Not valid UTF-8 (e.g. a cp1251-encoded query): keep as is.
      return run;
    }
  });
}

// Title is the last non-empty path segment, fully decoded; the host when the
// path is empty.
export function titleFromUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  const segment = parsed.pathname.split('/').filter(Boolean).pop();
  if (!segment) return parsed.hostname || url;
  try {
    return decodeURIComponent(segment);
  } catch {
    return decodeReadable(segment);
  }
}

export function markdownLink(url) {
  const title = titleFromUrl(url).replace(/([\\[\]])/g, '\\$1');
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
