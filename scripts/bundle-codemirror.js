const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const extensionDir = path.join(__dirname, '..', 'chrome-extension');
const outputPath = path.join(extensionDir, 'codemirror-bundle.js');
const tempEntry = path.join(extensionDir, 'codemirror-entry.js');

const bundleCode = `
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

window.__SemplycodeCodeMirror = {
  EditorView,
  basicSetup,
  javascript,
  oneDark,
};

console.log('[Semplycode] CodeMirror 6 bundled assets loaded');
`;

fs.writeFileSync(tempEntry, bundleCode);

async function bundle() {
  try {
    await esbuild.build({
      entryPoints: [tempEntry],
      bundle: true,
      outfile: outputPath,
      format: 'iife',
      globalName: 'SemplycodeExtension',
      platform: 'browser',
      target: ['es2020'],
      minify: true,
      sourcemap: false,
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    });

    fs.unlinkSync(tempEntry);
    console.log('✅ CodeMirror bundle created successfully');
    console.log(`   Output: ${outputPath}`);
  } catch (err) {
    console.error('❌ Failed to bundle CodeMirror:', err);
    try { fs.unlinkSync(tempEntry); } catch {}
    process.exit(1);
  }
}

bundle();