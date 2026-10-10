# DateChip

A scannable date: a `block` tile (day over month) or an `inline` meta row with the time range.

- Always a `<time datetime>`; Western digits; Gregorian; Riyadh time, labelled only when the viewer's zone differs.
- Consumer provides: the ISO start (and end) — formatting comes from the shared formatter.

Full spec: `docs/10-design-system/components.md` in the repo.
