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

export const storage = {
  getActivePreset(): BusinessPresetType {
    if (typeof window === 'undefined') return 'karyana';
    return (localStorage.getItem(KEYS.ACTIVE_PRESET) as BusinessPresetType) || 'karyana';
  },

  setActivePreset(preset: BusinessPresetType): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.ACTIVE_PRESET, preset);
  },

  getProfiles(): Record<string, BusinessProfile> {
    if (typeof window === 'undefined') return defaultBusinessProfiles;
    const raw = localStorage.getItem(KEYS.PROFILES);
    if (!raw) {
      localStorage.setItem(KEYS.PROFILES, JSON.stringify(defaultBusinessProfiles));
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
        localStorage.setItem(KEYS.PROFILES, JSON.stringify(parsed));
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
    localStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles));
  },

  checkAndApplyCleanSlate(): void {
    if (typeof window === 'undefined') return;
    const CLEAN_KEY = 'jk_clean_slate_zero_v6';
    if (!localStorage.getItem(CLEAN_KEY)) {
      // 1. Reset customers to completely empty [] (No dummy khatedars)
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([]));
      // 2. Reset roznamcha cashbook to completely empty []
      localStorage.setItem(KEYS.ROZNAMCHA, JSON.stringify([]));
      // 3. Reset invoices history to completely empty []
      localStorage.setItem(KEYS.INVOICES, JSON.stringify([]));
      // 4. Reset vendors to empty []
      localStorage.setItem(KEYS.VENDORS, JSON.stringify([]));
      // 5. Enforce 0 stock for the expanded 9000+ item catalog
      const zeroSeed = seedProducts.map((p) => ({ ...p, stock: 0 }));
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(zeroSeed));
      localStorage.setItem(CLEAN_KEY, 'true');
    }
  },

  getProducts(): Product[] {
    if (typeof window === 'undefined') return seedProducts.map((p) => ({ ...p, stock: 0 }));
    this.checkAndApplyCleanSlate();
    const raw = localStorage.getItem(KEYS.PRODUCTS);
    const ZERO_STOCK_APPLIED_KEY = 'jk_inventory_zero_stock_v6';
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
  },

  saveVendors(vendors: Vendor[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.VENDORS, JSON.stringify(vendors));
  },

  getGRNList(): GRN[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(KEYS.GRN_LIST);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveGRNList(list: GRN[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.GRN_LIST, JSON.stringify(list));
  },

  getStaffList(): Staff[] {
    if (typeof window === 'undefined') return seedStaff;
    const raw = localStorage.getItem(KEYS.STAFF_LIST);
    if (!raw) {
      localStorage.setItem(KEYS.STAFF_LIST, JSON.stringify(seedStaff));
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
    localStorage.setItem(KEYS.STAFF_LIST, JSON.stringify(staff));
  },

  getOpeningCash(): number {
    if (typeof window === 'undefined') return 5000;
    const raw = localStorage.getItem(KEYS.OPENING_CASH);
    return raw ? parseFloat(raw) : 5000;
  },

  setOpeningCash(amount: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.OPENING_CASH, amount.toString());
  },

  getActiveRole(): 'ADMIN' | 'MANAGER' | 'CASHIER' {
    if (typeof window === 'undefined') return 'ADMIN';
    const role = localStorage.getItem(KEYS.ACTIVE_ROLE);
    if (role === 'CASHIER') return 'CASHIER';
    return 'ADMIN';
  },

  setActiveRole(role: 'ADMIN' | 'MANAGER' | 'CASHIER'): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.ACTIVE_ROLE, role);
  },

  getCashiers(): CashierAccount[] {
    if (typeof window === 'undefined') return defaultCashierAccounts;
    const raw = localStorage.getItem(KEYS.CASHIERS);
    if (!raw) {
      localStorage.setItem(KEYS.CASHIERS, JSON.stringify(defaultCashierAccounts));
      return defaultCashierAccounts;
    }
    try {
      const parsed: CashierAccount[] = JSON.parse(raw);
      // Ensure at least 10 counters exist
      if (parsed.length < defaultCashierAccounts.length) {
        const existingIds = new Set(parsed.map(c => c.id));
        const missing = defaultCashierAccounts.filter(d => !existingIds.has(d.id));
        const merged = [...parsed, ...missing];
        localStorage.setItem(KEYS.CASHIERS, JSON.stringify(merged));
        return merged;
      }
      return parsed;
    } catch {
      return defaultCashierAccounts;
    }
  },

  saveCashiers(cashiers: CashierAccount[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.CASHIERS, JSON.stringify(cashiers));
  },

  getActiveCounter(): number {
    if (typeof window === 'undefined') return 1;
    const raw = localStorage.getItem(KEYS.ACTIVE_COUNTER);
    return raw ? parseInt(raw, 10) : 1;
  },

  setActiveCounter(counter: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.ACTIVE_COUNTER, counter.toString());
  },

  getActiveCashierId(): string {
    if (typeof window === 'undefined') return 'counter-1';
    return localStorage.getItem(KEYS.ACTIVE_CASHIER_ID) || 'counter-1';
  },

  setActiveCashierId(id: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.ACTIVE_CASHIER_ID, id);
  },

  getCashierPermissions(): CashierModulePermissions {
    if (typeof window === 'undefined') return defaultCashierPermissions;
    const raw = localStorage.getItem(KEYS.CASHIER_PERMISSIONS);
    if (!raw) {
      localStorage.setItem(KEYS.CASHIER_PERMISSIONS, JSON.stringify(defaultCashierPermissions));
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
    localStorage.setItem(KEYS.CASHIER_PERMISSIONS, JSON.stringify(perms));
  },

  getSaleReturns(): SaleReturn[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(KEYS.SALE_RETURNS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveSaleReturns(returns: SaleReturn[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.SALE_RETURNS, JSON.stringify(returns));
  },

  getSaleExchanges(): SaleExchange[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(KEYS.SALE_EXCHANGES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveSaleExchanges(exchanges: SaleExchange[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.SALE_EXCHANGES, JSON.stringify(exchanges));
  },

  getAuditLogs(): AuditLog[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(KEYS.AUDIT_LOGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveAuditLogs(logs: AuditLog[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(logs));
  },

  getWhatsAppOrders(): WhatsAppOrder[] {
    if (typeof window === 'undefined') return seedWhatsAppOrders;
    try {
      const data = localStorage.getItem(KEYS.WHATSAPP_ORDERS);
      return data ? JSON.parse(data) : seedWhatsAppOrders;
    } catch {
      return seedWhatsAppOrders;
    }
  },

  saveWhatsAppOrders(orders: WhatsAppOrder[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.WHATSAPP_ORDERS, JSON.stringify(orders));
  },

  resetAllData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEYS.ACTIVE_PRESET);
    localStorage.removeItem(KEYS.PROFILES);
    localStorage.removeItem(KEYS.PRODUCTS);
    localStorage.removeItem(KEYS.CUSTOMERS);
    localStorage.removeItem(KEYS.INVOICES);
    localStorage.removeItem(KEYS.ROZNAMCHA);
    localStorage.removeItem(KEYS.OPENING_CASH);
    localStorage.removeItem(KEYS.VENDORS);
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
      if (data.profiles) localStorage.setItem(KEYS.PROFILES, JSON.stringify(data.profiles));
      if (data.products) localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(data.products));
      if (data.customers) localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(data.customers));
      if (data.invoices) localStorage.setItem(KEYS.INVOICES, JSON.stringify(data.invoices));
      if (data.roznamcha) localStorage.setItem(KEYS.ROZNAMCHA, JSON.stringify(data.roznamcha));
      if (data.vendors) localStorage.setItem(KEYS.VENDORS, JSON.stringify(data.vendors));
      if (data.grnList) localStorage.setItem(KEYS.GRN_LIST, JSON.stringify(data.grnList));
      if (data.staffList) localStorage.setItem(KEYS.STAFF_LIST, JSON.stringify(data.staffList));
      if (data.saleReturns) localStorage.setItem(KEYS.SALE_RETURNS, JSON.stringify(data.saleReturns));
      if (data.saleExchanges) localStorage.setItem(KEYS.SALE_EXCHANGES, JSON.stringify(data.saleExchanges));
      if (data.auditLogs) localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(data.auditLogs));
      if (data.cashiers) localStorage.setItem(KEYS.CASHIERS, JSON.stringify(data.cashiers));
      if (data.cashierPermissions) localStorage.setItem(KEYS.CASHIER_PERMISSIONS, JSON.stringify(data.cashierPermissions));
      if (data.whatsappOrders) localStorage.setItem(KEYS.WHATSAPP_ORDERS, JSON.stringify(data.whatsappOrders));
      if (data.preset) localStorage.setItem(KEYS.ACTIVE_PRESET, data.preset);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  getUsersDB(): PosUserLicense[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(KEYS.USERS_DB);
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
    localStorage.setItem(KEYS.USERS_DB, JSON.stringify(users));
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
      localStorage.removeItem(KEYS.CURRENT_USER);
    } catch (e) {
      console.error('Session storage error', e);
    }
    return null;
  },

  setCurrentUser(email: string | null): void {
    if (typeof window === 'undefined') return;
    try {
      // Ensure localStorage is cleared so links never inherit old logged-in accounts
      localStorage.removeItem(KEYS.CURRENT_USER);
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
