# 30 — Media List

Everything the design needs that is an image, illustration, photo or video. **The owner supplies the media**; the design never invents photographs, logos or testimonials. "Exists" means the file is already in the repository. Sizes are the largest render size at 1x; export at 2x. Formats: WebP for photos, PNG/SVG for logos and art, with the exact text alternative listed.

## 1. Brand files

| Id | Item | Page / section | Size and crop | Mood / notes | Status | Priority |
| -- | ---- | -------------- | ------------- | ------------ | ------ | -------- |
| M-41 | SDC mark | Favicon, auth phone strip, avatar for SDC posts | Square-safe, transparent | — | Exists (raster inside `sdc-logo-mark.svg`); **SVG master needed** (Q-041) | Launch |
| M-42 | Horizontal wordmark for dark | Header, footer, certificate | 160 × 68, transparent | — | Exists (`Full whiteLogo 1.png`) | Launch |
| M-43 | Horizontal wordmark for light | Header, certificate | 160 × 68, **transparent** | — | Exists but has a baked mint background and wide padding (`navbar.png`): **transparent export needed** | Launch |
| M-44 | Vertical lockup, dark and light | Footer | 224 × 99 | — | Dark exists (`Logos.png`); **light variant needed** | Launch |
| M-45 | Favicon set and app icons | Browser, home screen | 16, 32, 180, 192, 512 | From the mark | Partial (`favicon.ico`) | Launch |
| M-46 | Social share image (Open Graph) | Default share card for all pages | 1200 × 630 | Mark + wordmark on deep green, no text beyond the name | Needed | Launch |

## 2. Art and photography

| Id | Item | Page / section | Size and crop | Mood | Status | Priority |
| -- | ---- | -------------- | ------------- | ---- | ------ | -------- |
| M-01 | Hero art, dark | Home hero | 560 × 390, transparent | The 3D mark | Exists (`hero-logo.png`) | Launch |
| M-02 | Hero art, light | Home hero | 560 × 390 | The 3D mark | Exists (`light-mode.png`), opaque mint ground (round it with `--radius-xl`) | Launch |
| M-03 | Hero photo (alternative to the art) | Home hero | 1440 × 720, crop safe-area in the inline-end half | A real SDC event: people working together, natural light, no posed handshakes; faces only with consent | Needed | Later |
| M-40 | Auth brand-panel photo | Auth layout | 640 × 900 (portrait), 45% column | A real SDC space or event, calm, toned to the brand green in the edit (not by CSS) | Needed | Later (the motif panel ships) |
| M-50 | About photo | About header, join (optional) | 1280 × 720 | A real gathering, wide shot, people from behind or with consent | Needed | Launch-nice |
| M-70 | Event highlight photos | Highlights page (A-8), past event pages | 1600 × 1067 (3:2) | Real, consented, diverse, both men's and women's sections where applicable | Needed | Later |

## 3. Per-content images (uploaded through the dashboard)

| Id | Item | Where | Size and crop | Rules | Priority |
| -- | ---- | ----- | ------------- | ----- | -------- |
| M-12 | Event cover | Event card, event page panel, related events, OG image | 1280 × 720 (16:9); key content in the central 80% | **Required to publish** (proposal); localized `alt` required; no text baked into the image beyond the event poster title | Launch |
| M-14 | Default event cover | Events without a cover | 1280 × 720 | A brand pattern (dot grid + capsule pair) generated in CSS/SVG, so **no file is needed** | Launch |
| M-11 | Article cover | Article card, featured article, reading page | 1280 × 720 | Optional; `alt` required | Launch |
| M-13 | Presenter photo | Event page speakers | 400 × 400 (1:1), face centred | Optional, with the presenter's consent; initials otherwise | Launch |
| M-20 | Member photo | Directory, profile | 400 × 400 (1:1) | **Opt-in only** (Q-M2); initials otherwise | Later |
| M-21 | Leadership photo | Members leadership, about | 400 × 400 (1:1) | Consent per person; initials otherwise | Launch-nice |
| M-30 | Partner logo | Home partner strip, partners page | Max height 80, transparent PNG or SVG | From `partners.logo_url`; the partner's approved file only | Launch (when partners exist) |
| M-61 | Committee banner | Committee page | 1280 × 360 | Optional | Later |

## 4. Video

| Id | Item | Where | Notes | Priority |
| -- | ---- | ----- | ----- | -------- |
| M-80 | Short community film (≤ 60 s) | About or home, below the hero | Optional. It must have captions in Arabic and English, no autoplay with sound, a poster frame, and a pause control. | Later |

## 5. Not needed (by design)

- The legacy PNG icons (`alert-02.png`, `cancel-02.png`, …): replaced by lucide icons.
- The 404 icon images: replaced by the CSS/SVG motif.
- `user1–6.png` placeholder avatars: replaced by initials.
- Placeholder partner logos ("شعار المنصة"): never shipped.
