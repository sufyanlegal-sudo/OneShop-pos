const fs = require('fs');

const txt = fs.readFileSync('lib/seedData.ts', 'utf8');
const start = txt.indexOf('export const seedProducts: Product[] = [');
const end = txt.indexOf('export const seedCustomers: Customer[] = [');

if (start === -1 || end === -1) {
  console.error('Bounds not found!');
  process.exit(1);
}

const before = txt.substring(0, start);
const after = txt.substring(end);

const replacement = `import seedProductsJson from '@/data/seedProducts.json';\n\nexport const seedProducts: Product[] = seedProductsJson as Product[];\n\n`;

const newContent = before + replacement + after;
fs.writeFileSync('lib/seedData.ts', newContent, 'utf8');
console.log('Successfully updated lib/seedData.ts with 9000 products from JSON!');
