import { ViewTransition, type ComponentProps } from 'react';

/**
 * The `<main>` of a public page, wrapped in a view transition: on navigation the old page fades out and the new one
 * rises in (CSS in motion.css, class `m-page`). The header and footer keep their own names so they stay still.
 * Browsers without the View Transitions API simply navigate as before.
 */
export function PageMain(props: ComponentProps<'main'>) {
  return (
    <ViewTransition default="m-page">
      <main id="main" {...props} />
    </ViewTransition>
  );
}
