// Verifica di esecuzione dei bundle CodeMirror in un sandbox DOM minimale.
// Uso: npm run build:extension-codemirror && npm run test:extension-codemirror
const vm = require("vm");
const fs = require("fs");
const os = require("os");
const path = require("path");

function makeEl() {
  return {
    style: {},
    dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {},
    getAttribute() { return null; },
    appendChild() {},
    removeChild() {},
    insertBefore() {},
    addEventListener() {},
    removeEventListener() {},
    contains() { return false; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }; },
    textContent: "",
    innerHTML: "",
    childNodes: [],
    firstChild: null,
    nextSibling: null,
    parentNode: null,
  };
}

function makeSandbox() {
  const doc = {
    createElement: () => makeEl(),
    createTextNode: () => makeEl(),
    createDocumentFragment: () => makeEl(),
    documentElement: makeEl(),
    body: makeEl(),
    head: makeEl(),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
    removeEventListener() {},
  };
  const sandbox = {
    document: doc,
    navigator: { userAgent: "Mozilla/5.0", platform: "Win32", vendor: "" },
    location: { href: "chrome-extension://test/sidepanel.html" },
    setTimeout, clearTimeout, setInterval, clearInterval, console,
    requestAnimationFrame: (f) => setTimeout(f, 0),
    getComputedStyle: () => ({ getPropertyValue: () => "" }),
    CSS: { supports: () => false },
    matchMedia: () => ({ matches: false, addListener() {}, removeListener() {} }),
    devicePixelRatio: 1,
    MutationObserver: class { observe() {} disconnect() {} takeRecords() { return []; } },
    Event: class {}, CustomEvent: class {}, KeyboardEvent: class {}, MouseEvent: class {},
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  return sandbox;
}

function testBundle(label, file) {
  const code = fs.readFileSync(file, "utf8");
  const sandbox = makeSandbox();
  try {
    vm.runInNewContext(code, sandbox, { timeout: 10000 });
    const api = sandbox.window.__SemplycodeCodeMirror;
    const ok = !!(api && api.EditorView && api.basicSetup && api.javascript && api.oneDark);
    console.log(label, "->", ok ? "OK, API esposta" : "FALLITO: API mancante");
    return ok;
  } catch (e) {
    console.log(label, "-> ERRORE:", e.message);
    return false;
  }
}

let fresh = true;
const freshBundle = path.join(os.tmpdir(), "cm-test-bundle.js");

// Rigenera il bundle dall'entry sorgente per confronto.
try {
  require("esbuild").buildSync({
    entryPoints: ["chrome-extension/codemirror-entry.js"],
    bundle: true,
    minify: true,
    format: "iife",
    platform: "browser",
    target: "es2020",
    outfile: freshBundle,
    logLevel: "silent",
  });
} catch (e) {
  console.log("Build bundle rigenerato -> ERRORE:", e.message);
  fresh = false;
}

const a = testBundle("bundle attuale    ", "chrome-extension/codemirror-bundle.js");
const b = fresh ? testBundle("bundle rigenerato ", freshBundle) : false;

process.exit(a && b ? 0 : 1);
