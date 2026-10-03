# Target Audience and Stakeholders

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Audience

**CURRENT** — event pages list the target audience as "students, graduates, employees" (طلاب، خريجون، موظفون). Member records carry university, major and an academic status of *Student*, *Graduate* or *Employee*.

| Segment | Description | Primary needs |
| ------- | ----------- | ------------- |
| **University students** | Computing and related majors at Saudi universities | Practical skills, events, a community, a portfolio, joining a committee |
| **Graduates** | Recent graduates entering the job market | Workshops, networking, visibility of their profile |
| **Professionals** | Employed developers and technologists | Knowledge sharing, speaking, mentoring, contributing |
| **Technology enthusiasts** | Anyone interested in technology | Free public events and Arabic technical content |

**ASSUMPTION A-001** — the audience is primarily Arabic-speaking and in Saudi Arabia; Arabic is the default language and English is secondary.

## 2. Platform actors

Actors are the people who interact with the platform. Their permissions are defined in [authorization model](../06-security/authorization-model.md); their organizational meaning in [organizational structure](../03-business-domain/organizational-structure.md).

| Actor | Arabic | Has account? | Is a member? |
| ----- | ------ | ------------ | ------------ |
| Visitor | زائر | No | No |
| Registered user (participant) | مستخدم مسجّل / مشارك | Yes | No |
| Membership applicant | متقدّم للعضوية | Yes (**OPEN Q-002**) | Not yet |
| Member | عضو | Yes | Yes |
| Committee member | عضو لجنة | Yes | Yes |
| Committee deputy head | نائب قائد اللجنة | Yes | Yes |
| Committee head | قائد اللجنة | Yes | Yes |
| Community leader | قائد المجتمع | Yes | Yes |
| Advisor | المستشار | Yes | Yes |
| Founder | مؤسِّس / مؤسِّسة | Yes | Yes |
| System administrator | مدير النظام | Yes | Not necessarily |

## 3. Stakeholders

| Stakeholder | Interest | Involvement |
| ----------- | -------- | ----------- |
| Founders | Long-term direction and health of the community | Approve product direction; consume community reports |
| Community leader | Day-to-day operation; event approval; membership intake | Product owner for most decisions (**ASSUMPTION A-002**) |
| Advisor | Strategic continuity | Consulted on direction |
| Committee heads and deputies | Running their committee's events and content | Primary internal users; acceptance testers for their module |
| Technology & Development committee | Builds and maintains the platform | Development team |
| Design & Identity committee | Brand and visual identity | Owns brand assets and design-system decisions |
| Members | Profile, participation, fair treatment of data | End users |
| Participants and visitors | Event access, content | End users |
| Partner organizations | Co-hosting events, visibility | Indirect (partners section, co-hosted events) |

**OPEN Q-001** — who is the formal product owner who approves this documentation and answers the open questions?
