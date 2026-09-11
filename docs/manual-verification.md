# Live verification checklist

Automated tests use synthetic credentials and intercepted server responses. They do not prove the undocumented Paprika service accepts the extension's payload.

## Install and connect

- Load the `extension` directory unpacked in Chrome and pin its toolbar icon.
- Click Connect Paprika. Confirm the destination is Paprika's official HTTPS bookmarklet page.
- Sign in normally. Confirm a **Paprika Clipper connected** notice appears without copying code.
- Also test starting while already signed in to Paprika.
- If detection fails, inspect the generated bookmarklet's DOM structure locally. Do not commit page captures or copy real bookmarklet tokens into issue reports, logs, tests, or screenshots.
- Close/reopen Chrome and confirm the connection persists.
- Opening the bookmarklet page outside an extension-initiated Connect flow must not replace the stored connection.

## Save a recipe

- Choose one public recipe page and click the toolbar icon once.
- Confirm Chrome grants the temporary page access and the popup reaches **Sent to Paprika** or shows an actionable error.
- Open Paprika and sync. Check that one recipe appears with its source, ingredients, directions, and expected photo.
- Reopen the popup and confirm no duplicate is created.
- Repeat with a page using a restrictive Content Security Policy and a dynamically rendered recipe, after the initial save works.
- Validate live endpoint response semantics before changing **Sent** into **Saved**. HTTP 200 alone is insufficient. Unexpected HTML responses are currently treated as unconfirmed submissions, including any undocumented HTML error messages.

## Connection and failure states

- Let a login flow expire and restart it.
- Try a restricted browser page; verify the extension asks for a recipe webpage.
- Disconnect and confirm the token is gone and the popup offers Connect again.
- Reconnect while already signed in; verify automatic detection.
- Check network failures and token rejection with controlled fixtures first. Do not repeatedly create real recipes to test retries.

## Current boundaries

- Live Paprika behavior has not been verified.
- The script assumes Paprika still generates a literal hexadecimal bookmarklet token in an anchor or readonly/code control, matching the supplied bookmarklet.
- Only HTML pages up to 20,000 elements and a 20 MiB capture payload are supported. A print-friendly recipe page may be needed for very large sites.
- No background retries, local extraction, sync-API fallback, or file export is implemented.
- Chrome Web Store publication has not been attempted.
