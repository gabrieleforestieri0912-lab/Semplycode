const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceDir = path.join(__dirname, '..', 'chrome-extension');
const destDir = path.join(__dirname, '..', 'dist', 'extension');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  console.log('📦 Building CodeMirror bundle...');
  execSync('node scripts/bundle-codemirror.js', { stdio: 'inherit' });

  console.log('📁 Building extension...');
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }

  copyRecursiveSync(sourceDir, destDir);

  console.log('✅ Extension built successfully to dist/extension');
} catch (error) {
  console.error('❌ Failed to build extension:', error);
  process.exit(1);
}
