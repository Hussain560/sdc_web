# CertificateCard

The public verification result and the certificate list item: logo, kind, name, event, date(s), attendance (sessions attended of expected and the percentage), the certificate id (uuid), status and actions.

- Facts come from the frozen certificate snapshot (`recipient_name`, `sessions_attended`, `sessions_expected`, `attendance_percent`, `issued_at`). The e-mail is never shown.
- States: valid (success), not found (danger, with a verify-again field), loading. A revoked state exists only if revocation is added to the data.
- Print: white ground, black text, no chrome or buttons; the id and the verification URL print under the card.
- Name, event and id here are placeholders.

Full spec: `docs/10-design-system/components.md` in the repo.
