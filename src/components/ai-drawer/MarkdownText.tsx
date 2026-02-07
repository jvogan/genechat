import React from 'react';

interface MarkdownTextProps {
  text: string;
}

export default function MarkdownText({ text }: MarkdownTextProps) {
  const elements: React.ReactNode[] = [];
  const lines = text.split('\n');
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    // Code blocks
    if (lines[i].startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      elements.push(
        <pre key={key++} style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '8px 10px', margin: '6px 0', overflowX: 'auto', fontSize: 12 }}>
          <code style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Bullet lists
    if (lines[i].match(/^- /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^- /)) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={key++} style={{ margin: '4px 0', paddingLeft: 20, fontSize: 'inherit' }}>
          {items.map((item, j) => <li key={j} style={{ marginBottom: 2 }}>{renderInline(item)}</li>)}
        </ul>
      );
      continue;
    }

    // Numbered lists
    if (lines[i].match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\.\s*/, ''));
        i++;
      }
      elements.push(
        <ol key={key++} style={{ margin: '4px 0', paddingLeft: 20, fontSize: 'inherit' }}>
          {items.map((item, j) => <li key={j} style={{ marginBottom: 2 }}>{renderInline(item)}</li>)}
        </ol>
      );
      continue;
    }

    // Regular line
    if (lines[i].trim() === '') {
      elements.push(<div key={key++} style={{ height: 6 }} />);
    } else {
      elements.push(<div key={key++}>{renderInline(lines[i])}</div>);
    }
    i++;
  }

  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  // Split by inline code first to avoid processing markdown inside code
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={i} style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-secondary)', borderRadius: 3, padding: '1px 4px', fontSize: '0.9em' }}>{part.slice(1, -1)}</code>;
    }
    // Bold
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    if (boldParts.length > 1) {
      const result = boldParts.map((bp, j) => {
        if (bp.startsWith('**') && bp.endsWith('**')) {
          return <strong key={j}>{bp.slice(2, -2)}</strong>;
        }
        // Italic within non-bold parts
        return renderItalic(bp, j);
      });
      return <React.Fragment key={i}>{result}</React.Fragment>;
    }
    // Italic only (no bold)
    return <React.Fragment key={i}>{renderItalic(part, i)}</React.Fragment>;
  });
}

function renderItalic(text: string, key: number): React.ReactNode {
  const parts = text.split(/(\*[^*]+\*)/g);
  if (parts.length <= 1) return text;
  return parts.map((p, i) => {
    if (p.startsWith('*') && p.endsWith('*') && !p.startsWith('**')) {
      return <em key={`${key}-${i}`}>{p.slice(1, -1)}</em>;
    }
    return p;
  });
}
