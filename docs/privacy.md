# Privacy policy — Paprika Recipe Clipper

Effective date: September 11, 2026.

Paprika Recipe Clipper is an independent extension. It does not operate a backend or use analytics.

## Account connection

The user signs in directly on `https://www.paprikaapp.com/bookmarklet/`. The extension watches only for a generated bookmarklet in the tab opened by its Connect action. It does not read password fields. A connection attempt expires after 15 minutes.

The account token is stored in Chrome's extension-local storage, with access restricted to trusted extension contexts. It is not synced to other Chrome profiles. It is not encrypted by this extension and should be treated as a credential. Disconnect removes it; removing the extension also clears its local storage. Disconnect is local removal, not server-side token revocation.

## Saving a page

Clicking the toolbar button while connected on an eligible recipe webpage starts a capture immediately. The extension captures the page URL, HTML, and computed layout/styles to match Paprika's bookmarklet protocol. This includes page content outside the recipe itself. Input value attributes and textarea contents are omitted; other personal content visible or embedded in the selected page can still be included.

The payload is compressed and sent directly over HTTPS to Paprika with the account token. No recipe extraction is performed locally. The token is never injected into the recipe page. Page captures and raw server responses are not persisted or logged by the extension. Temporary status information, including the last submitted URL for a tab, stays in session storage and is cleared when Chrome restarts, the extension reloads, or the user disconnects.

Only Paprika controls how submitted information is processed and retained: https://www.paprikaapp.com/privacy/

## Chrome permissions

- `activeTab`: temporary access to a webpage after the user invokes the extension.
- `scripting`: runs bundled page-capture code in an isolated world.
- `storage`: stores the local connection and temporary UI state.
- `https://www.paprikaapp.com/*`: connects to the bookmarklet endpoint and enables the narrowly matched onboarding content script. Chrome's host permission applies to the origin; the content script itself matches only the bookmarklet page.

No browsing-history, cookies, password-manager, or permanent all-sites permission is requested. Normal webpage content can include personal information; save only pages you intend to send to Paprika.

## Use and sharing

Data is used only to connect to the account you choose and send the webpages you explicitly select to Paprika. The developer does not receive your page captures or connection token, sell user data, use it for advertising, or use it to determine creditworthiness or lending eligibility. Transfers to Paprika are necessary to provide the extension’s recipe-saving function. The extension does not use this data for unrelated purposes.

## Contact

For privacy questions, contact the maintainer through the [project’s issue tracker](https://github.com/steveneely/paprika-clipper/issues). Do not post credentials, personal recipe data, or authenticated captures in a public issue. For security vulnerabilities, use GitHub’s private vulnerability reporting for this repository when available.
