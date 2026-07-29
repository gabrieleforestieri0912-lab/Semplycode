// Injected on all pages: floating action when user selects text (code-friendly)

const MIN_SELECTION_LEN = 8;
const MAX_SELECTION_LEN = 12000;

let floatBtn = null;
let highlightMark = null;

function removeUi() {
  if (floatBtn) {
    floatBtn.remove();
    floatBtn = null;
  }
  if (highlightMark) {
    const parent = highlightMark.parentNode;
    if (parent) {
      const text = highlightMark.textContent;
      const textNode = document.createTextNode(text);
      parent.replaceChild(textNode, highlightMark);
      parent.normalize();
    }
    highlightMark = null;
  }
}

const CODE_KEYWORDS = [
  'function', 'const', 'let', 'var', 'def', 'class', 'import', 'export',
  'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'try', 'catch',
  'throw', 'new', 'this', 'typeof', 'instanceof', 'void', 'delete',
  'async', 'await', 'yield', 'from', 'extends', 'super', 'static',
  'public', 'private', 'protected', 'interface', 'implements', 'package',
  'namespace', 'using', 'include', 'define', 'printf', 'scanf',
  'print', 'range', 'enumerate', 'lambda', 'map', 'filter', 'reduce',
  'then', 'catch', 'finally', 'Promise', 'console', 'log', 'debug',
  'int', 'float', 'double', 'string', 'bool', 'boolean', 'char',
  'void', 'null', 'undefined', 'true', 'false', 'NaN', 'Infinity',
  'main', 'fn', 'func', 'let', 'mut', 'println', 'System',
  'require', 'module', 'exports', 'default', 'component',
  'useState', 'useEffect', 'useRef', 'useCallback', 'useMemo',
  'styled', 'keyof', 'typeof', 'as const', 'unknown', 'never',
  'constructor', 'prototype', '__proto__', 'bind', 'apply', 'call',
];

const COMMON_WORDS = [
  'the', 'is', 'are', 'was', 'were', 'has', 'have', 'been',
  'would', 'could', 'should', 'their', 'there', 'which',
  'that', 'this', 'with', 'from', 'about', 'what', 'when',
  'where', 'who', 'whom', 'why', 'how', 'all', 'each', 'every',
  'some', 'any', 'many', 'much', 'more', 'most', 'few', 'less',
  'than', 'then', 'also', 'just', 'very', 'too', 'not', 'but',
  'and', 'for', 'nor', 'yet', 'so', 'because', 'although',
  'while', 'after', 'before', 'during', 'until', 'since',
  'somebody', 'anybody', 'everybody', 'nobody', 'someone',
  'anyone', 'everyone', 'no one', 'something', 'anything',
  'everything', 'nothing',
];

function looksLikeCode(text) {
  const t = text.trim();
  if (t.length < MIN_SELECTION_LEN) return false;
  if (t.length > MAX_SELECTION_LEN) return false;

  let score = 0;

  // === Positive signals ===

  // HTML/XML tags (richiesta specifica)
  const hasHtmlTags = /<\/?[a-z][\w]*[^>]*>/i.test(t);
  if (hasHtmlTags) score += 3;
  if (/<\/?[a-z][\w]*[^>]*\/>/i.test(t)) score += 1;

  // Braces, brackets, semicolons, arrows
  if (/[{}\[\]();]/.test(t)) score += 2;
  if (/=>|->|::|\.\.\./.test(t)) score += 1.5;

  // Operators
  if (/[=+\-*/%&|^~<>!]=?/.test(t)) score += 1;

  // Programming keywords
  const keywordMatches = CODE_KEYWORDS.filter(k => new RegExp('\\b' + k.replace(/ /g, '\\s+') + '\\b').test(t));
  score += keywordMatches.length * 1.5;

  // Multi-line with indentation (code structure)
  const lines = t.split('\n').filter(l => l.trim());
  if (lines.length >= 2) {
    const hasIndentation = lines.some(l => /^\s{2,}/.test(l));
    if (hasIndentation) score += 2;

    const indentations = lines.map(l => l.match(/^\s*/)[0].length).filter(i => i > 0);
    if (indentations.length >= 2) score += 1;

    const hasBlankLines = t.split('\n').some(l => !l.trim()) && lines.length >= 3;
    if (hasBlankLines) score += 1;
  }

  // String literals
  const stringMatches = t.match(/['"`].*?['"`]/g);
  if (stringMatches) score += Math.min(stringMatches.length * 0.5, 2);

  // Comments
  if (/\/\/|# |\/\*|\*\//.test(t)) score += 2;

  // Numbers in code-style formats
  if (/\b0x[0-9a-fA-F]+\b/.test(t)) score += 1.5;
  if (/\b\d+\.\d+\b/.test(t)) score += 0.5;

  // CSS selectors / properties
  if (/\.[a-zA-Z][\w-]*\s*\{|#[a-zA-Z][\w-]*\s*\{/.test(t)) score += 3;
  if (/[a-z-]+\s*:\s*[^;]+;/i.test(t)) score += 2;

  // File path / import patterns
  if (/['"]\.[\w/]+\.[a-z]+['"]/.test(t)) score += 1;
  if (/from\s+['"]/.test(t) || /require\s*\(/.test(t)) score += 1.5;

  // Template literals / tagged templates
  if (/`.*\$\{.*\}.*`/.test(t)) score += 2;

  // Type annotations
  if (/:\s*(string|number|boolean|void|any|never|unknown)\b/.test(t)) score += 1.5;
  if (/\[\]:\s*/.test(t)) score += 1;

  // === Negative signals (natural language prose) ===

  const words = t.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Capitalized words ratio (prose indicator)
  const capitalizedWords = words.filter(w => /^[A-Z][a-z]+$/.test(w)).length;
  if (capitalizedWords > wordCount * 0.3) score -= 2;

  // Ends with sentence punctuation (and no code punctuation)
  if (/[.!?]$/.test(t.trim()) && !/[;{}]/.test(t)) score -= 1.5;

  // Long prose lines without code structure
  const longLines = lines.filter(l => l.length > 120);
  if (longLines.length > 0 && !/[;{}()[\]]/.test(t)) score -= 2;

  // Common English word density
  const commonMatches = COMMON_WORDS.filter(w => new RegExp('\\b' + w + '\\b', 'i').test(t)).length;
  if (commonMatches >= 3) score -= Math.min(commonMatches * 0.5, 3);

  // All text is one long line with spaces (prose paragraph)
  if (lines.length <= 2 && wordCount >= 15 && !/[;{}()[\]]/.test(t)) score -= 2;

  // Mostly punctuation-free prose
  const hasSentenceStructure = /^[A-Z]/.test(t) && /[.!?]\s+[A-Z]/.test(t);
  if (hasSentenceStructure && !/[;{}()[\]]/.test(t)) score -= 2;

  // Threshold: >= 3 is considered code
  return score >= 3;
}

function wrapSelectionHighlight() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

  try {
    const range = sel.getRangeAt(0);
    const mark = document.createElement('mark');
    mark.className = 'semplycode-selection-highlight';
    mark.setAttribute('data-semplycode', '1');
    range.surroundContents(mark);
    highlightMark = mark;
    sel.removeAllRanges();
  } catch {
    // Complex selections (multi-node) — skip DOM wrap
  }
}

function showFloatButton(rect, text) {
  removeUi();

  floatBtn = document.createElement('button');
  floatBtn.type = 'button';
  floatBtn.className = 'semplycode-float-analyze';
  floatBtn.innerHTML = `
    <span class="semplycode-float-icon" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4L2 12l6 8"/><path d="M16 4l6 8-6 8"/></svg>
    </span>
    Analizza con Semplycode
  `;
  floatBtn.title = 'Invia il testo selezionato all\'AI';

  const top = Math.min(rect.bottom + window.scrollY + 8, window.scrollY + window.innerHeight - 48);
  const left = Math.min(
    rect.left + window.scrollX + rect.width / 2 - 110,
    window.scrollX + window.innerWidth - 230,
  );

  floatBtn.style.top = `${Math.max(8, top)}px`;
  floatBtn.style.left = `${Math.max(8, left)}px`;

  floatBtn.addEventListener('mousedown', (e) => e.preventDefault());

  floatBtn.addEventListener('click', () => {
    const payload = text.trim().slice(0, MAX_SELECTION_LEN);
    
    if (!chrome.runtime?.id) {
      floatBtn.remove();
      return;
    }
    
    try {
      chrome.runtime.sendMessage({ action: 'analyze-selection', code: payload }, (response) => {
        if (chrome.runtime.lastError) {
          floatBtn.remove();
          return;
        }
        if (response && response.reason === 'not-code') {
          floatBtn.disabled = false;
          floatBtn.innerHTML = `<span class="semplycode-warning-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span> Testo non riconosciuto come codice`;
          floatBtn.style.borderColor = '#f59e0b';
          floatBtn.style.color = '#f59e0b';
          setTimeout(removeUi, 2000);
          return;
        }
        floatBtn.remove();
      });
    } catch (e) {
      floatBtn.remove();
    }
    
    floatBtn.disabled = true;
    floatBtn.textContent = 'Apertura pannello…';
    setTimeout(removeUi, 1200);
  });

  document.body.appendChild(floatBtn);
}

function onSelectionEnd() {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) {
    removeUi();
    return;
  }

  const text = sel.toString();
  if (!looksLikeCode(text)) {
    removeUi();
    return;
  }

  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (!rect.width && !rect.height) {
    removeUi();
    return;
  }

  showFloatButton(rect, text);
}

document.addEventListener('mouseup', () => {
  setTimeout(onSelectionEnd, 10);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') removeUi();
});

document.addEventListener('scroll', () => removeUi(), true);

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'clear-selection-ui') removeUi();
});
