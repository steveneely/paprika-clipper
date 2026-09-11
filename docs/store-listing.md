# Chrome Web Store submission

Release package: `dist/paprika-recipe-clipper-1.0.0.zip`.

Status: uploaded to Chrome Web Store as a draft on September 11, 2026. Listing assets, privacy declarations, and test instructions are saved. Dedicated reviewer account access is still needed before submission. The item has not been submitted or approved.

Store item ID: `bdlhgjkkjeohmmfcfpmpdjnffhkoajgn`. Repository visibility: public.

## Listing fields

**Name:** Paprika Recipe Clipper (Unofficial)

**Summary from package:** Independent, unofficial extension for saving recipe pages to Paprika. Not affiliated with Paprika or Hindsight Labs.

**Category:** Lifestyle → Household.

**Language:** English

**Description:**

Save recipes from the web to your Paprika account without copying a bookmarklet.

Connect once by signing in on Paprika’s own website. Then open a recipe page and click the scissors in your Chrome toolbar. The page is sent directly to Paprika for recipe extraction and saving.

• Simple connection through Paprika’s website — no password entry in the extension.
• One-click submission from the recipe page you’re viewing.
• Your connection token is stored locally in your Chrome profile.
• No analytics, advertising, or project-operated server.
• Compact status messages and protection against repeated submissions when reopening the popup on the same page in the same tab.

Requires a Paprika account. This extension uses Paprika’s bookmarklet service and depends on its availability and compatibility. It does not inspect or deduplicate your existing recipe library.

Independent, unofficial extension. Not affiliated with or endorsed by Paprika or Hindsight Labs.

**Homepage:** https://github.com/steveneely/paprika-clipper

**Support:** https://github.com/steveneely/paprika-clipper/issues

**Privacy policy:** https://github.com/steveneely/paprika-clipper/blob/main/docs/privacy.md

## Privacy practices

**Single purpose:** Send a user-selected recipe webpage to the user’s Paprika account for extraction and saving by Paprika.

**activeTab justification:** Access the current webpage only after the user invokes the extension, so its URL, HTML, and layout can be captured for Paprika.

**scripting justification:** Execute bundled capture code in an isolated context on that user-selected page. The code captures HTML and layout; it does not extract recipe fields or execute remotely supplied code.

**storage justification:** Store the connection token locally in the user’s Chrome profile and keep temporary connection/save state in session storage. Storage access is restricted to trusted extension contexts.

**Host permission justification — https://www.paprikaapp.com/*:** Detect the generated bookmarklet only on the official bookmarklet page in an extension-initiated connection tab, and send captured page data directly to Paprika’s HTTPS recipe endpoint. The content script’s match patterns are limited to the bookmarklet page.

**Remote code:** No. All executable code is bundled. The extension parses a literal token from the generated bookmarklet; it never evaluates the bookmarklet or downloads executable code. Paprika’s response is treated as data.

**Data disclosures:** Do not select “no user data.” Disclose authentication information (the bookmarklet token), website content (selected page HTML/layout), and web history (the URL of the selected page). The extension does not collect a background browsing history, passwords, or analytics. Review the dashboard’s current category definitions and disclose any additional category they require for incidental personal content in user-selected webpages. These declarations must match the privacy policy and actual behavior.

**Limited-use certifications:** The data is not sold or transferred beyond the service necessary for the extension’s single purpose, is not used for unrelated purposes, and is not used to determine creditworthiness or lending eligibility. The developer must review and attest to the dashboard’s exact certification statements.

## Reviewer testing instructions

1. Install the extension and pin its toolbar icon.
2. Click Connect Paprika and sign in on Paprika’s official bookmarklet page with a Paprika account.
3. After the bookmarklet is generated, verify the centered connection message and three-second countdown. Only the extension-created connection tab closes.
4. Open a public recipe webpage and click the scissors. The extension captures and sends that page directly to Paprika, then shows Sent to Paprika.
5. Open/sync Paprika to inspect the resulting recipe. The popup does not claim to independently verify the recipe library.
6. Reopen the popup on the same page in the same tab and verify that it does not resubmit.
7. Use Options to disconnect.

A valid Paprika account is needed for full review. If Google requires credentials, the owner must provide a dedicated review account through the private dashboard testing fields. Do not put credentials in this repository, screenshots, ZIP, listing description, or issues.

## Assets

Run `npm run test:browser`, then `npm run assets`.

- `store-assets/screenshot-connect.png`: 1280×800, actual extension connection UI in a listing composition.
- `store-assets/screenshot-sent.png`: 1280×800, actual extension submission UI in a listing composition.
- `store-assets/promo-small.png`: 440×280, original scissors/recipe artwork.
- `extension/icons/icon-128.png`: 128×128 PNG, including store-recommended transparent padding.

All captures use synthetic fixtures and contain no real account data. The promotional artwork is original. Font files and Paprika’s logo are not included.

## Submission checklist

- Public repository and publicly accessible privacy policy URL.
- Developer registration, verified email, and Google-required account security/identity setup complete.
- Runtime ZIP uploaded; listing, screenshots, promotional image, privacy fields, distribution, and testing details completed.
- Any required dedicated review credentials entered privately by the owner.
- Submit for review. The extension is not live until Google approves and publishes it.

Official references checked September 11, 2026:

- https://developer.chrome.com/docs/webstore/register
- https://developer.chrome.com/docs/webstore/publish
- https://developer.chrome.com/docs/webstore/images
- https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
