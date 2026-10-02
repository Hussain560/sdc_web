# 06 — Security

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## Documents

| Document | Contents |
| -------- | -------- |
| [security-model.md](./security-model.md) | Assets, trust boundaries, threats, controls by area (validation, XSS, CSRF, uploads, secrets, email, headers, rate limits, errors, dependencies), incident response, **containment of current critical findings** |
| [authentication.md](./authentication.md) | Accounts, sessions (SSR cookies), flows, Auth configuration, admin MFA |
| [authorization-model.md](./authorization-model.md) | RBAC + committee scope + ownership; enforcement layers; design decisions |
| [permission-catalog.md](./permission-catalog.md) | Permission keys and the role × permission matrix |
| [data-protection-and-privacy.md](./data-protection-and-privacy.md) | Personal-data inventory and classification, visibility, consent, retention, PDPL considerations |

Database-level enforcement details: [RLS model](../05-database/rls-security-model.md). Architecture decision: [ADR-004](../90-decisions/ADR-004-authorization-model.md).

## Non-negotiables

1. UI hiding is not authorization.
2. No table without reviewed RLS.
3. No secret in the repository or in `NEXT_PUBLIC_*`.
4. No email sent to an address supplied by an unauthenticated client.
5. No personal data in logs, URLs or analytics.
