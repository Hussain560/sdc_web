# NavBar

The public header. Desktop: a floating inset bar (`radius-xl`, 85% surface + blur) with the logo, nav in a pill, search, language, theme and one primary "Join us". Phones: a 56px full-width bar with logo, search and menu; the menu opens a bottom sheet.

- Active item: `aria-current="page"`. Signed-in members see an avatar menu instead of the CTA.
- A skip link comes first. The bar hides on scroll down and returns on scroll up (not with reduced motion).

Full spec: `docs/10-design-system/components.md` in the repo.
