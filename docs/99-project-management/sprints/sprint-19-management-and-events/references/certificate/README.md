# Certificate artwork from the team (reference)

Received 2026-10-24 from a teammate. Kept here so Claude Design and the developers see the starting point. These files are
**references, not code**: the `.tsx` sources are saved as `.tsx.txt` so the type check and the linter skip them.

| File | What it is |
| ---- | ---------- |
| `certificate-blank.png` | The "classic" attendance certificate (design 07) without a name: A4 landscape, a teal double frame with the identity mark in the corners, the vertical colour logo, "شهادة حضور / CERTIFICATE OF ATTENDANCE", the statement line, the round SDC emblem and the leader's signature |
| `CertificateDocument.tsx.txt` | The full certificate in `@react-pdf/renderer`: the name sized to fit, the event title, date and attendance percentage in Arabic and English, the verification QR and id |
| `CertificateBlank.tsx.txt` | The same layout without the person-specific parts (the source of the PNG above) |

Not copied: `certificate-images.ts` (360 KB of base64 images: the logo, the emblem and **the leader's signature**). The
signature is given for certificates only and must not spread; it stays with the template assets in the code
(`src/modules/attendance/pdf/`), not in the docs (Q-E8). **Note:** `certificate-blank.png` itself shows the signature.
Keep it only while both repositories are private, or replace it with a copy where the signature is blanked out.

## Colours and type used by the artwork

Teal `#2D7566`, green `#58BF88`, ink `#2D2D2D`, muted `#5E6B66`, line `#CFDDD7`; IBM Plex Sans Arabic and Inter. These are
the written SDC identity colours (a printed file cannot use the site's CSS tokens).

## What changes in Sprint 19

- The QR and the verification link are removed (the certificate becomes a PNG attached to the e-mail, nothing stored).
- The design gets the SDC identity as a background (pattern, texture or brand shapes) and a small set of templates —
  see the design brief.
