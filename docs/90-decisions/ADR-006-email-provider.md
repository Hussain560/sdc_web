# ADR-006 — Transactional Email Provider

| Field | Value |
| ----- | ----- |
| **Status** | Proposed — pending **OPEN Q-010** (provider) and **Q-017** (domain) |
| **Date** | 2026-10-02 |
| **Related** | [Email architecture](../04-architecture/email-architecture.md), TD-003, TD-057, R-002 |

## Context
Emails are sent through a Gmail account with an app password from unauthenticated Edge Functions. Supabase's built-in Auth mailer is not intended for production volumes. SDC needs: Auth emails (via SMTP), application emails (API or SMTP), bilingual templates, a free tier that tolerates bursts (e.g., a membership cycle's decisions, an event cancellation), domain authentication (SPF/DKIM/DMARC), and webhooks for delivery status.

## Decision (proposed)
Use a dedicated transactional provider behind the `lib/email/provider.ts` interface, with a verified SDC sending domain, for **both** Supabase Auth (custom SMTP) and application email. Recommended candidates, to be confirmed against current free-tier terms:

| Candidate | Fit |
| --------- | --- |
| **Brevo** (recommended default) | Free tier with a daily cap suitable for bursts of a few hundred; SMTP + API; used successfully in the KFUCS reference |
| Resend | Excellent developer experience and React Email; lower daily cap on the free tier — chunk bulk sends across days |
| Amazon SES | Very low cost, but requires AWS account and sandbox exit; more operations |

Gmail SMTP is **retired** (deliverability, sending limits, account-suspension risk, personal-account dependency).

## Consequences
- Requires a domain and DNS access (Q-017).
- Provider-agnostic interface keeps switching cheap.
- Daily quota is a hard limit → bulk sends must be chunked and resumable (BR-NOT / NT-8).
