# Glossary and Terminology

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Purpose

One meaning per term, in both languages, across UI copy, documentation, database names and code. When the current UI uses a different word, the **Current UI wording** column records it so it can be aligned.

## 2. Organization

| English | Arabic | Code identifier | Definition | Current UI wording |
| ------- | ------ | --------------- | ---------- | ------------------ |
| Saudi Developer Community (SDC) | المجتمع السعودي للمطورين | `sdc` | The community; the only organization the platform serves. | Same |
| Founder | مؤسِّس / مؤسِّسة | `founder` | A person who founded the community. Organizational position with oversight visibility. | مؤسِّستا المجتمع |
| Community leader | قائد المجتمع | `community_leader` | The person currently leading the community's execution. | قائد المجتمع |
| Advisor | المستشار / المستشارة | `advisor` | A strategic advisor (currently a former community leader). | المستشار |
| Leadership | القيادة | — | Collective term: founders, community leader, advisor. | — |
| Committee | لجنة | `committee` | A standing working group responsible for a domain (e.g., AI, Cybersecurity). Owns events and articles. See **OPEN Q-004**. | لجنة |
| Committee head | قائد / قائدة اللجنة | `committee_head` | Leads one committee. | قائدة لجنة … |
| Committee deputy head | نائب / نائبة قائد اللجنة | `committee_deputy` | Deputizes for a committee head. | نائبة قائدة لجنة … |
| Committee member | عضو لجنة | `committee_member` | A member assigned to a committee. | — |
| Community leads | قادة المجتمع | — | UI section showing committee heads/deputies and other heads (e.g., Head of Projects). | قادة المجتمع |
| Community section | قسم من أقسام المجتمع | — | Homepage marketing list (AI, Data Science, Marketing, Podcast & Content, Product Management, PR). Its relation to committees is unknown (**OPEN Q-004**). | أقسام المجتمع |
| Track | المسار | `track` | **CURRENT** free-text field on member records (e.g., "Web Development"). Target meaning pending **OPEN Q-004**. | المسار |
| Term | فترة / دورة قيادية | `term` | The period during which a person holds a position. Positions are time-bound (`starts_at`, `ends_at`). | — |
| Partner | شريك | `partner` | An external organization that co-hosts or supports SDC. | قسم الشركاء |

## 3. People and access

| English | Arabic | Code identifier | Definition |
| ------- | ------ | --------------- | ---------- |
| Visitor | زائر | `anon` (DB role) | Anyone not signed in. |
| Account / user | حساب / مستخدم | `user`, `auth.users`, `profiles` | A sign-in identity (email + password). Having an account does **not** make someone a member. |
| Participant | مشارك | — | A user who registers for an event. |
| Applicant | متقدّم | `applicant` | A user who submitted a membership application in an intake cycle. |
| Member | عضو | `member` | A person accepted through a membership intake cycle and holding an active member record. |
| Member profile | الملف التعريفي للعضو | `member_profile` | The member's directory information (university, major, bio, links). |
| Role | دور | `role` | A named bundle of permissions (e.g., `committee_head`). |
| Permission | صلاحية | `permission` | An action key such as `events.approve`. |
| Scope | نطاق | `scope` | Where a role applies: **global** or a specific **committee**. |
| Role assignment | إسناد دور | `role_assignment` | User + role + optional committee + time window. Single source of truth for positions. |
| System administrator | مدير النظام | `system_admin` | Technical administrator with full platform access. Not an organizational position. |

## 4. Membership intake

| English | Arabic | Code identifier | Definition |
| ------- | ------ | --------------- | ---------- |
| Membership intake cycle | دورة استقبال طلبات العضوية | `membership_cycle` | A time window (opens/closes, ≈ once per year) during which applications are accepted. |
| Membership application | طلب عضوية | `membership_application` | One user's application within one cycle. |
| Join page | صفحة الانضمام | `/join` | Dedicated page that shows the application form only while a cycle is open. Distinct from `/register` (account creation). |
| Application statuses | حالات الطلب | `submitted`, `under_review`, `accepted`, `rejected`, `waitlisted`, `withdrawn` | See [membership lifecycle](../03-business-domain/membership-lifecycle.md). |

## 5. Events and registration

| English | Arabic | Code identifier | Definition | Current UI wording |
| ------- | ------ | --------------- | ---------- | ------------------ |
| Event | فعالية | `event` | A scheduled activity organized by a committee. | فعالية |
| Event type | نوع الفعالية | `event_type` | `meetup` (لقاء تقني), `workshop` (ورشة), `camp` (معسكر), `hackathon` (هاكاثون), `talk` (محاضرة) — **OPEN Q-040**. | — |
| Event format | نمط الفعالية | `format` | `online`, `in_person`, `hybrid`. | أونلاين |
| Event registration | تسجيل في فعالية | `event_registration` | A user's request to attend an event. | تسجيل |
| Registration window | فترة التسجيل | `registration_opens_at` / `registration_closes_at` | When registration is accepted. | متاح التسجيل |
| Accepted | مقبول | `accepted` | Registration approved; participant notified. | مقبول |
| Rejected | مرفوض | `rejected` | Registration declined; participant notified. | مرفوض |
| Pending | قيد المراجعة | `pending` | Awaiting a decision. | قيد الانتظار |
| Waitlisted | قائمة الانتظار | `waitlisted` | Eligible but no seat yet (**OPEN Q-029**). | — |
| Attendance session | جلسة الحضور | `attendance_sessions` | One per scheduled event day; opened, closed and finalized by organizers. | — |
| Check-in | تسجيل الحضور | `attendance_records.method` | `qr` · `online` · `manual`; one per person per session. | — |
| Attendance result | نتيجة الحضور | `attendance_result`, `attendance_percent` | `attended` / `absent` and the frozen percentage, written by attendance finalization. | — |
| Certificate | الشهادة | `certificates` | Issued to eligible attendees (threshold — Q-020). | شهادة حضور |
| Coming soon | قريبًا | derived | Display state: published, date not announced or registration not yet open. | قريبًا |
| Ended | منتهي | derived | Display state: event end time has passed. | منتهي |

## 6. Content

| English | Arabic | Code identifier | Definition | Current UI wording |
| ------- | ------ | --------------- | ---------- | ------------------ |
| Article / thread | مقال / ثريد | `article` | A technical write-up published by the community. "Thread" (ثريد) is the current public label; one entity covers both. | ثريد، مقال (both used) |
| Author | الكاتب | `article_author` | A person or a committee credited on an article. | بقلم |
| Tag | وسم | `tag` | Topic label on an article. | — |
| Reading time | مدة القراءة | `reading_minutes` | Estimated minutes to read. | 3 دقائق |

## 7. Code naming rules

| Rule | Example |
| ---- | ------- |
| Database: `snake_case`, plural table names, singular column names | `event_registrations.event_id` |
| Bilingual columns use `_ar` / `_en` suffixes, Arabic required | `title_ar NOT NULL`, `title_en` |
| Status values: lowercase `snake_case` text with `CHECK` constraints | `'pending_review'` |
| Permission keys: `<resource>.<action>` dotted, lowercase | `registrations.review` |
| TypeScript: `camelCase` variables, `PascalCase` components/types | `EventCard`, `registrationStatus` |
| Routes: lowercase, hyphenated, plural collections | `/events/[slug]`, `/dashboard/membership-cycles` |
| Never use commercial terms: *tenant, customer, plan, subscription, invoice, SKU* | — |

The UI must not mix "articles" and "threads" on the same screen (it currently does: the list page says *Threads*, the detail breadcrumb says *Articles*). The chosen public label is pending **OPEN Q-033**.
