const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'frontend', '.next');
const dest = path.join(__dirname, '..', '.next');

if (fs.existsSync(src)) {
  fs.cpSync(src, dest, { recursive: true, force: true });
  console.log('✅ Copied frontend/.next to .next for Netlify root publish directory.');
} else {
  console.warn('⚠️ Warning: frontend/.next was not found to copy.');
}
