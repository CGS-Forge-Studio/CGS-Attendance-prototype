const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'frontend', '.next');
const dest = path.join(__dirname, '..', '.next');

if (fs.existsSync(src)) {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.cpSync(src, dest, { recursive: true, force: true });
  console.log('✅ Copied frontend/.next to .next for Netlify root publish directory.');
} else {
  console.error('❌ Error: frontend/.next was not found to copy.');
  process.exit(1);
}


