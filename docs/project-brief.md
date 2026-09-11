# Project brief

## Goal and decisions

Build a Chrome extension usable by anyone with a Paprika account. Prioritize minimal onboarding friction and one-click saving. Paprika must perform extraction: local recipe parsing, AI extraction, and exporting recipes for manual import were explicitly excluded.

The selected approach is automatic bookmarklet connection. The user signs in on https://www.paprikaapp.com/bookmarklet/ and the extension detects the generated JavaScript bookmarklet and extracts its account token. The token remains in extension-local storage and is used only to communicate with Paprika.

The user authorized making the GitHub repository public and preparing a Chrome Web Store release on 2026-09-11. Store publication remains subject to account setup and Google review.

## Findings from Paprika's public script

Inspected https://www.paprikaapp.com/bookmarklet/v1 without an account token on 2026-09-11. No account action was performed during research.

- The bookmarklet loader appends a remote script containing a token query parameter and cache-busting timestamp.
- The loaded script captures the current URL, the document HTML, and layout/computed-style information.
- HTML and style data are UTF-8 encoded, raw-DEFLATE compressed, then Base64 encoded.
- The script posts form fields `url`, `html`, `styles`, and `token` to `https://www.paprikaapp.com/bookmarklet/v1/recipe`.
- It uses a temporary iframe for submission and feedback.
- It does not simply submit a URL. The extension should preserve the payload semantics needed by Paprika.

These are observed implementation details, not a supported third-party API contract. Response formats, token lifecycle, and extension compatibility have not been tested.

## Proposed extension architecture

- Chrome Manifest V3, with bundled executable code.
- A connection UI that opens the official bookmarklet page.
- A narrowly scoped content script on that page detects the generated bookmarklet after login. Parse its text; never evaluate it. Do not inspect password fields.
- Validate message sender origin, page path, and expected connection flow before accepting a token. Automatic detection must not silently replace an existing connection from an unrelated tab.
- Keep the credential in local extension storage restricted to trusted extension contexts. Do not expose it to recipe-page scripts, logs, analytics, or synced browser storage.
- Use temporary activeTab access and scripting for the user-selected recipe page.
- A bundled capture script gathers HTML and layout data, without interpreting recipe fields.
- The extension background context compresses and submits the payload over HTTPS to Paprika with the stored token.
- Show confirmed success, actionable failure, and reconnect states. Verify actual endpoint response behavior before choosing how to interpret it.
- Provide disconnect behavior that clears the stored token.

Permission design and exact implementation are provisional until the authenticated page and submission behavior are validated. No server operated by this project is expected.

## First prototype acceptance criteria

1. Load the extension unpacked in Chrome.
2. Connect from both an already-signed-in bookmarklet page and a fresh login flow without copying or pasting code.
3. Detect the bookmarklet token without collecting credentials or sending the token anywhere except Paprika.
4. On a user-selected recipe page, capture and submit the expected payload and verify the saved recipe appears in Paprika.
5. Handle signed-out state, unavailable bookmarklet, network failure, invalid token, and unsupported browser pages clearly.
6. Avoid duplicate submissions during repeated clicks; do not automatically retry a write with an uncertain outcome.
7. Verify disconnect clears credentials and restart preserves an intentional connection.
8. Scan source, fixtures, logs, and release files for accidental credential inclusion before pushing.

## Prototype implementation status (2026-09-11)

The Manifest V3 prototype is now in `extension/`. It includes automatic bookmarklet detection, connection validation, credential-restricted storage, bundled page capture, raw-DEFLATE payload encoding, direct HTTPS submission, popup feedback, retry for definite failures, and disconnect controls. Submitted pages and uncertain outcomes do not offer resubmission.

Nine Node/DOM checks passed. Isolated Chromium integration checks passed with synthetic onboarding pages, a fixture recipe, and intercepted Paprika responses. They verify connection detection, page capture and Unicode encoding, credential isolation, duplicate prevention, uncertain network outcomes, token rejection handling, and disconnect. No real credentials were used or committed.

The prototype intentionally says **Sent to Paprika**, with an instruction to verify the recipe in Paprika. No live save has been confirmed. The automated test uses a temporary fixture host permission rather than a manual toolbar gesture; the shipped extension still uses activeTab for recipe access.

## Next steps

- Inspect the authenticated bookmarklet page through a user-controlled browser session.
- Validate automatic connection detection against Paprika's actual authenticated markup.
- Validate the bundled capture and submission against the live endpoint.
- Verify one end-to-end save before broadening the UI or preparing store distribution.

## User feedback and UI revision

The user reported the initial prototype working, then requested styling consistent with Paprika and clear third-party identification. Version 0.1.1 adopts red accents, compact system typography, white content, and gray supporting sections based on Paprika's published Mac/iPhone screenshots. It uses an original clipboard icon rather than Paprika's official logo. The extension name, popup header/footer, toolbar tooltip, and connection notice identify the extension as unofficial. The user's report does not independently verify saved recipe fields or response semantics.

## Other API research

Kappari was investigated as a protocol reference, but its broader sync integration is not the selected approach. It documents password-only v1 login with tokens used on v2 sync endpoints and structured recipe uploads. Compatibility between those API tokens and bookmarklet tokens is unverified. The project will not implement our own extraction to use the structured upload endpoint.

References:

- https://github.com/johnwbyrd/kappari/blob/main/authentication.md
- https://github.com/johnwbyrd/kappari/blob/main/kappari/network_client.py
- https://github.com/johnwbyrd/kappari/blob/main/endpoints.md
- https://developer.chrome.com/docs/extensions/develop/concepts/activeTab
- https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code
- https://developer.chrome.com/docs/extensions/develop/concepts/network-requests
