// navigator.clipboard needs a focused window, and an offscreen document is
// never focused, so the copy goes through execCommand on a textarea.
const textEl = document.querySelector('#text');

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target !== 'offscreen') return;
  textEl.value = message.text;
  textEl.select();
  sendResponse(document.execCommand('copy'));
});
