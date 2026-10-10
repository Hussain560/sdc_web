# EventCard

The event in a grid: image, status, date, title, place and seats; the whole card links to the event.

- Anatomy: 16:9 image inset 8px (`radius-lg`) → status pill + date block → title (`t-h4`, 2 lines) → meta row (place or online, seats left).
- One link (the title) stretched over the card; no nested links. Hover: lift 2px, `elev-1`, `border-accent`.
- The title never sits on the image. Missing image → the dot-grid fallback with an icon.
- Consumer provides: the event (title, start, place/online, seats, status, cover with alt). Placeholder content shown here is illustrative.

Full spec: `docs/10-design-system/components.md` in the repo.
