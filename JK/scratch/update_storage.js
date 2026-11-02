const fs = require('fs');

let content = fs.readFileSync('lib/storage.ts', 'utf8');

// Replace getProducts, getCustomers, getInvoices, getRoznamcha, getVendors
const oldChunk = `  getProducts(): Product[] {
    if (typeof window === 'undefined') return seedProducts;
    const raw = localStorage.getItem(KEYS.PRODUCTS);
    const ZERO_STOCK_APPLIED_KEY = 'jk_inventory_zero_stock_v3';
    const isZeroStockApplied = localStorage.getItem(ZERO_STOCK_APPLIED_KEY);

    if (!raw) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(seedProducts));
      localStorage.setItem(ZERO_STOCK_APPLIED_KEY, 'true');
      return seedProducts;
    }
    try {
      let parsed: Product[] = JSON.parse(raw);
      if (!isZeroStockApplied) {
        // Enforce zero stock across all products and integrate newly added seed products
        const existingMap = new Map(parsed.map((p) => [p.id, p]));
        const merged: Product[] = [];
        for (const sp of seedProducts) {
          const existing = existingMap.get(sp.id);
          if (existing) {
            merged.push({ ...sp, stock: 0 });
            existingMap.delete(sp.id);
          } else {
            merged.push({ ...sp, stock: 0 });
          }
        }
        existingMap.forEach((remaining) => {
          merged.push({ ...remaining, stock: 0 });
        });
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(merged));
        localStorage.setItem(ZERO_STOCK_APPLIED_KEY, 'true');
        return merged;
      }

      const existingIds = new Set(parsed.map((p) => p.id));
      const missing = seedProducts.filter((sp) => !existingIds.has(sp.id));
      if (missing.length > 0) {
        const merged = [...parsed, ...missing];
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(merged));
        return merged;
      }
      return parsed;
    } catch {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(seedProducts));
      localStorage.setItem(ZERO_STOCK_APPLIED_KEY, 'true');
      return seedProducts;
    }
  },

  saveProducts(products: Product[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  getCustomers(): Customer[] {
    if (typeof window === 'undefined') return seedCustomers;
    const raw = localStorage.getItem(KEYS.CUSTOMERS);
    if (!raw) {
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(seedCustomers));
      return seedCustomers;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return seedCustomers;
    }
  },

  saveCustomers(customers: Customer[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  getInvoices(): Invoice[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(KEYS.INVOICES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveInvoices(invoices: Invoice[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
  },

  getRoznamcha(): RoznamchaEntry[] {
    if (typeof window === 'undefined') return seedRoznamcha;
    const raw = localStorage.getItem(KEYS.ROZNAMCHA);
    if (!raw) {
      localStorage.setItem(KEYS.ROZNAMCHA, JSON.stringify(seedRoznamcha));
      return seedRoznamcha;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return seedRoznamcha;
    }
  },

  saveRoznamcha(entries: RoznamchaEntry[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.ROZNAMCHA, JSON.stringify(entries));
  },

  getVendors(): Vendor[] {
    if (typeof window === 'undefined') return seedVendors;
    const raw = localStorage.getItem(KEYS.VENDORS);
    if (!raw) {
      localStorage.setItem(KEYS.VENDORS, JSON.stringify(seedVendors));
      return seedVendors;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return seedVendors;
    }
  },`;

const newChunk = `  checkAndApplyCleanSlate(): void {
    if (typeof window === 'undefined') return;
    const CLEAN_KEY = 'jk_clean_slate_zero_v5';
    if (!localStorage.getItem(CLEAN_KEY)) {
      // 1. Reset customers to completely empty [] (No dummy khatedars)
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([]));
      // 2. Reset roznamcha cashbook to completely empty []
      localStorage.setItem(KEYS.ROZNAMCHA, JSON.stringify([]));
      // 3. Reset invoices history to completely empty []
      localStorage.setItem(KEYS.INVOICES, JSON.stringify([]));
      // 4. Reset vendors to empty []
      localStorage.setItem(KEYS.VENDORS, JSON.stringify([]));
      // 5. Enforce 0 stock for all inventory items
      try {
        const prodRaw = localStorage.getItem(KEYS.PRODUCTS);
        let prods: Product[] = prodRaw ? JSON.parse(prodRaw) : seedProducts;
        const zeroProds = prods.map((p) => ({ ...p, stock: 0 }));
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(zeroProds));
      } catch (e) {
        const zeroSeed = seedProducts.map((p) => ({ ...p, stock: 0 }));
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(zeroSeed));
      }
      localStorage.setItem(CLEAN_KEY, 'true');
    }
  },

  getProducts(): Product[] {
    if (typeof window === 'undefined') return seedProducts.map((p) => ({ ...p, stock: 0 }));
    this.checkAndApplyCleanSlate();
    const raw = localStorage.getItem(KEYS.PRODUCTS);
    const ZERO_STOCK_APPLIED_KEY = 'jk_inventory_zero_stock_v5';
    const isZeroStockApplied = localStorage.getItem(ZERO_STOCK_APPLIED_KEY);

    const zeroSeed = seedProducts.map((p) => ({ ...p, stock: 0 }));

    if (!raw) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(zeroSeed));
      localStorage.setItem(ZERO_STOCK_APPLIED_KEY, 'true');
      return zeroSeed;
    }
    try {
      let parsed: Product[] = JSON.parse(raw);
      if (!isZeroStockApplied) {
        // Enforce zero stock across all products and integrate newly added seed products
        const existingMap = new Map(parsed.map((p) => [p.id, p]));
        const merged: Product[] = [];
        for (const sp of zeroSeed) {
          const existing = existingMap.get(sp.id);
          if (existing) {
            merged.push({ ...sp, stock: 0 });
            existingMap.delete(sp.id);
          } else {
            merged.push({ ...sp, stock: 0 });
          }
        }
        existingMap.forEach((remaining) => {
          merged.push({ ...remaining, stock: 0 });
        });
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(merged));
        localStorage.setItem(ZERO_STOCK_APPLIED_KEY, 'true');
        return merged;
      }

      const existingIds = new Set(parsed.map((p) => p.id));
      const missing = zeroSeed.filter((sp) => !existingIds.has(sp.id));
      if (missing.length > 0) {
        const merged = [...parsed, ...missing];
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(merged));
        return merged;
      }
      return parsed;
    } catch {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(zeroSeed));
      localStorage.setItem(ZERO_STOCK_APPLIED_KEY, 'true');
      return zeroSeed;
    }
  },

  saveProducts(products: Product[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  getCustomers(): Customer[] {
    if (typeof window === 'undefined') return [];
    this.checkAndApplyCleanSlate();
    const raw = localStorage.getItem(KEYS.CUSTOMERS);
    if (!raw) {
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveCustomers(customers: Customer[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  getInvoices(): Invoice[] {
    if (typeof window === 'undefined') return [];
    this.checkAndApplyCleanSlate();
    const raw = localStorage.getItem(KEYS.INVOICES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveInvoices(invoices: Invoice[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
  },

  getRoznamcha(): RoznamchaEntry[] {
    if (typeof window === 'undefined') return [];
    this.checkAndApplyCleanSlate();
    const raw = localStorage.getItem(KEYS.ROZNAMCHA);
    if (!raw) {
      localStorage.setItem(KEYS.ROZNAMCHA, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveRoznamcha(entries: RoznamchaEntry[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.ROZNAMCHA, JSON.stringify(entries));
  },

  getVendors(): Vendor[] {
    if (typeof window === 'undefined') return [];
    this.checkAndApplyCleanSlate();
    const raw = localStorage.getItem(KEYS.VENDORS);
    if (!raw) {
      localStorage.setItem(KEYS.VENDORS, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },`;

// Normalize line endings before replace
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedOld = oldChunk.replace(/\r\n/g, '\n');
const normalizedNew = newChunk.replace(/\r\n/g, '\n');

if (!normalizedContent.includes(normalizedOld)) {
  console.error('Could not find oldChunk in lib/storage.ts!');
  process.exit(1);
}

const updated = normalizedContent.replace(normalizedOld, normalizedNew);
fs.writeFileSync('lib/storage.ts', updated, 'utf8');
console.log('Successfully updated lib/storage.ts!');
