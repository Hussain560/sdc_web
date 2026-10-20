# About page: image prompts for "ماذا نقدّم"

Six pictures, one per row of the About page's "what we offer" section. Today each row shows a placeholder panel (the
community X pattern with the section's icon); when the images exist they replace the panel in
`src/modules/about/AboutView.tsx` (`ab-offer`). Order matches the page, top to bottom.

## Delivery spec

- 5:4 landscape, 1600 × 1280 px. Phones show it at 4:3, so keep the subject centred with a safe margin of about 12 %.
- Two versions of each: `-dark` (page background `#050d09`) and `-light` (page background `#f4faf6`). 12 files.
- File names: `offer-1-workshops-dark.webp`, `offer-1-workshops-light.webp`, and so on; each under 200 KB (WebP).
- No text, letters, numbers or logos inside the image (generators garble Arabic). No real faces: people are simple
  faceless figures. Keep the style the same across all six so they read as one set.

## Shared style block (paste at the start of every prompt)

> Flat vector illustration with soft isometric depth, clean geometric shapes, rounded corners, subtle grain, calm and
> modern. Palette only: deep green #067847, bright signal green #00e676, dark forest #143426, near-black green
> #050d09, mint #e5f5ea, white. A faint repeating pattern of small "X" marks (the Saudi Developer Community mark)
> in the background at low opacity. Centred composition, generous empty margin, 5:4 landscape, no text, no letters,
> no logos, faceless simple human figures, no photo realism, no gradients heavier than a soft glow.

For the dark version add: `Background solid #143426 with a soft green glow, light elements in mint and white.`
For the light version add: `Background solid #e5f5ea, elements in deep green #067847 and #0a7a49 with white highlights.`

## The six prompts

1. **Workshops (ورش العمل)**: A small group of faceless figures around a shared table with open laptops, one figure
   at a whiteboard sketching a simple diagram with arrows and boxes, a wrench-and-code-bracket icon floating above.
   Mood: hands-on, collaborative.
2. **Camps (المعسكرات)**: A cosy desert-night tech camp: a tent with a glowing laptop inside, a campfire, a few
   faceless figures coding on logs, a crescent of stars and subtle dunes behind, a shield icon for cyber security
   floating nearby. Mood: focused, immersive.
3. **Hackathons (الهاكاثونات)**: Teams of faceless figures racing against a big digital clock, laptops, sticky notes and
   a trophy glowing at the finish, a lightning bolt and circuit lines in the background. Mood: energy, deadline.
4. **Meetups and talks (اللقاءات والمحاضرات)**: A faceless speaker on a small stage with a microphone and a large
   slide behind them showing abstract charts, an audience of simple seated silhouettes, a speech bubble and a
   video-call window floating to show remote attendance. Mood: open conversation.
5. **Technical content (المحتوى التقني)**: A big open book whose pages turn into code brackets, floating article
   cards, a pen and a small Arabic-keyboard key cap shape (no letters), a lightbulb above. Mood: writing and
   sharing knowledge.
6. **Attendance certificates (شهادات الحضور)**: A certificate sheet with a ribbon seal and a checkmark, an envelope
   with a small paper plane flying out, a QR-like square of dots in the corner (abstract pattern, not scannable).
   Mood: trusted, verifiable.

## Tips for the image agent

- Generate the dark set first, then ask for "the same scene recoloured for a light background" so shapes match.
- Reject any result with readable letters or a recognisable face; regenerate with "no text, no faces".
- Keep every set at the same scale of figures and the same line weight.
