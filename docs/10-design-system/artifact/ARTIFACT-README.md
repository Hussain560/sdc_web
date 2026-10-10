# Design System artifact (export)

Snapshot of the SDC Design System artifact (claude.ai/artifact/BzT4zMEtYREgjWBgYZZbxd), version 7, exported 2026-10-10.

For a coding agent:

- Start with `README.md` (usage rules), then `tokens.json` / `tokens.css` (the token values).
- `components/<Name>/README.md` and `preview.html` show each component in both themes. `components/bundle.css` holds the `.ds-*` preview styles; they are a **reference only**, not production CSS.
- The source of truth for production is `src/styles/primitives.css` + `src/styles/tokens.css` and the docs in `docs/10-design-system/`. If this export and those disagree, the docs win; report the difference.
- `assets/` and `fonts/` are the reference logos, hero art and IBM Plex Sans Arabic weights. Do not recolour the logos.
- Do not edit these files by hand. Change the docs, then re-export.
