// Semplycode Extension Background Service Worker (Manifest V3)

const CODE_KEYWORDS_BG = [
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

function isCodeText(text) {
  const t = text.trim();
  if (t.length < 8) return false;
  if (t.length > 12000) return false;

  let score = 0;

  if (/<\/?[a-z][\w]*[^>]*>/i.test(t)) score += 3;
  if (/[{}\[\]();]/.test(t)) score += 2;
  if (/=>|->|::|\.\.\./.test(t)) score += 1.5;
  if (/[=+\-*/%&|^~<>!]=?/.test(t)) score += 1;

  const keywordMatches = CODE_KEYWORDS_BG.filter(k => new RegExp('\\b' + k.replace(/ /g, '\\s+') + '\\b').test(t));
  score += keywordMatches.length * 1.5;

  const lines = t.split('\n').filter(l => l.trim());
  if (lines.length >= 2) {
    if (lines.some(l => /^\s{2,}/.test(l))) score += 2;
    const indentations = lines.map(l => l.match(/^\s*/)[0].length).filter(i => i > 0);
    if (indentations.length >= 2) score += 1;
    if (t.split('\n').some(l => !l.trim()) && lines.length >= 3) score += 1;
  }

  if (t.match(/['"`].*?['"`]/g)) score += Math.min(t.match(/['"`].*?['"`]/g).length * 0.5, 2);
  if (/\/\/|# |\/\*|\*\//.test(t)) score += 2;
  if (/\b0x[0-9a-fA-F]+\b/.test(t)) score += 1.5;
  if (/\.[a-zA-Z][\w-]*\s*\{|#[a-zA-Z][\w-]*\s*\{/.test(t)) score += 3;
  if (/[a-z-]+\s*:\s*[^;]+;/i.test(t)) score += 2;
  if (/['"]\.[\w/]+\.[a-z]+['"]/.test(t)) score += 1;
  if (/from\s+['"]/.test(t) || /require\s*\(/.test(t)) score += 1.5;
  if (/`.*\$\{.*\}.*`/.test(t)) score += 2;
  if (/:\s*(string|number|boolean|void|any|never|unknown)\b/.test(t)) score += 1.5;

  const words = t.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const capitalizedWords = words.filter(w => /^[A-Z][a-z]+$/.test(w)).length;
  if (capitalizedWords > wordCount * 0.3) score -= 2;
  if (/[.!?]$/.test(t.trim()) && !/[;{}]/.test(t)) score -= 1.5;
  if (lines.filter(l => l.length > 120).length > 0 && !/[;{}()[\]]/.test(t)) score -= 2;
  if (lines.length <= 2 && wordCount >= 15 && !/[;{}()[\]]/.test(t)) score -= 2;
  if (/^[A-Z]/.test(t) && /[.!?]\s+[A-Z]/.test(t) && !/[;{}()[\]]/.test(t)) score -= 2;

  return score >= 3;
}

// Setup context menus on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "explain-code",
      title: "Spiega con Semplycode AI",
      contexts: ["selection"]
    });
    console.log("Semplycode Context Menu Registered.");
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

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "explain-code" && info.selectionText) {
    if (!isCodeText(info.selectionText)) {
      console.warn("[Semplycode] Il testo selezionato non sembra essere codice. Operazione annullata.");
      return;
    }
    openPanelWithCode(tab.id, info.selectionText);
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
});

// Configure side panel behavior to open when clicking the extension icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
