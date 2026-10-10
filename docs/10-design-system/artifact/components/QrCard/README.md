# QrCard

The session check-in code shown **at the venue** by the organizer (ADR-013: guests scan it and type the e-mail they registered with; the check-in page does the rest).

- The QR sits on `qr-ground` (white in both themes) with a 16px quiet zone, at least 280px on a projector view.
- Event title, the day, the instruction, the short URL as text for people who can't scan, and the rotation countdown.
- States: open (live code), rotating (cross-fade; reduced motion: swap), session closed (code hidden, message), loading.
- The QR shown here is a labelled placeholder; the short URL is illustrative.

Full spec: `docs/10-design-system/components.md` in the repo.
