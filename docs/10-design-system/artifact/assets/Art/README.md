Hero art of the SDC mark, one file per theme, always decorative (`alt=""`).

- `hero-mark-dark.png`: transparent, for the dark hero (sits on `canvas` with a soft `signal` glow behind it).
- `hero-mark-light.png`: for the light hero. Opaque, with a baked mint ground (#F1F9F4): round its corners with `radius-xl` and place it on `canvas` or `band`.
- Swap with the `theme-dark-only` / `theme-light-only` classes so the server render is right.
