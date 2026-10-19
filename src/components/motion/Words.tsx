import type { CSSProperties } from 'react';

/**
 * A heading's words rising in one after another (M1 for the hero title). Server-rendered, no JavaScript: each word
 * carries `--i` and uses the `m-in` stagger from motion.css. The spaces stay plain text between the words, so the
 * heading reads, wraps and is announced exactly as before. Whole words only, so Arabic letters never separate.
 */
export function Words({ text }: { text: string }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((w, i) => (
        <span key={i}>
          <span
            className="m-in inline-block"
            style={{ '--i': i, '--m-y': '14px' } as CSSProperties}
          >
            {w}
          </span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </>
  );
}
