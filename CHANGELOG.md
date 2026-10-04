# Changelog

All notable changes to the SDC platform. Versions follow `docs/07-engineering/versioning-and-releases.md`.
`v1.0.0` is tagged by the owner after the production cutover.

## [1.0.0] — unreleased (date it when the owner tags v1.0.0 after the cutover)

### Added
- Events like KFUCS: tabs for details, registrations, attendance (QR every 120 s, live numbers) and certificates.
- Guest registration from a modal with anti-spam (honeypot, minimum fill time, e-mail and IP throttles), public check-in by registered e-mail, guest certificate download from the e-mailed link.
- Membership applications without an account; acceptance creates the account and e-mails an activation link (ADR-013).
- Leaders, founders and admins add members directly (`members.create`).
- Privacy notice, consent records, personal data export, deletion requests and a weekly retention job.
- Enforced Content-Security-Policy and security headers, `/api/health`, CSP report endpoint.
- Accessibility checks (axe) for public and dashboard routes; performance and bundle budgets.
- Backup and keep-alive workflows, restore drill, cutover rehearsal script, pre-flight script, runbooks and administrator guide.

### Changed
- New public header (large logo, Login and Join us, Dashboard when signed in); self sign-up removed.
- Light-theme accent text darkened for WCAG AA contrast.

### Pending for the owner
- Production projects, domain, e-mail domain, hosted Auth settings, backup secrets, legal wording of the privacy notice (Q-031), and the contract migration that drops the legacy tables.
