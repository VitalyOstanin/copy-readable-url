import { decodeReadable, markdownLink } from './decode.js';

const OFFSCREEN_URL = 'offscreen.html';

// Each format has a keyboard command and a link/page context menu pair.
const FORMATS = {
  url: { format: decodeReadable, link: 'Копировать ссылку', page: 'Копировать адрес страницы' },
  md: { format: markdownLink, link: 'Копировать ссылку как markdown', page: 'Копировать адрес страницы как markdown' },
};
const COMMANDS = { 'copy-page-url': 'url', 'copy-page-markdown': 'md' };

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    for (const [key, { link, page }] of Object.entries(FORMATS)) {
      chrome.contextMenus.create({ id: `${key}:link`, title: link, contexts: ['link'] });
      chrome.contextMenus.create({ id: `${key}:page`, title: page, contexts: ['page'] });
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
  if (!url) {
    flashBadge(tabId, 'ERR', '#c62828');
    return;
  }
  await ensureOffscreen();
  const ok = await chrome.runtime.sendMessage({
    target: 'offscreen',
    text: format(url),
  });
  flashBadge(tabId, ok ? 'OK' : 'ERR', ok ? '#2e7d32' : '#c62828');
}

async function ensureOffscreen() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)],
  });
  if (contexts.length > 0) return;
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: [chrome.offscreen.Reason.CLIPBOARD],
    justification: 'Write the decoded URL to the clipboard.',
  });
}

function flashBadge(tabId, text, color) {
  if (tabId === undefined) return;
  chrome.action.setBadgeBackgroundColor({ tabId, color });
  chrome.action.setBadgeText({ tabId, text });
  setTimeout(() => chrome.action.setBadgeText({ tabId, text: '' }), 1500);
}
