import { decodeReadable, markdownLink } from './decode.js';

const OFFSCREEN_URL = 'offscreen.html';

// Each format has a keyboard command and a link/page context menu pair;
// menu titles are message names from _locales.
const FORMATS = {
  url: { format: decodeReadable, link: 'menuCopyLink', page: 'menuCopyPage' },
  md: { format: markdownLink, link: 'menuCopyLinkMarkdown', page: 'menuCopyPageMarkdown' },
};
const COMMANDS = { 'copy-page-url': 'url', 'copy-page-markdown': 'md' };

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    for (const [key, { link, page }] of Object.entries(FORMATS)) {
      chrome.contextMenus.create({ id: `${key}:link`, title: chrome.i18n.getMessage(link), contexts: ['link'] });
      chrome.contextMenus.create({ id: `${key}:page`, title: chrome.i18n.getMessage(page), contexts: ['page'] });
    }
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const [key, where] = String(info.menuItemId).split(':');
  const url = where === 'link' ? info.linkUrl : info.pageUrl;
  copy(url, FORMATS[key].format, tab?.id);
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  const key = COMMANDS[command];
  if (!key) return;
  if (!tab) [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  copy(tab?.url, FORMATS[key].format, tab?.id);
});

async function copy(url, format, tabId) {
  let ok = false;
  try {
    if (url) {
      await ensureOffscreen();
      ok = await chrome.runtime.sendMessage({
        target: 'offscreen',
        text: format(url),
      });
    }
  } catch (err) {
    console.error('copy failed', err);
  }
  flashBadge(tabId, ok ? 'OK' : 'ERR', ok ? '#2e7d32' : '#c62828');
}

// Shared so that two quick copies do not both try to create the document:
// a second createDocument call fails while the first is still pending.
let creating = null;

async function ensureOffscreen() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)],
  });
  if (contexts.length > 0) return;
  creating ??= chrome.offscreen
    .createDocument({
      url: OFFSCREEN_URL,
      reasons: [chrome.offscreen.Reason.CLIPBOARD],
      justification: 'Write the decoded URL to the clipboard.',
    })
    .finally(() => {
      creating = null;
    });
  await creating;
}

const badgeTimers = new Map();

function flashBadge(tabId, text, color) {
  if (tabId === undefined) return;
  clearTimeout(badgeTimers.get(tabId));
  // The tab may already be closed; the badge is cosmetic, so ignore that.
  chrome.action.setBadgeBackgroundColor({ tabId, color }).catch(() => {});
  chrome.action.setBadgeText({ tabId, text }).catch(() => {});
  badgeTimers.set(
    tabId,
    setTimeout(() => {
      badgeTimers.delete(tabId);
      chrome.action.setBadgeText({ tabId, text: '' }).catch(() => {});
    }, 1500),
  );
}
