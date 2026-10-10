# ResultDialog

The outcome of a flow, after the KFUCS registration feedback: one icon, one title that says what happened, one sentence, one next action.

- Results: registered, pending review, waiting list, already registered, event full, registration closed, too many attempts, members-only, try again. Refusals show their own result, never a generic error; honeypot and fill-time refusals look like "too many attempts".
- Focus moves to the title; success is announced via `role="status"`, refusals via `role="alert"`.
- Same dialog as the form (content swaps), so nothing flashes closed and open.

Full spec: `docs/10-design-system/components.md` in the repo.
