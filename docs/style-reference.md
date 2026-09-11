# Paprika typography and style reference

Inspected the public stylesheet on 2026-09-11:

- https://www.paprikaapp.com/static/css/custom.css
- https://www.paprikaapp.com/static/css/bootstrap.min.css

The website declares Futura / futura-pt for brand text, Montserrat at weight 400 for headings, and Helvetica Neue / Helvetica / Arial for body text. It imports Open Sans but the inspected body style does not use it. These are verified website declarations; we have not inspected fonts inside the native Paprika application.

Version 0.1.2 applies these font roles, Paprika's brand red (#d10505), body color (#333), navbar background (#f8f8f8), panel background (#f5f5f5), panel borders (#ddd), 20 px panel padding, and Bootstrap-style 4 px control corners. The primary button uses the brand red. The layout is adapted to an extension popup rather than copying the site's complete Bootstrap stylesheet.

Futura is used from the user's system if installed. It was present on the development Mac; other systems fall back to bundled Montserrat. Paprika's Adobe font kit and proprietary font files are not bundled or fetched at runtime. Montserrat comes from Google Fonts and is distributed with its OFL license.

The original clipboard icon, unofficial subtitle, and non-affiliation footer remain visible to distinguish this extension from Paprika's official products.
