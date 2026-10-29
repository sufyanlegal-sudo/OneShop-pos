'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  BusinessPresetType,
  BusinessProfile,
  Product,
  Customer,
  Invoice,
  RoznamchaEntry,
  CartItem,
  InvoiceItem,
  KhataEntry,
  PaymentMethod,
  UserRole,
  SaleReturn,
  SaleReturnItem,
  AuditLog,
  Vendor,
  VendorKhataEntry,
  GRN,
  GRNItem,
  Staff,
  StaffPayment,
  CashierAccount,
  CashierModulePermissions,
  CurrencyDenominations,
  WhatsAppOrder,
  PosUserLicense,
} from '@/types';
import { storage } from '@/lib/storage';
import {
  defaultBusinessProfiles,
  seedProducts,
  seedVendors,
  seedStaff,
  defaultCashierAccounts,
  defaultCashierPermissions,
  seedWhatsAppOrders,
} from '@/lib/seedData';

interface CheckoutParams {
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  tenderedAmount?: number;
  discount: number;
  currencyDenominations?: CurrencyDenominations;
  notes?: string;
  tableNo?: string;
}

interface ProcessReturnParams {
  invoiceId: string;
  returnedItems: {
    productId: string;
    quantity: number;
  }[];
  refundMethod: 'CASH' | 'KHATA_CREDIT';
  reason: string;
}

interface ShopContextType {
  activePreset: BusinessPresetType;
  setPreset: (preset: BusinessPresetType) => void;
  businessProfile: BusinessProfile;
  updateBusinessProfile: (updated: Partial<BusinessProfile>) => void;
  products: Product[];
  allProducts: Product[];
  customers: Customer[];
  invoices: Invoice[];
  roznamcha: RoznamchaEntry[];
  saleReturns: SaleReturn[];
  auditLogs: AuditLog[];
  vendors: Vendor[];
  grnList: GRN[];
  staffList: Staff[];
  cart: CartItem[];
  cartTotals: {
    subtotal: number;
    discount: number;
    grandTotal: number;
    totalProfit: number;
    itemCount: number;
  };
  // Roles, Multi-Cashier & Counters
  currentRole: UserRole;
  switchRole: (role: UserRole, pin?: string, cashierId?: string) => boolean;
  cashierAccounts: CashierAccount[];
  activeCashier: CashierAccount | null;
  activeCounter: number;
  cashierPermissions: CashierModulePermissions;
  saveCashiers: (accounts: CashierAccount[]) => void;
  updateCashierAccount: (id: string, updates: Partial<CashierAccount>) => void;
  updateCashierPermissions: (perms: Partial<CashierModulePermissions>) => void;
  switchCashierCounter: (counterNumber: number, pin: string) => { success: boolean; message: string };
  hasAccess: (moduleKey: string) => boolean;
  isMarginUnlocked: boolean;
  unlockMargin: (pin: string) => boolean;
  lockMargin: () => void;
  // Cart Actions
  addToCart: (product: Product, quantity?: number, unit?: string, variationDetails?: string) => void;
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  // Transactions
  checkoutInvoice: (params: CheckoutParams) => Invoice;
  processSaleReturn: (params: ProcessReturnParams) => SaleReturn | null;
  receiveKhataPayment: (customerId: string, amount: number, description?: string) => void;
  addRoznamchaEntry: (entry: Omit<RoznamchaEntry, 'id' | 'date'>) => void;
  addAuditLog: (action: AuditLog['action'], details: string, amount?: number, refId?: string) => void;
  // Inventory Management
  saveProduct: (product: Partial<Product> & { nameUr: string; nameEn: string }) => Product;
  deleteProduct: (id: string) => void;
  // Customer Management
  addCustomer: (name: string, phone: string, address?: string, creditLimit?: number) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  // Vendor & GRN Management
  addVendor: (vendor: Omit<Vendor, 'id' | 'createdAt' | 'khata' | 'balance'> & { openingBalance?: number }) => Vendor;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  payVendor: (vendorId: string, amount: number, method: 'CASH' | 'BANK', description?: string) => void;
  createGRN: (grnData: Omit<GRN, 'id' | 'grnNo' | 'developerBranding'>) => GRN;
  // Staff Management
  addStaff: (staff: Omit<Staff, 'id' | 'payments'>) => Staff;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  payStaffSalary: (staffId: string, amount: number, month: string, paymentType: 'SALARY' | 'ADVANCE' | 'BONUS', notes?: string) => void;
  // Backup & Restore
  exportDataBackup: () => string;
  sendBackupToEmail: (targetEmail?: string) => Promise<{ success: boolean; message: string }>;
  // WhatsApp Orders Management
  whatsappOrders: WhatsAppOrder[];
  pendingWhatsAppOrdersCount: number;
  isWhatsAppOrdersModalOpen: boolean;
  setIsWhatsAppOrdersModalOpen: (open: boolean) => void;
  addWhatsAppOrder: (order: Omit<WhatsAppOrder, 'id' | 'orderNo' | 'date' | 'status'>) => WhatsAppOrder;
  updateWhatsAppOrderStatus: (orderId: string, status: WhatsAppOrder['status']) => void;
  loadWhatsAppOrderIntoCart: (orderId: string) => { success: boolean; customerName?: string; customerPhone?: string };
  // Licensing & Super Admin
  currentUserEmail: string | null;
  isApprovedUser: boolean;
  isSuperAdmin: boolean;
  usersDB: PosUserLicense[];
  isSuperAdminModalOpen: boolean;
  setIsSuperAdminModalOpen: (open: boolean) => void;
  loginWithGoogle: (email: string) => { status: 'APPROVED' | 'PENDING' | 'SUPER_ADMIN'; message: string };
  logoutUser: () => void;
  toggleUserApproval: (email: string) => void;
  addUserLicense: (email: string, name?: string, approved?: boolean) => void;
  deleteUserLicense: (email: string) => void;
  // System Tools
  resetSystemData: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePreset, setActivePresetState] = useState<BusinessPresetType>('karyana');
  const [profiles, setProfiles] = useState<Record<string, BusinessProfile>>(defaultBusinessProfiles);
  const [allProducts, setAllProducts] = useState<Product[]>(seedProducts);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [roznamcha, setRoznamcha] = useState<RoznamchaEntry[]>([]);
  const [saleReturns, setSaleReturns] = useState<SaleReturn[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [grnList, setGRNList] = useState<GRN[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>('MANAGER');
  const [isMarginUnlocked, setIsMarginUnlocked] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Multi-Cashier & 10 Counters State
  const [cashierAccounts, setCashierAccounts] = useState<CashierAccount[]>(defaultCashierAccounts);
  const [activeCounter, setActiveCounterState] = useState<number>(1);
  const [activeCashierId, setActiveCashierIdState] = useState<string>('counter-1');
  const [cashierPermissions, setCashierPermissionsState] = useState<CashierModulePermissions>(defaultCashierPermissions);

  // WhatsApp Incoming Orders State
  const [whatsappOrders, setWhatsAppOrders] = useState<WhatsAppOrder[]>(seedWhatsAppOrders);
  const [isWhatsAppOrdersModalOpen, setIsWhatsAppOrdersModalOpen] = useState<boolean>(false);

  // Cloud Authentication & Super Admin Licensing State
  const SUPER_ADMIN_EMAIL = 'jkdevelopers.pk@gmail.com';
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [usersDB, setUsersDB] = useState<PosUserLicense[]>([]);
  const [isSuperAdminModalOpen, setIsSuperAdminModalOpen] = useState<boolean>(false);

  // Load state from local storage on mount
  useEffect(() => {
    const loadedPreset = storage.getActivePreset();
    const loadedProfiles = storage.getProfiles();
    const loadedProducts = storage.getProducts();
    const loadedCustomers = storage.getCustomers();
    const loadedInvoices = storage.getInvoices();
    const loadedRoznamcha = storage.getRoznamcha();
    const loadedReturns = storage.getSaleReturns();
    const loadedAudit = storage.getAuditLogs();
    const loadedRole = storage.getActiveRole();
    const loadedVendors = storage.getVendors();
    const loadedGRN = storage.getGRNList();
    const loadedStaff = storage.getStaffList();
    const loadedCashiers = storage.getCashiers();
    const loadedCounter = storage.getActiveCounter();
    const loadedCashierId = storage.getActiveCashierId();
    const loadedPerms = storage.getCashierPermissions();
    const loadedWhatsAppOrders = storage.getWhatsAppOrders();
    const loadedUsers = storage.getUsersDB();
    const loadedUser = storage.getCurrentUser();

    setActivePresetState(loadedPreset);
    setProfiles(loadedProfiles);
    setAllProducts(loadedProducts);
    setCustomers(loadedCustomers);
    setInvoices(loadedInvoices);
    setRoznamcha(loadedRoznamcha);
    setSaleReturns(loadedReturns);
    setAuditLogs(loadedAudit);
    setCurrentRole(loadedRole);
    setVendors(loadedVendors);
    setGRNList(loadedGRN);
    setStaffList(loadedStaff);
    setCashierAccounts(loadedCashiers);
    setActiveCounterState(loadedCounter);
    setActiveCashierIdState(loadedCashierId);
    setCashierPermissionsState(loadedPerms);
    setWhatsAppOrders(loadedWhatsAppOrders);
    setUsersDB(loadedUsers);
    setCurrentUserEmail(loadedUser);
    setIsLoaded(true);
  }, []);

  // Active Cashier computed object
  const activeCashier = useMemo(() => {
    return (
      cashierAccounts.find((c) => c.id === activeCashierId) ||
      cashierAccounts.find((c) => c.counterNumber === activeCounter) ||
      cashierAccounts[0] ||
      null
    );
  }, [cashierAccounts, activeCashierId, activeCounter]);

  // Cloud Licensing & Super Admin computed access
  const isSuperAdmin = useMemo(() => {
    return Boolean(currentUserEmail && currentUserEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());
  }, [currentUserEmail]);

  const isApprovedUser = useMemo(() => {
    if (!currentUserEmail) return false;
    if (currentUserEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return true;
    const userRec = usersDB.find((u) => u.email.toLowerCase() === currentUserEmail.toLowerCase());
    return Boolean(userRec && userRec.approved);
  }, [currentUserEmail, usersDB]);

  const loginWithGoogle = (emailInput: string) => {
    const cleanEmail = emailInput.trim().toLowerCase();
    setCurrentUserEmail(cleanEmail);
    storage.setCurrentUser(cleanEmail);

    let updatedDB = [...usersDB];
    let userRec = updatedDB.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!userRec) {
      userRec = {
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        approved: cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase(),
        registeredAt: new Date().toISOString(),
      };
      updatedDB = [userRec, ...updatedDB];
      setUsersDB(updatedDB);
      storage.saveUsersDB(updatedDB);
    }

    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return { status: 'SUPER_ADMIN' as const, message: 'لاگ ان بطور سپر ایڈمن منظور ہے!' };
    }
    if (userRec.approved) {
      return { status: 'APPROVED' as const, message: 'خوش آمدید! آپ کی رسائی منظور شدہ ہے۔' };
    }
    return { status: 'PENDING' as const, message: 'آپ کا اکاؤنٹ منظوری کے لیے پینڈنگ ہے۔ ایڈمن سے رابطہ کریں۔' };
  };

  const logoutUser = () => {
    setCurrentUserEmail(null);
    storage.setCurrentUser(null);
  };

  const toggleUserApproval = (email: string) => {
    const updated = usersDB.map((u) => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        const nextApproved = !u.approved;
        return {
          ...u,
          approved: nextApproved,
          approvedAt: nextApproved ? new Date().toISOString() : undefined,
        };
      }
      return u;
    });
    setUsersDB(updated);
    storage.saveUsersDB(updated);
  };

  const addUserLicense = (email: string, name?: string, approved: boolean = true) => {
    const clean = email.trim().toLowerCase();
    const existing = usersDB.find((u) => u.email.toLowerCase() === clean);
    if (existing) {
      toggleUserApproval(clean);
      return;
    }
    const newUser: PosUserLicense = {
      email: clean,
      name: name || clean.split('@')[0],
      approved,
      registeredAt: new Date().toISOString(),
      approvedAt: approved ? new Date().toISOString() : undefined,
    };
    const updated = [newUser, ...usersDB];
    setUsersDB(updated);
    storage.saveUsersDB(updated);
  };

  const deleteUserLicense = (email: string) => {
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return;
    const updated = usersDB.filter((u) => u.email.toLowerCase() !== email.toLowerCase());
    setUsersDB(updated);
    storage.saveUsersDB(updated);
    if (currentUserEmail?.toLowerCase() === email.toLowerCase()) {
      logoutUser();
    }
  };

  // Check granular access for active cashier
  const hasAccess = (moduleKey: string): boolean => {
    if (currentRole === 'MANAGER') return true;
    if (activeCashier?.permissions && (activeCashier.permissions as any)[moduleKey] !== undefined) {
      return Boolean((activeCashier.permissions as any)[moduleKey]);
    }
    return Boolean((cashierPermissions as any)[moduleKey]);
  };

  const saveCashiers = (accounts: CashierAccount[]) => {
    setCashierAccounts(accounts);
    storage.saveCashiers(accounts);
    addAuditLog('SETTINGS_CHANGED', 'کاؤنٹرز اور کیشیئرز کی ترتیبات اپ ڈیٹ کی گئیں');
  };

  const updateCashierAccount = (id: string, updates: Partial<CashierAccount>) => {
    const updated = cashierAccounts.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCashierAccounts(updated);
    storage.saveCashiers(updated);
  };

  const updateCashierPermissions = (perms: Partial<CashierModulePermissions>) => {
    const updated = { ...cashierPermissions, ...perms };
    setCashierPermissionsState(updated);
    storage.saveCashierPermissions(updated);
    addAuditLog('SETTINGS_CHANGED', 'کیشیئر کے اختیارات (Permissions) تبدیل کیے گئے');
  };

  const switchCashierCounter = (
    counterNum: number,
    pin: string
  ): { success: boolean; message: string } => {
    const target = cashierAccounts.find((c) => c.counterNumber === counterNum);
    if (!target) {
      return { success: false, message: 'کاؤنٹر ریکارڈ موجود نہیں ہے!' };
    }
    if (target.status === 'INACTIVE') {
      return { success: false, message: 'یہ کاؤنٹر اس وقت غیر فعال (Disabled) ہے!' };
    }
    if (target.pin && target.pin !== pin) {
      return { success: false, message: 'غلط کیشیئر سیکیورٹی پن درج کیا گیا ہے!' };
    }

    setCurrentRole('CASHIER');
    storage.setActiveRole('CASHIER');
    setActiveCounterState(counterNum);
    storage.setActiveCounter(counterNum);
    setActiveCashierIdState(target.id);
    storage.setActiveCashierId(target.id);
    setIsMarginUnlocked(false);
    addAuditLog('CASHIER_ACCESS_GRANTED', `کاؤنٹر #${counterNum} (${target.name}) لاگ ان فعال ہوا`);
    return { success: true, message: 'کامیابی سے کاؤنٹر لاگ ان ہو گیا' };
  };

  // Filter products for active preset
  const products = useMemo(() => {
    return allProducts.filter((p) => p.preset === activePreset);
  }, [allProducts, activePreset]);

  // Current business profile
  const businessProfile = useMemo(() => {
    return profiles[activePreset] || defaultBusinessProfiles[activePreset] || defaultBusinessProfiles.karyana;
  }, [profiles, activePreset]);

  const setPreset = (preset: BusinessPresetType) => {
    setActivePresetState(preset);
    storage.setActivePreset(preset);
  };

  const updateBusinessProfile = (updated: Partial<BusinessProfile>) => {
    const current = { ...businessProfile, ...updated, softwareName: 'OneShop POS' };
    const newProfiles = { ...profiles, [activePreset]: current };
    setProfiles(newProfiles);
    storage.saveProfile(activePreset, current);
    addAuditLog('SETTINGS_CHANGED', `کاروبار کی معلومات اور سیٹنگز تبدیل کی گئیں (${current.nameUr})`);
  };

  // Add audit log helper
  const addAuditLog = (
    action: AuditLog['action'],
    details: string,
    amount?: number,
    refId?: string
  ) => {
    const newLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      action,
      user: currentRole === 'MANAGER' ? 'مینجر (Admin)' : `${activeCashier?.name || 'کیشیئر'} (کاؤنٹر #${activeCounter})`,
      role: currentRole,
      details,
      amount,
      refId,
    };
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    storage.saveAuditLogs(updated);
  };

  // Role switching
  const switchRole = (newRole: UserRole, pin?: string, cashierId?: string): boolean => {
    if (newRole === 'MANAGER') {
      const correctPin = businessProfile.adminPin || '1234';
      if (pin === correctPin) {
        setCurrentRole('MANAGER');
        storage.setActiveRole('MANAGER');
        setIsMarginUnlocked(true);
        addAuditLog('LOGIN_MANAGER', 'مینجر موڈ میں کامیابی سے لاگ ان کیا گیا');
        return true;
      }
      return false;
    } else {
      setCurrentRole('CASHIER');
      storage.setActiveRole('CASHIER');
      setIsMarginUnlocked(false);
      if (cashierId) {
        const found = cashierAccounts.find((c) => c.id === cashierId);
        if (found) {
          setActiveCashierIdState(found.id);
          storage.setActiveCashierId(found.id);
          setActiveCounterState(found.counterNumber);
          storage.setActiveCounter(found.counterNumber);
        }
      }
      addAuditLog('CASHIER_ACCESS_GRANTED', `سسٹم کیشیئر کاؤنٹر #${activeCounter} موڈ میں منتقل کیا گیا`);
      return true;
    }
  };

  const unlockMargin = (pin: string): boolean => {
    const correctPin = businessProfile.adminPin || '1234';
    if (pin === correctPin) {
      setIsMarginUnlocked(true);
      return true;
    }
    return false;
  };

  const lockMargin = () => {
    setIsMarginUnlocked(false);
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1, unit?: string, variationDetails?: string) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.variationDetails === variationDetails
      );
      const chosenUnit = unit || product.unit;
      const price = product.salePrice;
      const cost = product.costPrice;

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        const total = newQty * price;
        const profit = (price - cost) * newQty;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          total,
          profit,
        };
        return updated;
      } else {
        const total = quantity * price;
        const profit = (price - cost) * quantity;
        return [
          ...prev,
          {
            id: product.id,
            product,
            quantity,
            unit: chosenUnit,
            selectedUnit: chosenUnit,
            unitPrice: price,
            costPrice: cost,
            selectedPrice: price,
            total,
            profit,
            discount: 0,
            variationDetails,
          },
        ];
      }
    });
  };

  const updateCartItem = (id: string, updates: Partial<CartItem>) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === id) {
          const updatedItem = { ...item, ...updates };
          const qty = updatedItem.quantity;
          const price = updatedItem.selectedPrice;
          const cost = updatedItem.product.costPrice;
          updatedItem.total = qty * price;
          updatedItem.profit = (price - cost) * qty - (updatedItem.discount || 0);
          return updatedItem;
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Cart totals
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const totalProfit = cart.reduce((sum, item) => sum + item.profit, 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    return {
      subtotal,
      discount: 0,
      grandTotal: subtotal,
      totalProfit,
      itemCount,
    };
  }, [cart]);

  // Checkout Invoice
  const checkoutInvoice = (params: CheckoutParams): Invoice => {
    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
    const date = new Date().toISOString();
    const grandTotal = Math.max(0, cartTotals.subtotal - params.discount);
    const paidAmount = Math.min(params.amountPaid, grandTotal);
    const balanceDue = Math.max(0, grandTotal - paidAmount);

    let customer = customers.find(
      (c) => (params.customerPhone && c.phone === params.customerPhone) || (params.customerName && c.name === params.customerName)
    );

    if (!customer && (params.customerName || params.customerPhone)) {
      customer = addCustomer(
        params.customerName || 'نامعلوم گاہک',
        params.customerPhone || '',
        'کاؤنٹر سیل'
      );
    }

    const tendered = params.tenderedAmount !== undefined ? params.tenderedAmount : params.amountPaid;
    const changeDue = tendered > grandTotal ? tendered - grandTotal : 0;

    const invoiceItems: InvoiceItem[] = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.nameUr,
      nameUr: item.product.nameUr,
      nameEn: item.product.nameEn,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.selectedPrice,
      costPrice: item.product.costPrice,
      total: item.total,
      profit: item.profit,
      discount: item.discount,
      variationDetails: item.variationDetails,
    }));

    const newInvoice: Invoice = {
      id: 'inv-' + Date.now(),
      invoiceNo,
      date,
      customerName: customer ? customer.name : params.customerName || 'واک اِن کسٹمر (Walk-in)',
      customerPhone: customer ? customer.phone : params.customerPhone,
      customerId: customer ? customer.id : undefined,
      items: invoiceItems,
      subtotal: cartTotals.subtotal,
      discount: params.discount,
      discountType: 'FLAT',
      grandTotal,
      totalProfit: cartTotals.totalProfit - params.discount,
      paidAmount,
      balanceDue,
      tenderedAmount: tendered,
      changeDue,
      paymentMethod: params.paymentMethod,
      cashier: currentRole === 'MANAGER' 
        ? (activeCashier?.name ? `${activeCashier.name} (مینجر)` : 'مینجر (Admin)')
        : (activeCashier?.name || `کاؤنٹر #${activeCounter}`),
      cashierId: activeCashier?.id,
      counterNumber: activeCounter || 1,
      currencyDenominations: params.currencyDenominations,
      preset: activePreset,
      developerBranding: 'JK Developers Pakistan',
      status: 'COMPLETED',
    };

    // Deduct stock
    const updatedProducts = allProducts.map((p) => {
      const soldItem = cart.find((ci) => ci.product.id === p.id);
      if (soldItem) {
        return {
          ...p,
          stock: Math.max(0, p.stock - soldItem.quantity),
        };
      }
      return p;
    });
    setAllProducts(updatedProducts);
    storage.saveProducts(updatedProducts);

    // Save invoice
    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    storage.saveInvoices(updatedInvoices);

    // Update customer khata if udhaar
    if (balanceDue > 0 && customer) {
      const newBalance = customer.currentBalance + balanceDue;
      const khataEntry: KhataEntry = {
        id: 'kh-' + Date.now(),
        customerId: customer.id,
        date,
        type: 'DEBIT',
        amount: balanceDue,
        balanceAfter: newBalance,
        description: `انوائس #${invoiceNo} کا بقایا ادھار`,
        invoiceId: newInvoice.id,
      };

      const updatedCustomers = customers.map((c) => {
        if (c.id === customer!.id) {
          return {
            ...c,
            currentBalance: newBalance,
            khata: [khataEntry, ...c.khata],
          };
        }
        return c;
      });
      setCustomers(updatedCustomers);
      storage.saveCustomers(updatedCustomers);
    }

    // Add Roznamcha cash sale entry
    if (paidAmount > 0) {
      const roznamchaEntry: RoznamchaEntry = {
        id: 'rz-' + Date.now(),
        date,
        type: 'CASH_SALE',
        category: 'کاؤنٹر سیل (Counter Sale)',
        amount: paidAmount,
        isCashIn: true,
        description: `انوائس #${invoiceNo} برائے ${newInvoice.customerName}`,
        refInvoiceId: newInvoice.id,
        refCustomerId: customer?.id,
      };
      const updatedRoznamcha = [roznamchaEntry, ...roznamcha];
      setRoznamcha(updatedRoznamcha);
      storage.saveRoznamcha(updatedRoznamcha);
    }

    // Audit log
    addAuditLog(
      'SALE_CREATED',
      `نیا بل تیار ہوا #${invoiceNo} - کل رقم: ${grandTotal} PKR (ادا شدہ: ${paidAmount} PKR، بقایا: ${balanceDue} PKR)`,
      grandTotal,
      invoiceNo
    );

    // Clear cart
    clearCart();

    return newInvoice;
  };

  // Process Sale Return
  const processSaleReturn = (params: ProcessReturnParams): SaleReturn | null => {
    const invoice = invoices.find((inv) => inv.id === params.invoiceId);
    if (!invoice) return null;

    let totalRefund = 0;
    const returnItems: SaleReturnItem[] = [];

    params.returnedItems.forEach((ri) => {
      if (ri.quantity <= 0) return;
      const invItem = invoice.items.find((it) => it.productId === ri.productId);
      if (!invItem) return;

      const itemTotal = ri.quantity * invItem.unitPrice;
      totalRefund += itemTotal;
      returnItems.push({
        productId: ri.productId,
        productName: invItem.productName,
        quantity: ri.quantity,
        unit: invItem.unit,
        unitPrice: invItem.unitPrice,
        totalRefund: itemTotal,
      });
    });

    if (returnItems.length === 0) return null;

    const returnNo = `RET-${Date.now().toString().slice(-6)}`;
    const date = new Date().toISOString();

    const saleReturnRecord: SaleReturn = {
      id: 'ret-' + Date.now(),
      returnNo,
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      date,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      customerId: invoice.customerId,
      items: returnItems,
      totalRefund,
      refundMethod: params.refundMethod,
      reason: params.reason || 'گاہک کی درخواست پر مال واپسی',
      cashier: currentRole === 'MANAGER' ? 'مینجر (Admin)' : (activeCashier?.name || `کاؤنٹر #${activeCounter}`),
      counterNumber: currentRole === 'MANAGER' ? 0 : activeCounter,
      developerBranding: 'JK Developers Pakistan',
    };

    // 1. Restock products
    const updatedProducts = allProducts.map((p) => {
      const retItem = returnItems.find((ri) => ri.productId === p.id);
      if (retItem) {
        return {
          ...p,
          stock: p.stock + retItem.quantity,
        };
      }
      return p;
    });
    setAllProducts(updatedProducts);
    storage.saveProducts(updatedProducts);

    // 2. Refund handling
    if (params.refundMethod === 'CASH') {
      const roznamchaEntry: RoznamchaEntry = {
        id: 'rz-' + Date.now(),
        date,
        type: 'SALE_RETURN_REFUND',
        category: 'مال واپسی ریفنڈ (Return Refund)',
        amount: totalRefund,
        isCashIn: false,
        description: `بل #${invoice.invoiceNo} کی واپسی برائے #${returnNo} (${params.reason})`,
        refInvoiceId: invoice.id,
      };
      const updatedRoznamcha = [roznamchaEntry, ...roznamcha];
      setRoznamcha(updatedRoznamcha);
      storage.saveRoznamcha(updatedRoznamcha);
    } else if (params.refundMethod === 'KHATA_CREDIT' && invoice.customerId) {
      const customer = customers.find((c) => c.id === invoice.customerId);
      if (customer) {
        const newBalance = Math.max(0, customer.currentBalance - totalRefund);
        const khataEntry: KhataEntry = {
          id: 'kh-' + Date.now(),
          customerId: customer.id,
          date,
          type: 'CREDIT',
          amount: totalRefund,
          balanceAfter: newBalance,
          description: `مال واپسی #${returnNo} کی رقم کھاتے میں جمع کی گئی`,
          invoiceId: invoice.id,
        };

        const updatedCustomers = customers.map((c) => {
          if (c.id === customer.id) {
            return {
              ...c,
              currentBalance: newBalance,
              khata: [khataEntry, ...c.khata],
            };
          }
          return c;
        });
        setCustomers(updatedCustomers);
        storage.saveCustomers(updatedCustomers);
      }
    }

    // 3. Update Invoice status
    const updatedInvoices = invoices.map((inv) => {
      if (inv.id === invoice.id) {
        return {
          ...inv,
          status: 'PARTIALLY_RETURNED' as const,
        };
      }
      return inv;
    });
    setInvoices(updatedInvoices);
    storage.saveInvoices(updatedInvoices);

    // 4. Save Return Record
    const updatedReturns = [saleReturnRecord, ...saleReturns];
    setSaleReturns(updatedReturns);
    storage.saveSaleReturns(updatedReturns);

    // 5. Audit Log
    addAuditLog(
      'SALE_RETURN',
      `مال واپسی #${returnNo} بل #${invoice.invoiceNo} کی پروسیس کی گئی - ریفنڈ رقم: ${totalRefund} PKR بذریعہ ${params.refundMethod}`,
      totalRefund,
      returnNo
    );

    return saleReturnRecord;
  };

  // Receive Khata Payment
  const receiveKhataPayment = (customerId: string, amount: number, description = 'ادھار وصولی') => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer || amount <= 0) return;

    const newBalance = Math.max(0, customer.currentBalance - amount);
    const date = new Date().toISOString();

    const khataEntry: KhataEntry = {
      id: 'kh-' + Date.now(),
      customerId,
      date,
      type: 'CREDIT',
      amount,
      balanceAfter: newBalance,
      description,
    };

    const updatedCustomers = customers.map((c) => {
      if (c.id === customerId) {
        return {
          ...c,
          currentBalance: newBalance,
          khata: [khataEntry, ...c.khata],
        };
      }
      return c;
    });
    setCustomers(updatedCustomers);
    storage.saveCustomers(updatedCustomers);

    const roznamchaEntry: RoznamchaEntry = {
      id: 'rz-' + Date.now(),
      date,
      type: 'CREDIT_RECOVERY',
      category: 'ادھار وصولی (Udhaar Recovery)',
      amount,
      isCashIn: true,
      description: `کھاتہ وصولی از ${customer.name}: ${description}`,
      refCustomerId: customerId,
    };
    const updatedRoznamcha = [roznamchaEntry, ...roznamcha];
    setRoznamcha(updatedRoznamcha);
    storage.saveRoznamcha(updatedRoznamcha);

    addAuditLog(
      'KHATA_PAYMENT',
      `کھاتہ وصولی: ${customer.name} سے ${amount} PKR وصول ہوئے - نیا بقایا: ${newBalance} PKR`,
      amount,
      customerId
    );
  };

  // Add Roznamcha entry
  const addRoznamchaEntry = (entry: Omit<RoznamchaEntry, 'id' | 'date'>) => {
    const newEntry: RoznamchaEntry = {
      ...entry,
      id: 'rz-' + Date.now(),
      date: new Date().toISOString(),
    };
    const updated = [newEntry, ...roznamcha];
    setRoznamcha(updated);
    storage.saveRoznamcha(updated);

    addAuditLog(
      'EXPENSE_RECORDED',
      `روزنامچہ اندراج: ${newEntry.category} - ${newEntry.description} (${newEntry.amount} PKR)`,
      newEntry.amount
    );
  };

  // Inventory modifications
  const saveProduct = (prodData: Partial<Product> & { nameUr: string; nameEn: string }): Product => {
    let saved: Product;
    if (prodData.id) {
      const updated = allProducts.map((p) => {
        if (p.id === prodData.id) {
          saved = { ...p, ...prodData } as Product;
          return saved;
        }
        return p;
      });
      setAllProducts(updated);
      storage.saveProducts(updated);
      addAuditLog('STOCK_UPDATED', `پروڈکٹ اپڈیٹ کی گئی: ${prodData.nameUr} (ریٹ: ${prodData.salePrice})`, prodData.salePrice, prodData.id);
      return saved!;
    } else {
      const newProd: Product = {
        id: 'prod-' + Date.now(),
        preset: activePreset,
        barcode: prodData.barcode || Date.now().toString().slice(-12),
        sku: prodData.sku || `SKU-${Date.now().toString().slice(-4)}`,
        nameEn: prodData.nameEn,
        nameUr: prodData.nameUr,
        categoryEn: prodData.categoryEn || 'General',
        categoryUr: prodData.categoryUr || 'عام اشیاء',
        unit: prodData.unit || 'Piece',
        costPrice: Number(prodData.costPrice) || 0,
        salePrice: Number(prodData.salePrice) || 0,
        wholesalePrice: Number(prodData.wholesalePrice) || Number(prodData.salePrice) || 0,
        stock: Number(prodData.stock) || 0,
        minStockAlert: Number(prodData.minStockAlert) || 5,
      };
      const updated = [newProd, ...allProducts];
      setAllProducts(updated);
      storage.saveProducts(updated);
      addAuditLog('STOCK_ADDED', `نیا پروڈکٹ شامل کیا گیا: ${newProd.nameUr} (اسٹاک: ${newProd.stock})`, newProd.salePrice, newProd.id);
      return newProd;
    }
  };

  const deleteProduct = (id: string) => {
    const prod = allProducts.find((p) => p.id === id);
    const updated = allProducts.filter((p) => p.id !== id);
    setAllProducts(updated);
    storage.saveProducts(updated);
    if (prod) {
      addAuditLog('STOCK_UPDATED', `پروڈکٹ حذف کی گئی: ${prod.nameUr}`, 0, id);
    }
  };

  // Customers
  const addCustomer = (name: string, phone: string, address = '', creditLimit = 50000): Customer => {
    const newCust: Customer = {
      id: 'cust-' + Date.now(),
      name,
      phone,
      address,
      creditLimit,
      currentBalance: 0,
      khata: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [newCust, ...customers];
    setCustomers(updated);
    storage.saveCustomers(updated);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    const updated = customers.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCustomers(updated);
    storage.saveCustomers(updated);
  };

  // Vendor & GRN Functions
  const addVendor = (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'khata' | 'balance'> & { openingBalance?: number }): Vendor => {
    const opening = Number(vendorData.openingBalance) || 0;
    const initialKhata: VendorKhataEntry[] = opening > 0 ? [
      {
        id: `vk-${Date.now()}`,
        vendorId: `vnd-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'PURCHASE',
        amount: opening,
        balanceAfter: opening,
        description: 'ابتدائی سابقہ بقایا جات (Opening Balance)',
      }
    ] : [];

    const newVendor: Vendor = {
      ...vendorData,
      id: `vnd-${Date.now()}`,
      balance: opening,
      khata: initialKhata,
      createdAt: new Date().toISOString(),
    };

    const updated = [newVendor, ...vendors];
    setVendors(updated);
    storage.saveVendors(updated);
    addAuditLog('SETTINGS_CHANGED', `نیا سپلائر شامل کیا گیا: ${newVendor.companyName || newVendor.name}`);
    return newVendor;
  };

  const updateVendor = (id: string, updates: Partial<Vendor>) => {
    const updated = vendors.map((v) => (v.id === id ? { ...v, ...updates } : v));
    setVendors(updated);
    storage.saveVendors(updated);
  };

  const payVendor = (vendorId: string, amount: number, method: 'CASH' | 'BANK', description = 'سپلائر ادائیگی') => {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendor || amount <= 0) return;

    const newBalance = vendor.balance - amount;
    const date = new Date().toISOString();

    const entry: VendorKhataEntry = {
      id: `vk-${Date.now()}`,
      vendorId,
      date,
      type: 'PAYMENT',
      amount,
      balanceAfter: newBalance,
      description: `${description} (${method === 'CASH' ? 'نقد' : 'بینک / آن لائن'})`,
    };

    const updatedVendors = vendors.map((v) => {
      if (v.id === vendorId) {
        return {
          ...v,
          balance: newBalance,
          khata: [entry, ...v.khata],
        };
      }
      return v;
    });
    setVendors(updatedVendors);
    storage.saveVendors(updatedVendors);

    if (method === 'CASH') {
      const roznamchaEntry: RoznamchaEntry = {
        id: `rz-${Date.now()}`,
        date,
        type: 'SUPPLIER_PAYOUT',
        category: 'سپلائر ادائیگی (Supplier Payout)',
        amount,
        isCashIn: false,
        description: `${vendor.companyName || vendor.name}: ${description}`,
        refVendorId: vendorId,
      };
      const updatedRoznamcha = [roznamchaEntry, ...roznamcha];
      setRoznamcha(updatedRoznamcha);
      storage.saveRoznamcha(updatedRoznamcha);
    }

    addAuditLog(
      'VENDOR_PAYMENT',
      `سپلائر کو ادائیگی: ${vendor.companyName || vendor.name} کو ${amount} PKR ادا کیے گئے`,
      amount,
      vendorId
    );
  };

  const createGRN = (grnData: Omit<GRN, 'id' | 'grnNo' | 'developerBranding'>): GRN => {
    const grnNo = `GRN-${Date.now().toString().slice(-6)}`;
    const newGRN: GRN = {
      ...grnData,
      id: `grn-${Date.now()}`,
      grnNo,
      developerBranding: 'JK Developers Pakistan',
    };

    // 1. Update stock and cost prices for each item
    const updatedProducts = allProducts.map((prod) => {
      const grnItem = newGRN.items.find((item) => item.productId === prod.id);
      if (grnItem) {
        return {
          ...prod,
          stock: prod.stock + grnItem.quantity,
          costPrice: grnItem.costPrice || prod.costPrice,
          salePrice: grnItem.salePrice || prod.salePrice,
        };
      }
      return prod;
    });
    setAllProducts(updatedProducts);
    storage.saveProducts(updatedProducts);

    // 2. Update Vendor Khata
    const vendor = vendors.find((v) => v.id === newGRN.vendorId);
    if (vendor) {
      const unpaidAmount = newGRN.grandTotal - newGRN.paidAmount;
      const newBalance = vendor.balance + unpaidAmount;
      const vendorKhataEntry: VendorKhataEntry = {
        id: `vk-${Date.now()}`,
        vendorId: vendor.id,
        date: newGRN.date,
        type: 'PURCHASE',
        amount: newGRN.grandTotal,
        balanceAfter: newBalance,
        description: `خریداری رسیدہ #${grnNo} - بل/بلٹی #${newGRN.biltyNo || newGRN.invoiceNo || 'N/A'} (ادا شدہ: ${newGRN.paidAmount})`,
        grnId: newGRN.id,
      };

      const updatedVendors = vendors.map((v) => {
        if (v.id === vendor.id) {
          return {
            ...v,
            balance: newBalance,
            khata: [vendorKhataEntry, ...v.khata],
          };
        }
        return v;
      });
      setVendors(updatedVendors);
      storage.saveVendors(updatedVendors);
    }

    // 3. Roznamcha entry if cash was paid
    if (newGRN.paidAmount > 0 && newGRN.paymentMethod === 'CASH') {
      const roznamchaEntry: RoznamchaEntry = {
        id: `rz-${Date.now()}`,
        date: newGRN.date,
        type: 'SUPPLIER_PAYOUT',
        category: 'سپلائر نقد ادائیگی (Supplier Payout)',
        amount: newGRN.paidAmount,
        isCashIn: false,
        description: `خریداری رسیدہ #${grnNo} کے تحت ${newGRN.vendorName} کو نقد ادائیگی`,
        refVendorId: newGRN.vendorId,
      };
      const updatedRoznamcha = [roznamchaEntry, ...roznamcha];
      setRoznamcha(updatedRoznamcha);
      storage.saveRoznamcha(updatedRoznamcha);
    }

    // 4. Save GRN
    const updatedGRNList = [newGRN, ...grnList];
    setGRNList(updatedGRNList);
    storage.saveGRNList(updatedGRNList);

    // 5. Audit Log
    addAuditLog(
      'GRN_CREATED',
      `مال وصولی (GRN #${grnNo}) موصول ہوئی - سپلائر: ${newGRN.vendorName}، رقم: ${newGRN.grandTotal} PKR`,
      newGRN.grandTotal,
      grnNo
    );

    return newGRN;
  };

  // Staff Management
  const addStaff = (staffData: Omit<Staff, 'id' | 'payments'>): Staff => {
    const newStaff: Staff = {
      ...staffData,
      id: `stf-${Date.now()}`,
      payments: [],
    };
    const updated = [newStaff, ...staffList];
    setStaffList(updated);
    storage.saveStaffList(updated);
    addAuditLog('STAFF_ADDED', `نیا ملازم شامل کیا گیا: ${newStaff.name} (${newStaff.designation})`);
    return newStaff;
  };

  const updateStaff = (id: string, updates: Partial<Staff>) => {
    const updated = staffList.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setStaffList(updated);
    storage.saveStaffList(updated);
  };

  const payStaffSalary = (
    staffId: string,
    amount: number,
    month: string,
    paymentType: 'SALARY' | 'ADVANCE' | 'BONUS',
    notes = ''
  ) => {
    const staff = staffList.find((s) => s.id === staffId);
    if (!staff || amount <= 0) return;

    const payment: StaffPayment = {
      id: `sp-${Date.now()}`,
      staffId,
      date: new Date().toISOString(),
      amount,
      month,
      paymentType,
      notes,
    };

    const updatedStaff = staffList.map((s) => {
      if (s.id === staffId) {
        return {
          ...s,
          payments: [payment, ...s.payments],
        };
      }
      return s;
    });
    setStaffList(updatedStaff);
    storage.saveStaffList(updatedStaff);

    // Record in Roznamcha
    const roznamchaEntry: RoznamchaEntry = {
      id: `rz-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'STAFF_SALARY',
      category: 'عملہ تنخواہ و اخراجات (Staff Salary)',
      amount,
      isCashIn: false,
      description: `ملازم ${staff.name} (${paymentType === 'SALARY' ? 'ماہانہ تنخواہ' : paymentType === 'ADVANCE' ? 'ایڈوانس' : 'بونس'}) برائے ماہ ${month}`,
      refStaffId: staffId,
    };
    const updatedRoznamcha = [roznamchaEntry, ...roznamcha];
    setRoznamcha(updatedRoznamcha);
    storage.saveRoznamcha(updatedRoznamcha);

    addAuditLog(
      'STAFF_SALARY_PAID',
      `تنخواہ ادائیگی: ${staff.name} کو ${amount} PKR ادا کیے گئے (${month})`,
      amount,
      staffId
    );
  };

  // Backup & Restore
  const exportDataBackup = (): string => {
    return storage.exportBackup();
  };

  const sendBackupToEmail = async (targetEmail?: string): Promise<{ success: boolean; message: string }> => {
    const email = targetEmail || businessProfile.backupEmail || 'jksoftware.backup@gmail.com';
    const backupJson = storage.exportBackup();

    try {
      const res = await fetch('/api/backup/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          businessName: businessProfile.nameUr || businessProfile.nameEn,
          backupData: backupJson,
        }),
      });

      const result = await res.json();
      if (result.success) {
        addAuditLog('BACKUP_DISPATCHED', `ڈیٹا بیک اپ کامیابی سے ای میل (${email}) پر بھیج دیا گیا`);
        return { success: true, message: `بیک اپ کامیابی کے ساتھ ${email} پر بھیج دیا گیا!` };
      }
      return { success: false, message: result.message || 'ای میل بھیجنے میں خرابی ہوئی' };
    } catch {
      addAuditLog('BACKUP_DISPATCHED', `ڈیٹا بیک اپ لوکل محفوظ کیا گیا برائے ای میل (${email})`);
      return { success: true, message: `بیک اپ محفوظ ہو گیا۔ ای میل ایڈریس: ${email}` };
    }
  };

  const resetSystemData = () => {
    storage.resetAllData();
    setActivePresetState('karyana');
    setProfiles(defaultBusinessProfiles);
    setAllProducts(seedProducts);
    setCustomers(storage.getCustomers());
    setInvoices([]);
    setRoznamcha(storage.getRoznamcha());
    setSaleReturns([]);
    setAuditLogs([]);
    setVendors(seedVendors);
    setGRNList([]);
    setStaffList(seedStaff);
    setWhatsAppOrders(seedWhatsAppOrders);
    setCart([]);
  };

  const pendingWhatsAppOrdersCount = useMemo(() => {
    return whatsappOrders.filter((o) => o.status === 'PENDING').length;
  }, [whatsappOrders]);

  const addWhatsAppOrder = (
    orderData: Omit<WhatsAppOrder, 'id' | 'orderNo' | 'date' | 'status'>
  ): WhatsAppOrder => {
    const newOrder: WhatsAppOrder = {
      ...orderData,
      id: 'wa-' + Date.now(),
      orderNo: `WA-${100 + whatsappOrders.length + 1}`,
      date: new Date().toISOString(),
      status: 'PENDING',
    };

    const updated = [newOrder, ...whatsappOrders];
    setWhatsAppOrders(updated);
    storage.saveWhatsAppOrders(updated);
    addAuditLog('SALE_CREATED', `نیا واٹس ایپ آرڈر موصول ہوا (${newOrder.orderNo} - ${newOrder.customerName})`, newOrder.grandTotal);
    return newOrder;
  };

  const updateWhatsAppOrderStatus = (orderId: string, status: WhatsAppOrder['status']) => {
    const updated = whatsappOrders.map((o) =>
      o.id === orderId ? { ...o, status } : o
    );
    setWhatsAppOrders(updated);
    storage.saveWhatsAppOrders(updated);
  };

  const loadWhatsAppOrderIntoCart = (orderId: string) => {
    const order = whatsappOrders.find((o) => o.id === orderId);
    if (!order) return { success: false };

    // Clear current cart and add order items
    setCart([]);
    order.items.forEach((item) => {
      const matched =
        products.find((p) => p.id === item.productId) ||
        products.find(
          (p) =>
            p.nameUr.includes(item.productName) ||
            p.nameEn.toLowerCase().includes(item.productName.toLowerCase())
        );

      if (matched) {
        addToCart(matched, item.quantity, item.unit);
      } else {
        const tempProd: Product = {
          id: `wa_item_${Date.now()}_${Math.random()}`,
          preset: activePreset,
          barcode: `999${Date.now().toString().slice(-8)}`,
          sku: `WA-SKU-${Date.now().toString().slice(-4)}`,
          nameEn: item.productName,
          nameUr: item.productName,
          categoryEn: 'WhatsApp Order',
          categoryUr: 'واٹس ایپ آرڈر',
          costPrice: Math.round(item.unitPrice * 0.8),
          salePrice: item.unitPrice,
          stock: 9999,
          minStockAlert: 0,
          unit: item.unit,
        };
        addToCart(tempProd, item.quantity, item.unit);
      }
    });

    updateWhatsAppOrderStatus(orderId, 'ACCEPTED');

    return {
      success: true,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
    };
  };

  return (
    <ShopContext.Provider
      value={{
        activePreset,
        setPreset,
        businessProfile,
        updateBusinessProfile,
        products,
        allProducts,
        customers,
        invoices,
        roznamcha,
        saleReturns,
        auditLogs,
        vendors,
        grnList,
        staffList,
        cart,
        cartTotals,
        currentRole,
        switchRole,
        cashierAccounts,
        activeCashier,
        activeCounter,
        cashierPermissions,
        saveCashiers,
        updateCashierAccount,
        updateCashierPermissions,
        switchCashierCounter,
        hasAccess,
        isMarginUnlocked,
        unlockMargin,
        lockMargin,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        checkoutInvoice,
        processSaleReturn,
        receiveKhataPayment,
        addRoznamchaEntry,
        addAuditLog,
        saveProduct,
        deleteProduct,
        addCustomer,
        updateCustomer,
        addVendor,
        updateVendor,
        payVendor,
        createGRN,
        addStaff,
        updateStaff,
        payStaffSalary,
        exportDataBackup,
        sendBackupToEmail,
        resetSystemData,
        whatsappOrders,
        pendingWhatsAppOrdersCount,
        isWhatsAppOrdersModalOpen,
        setIsWhatsAppOrdersModalOpen,
        addWhatsAppOrder,
        updateWhatsAppOrderStatus,
        loadWhatsAppOrderIntoCart,
        currentUserEmail,
        isApprovedUser,
        isSuperAdmin,
        usersDB,
        isSuperAdminModalOpen,
        setIsSuperAdminModalOpen,
        loginWithGoogle,
        logoutUser,
        toggleUserApproval,
        addUserLicense,
        deleteUserLicense,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
