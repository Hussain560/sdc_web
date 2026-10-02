# Module — Authentication & Account

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |
| **Phase**        | 2 |

## 1. Purpose
Let anyone create an account, prove email ownership, sign in securely on the server, recover access, and manage their own account — without implying membership.

## 2. Current state
Browser-only sessions; client-only validation; enumeration via `check-email-exists`; `?redirect` ignored; no profile table ([audit §5](../../01-project/current-system-audit.md#5-authentication)).

## 3. Actors and permissions
Visitor (sign up, sign in, reset); signed-in user (own account — ownership rule). Admin actions on accounts: `users.view` (Administration module).

## 4. Requirements
FR-AUTH-001…010, NFR-SEC-003/006/009, NFR-PRIV-003.

## 5. Rules
Account ≠ membership (BR-MBR-001). Design: [authentication](../../06-security/authentication.md).

## 6. Data
`auth.users` (Supabase), `profiles` ([identity entities](../../05-database/entities/identity-and-access.md)).

## 7. Routes and screens
| Route | Purpose | Key states |
| ----- | ------- | ---------- |
| `/register` | Create account; banner "This does not make you a member — see Join" | Success: check email |
| `/login` | Sign in; `next` param | Unconfirmed email → resend link |
| `/forgot-password` | Request reset | Always same success message |
| `/auth/callback` | Code exchange for email links | Invalid/expired link page |
| `/reset-password` | Set new password | Not in recovery session → link to request again |
| `/account` | Name, language, password, email change, delete request | — |

## 8. Server operations
| Operation | Authorization | Side effects |
| --------- | ------------- | ------------ |
| `signUp`, `signIn`, `signOut`, `requestPasswordReset`, `updatePassword`, `updateProfile`, `changeEmail`, `requestAccountDeletion` | Public / own session | Auth emails via provider SMTP; audit for deletion |

## 10. Edge cases
1. Sign-up with an existing confirmed email → same "check your email" response (no enumeration).
2. `next` = external URL → ignored, redirect home.
3. User deleted while signed in → session invalid on next request, redirected to login.

## 11. Testing
E2E J2, J8, J9; unit tests for name/password schemas and `next` sanitizer; pgTAP for `profiles` RLS and the sign-up trigger.

## 12. Open questions
Q-031 (deletion/retention).
