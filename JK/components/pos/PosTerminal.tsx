'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Barcode,
  Mic,
  Plus,
  Minus,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  CreditCard,
  Banknote,
  Split,
  FileQuestion,
  User,
  ShoppingBag,
  Sparkles,
  Receipt,
  AlertCircle,
  TrendingUp,
  Coins,
  X,
  PenTool,
  MessageSquare,
  Phone,
  Clock,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { Product, PaymentMethod, Invoice, CurrencyDenominations } from '@/types';
import { VoiceAssistantModal } from '@/components/VoiceAssistantModal';
import { PrintReceiptModal } from '@/components/pos/PrintReceiptModal';

export const PosTerminal: React.FC = () => {
  const { lang, t } = useLanguage();
  const {
    products,
    cart,
    cartTotals,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    checkoutInvoice,
    customers,
    isMarginUnlocked,
    unlockMargin,
    lockMargin,
    businessProfile,
    currentRole,
    activeCounter,
    activeCashier,
    cashierPermissions,
    whatsappOrders,
    pendingWhatsAppOrdersCount,
    isWhatsAppOrdersModalOpen,
    setIsWhatsAppOrdersModalOpen,
    updateWhatsAppOrderStatus,
    loadWhatsAppOrderIntoCart,
  } = useShop();

  // WhatsApp Orders Management Modal State
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [waFilter, setWaFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Voice Assistant Modal
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState<'order' | 'search' | 'customer'>('order');

  // Admin PIN Modal for Margin Unlock
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Customer & Payment State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [tenderedAmount, setTenderedAmount] = useState<number>(0);
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [tableNo, setTableNo] = useState<string>('');

  // Manual / Custom Unlisted Item State
  const [customItemModalOpen, setCustomItemModalOpen] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState<number>(100);
  const [customItemQty, setCustomItemQty] = useState<number>(1);
  const [customItemUnit, setCustomItemUnit] = useState<string>('عدد');

  // Currency Denominations State (Notes Counter)
  const [cashInputMode, setCashInputMode] = useState<'direct' | 'notes'>('direct');
  const [denominations, setDenominations] = useState<CurrencyDenominations>({
    note5000: 0,
    note1000: 0,
    note500: 0,
    note100: 0,
    note50: 0,
    note20: 0,
    note10: 0,
    coins: 0,
  });

  const notesCalculatedTotal = useMemo(() => {
    return (
      (denominations.note5000 || 0) * 5000 +
      (denominations.note1000 || 0) * 1000 +
      (denominations.note500 || 0) * 500 +
      (denominations.note100 || 0) * 100 +
      (denominations.note50 || 0) * 50 +
      (denominations.note20 || 0) * 20 +
      (denominations.note10 || 0) * 10 +
      (denominations.coins || 0)
    );
  }, [denominations]);

  const updateDenomination = (key: keyof CurrencyDenominations, delta: number) => {
    setDenominations((prev) => ({
      ...prev,
      [key]: Math.max(0, (prev[key] || 0) + delta),
    }));
  };

  const setDenominationCount = (key: keyof CurrencyDenominations, count: number) => {
    setDenominations((prev) => ({
      ...prev,
      [key]: Math.max(0, count),
    }));
  };

  const resetDenominations = () => {
    setDenominations({
      note5000: 0,
      note1000: 0,
      note500: 0,
      note100: 0,
      note50: 0,
      note20: 0,
      note10: 0,
      coins: 0,
    });
  };

  // Sync tendered amount when notes mode is active
  useEffect(() => {
    if (cashInputMode === 'notes' && paymentMethod === 'CASH') {
      setTenderedAmount(notesCalculatedTotal);
    }
  }, [cashInputMode, notesCalculatedTotal, paymentMethod]);

  // Post-checkout Receipt Modal
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Auto-sync amountPaid with grandTotal when cart changes or payment method is CASH
  useEffect(() => {
    if (paymentMethod === 'CASH' || paymentMethod === 'ONLINE') {
      setAmountPaid(cartTotals.grandTotal);
    } else if (paymentMethod === 'CREDIT') {
      setAmountPaid(0);
    }
  }, [cartTotals.grandTotal, paymentMethod]);

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(lang === 'ur' ? p.categoryUr : p.categoryEn));
    return ['all', ...Array.from(set)];
  }, [products, lang]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === 'all' ||
        (lang === 'ur' ? p.categoryUr === selectedCategory : p.categoryEn === selectedCategory);

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.nameEn.toLowerCase().includes(q) ||
        p.nameUr.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.sku.toLowerCase().includes(q);

      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery, lang]);

  // Handle Barcode Scanner Enter Key
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      (p) => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matched) {
      addToCart(matched, 1);
      setBarcodeInput('');
    } else {
      alert(lang === 'ur' ? 'یہ بارکوڈ پروڈکٹ میں نہیں ملا!' : 'Barcode not found!');
    }
  };

  // Select existing customer
  const handleSelectCustomer = (customerId: string) => {
    if (!customerId) {
      setSelectedCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
      return;
    }
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setSelectedCustomerId(cust.id);
      setCustomerName(cust.name);
      setCustomerPhone(cust.phone);
    }
  };

  // Handle PIN unlock
  const handleVerifyPin = () => {
    const success = unlockMargin(enteredPin);
    if (success) {
      setPinModalOpen(false);
      setEnteredPin('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Add manual unlisted custom item directly to cart
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim()) {
      alert(lang === 'ur' ? 'آئٹم کا نام درج کریں' : 'Please enter item name');
      return;
    }
    if (customItemPrice <= 0) {
      alert(lang === 'ur' ? 'قیمت درست درج کریں' : 'Please enter valid price');
      return;
    }

    const customProd: Product = {
      id: `manual_${Date.now()}`,
      preset: 'karyana',
      sku: `MAN-${Date.now().toString().slice(-4)}`,
      barcode: `999${Date.now().toString().slice(-8)}`,
      nameEn: customItemName.trim(),
      nameUr: customItemName.trim(),
      categoryEn: 'General',
      categoryUr: 'عام آئٹمز',
      costPrice: Math.round(customItemPrice * 0.8),
      salePrice: customItemPrice,
      stock: 9999,
      minStockAlert: 0,
      unit: customItemUnit,
    };

    addToCart(customProd, customItemQty || 1);
    setCustomItemName('');
    setCustomItemPrice(100);
    setCustomItemQty(1);
    setCustomItemModalOpen(false);
  };

  // Checkout submission
  const handleCheckout = () => {
    if (cart.length === 0) return;

    const netTotal = Math.max(0, cartTotals.subtotal - orderDiscount);
    const tendered = tenderedAmount > 0 ? tenderedAmount : (paymentMethod === 'CASH' ? netTotal : amountPaid);
    const paid = paymentMethod === 'CREDIT' ? 0 : Math.min(tendered, netTotal);

    const invoice = checkoutInvoice({
      customerName: customerName.trim() || (lang === 'ur' ? 'عام گاہک (Walk-in)' : 'Walk-in Customer'),
      customerPhone: customerPhone.trim(),
      paymentMethod,
      amountPaid: paid,
      tenderedAmount: tendered,
      currencyDenominations:
        paymentMethod === 'CASH' && cashInputMode === 'notes' && notesCalculatedTotal > 0
          ? denominations
          : undefined,
      discount: orderDiscount,
      tableNo: tableNo || undefined,
    });

    setCompletedInvoice(invoice);
    setReceiptModalOpen(true);

    // Reset local customer form & denominations
    setCustomerName('');
    setCustomerPhone('');
    setSelectedCustomerId('');
    setOrderDiscount(0);
    setTenderedAmount(0);
    setAmountPaid(0);
    setTableNo('');
    resetDenominations();
    setCashInputMode('direct');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-130px)] p-2 md:p-4 overflow-hidden">
      {/* LEFT: Product Catalog & Search (60%) */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Active Counter & Cashier Info Strip */}
        <div className="px-3 py-1.5 bg-slate-900 text-white flex items-center justify-between text-xs border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-600 text-white text-[11px]">
              {currentRole === 'MANAGER' ? '👑 Admin Terminal' : `Counter #${activeCounter}`}
            </span>
            <span className="font-bold text-slate-300">
              {currentRole === 'MANAGER'
                ? (lang === 'ur' ? 'مینجر لاگ ان' : 'Manager')
                : (activeCashier?.name || 'کیشیئر')}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono hidden sm:inline">
              • JK Developers Pakistan
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            {/* WhatsApp Orders Notification Button */}
            <button
              type="button"
              onClick={() => setIsWhatsAppOrdersModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-800/90 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm"
              title="واٹس ایپ پر موصول شدہ آرڈرز دیکھیں"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
              <span>{lang === 'ur' ? 'واٹس ایپ آرڈرز' : 'WhatsApp Orders'}</span>
              {pendingWhatsAppOrdersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] animate-pulse">
                  {pendingWhatsAppOrdersCount} پینڈنگ
                </span>
              )}
            </button>

            <span className="text-slate-400">
              {lang === 'ur' ? 'سافٹ ویئر:' : 'Software:'}
            </span>
            <span className="font-bold text-emerald-400">
              {businessProfile.softwareName || 'OneShop POS'}
            </span>
          </div>
        </div>

        {/* Live Pending WhatsApp Order Alert Strip */}
        {pendingWhatsAppOrdersCount > 0 && (
          <div className="bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 border-b border-amber-500/40 px-3 py-1.5 flex items-center justify-between text-xs text-slate-900 dark:text-white">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="font-bold text-[11px]">
                {lang === 'ur'
                  ? `واٹس ایپ پر ${pendingWhatsAppOrdersCount} نیا آرڈر موصول ہوا ہے (پینڈنگ)! فوری بل بنائیں۔`
                  : `${pendingWhatsAppOrdersCount} Pending WhatsApp Order(s) Received!`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsWhatsAppOrdersModalOpen(true)}
              className="px-2.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-[11px] shadow-sm flex items-center gap-1 active:scale-95 transition-all"
            >
              <span>{lang === 'ur' ? 'آرڈرز دیکھیں اور بل کاٹیں' : 'View Orders'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Top Control Bar: Search, Barcode & Voice */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
          {/* Barcode scanner input */}
          <form onSubmit={handleBarcodeSubmit} className="flex-1 min-w-[200px] relative">
            <Barcode className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder={lang === 'ur' ? 'بارکوڈ اسکین کریں یا لکھیں...' : 'Scan barcode or SKU...'}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 font-mono outline-none"
            />
          </form>

          {/* Search by name / keyword */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchProductPlaceholder')}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Voice Order Button */}
          <button
            onClick={() => {
              setVoiceMode('order');
              setVoiceModalOpen(true);
            }}
            className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            title="Speak Order (Urdu / English)"
          >
            <Mic className="w-4 h-4" />
            <span>{t('voiceOrder')}</span>
          </button>

          {/* Quick Manual / Custom Item Add Button */}
          <button
            type="button"
            onClick={() => setCustomItemModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all whitespace-nowrap"
            title={lang === 'ur' ? 'دستی پروڈکٹ خود لکھ کر شامل کریں' : 'Add custom item manually'}
          >
            <PenTool className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ur' ? '✍️ دستی آئٹم خود لکھیں' : 'Custom Item'}</span>
          </button>
        </div>

        {/* Categories Pills */}
        <div className="px-3 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'all' ? t('allCategories') : cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((p) => {
            const isLowStock = p.stock <= p.minStockAlert;
            const profitPerUnit = p.salePrice - p.costPrice;

            return (
              <div
                key={p.id}
                onClick={() => addToCart(p, 1)}
                className="group relative bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-600 rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all shadow-sm hover:shadow-md"
              >
                {/* Low Stock Badge */}
                {isLowStock && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white">
                    {lang === 'ur' ? 'کم اسٹاک' : 'Low Stock'}
                  </span>
                )}

                <div>
                  <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mt-0.5">
                    {lang === 'ur' ? p.nameUr : p.nameEn}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {lang === 'ur' ? p.nameEn : p.nameUr}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-end justify-between">
                  <div>
                    <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {p.salePrice.toLocaleString()} <span className="text-[10px]">PKR</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {lang === 'ur' ? `فی ${p.unit}` : `per ${p.unit}`}
                    </div>
                  </div>

                  {/* Real-time Profit Badge (PIN Protected) */}
                  {isMarginUnlocked ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
                      +{profitPerUnit} PKR
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {p.stock} {p.unit}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Active Cart, Margin Transparency & Checkout (40%) */}
      <div className="w-full lg:w-[440px] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Cart Header */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">
              {t('cart')} ({cartTotals.itemCount})
            </h3>
          </div>

          {/* Admin Live Margin Lock/Unlock Button */}
          <div className="flex items-center gap-2">
            {isMarginUnlocked ? (
              <button
                onClick={lockMargin}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm transition-all"
                title="Lock Live Margin Transparency"
              >
                <Unlock className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[11px] font-mono">
                  {cartTotals.totalProfit.toLocaleString()} PKR
                </span>
              </button>
            ) : (
              <button
                onClick={() => setPinModalOpen(true)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg flex items-center gap-1 transition-all"
                title="Unlock Real-time Profit Margins (Admin PIN)"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px]">{t('unlockMargin')}</span>
              </button>
            )}

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="p-1 text-slate-400 hover:text-rose-400 rounded transition-all"
                title={t('clearCart')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingBag className="w-12 h-12 stroke-[1.2] mb-2 text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-medium max-w-[240px] leading-relaxed">
                {t('emptyCart')}
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-col gap-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                      {lang === 'ur' ? item.product.nameUr : item.product.nameEn}
                    </h5>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Rate: {item.unitPrice} PKR / {item.selectedUnit}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-xs text-slate-900 dark:text-white font-mono">
                      {item.total.toLocaleString()} PKR
                    </div>
                    {/* Item-level profit badge if unlocked */}
                    {isMarginUnlocked && (
                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        +{item.profit.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quantity and Unit Adjustment */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-750 text-xs">
                  {/* Multi-unit dropdown if conversionFactor exists */}
                  {item.product.subUnit ? (
                    <select
                      value={item.selectedUnit}
                      onChange={(e) => {
                        const newUnit = e.target.value;
                        const isSub = newUnit === item.product.subUnit;
                        const factor = item.product.conversionFactor || 1;
                        const price = isSub
                          ? Math.round(item.product.salePrice / factor)
                          : item.product.salePrice;
                        const cost = isSub
                          ? Math.round(item.product.costPrice / factor)
                          : item.product.costPrice;
                        updateCartItem(item.id, {
                          selectedUnit: newUnit,
                          unitPrice: price,
                          costPrice: cost,
                        });
                      }}
                      className="text-[11px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 outline-none font-medium"
                    >
                      <option value={item.product.unit}>{item.product.unit}</option>
                      <option value={item.product.subUnit}>{item.product.subUnit}</option>
                    </select>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-medium">
                      {item.selectedUnit}
                    </span>
                  )}

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (item.quantity > 1) {
                          updateCartItem(item.id, { quantity: item.quantity - 1 });
                        } else {
                          removeFromCart(item.id);
                        }
                      }}
                      className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        updateCartItem(item.id, { quantity: val });
                      }}
                      className="w-10 text-center text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded py-0.5"
                    />
                    <button
                      onClick={() => updateCartItem(item.id, { quantity: item.quantity + 1 })}
                      className="w-6 h-6 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer & Checkout Controls */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          {/* Customer Selection / Quick Khata Search */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-medium outline-none"
            >
              <option value="">
                {lang === 'ur' ? '👤 عام گاہک (Walk-in Customer)' : '👤 Walk-in Customer'}
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) - {lang === 'ur' ? 'بقایا:' : 'Bal:'}{' '}
                  {c.currentBalance.toLocaleString()} PKR
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setVoiceMode('customer');
                setVoiceModalOpen(true);
              }}
              className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 rounded-xl"
              title="Dictate Customer Name & Phone"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-600" />
            </button>
          </div>

          {/* If new walk-in / custom name or phone */}
          {!selectedCustomerId && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t('customerName')}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs outline-none"
              />
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder={t('customerPhone')}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono outline-none"
              />
            </div>
          )}

          {/* Payment Method Pills */}
          <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
            <button
              onClick={() => setPaymentMethod('CASH')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                paymentMethod === 'CASH'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Banknote className="w-3 h-3" />
              <span>{t('cash')}</span>
            </button>
            <button
              onClick={() => setPaymentMethod('ONLINE')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                paymentMethod === 'ONLINE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <CreditCard className="w-3 h-3" />
              <span>{lang === 'ur' ? 'آن لائن' : 'Online'}</span>
            </button>
            <button
              onClick={() => setPaymentMethod('CREDIT')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                paymentMethod === 'CREDIT'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <FileQuestion className="w-3 h-3" />
              <span>{lang === 'ur' ? 'ادھار' : 'Khata'}</span>
            </button>
            <button
              onClick={() => setPaymentMethod('SPLIT')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                paymentMethod === 'SPLIT'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Split className="w-3 h-3" />
              <span>{lang === 'ur' ? 'جزوی' : 'Split'}</span>
            </button>
          </div>

          {/* Discount in Flat Rupees */}
          <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap flex items-center gap-1">
              {lang === 'ur' ? 'رعایت (روپے میں):' : 'Discount (PKR):'}
              {currentRole === 'CASHIER' && !cashierPermissions.canDiscount && (
                <Lock className="w-3 h-3 text-amber-500" />
              )}
            </span>
            {currentRole === 'CASHIER' && !cashierPermissions.canDiscount ? (
              <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                {lang === 'ur' ? 'ڈسکاؤنٹ لاک ہے (مینجر کی اجازت درکار ہے)' : 'Discount Locked (Manager Only)'}
              </span>
            ) : (
              <div className="flex items-center gap-1">
                {[0, 50, 100, 200].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      if (currentRole === 'CASHIER' && cashierPermissions.canDiscount && d > (cashierPermissions.maxDiscountAmount || 500)) {
                        alert(lang === 'ur' ? `زیادہ سے زیادہ اجازت شدہ ڈسکاؤنٹ ${cashierPermissions.maxDiscountAmount} روپے ہے` : `Max discount is ${cashierPermissions.maxDiscountAmount}`);
                        return;
                      }
                      setOrderDiscount(d);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                      orderDiscount === d
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {d === 0 ? '0' : `-${d}`}
                  </button>
                ))}
                <input
                  type="number"
                  min="0"
                  max={currentRole === 'CASHIER' && cashierPermissions.canDiscount ? cashierPermissions.maxDiscountAmount : cartTotals.subtotal}
                  value={orderDiscount || ''}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    if (currentRole === 'CASHIER' && cashierPermissions.canDiscount && val > (cashierPermissions.maxDiscountAmount || 500)) {
                      alert(lang === 'ur' ? `کیشیئر کے لیے حد ${cashierPermissions.maxDiscountAmount} روپے ہے` : `Limit is ${cashierPermissions.maxDiscountAmount}`);
                      setOrderDiscount(cashierPermissions.maxDiscountAmount);
                      return;
                    }
                    setOrderDiscount(val);
                  }}
                  placeholder="0"
                  className="w-16 text-center font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded py-0.5 text-xs outline-none text-rose-600"
                />
              </div>
            )}
          </div>

          {/* Cash Tendered & Currency Notes Calculator (for CASH payment) */}
          {paymentMethod === 'CASH' && (
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-2.5 rounded-xl space-y-2.5 text-xs">
              {/* Cash Input Mode Toggle: Direct Amount vs Currency Notes */}
              <div className="flex items-center justify-between gap-2 border-b border-emerald-200/80 dark:border-emerald-800/60 pb-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {lang === 'ur' ? 'گاہک سے کیش وصولی کا طریقہ:' : 'Cash Collection Mode:'}
                </span>

                <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700 text-[10.5px]">
                  <button
                    type="button"
                    onClick={() => setCashInputMode('direct')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                      cashInputMode === 'direct'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                    }`}
                  >
                    {lang === 'ur' ? 'ڈائریکٹ رقم' : 'Direct Amount'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCashInputMode('notes');
                      if (notesCalculatedTotal > 0) {
                        setTenderedAmount(notesCalculatedTotal);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                      cashInputMode === 'notes'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                    }`}
                  >
                    <Coins className="w-3 h-3" />
                    <span>{lang === 'ur' ? 'کرنسی نوٹ گنیں' : 'Count Notes'}</span>
                    {notesCalculatedTotal > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </button>
                </div>
              </div>

              {/* MODE 1: Direct Amount Entry */}
              {cashInputMode === 'direct' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      {lang === 'ur' ? 'وصول شدہ رقم (روپے):' : 'Tendered Cash (PKR):'}
                    </label>
                    <input
                      type="number"
                      value={tenderedAmount || ''}
                      onChange={(e) => setTenderedAmount(parseFloat(e.target.value) || 0)}
                      placeholder={Math.max(0, cartTotals.subtotal - orderDiscount).toString()}
                      className="w-28 text-center text-sm font-mono font-black bg-white dark:bg-slate-800 border-2 border-emerald-500 rounded-lg py-1 outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>

                  {/* Quick note buttons */}
                  <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono font-bold pt-0.5">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans whitespace-nowrap">
                      فوری رقم:
                    </span>
                    <button
                      type="button"
                      onClick={() => setTenderedAmount(Math.max(0, cartTotals.subtotal - orderDiscount))}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-slate-800 dark:text-slate-200 whitespace-nowrap"
                    >
                      برابر ({Math.max(0, cartTotals.subtotal - orderDiscount)})
                    </button>
                    {[500, 1000, 2000, 5000].map((note) => (
                      <button
                        key={note}
                        type="button"
                        onClick={() => setTenderedAmount(note)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-400"
                      >
                        {note}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MODE 2: Pakistani Currency Notes Counter */}
              {cashInputMode === 'notes' && (
                <div className="space-y-2 bg-white/90 dark:bg-slate-900/90 p-2 rounded-xl border border-emerald-300 dark:border-emerald-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-emerald-600" />
                      {lang === 'ur' ? 'پاکستانی نوٹوں کی تعداد درج کریں:' : 'Pakistani Notes Counter:'}
                    </span>
                    <button
                      type="button"
                      onClick={resetDenominations}
                      className="text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline"
                    >
                      {lang === 'ur' ? 'تمام نوٹ صفر کریں' : 'Reset All'}
                    </button>
                  </div>

                  {/* Denominations Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                    {(
                      [
                        { key: 'note5000' as const, val: 5000, label: '5000' },
                        { key: 'note1000' as const, val: 1000, label: '1000' },
                        { key: 'note500' as const, val: 500, label: '500' },
                        { key: 'note100' as const, val: 100, label: '100' },
                        { key: 'note50' as const, val: 50, label: '50' },
                        { key: 'note20' as const, val: 20, label: '20' },
                        { key: 'note10' as const, val: 10, label: '10' },
                        { key: 'coins' as const, val: 1, label: 'سکے' },
                      ] as const
                    ).map((denom) => {
                      const count = denominations[denom.key] || 0;
                      const sub = count * denom.val;
                      return (
                        <div
                          key={denom.key}
                          className={`p-1.5 rounded-lg border transition-all ${
                            count > 0
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                              Rs.{denom.label}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {sub > 0 ? `${sub.toLocaleString()}` : ''}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => updateDenomination(denom.key, -1)}
                              disabled={count === 0}
                              className="w-5 h-5 rounded flex items-center justify-center bg-slate-200 dark:bg-slate-700 disabled:opacity-40 font-bold text-xs hover:bg-slate-300"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={count || ''}
                              onChange={(e) =>
                                setDenominationCount(denom.key, parseInt(e.target.value) || 0)
                              }
                              placeholder="0"
                              className="w-8 text-center text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded py-0.5 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => updateDenomination(denom.key, 1)}
                              className="w-5 h-5 rounded flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Notes Summary */}
                  <div className="flex items-center justify-between text-[11px] font-bold pt-1 border-t border-emerald-200 dark:border-emerald-800">
                    <span className="text-slate-600 dark:text-slate-300">
                      {lang === 'ur' ? 'کل موصولہ نوٹوں کی رقم:' : 'Total Notes Tendered:'}
                    </span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 text-sm">
                      {notesCalculatedTotal.toLocaleString()} PKR
                    </span>
                  </div>
                </div>
              )}

              {/* Big Bold Return Change Banner */}
              {tenderedAmount > 0 && (
                <div
                  className={`p-2.5 rounded-xl flex items-center justify-between font-bold text-xs shadow-md transition-all ${
                    tenderedAmount >= Math.max(0, cartTotals.subtotal - orderDiscount)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  <span className="text-xs">
                    {tenderedAmount >= Math.max(0, cartTotals.subtotal - orderDiscount)
                      ? lang === 'ur'
                        ? '💵 واپسی بقایا رقم (گاہک کو واپس کریں):'
                        : 'Change to Return:'
                      : lang === 'ur'
                      ? '⚠️ کم رقم موصول (کھاتہ میں بقایا جائے گی):'
                      : 'Balance Remaining:'}
                  </span>
                  <span className="text-base font-black font-mono">
                    {tenderedAmount >= Math.max(0, cartTotals.subtotal - orderDiscount)
                      ? `${(tenderedAmount - Math.max(0, cartTotals.subtotal - orderDiscount)).toLocaleString()} PKR`
                      : `${(Math.max(0, cartTotals.subtotal - orderDiscount) - tenderedAmount).toLocaleString()} PKR`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Amount Paid & Due Calculation (for Split or partial) */}
          {(paymentMethod === 'SPLIT' || paymentMethod === 'CREDIT') && (
            <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 font-semibold block">
                  {t('amountPaid')}
                </label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Math.max(0, parseFloat(e.target.value) || 0))}
                  disabled={paymentMethod === 'CREDIT'}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-rose-500 font-semibold block">
                  {t('balanceDue')}
                </label>
                <div className="font-mono font-bold text-rose-600 dark:text-rose-400 py-1">
                  {Math.max(
                    0,
                    cartTotals.grandTotal - (paymentMethod === 'CREDIT' ? 0 : amountPaid)
                  ).toLocaleString()}{' '}
                  PKR
                </div>
              </div>
            </div>
          )}

          {/* Totals Summary */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>{t('subtotal')}:</span>
              <span className="font-mono">{cartTotals.subtotal.toLocaleString()} PKR</span>
            </div>

            {/* Live Net Profit display when Admin Margin is unlocked */}
            {isMarginUnlocked && (
              <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {t('netProfit')}:
                </span>
                <span className="font-mono">+{cartTotals.totalProfit.toLocaleString()} PKR</span>
              </div>
            )}

            {orderDiscount > 0 && (
              <div className="flex justify-between text-rose-500 font-bold">
                <span>رعایت (ڈسکاؤنٹ):</span>
                <span className="font-mono">- {orderDiscount.toLocaleString()} PKR</span>
              </div>
            )}

            <div className="flex justify-between items-center text-base font-black text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-750">
              <span>{t('grandTotal')}:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 text-xl">
                {Math.max(0, cartTotals.subtotal - orderDiscount).toLocaleString()} PKR
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-95 transition-all"
          >
            <Receipt className="w-5 h-5" />
            <span>{t('completeSale')}</span>
          </button>
        </div>
      </div>

      {/* Admin PIN Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-xl">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {t('unlockMargin')}
                </h3>
                <p className="text-xs text-slate-500">{t('enterPin')}</p>
              </div>
            </div>

            <input
              type="password"
              autoFocus
              maxLength={6}
              value={enteredPin}
              onChange={(e) => {
                setEnteredPin(e.target.value);
                setPinError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleVerifyPin();
              }}
              placeholder="••••"
              className="w-full text-center text-2xl tracking-widest font-mono py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl mb-3 outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {pinError && (
              <p className="text-xs text-rose-500 text-center mb-3 font-semibold">
                {t('invalidPin')}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPinModalOpen(false);
                  setEnteredPin('');
                  setPinError(false);
                }}
                className="flex-1 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleVerifyPin}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Incoming Orders Manager Modal */}
      {whatsAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 md:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black tracking-tight">
                      {lang === 'ur' ? 'واٹس ایپ آرڈرز و بلنگ مینیجر' : 'WhatsApp Orders & Auto-Billing Manager'}
                    </h2>
                    {pendingWhatsAppOrdersCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs animate-pulse">
                        {pendingWhatsAppOrdersCount} پینڈنگ (Pending)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'ur'
                      ? 'گاہک کے واٹس ایپ میسج سے خودکار بل تیار کریں، پینڈنگ لسٹ دیکھیں اور POS میں لوڈ کریں'
                      : 'Auto-calculate bills from WhatsApp messages & convert to POS sales with one click'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/${(businessProfile.whatsapp || '').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold transition-all shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{lang === 'ur' ? 'شاپ واٹس ایپ لنک' : 'Shop WhatsApp'}</span>
                </a>

                <button
                  onClick={() => setWhatsAppModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setWaFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                    waFilter === 'PENDING'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{lang === 'ur' ? '⏳ پینڈنگ آرڈرز' : 'Pending Orders'}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-white text-[10px]">
                    {whatsappOrders.filter((o) => o.status === 'PENDING').length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setWaFilter('COMPLETED')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                    waFilter === 'COMPLETED'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{lang === 'ur' ? '✅ مکمل شدہ' : 'Completed / Accepted'}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white text-[10px]">
                    {whatsappOrders.filter((o) => o.status === 'ACCEPTED' || o.status === 'COMPLETED').length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setWaFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    waFilter === 'ALL'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {lang === 'ur' ? 'تمام آرڈرز' : 'All Orders'} ({whatsappOrders.length})
                </button>
              </div>

              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                Realtime Auto-Sync with WhatsApp Bot
              </span>
            </div>

            {/* Orders List Area */}
            <div className="p-4 md:p-6 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-950 flex-1">
              {whatsappOrders
                .filter((o) => {
                  if (waFilter === 'PENDING') return o.status === 'PENDING';
                  if (waFilter === 'COMPLETED') return o.status === 'ACCEPTED' || o.status === 'COMPLETED';
                  return true;
                })
                .map((ord) => {
                  return (
                    <div
                      key={ord.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        ord.status === 'PENDING'
                          ? 'bg-white dark:bg-slate-900 border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                          : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {/* Top Bar of Order Card */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            #{ord.orderNo}
                          </span>
                          <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                            <Clock className="w-3 h-3" />
                            {new Date(ord.date).toLocaleDateString()} {new Date(ord.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {ord.status === 'PENDING' && (
                            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 font-black text-xs flex items-center gap-1.5 animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              <span>⏳ پینڈنگ (Pending)</span>
                            </span>
                          )}
                          {ord.status === 'ACCEPTED' && (
                            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40 font-bold text-xs flex items-center gap-1">
                              <span>🛒 بل تیار کیا جا رہا ہے (In Progress)</span>
                            </span>
                          )}
                          {ord.status === 'COMPLETED' && (
                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 font-bold text-xs flex items-center gap-1">
                              <span>✅ بل مکمل ہو گیا (Completed)</span>
                            </span>
                          )}
                          {ord.status === 'CANCELLED' && (
                            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-600 border border-rose-500/40 font-bold text-xs">
                              ❌ منسوخ (Cancelled)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Customer Details & Raw Message */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-[11px]">گاہک کا نام:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{ord.customerName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-[11px]">واٹس ایپ فون:</span>
                            <a
                              href={`https://wa.me/${ord.customerPhone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{ord.customerPhone}</span>
                            </a>
                          </div>
                          {ord.customerAddress && (
                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700">
                              <span className="text-slate-500">پتہ برائے ڈیلیوری:</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{ord.customerAddress}</span>
                            </div>
                          )}
                        </div>

                        {/* Customer WhatsApp Message Bubble */}
                        {ord.rawMessage && (
                          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs">
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block mb-0.5">
                              💬 کسٹمر کا اصل واٹس ایپ میسج:
                            </span>
                            <p className="font-nastaliq text-[13px] leading-snug text-slate-800 dark:text-slate-200" dir="rtl">
                              "{ord.rawMessage}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Items Breakdown Table */}
                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                            <tr>
                              <th className="p-2 text-center w-8">#</th>
                              <th className="p-2">سامان کی تفصیل (آئٹم)</th>
                              <th className="p-2 text-center w-20">تعداد / وزن</th>
                              <th className="p-2 text-left w-24">ریٹ (PKR)</th>
                              <th className="p-2 text-left w-28">کل رقم (PKR)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {ord.items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                                <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                                <td className="p-2 font-bold text-slate-900 dark:text-white">
                                  {item.productName}
                                </td>
                                <td className="p-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {item.quantity} {item.unit}
                                </td>
                                <td className="p-2 text-left font-mono text-slate-600 dark:text-slate-400">
                                  {item.unitPrice.toLocaleString()}
                                </td>
                                <td className="p-2 text-left font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {item.total.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Total & Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-bold">
                            {lang === 'ur' ? 'کل بل کی رقم:' : 'Grand Total:'}
                          </span>
                          <span className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400">
                            {ord.grandTotal.toLocaleString()} PKR
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* 1-Click Load into POS Bill */}
                          {ord.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => {
                                const res = loadWhatsAppOrderIntoCart(ord.id);
                                if (res.success) {
                                  if (res.customerName) setCustomerName(res.customerName);
                                  if (res.customerPhone) setCustomerPhone(res.customerPhone);
                                  setWhatsAppModalOpen(false);
                                }
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                            >
                              <ShoppingBag className="w-4 h-4" />
                              <span>{lang === 'ur' ? '🛒 بل میں لوڈ کریں اور پرنٹ نکالیں' : 'Convert to POS Bill'}</span>
                            </button>
                          )}

                          {/* Send WhatsApp Bill Message to Customer */}
                          <button
                            type="button"
                            onClick={() => {
                              const itemsText = ord.items
                                .map((it) => `- ${it.productName}: ${it.quantity} ${it.unit} = ${it.total} روپے`)
                                .join('\n');
                              const msg = `محترم جناب ${ord.customerName}!
آپ کے واٹس ایپ آرڈر #${ord.orderNo} کا بل درج ذیل بن گیا ہے:
${itemsText}
------------------------
کل واجب الادا رقم: ${ord.grandTotal.toLocaleString()} روپے
ہم آپ کا آرڈر تیار کر رہے ہیں۔ تشریف آوری یا ڈیلیوری کا شکریہ!
${businessProfile.nameUr} (${businessProfile.phone})`;
                              let cleanPhone = ord.customerPhone.replace(/[^0-9]/g, '');
                              if (cleanPhone.startsWith('03')) cleanPhone = '92' + cleanPhone.substring(1);
                              window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="px-3 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{lang === 'ur' ? 'گاہک کو واٹس ایپ بل بھیجیں' : 'Send WhatsApp Bill'}</span>
                          </button>

                          {ord.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => updateWhatsAppOrderStatus(ord.id, 'CANCELLED')}
                              className="px-2.5 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl font-bold text-xs"
                            >
                              {lang === 'ur' ? 'منسوخ' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

              {whatsappOrders.filter((o) => {
                if (waFilter === 'PENDING') return o.status === 'PENDING';
                if (waFilter === 'COMPLETED') return o.status === 'ACCEPTED' || o.status === 'COMPLETED';
                return true;
              }).length === 0 && (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 opacity-80" />
                  <p className="font-bold text-sm">
                    {lang === 'ur' ? 'اس وقت کوئی پینڈنگ واٹس ایپ آرڈر موجود نہیں ہے!' : 'No pending WhatsApp orders!'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {lang === 'ur'
                      ? 'جب بھی کوئی کسٹمر واٹس ایپ پر آرڈر دے گا تو وہ خودکار یہاں پینڈنگ شو ہو جائے گا۔'
                      : 'Incoming customer orders via WhatsApp will automatically appear here as Pending.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Item Manual Modal */}
      {customItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAddCustomItem}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {lang === 'ur' ? 'دستی پروڈکٹ خود لکھ کر شامل کریں' : 'Add Custom Item to Bill'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'ur' ? 'بغیر لسٹ کے کوئی بھی سودا یا سروس فوری بل میں درج کریں' : 'Quickly add any unlisted item directly into customer cart'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomItemModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'ur' ? 'آئٹم کا نام (اردو یا انگریزی):' : 'Item Name (Urdu or English):'}
              </label>
              <input
                type="text"
                autoFocus
                required
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                placeholder={lang === 'ur' ? 'مثلاً: کھلا صابن، سروس، کھلا مصالحہ' : 'e.g. Open Rice, Delivery, Repair'}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'ur' ? 'قیمت (PKR):' : 'Price (PKR):'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={customItemPrice || ''}
                  onChange={(e) => setCustomItemPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'ur' ? 'تعداد:' : 'Quantity:'}
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={customItemQty || ''}
                  onChange={(e) => setCustomItemQty(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'ur' ? 'یونٹ:' : 'Unit:'}
                </label>
                <select
                  value={customItemUnit}
                  onChange={(e) => setCustomItemUnit(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-2 text-xs font-bold outline-none"
                >
                  <option value="عدد">عدد (Piece)</option>
                  <option value="کلو">کلو (Kg)</option>
                  <option value="گرام">گرام (Gram)</option>
                  <option value="لیٹر">لیٹر (Liter)</option>
                  <option value="پیکٹ">پیکٹ (Pack)</option>
                  <option value="درجن">درجن (Dozen)</option>
                  <option value="میٹر">میٹر (Meter)</option>
                </select>
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-between font-bold">
              <span className="text-slate-600 dark:text-slate-300">
                {lang === 'ur' ? 'کل رقم:' : 'Total Amount:'}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                {(customItemPrice * customItemQty).toLocaleString()} PKR
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCustomItemModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                {lang === 'ur' ? 'منسوخ کریں' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md"
              >
                {lang === 'ur' ? 'بل میں شامل کریں (Add to Bill)' : 'Add to Bill'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        mode={voiceMode}
        onApplySearch={(text) => {
          setSearchQuery(text);
          setVoiceModalOpen(false);
        }}
        onApplyCustomer={(cust) => {
          setCustomerName(cust.name);
          if (cust.phone) setCustomerPhone(cust.phone);
          setVoiceModalOpen(false);
        }}
      />

      {/* Print Receipt & Invoice Modal */}
      <PrintReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        invoice={completedInvoice}
        businessProfile={businessProfile}
      />
    </div>
  );
};
