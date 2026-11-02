const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== '.next' && f !== '.git') {
        searchDir(full);
      }
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('مینجر') || content.includes('مینیجر')) {
        console.log('Found in:', full);
        const lines = content.split('\n');
        lines.forEach((l, idx) => {
          if (l.includes('مینجر') || l.includes('مینیجر')) {
            console.log(`  Line ${idx+1}: ${l.trim().substring(0, 100)}`);
          }
        });
      }
    }
  }
}

searchDir('.');
