const fs = require('fs');

let content = fs.readFileSync('lib/storage.ts', 'utf8');
content = content.replace(/'jk_clean_slate_zero_v5'/g, "'jk_clean_slate_zero_v6'");
content = content.replace(/'jk_inventory_zero_stock_v5'/g, "'jk_inventory_zero_stock_v6'");

// In checkAndApplyCleanSlate, ensure products are reset to the new seedProducts with stock: 0
const target = `      // 5. Enforce 0 stock for all inventory items
      try {
        const prodRaw = localStorage.getItem(KEYS.PRODUCTS);
        let prods: Product[] = prodRaw ? JSON.parse(prodRaw) : seedProducts;
        const zeroProds = prods.map((p) => ({ ...p, stock: 0 }));
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(zeroProds));
      } catch (e) {
        const zeroSeed = seedProducts.map((p) => ({ ...p, stock: 0 }));
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(zeroSeed));
      }`;

const replacement = `      // 5. Enforce 0 stock for the expanded 9000+ item catalog
      const zeroSeed = seedProducts.map((p) => ({ ...p, stock: 0 }));
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(zeroSeed));`;

const normContent = content.replace(/\r\n/g, '\n');
const normTarget = target.replace(/\r\n/g, '\n');
const normReplacement = replacement.replace(/\r\n/g, '\n');

if (normContent.includes(normTarget)) {
  const updated = normContent.replace(normTarget, normReplacement);
  fs.writeFileSync('lib/storage.ts', updated, 'utf8');
  console.log('Successfully updated lib/storage.ts to v6!');
} else {
  console.error('Target not found in lib/storage.ts');
  process.exit(1);
}
