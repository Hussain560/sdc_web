# Dialog

A modal on a scrim: title, close, body, actions. Shown here in the registration **sending** state.

- Native `<dialog>`: focus trap, Esc, inert background, focus returns to the trigger.
- While a request is in flight the form is locked, close and Esc are disabled with the reason stated, a progress bar runs along the top, and the button keeps its width with a spinner. The sending state lasts **at least 1.5s** for every outcome.
- Below 768px a form dialog becomes a bottom sheet.

Full spec: `docs/10-design-system/components.md` in the repo.
