const fs = require('fs');
const txt = fs.readFileSync('lib/seedData.ts', 'utf8');
const cats = {};
const re = /"category":\s*"([^"]+)"/g;
let match;
while ((match = re.exec(txt)) !== null) {
  cats[match[1]] = (cats[match[1]] || 0) + 1;
}
console.log('Categories & count:', JSON.stringify(cats, null, 2));

const presets = {};
const reP = /"preset":\s*"([^"]+)"/g;
while ((match = reP.exec(txt)) !== null) {
  presets[match[1]] = (presets[match[1]] || 0) + 1;
}
console.log('Presets & count:', JSON.stringify(presets, null, 2));
