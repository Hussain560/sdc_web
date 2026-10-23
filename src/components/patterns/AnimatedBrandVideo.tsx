'use client';

/**
 * The animated SDC mark (transparent WebM, played once at half speed). It is decoration only: muted, no controls, and
 * paused on its first frame for people who ask the system for reduced motion.
 */
export function AnimatedBrandVideo({
  className,
  fill = false,
}: {
  className: string;
  /**
   * Fill the parent box (which sets the size). Inline styles on purpose: the global `video { height: auto }` reset is
   * unlayered and would beat any Tailwind height class.
   */
  fill?: boolean;
}) {
  return (
    <video
      src="/sdc-glow-transparent-animated.webm"
      autoPlay
      muted
      playsInline
      aria-hidden="true"
      tabIndex={-1}
      ref={(video) => {
        if (!video) return;
        video.playbackRate = 0.5;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) video.pause();
      }}
      className={className}
      style={fill ? { width: '100%', height: '100%', objectFit: 'contain' } : undefined}
    />
  );
}
