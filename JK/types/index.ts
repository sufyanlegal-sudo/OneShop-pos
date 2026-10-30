export type BusinessPresetType = 'karyana' | 'general_store' | 'garments' | 'sweets' | 'confectionery' | 'restaurant';

export type Language = 'ur' | 'en';

export type UserRole = 'MANAGER' | 'CASHIER';

export type PaymentMethod = 'CASH' | 'ONLINE' | 'CREDIT' | 'SPLIT';

export interface CurrencyDenominations {
  note5000?: number;
  note1000?: number;
  note500?: number;
  note100?: number;
  note50?: number;
  note20?: number;
  note10?: number;
  coins?: number;
}

export interface CashierModulePermissions {
  pos: boolean;
  canDiscount: boolean;
  maxDiscountAmount: number;
  canReturn: boolean;
  canViewCostMargin: boolean;
  billsHistory: boolean;
  grn: boolean;
  vendors: boolean;
  roznamcha: boolean;
  khata: boolean;
  inventory: boolean;
  staff: boolean;
  reports: boolean;
  audit: boolean;
  whatsapp: boolean;
  settings: boolean;
}

export interface CashierAccount {
  id: string;
  counterNumber: number; // 1 to 10
  name: string;
  pin: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  permissions?: Partial<CashierModulePermissions>;
  createdAt?: string;
}

export interface BusinessProfile {
  id: string;
  preset: BusinessPresetType;
  softwareName?: string; // Software branding name (e.g. "OneShop POS")
  nameEn: string;
  nameUr: string;
  taglineEn: string;
  taglineUr: string;
  addressEn: string;
  addressUr: string;
  branch: string;
  phone: string;
  whatsapp: string;
  ntn: string;
  logoUrl: string;
  adminPin: string; // Manager PIN for sensitive actions (default '1234')
  currency: string;
  cashierPin?: string;
  cashierPermissions?: Partial<CashierModulePermissions>;
  cashierAccounts?: CashierAccount[];
  backupEmail?: string;
  autoDailyBackup?: boolean;
  lastBackupDate?: string;
}

export interface UnitConversion {
  baseUnit: string;
  subUnit: string;
  factor: number;
}

export interface Product {
  id: string;
  preset: BusinessPresetType;
  barcode: string;
  sku: string;
  nameEn: string;
  nameUr: string;
  categoryEn: string;
  categoryUr: string;
  unit: string;
  subUnit?: string;
  conversionFactor?: number;
  costPrice: number;
  salePrice: number;
  wholesalePrice?: number;
  wholesaleRate?: number;
  stock: number;
  minStockAlert: number;
  image?: string;
  hasVariations?: boolean;
  sizes?: string[];
  colors?: string[];
  variations?: Record<string, any>;
  isKotItem?: boolean;
  tableNumber?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unit: string;
  selectedUnit?: string;
  unitPrice?: number;
  costPrice?: number;
  selectedPrice: number;
  total: number;
  profit: number;
  discount: number;
  variationDetails?: string;
  returnedQuantity?: number;
  isGram?: boolean;
  weightInGrams?: number;
  ratePerKg?: number;
  costPerKg?: number;
  isLiter?: boolean;
  volumeInMl?: number;
  ratePerLiter?: number;
  costPerLiter?: number;
  packagedVariant?: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  nameUr: string;
  nameEn: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  costPrice: number;
  total: number;
  profit: number;
  discount: number;
  variationDetails?: string;
  returnedQuantity?: number;
  isGram?: boolean;
  weightInGrams?: number;
  ratePerKg?: number;
  costPerKg?: number;
  isLiter?: boolean;
  volumeInMl?: number;
  ratePerLiter?: number;
  costPerLiter?: number;
  packagedVariant?: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerId?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  discountType?: 'FLAT' | 'PERCENT';
  grandTotal: number;
  totalProfit: number;
  paidAmount: number;
  balanceDue: number;
  tenderedAmount?: number;
  changeDue?: number;
  previousBalance?: number;
  netTotalDebt?: number;
  tableNo?: string;
  notes?: string;
  paymentMethod: 'CASH' | 'ONLINE' | 'CREDIT' | 'SPLIT';
  cashier: string;
  cashierId?: string;
  counterNumber?: number; // Counter #1 to #10
  currencyDenominations?: CurrencyDenominations;
  preset: BusinessPresetType;
  developerBranding: 'JK Developers Pakistan' | 'JK Software Developer';
  status: 'COMPLETED' | 'RETURNED' | 'PARTIALLY_RETURNED';
}

export interface SaleReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalRefund: number;
}

export interface SaleReturn {
  id: string;
  returnNo: string;
  invoiceId: string;
  invoiceNo: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerId?: string;
  items: SaleReturnItem[];
  totalRefund: number;
  refundMethod: 'CASH' | 'KHATA_CREDIT';
  reason: string;
  cashier: string;
  counterNumber?: number;
  developerBranding: 'JK Developers Pakistan' | 'JK Software Developer';
}

export interface SaleExchangeItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface SaleExchange {
  id: string;
  exchangeNo: string;
  invoiceId?: string;
  invoiceNo?: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerId?: string;
  returnedItems: SaleReturnItem[];
  totalReturnValue: number;
  newItems: SaleExchangeItem[];
  totalNewValue: number;
  differenceAmount: number; // >0: customer pays extra, <0: refund to customer, 0: even exchange
  paymentMethod: 'CASH' | 'KHATA_CREDIT' | 'CARD';
  reason: string;
  cashier: string;
  counterNumber?: number;
  developerBranding: 'JK Developers Pakistan' | 'JK Software Developer';
}

// Vendor / Supplier Model
export interface VendorKhataEntry {
  id: string;
  vendorId: string;
  date: string;
  type: 'PURCHASE' | 'PAYMENT' | 'RETURN';
  amount: number;
  balanceAfter: number;
  description: string;
  grnId?: string;
}

export interface Vendor {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  whatsapp?: string;
  address: string;
  ntn?: string;
  balance: number; // Positive = payable to vendor (واجب الادا)
  khata: VendorKhataEntry[];
  createdAt: string;
}

// Goods Received Note (GRN) Model
export interface GRNItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  costPrice: number;
  salePrice?: number;
  discount: number; // Flat Rs discount on item
  totalCost: number;
  batchNo?: string;
  expiryDate?: string;
}

export interface GRN {
  id: string;
  grnNo: string;
  date: string;
  vendorId: string;
  vendorName: string;
  biltyNo?: string;
  invoiceNo?: string;
  items: GRNItem[];
  subtotal: number;
  discount: number; // Flat Rs discount
  extraExpenses: number; // Freight / Labour
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: 'CASH' | 'BANK' | 'CREDIT' | 'PARTIAL';
  notes?: string;
  receivedBy: string;
  developerBranding: 'JK Developers Pakistan' | 'JK Software Developer';
}

// Staff Model
export interface StaffPayment {
  id: string;
  staffId: string;
  date: string;
  amount: number;
  month: string;
  paymentType: 'SALARY' | 'ADVANCE' | 'BONUS';
  notes?: string;
}

export interface Staff {
  id: string;
  name: string;
  designation: 'CASHIER' | 'SALESMAN' | 'MANAGER' | 'HELPER' | 'OTHER';
  phone: string;
  monthlySalary: number;
  joiningDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  payments: StaffPayment[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 
    | 'SALE_CREATED' 
    | 'SALE_RETURN' 
    | 'SALE_EXCHANGE'
    | 'KHATA_PAYMENT' 
    | 'EXPENSE_RECORDED' 
    | 'STOCK_UPDATED' 
    | 'STOCK_ADDED' 
    | 'SETTINGS_CHANGED' 
    | 'LOGIN_MANAGER' 
    | 'CASHIER_ACCESS_GRANTED'
    | 'GRN_CREATED'
    | 'VENDOR_PAYMENT'
    | 'STAFF_ADDED'
    | 'STAFF_SALARY_PAID'
    | 'BACKUP_DISPATCHED';
  user: string;
  role: UserRole;
  details: string;
  amount?: number;
  refId?: string;
}

export interface KhataEntry {
  id: string;
  customerId: string;
  date: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  balanceAfter: number;
  description: string;
  invoiceId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  creditLimit: number;
  currentBalance: number;
  khata: KhataEntry[];
  createdAt: string;
}

export type RoznamchaType = 
  | 'CASH_SALE' 
  | 'CREDIT_RECOVERY' 
  | 'SUPPLIER_PAYOUT' 
  | 'EXPENSE' 
  | 'SALE_RETURN_REFUND'
  | 'STAFF_SALARY'
  | 'CASH_IN' 
  | 'CASH_OUT';

export interface RoznamchaEntry {
  id: string;
  date: string;
  type: RoznamchaType;
  category: string;
  amount: number;
  isCashIn: boolean;
  description: string;
  refInvoiceId?: string;
  refCustomerId?: string;
  refVendorId?: string;
  refStaffId?: string;
}

export interface WhatsAppOrder {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  date: string;
  items: {
    productId?: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }[];
  grandTotal: number;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';
  rawMessage?: string;
  notes?: string;
}

export interface WhatsAppMessage {
  id: string;
  timestamp: string;
  sender: 'CUSTOMER' | 'BOT' | 'SYSTEM';
  text: string;
  parsedOrder?: {
    items: {
      name: string;
      qty: number;
      unit: string;
      price: number;
      total: number;
      matchedProductId?: string;
    }[];
    grandTotal: number;
    status: 'PARSED' | 'CONFIRMED' | 'REJECTED';
  };
}

export interface PosUserLicense {
  email: string;
  name?: string;
  approved: boolean;
  registeredAt?: string;
  approvedAt?: string;
  phone?: string;
  shopName?: string;
}
