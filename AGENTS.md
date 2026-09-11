# Project instructions

- Prefer Homebrew for developer tools and system dependencies when a reasonable formula or cask exists.
- Read README.md and docs/project-brief.md before implementing the prototype.
- Keep onboarding low friction: connect through Paprika's bookmarklet page and automatically detect its generated bookmarklet.
- Paprika must perform all recipe extraction and saving. Do not add our own extraction pipeline or file-export workflow.
- Never commit passwords, account tokens, generated personal bookmarklets, authenticated page captures, or recipe-library exports. Use synthetic credentials in fixtures.
- Do not assume the cloud sync API token and bookmarklet token are interchangeable.
- Do not execute fetched bookmarklet code or arbitrary page code in the extension. Implement the required capture and submission logic as bundled code.
- Distinguish page capture from recipe extraction. Capturing HTML and layout for Paprika is allowed; interpreting recipe ingredients or directions is out of scope.
- Report actual verification status. A successful HTTP response alone must not be described as a confirmed recipe save unless its contents establish success.
- Use only system fonts; do not bundle or remotely load font files. Use familiar recipe-app cues with an independent visual identity rather than copying Paprika's branding or styles exactly. Clearly label the extension as unofficial and third party. Do not use Paprika's official logo or imply endorsement.
