# Release vX.Y.Z — <Name>

| Field | Value |
| ----- | ----- |
| **Version** | vX.Y.Z |
| **Milestone** | M# — <name> |
| **Release owner** | <name> |
| **Planned date** | YYYY-MM-DD |
| **Released** | YYYY-MM-DD HH:mm (Asia/Riyadh) |
| **Status** | Planned / In QA / Released / Rolled back |

## 1. Scope
Summary of user-visible changes (link to GitHub Release / CHANGELOG section).

## 2. Database changes
| Migration | Type (expand/migrate/contract) | Data impact | Reviewed by |
| --------- | ------------------------------ | ----------- | ----------- |

## 3. Configuration changes
Env vars, Auth settings, email templates, buckets, crons — per environment.

## 4. Checklist
- [ ] All milestone stories meet the DoD
- [ ] Migrations tested on staging
- [ ] Production backup taken — restore point: <id/location>
- [ ] Environment variables set in production
- [ ] E2E smoke on staging passed
- [ ] Manual QA checklist passed
- [ ] Release notes (ar/en) ready
- [ ] Rollback plan written (below)

## 5. Rollback plan
Previous version: vA.B.C. Steps: …

## 6. Post-release
- [ ] Production smoke test passed
- [ ] Monitoring checked after 24 h
- [ ] `main` synced into `develop`

## 7. Release notes (community-facing)
**العربية:** …

**English:** …

## 8. Sign-off
| Role | Name | Date |
| ---- | ---- | ---- |
| Product owner | | |
| Tech lead | | |
