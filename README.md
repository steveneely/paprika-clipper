# Paprika Clipper

An independent Chrome extension project for saving webpages to Paprika Recipe Manager, with recipe extraction and saving handled entirely by Paprika.

## Status

Project initialized. The first milestone is an unpacked Chrome extension prototype that validates automatic bookmarklet connection and an end-to-end save. No extension is implemented yet.

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
