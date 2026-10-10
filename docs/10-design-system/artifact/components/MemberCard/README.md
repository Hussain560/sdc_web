# MemberCard

A listed member in the directory: avatar, name, track, role and a round arrow to the profile.

- Only members with `listed = true` exist in the directory query; photo, university and track render only when their consent flags are on. No contact details ever.
- Avatar falls back to initials on `accent-soft` (never a blurred photo).
- Consumer provides: the public member projection (name, avatar if public, track, role/committee).
- Names shown here are placeholders.

Full spec: `docs/10-design-system/components.md` in the repo.
