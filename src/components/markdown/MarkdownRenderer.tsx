import ReactMarkdown from 'react-markdown';
import './markdown.css';

/**
 * The one Markdown renderer (AR-3): used by the editor preview and the public thread pages, so authors see
 * exactly what will publish. Raw HTML is dropped, images are not rendered, `javascript:` and other unsafe URL
 * schemes are stripped by react-markdown's default URL transform, and links open safely.
 */
export function MarkdownRenderer({ source, className }: { source: string; className?: string }) {
  return (
    <div className={`sdc-md ${className ?? ''}`.trim()}>
      <ReactMarkdown
        skipHtml
        disallowedElements={['img', 'iframe', 'script', 'style']}
        unwrapDisallowed
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow">
              {children}
            </a>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
