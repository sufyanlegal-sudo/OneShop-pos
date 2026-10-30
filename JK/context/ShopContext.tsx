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
  SaleExchange,
  SaleExchangeItem,
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

export interface ProcessExchangeParams {
  invoiceId?: string;
  invoiceNo?: string;
  returnedItems: {
    productId: string;
    quantity: number;
    unitPrice?: number;
  }[];
  newItems: {
    productId: string;
    quantity: number;
    unitPrice?: number;
    selectedUnit?: string;
  }[];
  paymentMethod?: 'CASH' | 'KHATA_CREDIT' | 'CARD';
  reason?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
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
  saleExchanges: SaleExchange[];
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
  addToCart: (
    product: Product,
    quantity?: number,
    unit?: string,
    variationDetails?: string,
    options?: {
      isGram?: boolean;
      weightInGrams?: number;
      ratePerKg?: number;
      isLiter?: boolean;
      volumeInMl?: number;
      ratePerLiter?: number;
      packagedVariant?: string;
      customPrice?: number;
    }
  ) => void;
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  // Transactions
  checkoutInvoice: (params: CheckoutParams) => Invoice;
  processSaleReturn: (params: ProcessReturnParams) => SaleReturn | null;
  processSaleExchange: (params: ProcessExchangeParams) => SaleExchange | null;
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
  sendDailyReportToEmail: (targetEmail?: string) => Promise<{ success: boolean; message: string; summary?: any }>;
  syncBackupToGoogleCloud: (targetEmail?: string) => Promise<{ success: boolean; message: string; timestamp?: string }>;
  fetchGoogleBackup: (email: string, masterKey?: string) => Promise<{ success: boolean; backup?: any; message?: string; exportedAt?: string; stats?: any }>;
  restoreFromGoogleCloud: (email: string, masterKey?: string) => Promise<{ success: boolean; message: string; stats?: any }>;
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
  loginWithGoogle: (email: string, masterKey?: string) => { status: 'APPROVED' | 'PENDING' | 'SUPER_ADMIN' | 'DENIED'; message: string };
  registerUser: (params: {
    name: string;
    businessName: string;
    phone: string;
    email: string;
    password?: string;
  }) => Promise<{ status: 'SUCCESS' | 'EXISTS' | 'ERROR'; message: string }>;
  loginUser: (params: {
    email: string;
    password?: string;
    masterKey?: string;
  }) => {
    status: 'APPROVED' | 'PENDING' | 'SUPER_ADMIN' | 'DENIED' | 'NOT_FOUND' | 'WRONG_PASSWORD';
    message: string;
    user?: PosUserLicense;
  };
  superAdminLoginWithMasterKey: (key: string) => { success: boolean; message: string };
  logoutUser: () => void;
  toggleUserApproval: (email: string) => void;
  addUserLicense: (email: string, name?: string, approved?: boolean, businessName?: string, phone?: string) => void;
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
  const [saleExchanges, setSaleExchanges] = useState<SaleExchange[]>([]);
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
    const loadedExchanges = storage.getSaleExchanges();
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
    setSaleExchanges(loadedExchanges);
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

  // Fetch global registered users from Cloud Server so Super Admin sees all registrations from all devices
  const refreshUsersFromCloud = async () => {
    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsersDB(data.users);
        storage.saveUsersDB(data.users);
      }
    } catch (err) {
      console.error('Failed to sync users from cloud server:', err);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    refreshUsersFromCloud();
  }, [isLoaded]);

  // If active user is awaiting approval, poll cloud server every 4 seconds to detect when Super Admin approves!
  useEffect(() => {
    if (!isLoaded || !currentUserEmail) return;
    const userRec = usersDB.find((u) => u.email.toLowerCase() === currentUserEmail.toLowerCase());
    if (userRec && !userRec.approved) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/auth/users?email=${encodeURIComponent(currentUserEmail)}`);
          const data = await res.json();
          if (data.success && data.found && data.approved) {
            setUsersDB((prev) =>
              prev.map((u) =>
                u.email.toLowerCase() === currentUserEmail.toLowerCase()
                  ? { ...u, approved: true }
                  : u
              )
            );
            refreshUsersFromCloud();
          }
        } catch {
          // Ignore polling errors
        }
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isLoaded, currentUserEmail, usersDB]);

  // Real-time synchronization with Vercel WhatsApp Webhook server for incoming customer orders
  useEffect(() => {
    if (!isLoaded) return;
    const syncServerOrders = async () => {
      try {
        const res = await fetch('/api/webhook/whatsapp?action=get_orders');
        if (res.ok) {
          const data = await res.json();
          if (data && data.orders && data.orders.length > 0) {
            setWhatsAppOrders((prev) => {
              const existingIds = new Set(prev.map((o) => o.id));
              const newIncoming = data.orders.filter((o: any) => !existingIds.has(o.id));
              if (newIncoming.length > 0) {
                const combined = [...newIncoming, ...prev];
                storage.saveWhatsAppOrders(combined);
                return combined;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        // Silent catch
      }
    };

    const timer = setTimeout(syncServerOrders, 2000);
    const interval = setInterval(syncServerOrders, 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isLoaded]);

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

  // Periodic background cloud sync (every 15 minutes silently keeps Google Account snapshot 100% updated)
  useEffect(() => {
    if (!isLoaded || !currentUserEmail || !isApprovedUser) return;
    const cloudSyncTimer = setTimeout(() => {
      syncBackupToGoogleCloud().catch(() => {});
    }, 5000);
    const cloudInterval = setInterval(() => {
      syncBackupToGoogleCloud().catch(() => {});
    }, 15 * 60 * 1000); // Every 15 mins
    return () => {
      clearTimeout(cloudSyncTimer);
      clearInterval(cloudInterval);
    };
  }, [isLoaded, currentUserEmail, isApprovedUser]);

  const MASTER_ADMIN_KEY = 'JK@8998381';

  const loginWithGoogle = (emailInput: string, masterKey?: string) => {
    const cleanEmail = emailInput.trim().toLowerCase();

    // STRICT ANTI-HIJACKING PROTECTION: If user tries to use Super Admin developer email
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      if (!masterKey || masterKey.trim() !== MASTER_ADMIN_KEY) {
        return {
          status: 'DENIED' as const,
          message:
            '⛔ غیر مجاز رسائی مسترد کر دی گئی ہے! آپ ڈیولپر کی آفیشل ای میل استعمال کرنے کے مجاز نہیں ہیں۔ برائے مہربانی اپنی ذاتی جی میل استعمال فرمائیں، یا ڈیولپر ہیں تو درست سیکیورٹی کی درج کریں۔',
        };
      }
    }

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

      // Auto-dispatch notification to Super Admin (jkdevelopers.pk@gmail.com)
      if (cleanEmail !== SUPER_ADMIN_EMAIL.toLowerCase()) {
        fetch('/api/auth/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: cleanEmail,
            userName: cleanEmail.split('@')[0],
            businessName: businessProfile.nameUr || businessProfile.nameEn,
            action: 'NEW_REGISTRATION',
          }),
        }).catch(() => {});
      }
    }

    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setCurrentUserEmail(cleanEmail);
      storage.setCurrentUser(cleanEmail);
      return { status: 'SUPER_ADMIN' as const, message: 'خوش آمدید سفیان حبیب صاحب! سپر ایڈمن کنٹرول حاصل ہو چکا ہے۔' };
    }
    if (userRec.approved) {
      setCurrentUserEmail(cleanEmail);
      storage.setCurrentUser(cleanEmail);
      return { status: 'APPROVED' as const, message: 'خوش آمدید! آپ کی رسائی منظور شدہ ہے۔' };
    }
    return { status: 'PENDING' as const, message: 'آپ کا اکاؤنٹ منظوری کے لیے پینڈنگ ہے۔ ایڈمن سے رابطہ کریں۔' };
  };

  const superAdminLoginWithMasterKey = (key: string) => {
    if (key.trim() === MASTER_ADMIN_KEY) {
      setCurrentUserEmail(SUPER_ADMIN_EMAIL);
      storage.setCurrentUser(SUPER_ADMIN_EMAIL);
      setIsSuperAdminModalOpen(true);
      return {
        success: true,
        message: 'خوش آمدید سفیان حبیب صاحب! سپر ایڈمن کنٹرول حاصل ہو چکا ہے۔',
      };
    }
    return {
      success: false,
      message: 'غلط ماسٹر سیکیورٹی کی! رسائی مسترد کر دی گئی ہے۔',
    };
  };

  const registerUser = async (params: {
    name: string;
    businessName: string;
    phone: string;
    email: string;
    password?: string;
  }) => {
    const cleanEmail = params.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { status: 'ERROR' as const, message: 'Please enter a valid Gmail address.' };
    }
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return { status: 'ERROR' as const, message: 'This email is reserved for developer access.' };
    }

    const existing = usersDB.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { status: 'EXISTS' as const, message: 'An account with this email already exists. Please sign in.' };
    }

    const newUser: PosUserLicense = {
      email: cleanEmail,
      name: params.name.trim(),
      businessName: params.businessName.trim(),
      phone: params.phone.trim(),
      password: params.password,
      approved: false, // 100% requires Super Admin manual approval!
      registeredAt: new Date().toISOString(),
      shopName: params.businessName.trim(),
    };

    const updatedDB = [newUser, ...usersDB];
    setUsersDB(updatedDB);
    storage.saveUsersDB(updatedDB);

    // If business name was provided, customize shop profile
    if (params.businessName.trim()) {
      updateBusinessProfile({
        nameUr: params.businessName.trim(),
        nameEn: params.businessName.trim(),
        phone: params.phone.trim() || undefined,
      });
    }

    // Auto-dispatch notification to Developer Gmail & WhatsApp API and save to server
    try {
      await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REGISTER',
          email: cleanEmail,
          name: params.name.trim(),
          businessName: params.businessName.trim(),
          phone: params.phone.trim(),
          password: params.password,
        }),
      });

      await fetch('/api/auth/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: cleanEmail,
          userName: params.name.trim(),
          businessName: params.businessName.trim(),
          phone: params.phone.trim(),
          action: 'NEW_REGISTRATION',
        }),
      });
    } catch (err) {
      console.error('Failed to dispatch registration alert:', err);
    }

    return {
      status: 'SUCCESS' as const,
      message: 'Account successfully registered. Awaiting administrator approval.',
    };
  };

  const loginUser = (params: {
    email: string;
    password?: string;
    masterKey?: string;
  }) => {
    const cleanEmail = params.email.trim().toLowerCase();

    // 1. Super Admin attempt
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      if (!params.masterKey || params.masterKey.trim() !== MASTER_ADMIN_KEY) {
        return {
          status: 'DENIED' as const,
          message: '⛔ This email is reserved for Developer Master Access. Please sign in with your registered account.',
        };
      }
      setCurrentUserEmail(SUPER_ADMIN_EMAIL);
      storage.setCurrentUser(SUPER_ADMIN_EMAIL);
      return {
        status: 'SUPER_ADMIN' as const,
        message: 'Welcome JK Developers Pakistan! Super Admin control granted.',
      };
    }

    // 2. Client lookup in database
    const userRec = usersDB.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!userRec) {
      return {
        status: 'NOT_FOUND' as const,
        message: 'No account found with this Gmail. Please click "Create Account" to register.',
      };
    }

    // 3. Password verification (if user set a password during registration)
    if (userRec.password && params.password && userRec.password !== params.password) {
      return {
        status: 'WRONG_PASSWORD' as const,
        message: 'Incorrect password. Please try again.',
      };
    }

    // 4. Approval Check
    if (!userRec.approved) {
      return {
        status: 'PENDING' as const,
        message: 'Your account is pending approval by JK Developers Pakistan (0300-8998381).',
        user: userRec,
      };
    }

    // 5. Approved Client Login
    setCurrentUserEmail(cleanEmail);
    storage.setCurrentUser(cleanEmail);
    return {
      status: 'APPROVED' as const,
      message: `Welcome ${userRec.name || ''}! Your license is active.`,
      user: userRec,
    };
  };

  const logoutUser = () => {
    setCurrentUserEmail(null);
    storage.setCurrentUser(null);
  };

  const toggleUserApproval = async (email: string) => {
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

    try {
      await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_APPROVAL',
          email,
        }),
      });
    } catch (err) {
      console.error('Failed to sync toggle approval to cloud:', err);
    }
  };

  const addUserLicense = async (
    email: string,
    name?: string,
    approved: boolean = true,
    businessName?: string,
    phone?: string
  ) => {
    const clean = email.trim().toLowerCase();
    const existing = usersDB.find((u) => u.email.toLowerCase() === clean);
    if (existing) {
      toggleUserApproval(clean);
      return;
    }
    const newUser: PosUserLicense = {
      email: clean,
      name: name || clean.split('@')[0],
      businessName: businessName || 'Store',
      phone: phone || '',
      approved,
      registeredAt: new Date().toISOString(),
      approvedAt: approved ? new Date().toISOString() : undefined,
    };
    const updated = [newUser, ...usersDB];
    setUsersDB(updated);
    storage.saveUsersDB(updated);

    try {
      await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REGISTER',
          email: clean,
          name: newUser.name,
          businessName: newUser.businessName,
          phone: newUser.phone,
          approved,
        }),
      });
    } catch (err) {
      console.error('Failed to sync new user to cloud:', err);
    }
  };

  const deleteUserLicense = async (email: string) => {
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return;
    const updated = usersDB.filter((u) => u.email.toLowerCase() !== email.toLowerCase());
    setUsersDB(updated);
    storage.saveUsersDB(updated);

    try {
      await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_USER',
          email,
        }),
      });
    } catch (err) {
      console.error('Failed to sync delete to cloud:', err);
    }

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

  // Filter products for active preset (Ensures newly created products without preset are never hidden)
  const products = useMemo(() => {
    return allProducts.filter((p) => !p.preset || p.preset === activePreset);
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
  const addToCart = (
    product: Product,
    quantity = 1,
    unit?: string,
    variationDetails?: string,
    options?: {
      isGram?: boolean;
      weightInGrams?: number;
      ratePerKg?: number;
      isLiter?: boolean;
      volumeInMl?: number;
      ratePerLiter?: number;
      packagedVariant?: string;
      customPrice?: number;
    }
  ) => {
    setCart((prev) => {
      const isGram = !!(options?.isGram || unit === 'Grams' || unit === 'گرام');
      const ratePerKg = options?.ratePerKg || product.salePrice;
      const costPerKg = product.costPrice;
      const uniqueRowId = `${product.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // 1. Grams Weight Handling
      if (isGram) {
        const gramsToAdd = options?.weightInGrams || (quantity > 20 ? quantity : quantity * 1000);
        const total = Math.round(((ratePerKg * gramsToAdd) / 1000) * 100) / 100;
        const costTotal = Math.round(((costPerKg * gramsToAdd) / 1000) * 100) / 100;
        return [
          ...prev,
          {
            id: uniqueRowId,
            product,
            quantity: gramsToAdd,
            unit: 'گرام',
            selectedUnit: 'گرام',
            unitPrice: ratePerKg,
            costPrice: costPerKg,
            selectedPrice: ratePerKg,
            total,
            profit: total - costTotal,
            discount: 0,
            variationDetails: variationDetails || options?.packagedVariant,
            packagedVariant: options?.packagedVariant,
            isGram: true,
            isLiter: false,
            weightInGrams: gramsToAdd,
            ratePerKg,
            costPerKg,
          },
        ];
      }

      // 2. Liters / Half-Liter / Milliliters Handling
      const isLiter = !!(options?.isLiter || unit === 'Liter' || unit === 'لیٹر' || unit === 'ml' || unit === 'ملی لیٹر' || unit === 'ہاف لیٹر');
      if (isLiter && (unit === 'ml' || unit === 'ملی لیٹر' || unit === 'ہاف لیٹر' || options?.volumeInMl)) {
        const mlToAdd = options?.volumeInMl || (unit === 'ہاف لیٹر' ? 500 : (quantity > 10 ? quantity : quantity * 1000));
        const rPerL = options?.ratePerLiter || product.salePrice;
        const cPerL = product.costPrice;
        const total = Math.round(((rPerL * mlToAdd) / 1000) * 100) / 100;
        const costTotal = Math.round(((cPerL * mlToAdd) / 1000) * 100) / 100;
        return [
          ...prev,
          {
            id: uniqueRowId,
            product,
            quantity: mlToAdd,
            unit: 'ملی لیٹر',
            selectedUnit: 'ملی لیٹر',
            unitPrice: rPerL,
            costPrice: cPerL,
            selectedPrice: rPerL,
            total,
            profit: total - costTotal,
            discount: 0,
            variationDetails: variationDetails || options?.packagedVariant,
            packagedVariant: options?.packagedVariant,
            isLiter: true,
            isGram: false,
            volumeInMl: mlToAdd,
            ratePerLiter: rPerL,
            costPerLiter: cPerL,
          },
        ];
      }

      // 3. Normal / Packaged Items (Allows infinite items: 100, 500, 1000+ distinct lines in the bill)
      const chosenUnit = unit || product.unit;
      const price = options?.customPrice !== undefined ? options.customPrice : product.salePrice;
      const cost = product.costPrice;
      const total = Math.round((quantity * price) * 100) / 100;
      const profit = Math.round(((price - cost) * quantity) * 100) / 100;
      const isKg = product.unit?.toLowerCase() === 'kg' || product.unit === 'کلو';
      const isLtr = product.unit?.toLowerCase() === 'liter' || product.unit === 'لیٹر' || product.unit?.toLowerCase() === 'ltr';

      return [
        ...prev,
        {
          id: uniqueRowId,
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
          variationDetails: variationDetails || options?.packagedVariant,
          packagedVariant: options?.packagedVariant,
          isGram: false,
          isLiter: isLtr,
          ratePerKg: isKg ? price : undefined,
          costPerKg: isKg ? cost : undefined,
          ratePerLiter: isLtr ? price : undefined,
          costPerLiter: isLtr ? cost : undefined,
        },
      ];
    });
  };

  const updateCartItem = (id: string, updates: Partial<CartItem>) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id || (!item.id && item.product.id === id)) {
          const updatedItem = { ...item, ...updates };

          // 1. Gram Updates
          if (updatedItem.isGram) {
            const grams = updatedItem.weightInGrams || updatedItem.quantity || 250;
            const rateKg = updatedItem.ratePerKg || updatedItem.product.salePrice;
            const costKg = updatedItem.costPerKg || updatedItem.product.costPrice;
            const total = Math.round(((rateKg * grams) / 1000) * 100) / 100;
            const costTotal = Math.round(((costKg * grams) / 1000) * 100) / 100;
            updatedItem.isGram = true;
            updatedItem.isLiter = false;
            updatedItem.weightInGrams = grams;
            updatedItem.quantity = grams;
            updatedItem.unit = 'گرام';
            updatedItem.selectedUnit = 'گرام';
            updatedItem.ratePerKg = rateKg;
            updatedItem.costPerKg = costKg;
            updatedItem.unitPrice = rateKg;
            updatedItem.selectedPrice = rateKg;
            updatedItem.total = total - (updatedItem.discount || 0);
            updatedItem.profit = (total - costTotal) - (updatedItem.discount || 0);
            return updatedItem;
          }

          // 2. Liter / Half-Liter Updates
          if (updatedItem.isLiter && updatedItem.volumeInMl) {
            const ml = updatedItem.volumeInMl;
            const rateL = updatedItem.ratePerLiter || updatedItem.product.salePrice;
            const costL = updatedItem.costPerLiter || updatedItem.product.costPrice;
            const total = Math.round(((rateL * ml) / 1000) * 100) / 100;
            const costTotal = Math.round(((costL * ml) / 1000) * 100) / 100;
            updatedItem.isLiter = true;
            updatedItem.isGram = false;
            updatedItem.volumeInMl = ml;
            updatedItem.quantity = ml;
            updatedItem.unit = 'ملی لیٹر';
            updatedItem.selectedUnit = 'ملی لیٹر';
            updatedItem.ratePerLiter = rateL;
            updatedItem.costPerLiter = costL;
            updatedItem.unitPrice = rateL;
            updatedItem.selectedPrice = rateL;
            updatedItem.total = total - (updatedItem.discount || 0);
            updatedItem.profit = (total - costTotal) - (updatedItem.discount || 0);
            return updatedItem;
          }

          // 3. Normal quantity / price updates
          const qty = updatedItem.quantity;
          const price = updatedItem.selectedPrice || updatedItem.unitPrice || updatedItem.product.salePrice;
          const cost = updatedItem.costPrice || updatedItem.product.costPrice;
          const total = Math.round((qty * price) * 100) / 100;
          const costTotal = Math.round((qty * cost) * 100) / 100;
          updatedItem.isGram = false;
          updatedItem.isLiter = false;
          updatedItem.selectedPrice = price;
          updatedItem.unitPrice = price;
          updatedItem.total = total - (updatedItem.discount || 0);
          updatedItem.profit = (total - costTotal) - (updatedItem.discount || 0);
          return updatedItem;
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id && (!item.id ? item.product.id !== id : true)));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Cart totals
  const cartTotals = useMemo(() => {
    const subtotal = Math.round(cart.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
    const totalProfit = Math.round(cart.reduce((sum, item) => sum + item.profit, 0) * 100) / 100;
    const itemCount = cart.reduce((sum, item) => sum + (item.isGram || item.isLiter ? 1 : item.quantity), 0);
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
      quantity: item.isGram
        ? (item.weightInGrams || item.quantity)
        : (item.isLiter && item.volumeInMl ? item.volumeInMl : item.quantity),
      unit: item.isGram
        ? 'گرام'
        : (item.isLiter && item.volumeInMl ? 'ملی لیٹر' : (item.selectedUnit || item.unit)),
      unitPrice: item.isGram
        ? (item.ratePerKg || item.product.salePrice)
        : (item.isLiter ? (item.ratePerLiter || item.product.salePrice) : item.selectedPrice),
      costPrice: item.isGram
        ? (item.costPerKg || item.product.costPrice)
        : (item.isLiter ? (item.costPerLiter || item.product.costPrice) : (item.costPrice || item.product.costPrice)),
      total: item.total,
      profit: item.profit,
      discount: item.discount,
      variationDetails: item.variationDetails || item.packagedVariant,
      isGram: item.isGram,
      weightInGrams: item.weightInGrams,
      ratePerKg: item.ratePerKg,
      costPerKg: item.costPerKg,
      isLiter: item.isLiter,
      volumeInMl: item.volumeInMl,
      ratePerLiter: item.ratePerLiter,
      costPerLiter: item.costPerLiter,
      packagedVariant: item.packagedVariant,
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

    // Daily backup sync (Only once a day if autoDailyBackup is enabled, NOT on every bill)
    try {
      const todayDateStr = new Date().toISOString().split('T')[0];
      const lastSyncedDate =
        typeof window !== 'undefined'
          ? localStorage.getItem('pos_last_daily_sync_date')
          : null;
      if (businessProfile.autoDailyBackup && lastSyncedDate !== todayDateStr) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('pos_last_daily_sync_date', todayDateStr);
        }
        syncBackupToGoogleCloud().catch(() => {});
      }
    } catch {
      // Ignored
    }

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

  // Process Sale Exchange (مال کا تبادلہ / ایکسچینج)
  const processSaleExchange = (params: ProcessExchangeParams): SaleExchange | null => {
    let invoice: Invoice | undefined;
    if (params.invoiceId) {
      invoice = invoices.find((inv) => inv.id === params.invoiceId);
    }

    // 1. Calculate Returned Items Value & build return items list
    let totalReturnValue = 0;
    const returnItems: SaleReturnItem[] = [];

    params.returnedItems.forEach((ri) => {
      if (ri.quantity <= 0) return;
      const invItem = invoice?.items.find((it) => it.productId === ri.productId);
      const product = allProducts.find((p) => p.id === ri.productId);
      const unitPrice = ri.unitPrice ?? invItem?.unitPrice ?? product?.salePrice ?? 0;
      const itemTotal = ri.quantity * unitPrice;
      totalReturnValue += itemTotal;

      returnItems.push({
        productId: ri.productId,
        productName: invItem?.productName || (product ? product.nameUr : 'آئٹم'),
        quantity: ri.quantity,
        unit: invItem?.unit || product?.unit || 'عدد',
        unitPrice,
        totalRefund: itemTotal,
      });
    });

    // 2. Calculate New Replacement Items Value & build new items list
    let totalNewValue = 0;
    const newItemsList: SaleExchangeItem[] = [];

    params.newItems.forEach((ni) => {
      if (ni.quantity <= 0) return;
      const product = allProducts.find((p) => p.id === ni.productId);
      const unitPrice = ni.unitPrice ?? product?.salePrice ?? 0;
      const itemTotal = ni.quantity * unitPrice;
      totalNewValue += itemTotal;

      newItemsList.push({
        productId: ni.productId,
        productName: product ? product.nameUr : 'نئی آئٹم',
        quantity: ni.quantity,
        unit: ni.selectedUnit || product?.unit || 'عدد',
        unitPrice,
        total: itemTotal,
      });
    });

    if (returnItems.length === 0 && newItemsList.length === 0) return null;

    const exchangeNo = `EXC-${Date.now().toString().slice(-6)}`;
    const date = new Date().toISOString();
    const differenceAmount = totalNewValue - totalReturnValue;
    const customerName = params.customerName || invoice?.customerName || 'عام گاہک (Walk-in Customer)';
    const customerPhone = params.customerPhone || invoice?.customerPhone;
    const customerId = params.customerId || invoice?.customerId;
    const paymentMethod = params.paymentMethod || 'CASH';

    const saleExchangeRecord: SaleExchange = {
      id: 'exc-' + Date.now(),
      exchangeNo,
      invoiceId: invoice?.id,
      invoiceNo: invoice?.invoiceNo,
      date,
      customerName,
      customerPhone,
      customerId,
      returnedItems: returnItems,
      totalReturnValue,
      newItems: newItemsList,
      totalNewValue,
      differenceAmount,
      paymentMethod,
      reason: params.reason || 'گاہک کی پسند پر مال کا تبادلہ (Exchange)',
      cashier: currentRole === 'MANAGER' ? 'مینجر (Admin)' : (activeCashier?.name || `کاؤنٹر #${activeCounter}`),
      counterNumber: currentRole === 'MANAGER' ? 0 : activeCounter,
      developerBranding: 'JK Developers Pakistan',
    };

    // 3. Update Inventory Stock:
    // +qty for returned items
    // -qty for replacement items
    const updatedProducts = allProducts.map((p) => {
      let stockDelta = 0;
      const retItem = returnItems.find((ri) => ri.productId === p.id);
      if (retItem) stockDelta += retItem.quantity;
      const newItem = newItemsList.find((ni) => ni.productId === p.id);
      if (newItem) stockDelta -= newItem.quantity;

      if (stockDelta !== 0) {
        return {
          ...p,
          stock: Math.max(0, p.stock + stockDelta),
        };
      }
      return p;
    });
    setAllProducts(updatedProducts);
    storage.saveProducts(updatedProducts);

    // 4. Financial difference handling
    if (differenceAmount > 0) {
      // Customer pays the difference
      if (paymentMethod === 'CASH' || paymentMethod === 'CARD') {
        const roznamchaEntry: RoznamchaEntry = {
          id: 'rz-' + Date.now(),
          date,
          type: 'CASH_SALE',
          category: 'ایکسچینج وصولی (Exchange Extra Cash)',
          amount: differenceAmount,
          isCashIn: true,
          description: `تبادلہ #${exchangeNo} میں اضافی رقم وصول ہوئی (واپسی: ${totalReturnValue} PKR، نئی: ${totalNewValue} PKR)`,
          refInvoiceId: invoice?.id,
        };
        const updatedRoznamcha = [roznamchaEntry, ...roznamcha];
        setRoznamcha(updatedRoznamcha);
        storage.saveRoznamcha(updatedRoznamcha);
      } else if (paymentMethod === 'KHATA_CREDIT' && customerId) {
        const customer = customers.find((c) => c.id === customerId);
        if (customer) {
          const newBalance = customer.currentBalance + differenceAmount;
          const khataEntry: KhataEntry = {
            id: 'kh-' + Date.now(),
            customerId: customer.id,
            date,
            type: 'DEBIT',
            amount: differenceAmount,
            balanceAfter: newBalance,
            description: `تبادلہ #${exchangeNo} کی اضافی رقم کھاتے میں لکھی گئی`,
            invoiceId: invoice?.id,
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
    } else if (differenceAmount < 0) {
      // Shopkeeper refunds difference to customer
      const refundAmt = Math.abs(differenceAmount);
      if (paymentMethod === 'CASH' || paymentMethod === 'CARD') {
        const roznamchaEntry: RoznamchaEntry = {
          id: 'rz-' + Date.now(),
          date,
          type: 'SALE_RETURN_REFUND',
          category: 'ایکسچینج ریفنڈ (Exchange Excess Refund)',
          amount: refundAmt,
          isCashIn: false,
          description: `تبادلہ #${exchangeNo} میں بقایا کیش گاہک کو واپس کیا گیا`,
          refInvoiceId: invoice?.id,
        };
        const updatedRoznamcha = [roznamchaEntry, ...roznamcha];
        setRoznamcha(updatedRoznamcha);
        storage.saveRoznamcha(updatedRoznamcha);
      } else if (paymentMethod === 'KHATA_CREDIT' && customerId) {
        const customer = customers.find((c) => c.id === customerId);
        if (customer) {
          const newBalance = Math.max(0, customer.currentBalance - refundAmt);
          const khataEntry: KhataEntry = {
            id: 'kh-' + Date.now(),
            customerId: customer.id,
            date,
            type: 'CREDIT',
            amount: refundAmt,
            balanceAfter: newBalance,
            description: `تبادلہ #${exchangeNo} کی بقایا رقم کھاتے میں جمع کی گئی`,
            invoiceId: invoice?.id,
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
    }

    // 5. Update invoice status
    if (invoice) {
      const updatedInvoices = invoices.map((inv) => {
        if (inv.id === invoice!.id) {
          return {
            ...inv,
            status: 'PARTIALLY_RETURNED' as const,
          };
        }
        return inv;
      });
      setInvoices(updatedInvoices);
      storage.saveInvoices(updatedInvoices);
    }

    // 6. Save Exchange Record
    const updatedExchanges = [saleExchangeRecord, ...saleExchanges];
    setSaleExchanges(updatedExchanges);
    storage.saveSaleExchanges(updatedExchanges);

    // 7. Audit Log
    addAuditLog(
      'SALE_EXCHANGE',
      `مال کا تبادلہ (Exchange) #${exchangeNo} مکمل ہوا - گاہک: ${customerName} | واپسی: ${totalReturnValue} PKR، نئی اشیاء: ${totalNewValue} PKR، نیٹ فرق: ${differenceAmount > 0 ? '+' : ''}${differenceAmount} PKR`,
      Math.abs(differenceAmount),
      exchangeNo
    );

    return saleExchangeRecord;
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
        preset: prodData.preset || activePreset,
        barcode: prodData.barcode || Date.now().toString().slice(-12),
        sku: prodData.sku || `SKU-${Date.now().toString().slice(-4)}`,
        nameEn: prodData.nameEn || prodData.nameUr,
        nameUr: prodData.nameUr,
        categoryEn: prodData.categoryEn || prodData.categoryUr || 'General',
        categoryUr: prodData.categoryUr || prodData.categoryEn || 'عام اشیاء',
        unit: prodData.unit || 'Piece',
        subUnit: prodData.subUnit,
        conversionFactor: prodData.conversionFactor,
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

  const sendDailyReportToEmail = async (
    targetEmail?: string
  ): Promise<{ success: boolean; message: string; summary?: any }> => {
    const email =
      targetEmail ||
      currentUserEmail ||
      businessProfile.backupEmail ||
      'jkdevelopers.pk@gmail.com';
    const backupJson = storage.exportBackup();

    const todayStr = new Date().toISOString().split('T')[0];
    const todayInvoices = invoices.filter((inv) => (inv.date || '').startsWith(todayStr));
    const totalSales = todayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const cashSales = todayInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const creditSales = todayInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
    const todayExpenses = roznamcha
      .filter((r) => !r.isCashIn && (r.date || '').startsWith(todayStr))
      .reduce((sum, r) => sum + r.amount, 0);
    const todayCashIn = roznamcha
      .filter((r) => r.isCashIn && (r.date || '').startsWith(todayStr))
      .reduce((sum, r) => sum + r.amount, 0);

    const dailySummary = {
      date: todayStr,
      businessName: businessProfile.nameUr || businessProfile.nameEn,
      invoicesCount: todayInvoices.length,
      totalSales,
      cashSales,
      creditSales,
      todayExpenses,
      todayCashIn,
      netCash: cashSales + todayCashIn - todayExpenses,
      totalCustomers: customers.length,
      totalActiveUdhaar: customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0),
    };

    try {
      // 1. Dispatch email report
      const res = await fetch('/api/backup/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          businessName: businessProfile.nameUr || businessProfile.nameEn,
          backupData: backupJson,
          dailySummary,
        }),
      });

      const result = await res.json();

      // 2. Also ensure cloud persistence snapshot for today
      await syncBackupToGoogleCloud(email);

      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_last_daily_sync_date', todayStr);
      }

      if (result.success) {
        addAuditLog(
          'BACKUP_DISPATCHED',
          `آج کی مکمل یومیہ سیل رپورٹ اور بیک اپ جی میل (${email}) پر بھیج دیا گیا۔ سیل: ${totalSales} PKR`
        );
        return {
          success: true,
          message:
            result.message ||
            `آج کی مکمل یومیہ سیل اور کھاتہ رپورٹ کامیابی کے ساتھ ${email} پر بھیج دی گئی ہے!`,
          summary: dailySummary,
        };
      }
      return { success: false, message: result.message || 'ای میل بھیجنے میں خرابی ہوئی' };
    } catch {
      addAuditLog(
        'BACKUP_DISPATCHED',
        `ڈیلی رپورٹ لوکل محفوظ کی گئی برائے ای میل (${email})`
      );
      return {
        success: true,
        message: `آج کی ڈیلی رپورٹ اور کلاؤڈ بیک اپ محفوظ ہو گیا۔ وصول کنندہ: ${email}`,
        summary: dailySummary,
      };
    }
  };

  // Google Cloud Backup & Restore
  const syncBackupToGoogleCloud = async (
    targetEmail?: string
  ): Promise<{ success: boolean; message: string; timestamp?: string }> => {
    const email =
      targetEmail ||
      currentUserEmail ||
      businessProfile.backupEmail ||
      'jkdevelopers.pk@gmail.com';
    const backupJson = storage.exportBackup();

    try {
      const res = await fetch('/api/backup/google', {
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
        addAuditLog(
          'BACKUP_DISPATCHED',
          `گوگل کلاؤڈ بیک اپ محفوظ ہو گیا برائے اکاؤنٹ: ${email}`
        );
        return {
          success: true,
          message: result.message || `گوگل کلاؤڈ بیک اپ کامیابی سے محفوظ ہو گیا (${email})`,
          timestamp: result.timestamp,
        };
      }
      return { success: false, message: result.message || 'گوگل کلاؤڈ میں بیک اپ محفوظ نہ ہو سکا' };
    } catch (e: any) {
      return {
        success: false,
        message: 'گوگل کلاؤڈ بیک اپ بھیجنے میں نیٹ ورک کا مسئلہ پیش آیا: ' + (e.message || ''),
      };
    }
  };

  const fetchGoogleBackup = async (
    email: string,
    masterKey?: string
  ): Promise<{ success: boolean; backup?: any; message?: string; exportedAt?: string; stats?: any }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      if (!masterKey || masterKey.trim() !== MASTER_ADMIN_KEY) {
        return {
          success: false,
          message:
            '⛔ غیر مجاز رسائی مسترد کر دی گئی ہے! ڈیولپر کے کلاؤڈ بیک اپ تک رسائی کے لیے ماسٹر سیکیورٹی کی درکار ہے۔ عام صارفین اپنی ذاتی جی میل درج کریں۔',
        };
      }
    }
    try {
      const res = await fetch(`/api/backup/google?email=${encodeURIComponent(cleanEmail)}`);
      const result = await res.json();
      return result;
    } catch (e: any) {
      return {
        success: false,
        message: 'گوگل کلاؤڈ سے رابطہ قائم نہ ہو سکا: ' + (e.message || ''),
      };
    }
  };

  const restoreFromGoogleCloud = async (
    email: string,
    masterKey?: string
  ): Promise<{ success: boolean; message: string; stats?: any }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      if (!masterKey || masterKey.trim() !== MASTER_ADMIN_KEY) {
        return {
          success: false,
          message:
            '⛔ غیر مجاز رسائی مسترد کر دی گئی ہے! ڈیولپر کے اکاؤنٹ کا ڈیٹا بحال کرنے کے لیے ماسٹر سیکیورٹی کی درکار ہے۔',
        };
      }
    }
    const fetchRes = await fetchGoogleBackup(cleanEmail, masterKey);

    if (!fetchRes.success || !fetchRes.backup) {
      return {
        success: false,
        message:
          fetchRes.message ||
          `گوگل اکاؤنٹ "${cleanEmail}" پر کوئی سابقہ کلاؤڈ بیک اپ نہیں ملا۔`,
      };
    }

    try {
      const success = storage.importBackup(JSON.stringify(fetchRes.backup));
      if (!success) {
        return { success: false, message: 'بیک اپ فائل درآمد کرنے میں خرابی پیش آگئی۔' };
      }

      // Ensure user is approved on this new machine
      let updatedDB = storage.getUsersDB();
      let userRec = updatedDB.find((u) => u.email.toLowerCase() === cleanEmail);
      if (userRec) {
        userRec.approved = true;
        userRec.approvedAt = new Date().toISOString();
      } else {
        userRec = {
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          approved: true,
          registeredAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
        };
        updatedDB.push(userRec);
      }
      storage.saveUsersDB(updatedDB);
      setUsersDB(updatedDB);
      setCurrentUserEmail(cleanEmail);
      storage.setCurrentUser(cleanEmail);

      // Reload all state into memory from freshly imported localStorage
      const loadedProfiles = storage.getProfiles();
      if (Object.keys(loadedProfiles).length > 0) setProfiles(loadedProfiles);
      setAllProducts(storage.getProducts());
      setCustomers(storage.getCustomers());
      setInvoices(storage.getInvoices());
      setRoznamcha(storage.getRoznamcha());
      setVendors(storage.getVendors());
      setGRNList(storage.getGRNList());
      setStaffList(storage.getStaffList());
      setWhatsAppOrders(storage.getWhatsAppOrders());

      addAuditLog(
        'BACKUP_DISPATCHED',
        `گوگل اکاؤنٹ (${cleanEmail}) سے تمام ڈیٹا، اسٹاک، اور کھاتے کامیابی سے بحال کر دیے گئے۔`
      );

      return {
        success: true,
        message: `مبارک ہو! گوگل اکاؤنٹ (${cleanEmail}) سے سارا ڈیٹا، اسٹاک اور کھاتے کامیابی کے ساتھ بحال ہو گئے ہیں!`,
        stats: fetchRes.stats,
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'بحالی کے دوران تکنیکی خرابی: ' + (err.message || ''),
      };
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
        saleExchanges,
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
        processSaleExchange,
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
        sendDailyReportToEmail,
        syncBackupToGoogleCloud,
        fetchGoogleBackup,
        restoreFromGoogleCloud,
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
        registerUser,
        loginUser,
        superAdminLoginWithMasterKey,
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
