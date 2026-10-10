# Button

A capsule that triggers one action; one `primary` per view.

- Variants: `primary` (accent fill: Register, Apply, Sign in), `secondary` (outline: View all, Add to calendar), `brand` (deep green fill, rare), `ghost` (Cancel, Clear filters), `destructive` (Cancel registration), `link`.
- Sizes: `sm` 36px (44px hit area), `md` 44px, `lg` 52px (hero and dialog primaries). `full` on phones in forms and dialogs.
- Loading keeps the width, shows a spinner and a progress verb, and sets `aria-busy`. Disabled is 0.45 opacity; give a visible reason when it is not obvious.
- Directional arrows mirror in RTL (`ds-dir`).
- Consumer provides: the label (from the message catalogue), the variant, and `href` for navigation (use the i18n `Link`).

Full spec: `docs/10-design-system/components.md` in the repo.
