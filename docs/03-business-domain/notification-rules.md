# Notification Rules

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Channel

**Email only** for the foreseeable future. In-app notifications are not in scope (**Proposed**). Social-media announcements remain manual.

## 2. Current emails (CURRENT)

| Trigger | Function | Language | Notes |
| ------- | -------- | -------- | ----- |
| Account sign-up confirmation | Supabase Auth default template | English default | Not customized |
| Password reset | Supabase Auth default template | English default | Not customized |
| Event registration received | `send-registration-email` | Arabic only | Triggered from the browser |
| Registration accepted / rejected | `send-status-email` | Arabic only | Triggered from the browser; rejection asserts "limited seats" |

## 3. Target notification catalogue (Proposed)

| Key | Trigger | Recipient | Content |
| --- | ------- | --------- | ------- |
| `auth.confirm_signup` | Account created | New user | Confirm email (Supabase Auth template, customized, bilingual) |
| `auth.reset_password` | Reset requested | User (if account exists — response identical either way) | Reset link |
| `auth.email_change` | Email change requested | Old and new address | Confirm change |
| `membership.application_received` | Application submitted | Applicant | Confirmation + what happens next |
| `membership.application_accepted` | Accepted | Applicant | Welcome, next steps (profile, committees) |
| `membership.application_rejected` | Rejected | Applicant | Kind, neutral message; future cycles |
| `membership.application_waitlisted` | Waitlisted | Applicant | Status explanation |
| `registration.received` | Registration created (approval mode) | Participant | Received, under review |
| `registration.confirmed` | Registration created in auto mode, or accepted | Participant | Accepted + event details + meeting link (online) |
| `registration.rejected` | Rejected | Participant | Neutral message (**OPEN Q-028**) |
| `registration.waitlisted` | Waitlisted | Participant | Status explanation |
| `registration.cancelled_by_organizer` | Organizer cancels a registration | Participant | Notice |
| `event.cancelled` | Event cancelled | All pending/accepted/waitlisted registrants | Cancellation + reason |
| `event.changed` | Date/time/format/location of a published event changed | Accepted registrants | What changed |
| `event.reminder` | 24 h before `starts_at` | Accepted registrants | Reminder + link — **optional, Phase 4** |
| `committee.assigned` | Added to a committee | Member | Welcome to committee — **optional** |
| `review.pending` | Event/article submitted for review | Approvers | Digest — **optional, Phase 4** |

## 4. Rules

| # | Rule | Status |
| - | ---- | ------ |
| NT-1 | Emails are sent **by the server** as a consequence of a committed state change — never directly by the browser, and never to an address supplied by the client request. | Proposed |
| NT-2 | Every send attempt is logged (recipient, template, related entity, provider message id, status, error, attempt number). | Proposed (KFUCS BR-5.1) |
| NT-3 | A failed email never rolls back the business decision; it can be retried by an operator. | Proposed (KFUCS BR-1.6) |
| NT-4 | No automatic infinite retries; at most 3 automatic attempts with backoff, then manual retry. | Proposed |
| NT-5 | The same notification for the same entity and state is sent at most once unless explicitly resent (idempotency key = template + entity id + state). | Proposed |
| NT-6 | Language = recipient's preferred locale (profile), default Arabic; templates exist in both languages. | Proposed |
| NT-7 | All user-provided values are HTML-escaped in templates. | Proposed |
| NT-8 | Bulk sends (event cancelled, reminders) respect the provider's daily quota and stop cleanly when exhausted (**KFUCS BR-5.6**). | Proposed |
| NT-9 | Emails contain no internal notes and no personal data of other people. | Proposed |
