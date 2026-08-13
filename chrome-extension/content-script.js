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

const STRONG_KEYWORDS = [
  'const', 'var', 'def', 'import', 'export', 'async', 'await', 'typeof',
  'instanceof', 'require', 'namespace', 'lambda', 'enum', 'delegate',
  'struct', 'declare', 'typedef', 'constexpr', 'finally', 'usestate',
  'useeffect', 'useref', 'usecallback', 'usememo', 'constructor',
  'prototype', 'keyof', 'unknown', 'never', 'readonly', 'void', 'null',
  'undefined', 'bool', 'boolean', 'char', 'printf', 'scanf', 'println',
  'fn', 'func', 'mut',
];

const WEAK_KEYWORDS = [
  'if', 'else', 'for', 'while', 'do', 'new', 'this', 'from', 'case', 'try',
  'static', 'public', 'private', 'protected', 'let', 'default', 'string',
  'int', 'float', 'double', 'true', 'false', 'map', 'filter', 'reduce',
  'then', 'print', 'range', 'list', 'dict', 'bind', 'apply', 'call',
  'promise', 'log', 'debug', 'styled', 'component',
  'function', 'return', 'class', 'include', 'define', 'module', 'template',
  'throw', 'catch', 'switch', 'package', 'main', 'yield', 'extends',
  'interface', 'implements',
];

const COMMON_WORDS = [
  'a', 'an', 'the', 'and', 'or', 'nor', 'but', 'not', 'yet', 'so', 'if',
  'of', 'to', 'in', 'on', 'at', 'by', 'as', 'for', 'with', 'from', 'about',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'will', 'would',
  'could', 'should', 'shall', 'may', 'might', 'must', 'can', 'do', 'does',
  'did', 'has', 'have', 'had', 'this', 'that', 'these', 'those', 'it',
  'its', 'there', 'their', 'they', 'them', 'which', 'who', 'whom', 'whose',
  'what', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'some',
  'any', 'many', 'much', 'more', 'most', 'few', 'less', 'than', 'then',
  'also', 'just', 'very', 'too', 'because', 'although', 'while', 'after',
  'before', 'during', 'until', 'since', 'into', 'onto', 'upon', 'again',
  'against', 'other', 'another', 'such', 'only', 'own', 'same', 'you',
  'your', 'yours', 'i', 'me', 'my', 'we', 'us', 'our', 'he', 'him', 'his',
  'she', 'her', 'they', 'them', 'someone', 'anyone', 'everyone', 'nobody',
  'something', 'anything', 'everything', 'nothing', 'get', 'set', 'use',
  'used',
  'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'di', 'a', 'da',
  'in', 'con', 'su', 'per', 'tra', 'fra', 'e', 'o', 'ma', 'se', 'che',
  'chi', 'cui', 'quale', 'quali', 'questo', 'questa', 'questi', 'queste',
  'quello', 'quella', 'quelli', 'quelle', 'qui', 'li', 'molto', 'molta',
  'molti', 'molte', 'poco', 'poca', 'pochi', 'poche', 'tutto', 'tutta',
  'tutti', 'tutte', 'essere', 'avere', 'dovere', 'potere', 'volere', 'fare',
  'dire', 'andare', 'venire', 'anche', 'ancora', 'cosi', 'cosi', 'quindi',
  'dunque', 'infatti', 'pero', 'pero', 'tuttavia', 'non', 'piu', 'meno',
  'solo', 'sempre', 'mai', 'ora', 'adesso', 'dopo', 'prima', 'quando',
  'dove', 'come', 'perche', 'senza', 'dentro', 'fuori', 'sopra', 'sotto',
  'vicino', 'lontano', 'nostro', 'nostra', 'nostri', 'nostre', 'vostro',
  'vostra', 'loro', 'mio', 'mia', 'miei', 'mie', 'tuo', 'tua', 'tuoi',
  'tue', 'suo', 'sua', 'suoi', 'sue', 'al', 'allo', 'alla', 'ai', 'agli',
  'alle', 'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle', 'nel', 'nello',
  'nella', 'nei', 'negli', 'nelle', 'sul', 'sullo', 'sulla', 'sui', 'sugli',
  'sulle', 'del', 'dello', 'della', 'dei', 'degli', 'delle', 'sia', 'sono',
  'sei', 'era', 'erano', 'ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno',
  'posso', 'puoi', 'puo', 'possiamo', 'potete', 'possono', 'voglio',
  'vuoi', 'vuole', 'vogliamo', 'volete', 'vogliono', 'faccio', 'fai',
  'facciamo', 'fate', 'fanno', 'dico', 'dici', 'dice', 'diciamo', 'dite',
  'dicono', 'vado', 'vai', 'va', 'andiamo', 'andate', 'vanno', 'viene',
  'vengono', 'sara', 'saremo', 'sarete', 'saranno', 'ecc', 'etc',
  'e', 'piu', 'perche', 'cosi', 'gia', 'si', 'citta', 'puo', 'la',
];

const COMMON_WORD_SET = new Set(COMMON_WORDS);

function looksLikeCode(text) {
  const t = text.trim();
  if (t.length < MIN_SELECTION_LEN) return false;
  if (t.length > MAX_SELECTION_LEN) return false;

  const tokens = t.toLowerCase().match(/[\p{L}]+/gu) || [];
  const wordSet = new Set(tokens);
  const wordCount = tokens.length;
  const origTokens = t.match(/[\p{L}]+/gu) || [];

  const lines = t.split('\n').filter(l => l.trim());
  const lineCount = lines.length;

  let codeScore = 0;
  let proseScore = 0;
  let structural = false;

  // === Strong code signals ===

  const openBraces = (t.match(/\{/g) || []).length;
  const closeBraces = (t.match(/\}/g) || []).length;
  if (openBraces > 0 && openBraces === closeBraces) {
    codeScore += 4;
    structural = true;
  }

  if (/=>|\b->\b|::|\b\.\.\.\b/.test(t)) {
    codeScore += 3;
    structural = true;
  }

  if (/`[^`]*\$\{[^}]*\}[^`]*`/.test(t)) {
    codeScore += 3;
    structural = true;
  }

  const strongKeywordCount = STRONG_KEYWORDS.filter(k => wordSet.has(k)).length;
  if (strongKeywordCount > 0) {
    codeScore += Math.min(2 + strongKeywordCount * 1.5, 6);
    structural = true;
  }

  const callablePattern = /\b(?:console\.log|print|println|printf|len|range|str|int|float|list|dict|parseInt|JSON|Math\.[A-Za-z]+|Promise|useState|useEffect|useRef|useCallback|useMemo|main)\s*\(/i;
  if (callablePattern.test(t)) {
    codeScore += 2;
    structural = true;
  }

  if (/from\s+['"]/.test(t) || /require\s*\(/.test(t) || /import\s+[^;]+\s+from/.test(t) || /export\s+(default\s+)?(function|class|const|let|var)\b/.test(t)) {
    codeScore += 3;
    structural = true;
  }

  const openTags = (t.match(/<[a-z][\w]*(?:\s[^<>]*?)?>/gi) || []).length;
  const closeTags = (t.match(/<\/[a-z][\w]*\s*>/gi) || []).length;
  if (openTags + closeTags >= 2) {
    codeScore += 4;
    structural = true;
  } else if (openTags + closeTags === 1) {
    codeScore += 2;
  }

  const noUrls = t.replace(/https?:\/\/\S+/g, '');
  if (/\/\/|#\s|\/\*|\*\//.test(noUrls)) {
    codeScore += 2;
    structural = true;
  }

  if (/\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|REPLACE)\b/i.test(t) || /\bCREATE\s+(TABLE|INDEX|DATABASE|VIEW|TRIGGER|FUNCTION|PROCEDURE)\b/i.test(t)) {
    codeScore += 2;
    structural = true;
    const sqlClauses = (t.match(/\b(FROM|WHERE|JOIN|GROUP\s+BY|ORDER\s+BY|HAVING|INTO|VALUES|LIMIT|LEFT|RIGHT|INNER|OUTER)\b/gi) || []).length;
    if (sqlClauses > 0) codeScore += Math.min(1 + sqlClauses, 4);
  }

  if (/\.[a-z][\w-]*\s*\{|#[a-z][\w-]*\s*\{/i.test(t)) {
    codeScore += 3;
    structural = true;
  }

  if (/:\s*(string|number|boolean|void|any|never|unknown|int|float|double|char|object|array)\b/.test(t)) {
    codeScore += 2;
    structural = true;
  }

  if (/\b0x[0-9a-fA-F]+\b/.test(t)) {
    codeScore += 2;
    structural = true;
  }

  if (/\b\d+\.\d+\b/.test(t)) codeScore += 1;

  if (/`[^`]+`/.test(t)) {
    codeScore += 2;
    structural = true;
  }

  if (/\bas\s+const\b/i.test(t)) {
    codeScore += 3;
    structural = true;
  }

  if (/\bnew\s+[A-Z][A-Za-z0-9_]*\s*\(/.test(t)) {
    codeScore += 2;
    structural = true;
  }

  if (/\bclass\s+[A-Z][A-Za-z0-9_]*/.test(t)) {
    codeScore += 2;
    structural = true;
  }

  if (/^\s*[A-Za-z_$][\w$]*\s*[+\-*/%]?=\s*\S/.test(t) || /[;{]\s*[A-Za-z_$][\w$]*\s*[+\-*/%]?=\s*\S/.test(t)) {
    codeScore += 2;
    structural = true;
  }

  if (lineCount >= 2 && lines.some(l => /^\s{2,}/.test(l))) {
    codeScore += 2;
    structural = true;
    if (lineCount >= 3) codeScore += 1;
  }

  if (/\$[A-Za-z_][\w]*|\$\{[\w]+\}/.test(t)) {
    codeScore += 2;
    structural = true;
  }

  // === Weak code signals (ambiguous with prose) ===

  const parenOpen = (t.match(/\(/g) || []).length;
  const parenClose = (t.match(/\)/g) || []).length;
  if (parenOpen > 0 && parenOpen === parenClose && parenOpen <= 3) codeScore += 1;

  const semicolons = (t.match(/;/g) || []).length;
  if (semicolons >= 2) codeScore += 2;
  else if (semicolons === 1) codeScore += 1;

  if (/[=+\-*/%&|^~<>]/.test(t)) codeScore += 1;

  const quotes = (t.match(/['"`]/g) || []).length;
  if (quotes >= 2) codeScore += 1;

  const weakKeywordCount = WEAK_KEYWORDS.filter(k => wordSet.has(k)).length;
  if (weakKeywordCount >= 2) codeScore += Math.min(weakKeywordCount * 0.5, 2);

  const cssProps = (t.match(/(?:^|[;{}])\s*[a-z-]+\s*:\s*[^;{}]+;/gi) || []).length;
  if (cssProps >= 2) codeScore += 1;

  // === Prose signals (negative) ===

  if (/^[A-Z]/.test(t)) proseScore += 1;

  if (/[.!?]/.test(t)) {
    proseScore += 1;
    const sentences = (t.match(/[.!?]\s+[A-Z]/g) || []).length;
    if (sentences > 0) proseScore += Math.min(sentences, 3);
  }

  if (wordCount > 0) {
    const commonCount = tokens.filter(w => COMMON_WORD_SET.has(w)).length;
    const ratio = commonCount / wordCount;
    if (ratio > 0.5) proseScore += 3;
    else if (ratio > 0.35) proseScore += 2;
    else if (ratio > 0.25) proseScore += 1;
  }

  if (/[.!?]$/.test(t) && !/[;{}<>]/.test(t)) proseScore += 2;

  const longLines = lines.filter(l => l.length > 120);
  if (longLines.length > 0) proseScore += 2;

  if (wordCount > 0 && origTokens.filter(w => /^[A-Z]/.test(w)).length / wordCount > 0.15) proseScore += 1;

  // === Decision ===

  if (!structural) return false;
  return codeScore - proseScore >= 2 && codeScore >= 4;
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
