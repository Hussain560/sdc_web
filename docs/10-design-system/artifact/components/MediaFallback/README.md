# MediaFallback

The image box with a fixed aspect ratio; when the image is missing or fails, a dot-grid surface with a content-type icon.

- Aspect ratios: 16:9 covers, 1:1 avatars, 3:4 posters. The box never changes size, so layout never shifts.
- Content images require a localized `alt`; decorative ones use `alt=""`.

Full spec: `docs/10-design-system/components.md` in the repo.
