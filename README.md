# svg-viewer

Paste an SVG, get a shareable dual-pane viewer link (rendered + source).

Production: https://svg.ctalau.dev

## Local

This is a static site (no build). From the repo root:

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173. Home is a paste box only. **Create shareable link** opens the `?s=` viewer (rendered + read-only source). **New SVG** and the title return to `/`.

Any other static server also works (`npx serve .`, Caddy, nginx, Vercel).

## Sample SVG

Use `sample.svg`, or paste:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120">
  <rect width="160" height="120" rx="16" fill="#1b1d24"/>
  <circle cx="56" cy="60" r="28" fill="#e85d4c"/>
  <rect x="92" y="36" width="44" height="48" rx="8" fill="#f7f4ee"/>
</svg>
```

## Sharing

The SVG is encoded as URL-safe base64 (`base64url`) in the `?s=` query string. Nothing is stored on a server. Encoded payloads over ~80KB are rejected so the link stays usable.

The render pane strips `<script>` tags and `on*` event-handler attributes. The source pane keeps the original paste.

## Deploy

Point a Vercel project at this repo. Framework preset can stay **Other**; there is no build command or output directory.
