# Field

A labelled control with hint and error: label above, 48px filled input, hint, then the error.

- Fill `field`, border `border-strong` (3:1), focus = accent border + focus ring, error = `danger` 1.5px + message with an icon.
- Required/optional is written as text. Errors show on blur or submit, and say what to do.
- `aria-describedby` links hint and error; `aria-invalid` on error. E-mail, URL and phone inputs are `dir="ltr"`.

Full spec: `docs/10-design-system/components.md` in the repo.
