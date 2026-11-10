# TODO

## Contents

- [Publish to the Chrome Web Store](#publish-to-the-chrome-web-store)

## Publish to the Chrome Web Store

For now the extension is installed manually as an unpacked extension. Publishing in the store gives automatic updates and installation without Developer mode. Brave installs from the same store.

What is needed:

| #   | Item | Details |
|-----|------|---------|
| 1   | Developer account | Register at the [Chrome Web Store developer dashboard](https://developer.chrome.com/docs/webstore/register) with a Google account and pay the one-time registration fee (US$5 according to the [Chromium Blog](https://blog.chromium.org/2020/03/new-developer-dashboard-and.html); check the current amount on registration). The account email cannot be changed later. Paying from Russia needs a card that Google accepts. |
| 2   | Icons | A 128x128 icon in the package (`icons` in `manifest.json`, also 16, 32 and 48 for the toolbar and menus). The extension currently has no icons; the browser shows a letter. |
| 3   | Store listing images | At least one screenshot, 1280x800 or 640x400; a 440x280 small promo tile is recommended ([image requirements](https://developer.chrome.com/docs/webstore/images)). |
| 4   | Listing text | Detailed description in English and Russian; the name and short description already come from `_locales`. |
| 5   | Privacy tab | Single purpose description, a justification for each permission (`activeTab`, `contextMenus`, `offscreen`, `clipboardWrite`) and the data use declaration ([privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)). The extension collects no data; a short privacy policy page stating that is still worth linking. |
| 6   | Package | A ZIP of the extension files only: `manifest.json`, `_locales/`, `*.js`, `offscreen.html`, icons; without `test/`, `package.json`, `.git`. `tools/package.sh` already builds such a ZIP for GitHub releases; add icons to its file list. |
| 7   | Version bump | Every upload needs a higher `version` in `manifest.json`. |
| 8   | Review | Submit for review; after approval, update the README installation section with the store link. |
| 9   | Edge (optional) | The same ZIP can be published to [Microsoft Edge Add-ons](https://partner.microsoft.com/dashboard/microsoftedge/), which, as far as known, has no registration fee (not verified). |
