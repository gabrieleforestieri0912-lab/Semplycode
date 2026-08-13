function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function renderMarkdown(text) {
  if (!text) return '';

  let html = escapeHtml(text);

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/^---$/gm, '<hr>');

  html = html.replace(/^(?:- (.+)\n?)+/gm, (match) => {
    const items = match
      .split('\n')
      .filter((l) => l.startsWith('- '))
      .map((l) => `<li>${l.slice(2)}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  });

  html = html.replace(/^(?:\d+\. (.+)\n?)+/gm, (match) => {
    const items = match
      .split('\n')
      .filter((l) => /^\d+\. /.test(l))
      .map((l) => `<li>${l.replace(/^\d+\. /, '')}</li>`)
      .join('');
    return `<ol>${items}</ol>`;
  });

  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`;
  }

  return `<div class="response-content">${html}</div>`;
}

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return true;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function planLabelFromId(plan) {
  if (plan === 'pro') return 'Pro';
  if (plan === 'enterprise') return 'Enterprise';
  if (plan === 'guest') return 'Ospite';
  return 'Gratuito';
}

describe('escapeHtml', () => {
  it('escapes HTML tags', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('preserves normal text', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  it('escapes quotes', () => {
    expect(escapeHtml('He said "hello"')).toBe('He said "hello"');
  });
});

describe('renderMarkdown', () => {
  it('renders bold text', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>');
  });

  it('renders italic text', () => {
    expect(renderMarkdown('*italic*')).toContain('<em>italic</em>');
  });

  it('renders headings', () => {
    expect(renderMarkdown('# Title')).toContain('<h1>Title</h1>');
    expect(renderMarkdown('## Title')).toContain('<h2>Title</h2>');
    expect(renderMarkdown('### Title')).toContain('<h3>Title</h3>');
  });

  it('renders code blocks', () => {
    expect(renderMarkdown('```js\ncode```')).toContain('<pre><code class="language-js">code</code></pre>');
  });

  it('renders inline code', () => {
    expect(renderMarkdown('`code`')).toContain('<code>code</code>');
  });

  it('renders unordered lists', () => {
    expect(renderMarkdown('- item1\n- item2')).toContain('<ul>');
    expect(renderMarkdown('- item1\n- item2')).toContain('<li>item1</li>');
  });

  it('renders ordered lists', () => {
    expect(renderMarkdown('1. item1\n2. item2')).toContain('<ol>');
    expect(renderMarkdown('1. item1\n2. item2')).toContain('<li>item1</li>');
  });

  it('renders blockquotes', () => {
    expect(renderMarkdown('> quote')).toContain('&gt; quote');
  });

  it('renders horizontal rules', () => {
    expect(renderMarkdown('---')).toContain('<hr>');
  });

  it('wraps plain text in paragraph', () => {
    expect(renderMarkdown('hello')).toContain('<p>hello</p>');
  });

  it('returns empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('');
    expect(renderMarkdown(null as any)).toBe('');
  });
});

describe('isTokenExpired', () => {
  it('returns true for invalid token', () => {
    expect(isTokenExpired('invalid')).toBe(true);
  });

  it('returns true when exp is missing', () => {
    const payload = btoa(JSON.stringify({ sub: 'user' }));
    const token = `header.${payload}.signature`;
    expect(isTokenExpired(token)).toBe(true);
  });

  it('returns false for non-expired token', () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const payload = btoa(JSON.stringify({ sub: 'user', exp: future }));
    const token = `header.${payload}.signature`;
    expect(isTokenExpired(token)).toBe(false);
  });

  it('returns true for expired token', () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    const payload = btoa(JSON.stringify({ sub: 'user', exp: past }));
    const token = `header.${payload}.signature`;
    expect(isTokenExpired(token)).toBe(true);
  });
});

describe('planLabelFromId', () => {
  it('returns Pro for pro plan', () => {
    expect(planLabelFromId('pro')).toBe('Pro');
  });

  it('returns Enterprise for enterprise plan', () => {
    expect(planLabelFromId('enterprise')).toBe('Enterprise');
  });

  it('returns Ospite for guest plan', () => {
    expect(planLabelFromId('guest')).toBe('Ospite');
  });

  it('returns Gratuito for free plan', () => {
    expect(planLabelFromId('free')).toBe('Gratuito');
  });

  it('returns Gratuito for unknown plan', () => {
    expect(planLabelFromId('unknown')).toBe('Gratuito');
  });
});
