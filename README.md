# Paprika Clipper

An independent, unofficial Chrome extension for saving webpages to Paprika Recipe Manager, with recipe extraction and saving handled entirely by Paprika. Not affiliated with or endorsed by Paprika or Hindsight Labs.

## Status

The unpacked Chrome prototype is implemented, and the user reported the initial live flow working. Automated tests cover synthetic onboarding, page capture, payload encoding, token isolation, and save/error states. Exact live response semantics and recipe-field completeness have not been independently verified.

Version 0.1.1 uses Paprika-inspired red accents, system typography, and white/gray panels, with a distinct clipboard icon. The popup, extension listing, toolbar tooltip, and connection notice all identify it as unofficial.

## Try it in Chrome

1. Open `chrome://extensions` and enable **Developer mode**.
2. Choose **Load unpacked** and select this repository's `extension` folder (on the development machine: `/Users/sneely/code/paprika-clipper/extension`). No build or Node installation is needed to load it.
3. Pin **Paprika Clipper** using Chrome's extensions menu.
4. Click its toolbar icon, then **Connect Paprika**. Sign in on the Paprika tab; the extension should display a connection notice automatically.
5. Open a recipe webpage and click the toolbar icon again. The page will be captured and submitted immediately.
6. Open Paprika and verify the recipe appears. The prototype reports **Sent to Paprika**, not a confirmed save, until live response semantics are established.

Reopening the popup on the same page in the same tab does not automatically submit it again. To send it again, check Paprika first, then use the explicit retry control. A network timeout never triggers an automatic retry.

Use the extension's **Options** page to view connection status or disconnect without saving a page. A suggested shortcut is **Alt+Shift+P**; Chrome lets you customize it at `chrome://extensions/shortcuts`.

After changing extension files, click **Reload** on its card at `chrome://extensions` and reload any already-open Paprika connection tab.

## Development and checks

Node 24 or later:

```sh
npm ci
npm test
npm run check
npx playwright install chromium
npm run test:browser
```

The runtime has no third-party dependencies. DOM and Chromium dependencies are development-only. The browser test uses a temporary profile, synthetic pages, and intercepted submission responses; it does not use a real account. Its disposable manifest grants access to the fixture recipe host to stand in for a manual toolbar gesture. That permission is absent from the shipped manifest.

See [manual verification](docs/manual-verification.md) for the remaining live checks and [privacy](docs/privacy.md) for the data flow.

## Intended experience

1. Click **Connect Paprika** in the extension.
2. Log in on Paprika's own bookmarklet page, if needed.
3. The extension detects the generated bookmarklet, stores its token locally, and displays **Connected**.
4. Click the toolbar button on a recipe page to send that page to Paprika for extraction and saving.

The normal onboarding flow should require no copying code or editing settings. Automatic bookmarklet detection still needs to be verified on the authenticated page.

## Design constraints

- Paprika performs all recipe extraction. Do not implement a recipe parser, AI extraction, or structured-data extraction.
- Users sign in on Paprika's website. The extension does not collect their passwords.
- Each user supplies their own account connection; no credentials are shipped in the repository.
- Send page data directly to Paprika, without a project-operated backend.
- Access recipe pages only when the user invokes the extension.
- Bundle executable extension code locally for Manifest V3.

See [the project brief](docs/project-brief.md) for technical findings, unresolved questions, and prototype acceptance criteria.

## References

- [Paprika bookmarklet](https://www.paprikaapp.com/bookmarklet/)
- [Paprika bookmarklet script, without an account token](https://www.paprikaapp.com/bookmarklet/v1)
- [Chrome extension documentation](https://developer.chrome.com/docs/extensions/)

This project is not affiliated with or endorsed by Paprika or Hindsight Labs.
