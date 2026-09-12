# Paprika Recipe Clipper

Save recipe webpages to your Paprika account from Chrome. Connect once through Paprika’s website, then click the scissors on a recipe page. Paprika handles recipe extraction and saving.

An independent extension, not affiliated with or endorsed by Paprika or Hindsight Labs. A Paprika account is required.

## Install

The first Chrome Web Store release is being prepared. Until the store listing is available:

1. Download this repository and open `chrome://extensions` in Chrome 120 or later.
2. Enable **Developer mode**, choose **Load unpacked**, and select the `extension` folder.
3. Pin **Paprika Recipe Clipper** in Chrome’s extensions menu.
4. Click **Connect Paprika** and sign in on Paprika’s website. A success message counts down for three seconds, then closes the connection tab.
5. Open a recipe webpage and click the scissors to send it to Paprika.

The suggested shortcut is **Alt+Shift+P**, customizable at `chrome://extensions/shortcuts`. Use the extension’s **Options** page to manage the connection without sending a page.

After updating unpacked files, reload the extension in `chrome://extensions`. Start a fresh connection tab when testing onboarding changes.

## Privacy

- Sign in directly on Paprika’s site. The extension does not collect your password.
- Your connection token is stored in this Chrome profile, not synced between devices.
- Clicking the extension on a recipe page sends that page’s URL, HTML, and layout information directly to Paprika over HTTPS. Page content outside the recipe can be included.
- No project-operated server, analytics, advertising, remote code, or bundled/remote fonts.
- Disconnect clears the locally stored token and session state.

Read the [privacy policy](docs/privacy.md) for data handling and permissions.

## Behavior and limitations

The popup reports **Sent to Paprika** after submission. It does not inspect your recipe library or promise that every recipe field was extracted correctly. Paprika controls extraction and storage.

Reopening the popup on the same page in the same tab does not send another copy. Submitted pages and uncertain outcomes have no save-again control. Retry is offered for definite failures. This guard covers the current page in each tab during the browser session; it does not deduplicate across tabs, restarts, or your existing Paprika library.

The extension uses Paprika’s undocumented bookmarklet protocol. Changes to that service can affect compatibility. HTML pages up to 20,000 elements and a 20 MiB capture payload are supported.

## Development

The extension loads directly from `extension/`; no build is required. Development uses Node 24 or later and Python 3 for packaging.

```sh
npm ci
npm test
npm run check
npx playwright install chromium
npm run test:browser
npm run package
```

Browser tests use an isolated profile, synthetic credentials, example pages, and intercepted Paprika responses. They exercise onboarding, countdown closure, page capture, Unicode encoding, token isolation, duplicate prevention, and error handling without writing to a real account. Live use has been reported working by the project owner; automated fixtures do not independently verify Paprika’s current service or saved recipe fields.

`npm run package` creates a deterministic ZIP in `dist/` with the extension runtime and MIT license notice. `npm run assets` renders store artwork using screenshots from `npm run test:browser`.

See [manual verification](docs/manual-verification.md), [store submission notes](docs/store-listing.md), and the [project brief](docs/project-brief.md).

## Support

[Open an issue](https://github.com/steveneely/paprika-clipper/issues) for bugs or suggestions. Never include passwords, bookmarklet tokens, personal bookmarklet code, or authenticated page captures in a public issue.

## License

[MIT](LICENSE) © 2026 Steve Neely.
