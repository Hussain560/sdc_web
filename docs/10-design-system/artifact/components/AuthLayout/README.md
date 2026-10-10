# AuthLayout

Sign-in, forgot/reset password and profile claim: **no site header or footer**. The form column (max 440px) sits at the inline-start; a decorative brand panel (the mark and the dot grid on `band`, `radius-2xl`) at the inline-end. On phones the panel collapses to a 96px strip.

- There is no "create account": the secondary path is "Not a member yet? Apply for membership" → `/join` (ADR-013).
- Labelled fields, a password toggle, remember me + forgot password on one row, one full-width primary.

Full spec: `docs/10-design-system/components.md` in the repo.
