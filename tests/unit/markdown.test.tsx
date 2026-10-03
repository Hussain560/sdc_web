import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { readingMinutesOf, wordCount } from '@/modules/articles/types';

const html = (source: string) => renderToStaticMarkup(<MarkdownRenderer source={source} />);

// ART-001 acceptance: script injection in Markdown is neutralised, and the preview uses the same renderer.
describe('MarkdownRenderer — sanitisation (AR-3)', () => {
  const payloads: Array<[string, string]> = [
    ['raw script tag', 'before <script>alert(1)</script> after'],
    ['img onerror', '<img src=x onerror="alert(1)">'],
    ['iframe', '<iframe src="https://evil.example"></iframe>'],
    ['inline event handler', '<a href="https://ok.example" onclick="alert(1)">x</a>'],
    ['javascript: link', '[click](javascript:alert(1))'],
    ['data: link', '[click](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)'],
    ['vbscript: link', '[click](vbscript:msgbox(1))'],
    ['markdown image', '![x](https://tracker.example/pixel.png)'],
    ['style tag', '<style>body{display:none}</style>text'],
    ['svg with script', '<svg onload="alert(1)"><script>alert(2)</script></svg>'],
  ];

  for (const [name, source] of payloads) {
    it(`neutralises: ${name}`, () => {
      const out = html(source).toLowerCase();
      expect(out).not.toContain('<script');
      expect(out).not.toContain('<iframe');
      expect(out).not.toContain('<img');
      expect(out).not.toContain('<style');
      expect(out).not.toContain('<svg');
      expect(out).not.toContain('onerror');
      expect(out).not.toContain('onclick');
      expect(out).not.toContain('onload');
      expect(out).not.toContain('javascript:');
      expect(out).not.toContain('vbscript:');
      expect(out).not.toContain('data:text');
    });
  }

  it('keeps the plain text around stripped HTML', () => {
    expect(html('before <script>alert(1)</script> after')).toContain('before');
    expect(html('before <script>alert(1)</script> after')).toContain('after');
  });

  it('opens links safely', () => {
    const out = html('[docs](https://docs.example/page)');
    expect(out).toContain('href="https://docs.example/page"');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
    expect(out).toContain('target="_blank"');
  });

  it('renders ordinary Markdown (headings, lists, bold, code)', () => {
    const out = html('## Title\n\n- one\n- two\n\n**bold** and `code`');
    expect(out).toContain('<h2>Title</h2>');
    expect(out).toContain('<li>one</li>');
    expect(out).toContain('<strong>bold</strong>');
    expect(out).toContain('<code>code</code>');
  });

  it('keeps Arabic text and paragraphs intact', () => {
    const out = html('الفقرة الأولى\n\nالفقرة الثانية');
    expect(out.match(/<p>/g)).toHaveLength(2);
    expect(out).toContain('الفقرة الثانية');
  });
});

describe('reading time (AR-5)', () => {
  it('is words ÷ 200, at least one minute', () => {
    expect(readingMinutesOf('')).toBe(1);
    expect(readingMinutesOf('كلمة '.repeat(10))).toBe(1);
    expect(readingMinutesOf('كلمة '.repeat(200))).toBe(1);
    expect(readingMinutesOf('كلمة '.repeat(201))).toBe(2);
    expect(readingMinutesOf('word '.repeat(450))).toBe(3);
    expect(wordCount('  a  b \n c ')).toBe(3);
  });
});
