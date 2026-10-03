# Current Architecture (As-Is)

| Field            | Value      |
| ---------------- | ---------- |
| **Snapshot**     | 2026-10-02 |
| **Status**       | Draft      |

## 1. Overview

```mermaid
flowchart LR
    subgraph Browser["Browser (all logic runs here)"]
        P["Client Component pages<br/>(every page 'use client')"]
        HC["Hardcoded data<br/>events, articles, leadership,<br/>COMMITTEE_EMAILS"]
        AC["AuthContext<br/>supabase-js session in localStorage"]
        P --> HC
        P --> AC
    end

    subgraph Vercel["Next.js 14 server (deployment target unknown)"]
        SS["Static HTML shells<br/>no data, no auth"]
    end

    subgraph Supabase["Supabase"]
        K["Kong API gateway"]
        A["GoTrue Auth"]
        R["PostgREST"]
        DB[("PostgreSQL<br/>members, event_registrations<br/>RLS: USING (true)")]
        EF["Edge Functions<br/>verify_jwt = false"]
    end

    G["Gmail SMTP<br/>(app password)"]

    Browser -->|"GET page"| SS
    P -->|"anon key + user JWT<br/>select / insert / update"| K
    K --> A
    K --> R --> DB
    P -->|"invoke (no auth required)"| K --> EF
    EF -->|"send HTML email<br/>to any address"| G
    EF -->|"service role:<br/>list all users"| A
```

## 2. Characteristics

| Aspect | As-is |
| ------ | ----- |
| Rendering | Server sends a static shell; every page is a Client Component that renders hardcoded data or fetches from Supabase in `useEffect`. |
| Trust boundary | The **browser** decides what the user may see and do. The database accepts whatever the browser sends (open RLS). |
| Data access | Direct PostgREST calls from components; no data-access layer, no types. |
| Business logic | Inline in components (duplicated registration flow ×3). |
| Side effects | Emails sent by the browser calling unauthenticated Edge Functions after a write. |
| Auth | Browser-only session; server cannot identify users. |
| Configuration | Two public env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`); Edge Function secrets `GMAIL_USER`, `GMAIL_APP_PASSWORD`. |
| Environments | Local Docker stack; one linked remote project (`sdc-members`); hosting unknown. |

## 3. Why it cannot be incrementally patched into the target

- The trust boundary is in the wrong place: authorization must move to RLS and the server, which changes every data access path.
- Hardcoded entities must become tables, which changes every page that displays them.
- Client-only rendering prevents SEO and server-side protection; the page shells must become Server Components.

The target therefore **keeps the visual layer** and **replaces the data, auth and logic layers** page by page (see [roadmap](../99-project-management/roadmap.md)).
