import {
  BusinessProfile,
  Product,
  Customer,
  Invoice,
  RoznamchaEntry,
  BusinessPresetType,
  Vendor,
  GRN,
  Staff,
  SaleReturn,
  SaleExchange,
  AuditLog,
  CashierAccount,
  CashierModulePermissions,
  WhatsAppOrder,
  PosUserLicense,
} from '@/types';
import {
  defaultBusinessProfiles,
  seedProducts,
  seedCustomers,
  seedRoznamcha,
  seedVendors,
  seedStaff,
  defaultCashierAccounts,
  defaultCashierPermissions,
  seedWhatsAppOrders,
} from './seedData';

const KEYS = {
  ACTIVE_PRESET: 'jk_active_preset',
  PROFILES: 'jk_business_profiles',
  PRODUCTS: 'jk_products',
  PRODUCT_OVERRIDES: 'jk_product_overrides',
  CUSTOM_PRODUCTS: 'jk_custom_products',
  CUSTOMERS: 'jk_customers',
  INVOICES: 'jk_invoices',
  ROZNAMCHA: 'jk_roznamcha',
  ADMIN_PIN: 'jk_admin_pin',
  OPENING_CASH: 'jk_opening_cash',
  ACTIVE_ROLE: 'jk_active_role',
  SALE_RETURNS: 'jk_sale_returns',
  SALE_EXCHANGES: 'jk_sale_exchanges',
  AUDIT_LOGS: 'jk_audit_logs',
  VENDORS: 'jk_vendors',
  GRN_LIST: 'jk_grn_list',
  STAFF_LIST: 'jk_staff_list',
  CASHIERS: 'jk_cashiers',
  ACTIVE_COUNTER: 'jk_active_counter',
  ACTIVE_CASHIER_ID: 'jk_active_cashier_id',
  CASHIER_PERMISSIONS: 'jk_cashier_permissions',
  WHATSAPP_ORDERS: 'jk_whatsapp_orders',
  USERS_DB: 'pos_users_db',
  CURRENT_USER: 'pos_current_user',
};

export const safeStorage = {
  get(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[SafeStorage] get failed for key "${key}":`, e);
      return null;
    }
  },
  set(key: string, value: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`[SafeStorage] set failed for key "${key}":`, e);
      return false;
    }
  },
  remove(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[SafeStorage] remove failed for key "${key}":`, e);
    }
  },
};

export const storage = {
  getActivePreset(): BusinessPresetType {
    if (typeof window === 'undefined') return 'karyana';
    return (safeStorage.get(KEYS.ACTIVE_PRESET) as BusinessPresetType) || 'karyana';
  },

  setActivePreset(preset: BusinessPresetType): void {
    if (typeof window === 'undefined') return;
    safeStorage.set(KEYS.ACTIVE_PRESET, preset);
  },

  getProfiles(): Record<string, BusinessProfile> {
    if (typeof window === 'undefined') return defaultBusinessProfiles;
    const raw = safeStorage.get(KEYS.PROFILES);
    if (!raw) {
      safeStorage.set(KEYS.PROFILES, JSON.stringify(defaultBusinessProfiles));
      return defaultBusinessProfiles;
    }
    try {
      const parsed = JSON.parse(raw);
      let updated = false;
      Object.keys(defaultBusinessProfiles).forEach((k) => {
        if (!parsed[k]) {
          parsed[k] = defaultBusinessProfiles[k];
          updated = true;
        }
      });
      if (updated) {
        safeStorage.set(KEYS.PROFILES, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return defaultBusinessProfiles;
    }
  },

  saveProfile(preset: BusinessPresetType, profile: BusinessProfile): void {
    if (typeof window === 'undefined') return;
    const profiles = this.getProfiles();
    profiles[preset] = profile;
    safeStorage.set(KEYS.PROFILES, JSON.stringify(profiles));
  },

  checkAndApplyCleanSlate(): void {
    if (typeof window === 'undefined') return;
    const CLEAN_KEY = 'jk_clean_slate_zero_v8';
    if (!safeStorage.get(CLEAN_KEY)) {
      // 1. Reset customers to completely empty [] (No dummy khatedars)
      safeStorage.set(KEYS.CUSTOMERS, JSON.stringify([]));
      // 2. Reset roznamcha cashbook to completely empty []
      safeStorage.set(KEYS.ROZNAMCHA, JSON.stringify([]));
      // 3. Reset invoices history to completely empty []
      safeStorage.set(KEYS.INVOICES, JSON.stringify([]));
      // 4. Reset vendors to empty []
      safeStorage.set(KEYS.VENDORS, JSON.stringify([]));
      // 5. Reset product overrides and custom products
      safeStorage.set(KEYS.PRODUCT_OVERRIDES, JSON.stringify({}));
      safeStorage.set(KEYS.CUSTOM_PRODUCTS, JSON.stringify([]));
      // 6. Purge the legacy 4.7MB string immediately to free up browser quota
      safeStorage.remove(KEYS.PRODUCTS);
      safeStorage.set(CLEAN_KEY, 'true');
    }
  },

  getProducts(): Product[] {
    const zeroSeed = seedProducts.map((p) => ({ ...p, stock: 0 }));
    if (typeof window === 'undefined') return zeroSeed;
    this.checkAndApplyCleanSlate();

    const rawOverrides = safeStorage.get(KEYS.PRODUCT_OVERRIDES);
    const rawCustom = safeStorage.get(KEYS.CUSTOM_PRODUCTS);
    const rawLegacy = safeStorage.get(KEYS.PRODUCTS);

    let overrides: Record<string, Partial<Product>> = {};
    let customProducts: Product[] = [];

    if (rawOverrides) {
      try {
        overrides = JSON.parse(rawOverrides);
      } catch {}
    }
    if (rawCustom) {
      try {
        customProducts = JSON.parse(rawCustom);
      } catch {}
    }

    // Migrate from legacy raw products string if exists and overrides not yet created
    if (rawLegacy && Object.keys(overrides).length === 0 && customProducts.length === 0) {
      try {
        const legacyParsed: Product[] = JSON.parse(rawLegacy);
        this.saveProducts(legacyParsed);
        safeStorage.remove(KEYS.PRODUCTS);
        return legacyParsed;
      } catch {}
    }

    // Purge legacy massive raw string to permanently protect quota
    safeStorage.remove(KEYS.PRODUCTS);

    const baseProducts: Product[] = zeroSeed.map((p) => {
      const ov = overrides[p.id];
      if (ov) {
        return { ...p, ...ov };
      }
      return p;
    });

    return [...baseProducts, ...customProducts];
  },

  saveProducts(products: Product[]): void {
    if (typeof window === 'undefined') return;

    const seedMap = new Map(seedProducts.map((p) => [p.id, p]));
    const overrides: Record<string, Partial<Product>> = {};
    const customProducts: Product[] = [];

    for (const p of products) {
      const sp = seedMap.get(p.id);
      if (sp) {
        const diff: Partial<Product> = {};
        let changed = false;
        if (p.stock !== sp.stock) { diff.stock = p.stock; changed = true; }
        if (p.costPrice !== sp.costPrice) { diff.costPrice = p.costPrice; changed = true; }
        if (p.salePrice !== sp.salePrice) { diff.salePrice = p.salePrice; changed = true; }
        if (p.minStockAlert !== sp.minStockAlert) { diff.minStockAlert = p.minStockAlert; changed = true; }
        if (p.nameUr !== sp.nameUr) { diff.nameUr = p.nameUr; changed = true; }
        if (p.nameEn !== sp.nameEn) { diff.nameEn = p.nameEn; changed = true; }
        if (p.barcode !== sp.barcode) { diff.barcode = p.barcode; changed = true; }
        if (p.sku !== sp.sku) { diff.sku = p.sku; changed = true; }
        if (p.image !== sp.image) { diff.image = p.image; changed = true; }
        if (changed) {
          overrides[p.id] = diff;
        }
      } else {
        customProducts.push(p);
      }
    }

    safeStorage.set(KEYS.PRODUCT_OVERRIDES, JSON.stringify(overrides));
    safeStorage.set(KEYS.CUSTOM_PRODUCTS, JSON.stringify(customProducts));
    // Always purge the massive legacy string
    safeStorage.remove(KEYS.PRODUCTS);
  },

  getCustomers(): Customer[] {
    if (typeof window === 'undefined') return [];
    this.checkAndApplyCleanSlate();
    const raw = safeStorage.get(KEYS.CUSTOMERS);
    if (!raw) {
      safeStorage.set(KEYS.CUSTOMERS, JSON.stringify([]));
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
    safeStorage.set(KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  getInvoices(): Invoice[] {
    if (typeof window === 'undefined') return [];
    this.checkAndApplyCleanSlate();
    const raw = safeStorage.get(KEYS.INVOICES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveInvoices(invoices: Invoice[]): void {
    if (typeof window === 'undefined') return;
    safeStorage.set(KEYS.INVOICES, JSON.stringify(invoices));
  },

  getRoznamcha(): RoznamchaEntry[] {
    if (typeof window === 'undefined') return [];
    this.checkAndApplyCleanSlate();
    const raw = safeStorage.get(KEYS.ROZNAMCHA);
    if (!raw) {
      safeStorage.set(KEYS.ROZNAMCHA, JSON.stringify([]));
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
    safeStorage.set(KEYS.ROZNAMCHA, JSON.stringify(entries));
  },

  getVendors(): Vendor[] {
    if (typeof window === 'undefined') return [];
    this.checkAndApplyCleanSlate();
    const raw = safeStorage.get(KEYS.VENDORS);
    if (!raw) {
      safeStorage.set(KEYS.VENDORS, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveVendors(vendors: Vendor[]): void {
    if (typeof window === 'undefined') return;
    safeStorage.set(KEYS.VENDORS, JSON.stringify(vendors));
  },

  getGRNList(): GRN[] {
    if (typeof window === 'undefined') return [];
    const raw = safeStorage.get(KEYS.GRN_LIST);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveGRNList(list: GRN[]): void {
    if (typeof window === 'undefined') return;
    safeStorage.set(KEYS.GRN_LIST, JSON.stringify(list));
  },

  getStaffList(): Staff[] {
    if (typeof window === 'undefined') return seedStaff;
    const raw = safeStorage.get(KEYS.STAFF_LIST);
    if (!raw) {
      safeStorage.set(KEYS.STAFF_LIST, JSON.stringify(seedStaff));
      return seedStaff;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return seedStaff;
    }
  },

  saveStaffList(staff: Staff[]): void {
    if (typeof window === 'undefined') return;
    safeStorage.set(KEYS.STAFF_LIST, JSON.stringify(staff));
  },

  getOpeningCash(): number {
    if (typeof window === 'undefined') return 5000;
    const raw = safeStorage.get(KEYS.OPENING_CASH);
    return raw ? parseFloat(raw) : 5000;
  },

  setOpeningCash(amount: number): void {
    if (typeof window === 'undefined') return;
    safeStorage.set(KEYS.OPENING_CASH, amount.toString());
  },

  getActiveRole(): 'ADMIN' | 'MANAGER' | 'CASHIER' {
    if (typeof window === 'undefined') return 'ADMIN';
    const role = safeStorage.get(KEYS.ACTIVE_ROLE);
    if (role === 'CASHIER') return 'CASHIER';
    return 'ADMIN';
  },

  setActiveRole(role: 'ADMIN' | 'MANAGER' | 'CASHIER'): void {
    if (typeof window === 'undefined') return;
    safeStorage.set(KEYS.ACTIVE_ROLE, role);
  },

  getCashiers(): CashierAccount[] {
    if (typeof window === 'undefined') return defaultCashierAccounts;
    const raw = safeStorage.get(KEYS.CASHIERS);
    if (!raw) {
      safeStorage.set(KEYS.CASHIERS, JSON.stringify(defaultCashierAccounts));
      return defaultCashierAccounts;
    }
    try {
      const parsed: CashierAccount[] = JSON.parse(raw);
      // Ensure at least 10 counters exist
      if (parsed.length < defaultCashierAccounts.length) {
        const existingIds = new Set(parsed.map(c => c.id));
        const missing = defaultCashierAccounts.filter(d => !existingIds.has(d.id));
        const merged = [...parsed, ...missing];
        safeStorage.set(KEYS.CASHIERS, JSON.stringify(merged));
        return merged;
      }
      return parsed;
    } catch {
      return defaultCashierAccounts;
    }
  },

  saveCashiers(cashiers: CashierAccount[]): void {
    if (typeof window === 'undefined') return;
    safeStorage.set(KEYS.CASHIERS, JSON.stringify(cashiers));
  },

  getActiveCounter(): number {
    if (typeof window === 'undefined') return 1;
    const raw = safeStorage.get(KEYS.ACTIVE_COUNTER);
    return raw ? parseInt(raw, 10) : 1;
  },

  setActiveCounter(counter: number): void {
    if (typeof window === 'undefined') return;
    safeStorage.set(KEYS.ACTIVE_COUNTER, counter.toString());
  },

  getActiveCashierId(): string {
    if (typeof window === 'undefined') return 'counter-1';
    return safeStorage.get(KEYS.ACTIVE_CASHIER_ID) || 'counter-1';
  },

  setActiveCashierId(id: string): void {
    if (typeof window === 'undefined') return;
    safeStorage.set(KEYS.ACTIVE_CASHIER_ID, id);
  },

  getCashierPermissions(): CashierModulePermissions {
    if (typeof window === 'undefined') return defaultCashierPermissions;
    const raw = safeStorage.get(KEYS.CASHIER_PERMISSIONS);
    if (!raw) {
      safeStorage.set(KEYS.CASHIER_PERMISSIONS, JSON.stringify(defaultCashierPermissions));
      return defaultCashierPermissions;
    }
    try {
      return { ...defaultCashierPermissions, ...JSON.parse(raw) };
    } catch {
      return defaultCashierPermissions;
    }
  },

  saveCashierPermissions(perms: CashierModulePermissions): void {
    if (typeof window === 'undefined') return;
    safeStorage.set(KEYS.CASHIER_PERMISSIONS, JSON.stringify(perms));
  },

  getSaleReturns(): SaleReturn[] {
    if (typeof window === 'undefined') return [];
    const raw = safeStorage.get(KEYS.SALE_RETURNS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveSaleReturns(returns: SaleReturn[]): void {
    if (typeof window === 'undefined') return;
    safeStorage.set(KEYS.SALE_RETURNS, JSON.stringify(returns));
  },

  getSaleExchanges(): SaleExchange[] {
    if (typeof window === 'undefined') return [];
    const raw = safeStorage.get(KEYS.SALE_EXCHANGES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveSaleExchanges(exchanges: SaleExchange[]): void {
    if (typeof window === 'undefined') return;
    safeStorage.set(KEYS.SALE_EXCHANGES, JSON.stringify(exchanges));
  },

  getAuditLogs(): AuditLog[] {
    if (typeof window === 'undefined') return [];
    const raw = safeStorage.get(KEYS.AUDIT_LOGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveAuditLogs(logs: AuditLog[]): void {
    if (typeof window === 'undefined') return;
    safeStorage.set(KEYS.AUDIT_LOGS, JSON.stringify(logs));
  },

  getWhatsAppOrders(): WhatsAppOrder[] {
    if (typeof window === 'undefined') return seedWhatsAppOrders;
    try {
      const data = safeStorage.get(KEYS.WHATSAPP_ORDERS);
      return data ? JSON.parse(data) : seedWhatsAppOrders;
    } catch {
      return seedWhatsAppOrders;
    }
  },

  saveWhatsAppOrders(orders: WhatsAppOrder[]): void {
    if (typeof window === 'undefined') return;
    safeStorage.set(KEYS.WHATSAPP_ORDERS, JSON.stringify(orders));
  },

  resetAllData(): void {
    if (typeof window === 'undefined') return;
    safeStorage.remove(KEYS.ACTIVE_PRESET);
    safeStorage.remove(KEYS.PROFILES);
    safeStorage.remove(KEYS.PRODUCTS);
    safeStorage.remove(KEYS.PRODUCT_OVERRIDES);
    safeStorage.remove(KEYS.CUSTOM_PRODUCTS);
    safeStorage.remove(KEYS.CUSTOMERS);
    safeStorage.remove(KEYS.INVOICES);
    safeStorage.remove(KEYS.ROZNAMCHA);
    safeStorage.remove(KEYS.OPENING_CASH);
    safeStorage.remove(KEYS.VENDORS);
    localStorage.removeItem(KEYS.GRN_LIST);
    localStorage.removeItem(KEYS.STAFF_LIST);
    localStorage.removeItem(KEYS.SALE_RETURNS);
    localStorage.removeItem(KEYS.AUDIT_LOGS);
    localStorage.removeItem(KEYS.CASHIERS);
    localStorage.removeItem(KEYS.CASHIER_PERMISSIONS);
    localStorage.removeItem(KEYS.WHATSAPP_ORDERS);
  },

  exportBackup(): string {
    const data = {
      app: 'OneShop POS',
      developer: 'JK Developers Pakistan',
      developerPhone: '03008998381',
      preset: this.getActivePreset(),
      profiles: this.getProfiles(),
      products: this.getProducts(),
      customers: this.getCustomers(),
      invoices: this.getInvoices(),
      roznamcha: this.getRoznamcha(),
      vendors: this.getVendors(),
      grnList: this.getGRNList(),
      staffList: this.getStaffList(),
      saleReturns: this.getSaleReturns(),
      saleExchanges: this.getSaleExchanges(),
      auditLogs: this.getAuditLogs(),
      cashiers: this.getCashiers(),
      cashierPermissions: this.getCashierPermissions(),
      whatsappOrders: this.getWhatsAppOrders(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },

  importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.profiles) safeStorage.set(KEYS.PROFILES, JSON.stringify(data.profiles));
      if (data.products) this.saveProducts(data.products);
      if (data.customers) safeStorage.set(KEYS.CUSTOMERS, JSON.stringify(data.customers));
      if (data.invoices) safeStorage.set(KEYS.INVOICES, JSON.stringify(data.invoices));
      if (data.roznamcha) safeStorage.set(KEYS.ROZNAMCHA, JSON.stringify(data.roznamcha));
      if (data.vendors) safeStorage.set(KEYS.VENDORS, JSON.stringify(data.vendors));
      if (data.grnList) safeStorage.set(KEYS.GRN_LIST, JSON.stringify(data.grnList));
      if (data.staffList) safeStorage.set(KEYS.STAFF_LIST, JSON.stringify(data.staffList));
      if (data.saleReturns) safeStorage.set(KEYS.SALE_RETURNS, JSON.stringify(data.saleReturns));
      if (data.saleExchanges) safeStorage.set(KEYS.SALE_EXCHANGES, JSON.stringify(data.saleExchanges));
      if (data.auditLogs) safeStorage.set(KEYS.AUDIT_LOGS, JSON.stringify(data.auditLogs));
      if (data.cashiers) safeStorage.set(KEYS.CASHIERS, JSON.stringify(data.cashiers));
      if (data.cashierPermissions) safeStorage.set(KEYS.CASHIER_PERMISSIONS, JSON.stringify(data.cashierPermissions));
      if (data.whatsappOrders) safeStorage.set(KEYS.WHATSAPP_ORDERS, JSON.stringify(data.whatsappOrders));
      if (data.preset) safeStorage.set(KEYS.ACTIVE_PRESET, data.preset);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  getUsersDB(): PosUserLicense[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = safeStorage.get(KEYS.USERS_DB);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load users DB', e);
    }
    return [
      {
        email: 'jkdevelopers.pk@gmail.com',
        name: 'JK Developers Pakistan (Admin)',
        businessName: 'JK Developers Pakistan',
        phone: '0300-8998381',
        password: 'JK@8998381',
        approved: true,
        registeredAt: '2026-01-01',
      },
    ];
  },

  saveUsersDB(users: PosUserLicense[]): void {
    if (typeof window === 'undefined') return;
    safeStorage.set(KEYS.USERS_DB, JSON.stringify(users));
  },

  getCurrentUser(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      // Use sessionStorage so opening a new link, sending link to another person,
      // or opening in a new tab will NEVER auto-log in!
      const sess = sessionStorage.getItem(KEYS.CURRENT_USER);
      if (sess) {
        try {
          return JSON.parse(sess);
        } catch {
          return sess;
        }
      }
      // Also clean up any legacy persistent localStorage login key
      safeStorage.remove(KEYS.CURRENT_USER);
    } catch (e) {
      console.error('Session storage error', e);
    }
    return null;
  },

  setCurrentUser(email: string | null): void {
    if (typeof window === 'undefined') return;
    try {
      // Ensure localStorage is cleared so links never inherit old logged-in accounts
      safeStorage.remove(KEYS.CURRENT_USER);
      if (!email) {
        sessionStorage.removeItem(KEYS.CURRENT_USER);
      } else {
        sessionStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(email));
      }
    } catch (e) {
      console.error('Failed to set current user session', e);
    }
  },
};
