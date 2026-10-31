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
  Check,
  CheckCircle2,
  CreditCard,
  Banknote,
  Split,
  FileQuestion,
  User,
  ShoppingBag,
  Sparkles,
  Receipt,
  Printer,
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
  QrCode,
  Camera,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Repeat,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { Product, PaymentMethod, Invoice, CurrencyDenominations } from '@/types';
import { VoiceAssistantModal } from '@/components/VoiceAssistantModal';
import { PrintReceiptModal } from '@/components/pos/PrintReceiptModal';
import { ExchangeModal } from '@/components/pos/ExchangeModal';

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
    saveProduct,
    activePreset,
  } = useShop();

  // WhatsApp Orders Management Modal State
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [waFilter, setWaFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Screen Layout Mode: Full Dedicated Billing Mode (false) vs Side-by-Side Catalog Grid Mode (true)
  const [showCatalog, setShowCatalog] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos_show_catalog');
      return saved === 'true'; // Default is false: Full-screen bill-centric mode as requested by user
    }
    return false;
  });

  const toggleCatalog = () => {
    setShowCatalog((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_show_catalog', String(next));
      }
      return next;
    });
  };

  // Search auto-suggest dropdown state
  const [searchSuggestionsOpen, setSearchSuggestionsOpen] = useState(false);

  // QR Code & Camera Scanner Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrManualInput, setQrManualInput] = useState('');
  const [qrSuccessMsg, setQrSuccessMsg] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Camera video stream life-cycle
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (qrModalOpen && isCameraActive && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch(() => {
          setIsCameraActive(false);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [qrModalOpen, isCameraActive]);

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

  // Return & Exchange Modal
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState<number>(100);
  const [customItemQty, setCustomItemQty] = useState<number>(1);
  const [customItemUnit, setCustomItemUnit] = useState<string>('عدد');
  const [customItemCategory, setCustomItemCategory] = useState<string>('عام اشیاء');
  const [saveCustomToCatalog, setSaveCustomToCatalog] = useState<boolean>(true);
  const [justConfirmedId, setJustConfirmedId] = useState<string | null>(null);

  // Auto-scroll refs for active bill list
  const cartEndRef = useRef<HTMLDivElement>(null);
  const cartContainerRef = useRef<HTMLDivElement>(null);
  const tenderedInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll the bill list down to the latest item smoothly whenever cart updates (NO MOUSE NEEDED)
  useEffect(() => {
    if (cart.length > 0) {
      setTimeout(() => {
        if (cartContainerRef.current) {
          cartContainerRef.current.scrollTop = cartContainerRef.current.scrollHeight;
        }
        cartEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 50);
    }
  }, [cart, cart.length]);

  // Keyboard Shortcuts: F12 or Enter = Complete & Print, F4 = Cash Input, F2/F9 = Barcode Search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // F12 or Alt+Enter -> Instant Complete & Print Bill
      if (e.key === 'F12' || (e.altKey && e.key === 'Enter')) {
        e.preventDefault();
        if (cart.length > 0) {
          handleCheckout();
        }
        return;
      }

      // F4 -> Jump directly to Cash Received Input
      if (e.key === 'F4') {
        e.preventDefault();
        tenderedInputRef.current?.focus();
        tenderedInputRef.current?.select();
        return;
      }

      // F2 or F9 -> Jump focus back to Barcode Scanner Input
      if (e.key === 'F2' || e.key === 'F9') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [cart.length, cartTotals.subtotal, orderDiscount, tenderedAmount, paymentMethod, amountPaid]);

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

  // Quick confirmation feedback when cashier enters grams or volume and presses Enter
  const handleConfirmGram = (itemId: string) => {
    setJustConfirmedId(itemId);
    setTimeout(() => {
      setJustConfirmedId((prev) => (prev === itemId ? null : prev));
    }, 1500);
    // Refocus barcode input immediately for high-speed continuous scanning
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  };

  // Auto-sync amountPaid with grandTotal when cart changes or payment method is CASH
  useEffect(() => {
    if (paymentMethod === 'CASH' || paymentMethod === 'ONLINE') {
      setAmountPaid(cartTotals.grandTotal);
    } else if (paymentMethod === 'CREDIT') {
      setAmountPaid(0);
    }
  }, [cartTotals.grandTotal, paymentMethod]);

  // Extract categories (all available portions)
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const cat = lang === 'ur' ? (p.categoryUr || p.categoryEn) : (p.categoryEn || p.categoryUr);
      if (cat && cat.trim()) set.add(cat.trim());
    });
    return ['all', ...Array.from(set)];
  }, [products, lang]);

  // Filtered products (Matches specific portion when selected, and ALL products when 'all' is selected)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const pCat = lang === 'ur' ? (p.categoryUr || p.categoryEn) : (p.categoryEn || p.categoryUr);
      const matchCat =
        selectedCategory === 'all' ||
        pCat === selectedCategory ||
        p.categoryUr === selectedCategory ||
        p.categoryEn === selectedCategory;

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

  // Global search suggestions (across all categories for fast billing input)
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return products.filter(
      (p) =>
        p.nameEn.toLowerCase().includes(q) ||
        p.nameUr.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  // Handle Search Input Enter Key (Adds top match directly to bill)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      addToCart(searchResults[0], 1);
      setSearchQuery('');
      setSearchSuggestionsOpen(false);
      barcodeInputRef.current?.focus();
    }
  };

  // Handle QR / Barcode Scan submission
  const handleQrScanSubmit = (scannedCode: string) => {
    const clean = scannedCode.trim();
    if (!clean) return;

    const matched = products.find(
      (p) =>
        p.barcode === clean ||
        p.sku.toLowerCase() === clean.toLowerCase() ||
        p.id === clean ||
        clean.includes(p.barcode)
    );

    if (matched) {
      addToCart(matched, 1);
      setQrSuccessMsg(
        lang === 'ur'
          ? `✓ "${matched.nameUr}" بل میں شامل ہو گیا!`
          : `✓ Added "${matched.nameEn}" to bill!`
      );
      setQrManualInput('');
      setTimeout(() => setQrSuccessMsg(null), 2500);
    } else {
      alert(lang === 'ur' ? 'یہ کیو آر کوڈ یا بارکوڈ سسٹم میں موجود نہیں!' : 'QR / Barcode not found!');
    }
  };

  // Handle Barcode Scanner Enter Key
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) {
      // If empty barcode and cart has items: jump straight to tendered amount or checkout without mouse!
      if (cart.length > 0) {
        if (tenderedAmount > 0) {
          handleCheckout();
        } else {
          tenderedInputRef.current?.focus();
          tenderedInputRef.current?.select();
        }
      }
      return;
    }

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

  // Weight & Volume helper functions (Kg, Grams, Liters, Milliliters)
  const isWeightEligible = (item: { product: Product; selectedUnit?: string; isGram?: boolean }) => {
    const u = (item.product.unit || '').toLowerCase();
    const su = (item.product.subUnit || '').toLowerCase();
    return (
      u === 'kg' ||
      u === 'کلو' ||
      u === 'kilogram' ||
      su === 'grams' ||
      su === 'gram' ||
      su === 'گرام' ||
      su === 'g' ||
      item.isGram ||
      item.selectedUnit === 'گرام' ||
      item.selectedUnit === 'Grams' ||
      item.product.conversionFactor === 1000
    );
  };

  const isWeightEligibleProduct = (p: Product) => {
    const u = (p.unit || '').toLowerCase();
    const su = (p.subUnit || '').toLowerCase();
    return (
      u === 'kg' ||
      u === 'کلو' ||
      u === 'kilogram' ||
      su === 'grams' ||
      su === 'gram' ||
      su === 'گرام' ||
      su === 'g' ||
      p.conversionFactor === 1000
    );
  };

  const isLiterEligible = (item: { product: Product; selectedUnit?: string; isLiter?: boolean }) => {
    const u = (item.product.unit || '').toLowerCase();
    const su = (item.product.subUnit || '').toLowerCase();
    return (
      u === 'liter' ||
      u === 'litre' ||
      u === 'لیٹر' ||
      u === 'ltr' ||
      u === 'l' ||
      su === 'ml' ||
      su === 'ملی لیٹر' ||
      su === 'ہاف لیٹر' ||
      item.isLiter ||
      item.selectedUnit === 'ملی لیٹر' ||
      item.selectedUnit === 'لیٹر'
    );
  };

  const isLiterEligibleProduct = (p: Product) => {
    const u = (p.unit || '').toLowerCase();
    const su = (p.subUnit || '').toLowerCase();
    return (
      u === 'liter' ||
      u === 'litre' ||
      u === 'لیٹر' ||
      u === 'ltr' ||
      u === 'l' ||
      su === 'ml' ||
      su === 'ملی لیٹر' ||
      su === 'ہاف لیٹر'
    );
  };

  // Add manual unlisted custom item directly to cart (MANAGER ONLY)
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole !== 'MANAGER') {
      alert(lang === 'ur' ? '⛔ غیر مجاز عمل! کیشیئر کو دستی سودا درج کرنے کی اجازت نہیں ہے۔' : 'Unauthorized! Cashiers cannot add custom items.');
      setCustomItemModalOpen(false);
      return;
    }
    if (!customItemName.trim()) {
      alert(lang === 'ur' ? 'آئٹم کا نام درج کریں' : 'Please enter item name');
      return;
    }
    if (customItemPrice <= 0) {
      alert(lang === 'ur' ? 'قیمت درست درج کریں' : 'Please enter valid price');
      return;
    }

    const isGram = customItemUnit === 'گرام';
    const isKg = customItemUnit === 'کلو';
    const isLiter = customItemUnit === 'لیٹر' || customItemUnit === 'ہاف لیٹر / ملی لیٹر';

    const chosenCat = customItemCategory.trim() || (lang === 'ur' ? 'عام اشیاء' : 'General');

    const customProd: Product = {
      id: `manual_${Date.now()}`,
      preset: activePreset,
      sku: `MAN-${Date.now().toString().slice(-4)}`,
      barcode: `999${Date.now().toString().slice(-8)}`,
      nameEn: customItemName.trim(),
      nameUr: customItemName.trim(),
      categoryEn: chosenCat,
      categoryUr: chosenCat,
      costPrice: Math.round(customItemPrice * 0.8),
      salePrice: customItemPrice,
      stock: 9999,
      minStockAlert: 0,
      unit: isGram ? 'Kg' : (isLiter ? 'لیٹر' : customItemUnit),
      subUnit: (isGram || isKg) ? 'Grams' : (isLiter ? 'ملی لیٹر' : undefined),
      conversionFactor: (isGram || isKg || isLiter) ? 1000 : undefined,
    };

    if (saveCustomToCatalog) {
      saveProduct(customProd);
    }

    if (isGram) {
      addToCart(customProd, 1, 'گرام', undefined, {
        isGram: true,
        weightInGrams: customItemQty > 20 ? customItemQty : 250,
        ratePerKg: customItemPrice,
      });
    } else if (customItemUnit === 'ہاف لیٹر / ملی لیٹر') {
      addToCart(customProd, 1, 'ملی لیٹر', undefined, {
        isLiter: true,
        volumeInMl: customItemQty > 20 ? customItemQty : 500,
        ratePerLiter: customItemPrice,
      });
    } else {
      addToCart(customProd, customItemQty || 1);
    }

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

  // Sub-renderer for Cart Items List
  const renderCartItems = () => {
    if (cart.length === 0) {
      return (
        <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-4">
          <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-inner">
            <ShoppingBag className="w-14 h-14 stroke-[1.2] text-emerald-500/80 dark:text-emerald-400" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h4 className="font-black text-base text-slate-800 dark:text-slate-100">
              {lang === 'ur' ? 'بلنگ سکرین بالکل تیار ہے!' : 'Billing Screen is Ready!'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {lang === 'ur'
                ? 'بارکوڈ اسکینر، سرچ بار (نام لکھ کر)، کیو آر کوڈ اسکینر، یا اشیاء ڈیش بورڈ کھول کر سودا بل میں شامل کریں۔'
                : 'Scan barcode, type product name, use QR scanner, or open products dashboard to build the bill.'}
            </p>
          </div>

          {/* Quick Action Welcome Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => barcodeInputRef.current?.focus()}
              className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Barcode className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'ur' ? 'بارکوڈ اسکین کریں' : 'Scan Barcode'}</span>
            </button>
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 hover:bg-indigo-200 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{lang === 'ur' ? 'کیو آر اسکینر' : 'QR Scanner'}</span>
            </button>
            <button
              type="button"
              onClick={toggleCatalog}
              className="px-3.5 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <LayoutGrid className="w-4 h-4 text-amber-600" />
              <span>{lang === 'ur' ? 'اشیاء ڈیش بورڈ لائیں' : 'Show Items Grid'}</span>
            </button>
            {currentRole === 'MANAGER' && (
              <button
                type="button"
                onClick={() => setCustomItemModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <PenTool className="w-4 h-4" />
                <span>{lang === 'ur' ? '✍️ دستی سودا لکھیں (ایڈمن)' : 'Add Custom Item'}</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {cart.map((item, idx) => {
          const isWeight = isWeightEligible(item);
          const isLiter = isLiterEligible(item);
          const unitRate = item.ratePerKg || item.ratePerLiter || item.unitPrice || item.product.salePrice;
          const displayUnit = item.selectedUnit || item.unit || item.product.unit || 'عدد';

          return (
            <div
              key={item.id}
              className="p-2.5 sm:p-3 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all shadow-xs flex flex-wrap items-center justify-between gap-2.5"
            >
              {/* 1. Item Name, Number, Unit Rate & Sub-badge */}
              <div className="flex items-center gap-2.5 min-w-[190px] flex-1">
                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-750 flex items-center justify-center font-mono font-black text-xs text-slate-600 dark:text-slate-300 shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                      {lang === 'ur' ? item.product.nameUr : item.product.nameEn}
                    </h5>
                    {item.packagedVariant && (
                      <span className="px-1.5 py-0.2 rounded-md text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                        {item.packagedVariant}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                    <span>
                      ریٹ: {unitRate.toLocaleString()} PKR / {displayUnit}
                    </span>
                    {isWeight && item.quantity < 1 && (
                      <span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded">
                        ({Math.round(item.quantity * 1000)} گرام)
                      </span>
                    )}
                    {isLiter && item.quantity < 1 && (
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-50 dark:bg-cyan-950/50 px-1.5 py-0.2 rounded">
                        ({Math.round(item.quantity * 1000)} ml)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Compact Stepper & Quantity / Weight Input (Standard POS - No Sliders) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const step = (isWeight || isLiter) ? 0.25 : 1;
                    if (item.quantity > step) {
                      const next = Math.max(0.01, Math.round((item.quantity - step) * 100) / 100);
                      updateCartItem(item.id, {
                        quantity: next,
                        isGram: false,
                        isLiter: false,
                        unitPrice: unitRate,
                        total: Math.round(next * unitRate),
                      });
                    } else {
                      removeFromCart(item.id);
                    }
                  }}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 active:scale-95 transition-all shadow-xs"
                  title="مقدار کم کریں"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <div className="relative">
                  <input
                    type="number"
                    min="0.01"
                    step={isWeight || isLiter ? "0.05" : "1"}
                    value={item.quantity}
                    onChange={(e) => {
                      const val = Math.max(0.01, parseFloat(e.target.value) || 0);
                      updateCartItem(item.id, {
                        quantity: val,
                        isGram: false,
                        isLiter: false,
                        unitPrice: unitRate,
                        total: Math.round(val * unitRate),
                      });
                    }}
                    className="w-16 text-center text-xs font-mono font-black bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <span className="absolute -bottom-3.5 left-0 right-0 text-center text-[9px] font-bold text-slate-400 font-mono pointer-events-none">
                    {displayUnit}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const step = (isWeight || isLiter) ? 0.25 : 1;
                    const next = Math.round((item.quantity + step) * 100) / 100;
                    updateCartItem(item.id, {
                      quantity: next,
                      isGram: false,
                      isLiter: false,
                      unitPrice: unitRate,
                      total: Math.round(next * unitRate),
                    });
                  }}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-bold text-xs active:scale-95 transition-all shadow-sm"
                  title="مقدار بڑھائیں"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 3. Line Total & Delete Button */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right min-w-[75px]">
                  <span className="font-mono font-black text-xs sm:text-base text-emerald-600 dark:text-emerald-400">
                    {item.total.toLocaleString()} PKR
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
                  title="آئٹم حذف کریں"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {/* Invisible anchor for smooth auto-scroll to bottom */}
        <div ref={cartEndRef} />
      </div>
    );
  };

  // Sub-renderer for Customer, Payment, Notes Calculator & Checkout Controls
  const renderCheckoutControls = () => {
    return (
      <div className="space-y-3">
        {/* Customer Selection / Quick Khata Search */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
            {lang === 'ur' ? 'گاہک منتخب کریں (کھاتہ / ادھار):' : 'Select Customer:'}
          </label>
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
              type="button"
              onClick={() => {
                setVoiceMode('customer');
                setVoiceModalOpen(true);
              }}
              className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
              title="Dictate Customer Name & Phone"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-600" />
            </button>
          </div>
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
        <div>
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
            {lang === 'ur' ? 'طریقہ ادائیگی:' : 'Payment Method:'}
          </label>
          <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
            <button
              type="button"
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
              type="button"
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
              type="button"
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
              type="button"
              onClick={() => setPaymentMethod('SPLIT')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                paymentMethod === 'SPLIT'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Split className="w-3 h-3" />
              <span>{lang === 'ur' ? 'مکس' : 'Split'}</span>
            </button>
          </div>
        </div>

        {/* CASH TENDER & CURRENCY DENOMINATIONS */}
        {paymentMethod === 'CASH' && (
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 space-y-2">
            {/* Switch: Direct Numeric vs Pakistani Currency Notes */}
            <div className="flex items-center justify-between text-xs border-b border-emerald-200 dark:border-emerald-900/50 pb-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {lang === 'ur' ? 'وصول رقم موڈ:' : 'Cash Mode:'}
              </span>
              <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setCashInputMode('direct')}
                  className={`px-2 py-0.5 rounded transition-all ${
                    cashInputMode === 'direct'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {lang === 'ur' ? 'سیدھی رقم' : 'Direct'}
                </button>
                <button
                  type="button"
                  onClick={() => setCashInputMode('notes')}
                  className={`px-2 py-0.5 rounded transition-all ${
                    cashInputMode === 'notes'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {lang === 'ur' ? 'نوٹ گنیں' : 'Notes Counter'}
                </button>
              </div>
            </div>

            {/* Direct Cash Input */}
            {cashInputMode === 'direct' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'ur' ? 'گاہک سے موصول شدہ کیش:' : 'Cash Received:'}
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    بل: {Math.max(0, cartTotals.subtotal - orderDiscount).toLocaleString()} PKR
                  </span>
                </div>
                <input
                  ref={tenderedInputRef}
                  type="number"
                  min="0"
                  value={tenderedAmount || ''}
                  onChange={(e) => setTenderedAmount(parseFloat(e.target.value) || 0)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCheckout();
                    }
                  }}
                  placeholder={String(Math.max(0, cartTotals.subtotal - orderDiscount))}
                  className="w-full bg-white dark:bg-slate-800 border-2 border-emerald-500 rounded-xl px-3 py-1.5 text-base font-mono font-black text-emerald-700 dark:text-emerald-300 outline-none"
                />
                <div className="flex gap-1 flex-wrap text-[10px] font-mono font-bold">
                  <button
                    type="button"
                    onClick={() => setTenderedAmount(Math.max(0, cartTotals.subtotal - orderDiscount))}
                    className="px-2 py-0.5 rounded bg-emerald-600 text-white shadow-xs"
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

            {/* Notes Counter Mode */}
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

                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  {[
                    { key: 'note5000' as const, label: '5000 کا نوٹ' },
                    { key: 'note1000' as const, label: '1000 کا نوٹ' },
                    { key: 'note500' as const, label: '500 کا نوٹ' },
                    { key: 'note100' as const, label: '100 کا نوٹ' },
                    { key: 'note50' as const, label: '50 کا نوٹ' },
                    { key: 'note20' as const, label: '20 کا نوٹ' },
                    { key: 'note10' as const, label: '10 کا نوٹ' },
                    { key: 'coins' as const, label: 'سکے (Coins)' },
                  ].map((d) => {
                    const count = denominations[d.key] || 0;
                    return (
                      <div
                        key={d.key}
                        className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-[10px]">
                          {d.label}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateDenomination(d.key, -1)}
                            className="w-5 h-5 rounded flex items-center justify-center bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-bold text-xs"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={count}
                            onChange={(e) => setDenominationCount(d.key, parseInt(e.target.value) || 0)}
                            className="w-8 text-center font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => updateDenomination(d.key, 1)}
                            className="w-5 h-5 rounded flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

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

            {/* Return Change Banner */}
            {tenderedAmount > 0 && (
              <div
                className={`p-2 rounded-xl flex items-center justify-between font-bold text-xs shadow-md transition-all ${
                  tenderedAmount >= Math.max(0, cartTotals.subtotal - orderDiscount)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                <span className="text-xs">
                  {tenderedAmount >= Math.max(0, cartTotals.subtotal - orderDiscount)
                    ? lang === 'ur'
                      ? '💵 واپسی بقایا رقم (گاہک کو دیں):'
                      : 'Change to Return:'
                    : lang === 'ur'
                    ? '⚠️ رقم کم ہے (بقایا واجب الادا):'
                    : 'Short Amount:'}
                </span>
                <span className="font-mono text-sm font-black">
                  {Math.abs(tenderedAmount - Math.max(0, cartTotals.subtotal - orderDiscount)).toLocaleString()} PKR
                </span>
              </div>
            )}
          </div>
        )}

        {/* Split Payment inputs */}
        {paymentMethod === 'SPLIT' && (
          <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 rounded-xl space-y-1.5 text-xs">
            <span className="font-bold text-amber-900 dark:text-amber-200 block">
              {lang === 'ur' ? 'کیش و آن لائن تقسیم:' : 'Split Cash & Online:'}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-500">نقد ادا (Cash):</span>
                <input
                  type="number"
                  min="0"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-800 border rounded-lg px-2 py-1 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500">باقی ادھار/آن لائن:</span>
                <div className="font-mono font-bold text-rose-600 dark:text-rose-400 py-1">
                  {Math.max(
                    0,
                    cartTotals.grandTotal - amountPaid
                  ).toLocaleString()}{' '}
                  PKR
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Totals Summary */}
        <div className="space-y-1 text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
          <div className="flex justify-between text-slate-500">
            <span>{t('subtotal')}:</span>
            <span className="font-mono">{cartTotals.subtotal.toLocaleString()} PKR</span>
          </div>

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
            <span className="font-mono text-emerald-600 dark:text-emerald-400 text-xl font-black">
              {Math.max(0, cartTotals.subtotal - orderDiscount).toLocaleString()} PKR
            </span>
          </div>
        </div>

        {/* Checkout Button with Keyboard Shortcut Badge */}
        <button
          type="button"
          onClick={handleCheckout}
          disabled={cart.length === 0}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-95 transition-all"
        >
          <span className="inline-flex items-center justify-center bg-white/20 text-white font-black text-xs px-2 py-0.5 rounded-md font-mono border border-white/20">
            Rs.
          </span>
          <Printer className="w-4 h-4 text-emerald-100" />
          <span>{t('completeSale')}</span>
          <span className="px-2 py-0.5 rounded bg-black/25 text-[10px] font-mono text-emerald-200 border border-white/10 ml-1">
            (Enter / F12)
          </span>
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2.5 h-[calc(100vh-70px)] p-2 md:p-3 overflow-hidden">
      {/* 1. TOP HEADER STRIP: Active Counter, Cashier, Software Branding, WhatsApp Orders, Margin Pin */}
      <div className="px-4 py-2 bg-slate-900/95 backdrop-blur-md text-white flex flex-wrap items-center justify-between text-xs rounded-2xl border border-slate-800 shadow-md gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Active Role & Counter Badge */}
          <div className="flex items-center gap-2">
            {currentRole === 'MANAGER' ? (
              <span className="px-3 py-1 rounded-xl font-mono font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs flex items-center gap-1.5 shadow-sm">
                <span>👑</span>
                <span>{lang === 'ur' ? 'ایڈمن ٹرمینل' : 'Admin Terminal'}</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-xl font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-1.5 shadow-sm">
                <span>🏢</span>
                <span>{lang === 'ur' ? `کاؤنٹر #${activeCounter}` : `Counter #${activeCounter}`}</span>
                <span className="text-slate-400 font-sans">• {activeCashier?.name || 'کیشیئر'}</span>
              </span>
            )}
          </div>

          {/* Cloud Sync Pulse Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-emerald-400">{lang === 'ur' ? 'کلاؤڈ سنک فعال' : 'Cloud Sync Active'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          {/* WhatsApp Orders Notification Button */}
          {pendingWhatsAppOrdersCount > 0 && (
            <button
              type="button"
              onClick={() => setIsWhatsAppOrdersModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 animate-pulse"
              title="واٹس ایپ پر موصول شدہ آرڈرز دیکھیں"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-950" />
              <span>{pendingWhatsAppOrdersCount} {lang === 'ur' ? 'واٹس ایپ آرڈرز' : 'WhatsApp Orders'}</span>
            </button>
          )}

          {/* Quick Return & Exchange Button */}
          <button
            type="button"
            onClick={() => setIsExchangeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 text-blue-300 border border-blue-500/30 font-bold text-xs transition-all shadow-sm active:scale-95"
            title="مال کی واپسی و ایکسچینج (Return & Exchange)"
          >
            <Repeat className="w-3.5 h-3.5 text-blue-400" />
            <span>{lang === 'ur' ? '🔁 مال کا تبادلہ' : 'Exchange'}</span>
          </button>

          {/* LAYOUT TOGGLE BUTTON: Show Items Dashboard vs Bill Only View */}
          <button
            type="button"
            onClick={toggleCatalog}
            className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95 whitespace-nowrap ${
              showCatalog
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
            title={
              showCatalog
                ? (lang === 'ur' ? 'اشیاء گرڈ چھپائیں اور صرف بلنگ سکرین رکھیں' : 'Hide catalog, show bill only')
                : (lang === 'ur' ? 'اشیاء ڈیش بورڈ ساتھ کھولیں' : 'Show items dashboard alongside bill')
            }
          >
            {showCatalog ? <EyeOff className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
            <span>
              {showCatalog
                ? (lang === 'ur' ? '🧾 صرف بلنگ موڈ' : 'Bill Only View')
                : (lang === 'ur' ? '📦 اشیاء ڈیش بورڈ' : 'Show Items')}
            </span>
          </button>
        </div>
      </div>

      {/* Live Pending WhatsApp Order Alert Strip */}
      {pendingWhatsAppOrdersCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-amber-500/15 border border-amber-500/40 rounded-2xl px-4 py-2 flex items-center justify-between text-xs text-slate-900 dark:text-white shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="font-bold text-xs">
              {lang === 'ur'
                ? `واٹس ایپ پر ${pendingWhatsAppOrdersCount} نیا آرڈر موصول ہوا ہے (پینڈنگ)! فوری بل بنائیں۔`
                : `${pendingWhatsAppOrdersCount} Pending WhatsApp Order(s) Received!`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsWhatsAppOrdersModalOpen(true)}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-sm flex items-center gap-1 active:scale-95 transition-all"
          >
            <span>{lang === 'ur' ? 'آرڈرز دیکھیں اور بل کاٹیں' : 'View Orders'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. UNIVERSAL SCANNER, SEARCH & QUICK ACTIONS BAR */}
      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-2">
        {/* Barcode scanner input */}
        <form onSubmit={handleBarcodeSubmit} className="flex-1 min-w-[200px] relative">
          <Barcode className="w-5 h-5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            ref={barcodeInputRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder={lang === 'ur' ? 'بارکوڈ اسکین کریں یا لکھیں...' : 'Scan barcode or SKU...'}
            className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 font-mono outline-none transition-all"
          />
        </form>

        {/* Search by name / keyword with Auto-Suggestions Dropdown */}
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchSuggestionsOpen(true);
              }}
              onFocus={() => {
                if (searchQuery.trim()) setSearchSuggestionsOpen(true);
              }}
              placeholder={lang === 'ur' ? 'آئٹم کا نام لکھیں یا تلاش کریں (چینی، چاول، دال)...' : 'Search product name or press Enter...'}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </form>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchSuggestionsOpen(false);
              }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Live Auto-Suggestions Dropdown */}
          {searchSuggestionsOpen && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-h-72 overflow-y-auto p-1.5 space-y-1">
              <div className="p-1 px-2 text-[10px] font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 flex justify-between">
                <span>{lang === 'ur' ? 'تلاش کے نتائج (انٹر یا کلک کریں):' : 'Search matches (Press Enter or click):'}</span>
                <span>{searchResults.length} آئٹمز</span>
              </div>
              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  {lang === 'ur' ? 'اس نام سے کوئی آئٹم نہیں ملی' : 'No matching product found'}
                </div>
              ) : (
                searchResults.slice(0, 8).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      addToCart(p, 1);
                      setSearchQuery('');
                      setSearchSuggestionsOpen(false);
                      barcodeInputRef.current?.focus();
                    }}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer transition-all border border-transparent hover:border-emerald-300 dark:hover:border-emerald-800"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {lang === 'ur' ? p.nameUr : p.nameEn}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {p.barcode} • {p.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
                        {p.salePrice.toLocaleString()} PKR
                      </span>
                      <span className="block text-[9.5px] text-slate-400">
                        {p.stock} {p.unit}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* QR Code / Camera Scanner Button */}
        <button
          type="button"
          onClick={() => setQrModalOpen(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all whitespace-nowrap"
          title={lang === 'ur' ? 'کیو آر کوڈ یا کیمرہ سے اسکین کریں' : 'Scan QR code / camera'}
        >
          <QrCode className="w-4 h-4" />
          <span>{lang === 'ur' ? '📷 کیو آر اسکینر' : 'QR Scan'}</span>
        </button>

        {/* Quick Manual / Custom Item Add Button - STRICTLY FOR MANAGER ONLY! */}
        {currentRole === 'MANAGER' && (
          <button
            type="button"
            onClick={() => setCustomItemModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all whitespace-nowrap"
            title={lang === 'ur' ? 'دستی سودا درج کریں (صرف ایڈمن)' : 'Add custom item (Manager Only)'}
          >
            <PenTool className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ur' ? '✍️ دستی سودا' : 'Custom Item'}</span>
          </button>
        )}

        {/* Voice Order Button */}
        <button
          type="button"
          onClick={() => {
            setVoiceMode('order');
            setVoiceModalOpen(true);
          }}
          className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all whitespace-nowrap"
          title="Speak Order (Urdu / English)"
        >
          <Mic className="w-4 h-4" />
          <span>{t('voiceOrder')}</span>
        </button>
      </div>

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
        {/* LEFT: Product Catalog Grid (Only visible if showCatalog is true) */}
        {showCatalog && (
          <div className="w-full lg:w-[46%] xl:w-[48%] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fadeIn">
            {/* Catalog Header with Category Filter */}
            <div className="px-3 py-2 bg-slate-900 text-white flex items-center justify-between text-xs border-b border-slate-800">
              <span className="font-bold flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'ur' ? 'اشیاء ڈیش بورڈ (کیٹلاگ)' : 'Products Dashboard'}</span>
              </span>
              <button
                type="button"
                onClick={toggleCatalog}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 hover:underline"
              >
                <span>{lang === 'ur' ? 'گرڈ بند کریں' : 'Hide'}</span>
                <X className="w-3.5 h-3.5" />
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
                  {cat === 'all'
                    ? (lang === 'ur' ? '✨ تمام اشیاء (All)' : '✨ All Products')
                    : cat}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredProducts.map((p) => {
                const isLowStock = p.stock <= p.minStockAlert;
                const profitPerUnit = p.salePrice - p.costPrice;
                const isWeight = isWeightEligibleProduct(p);
                const isLiter = isLiterEligibleProduct(p);
                const hasSizes = Boolean(p.sizes && p.sizes.length > 0);

                return (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p, 1)}
                    className="group relative bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-600 rounded-xl p-2.5 flex flex-col justify-between cursor-pointer transition-all shadow-2xs hover:shadow-sm"
                  >
                    {isLowStock && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white">
                        {lang === 'ur' ? 'کم اسٹاک' : 'Low Stock'}
                      </span>
                    )}

                    <div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mt-0.5 line-clamp-1">
                        {lang === 'ur' ? p.nameUr : p.nameEn}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                        {lang === 'ur' ? p.nameEn : p.nameUr}
                      </p>
                    </div>

                    <div>
                      <div className="mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-700/60 flex items-end justify-between">
                        <div>
                          <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {p.salePrice.toLocaleString()} <span className="text-[9px]">PKR</span>
                          </div>
                          <div className="text-[9.5px] text-slate-500">
                            {lang === 'ur' ? `فی ${p.unit}` : `per ${p.unit}`}
                          </div>
                        </div>

                        {isMarginUnlocked ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-mono text-[9.5px] font-bold">
                            +{profitPerUnit} PKR
                          </span>
                        ) : (
                          <span className="text-[9.5px] text-slate-400 font-mono">
                            {p.stock} {p.unit}
                          </span>
                        )}
                      </div>

                      {/* Weight Quick-Add Pills */}
                      {isWeight && (
                        <div className="mt-1.5 pt-1 border-t border-slate-200 dark:border-slate-700/50 flex items-center gap-1 flex-wrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p, 1);
                            }}
                            className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-300 font-bold text-[9.5px] transition-all"
                            title="1 کلو شامل کریں"
                          >
                            +1 کلو
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p, 1, 'گرام', undefined, { isGram: true, weightInGrams: 500, ratePerKg: p.salePrice });
                            }}
                            className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 text-amber-800 dark:text-amber-300 font-bold text-[9.5px] transition-all"
                            title="500g شامل کریں"
                          >
                            +500g
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p, 1, 'گرام', undefined, { isGram: true, weightInGrams: 250, ratePerKg: p.salePrice });
                            }}
                            className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 text-blue-800 dark:text-blue-300 font-bold text-[9.5px] transition-all"
                            title="250g شامل کریں"
                          >
                            +250g
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p, 1, 'گرام', undefined, { isGram: true, weightInGrams: 100, ratePerKg: p.salePrice });
                            }}
                            className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 text-purple-800 dark:text-purple-300 font-bold text-[9.5px] transition-all"
                            title="100g شامل کریں"
                          >
                            +100g
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p, 1, 'گرام', undefined, { isGram: true, weightInGrams: 50, ratePerKg: p.salePrice });
                            }}
                            className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/50 hover:bg-rose-200 text-rose-800 dark:text-rose-300 font-bold text-[9.5px] transition-all"
                            title="50g شامل کریں"
                          >
                            +50g
                          </button>
                        </div>
                      )}

                      {/* Liter Quick-Add Pills */}
                      {isLiter && !isWeight && (
                        <div className="mt-1.5 pt-1 border-t border-slate-200 dark:border-slate-700/50 flex items-center gap-1 flex-wrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p, 1, 'لیٹر', undefined, { isLiter: false, ratePerLiter: p.salePrice });
                            }}
                            className="px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/50 hover:bg-cyan-200 text-cyan-800 dark:text-cyan-300 font-bold text-[9.5px] transition-all"
                            title="1 لیٹر شامل کریں"
                          >
                            +1 لیٹر
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p, 1, 'ملی لیٹر', undefined, { isLiter: true, volumeInMl: 500, ratePerLiter: p.salePrice });
                            }}
                            className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 text-blue-800 dark:text-blue-300 font-bold text-[9.5px] transition-all"
                            title="ہاف لیٹر 500ml شامل کریں"
                          >
                            +500ml
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p, 1, 'ملی لیٹر', undefined, { isLiter: true, volumeInMl: 250, ratePerLiter: p.salePrice });
                            }}
                            className="px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/50 hover:bg-teal-200 text-teal-800 dark:text-teal-300 font-bold text-[9.5px] transition-all"
                            title="250ml شامل کریں"
                          >
                            +250ml
                          </button>
                        </div>
                      )}

                      {/* Packaged Size Variations Pills */}
                      {hasSizes && (
                        <div className="mt-1.5 pt-1 border-t border-slate-200 dark:border-slate-700/50 flex items-center gap-1 flex-wrap">
                          {p.sizes!.map((s) => {
                            const priceMatch = s.match(/(\d+)\s*(?:PKR|روپے)/i);
                            const variantPrice = priceMatch ? parseInt(priceMatch[1], 10) : p.salePrice;
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(p, 1, p.unit, s, { packagedVariant: s, customPrice: variantPrice });
                                }}
                                className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 hover:bg-indigo-200 text-indigo-800 dark:text-indigo-300 font-bold text-[9.5px] transition-all"
                                title={`${s} شامل کریں`}
                              >
                                +{s}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ACTIVE BILLING TERMINAL SCREEN */}
        <div
          className={`flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all ${
            !showCatalog ? 'w-full' : 'w-full lg:w-[54%] xl:w-[52%]'
          }`}
        >
          {/* Cart Header */}
          <div className="p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <h3 className="font-black text-sm">
                {lang === 'ur' ? 'فعال بلنگ کاؤنٹر (بل بنتا ہوا)' : 'Active Billing Counter'} ({cartTotals.itemCount})
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick toggle catalog button if catalog is hidden */}
              {!showCatalog && (
                <button
                  type="button"
                  onClick={toggleCatalog}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-bold rounded-lg flex items-center gap-1 transition-all border border-slate-700"
                  title="اشیاء ڈیش بورڈ کھولیں"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px]">{lang === 'ur' ? 'اشیاء ڈیش بورڈ کھولیں' : 'Show Items'}</span>
                </button>
              )}

              {/* Admin Live Margin Lock/Unlock Button */}
              {isMarginUnlocked ? (
                <button
                  type="button"
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
                  type="button"
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
                  type="button"
                  onClick={clearCart}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded transition-all"
                  title={t('clearCart')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Body Content based on Layout Mode */}
          {!showCatalog ? (
            /* Dedicated Full-Width Billing View: Left is Bill Items Table/List, Right is Checkout Sidebar */
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
              {/* Left Pane: Items in Active Bill */}
              <div ref={cartContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 scroll-smooth">
                {renderCartItems()}
              </div>

              {/* Right Pane: Customer, Notes Counter & Checkout Controls */}
              <div className="w-full lg:w-[380px] bg-slate-50 dark:bg-slate-850 border-t lg:border-t-0 lg:border-r border-slate-200 dark:border-slate-800 p-3 overflow-y-auto shadow-inner">
                {renderCheckoutControls()}
              </div>
            </div>
          ) : (
            /* Split View (Catalog on Left, Cart on Right): Items on top, Checkout on bottom */
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div ref={cartContainerRef} className="flex-1 overflow-y-auto p-2.5 space-y-2 scroll-smooth">
                {renderCartItems()}
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 max-h-[48%] overflow-y-auto">
                {renderCheckoutControls()}
              </div>
            </div>
          )}
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

            {/* Quick 1-Click Fast Presets */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 block mb-1">
                {lang === 'ur' ? '⚡ فوری انتخاب (Fast 1-Click Presets):' : '⚡ Fast 1-Click Presets:'}
              </span>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                {[
                  { name: 'لیز چپس کلاسک (50 گرام)', unit: 'عدد', price: 50, qty: 1 },
                  { name: 'لیز چپس مصالحہ (100 گرام)', unit: 'عدد', price: 100, qty: 1 },
                  { name: 'کھلا تازہ دودھ (1 لیٹر)', unit: 'لیٹر', price: 220, qty: 1 },
                  { name: 'ہاف لیٹر دودھ (500ml)', unit: 'ہاف لیٹر / ملی لیٹر', price: 220, qty: 500 },
                  { name: 'کھلا کوکنگ آئل (1 لیٹر)', unit: 'لیٹر', price: 520, qty: 1 },
                  { name: 'ہاف لیٹر کوکنگ آئل (500ml)', unit: 'ہاف لیٹر / ملی لیٹر', price: 520, qty: 500 },
                  { name: 'چینی خالص (1 کلو)', unit: 'کلو', price: 160, qty: 1 },
                  { name: 'چینی آدھا کلو (500g)', unit: 'گرام', price: 160, qty: 500 },
                  { name: 'چینی پاؤ (250g)', unit: 'گرام', price: 160, qty: 250 },
                  { name: 'چینی 100 گرام', unit: 'گرام', price: 160, qty: 100 },
                  { name: 'چینی 50 گرام', unit: 'گرام', price: 160, qty: 50 },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setCustomItemName(preset.name);
                      setCustomItemUnit(preset.unit);
                      setCustomItemPrice(preset.price);
                      setCustomItemQty(preset.qty);
                    }}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold transition-all shadow-2xs"
                  >
                    {preset.name} ({preset.price} PKR)
                  </button>
                ))}
              </div>
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
                  {customItemUnit === 'گرام'
                    ? (lang === 'ur' ? 'فی کلو ریٹ (PKR):' : 'Rate per Kg (PKR):')
                    : (customItemUnit === 'لیٹر' || customItemUnit === 'ہاف لیٹر / ملی لیٹر')
                    ? (lang === 'ur' ? 'فی لیٹر ریٹ (PKR):' : 'Rate per Liter (PKR):')
                    : (lang === 'ur' ? 'قیمت (PKR):' : 'Price (PKR):')}
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
                  {customItemUnit === 'گرام'
                    ? (lang === 'ur' ? 'کتنے گرام (g):' : 'Grams (g):')
                    : customItemUnit === 'ہاف لیٹر / ملی لیٹر'
                    ? (lang === 'ur' ? 'کتنے ml:' : 'Volume (ml):')
                    : (lang === 'ur' ? 'تعداد:' : 'Quantity:')}
                </label>
                <input
                  type="number"
                  min={(customItemUnit === 'گرام' || customItemUnit === 'ہاف لیٹر / ملی لیٹر') ? '1' : '0.1'}
                  step={(customItemUnit === 'گرام' || customItemUnit === 'ہاف لیٹر / ملی لیٹر') ? '1' : 'any'}
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
                  onChange={(e) => {
                    const u = e.target.value;
                    setCustomItemUnit(u);
                    if (u === 'گرام' && customItemQty <= 10) {
                      setCustomItemQty(250);
                    } else if (u === 'ہاف لیٹر / ملی لیٹر' && customItemQty <= 10) {
                      setCustomItemQty(500);
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-2 text-xs font-bold outline-none"
                >
                  <option value="عدد">عدد (Piece)</option>
                  <option value="کلو">کلو (Kg)</option>
                  <option value="گرام">گرام (Gram)</option>
                  <option value="لیٹر">لیٹر (Liter)</option>
                  <option value="ہاف لیٹر / ملی لیٹر">ہاف لیٹر / ملی لیٹر (ml)</option>
                  <option value="پیکٹ">پیکٹ (Pack)</option>
                  <option value="درجن">درجن (Dozen)</option>
                  <option value="میٹر">میٹر (Meter)</option>
                </select>
              </div>
            </div>

            {/* Quick Gram Preset Chips in Custom Item Modal */}
            {customItemUnit === 'گرام' && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 font-bold">جلدی منتخب کریں:</span>
                {[
                  { label: '50g', g: 50 },
                  { label: '100g', g: 100 },
                  { label: 'پاؤ (250g)', g: 250 },
                  { label: 'آدھا کلو (500g)', g: 500 },
                  { label: '3 پاؤ (750g)', g: 750 },
                ].map((chip) => (
                  <button
                    key={chip.g}
                    type="button"
                    onClick={() => setCustomItemQty(chip.g)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      customItemQty === chip.g
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-100'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            {/* Quick Volume Preset Chips in Custom Item Modal */}
            {customItemUnit === 'ہاف لیٹر / ملی لیٹر' && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 font-bold">جلدی منتخب کریں:</span>
                {[
                  { label: 'پاؤ (250ml)', ml: 250 },
                  { label: 'ہاف لیٹر (500ml)', ml: 500 },
                  { label: '3 پاؤ (750ml)', ml: 750 },
                  { label: '1 لیٹر (1000ml)', ml: 1000 },
                ].map((chip) => (
                  <button
                    key={chip.ml}
                    type="button"
                    onClick={() => setCustomItemQty(chip.ml)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      customItemQty === chip.ml
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-100'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            {/* پورشن / کیٹیگری منتخب کریں */}
            <div className="space-y-1.5 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700 dark:text-slate-200">
                  {lang === 'ur' ? 'پورشن / کیٹیگری (Portion):' : 'Category / Portion:'}
                </label>
                <span className="text-[10px] text-emerald-600 font-bold">
                  اس پورشن اور تمام اشیاء دونوں میں آئے گا ✓
                </span>
              </div>
              <input
                type="text"
                list="pos-cat-suggestions"
                value={customItemCategory}
                onChange={(e) => setCustomItemCategory(e.target.value)}
                placeholder="پورشن لکھیں یا نیچے سے منتخب کریں..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none"
              />
              <datalist id="pos-cat-suggestions">
                {categories
                  .filter((c) => c !== 'all')
                  .map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
              </datalist>

              <div className="flex flex-wrap gap-1 pt-0.5">
                {categories
                  .filter((c) => c !== 'all')
                  .slice(0, 6)
                  .map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCustomItemCategory(cat)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        customItemCategory === cat
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveCustomToCatalog}
                  onChange={(e) => setSaveCustomToCatalog(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300">
                  {lang === 'ur'
                    ? 'اس پورشن اور تمام اشیاء میں ہمیشہ کے لیے محفوظ کریں'
                    : 'Save permanently to this portion & All Items'}
                </span>
              </label>
            </div>

            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-between font-bold">
              <span className="text-slate-600 dark:text-slate-300">
                {lang === 'ur' ? 'کل رقم:' : 'Total Amount:'}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                {(customItemUnit === 'گرام' || customItemUnit === 'ہاف لیٹر / ملی لیٹر'
                  ? Math.round(((customItemPrice * customItemQty) / 1000) * 100) / 100
                  : customItemPrice * customItemQty
                ).toLocaleString()} PKR
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

            {/* QR Code & Camera Scanner Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 dark:text-white text-base">
                    {lang === 'ur' ? 'کیوآر کوڈ اور کیمرہ اسکینر' : 'QR & Camera Scanner'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'ur'
                      ? 'موبائل کیمرے یا کیوآر اسکینر سے فورا آئٹم بل میں شامل کریں'
                      : 'Scan QR code or barcode to quickly add to bill'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCameraActive(false);
                  setQrModalOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {qrSuccessMsg && (
              <div className="mt-3 p-3 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{qrSuccessMsg}</span>
              </div>
            )}

            {/* Camera View Section */}
            <div className="mt-4">
              {isCameraActive ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500 bg-black aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-emerald-400/70 m-6 rounded-lg pointer-events-none flex items-center justify-center">
                    <span className="text-[11px] bg-black/60 text-emerald-300 px-2.5 py-1 rounded font-mono">
                      {lang === 'ur' ? 'کیو آر کوڈ فریم کے اندر لائیں' : 'Point camera at QR code'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
                  <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 mb-3">
                    {lang === 'ur'
                      ? 'ڈیوائس کا کیمرہ آن کر کے براہ راست کیوآر یا بارکوڈ اسکین کریں'
                      : 'Activate device camera to scan live barcodes / QR'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCameraActive(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{lang === 'ur' ? 'کیمرہ آن کریں (Start Camera)' : 'Start Camera'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Manual QR / Barcode Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleQrScanSubmit(qrManualInput);
              }}
              className="mt-4"
            >
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'ur' ? 'یا کیوآر / بارکوڈ نمبر درج کریں:' : 'Or enter QR / Barcode manually:'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrManualInput}
                  onChange={(e) => setQrManualInput(e.target.value)}
                  placeholder={lang === 'ur' ? 'مثال: 8964000123456 یا PROD-01' : 'e.g. 8964000123456'}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm"
                >
                  {lang === 'ur' ? 'بل میں ڈالیں' : 'Add'}
                </button>
              </div>
            </form>

            {/* Quick 1-Click Test Chips */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 block mb-2">
                {lang === 'ur' ? 'تجرباتی کیوآر کوڈز (فوری کلک کر کے چیک کریں):' : 'Test QR / Barcodes:'}
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {products.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleQrScanSubmit(p.barcode || p.sku)}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 text-[11px] rounded-lg font-mono text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    {p.nameUr || p.nameEn}: {p.barcode || p.sku}
                  </button>
                ))}
              </div>
            </div>
          </div>
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

      {/* Return & Exchange Modal */}
      <ExchangeModal
        isOpen={isExchangeModalOpen}
        onClose={() => setIsExchangeModalOpen(false)}
      />
    </div>
  );
};
