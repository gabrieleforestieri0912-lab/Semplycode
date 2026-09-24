// Semplycode Extension Background Service Worker (Manifest V3)

const STRONG_KEYWORDS_BG = [
  'const', 'var', 'def', 'import', 'export', 'async', 'await', 'typeof',
  'instanceof', 'require', 'namespace', 'lambda', 'enum', 'delegate',
  'struct', 'declare', 'typedef', 'constexpr', 'finally', 'usestate',
  'useeffect', 'useref', 'usecallback', 'usememo', 'constructor',
  'prototype', 'keyof', 'unknown', 'never', 'readonly', 'void', 'null',
  'undefined', 'bool', 'boolean', 'char', 'printf', 'scanf', 'println',
  'fn', 'func', 'mut',
];

const WEAK_KEYWORDS_BG = [
  'if', 'else', 'for', 'while', 'do', 'new', 'this', 'from', 'case', 'try',
  'static', 'public', 'private', 'protected', 'let', 'default', 'string',
  'int', 'float', 'double', 'true', 'false', 'map', 'filter', 'reduce',
  'then', 'print', 'range', 'list', 'dict', 'bind', 'apply', 'call',
  'promise', 'log', 'debug', 'styled', 'component',
  'function', 'return', 'class', 'include', 'define', 'module', 'template',
  'throw', 'catch', 'switch', 'package', 'main', 'yield', 'extends',
  'interface', 'implements',
];

const COMMON_WORDS_BG = [
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

const COMMON_WORD_SET_BG = new Set(COMMON_WORDS_BG);

function isProseText(text) {
  const t = text.trim();
  if (t.length < 20 || t.length > 8000) return false;
  if (isCodeText(text)) return false;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 3) return false;
  if (/^https?:\/\//.test(t)) return false;
  const hasLetters = /[A-Za-zÀ-ÿ]{3,}/.test(t);
  const hasSpaces = /\s/.test(t);
  if (!hasLetters || !hasSpaces) return false;
  const letterRatio = (t.match(/[A-Za-zÀ-ÿ]/g) || []).length / t.length;
  if (letterRatio < 0.5) return false;
  return true;
}

function isCodeText(text) {
  const t = text.trim();
  if (t.length < 8) return false;
  if (t.length > 12000) return false;

  const tokens = t.toLowerCase().match(/[\p{L}]+/gu) || [];
  const wordSet = new Set(tokens);
  const wordCount = tokens.length;
  const origTokens = t.match(/[\p{L}]+/gu) || [];

  const lines = t.split('\n').filter(l => l.trim());
  const lineCount = lines.length;

  let codeScore = 0;
  let proseScore = 0;
  let structural = false;

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

  const strongKeywordCount = STRONG_KEYWORDS_BG.filter(k => wordSet.has(k)).length;
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

  const parenOpen = (t.match(/\(/g) || []).length;
  const parenClose = (t.match(/\)/g) || []).length;
  if (parenOpen > 0 && parenOpen === parenClose && parenOpen <= 3) codeScore += 1;

  const semicolons = (t.match(/;/g) || []).length;
  if (semicolons >= 2) codeScore += 2;
  else if (semicolons === 1) codeScore += 1;

  if (/[=+\-*/%&|^~<>]/.test(t)) codeScore += 1;

  const quotes = (t.match(/['"`]/g) || []).length;
  if (quotes >= 2) codeScore += 1;

  const weakKeywordCount = WEAK_KEYWORDS_BG.filter(k => wordSet.has(k)).length;
  if (weakKeywordCount >= 2) codeScore += Math.min(weakKeywordCount * 0.5, 2);

  const cssProps = (t.match(/(?:^|[;{}])\s*[a-z-]+\s*:\s*[^;{}]+;/gi) || []).length;
  if (cssProps >= 2) codeScore += 1;

  if (/^[A-Z]/.test(t)) proseScore += 1;

  if (/[.!?]/.test(t)) {
    proseScore += 1;
    const sentences = (t.match(/[.!?]\s+[A-Z]/g) || []).length;
    if (sentences > 0) proseScore += Math.min(sentences, 3);
  }

  if (wordCount > 0) {
    const commonCount = tokens.filter(w => COMMON_WORD_SET_BG.has(w)).length;
    const ratio = commonCount / wordCount;
    if (ratio > 0.5) proseScore += 3;
    else if (ratio > 0.35) proseScore += 2;
    else if (ratio > 0.25) proseScore += 1;
  }

  if (/[.!?]$/.test(t) && !/[;{}<>]/.test(t)) proseScore += 2;

  const longLines = lines.filter(l => l.length > 120);
  if (longLines.length > 0) proseScore += 2;

  if (wordCount > 0 && origTokens.filter(w => /^[A-Z]/.test(w)).length / wordCount > 0.15) proseScore += 1;

  if (!structural) return false;
  return codeScore - proseScore >= 2 && codeScore >= 4;
}

// Setup context menus on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "explain-code",
      title: "Spiega con Semplycode AI",
      contexts: ["selection"]
    });
    chrome.contextMenus.create({
      id: "revise-text",
      title: "Rivedi scrittura con Semplycode",
      contexts: ["selection"]
    });
    console.log("Semplycode Context Menus Registered.");
  });
});

async function openPanelWithCode(tabId, selectedCode) {
  if (!selectedCode?.trim()) return;

  // Open sidePanel BEFORE any await to preserve user gesture context
  if (chrome.sidePanel && tabId) {
    try {
      await chrome.sidePanel.open({ tabId });
    } catch (err) {
      console.error("Failed to open sidePanel:", err);
    }
  }

  await chrome.storage.local.set({
    selectedCode: selectedCode.trim(),
    timestamp: Date.now(),
  });

  chrome.runtime.sendMessage({ action: "start-analysis", code: selectedCode.trim() });
}

async function openPanelWithRevision(tabId, selectedText) {
  if (!selectedText?.trim()) return;
  if (chrome.sidePanel && tabId) {
    try {
      await chrome.sidePanel.open({ tabId });
    } catch (err) {
      console.error("Failed to open sidePanel:", err);
    }
  }
  await chrome.storage.local.set({
    reviseText: selectedText.trim(),
    timestamp: Date.now(),
  });
  chrome.runtime.sendMessage({ action: "start-revision", text: selectedText.trim() });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "explain-code" && info.selectionText) {
    if (!isCodeText(info.selectionText)) {
      console.warn("[Semplycode] Il testo selezionato non sembra essere codice. Operazione annullata.");
      return;
    }
    openPanelWithCode(tab.id, info.selectionText);
  }
  if (info.menuItemId === "revise-text" && info.selectionText) {
    if (!isProseText(info.selectionText)) {
      // consenti comunque la revisione se l'utente la richiede esplicitamente da menu
      if (info.selectionText.trim().length < 20) {
        console.warn("[Semplycode] Testo troppo breve per la revisione.");
        return;
      }
    }
    openPanelWithRevision(tab.id, info.selectionText);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "analyze-selection" && message.code) {
    if (!isCodeText(message.code)) {
      console.warn("[Semplycode] Il testo selezionato non sembra essere codice.");
      sendResponse({ ok: false, reason: "not-code" });
      return;
    }

    const tabId = sender.tab?.id;

    // Apri il sidePanel SUBITO (prima di qualsiasi async) per preservare il gesto utente
    if (tabId) {
      chrome.sidePanel.open({ tabId }).catch(err => {
        console.warn("[Semplycode] Impossibile aprire il pannello laterale:", err);
      });
    }

    chrome.storage.local.set({
      selectedCode: message.code.trim(),
      timestamp: Date.now(),
    }).then(() => {
      chrome.runtime.sendMessage({ action: "start-analysis", code: message.code.trim() })
        .catch(() => {}); // Il pannello potrebbe non essere ancora carico — si riprenderà dallo storage all'avvio
    });

    sendResponse({ ok: true });
    return true;
  }
  if (message.action === "revise-selection" && message.text) {
    const tabId = sender.tab?.id;
    if (tabId) {
      chrome.sidePanel.open({ tabId }).catch(err => {
        console.warn("[Semplycode] Impossibile aprire il pannello laterale:", err);
      });
    }
    chrome.storage.local.set({
      reviseText: message.text.trim(),
      timestamp: Date.now(),
    }).then(() => {
      chrome.runtime.sendMessage({ action: "start-revision", text: message.text.trim() }).catch(() => {});
    });
    sendResponse({ ok: true });
    return true;
  }
});

// Configure side panel behavior to open when clicking the extension icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
