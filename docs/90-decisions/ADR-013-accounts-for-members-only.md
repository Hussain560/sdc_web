# ADR-013 — Accounts for Members Only; Everyone Else Is a Guest

| Field | Value |
| ----- | ----- |
| **Status** | Accepted (owner decision, 2026-10-03) |
| **Date** | 2026-10-03 |
| **Resolves** | Q-002 (membership application without an account). Updates [ADR-011](./ADR-011-membership-intake-separate-from-accounts.md) |
| **Related** | [ADR-012](./ADR-012-event-model-and-wizard-from-kfucs.md), [registrations](../11-modules/registrations/README.md), [attendance](../11-modules/attendance/README.md), [membership](../11-modules/membership/README.md) |

## Context

SDC's services are free. KFUCS lets anyone register for an event, check in and receive a certificate without an account, and keeps accounts for its own members. The first SDC implementation asked every visitor to sign up and sign in before registering, and used accounts for membership applications.

## Decision

1. **No self sign-up and no visitor login.** The public site offers *Join us* (the membership application), not *Login / Register*. `/register` redirects to `/join`; sign-up is disabled in the auth service. Login stays for members and staff (a quiet *Member login* link in the footer).
2. **Events are open to guests.** A visitor registers from a modal (name, e-mail, phone, optional university). Seat rules are the same as for members. E-mails go out in the language used. Guests check in on the QR page by typing the e-mail they registered with, and receive the certificate by e-mail: the certificate id is the key to the public verification page and the PDF.
3. **Membership without an account.** During an intake cycle anyone applies with a form (no password). When leadership **accepts**, the account is created, the application is linked to it, the `members` row is created, and an e-mail carries a one-time link to choose a password and activate the account. Rejected and waitlisted applicants never get an account.
4. **Anti-spam, not accounts, protects the open forms:** a hidden honeypot, a minimum fill time, per-e-mail and per-address throttles (addresses stored only as keyed hashes), one active registration or application per e-mail, buttons locked while sending and a short pause after a refusal. Stronger measures (CAPTCHA, e-mail verification of guests) are left to Sprint 12 hardening.

## Consequences

- Guests have no *My registrations* area: they cannot cancel by themselves (the organizer can) and cannot edit an application after sending it.
- The activation link is an auth recovery link (valid for the auth OTP lifetime, 24 h locally). An expired link is replaced through *Forgot password*.
- Every guest row is a registration without `user_id`; reports count them as non-members.
- Production auth settings must match the local `config.toml`: sign-ups off, e-mail provider on, OTP expiry raised for activation links.
