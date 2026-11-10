# Copy Readable URL

English | [Русский](README.ru.md)

A Chromium extension (Chrome, Brave, Edge) that copies URLs with Cyrillic and other non-ASCII characters readable, instead of the percent-encoded form (`%D0%9C%D0%BE...`) the address bar puts on the clipboard. It can also copy a URL as a ready markdown link.

```
https://ru.wikipedia.org/wiki/%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0
→ https://ru.wikipedia.org/wiki/Москва
→ [Москва](https://ru.wikipedia.org/wiki/Москва)
```

## Contents

- [Why](#why)
- [Usage](#usage)
- [Installation](#installation)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [What gets decoded](#what-gets-decoded)
- [Permissions and privacy](#permissions-and-privacy)
- [Development](#development)
- [License](#license)

## Why

When the whole address is copied, Chromium's address bar writes the canonical URL to the clipboard, with every non-ASCII character percent-encoded (`AdjustTextForCopy` in [`components/omnibox/browser/omnibox_text_util.cc`](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/components/omnibox/browser/omnibox_text_util.cc)). There is no setting to turn this off. Firefox has one: `browser.urlbar.decodeURLsOnCopy` in `about:config`.

## Usage

| #   | Action                                              | Copies                         |
|-----|-----------------------------------------------------|--------------------------------|
| 1   | `Alt+U` (may need to be assigned, see below)        | URL of the current tab         |
| 2   | `Alt+Shift+U` (may need to be assigned, see below)  | URL of the current tab as markdown link |
| 3   | Link context menu → *Copy link*                     | link URL                       |
| 4   | Link context menu → *Copy link as markdown*         | link URL as markdown link      |
| 5   | Page context menu → *Copy page URL*                 | page URL                       |
| 6   | Page context menu → *Copy page URL as markdown*     | page URL as markdown link      |

`Alt+U` and `Alt+Shift+U` are only suggested shortcuts. If another extension already uses one of them, the browser leaves the command without a shortcut, and it has to be assigned on the browser's shortcuts page, see [Keyboard shortcuts](#keyboard-shortcuts).

The extension badge shows `OK` or `ERR` for 1.5 seconds after each copy. Menu items and shortcut names follow the browser language (English or Russian).

A markdown link is `[title](url)`. The title is the last non-empty path segment, fully decoded (`%20` becomes a space), or the host name when the path is empty.

## Installation

The extension is not in the Chrome Web Store yet and is installed as an unpacked extension.

Releases: <https://github.com/VitalyOstanin/copy-readable-url/releases/latest>

1. Download `copy-readable-url-<version>.zip` from the [latest release](https://github.com/VitalyOstanin/copy-readable-url/releases/latest) and unpack it; you get a `copy-readable-url` directory. Alternatively, `git clone https://github.com/VitalyOstanin/copy-readable-url.git`.
2. Open `chrome://extensions` (`brave://extensions` in Brave, `edge://extensions` in Edge) and turn on *Developer mode*.
3. Click *Load unpacked* and select the `copy-readable-url` directory (the one containing `manifest.json`).
4. Check that both shortcuts are assigned, see [Keyboard shortcuts](#keyboard-shortcuts).

To update: unpack the ZIP from the [latest release](https://github.com/VitalyOstanin/copy-readable-url/releases/latest) over the same directory (or run `git pull` in a clone) and press the reload button on the extension card. Keep the directory in place: the browser loads the extension from it on every start.

## Keyboard shortcuts

The extension suggests `Alt+U` (copy page URL) and `Alt+Shift+U` (copy page URL as markdown). The browser assigns a suggested shortcut only if no other extension uses it; otherwise the command stays without a shortcut and nothing happens when the keys are pressed.

To check or change the shortcuts:

1. Open the shortcuts page:
   - Chrome: `chrome://extensions/shortcuts`;
   - Edge: `edge://extensions/shortcuts`;
   - Brave: open `brave://extensions` and choose *Keyboard shortcuts* in the left panel.
2. Find *Copy Readable URL*. It lists two commands: *Copy page URL* and *Copy page URL as markdown link*.
3. Click the edit button (or the empty field) next to a command and press the new combination. A shortcut must include `Ctrl` or `Alt`; on macOS, `Alt` is the `Option` key and `Ctrl` becomes `Command`.
4. If the combination is already used by another extension, either choose another one or first clear it in that extension (on the same page), then assign it here.
5. Leave the scope at *In Chrome* (*In Brave*, *In Edge*), not *Global*: the extension needs the active tab of the focused browser window.

The context menu items do not need shortcuts and work regardless of these settings.

## What gets decoded

- **Path, query, fragment.** Percent-encoded UTF-8 sequences of non-ASCII characters are decoded one character at a time. ASCII escapes (`%20`, `%2F`, `%3F`, `%26`) stay encoded so the URL keeps its meaning and stays a valid markdown link target. Invalid UTF-8 (for example, a cp1251-encoded query) is left as is.
- **Invisible characters stay encoded:** spaces, control characters and bidirectional overrides (`%C2%A0`, `%E2%80%8B`, `%E2%80%AE`), so a decoded URL cannot look like a different one.
- **Guillemets and typographic quotes stay encoded** (`«` `»` `“` `”` `…` and the rest of General Punctuation except dashes): Telegram ends an auto-detected link at them, so a decoded `«...»` would cut the pasted link short.
- **Domain names** (`xn--...`, punycode) are decoded label by label when all letters of the label belong to one writing system (Latin, Cyrillic, Greek, Japanese, Korean and others) and the decoded label converts back to the same `xn--` form. Labels mixing alphabets (`аpple` with a Cyrillic `а`) stay in punycode. Outside Cyrillic top-level domains, labels made only of Cyrillic letters that look like Latin ones (`аррӏе.com`) stay in punycode too.
- **Markdown title:** `[`, `]`, `*`, `` ` ``, `<` and `\` are escaped; `_` is not, since an underscore inside a word is not emphasis in CommonMark. A target with unbalanced parentheses is wrapped in `<...>`.

## Permissions and privacy

| #   | Permission      | Used for                                                                 |
|-----|-----------------|--------------------------------------------------------------------------|
| 1   | `activeTab`     | reading the URL of the current tab when a shortcut is pressed            |
| 2   | `contextMenus`  | the four context menu items                                              |
| 3   | `offscreen`     | a hidden page that writes to the clipboard (service workers cannot)      |
| 4   | `clipboardWrite`| writing the decoded URL to the clipboard                                 |

The extension makes no network requests, stores nothing and reads only the URL you ask it to copy.

## Development

No build step: the extension is plain JavaScript modules loaded as is. Tests need Node.js 20 or newer:

```
npm test
```

`tools/package.sh` builds the release ZIP (`dist/copy-readable-url-<version>.zip`) from the committed `HEAD`; it needs `git` and `jq`.

## License

[MIT](LICENSE)
