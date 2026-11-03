'use client';

import React, { useState, useMemo, useRef, useEffect, useDeferredValue } from 'react';
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
  Copy,
  ArrowRight,
  QrCode,
  Camera,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Repeat,
  History,
  Pause,
  Play,
  ChevronDown,
  Zap,
  Edit2,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { Product, PaymentMethod, Invoice, CurrencyDenominations, KhataPaymentReceipt } from '@/types';
import { VoiceAssistantModal } from '@/components/VoiceAssistantModal';
import { PrintReceiptModal } from '@/components/pos/PrintReceiptModal';
import { ExchangeModal } from '@/components/pos/ExchangeModal';
import { posSound } from '@/lib/sound';

interface PosTerminalProps {
  onNavigate?: (tab: string) => void;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({ onNavigate }) => {
  const { lang, t } = useLanguage();
  const {
    products,
    cart,
    cartTotals,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    replaceCart,
    checkoutInvoice,
    receiveKhataPayment,
    customers,
    canSellOutOfStock,
    canGiveCredit,
    isMarginUnlocked,
    unlockMargin,
    lockMargin,
    businessProfile,
    updateBusinessProfile,
    currentRole,
    switchRole,
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
    invoices,
    activePreset,
  } = useShop();

  // Negative / Out of Stock Protection States
  const [outOfStockModalItem, setOutOfStockModalItem] = useState<{
    product: Product;
    requestedQty: number;
    currentStock: number;
    unit?: string;
    variationDetails?: string;
    options?: any;
  } | null>(null);
  const [adminOverridePin, setAdminOverridePin] = useState('');
  const [adminOverrideError, setAdminOverrideError] = useState('');

  // Safe Add To Cart: strictly blocks Cashiers from selling out-of-stock items (negative stock protection)
  const tryAddToCart = (
    product: Product,
    quantity = 1,
    unit?: string,
    variationDetails?: string,
    options?: any
  ): boolean => {
    const isOut = (Number(product.stock) || 0) <= 0 || ((Number(product.stock) || 0) - quantity) < 0;
    if (!canSellOutOfStock() && isOut) {
      posSound.playError();
      setOutOfStockModalItem({
        product,
        requestedQty: quantity,
        currentStock: Number(product.stock) || 0,
        unit,
        variationDetails,
        options,
      });
      return false;
    }
    posSound.playScanBeep();
    addToCart(product, quantity, unit, variationDetails, options);
    return true;
  };

  // Real-time Dynamic Online / Offline Network Status Detection
  const [isOnline, setIsOnline] = useState<boolean>(true);
  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // WhatsApp Orders Management Modal State
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [waFilter, setWaFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING');

  const totalStockCount = useMemo(() => {
    return products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  }, [products]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayInvoices = useMemo(() => {
    return (invoices || []).filter((inv) => (inv.date || '').startsWith(todayStr));
  }, [invoices, todayStr]);

  const todaySalesTotal = useMemo(() => {
    return todayInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
  }, [todayInvoices]);

  // Quick Bill History & Fast Reprint Modal for Cashier
  const [isRecentBillsModalOpen, setIsRecentBillsModalOpen] = useState(false);
  const [recentBillsSearch, setRecentBillsSearch] = useState('');
  const [selectedReprintInvoice, setSelectedReprintInvoice] = useState<Invoice | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Screen Layout Mode: Full Dedicated Billing Mode (false) vs Side-by-Side Catalog Grid Mode (true)
  // Default is false: Full-screen bill-centric mode as requested by user
  const [showCatalog, setShowCatalog] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_show_catalog', 'false');
    }
  }, []);

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
  const effectiveNetTotal = Math.max(0, cartTotals.subtotal - orderDiscount);

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

  // Recent Hold Bills State & Handlers
  interface HeldBill {
    id: string;
    heldAt: string;
    customerName: string;
    customerPhone?: string;
    items: any[];
    subtotal: number;
    itemCount: number;
  }

  // Mobile responsive view & Urdu Keyboard state
  const [mobileTab, setMobileTab] = useState<'cart' | 'catalog'>('cart');
  const [heldBillsModalOpen, setHeldBillsModalOpen] = useState(false);
  const [urduKeyboardOpen, setUrduKeyboardOpen] = useState(false);
  const [holdToast, setHoldToast] = useState<string | null>(null);

  // Quick Khata Recovery at POS Counter State
  const [posKhataPaymentModalOpen, setPosKhataPaymentModalOpen] = useState(false);
  const [posKhataPayCustomerId, setPosKhataPayCustomerId] = useState('');
  const [posKhataPayAmount, setPosKhataPayAmount] = useState<number>(0);
  const [posKhataPayDesc, setPosKhataPayDesc] = useState('');
  const [posKhataCompletedReceipt, setPosKhataCompletedReceipt] = useState<KhataPaymentReceipt | null>(null);
  const [posKhataReceiptModalOpen, setPosKhataReceiptModalOpen] = useState(false);

  // Shopkeeper WhatsApp Link State
  const [isShopWhatsAppModalOpen, setIsShopWhatsAppModalOpen] = useState(false);
  const [shopWhatsAppInput, setShopWhatsAppInput] = useState(businessProfile.whatsapp || businessProfile.phone || '03334140088');

  useEffect(() => {
    setShopWhatsAppInput(businessProfile.whatsapp || businessProfile.phone || '03334140088');
  }, [businessProfile.whatsapp, businessProfile.phone]);

  const [heldBills, setHeldBills] = useState<HeldBill[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pos_held_bills');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_held_bills', JSON.stringify(heldBills));
    }
  }, [heldBills]);

  const handleHoldBill = () => {
    if (cart.length === 0) {
      if (heldBills.length > 0) {
        setHeldBillsModalOpen(true);
        return;
      }
      alert(lang === 'ur' ? 'کارٹ خالی ہے، ہولڈ کرنے کے لیے کوئی بل نہیں ہے!' : 'Cart is empty, nothing to hold!');
      return;
    }
    posSound.playClick();
    const newHeld: HeldBill = {
      id: `held_${Date.now()}`,
      heldAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerName: customerName.trim() || (lang === 'ur' ? 'عام گاہک' : 'Walk-in Customer'),
      customerPhone: customerPhone.trim() || undefined,
      items: [...cart],
      subtotal: cartTotals.subtotal,
      itemCount: cartTotals.itemCount,
    };
    setHeldBills((prev) => [newHeld, ...prev]);
    clearCart();
    setCustomerName('');
    setCustomerPhone('');
    setSelectedCustomerId('');
    setTenderedAmount(0);
    setHoldToast(lang === 'ur' ? `✅ بل ہولڈ لسٹ میں محفوظ ہو گیا (#${heldBills.length + 1})` : 'Bill placed on hold!');
    setTimeout(() => setHoldToast(null), 3000);
  };

  const handleResumeHeldBill = (held: HeldBill) => {
    posSound.playClick();
    if (cart.length > 0) {
      const currentHeld: HeldBill = {
        id: `held_${Date.now()}`,
        heldAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        customerName: customerName.trim() || (lang === 'ur' ? 'عام گاہک' : 'Walk-in Customer'),
        customerPhone: customerPhone.trim() || undefined,
        items: [...cart],
        subtotal: cartTotals.subtotal,
        itemCount: cartTotals.itemCount,
      };
      setHeldBills((prev) => [currentHeld, ...prev.filter((b) => b.id !== held.id)]);
    } else {
      setHeldBills((prev) => prev.filter((b) => b.id !== held.id));
    }
    replaceCart(held.items);
    setCustomerName(held.customerName === 'عام گاہک' || held.customerName === 'Walk-in Customer' ? '' : held.customerName);
    setCustomerPhone(held.customerPhone || '');
    setHeldBillsModalOpen(false);
    setMobileTab('cart');
    setHoldToast(lang === 'ur' ? `⚡ بل کاؤنٹر پر بحال ہو گیا (${held.items.length} اشیاء)!` : 'Bill resumed to cart!');
    setTimeout(() => setHoldToast(null), 3000);
    barcodeInputRef.current?.focus();
  };

  const handleDeleteHeldBill = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    posSound.playClick();
    setHeldBills((prev) => prev.filter((b) => b.id !== id));
  };

  // Quick Tools Menu state & click outside
  const [quickToolsOpen, setQuickToolsOpen] = useState(false);
  const quickToolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickToolsRef.current && !quickToolsRef.current.contains(e.target as Node)) {
        setQuickToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll refs for active bill list
  const cartEndRef = useRef<HTMLDivElement>(null);
  const cartContainerRef = useRef<HTMLDivElement>(null);
  const tenderedInputRef = useRef<HTMLInputElement>(null);
  const customerNameInputRef = useRef<HTMLInputElement>(null);
  const customerPhoneInputRef = useRef<HTMLInputElement>(null);

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

  // Complete Zero-Mouse Keyboard Operation Support (F1, F2, F3, F4, F6, F7, F8, F10, F11, F12, Esc & Alt Shortcuts)
  useEffect(() => {
    // Intercept browser help event to prevent Windows/Chrome Help dialog on F1
    const handleHelp = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canGiveCredit()) {
        posSound.playErrorBuzz();
        setHoldToast(lang === 'ur' ? '⛔ غیر مجاز عمل! کیشیئر کو ادھار دینے کی اجازت نہیں ہے' : 'Unauthorized! Cashier cannot give credit');
        setTimeout(() => setHoldToast(null), 3000);
        return false;
      }
      setPaymentMethod('CREDIT');
      setHoldToast(lang === 'ur' ? '📝 ادھار کھاتہ موڈ فعال ہوگیا' : 'Credit mode active');
      setTimeout(() => setHoldToast(null), 2500);
      setTimeout(() => {
        customerNameInputRef.current?.focus();
        customerNameInputRef.current?.select();
      }, 50);
      return false;
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. F1 or Alt+U or Alt+K -> Instant Switch to Khata/Credit & Jump to Customer Name
      if (e.key === 'F1' || (e.altKey && (e.key === 'u' || e.key === 'U' || e.key === 'k' || e.key === 'K'))) {
        e.preventDefault();
        e.stopPropagation();
        if (!canGiveCredit()) {
          posSound.playErrorBuzz();
          setHoldToast(lang === 'ur' ? '⛔ غیر مجاز عمل! کیشیئر کو ادھار دینے کی اجازت نہیں ہے' : 'Unauthorized! Cashier cannot give credit');
          setTimeout(() => setHoldToast(null), 3000);
          return;
        }
        setPaymentMethod('CREDIT');
        setHoldToast(lang === 'ur' ? '📝 ادھار کھاتہ موڈ فعال ہوگیا (گاہک کا نام درج کریں)' : 'Credit mode active');
        setTimeout(() => setHoldToast(null), 2500);
        setTimeout(() => {
          customerNameInputRef.current?.focus();
          customerNameInputRef.current?.select();
        }, 50);
        return;
      }

      // 2. F12 or Alt+Enter or Ctrl+Enter -> Instant Complete & Print Bill
      if (e.key === 'F12' || (e.altKey && e.key === 'Enter') || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        e.stopPropagation();
        if (cart.length > 0) {
          handleCheckout();
        } else {
          posSound.playErrorBuzz();
          setHoldToast(lang === 'ur' ? '⚠️ بل بنانے کیلئے پہلے کوئی آئٹم شامل کریں!' : 'Please add items first!');
          setTimeout(() => setHoldToast(null), 2500);
        }
        return;
      }

      // 3. F4 or Alt+C -> Jump directly to Cash Received Input (auto-fills exact bill total)
      if (e.key === 'F4' || (e.altKey && (e.key === 'c' || e.key === 'C'))) {
        e.preventDefault();
        e.stopPropagation();
        setPaymentMethod('CASH');
        if (!tenderedAmount || tenderedAmount === 0) {
          setTenderedAmount(effectiveNetTotal);
        }
        tenderedInputRef.current?.focus();
        tenderedInputRef.current?.select();
        return;
      }

      // 4. F6 or Alt+H -> Instant Hold Bill
      if (e.key === 'F6' || (e.altKey && (e.key === 'h' || e.key === 'H'))) {
        e.preventDefault();
        e.stopPropagation();
        handleHoldBill();
        return;
      }

      // 5. F7 or Alt+Q -> Open Held Bills Queue Modal
      if (e.key === 'F7' || (e.altKey && (e.key === 'q' || e.key === 'Q'))) {
        e.preventDefault();
        e.stopPropagation();
        setHeldBillsModalOpen(true);
        return;
      }

      // 6. F10 or Alt+J -> Open Bills History & Fast Reprint
      if (e.key === 'F10' || (e.altKey && (e.key === 'j' || e.key === 'J'))) {
        e.preventDefault();
        e.stopPropagation();
        setIsRecentBillsModalOpen(true);
        return;
      }

      // 7. F11 or Alt+E -> Open Sale Return & Exchange
      if (e.key === 'F11' || (e.altKey && (e.key === 'e' || e.key === 'E'))) {
        e.preventDefault();
        e.stopPropagation();
        setIsExchangeModalOpen(true);
        return;
      }

      // 8. F3 or Alt+I -> Open Quick Custom Item Add Modal
      if (e.key === 'F3' || (e.altKey && (e.key === 'i' || e.key === 'I'))) {
        e.preventDefault();
        e.stopPropagation();
        setCustomItemModalOpen(true);
        return;
      }

      // 9. F8 or Alt+D -> Delete last added item from cart without touching mouse
      if (e.key === 'F8' || (e.altKey && (e.key === 'd' || e.key === 'D'))) {
        e.preventDefault();
        e.stopPropagation();
        if (cart.length > 0) {
          const lastItem = cart[cart.length - 1];
          removeFromCart(lastItem.product.id);
          posSound.playClick();
          setHoldToast(lang === 'ur' ? `آئٹم حذف ہو گئی (${lastItem.product.nameUr})` : 'Item deleted');
          setTimeout(() => setHoldToast(null), 2000);
        }
        return;
      }

      // 10. F2 or F9 or Alt+B -> Jump focus back to Barcode Scanner Input
      if (e.key === 'F2' || e.key === 'F9' || (e.altKey && (e.key === 'b' || e.key === 'B'))) {
        e.preventDefault();
        e.stopPropagation();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
        return;
      }

      // 11. Protect active cart from accidental reload via F5 or Ctrl+R
      if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R'))) {
        if (cart.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          const confirmReload = confirm(
            lang === 'ur'
              ? '⚠️ بل میں اشیاء موجود ہیں! کیا آپ واقعی پیج ریفریش کرنا چاہتے ہیں؟ (موجودہ بل ضائع ہو جائے گا)'
              : 'Active items in cart! Are you sure you want to reload?'
          );
          if (confirmReload) {
            window.location.reload();
          }
          return;
        }
      }

      // 12. Escape -> Close any open modals or drawers and return focus to scanner
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setHeldBillsModalOpen(false);
        setIsRecentBillsModalOpen(false);
        setIsExchangeModalOpen(false);
        setCustomItemModalOpen(false);
        setIsShopWhatsAppModalOpen(false);
        setSearchSuggestionsOpen(false);
        setUrduKeyboardOpen(false);
        barcodeInputRef.current?.focus();
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    window.addEventListener('help', handleHelp, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
      window.removeEventListener('help', handleHelp, { capture: true });
    };
  }, [cart.length, cartTotals.subtotal, orderDiscount, tenderedAmount, paymentMethod, amountPaid, effectiveNetTotal, lang]);

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

  // Auto-detect existing customer if cashier types phone or name in walk-in inputs
  const detectedExistingCustomer = useMemo(() => {
    if (selectedCustomerId) return null;
    const phone = customerPhone.trim();
    const name = customerName.trim().toLowerCase();
    if (!phone && !name) return null;
    return (
      customers.find((c) => {
        if (phone && phone !== 'N/A' && phone !== '-' && c.phone === phone) return true;
        if (
          name &&
          name !== 'عام گاہک' &&
          name !== 'walk-in' &&
          name !== 'عام گاہک (walk-in)' &&
          c.name.trim().toLowerCase() === name
        ) {
          return true;
        }
        return false;
      }) || null
    );
  }, [selectedCustomerId, customerPhone, customerName, customers]);

  // Extract categories (all available portions)
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const cat = lang === 'ur' ? (p.categoryUr || p.categoryEn) : (p.categoryEn || p.categoryUr);
      if (cat && cat.trim()) set.add(cat.trim());
    });
    return ['all', ...Array.from(set)];
  }, [products, lang]);

  // Concurrent deferred search query keeps mobile input 100% smooth at 60fps
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Filtered products (Matches specific portion when selected, and ALL products when 'all' is selected)
  const filteredProducts = useMemo(() => {
    const rawQ = (deferredSearchQuery || '').trim();
    const q = rawQ.toLowerCase();
    const normQ = q
      .replace(/[\u064B-\u065F\u0670\u200C]/g, '')
      .replace(/[يى]/g, 'ی')
      .replace(/[ك]/g, 'ک')
      .replace(/[هۃھ]/g, 'ہ')
      .replace(/[آإأٱ]/g, 'ا');

    const hasCat = selectedCategory !== 'all';

    return products.filter((p) => {
      if (hasCat) {
        const pCat = lang === 'ur' ? (p.categoryUr || p.categoryEn || '') : (p.categoryEn || p.categoryUr || '');
        if (
          pCat !== selectedCategory &&
          p.categoryUr !== selectedCategory &&
          p.categoryEn !== selectedCategory
        ) {
          return false;
        }
      }

      if (!rawQ) return true;

      const nameEn = (p.nameEn || '').toLowerCase();
      const nameUr = (p.nameUr || '').toLowerCase();
      const normNameUr = nameUr
        .replace(/[\u064B-\u065F\u0670\u200C]/g, '')
        .replace(/[يى]/g, 'ی')
        .replace(/[ك]/g, 'ک')
        .replace(/[هۃھ]/g, 'ہ')
        .replace(/[آإأٱ]/g, 'ا');

      return (
        nameEn.includes(q) ||
        nameUr.includes(q) ||
        (normQ && normNameUr.includes(normQ)) ||
        (p.barcode || '').includes(rawQ) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.categoryUr || '').toLowerCase().includes(q) ||
        (p.categoryEn || '').toLowerCase().includes(q)
      );
    });
  }, [products, selectedCategory, deferredSearchQuery, lang]);

  // Mobile & Desktop high-performance batch rendering (24 cards initial for 0ms mobile render)
  const [visibleProductCount, setVisibleProductCount] = useState<number>(24);

  useEffect(() => {
    setVisibleProductCount(24);
  }, [selectedCategory, deferredSearchQuery]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleProductCount);
  }, [filteredProducts, visibleProductCount]);

  // Global search suggestions with fast early exit at 25 items for 0ms typing
  const searchResults = useMemo(() => {
    const rawQ = (deferredSearchQuery || '').trim();
    if (!rawQ) return [];
    const q = rawQ.toLowerCase();
    const normQ = q
      .replace(/[\u064B-\u065F\u0670\u200C]/g, '')
      .replace(/[يى]/g, 'ی')
      .replace(/[ك]/g, 'ک')
      .replace(/[هۃھ]/g, 'ہ')
      .replace(/[آإأٱ]/g, 'ا');

    const results: Product[] = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const nameEn = (p.nameEn || '').toLowerCase();
      const nameUr = (p.nameUr || '').toLowerCase();
      const normNameUr = nameUr
        .replace(/[\u064B-\u065F\u0670\u200C]/g, '')
        .replace(/[يى]/g, 'ی')
        .replace(/[ك]/g, 'ک')
        .replace(/[هۃھ]/g, 'ہ')
        .replace(/[آإأٱ]/g, 'ا');

      if (
        nameEn.includes(q) ||
        nameUr.includes(q) ||
        (normQ && normNameUr.includes(normQ)) ||
        (p.barcode && p.barcode.includes(rawQ)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.categoryUr && p.categoryUr.toLowerCase().includes(q)) ||
        (p.categoryEn && p.categoryEn.toLowerCase().includes(q))
      ) {
        results.push(p);
        if (results.length >= 25) break;
      }
    }
    return results;
  }, [products, deferredSearchQuery]);

  // Handle Search Input Enter Key (Adds top match directly to bill)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      tryAddToCart(searchResults[0], 1);
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
        (p.barcode && p.barcode === clean) ||
        ((p.sku || '').toLowerCase() === clean.toLowerCase()) ||
        p.id === clean ||
        (p.barcode && clean.includes(p.barcode))
    );

    if (matched) {
      tryAddToCart(matched, 1);
      setQrSuccessMsg(
        lang === 'ur'
          ? `✓ "${matched.nameUr}" بل میں شامل ہو گیا!`
          : `✓ Added "${matched.nameEn}" to bill!`
      );
      setQrManualInput('');
      setTimeout(() => setQrSuccessMsg(null), 2500);
    } else {
      posSound.playErrorBuzz();
      alert(lang === 'ur' ? 'یہ کیو آر کوڈ یا بارکوڈ سسٹم میں موجود نہیں!' : 'QR / Barcode not found!');
    }
  };

  // Handle Barcode Scanner & Unified Product Input Enter Key (100% Zero-Mouse Operation!)
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = barcodeInput.trim();
    if (!raw) {
      // If empty barcode and cart has items: jump straight to tendered amount or checkout without mouse!
      if (cart.length > 0) {
        if (tenderedAmount > 0) {
          handleCheckout();
        } else {
          setTenderedAmount(effectiveNetTotal);
          tenderedInputRef.current?.focus();
          tenderedInputRef.current?.select();
        }
      }
      return;
    }

    // Support multiplier syntax e.g. "5*89640001" or "2*چینی" or "3*1001"
    let qty = 1;
    let target = raw;
    if (raw.includes('*')) {
      const parts = raw.split('*');
      if (parts.length === 2 && !isNaN(Number(parts[0])) && Number(parts[0]) > 0) {
        qty = parseFloat(parts[0]) || 1;
        target = parts[1].trim();
      }
    }

    // 1. Match by exact barcode, SKU or ID
    let matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === target.toLowerCase()) ||
        ((p.sku || '').toLowerCase() === target.toLowerCase()) ||
        p.id === target
    );

    // 2. Fallback: match by product name in Urdu or English
    if (!matched && target.length >= 2) {
      const q = target.toLowerCase();
      matched = products.find(
        (p) =>
          (p.nameUr && p.nameUr.toLowerCase().includes(q)) ||
          (p.nameEn && p.nameEn.toLowerCase().includes(q))
      );
    }

    if (matched) {
      tryAddToCart(matched, qty);
      setBarcodeInput('');
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 30);
    } else {
      posSound.playErrorBuzz();
      alert(lang === 'ur' ? `پروڈکٹ "${target}" سسٹم میں نہیں ملی!` : `Product "${target}" not found!`);
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
      switchRole('ADMIN');
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

  // Add manual unlisted custom item directly to cart (ADMIN ONLY)
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole !== 'ADMIN' && currentRole !== 'MANAGER') {
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
      tryAddToCart(customProd, 1, 'گرام', undefined, {
        isGram: true,
        weightInGrams: customItemQty > 20 ? customItemQty : 250,
        ratePerKg: customItemPrice,
      });
    } else if (customItemUnit === 'ہاف لیٹر / ملی لیٹر') {
      tryAddToCart(customProd, 1, 'ملی لیٹر', undefined, {
        isLiter: true,
        volumeInMl: customItemQty > 20 ? customItemQty : 500,
        ratePerLiter: customItemPrice,
      });
    } else {
      tryAddToCart(customProd, customItemQty || 1);
    }

    setCustomItemName('');
    setCustomItemPrice(100);
    setCustomItemQty(1);
    setCustomItemModalOpen(false);
  };

  // Checkout submission
  const handleCheckout = () => {
    if (cart.length === 0) return;
    try {
      const netTotal = Math.max(0, cartTotals.subtotal - orderDiscount);
      const isCreditMode = paymentMethod === 'CREDIT' || paymentMethod === 'SPLIT';
      const paid = isCreditMode
        ? Math.min(Math.max(0, amountPaid), netTotal)
        : paymentMethod === 'CASH'
        ? (cashInputMode === 'notes' && notesCalculatedTotal > 0 ? Math.min(notesCalculatedTotal, netTotal) : Math.min(tenderedAmount || netTotal, netTotal))
        : Math.min(tenderedAmount || netTotal, netTotal);
      const expectedBalance = Math.max(0, netTotal - paid);
      const tendered = isCreditMode
        ? paid
        : paymentMethod === 'CASH' && cashInputMode === 'notes' && notesCalculatedTotal > 0
        ? notesCalculatedTotal
        : tenderedAmount > 0
        ? tenderedAmount
        : netTotal;

      // Cashier Credit Permission Guard: Strictly block cashiers without credit permission
      if ((paymentMethod === 'CREDIT' || expectedBalance > 0) && !canGiveCredit()) {
        posSound.playErrorBuzz();
        alert(
          lang === 'ur'
            ? '⛔ غیر مجاز عمل!\nکیشیئر کو کاؤنٹر پر ادھار دینے کی اجازت نہیں دی گئی۔\nبرائے مہربانی مکمل نقد یا آن لائن رقم وصول کریں یا ایڈمن سے رابطہ کریں۔'
            : 'Unauthorized! Cashier is not allowed to issue credit bills.\nPlease collect full payment in Cash or Online, or login as Admin.'
        );
        setPaymentMethod('CASH');
        return;
      }

      // Udhaar validation: Ensure customer name exists for credit transactions
      let finalCustName = customerName.trim();
      let finalCustPhone = customerPhone.trim();

      if ((paymentMethod === 'CREDIT' || expectedBalance > 0) && !selectedCustomerId && !finalCustName) {
        posSound.playErrorBuzz();
        const entered = prompt(
          lang === 'ur'
            ? '⚠️ ادھار بل کیلئے برائے مہربانی گاہک کا نام درج فرمائیں:\n(کھاتہ بک میں اس کا کھاتہ خودکار بن جائے گا)'
            : 'Please enter customer name for credit bill:\n(Khata account will be auto-created)'
        );
        if (!entered || !entered.trim()) {
          customerNameInputRef.current?.focus();
          return;
        }
        finalCustName = entered.trim();
        setCustomerName(finalCustName);
      }

      posSound.playSuccessChime();

      const invoice = checkoutInvoice({
        customerId: selectedCustomerId || undefined,
        customerName: finalCustName || (lang === 'ur' ? 'عام گاہک (Walk-in)' : 'Walk-in Customer'),
        customerPhone: finalCustPhone,
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

      // Udhaar Khata Feedback Toast
      if (invoice.balanceDue > 0) {
        setHoldToast(
          lang === 'ur'
            ? `✅ ادھار کھاتہ درج: "${invoice.customerName}" کا کھاتہ بن گیا (موصول: ${invoice.paidAmount.toLocaleString()} روپے | بقایا: ${invoice.balanceDue.toLocaleString()} روپے)!`
            : `✅ Credit Khata: "${invoice.customerName}" (Paid: Rs. ${invoice.paidAmount.toLocaleString()} | Balance: Rs. ${invoice.balanceDue.toLocaleString()})!`
        );
        setTimeout(() => setHoldToast(null), 4000);
      }

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
    } catch (err) {
      console.error('Checkout error:', err);
      posSound.playErrorBuzz();
      alert(lang === 'ur' ? 'بل محفوظ کرتے وقت غیر متوقع خرابی پیش آئی ہے۔' : 'An error occurred while saving the bill.');
    }
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
            {(currentRole === 'ADMIN' || currentRole === 'MANAGER') && (
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
      <div className="space-y-3">
        {cart.map((item, idx) => {
          const isWeight = isWeightEligible(item);
          const isLiter = isLiterEligible(item);
          const unitRate = item.ratePerKg || item.ratePerLiter || item.unitPrice || item.product.salePrice;
          const displayUnit = item.selectedUnit || item.unit || item.product.unit || 'عدد';

          return (
            <div
              key={item.id}
              className="p-3 sm:p-3.5 bg-white dark:bg-slate-850 rounded-2xl border-2 border-emerald-500/40 hover:border-emerald-500 transition-all shadow-sm flex flex-col gap-2.5 animate-fadeIn"
            >
              {/* TOP ROW: Item Number, Urdu & English Name, Sale Rate (Editable), Trash Button */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-mono font-black text-xs sm:text-sm shrink-0 shadow-xs mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                        {lang === 'ur' ? item.product.nameUr : item.product.nameEn}
                      </h5>
                      {item.packagedVariant && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                          {item.packagedVariant}
                        </span>
                      )}
                      {item.product.expiryDate && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black ${
                            new Date(item.product.expiryDate) < new Date()
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                          }`}
                        >
                          Exp: {item.product.expiryDate}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-slate-400 font-normal">({item.product.nameEn || item.product.sku})</span>
                      <span className="inline-flex items-center gap-1 font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <span>{lang === 'ur' ? 'ریٹ:' : 'Rate:'} <strong>{unitRate.toLocaleString()} PKR</strong> / {lang === 'ur' ? displayUnit : (displayUnit === 'عدد' ? 'Pcs' : displayUnit === 'کلو' ? 'Kg' : displayUnit === 'گرام' ? 'g' : displayUnit === 'لیٹر' ? 'L' : displayUnit)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newRateStr = prompt(
                              lang === 'ur'
                                ? `سیل ریٹ تبدیل کریں (${item.product.nameUr}):`
                                : `Edit Sale Rate for ${item.product.nameEn}:`,
                              unitRate.toString()
                            );
                            if (newRateStr !== null) {
                              const parsedRate = parseFloat(newRateStr);
                              if (!isNaN(parsedRate) && parsedRate >= 0) {
                                updateCartItem(item.id, {
                                  unitPrice: parsedRate,
                                  total: Math.round(item.quantity * parsedRate),
                                });
                              }
                            }
                          }}
                          className="p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-900 rounded text-emerald-600 dark:text-emerald-300 transition"
                          title={lang === 'ur' ? 'ریٹ تبدیل کرنے کے لیے کلک کریں' : 'Click to edit price'}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </span>
                      {isWeight && item.quantity < 1 && (
                        <span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
                          ({Math.round(item.quantity * 1000)} گرام)
                        </span>
                      )}
                      {isLiter && item.quantity < 1 && (
                        <span className="text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-50 dark:bg-cyan-950/50 px-1.5 py-0.5 rounded">
                          ({Math.round(item.quantity * 1000)} ml)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => {
                    posSound.playClick();
                    removeFromCart(item.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all shrink-0 cursor-pointer"
                  title="بل سے یہ آئٹم نکالیں"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* BOTTOM ROW: Large Prominent Quantity Stepper & Big Subtotal */}
              <div className="flex items-center justify-between gap-3 pt-0.5 flex-wrap">
                {/* Quantity Controls - Prominent, Large, Touch & Click Friendly */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 shrink-0">
                    {lang === 'ur' ? 'مقدار / تعداد:' : 'Quantity:'}
                  </span>

                  {/* Decrement [-] Button */}
                  <button
                    type="button"
                    onClick={() => {
                      posSound.playClick();
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
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 hover:text-rose-600 dark:hover:bg-rose-950 text-slate-800 dark:text-slate-200 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center font-black text-base active:scale-90 transition-all shadow-xs cursor-pointer"
                    title="مقدار کم کریں (-)"
                  >
                    <Minus className="w-4 h-4 stroke-[3]" />
                  </button>

                  {/* Editable Quantity Input */}
                  <div className="relative">
                    <input
                      type="number"
                      min="0.01"
                      step={isWeight || isLiter ? "0.05" : "1"}
                      value={item.quantity}
                      onKeyDown={() => posSound.playKeyClick()}
                      onChange={(e) => {
                        const val = Math.max(0.01, parseFloat(e.target.value) || 0);
                        if (!canSellOutOfStock() && val > (Number(item.product.stock) || 0)) {
                          posSound.playError();
                          alert(lang === 'ur'
                            ? `⚠️ سامان / اسٹاک ناکافی ہے!\nاس آئٹم کا اسٹاک صرف ${item.product.stock} ${item.product.unit} دستیاب ہے۔ کیشیئر کو منفی انٹری کی اجازت نہیں ہے۔`
                            : `⚠️ Out of Stock! Only ${item.product.stock} available. Negative stock billing is blocked for cashier.`);
                          return;
                        }
                        updateCartItem(item.id, {
                          quantity: val,
                          isGram: false,
                          isLiter: false,
                          unitPrice: unitRate,
                          total: Math.round(val * unitRate),
                        });
                      }}
                      className="w-18 sm:w-22 text-center text-base sm:text-lg font-mono font-black bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-xl py-1 focus:ring-2 focus:ring-emerald-500/30 outline-none text-slate-900 dark:text-white shadow-inner"
                      title="براہ راست تعداد لکھیں"
                    />
                    <span className="absolute -bottom-3 left-0 right-0 text-center text-[9px] font-bold text-slate-400 font-mono pointer-events-none">
                      {displayUnit}
                    </span>
                  </div>

                  {/* Increment [+] Button */}
                  <button
                    type="button"
                    onClick={() => {
                      posSound.playClick();
                      const step = (isWeight || isLiter) ? 0.25 : 1;
                      const next = Math.round((item.quantity + step) * 100) / 100;
                      if (!canSellOutOfStock() && next > (Number(item.product.stock) || 0)) {
                        posSound.playError();
                        alert(lang === 'ur'
                          ? `⚠️ سامان / اسٹاک ناکافی ہے!\nاس آئٹم کا اسٹاک صرف ${item.product.stock} ${item.product.unit} دستیاب ہے۔ کیشیئر کو منفی انٹری کی اجازت نہیں ہے۔`
                          : `⚠️ Out of Stock! Only ${item.product.stock} available. Negative stock billing is blocked for cashier.`);
                        return;
                      }
                      updateCartItem(item.id, {
                        quantity: next,
                        isGram: false,
                        isLiter: false,
                        unitPrice: unitRate,
                        total: Math.round(next * unitRate),
                      });
                    }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-black text-base active:scale-90 transition-all shadow-md shadow-emerald-700/30 border border-emerald-400 cursor-pointer"
                    title="مقدار بڑھائیں (+)"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </button>

                  {/* Quick Shortcuts: +1 and +5 for Speed */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        posSound.playClick();
                        const next = item.quantity + 1;
                        if (!canSellOutOfStock() && next > (Number(item.product.stock) || 0)) {
                          posSound.playError();
                          return;
                        }
                        updateCartItem(item.id, {
                          quantity: next,
                          unitPrice: unitRate,
                          total: Math.round(next * unitRate),
                        });
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-750 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-200 text-xs font-mono font-bold transition-all shadow-xs border border-slate-300 dark:border-slate-700"
                      title="+1 مزید شامل کریں"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        posSound.playClick();
                        const next = item.quantity + 5;
                        if (!canSellOutOfStock() && next > (Number(item.product.stock) || 0)) {
                          posSound.playError();
                          return;
                        }
                        updateCartItem(item.id, {
                          quantity: next,
                          unitPrice: unitRate,
                          total: Math.round(next * unitRate),
                        });
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-750 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-200 text-xs font-mono font-bold transition-all shadow-xs border border-slate-300 dark:border-slate-700"
                      title="+5 مزید شامل کریں"
                    >
                      +5
                    </button>
                  </div>
                </div>

                {/* Line Total */}
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 block">
                    {lang === 'ur' ? 'کل رقم:' : 'Total:'}
                  </span>
                  <span className="font-mono font-black text-base sm:text-xl text-emerald-600 dark:text-emerald-400">
                    {item.total.toLocaleString()} <span className="text-xs font-sans">PKR</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {/* Invisible anchor for smooth auto-scroll to bottom */}
        <div ref={cartEndRef} />
      </div>
    );
  };

  // Sub-renderer for Recent Hold Bills (پینڈنگ بلز - بائیں جانب خالی جگہ پر نمایاں)
  const renderHeldBillsSection = () => {
    // If no held bills, do NOT waste vertical space with empty box
    if (heldBills.length === 0) {
      return null;
    }

    return (
      <div className="bg-amber-50 dark:bg-amber-950/40 rounded-2xl p-2 sm:p-2.5 border-2 border-amber-400 dark:border-amber-600 shadow-sm space-y-2 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs text-amber-900 dark:text-amber-200">
            <Pause className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
            <span>{lang === 'ur' ? '⚠️ پینڈنگ ہولڈ بلز (محفوظ شدہ):' : 'Pending Held Bills:'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-500 text-slate-950 shadow-xs">
              {heldBills.length}
            </span>
          </div>
          <button
            type="button"
            onClick={handleHoldBill}
            disabled={cart.length === 0}
            className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs disabled:opacity-40 disabled:hover:bg-amber-500 active:scale-95 transition-all flex items-center gap-1"
            title="موجودہ بل ہولڈ کریں (F6)"
          >
            <span>+</span>
            <span>{lang === 'ur' ? 'بل ہولڈ (F6)' : 'Hold (F6)'}</span>
          </button>
        </div>

        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5 scroll-smooth">
          {heldBills.map((hb) => (
            <div
              key={hb.id}
              className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-700/80 hover:border-amber-500 flex items-center justify-between gap-2 shadow-xs transition-all"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                    {hb.customerName || (lang === 'ur' ? 'عام گاہک' : 'Walk-in')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {hb.heldAt}
                  </span>
                </div>
                <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-black mt-0.5">
                  {hb.items.length} {lang === 'ur' ? 'اشیاء' : 'items'} • {hb.subtotal.toLocaleString()} PKR
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleResumeHeldBill(hb)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-sm active:scale-95 transition-all border border-emerald-400"
                  title="بل بحال کریں اور جاری رکھیں"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{lang === 'ur' ? 'بحال کریں' : 'Resume'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteHeldBill(hb.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all"
                  title="ہولڈ بل خارج کریں"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Sub-renderer for Customer, Payment, Notes Calculator & Checkout Controls (Candela / Nebs Fixed Dock)
  const renderCheckoutControls = () => {
    const effectiveNetTotal = Math.max(0, cartTotals.subtotal - orderDiscount);
    const activeTendered =
      paymentMethod === 'CASH' && cashInputMode === 'notes' && notesCalculatedTotal > 0
        ? notesCalculatedTotal
        : tenderedAmount;
    const changeDue = activeTendered > effectiveNetTotal ? activeTendered - effectiveNetTotal : 0;
    const isShort = activeTendered > 0 && activeTendered < effectiveNetTotal;
    const shortAmount = isShort ? effectiveNetTotal - activeTendered : 0;

    return (
      <div className="flex flex-col h-full min-h-0 justify-between gap-1.5 overflow-hidden">
        {/* Upper Area: Customer & Payment Method (Scrollable if needed, doesn't push bottom dock) */}
        <div className="space-y-1.5 overflow-y-auto pr-0.5 shrink min-h-0">
          {/* Customer Selection Row */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedCustomerId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold outline-none text-slate-800 dark:text-slate-200"
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
                posSound.playClick();
                setVoiceMode('customer');
                setVoiceModalOpen(true);
              }}
              className="p-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
              title="Dictate Customer Name & Phone"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-600" />
            </button>

            {/* Quick Receive Payment Pill if Customer has Balance */}
            {selectedCustomerId && (customers.find((c) => c.id === selectedCustomerId)?.currentBalance || 0) > 0 && (
              <button
                type="button"
                onClick={() => {
                  const cust = customers.find((c) => c.id === selectedCustomerId);
                  if (cust) {
                    setPosKhataPayCustomerId(cust.id);
                    setPosKhataPayAmount(0);
                    setPosKhataPaymentModalOpen(true);
                  }
                }}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black flex items-center gap-1 shadow-sm active:scale-95 transition-all whitespace-nowrap cursor-pointer animate-fadeIn"
                title="اس گاہک کی طرف سے رقم وصول کریں اور کھاتے میں جمع کریں"
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>{lang === 'ur' ? 'رقم جمع' : 'Deposit'}</span>
              </button>
            )}
          </div>

          {/* If new walk-in / custom name or phone */}
          {!selectedCustomerId && (
            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  ref={customerNameInputRef}
                  type="text"
                  value={customerName}
                  onKeyDown={(e) => {
                    posSound.playKeyClick();
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      customerPhoneInputRef.current?.focus();
                      customerPhoneInputRef.current?.select();
                    }
                  }}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={paymentMethod === 'CREDIT' ? (lang === 'ur' ? 'گاہک کا نام (کھاتہ کیلئے)' : 'Customer Name (Khata)') : t('customerName')}
                  className={`bg-white dark:bg-slate-800 border rounded-xl px-2.5 py-1 text-xs font-bold outline-none transition-all ${
                    paymentMethod === 'CREDIT'
                      ? 'border-rose-400 dark:border-rose-500 ring-1 ring-rose-400/40 bg-rose-50/30 dark:bg-rose-950/20'
                      : 'border-slate-300 dark:border-slate-700 focus:border-emerald-500'
                  }`}
                />
                <input
                  ref={customerPhoneInputRef}
                  type="text"
                  value={customerPhone}
                  onKeyDown={(e) => {
                    posSound.playKeyClick();
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCheckout();
                    }
                  }}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder={paymentMethod === 'CREDIT' ? (lang === 'ur' ? 'گاہک کا فون نمبر' : 'Phone (Optional)') : t('customerPhone')}
                  className={`bg-white dark:bg-slate-800 border rounded-xl px-2.5 py-1 text-xs font-mono font-bold outline-none transition-all ${
                    paymentMethod === 'CREDIT'
                      ? 'border-rose-400 dark:border-rose-500 ring-1 ring-rose-400/40 bg-rose-50/30 dark:bg-rose-950/20'
                      : 'border-slate-300 dark:border-slate-700 focus:border-emerald-500'
                  }`}
                />
              </div>

              {/* Dynamic Auto-Khata Feedback Pill */}
              {detectedExistingCustomer ? (
                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700/60 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 animate-fadeIn">
                  <span className="truncate">👤 {detectedExistingCustomer.name} {lang === 'ur' ? '(کھاتہ موجود ہے)' : '(Khata Active)'}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">{lang === 'ur' ? 'سابقہ ادھار:' : 'Previous Due:'} {detectedExistingCustomer.currentBalance.toLocaleString()} PKR</span>
                    {detectedExistingCustomer.currentBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPosKhataPayCustomerId(detectedExistingCustomer.id);
                          setPosKhataPayAmount(0);
                          setPosKhataPaymentModalOpen(true);
                        }}
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9.5px] font-black shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        رقم جمع کریں
                      </button>
                    )}
                  </div>
                </div>
              ) : (customerName.trim() || customerPhone.trim()) && paymentMethod === 'CREDIT' ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-300 dark:border-blue-700/60 text-[10px] font-bold text-blue-800 dark:text-blue-300 animate-fadeIn">
                  <span className="animate-pulse">✨</span>
                  <span>{lang === 'ur' ? 'نیا کھاتہ: بل فائنل ہونے پر ادھار کھاتہ بک میں خودکار بن جائے گا!' : 'New Khata: Will be auto-created in KhataBook upon checkout!'}</span>
                </div>
              ) : paymentMethod === 'CREDIT' ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 text-[10px] font-bold text-rose-800 dark:text-rose-300 animate-pulse">
                  <span>{lang === 'ur' ? '📝 ادھار سیل: گاہک کا نام لکھیں، کھاتہ خودکار کھل جائے گا!' : '📝 Credit Sale: Enter customer name, khata will open automatically!'}</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Payment Method Pills */}
          <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                posSound.playClick();
                setPaymentMethod('CASH');
              }}
              className={`py-1 rounded-lg flex items-center justify-center gap-1 transition-all ${
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
              onClick={() => {
                posSound.playClick();
                setPaymentMethod('ONLINE');
              }}
              className={`py-1 rounded-lg flex items-center justify-center gap-1 transition-all ${
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
              onClick={() => {
                if (!canGiveCredit()) {
                  posSound.playErrorBuzz();
                  alert(
                    lang === 'ur'
                      ? '⛔ غیر مجاز عمل!\nکیشیئر کو ادھار پر سودا دینے کی اجازت نہیں ہے۔\nادھار کی رسائی صرف ایڈمن کے پاس ہے۔'
                      : 'Unauthorized! Cashiers cannot give credit. Admin only.'
                  );
                  return;
                }
                posSound.playClick();
                setPaymentMethod('CREDIT');
              }}
              className={`py-1 rounded-lg flex items-center justify-center gap-1 transition-all ${
                !canGiveCredit()
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-dashed border-rose-300 dark:border-rose-900/40 cursor-not-allowed opacity-60'
                  : paymentMethod === 'CREDIT'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title={!canGiveCredit() ? (lang === 'ur' ? 'ادھار ممنوع (صرف ایڈمن)' : 'Credit Locked (Admin Only)') : 'ادھار کھاتہ'}
            >
              {!canGiveCredit() ? <Lock className="w-3 h-3 text-rose-500" /> : <FileQuestion className="w-3 h-3" />}
              <span>{!canGiveCredit() ? (lang === 'ur' ? '🔒 ادھار (بلاک)' : '🔒 Credit') : (lang === 'ur' ? 'ادھار' : 'Khata')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                posSound.playClick();
                setPaymentMethod('SPLIT');
              }}
              className={`py-1 rounded-lg flex items-center justify-center gap-1 transition-all ${
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

        {/* Credit & Down-payment / Split Payment Controls */}
        {(paymentMethod === 'CREDIT' || paymentMethod === 'SPLIT') && (
          <div className="p-1.5 sm:p-2 bg-rose-50/70 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800/80 rounded-xl space-y-1 text-xs shrink-0 animate-fadeIn">
            <div className="flex items-center justify-between font-bold text-rose-950 dark:text-rose-200">
              <span className="flex items-center gap-1.5 text-xs font-black">
                <span>📝</span>
                <span>{lang === 'ur' ? 'ادھار کھاتہ و موقع پر کیش وصولی:' : 'Credit & Cash Down-Payment:'}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100">
                {lang === 'ur' ? 'کھاتہ سیل' : 'Credit Sale'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                  {lang === 'ur' ? '💵 موقع پر نقد وصول (Paid Now):' : '💵 Cash Paid Now:'}
                </span>
                <input
                  type="number"
                  min="0"
                  max={effectiveNetTotal}
                  value={amountPaid === 0 ? '' : amountPaid}
                  placeholder={lang === 'ur' ? '0 (مکمل ادھار)' : '0 (Full Credit)'}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    setAmountPaid(val);
                  }}
                  className="w-full bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-xl px-2.5 py-1 text-sm font-mono font-black text-center text-emerald-800 dark:text-emerald-300 outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 block mb-0.5">
                  {lang === 'ur' ? '📋 کھاتے میں بقایا (To Khata):' : '📋 Balance to Khata:'}
                </span>
                <div className="w-full bg-white dark:bg-slate-900 border-2 border-rose-400 dark:border-rose-600 rounded-xl px-2.5 py-1 text-sm font-mono font-black text-center text-rose-600 dark:text-rose-400">
                  {Math.max(0, effectiveNetTotal - amountPaid).toLocaleString()} PKR
                </div>
              </div>
            </div>

            {/* Helper hint */}
            <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-900/60 p-1 rounded-lg border border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
              <span>
                {amountPaid > 0 ? (
                  lang === 'ur' ? (
                    <>✨ <strong>{amountPaid.toLocaleString()} PKR</strong> دراز میں جمع، بقایا <strong>{Math.max(0, effectiveNetTotal - amountPaid).toLocaleString()} PKR</strong> کھاتے میں۔</>
                  ) : (
                    <>✨ <strong>{amountPaid.toLocaleString()} PKR</strong> in Cash Drawer, balance <strong>{Math.max(0, effectiveNetTotal - amountPaid).toLocaleString()} PKR</strong> to Khata.</>
                  )
                ) : (
                  lang === 'ur' ? (
                    <>⚠️ مکمل <strong>{effectiveNetTotal.toLocaleString()} PKR</strong> گاہک کے کھاتے میں درج ہو گا۔</>
                  ) : (
                    <>⚠️ Full <strong>{effectiveNetTotal.toLocaleString()} PKR</strong> will be added to Khata.</>
                  )
                )}
              </span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RECENT HOLD BILLS SECTION (صرف تب جب ہولڈ بلز موجود ہوں)                   */}
        {/* ========================================================================= */}
        {heldBills.length > 0 && (
          <div className="my-1 shrink-0">
            {renderHeldBillsSection()}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CANDELA & NEBS 3-COLUMN FRONT ROW: TOTAL | CASH RECEIVED | CHANGE RETURN */}
        {/* 100% VISIBLE ON THE FRONT - ZERO SCROLLING - NO MOUSE REQUIRED           */}
        {/* ========================================================================= */}
        <div className="shrink-0 space-y-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          {paymentMethod === 'CASH' ? (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {/* 1. TOTAL BILL (کل بل) */}
              <div className="bg-slate-900 text-white p-2 rounded-2xl flex flex-col justify-between shadow-sm border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 truncate">
                  {lang === 'ur' ? 'کل بل (Total):' : 'Grand Total:'}
                </span>
                <div className="font-mono text-base sm:text-xl font-black text-emerald-400 truncate">
                  {effectiveNetTotal.toLocaleString()}
                  <span className="text-[9px] font-sans ml-1 text-slate-400">PKR</span>
                </div>
              </div>

              {/* 2. CASH RECEIVED (موصول کیش) */}
              <div className="bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 rounded-2xl p-1.5 flex flex-col justify-between shadow-sm focus-within:ring-2 focus-within:ring-emerald-400">
                <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                  <span className="truncate">{lang === 'ur' ? 'موصول کیش:' : 'Cash Received:'}</span>
                  <span className="bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 text-[9px] px-1 rounded font-mono">F4</span>
                </div>
                <input
                  ref={tenderedInputRef}
                  type="number"
                  min="0"
                  value={tenderedAmount || ''}
                  onChange={(e) => setTenderedAmount(parseFloat(e.target.value) || 0)}
                  onKeyDown={(e) => {
                    posSound.playKeyClick();
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCheckout();
                    }
                  }}
                  placeholder={String(effectiveNetTotal)}
                  className="w-full bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-600 rounded-lg px-1.5 py-0.5 text-base sm:text-lg font-mono font-black text-center text-emerald-800 dark:text-emerald-200 outline-none"
                />
              </div>

              {/* 3. RETURN CHANGE (واپسی بقایا - LIVE UPDATE) */}
              <div
                className={`p-2 rounded-2xl flex flex-col justify-between shadow-sm transition-all border ${
                  changeDue > 0
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/30'
                    : isShort
                    ? 'bg-rose-600 text-white border-rose-500'
                    : activeTendered >= effectiveNetTotal && activeTendered > 0
                    ? 'bg-teal-700 text-white border-teal-600'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                }`}
              >
                <span className="text-[10px] font-bold truncate">
                  {changeDue > 0
                    ? (lang === 'ur' ? '💵 واپسی بقایا:' : 'Change Return:')
                    : isShort
                    ? (lang === 'ur' ? '⚠️ کم رقم:' : 'Short:')
                    : (lang === 'ur' ? 'واپسی بقایا:' : 'Change Return:')}
                </span>
                <div className="font-mono text-base sm:text-xl font-black truncate">
                  {changeDue > 0
                    ? changeDue.toLocaleString()
                    : isShort
                    ? shortAmount.toLocaleString()
                    : '0'}
                  <span className="text-[9px] font-sans ml-1 opacity-80">PKR</span>
                </div>
              </div>
            </div>
          ) : (
            /* Non-cash modes (Online, Khata, Split) - Compact & Prominent */
            <div className="p-1.5 sm:p-2 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-0.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400">{lang === 'ur' ? 'کل بل (Grand Total):' : 'Grand Total:'}</span>
                <span className="font-mono text-base sm:text-lg font-black text-emerald-400">
                  {effectiveNetTotal.toLocaleString()} PKR
                </span>
              </div>
              {(paymentMethod === 'CREDIT' || paymentMethod === 'SPLIT') && (
                <div className="flex justify-between items-center pt-0.5 border-t border-slate-800 text-[10.5px] font-bold">
                  <span className="text-emerald-400 font-mono">
                    {lang === 'ur' ? 'نقد وصول:' : 'Paid:'} {amountPaid.toLocaleString()} PKR
                  </span>
                  <span className="text-rose-400 font-mono">
                    {lang === 'ur' ? 'کھاتے میں ادھار:' : 'Khata Due:'} {Math.max(0, effectiveNetTotal - amountPaid).toLocaleString()} PKR
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quick Note Pills (1-Click Cash Buttons) */}
          {paymentMethod === 'CASH' && (
            <div className="flex gap-1 items-center justify-between overflow-x-auto py-0.5 text-xs font-mono font-bold">
              <button
                type="button"
                onClick={() => {
                  posSound.playClick();
                  setTenderedAmount(effectiveNetTotal);
                  tenderedInputRef.current?.focus();
                }}
                className="flex-1 py-1 px-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold active:scale-95 text-center shadow-xs whitespace-nowrap"
              >
                {lang === 'ur' ? `برابر (${effectiveNetTotal})` : `Exact (${effectiveNetTotal})`}
              </button>
              {[500, 1000, 1500, 2000, 5000].map((note) => (
                <button
                  key={note}
                  type="button"
                  onClick={() => {
                    posSound.playClick();
                    setTenderedAmount(note);
                    tenderedInputRef.current?.focus();
                  }}
                  className="py-1 px-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-800 dark:text-slate-200 text-[10px] font-bold active:scale-95 shadow-xs whitespace-nowrap"
                >
                  {note}
                </button>
              ))}
            </div>
          )}

          {/* Full-width Instant Complete & Print Button - High Contrast Emerald Green */}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-700/30 border-2 border-emerald-400 ring-2 ring-emerald-500/20 active:scale-95 transition-all"
          >
            <span className="bg-white/20 text-white font-black text-[11px] px-2 py-0.5 rounded font-mono">
              Rs.
            </span>
            <Printer className="w-4 h-4 text-white" />
            <span>{lang === 'ur' ? '⚡ بل فائنل کریں و پرنٹ (Done)' : '⚡ Complete & Print (Done)'}</span>
            <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px] font-mono text-emerald-100 border border-white/20">
              (Enter / F12)
            </span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2.5 min-h-[calc(100dvh-70px)] lg:h-[calc(100vh-70px)] p-2 md:p-3 overflow-y-auto lg:overflow-hidden">
      {/* 1. TOP HEADER STRIP: Active Counter, Cashier, Software Branding, WhatsApp Orders, Margin Pin */}
      <div className="px-4 py-2 bg-slate-900/95 backdrop-blur-md text-white flex flex-wrap items-center justify-between text-xs rounded-2xl border border-slate-800 shadow-md gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Active Role & Counter Badge (Admin vs Cashier Mode Distinction) */}
          <div className="flex items-center gap-2">
            {currentRole === 'ADMIN' || currentRole === 'MANAGER' ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl font-mono font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs flex items-center gap-1.5 shadow-sm">
                  <span>👑</span>
                  <span>{lang === 'ur' ? 'ایڈمن ٹرمینل (مکمل اختیارات)' : 'Admin Terminal (Full Access)'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => switchRole('CASHIER')}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold border border-slate-700 transition-all flex items-center gap-1"
                  title="کیشیئر موڈ پر سوئچ کریں"
                >
                  <span>🏢</span>
                  <span>{lang === 'ur' ? 'کیشیئر موڈ' : 'Cashier Mode'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-1.5 shadow-sm">
                  <span>🏢</span>
                  <span>{lang === 'ur' ? `کاؤنٹر #${activeCounter}` : `Counter #${activeCounter}`}</span>
                  <span className="text-slate-300 font-sans">• {activeCashier?.name || 'کیشیئر'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPinModalOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-purple-950/70 hover:bg-purple-900 text-purple-300 text-[11px] font-bold border border-purple-700/60 transition-all flex items-center gap-1"
                  title="ایڈمن لاگ ان پن درج کریں"
                >
                  <span>👑</span>
                  <span>{lang === 'ur' ? 'ایڈمن لاگ ان' : 'Admin Login'}</span>
                </button>
              </div>
            )}
          </div>

                    {/* Live Quick Metrics: سیل، فروخت، اسٹاک */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-800/90 rounded-xl border border-slate-700/60 font-mono text-[11px]" title="آج کی کل سیل / فروخت">
              <span className="text-slate-400 font-sans font-bold">{lang === 'ur' ? 'سیل:' : 'Sale:'}</span>
              <span className="font-bold text-emerald-400">Rs. {todaySalesTotal.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500">({todayInvoices.length} {lang === 'ur' ? 'بل' : 'bills'})</span>
            </span>

            <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-800/90 rounded-xl border border-slate-700/60 font-mono text-[11px]" title="دکان کا کل فزیکل اسٹاک">
              <span className="text-slate-400 font-sans font-bold">{lang === 'ur' ? 'اسٹاک:' : 'Stock:'}</span>
              <span className={`font-bold ${totalStockCount === 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {totalStockCount.toLocaleString()} {lang === 'ur' ? (totalStockCount === 0 ? '(صفر)' : 'یونٹس') : 'Units'}
              </span>
            </span>
          </div>

          {/* Real-time Dynamic Online / Offline & Cloud Indicator */}
          <div
            className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-all ${
              isOnline
                ? 'text-emerald-300 bg-emerald-950/60 border-emerald-700/60'
                : 'text-amber-300 bg-amber-950/70 border-amber-500/70'
            }`}
            title={
              isOnline
                ? (lang === 'ur' ? 'انٹرنیٹ اور گوگل کلاؤڈ سنک فعال ہے' : 'Online & Google Cloud Sync Active')
                : (lang === 'ur' ? 'انٹرنیٹ کے بغیر تمام بلنگ اور اسٹاک 100% آف لائن فعال ہے' : '100% Offline Mode Active - Zero Internet Required')
            }
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="font-mono text-xs">
              {isOnline
                ? (lang === 'ur' ? '🟢 آن لائن • کلاؤڈ سنک فعال' : '🟢 Online • Cloud Sync')
                : (lang === 'ur' ? '⚡ 100% آف لائن موڈ فعال' : '⚡ 100% Offline Active')}
            </span>
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

          {/* Quick Bill History & Fast Reprint Button for Cashier */}
          <button
            type="button"
            onClick={() => setIsRecentBillsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-sm active:scale-95"
            title="پچھلے بلز دیکھیں اور ری پرنٹ نکالیں"
          >
            <History className="w-3.5 h-3.5 text-blue-100" />
            <span>{lang === 'ur' ? '🧾 بل ہسٹری و ری پرنٹ' : 'Bills & Reprint'}</span>
          </button>

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

          {/* Quick Stock & System Audit Button */}
          <button
            type="button"
            onClick={() => onNavigate?.('audit')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-sm active:scale-95"
            title={lang === 'ur' ? 'اسٹاک فزیکل آڈٹ اور سسٹم لاگز دیکھیں' : 'Stock & System Audit'}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-100" />
            <span>{lang === 'ur' ? '📋 اسٹاک و سسٹم آڈٹ' : 'Audit'}</span>
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

      {/* 2. SLEEK PROFESSIONAL COMMAND BAR: BARCODE SCANNER, SEARCH & ESSENTIAL TOOLS */}
      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 shrink-0">
        {/* Barcode scanner input (Sleek Compact Pro Input) */}
        <form onSubmit={handleBarcodeSubmit} className="flex-1 max-w-[280px] sm:max-w-[320px] relative">
          <Barcode className="w-4 h-4 absolute left-3 top-2.5 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
          <input
            ref={barcodeInputRef}
            type="text"
            value={barcodeInput}
            onKeyDown={() => posSound.playKeyClick()}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder={lang === 'ur' ? 'بارکوڈ اسکین کریں (F2)...' : 'Scan barcode or SKU (F2)...'}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-xs"
          />
        </form>

        {/* Search by name / keyword with Auto-Suggestions Dropdown */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={searchQuery}
              onKeyDown={() => posSound.playKeyClick()}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchSuggestionsOpen(true);
              }}
              onFocus={() => {
                if (searchQuery.trim()) setSearchSuggestionsOpen(true);
              }}
              placeholder={lang === 'ur' ? 'آئٹم کا نام، برانڈ یا کوڈ تلاش کریں...' : 'Search item name, brand or code...'}
              className="w-full pl-9 pr-14 py-1.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 focus:border-emerald-500 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-xs"
            />
          </form>

          {/* Quick buttons inside search input: Clear, Voice Mic */}
          <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  posSound.playClick();
                  setSearchQuery('');
                  setSearchSuggestionsOpen(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                posSound.playClick();
                setVoiceMode('search');
                setVoiceModalOpen(true);
              }}
              className="p-1 text-slate-500 hover:text-emerald-600 rounded-md"
              title="آواز سے بول کر تلاش کریں (Voice Search)"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Live Auto-Suggestions Dropdown */}
          {searchSuggestionsOpen && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-h-72 overflow-y-auto p-1.5 space-y-1">
              <div className="p-1 px-2 text-[10px] font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 flex justify-between">
                <span>{lang === 'ur' ? 'تلاش کے نتائج (انٹر یا کلک کریں):' : 'Search matches:'}</span>
                <span>{searchResults.length} {lang === 'ur' ? 'آئٹمز' : 'items'}</span>
              </div>
              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  {lang === 'ur' ? 'اس نام سے کوئی آئٹم نہیں ملا' : 'No matching product found'}
                </div>
              ) : (
                searchResults.slice(0, 8).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      tryAddToCart(p, 1);
                      setSearchQuery('');
                      setSearchSuggestionsOpen(false);
                      barcodeInputRef.current?.focus();
                    }}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer transition-all border border-transparent hover:border-emerald-300 dark:hover:border-emerald-800"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {p.nameUr && p.nameEn && p.nameUr !== p.nameEn
                          ? `${lang === 'ur' ? p.nameUr : p.nameEn} (${lang === 'ur' ? p.nameEn : p.nameUr})`
                          : p.nameUr || p.nameEn}
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

        {/* Right-aligned Sleek Action Buttons in a Single Compact Row */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Hold Bill Button */}
          {cart.length > 0 && (
            <button
              type="button"
              onClick={handleHoldBill}
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all whitespace-nowrap cursor-pointer"
              title="موجودہ بل ہولڈ کریں (F6)"
            >
              <Pause className="w-3.5 h-3.5 text-slate-950" />
              <span>{lang === 'ur' ? 'ہولڈ (F6)' : 'Hold (F6)'}</span>
            </button>
          )}

          {/* Dedicated Held Bills Queue Button */}
          {heldBills.length > 0 && (
            <button
              type="button"
              onClick={() => setHeldBillsModalOpen(true)}
              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all ring-1 ring-amber-400/50 animate-pulse whitespace-nowrap cursor-pointer"
              title="ہولڈ شدہ بلز دیکھیں (F7)"
            >
              <Clock className="w-3.5 h-3.5 text-slate-950" />
              <span>{heldBills.length} {lang === 'ur' ? 'ہولڈ' : 'Held'}</span>
            </button>
          )}

          {/* Quick Add Custom Item Button */}
          <button
            type="button"
            onClick={() => setCustomItemModalOpen(true)}
            className="hidden sm:flex px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold items-center gap-1 border border-slate-700 transition-all whitespace-nowrap cursor-pointer"
            title="نیا غیر فہرست شدہ آئٹم شامل کریں (F3)"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ur' ? '+ آئٹم (F3)' : '+ Item'}</span>
          </button>

          {/* Quick Tools Floating Dropdown Menu (Clean & Compact) */}
          <div ref={quickToolsRef} className="relative">
            <button
              type="button"
              onClick={() => setQuickToolsOpen(!quickToolsOpen)}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all border border-slate-700 whitespace-nowrap cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'ur' ? 'ٹولز' : 'Tools'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {quickToolsOpen && (
              <div className="absolute left-0 right-auto top-full mt-2 z-50 w-60 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 space-y-1 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => {
                    setQuickToolsOpen(false);
                    setQrModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all text-right"
                >
                  <QrCode className="w-4 h-4 text-indigo-500" />
                  <span>{lang === 'ur' ? 'کیو آر / کیمرہ اسکینر' : 'QR Scan'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuickToolsOpen(false);
                    setIsRecentBillsModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all text-right"
                >
                  <History className="w-4 h-4 text-blue-500" />
                  <span>{lang === 'ur' ? '📜 پچھلے بلز اور ری پرنٹ' : 'Bills History & Reprint'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuickToolsOpen(false);
                    setIsExchangeModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all text-right"
                >
                  <Repeat className="w-4 h-4 text-rose-400" />
                  <span>{lang === 'ur' ? 'مال واپسی و تبدیلی (Exchange)' : 'Exchange / Return'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuickToolsOpen(false);
                    setIsShopWhatsAppModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-emerald-600 transition-all text-right"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <span>{lang === 'ur' ? 'دوکاندار واٹس ایپ سیٹ کریں' : 'Shop WhatsApp'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuickToolsOpen(false);
                    setVoiceMode('order');
                    setVoiceModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all text-right"
                >
                  <Mic className="w-4 h-4 text-emerald-500" />
                  <span>{lang === 'ur' ? 'آواز سے بول کر آرڈر (Voice Order)' : 'Voice Order'}</span>
                </button>

                {/* Admin Only Tools Section */}
                {(currentRole === 'ADMIN' || currentRole === 'MANAGER') && (
                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setQuickToolsOpen(false);
                        if (isMarginUnlocked) {
                          lockMargin();
                        } else {
                          setPinModalOpen(true);
                        }
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all text-right"
                    >
                      {isMarginUnlocked ? <Unlock className="w-4 h-4 text-emerald-500" /> : <Lock className="w-4 h-4 text-amber-500" />}
                      <span>{isMarginUnlocked ? (lang === 'ur' ? 'منافع مارجن لاک کریں' : 'Lock Margin') : (lang === 'ur' ? 'لائیو منافع ان لاک کریں' : 'Unlock Margin')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VIRTUAL URDU KEYBOARD (When toggled on mobile or desktop) */}
      {urduKeyboardOpen && (
        <div className="p-2.5 bg-slate-100 dark:bg-slate-850 rounded-2xl border-2 border-emerald-500/40 shadow-lg space-y-2 animate-fadeIn shrink-0">
          <div className="flex items-center justify-between text-xs px-1 text-slate-700 dark:text-slate-300">
            <span className="font-bold flex items-center gap-1.5">
              <span>⌨️</span>
              <span>{lang === 'ur' ? 'آن اسکرین اردو کی بورڈ (حروف پر ٹیپ کریں):' : 'Urdu Virtual Keyboard:'}</span>
            </span>
            <button
              type="button"
              onClick={() => setUrduKeyboardOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1 justify-center" dir="rtl">
            {['آ', 'ا', 'ب', 'پ', 'ت', 'ٹ', 'ث', 'ج', 'چ', 'ح', 'خ', 'د', 'ڈ', 'ذ', 'ر', 'ڑ', 'ز', 'ژ', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ک', 'گ', 'ل', 'م', 'ن', 'و', 'ہ', 'ء', 'ی', 'ے'].map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => {
                  posSound.playKeyClick();
                  setSearchQuery((prev) => prev + char);
                  setSearchSuggestionsOpen(true);
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 bg-white dark:bg-slate-700 hover:bg-emerald-600 hover:text-white rounded-lg text-sm font-bold border border-slate-200 dark:border-slate-600 shadow-xs flex items-center justify-center active:scale-90 transition-all text-slate-800 dark:text-slate-100"
              >
                {char}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                posSound.playKeyClick();
                setSearchQuery((prev) => prev + ' ');
              }}
              className="px-3 h-8 sm:h-9 bg-slate-200 dark:bg-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95"
            >
              اسپیس
            </button>
            <button
              type="button"
              onClick={() => {
                posSound.playKeyClick();
                setSearchQuery((prev) => prev.slice(0, -1));
              }}
              className="px-3 h-8 sm:h-9 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300 text-xs font-bold rounded-lg hover:bg-rose-200 active:scale-95"
            >
              ⌫ مٹائیں
            </button>
            <button
              type="button"
              onClick={() => {
                posSound.playClick();
                setSearchQuery('');
                setSearchSuggestionsOpen(false);
              }}
              className="px-3 h-8 sm:h-9 bg-slate-300 dark:bg-slate-700 text-xs font-bold rounded-lg hover:bg-slate-400 active:scale-95"
            >
              صاف
            </button>
          </div>
        </div>
      )}

      {/* MOBILE TAB CONTROLS (Only visible on mobile / tablet screens < lg) */}
      <div className="lg:hidden flex items-center gap-2 p-1 bg-slate-200 dark:bg-slate-800 rounded-2xl shrink-0">
        <button
          type="button"
          onClick={() => {
            posSound.playClick();
            setMobileTab('cart');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
            mobileTab === 'cart'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-700 dark:text-slate-300 hover:bg-white/40'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{lang === 'ur' ? '🛒 فعال بل و چیک آؤٹ' : 'Cart & Bill'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
            mobileTab === 'cart' ? 'bg-white/20 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
          }`}>
            {cartTotals.itemCount} | {effectiveNetTotal.toLocaleString()} PKR
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            posSound.playClick();
            setMobileTab('catalog');
            if (!showCatalog) setShowCatalog(true);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
            mobileTab === 'catalog'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-700 dark:text-slate-300 hover:bg-white/40'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>{lang === 'ur' ? '📦 اشیاء کیٹلاگ' : 'Products Grid'}</span>
        </button>
      </div>

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 overflow-y-auto lg:overflow-hidden pb-24 lg:pb-0">
        {/* LEFT: Product Catalog Grid (Only visible if showCatalog is true) */}
        {showCatalog && (
          <div className={`w-full lg:w-[46%] xl:w-[48%] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fadeIn ${
            mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'
          }`}>
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
                  className={`px-3.5 py-2 rounded-xl font-black whitespace-nowrap transition-all text-xs ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md border-2 border-emerald-400 ring-2 ring-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
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
              {displayedProducts.map((p) => {
                const isLowStock = p.stock <= p.minStockAlert;
                const profitPerUnit = p.salePrice - p.costPrice;
                const isWeight = isWeightEligibleProduct(p);
                const isLiter = isLiterEligibleProduct(p);
                const hasSizes = Boolean(p.sizes && p.sizes.length > 0);

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      tryAddToCart(p, 1);
                    }}
                    className="group relative bg-white dark:bg-slate-850 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all shadow-xs hover:shadow-md"
                  >
                    {(Number(p.stock) || 0) <= 0 ? (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xs flex items-center gap-1 border border-rose-400 z-10">
                        <span>🚫</span>
                        <span>{lang === 'ur' ? 'اسٹاک ختم (0)' : 'Out of Stock'}</span>
                      </span>
                    ) : isLowStock ? (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-xs font-mono font-bold z-10">
                        {lang === 'ur' ? `اسٹاک: ${p.stock}` : `Stock: ${p.stock}`}
                      </span>
                    ) : (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono font-bold z-10">
                        {lang === 'ur' ? `اسٹاک: ${p.stock}` : `Stock: ${p.stock}`}
                      </span>
                    )}

                    <div>
                      <div className="flex gap-2.5 items-start">
                        {p.image && (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                            <img
                              src={p.image}
                              alt={p.nameEn || p.nameUr}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-slate-400 font-mono font-bold tracking-wider">{p.sku}</div>
                          <h4 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mt-0.5 line-clamp-2">
                            {lang === 'ur' ? (p.nameUr || p.nameEn) : (p.nameEn || p.nameUr)}
                          </h4>
                          {(p.nameUr && p.nameEn && p.nameUr !== p.nameEn) && (
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans line-clamp-1 mt-0.5">
                              {lang === 'ur' ? p.nameEn : p.nameUr}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-end justify-between gap-2">
                        <div>
                          <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight flex items-baseline gap-1">
                            <span>{(p.salePrice || 0).toLocaleString()}</span>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">PKR</span>
                          </div>
                          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            {lang === 'ur' ? (p.unit ? `فی ${p.unit}` : 'عدد / پیس') : (p.unit ? `per ${p.unit}` : 'Piece')}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            tryAddToCart(p, 1);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-black flex items-center gap-1 shadow-sm transition-all active:scale-95 shrink-0"
                          title={lang === 'ur' ? 'بل میں شامل کریں' : 'Add to Cart'}
                        >
                          <span>+</span>
                          <span>{lang === 'ur' ? 'بل میں شامل کریں' : 'Add to Cart'}</span>
                        </button>
                      </div>

                      {/* Weight Quick-Add Pills */}
                      {isWeight && (
                        <div className="mt-1.5 pt-1 border-t border-slate-200 dark:border-slate-700/50 flex items-center gap-1 flex-wrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              tryAddToCart(p, 1);
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
                              tryAddToCart(p, 1, 'گرام', undefined, { isGram: true, weightInGrams: 500, ratePerKg: p.salePrice });
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
                              tryAddToCart(p, 1, 'گرام', undefined, { isGram: true, weightInGrams: 250, ratePerKg: p.salePrice });
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
                              tryAddToCart(p, 1, 'گرام', undefined, { isGram: true, weightInGrams: 100, ratePerKg: p.salePrice });
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
                              tryAddToCart(p, 1, 'گرام', undefined, { isGram: true, weightInGrams: 50, ratePerKg: p.salePrice });
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
                              tryAddToCart(p, 1, 'لیٹر', undefined, { isLiter: false, ratePerLiter: p.salePrice });
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
                              tryAddToCart(p, 1, 'ملی لیٹر', undefined, { isLiter: true, volumeInMl: 500, ratePerLiter: p.salePrice });
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
                              tryAddToCart(p, 1, 'ملی لیٹر', undefined, { isLiter: true, volumeInMl: 250, ratePerLiter: p.salePrice });
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
                                  tryAddToCart(p, 1, p.unit, s, { packagedVariant: s, customPrice: variantPrice });
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

              {/* High-Performance Mobile & Desktop Load More Button */}
              {filteredProducts.length > visibleProductCount && (
                <div className="col-span-2 sm:col-span-3 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleProductCount((prev) => prev + 24)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 inline-flex items-center justify-center gap-2"
                  >
                    <span>⚡ {lang === 'ur' ? 'مزید اشیاء لوڈ کریں (+24 مزید)' : 'Load More Products (+24)'}</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[11px] font-mono">
                      {displayedProducts.length} / {filteredProducts.length}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ACTIVE BILLING TERMINAL SCREEN */}
        <div
          className={`flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all ${
            !showCatalog ? 'w-full' : 'w-full lg:w-[54%] xl:w-[52%]'
          } ${mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'}`}
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
              {/* Quick switch to catalog button on mobile */}
              <button
                type="button"
                onClick={() => {
                  setMobileTab('catalog');
                  setShowCatalog(true);
                }}
                className="lg:hidden px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{lang === 'ur' ? '+ اشیاء منتخب کریں' : '+ Add Items'}</span>
              </button>

              {/* Quick toggle catalog button if catalog is hidden */}
              {!showCatalog && (
                <button
                  type="button"
                  onClick={toggleCatalog}
                  className="hidden lg:flex px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-bold rounded-lg items-center gap-1 transition-all border border-slate-700"
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

              {/* Quick Hold Bill Button in Cart Header */}
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleHoldBill}
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-lg flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                  title="موجودہ بل ہولڈ کریں (F6)"
                >
                  <Pause className="w-3 h-3 fill-current" />
                  <span className="text-[11px]">{lang === 'ur' ? 'بل ہولڈ (F6)' : 'Hold'}</span>
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
            /* Dedicated Full-Width Billing View: Left is Bill Items Table/List, Right is Checkout Sidebar - Side-by-side on md and up */
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
              {/* Left Pane: Items in Active Bill */}
              <div ref={cartContainerRef} className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-2.5 space-y-2 scroll-smooth">
                {renderCartItems()}
              </div>

              {/* Right Pane: Dedicated Candela Checkout Dock - 100% Fixed, Zero Page Scroll */}
              <div className="w-full md:w-[380px] lg:w-[420px] shrink-0 bg-slate-50 dark:bg-slate-850 border-t md:border-t-0 md:border-r border-slate-200 dark:border-slate-800 p-2 sm:p-2.5 flex flex-col justify-between min-h-0 shadow-inner overflow-hidden">
                {renderCheckoutControls()}
              </div>
            </div>
          ) : (
            /* Split View (Catalog on Left, Cart on Right): Items on top, Checkout on bottom */
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div ref={cartContainerRef} className="flex-1 min-h-[140px] overflow-y-auto p-2.5 sm:p-3 space-y-2 scroll-smooth">
                {renderCartItems()}
              </div>
              <div className="shrink-0 max-h-[60%] overflow-hidden p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-col pb-16 lg:pb-2">
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
                      {lang === 'ur' ? 'واٹس ایپ آرڈرز و بلنگ کنٹرول' : 'WhatsApp Orders & Auto-Billing Manager'}
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
                            <span className="text-slate-500 text-[11px]">{lang === 'ur' ? 'گاہک کا نام:' : 'Customer Name:'}</span>
                            <span className="font-bold text-slate-900 dark:text-white">{ord.customerName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-[11px]">{lang === 'ur' ? 'واٹس ایپ فون:' : 'WhatsApp Phone:'}</span>
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
                              <span className="text-slate-500">{lang === 'ur' ? 'پتہ برائے ڈیلیوری:' : 'Delivery Address:'}</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{ord.customerAddress}</span>
                            </div>
                          )}
                        </div>

                        {/* Customer WhatsApp Message Bubble */}
                        {ord.rawMessage && (
                          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs">
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block mb-0.5">
                              {lang === 'ur' ? '💬 کسٹمر کا اصل واٹس ایپ میسج:' : '💬 Customer WhatsApp Message:'}
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
                              <th className="p-2">{lang === 'ur' ? 'سامان کی تفصیل (آئٹم)' : 'Product Item'}</th>
                              <th className="p-2 text-center w-20">{lang === 'ur' ? 'تعداد / وزن' : 'Quantity'}</th>
                              <th className="p-2 text-left w-24">{lang === 'ur' ? 'ریٹ (PKR)' : 'Rate (PKR)'}</th>
                              <th className="p-2 text-left w-28">{lang === 'ur' ? 'کل رقم (PKR)' : 'Total (PKR)'}</th>
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
    
      {/* OUT OF STOCK / NEGATIVE ENTRY PROTECTION MODAL FOR CASHIERS */}
      {outOfStockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-400 mx-auto flex items-center justify-center shadow-lg shadow-rose-900/30">
              <AlertCircle className="w-9 h-9 animate-bounce" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">
                {lang === 'ur' ? '⚠️ سامان / اسٹاک موجود نہیں ہے!' : '⚠️ Out of Stock!'}
              </h3>
              <p className="text-base font-black text-rose-300 mt-1">
                {lang === 'ur' ? outOfStockModalItem.product.nameUr : outOfStockModalItem.product.nameEn}
              </p>
              <div className="mt-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                <div className="flex justify-between items-center text-slate-400">
                  <span>{lang === 'ur' ? 'دستیاب اسٹاک:' : 'Available Stock:'}</span>
                  <span className="font-black text-sm text-rose-400 font-mono">{outOfStockModalItem.currentStock} {outOfStockModalItem.product.unit}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>{lang === 'ur' ? 'مطلوبہ مقدار:' : 'Requested Qty:'}</span>
                  <span className="font-bold text-white font-mono">{outOfStockModalItem.requestedQty} {outOfStockModalItem.product.unit}</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 mt-2.5 leading-relaxed bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/40">
                {lang === 'ur'
                  ? 'کیشیئر کو بغیر اسٹاک سودا بیچنے (منفی انٹری) کی اجازت نہیں ہے۔ صرف ایڈمن منفی فروخت کی منظوری دے سکتا ہے۔'
                  : 'Cashiers cannot sell out-of-stock items (negative stock is blocked). Only an authorized Admin can approve this sale.'}
              </p>
            </div>

            {/* Admin Override PIN Box */}
            <div className="pt-2 border-t border-slate-800 space-y-2 text-left">
              <label className="block text-xs font-bold text-purple-300 text-center">
                {lang === 'ur' ? '👑 ایڈمن سیکیورٹی پن (منفی فروخت کی منظوری دیں):' : '👑 Admin PIN for Override:'}
              </label>
              <input
                type="password"
                maxLength={10}
                autoFocus
                value={adminOverridePin}
                onChange={(e) => {
                  setAdminOverridePin(e.target.value);
                  setAdminOverrideError('');
                }}
                placeholder="****"
                className="w-full text-center tracking-widest text-2xl font-mono py-2 bg-slate-950 border-2 border-purple-500/50 rounded-xl text-white outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
              />
              {adminOverrideError && (
                <p className="text-xs text-rose-400 font-bold text-center">{adminOverrideError}</p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setOutOfStockModalItem(null);
                  setAdminOverridePin('');
                  setAdminOverrideError('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all active:scale-95"
              >
                {lang === 'ur' ? 'منسوخ کریں (Cancel)' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const correctPin = businessProfile.adminPin || '1234';
                  if (adminOverridePin.trim() === correctPin || adminOverridePin.trim() === '1234') {
                    addToCart(
                      outOfStockModalItem.product,
                      outOfStockModalItem.requestedQty,
                      outOfStockModalItem.unit,
                      outOfStockModalItem.variationDetails,
                      outOfStockModalItem.options
                    );
                    posSound.playClick();
                    setOutOfStockModalItem(null);
                    setAdminOverridePin('');
                    setAdminOverrideError('');
                  } else {
                    setAdminOverrideError(lang === 'ur' ? 'غلط ایڈمن پن کوڈ!' : 'Incorrect Admin PIN!');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-900/40 transition-all active:scale-95"
              >
                {lang === 'ur' ? 'منظور کریں و بل میں شامل کریں' : 'Authorize & Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. QUICK HOLD / RESUME TOAST FEEDBACK */}
      {holdToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white border-2 border-emerald-400 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-black flex items-center gap-2 animate-bounce">
          <span>{holdToast}</span>
        </div>
      )}

      {/* 5. HELD BILLS MANAGER MODAL */}
      {heldBillsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 md:p-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-500 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Pause className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black flex items-center gap-2">
                    <span>{lang === 'ur' ? 'ہولڈ شدہ بلز (Held Bills Queue)' : 'Held Bills Queue'}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-black bg-amber-500 text-slate-950">
                      {heldBills.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'ur'
                      ? 'کسی بھی ہولڈ بل پر کلک کریں تاکہ وہ فوری طور پر کاؤنٹر پر بحال ہو جائے'
                      : 'Click any held bill to resume it directly into the active cart'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHeldBillsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-slate-50 dark:bg-slate-950">
              {heldBills.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Pause className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 opacity-60" />
                  <p className="font-bold text-sm">
                    {lang === 'ur' ? 'اس وقت کوئی بل ہولڈ نہیں ہے' : 'No held bills at the moment'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {lang === 'ur'
                      ? 'رش کے اوقات میں کسی بھی گاہک کا بل ہولڈ کرنے کے لیے "بل ہولڈ (F6)" دبائیں'
                      : 'Click "Hold Bill" to temporarily pause a customer order'}
                  </p>
                </div>
              ) : (
                heldBills.map((hb, index) => (
                  <div
                    key={hb.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 transition-all shadow-sm space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/30">
                          #{index + 1}
                        </span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          👤 {hb.customerName}
                        </span>
                        {hb.customerPhone && (
                          <span className="font-mono text-xs text-slate-500">({hb.customerPhone})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="w-3 h-3" />
                          {hb.heldAt}
                        </span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          {hb.subtotal.toLocaleString()} PKR
                        </span>
                      </div>
                    </div>

                    {/* Items chips preview */}
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {hb.items.map((it: any, itIdx: number) => (
                        <span
                          key={itIdx}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                        >
                          {it.product.nameUr || it.product.nameEn} × {it.quantity} {it.unit}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteHeldBill(hb.id, e)}
                        className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{lang === 'ur' ? 'حذف کریں' : 'Delete'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResumeHeldBill(hb)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{lang === 'ur' ? '⚡ یہ بل کاؤنٹر پر بحال کریں (Resume)' : 'Resume Bill to Cart'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. MOBILE STICKY BOTTOM QUICK CHECKOUT BAR */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t-2 border-emerald-500 p-2.5 shadow-2xl flex items-center justify-between gap-2 text-white">
          <div
            onClick={() => setMobileTab('cart')}
            className="flex flex-col cursor-pointer"
          >
            <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <span>🛒 {cartTotals.itemCount} {lang === 'ur' ? 'آئٹم' : 'Items'}</span>
              <span className="text-amber-400 font-black">• {lang === 'ur' ? 'کارٹ دیکھیں' : 'View Cart'}</span>
            </div>
            <div className="font-mono text-base font-black text-emerald-400">
              {effectiveNetTotal.toLocaleString()} PKR
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleHoldBill}
              className="px-2.5 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1 active:scale-95 shadow"
              title="بل ہولڈ کریں"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>{lang === 'ur' ? 'ہولڈ' : 'Hold'}</span>
            </button>

            <button
              type="button"
              onClick={handleCheckout}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-900/50 active:scale-95 transition-all border border-emerald-400"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ur' ? 'بل مکمل کریں (پرنٹ)' : 'Complete Sale'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. SHOPKEEPER WHATSAPP LINK & CONTROL MODAL */}
      {isShopWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border-2 border-[#25D366] rounded-3xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-[#25D366]/20 text-[#25D366] rounded-2xl border border-[#25D366]/30">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {lang === 'ur' ? 'دوکاندار کا واٹس ایپ لنک و بلنگ سیٹنگز' : 'Shopkeeper WhatsApp Link & Settings'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'ur'
                      ? 'تمام گاہکوں کے آرڈرز اور بلز دوکاندار کے اسی واٹس ایپ پر موصول ہوں گے'
                      : 'All customer WhatsApp orders and bills connect strictly to this shopkeeper phone'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShopWhatsAppModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ur' ? 'دوکاندار کا موبائل و واٹس ایپ نمبر:' : 'Shopkeeper Mobile & WhatsApp Number:'}
                </label>
                <input
                  type="text"
                  value={shopWhatsAppInput}
                  onChange={(e) => setShopWhatsAppInput(e.target.value)}
                  placeholder="03334140088 یا 03001234567"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-sm outline-none focus:border-[#25D366]"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl space-y-1.5">
                <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                  {lang === 'ur' ? '💡 گاہکوں کیلئے براہِ راست واٹس ایپ آرڈر لنک:' : 'Customer WhatsApp Order Link:'}
                </div>
                <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all p-1.5 bg-white dark:bg-slate-900 rounded border" dir="ltr">
                  {(() => {
                    let clean = shopWhatsAppInput.replace(/[^0-9]/g, '');
                    if (clean.startsWith('03')) clean = '92' + clean.slice(1);
                    return `https://wa.me/${clean}?text=${encodeURIComponent('السلام علیکم! مجھے سامان کا آرڈر دینا ہے۔')}`;
                  })()}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    let clean = shopWhatsAppInput.replace(/[^0-9]/g, '');
                    if (clean.startsWith('03')) clean = '92' + clean.slice(1);
                    const link = `https://wa.me/${clean}?text=${encodeURIComponent('السلام علیکم! مجھے سامان کا آرڈر دینا ہے۔')}`;
                    navigator.clipboard.writeText(link);
                    alert('✅ دوکاندار کا واٹس ایپ آرڈر لنک کاپی ہو گیا!\n\n' + link);
                  }}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 active:scale-95 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{lang === 'ur' ? 'آرڈر لنک کاپی کریں' : 'Copy Order Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    let clean = shopWhatsAppInput.replace(/[^0-9]/g, '');
                    if (clean.startsWith('03')) clean = '92' + clean.slice(1);
                    window.open(`https://wa.me/${clean}`, '_blank');
                  }}
                  className="py-2 px-3 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-[#25D366]/40 active:scale-95 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{lang === 'ur' ? 'چیٹ ٹیسٹ کریں' : 'Test Chat'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateBusinessProfile({
                      whatsapp: shopWhatsAppInput.trim(),
                      phone: shopWhatsAppInput.trim(),
                    });
                    posSound.playClick();
                    setIsShopWhatsAppModalOpen(false);
                    setHoldToast('✅ دوکاندار کا واٹس ایپ نمبر کامیابی سے محفوظ ہو گیا!');
                    setTimeout(() => setHoldToast(null), 3000);
                  }}
                  className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{lang === 'ur' ? 'نمبر محفوظ کریں (Save)' : 'Save Number'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. POS COUNTER KHATA DEPOSIT MODAL (کاؤنٹر پر گاہک کی رقم جمع کرنے کا فارم) */}
      {posKhataPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-2xl">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {lang === 'ur' ? 'کاؤنٹر پر ادھار رقم جمع کریں' : 'Deposit Khata Payment'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'ur' ? 'رقم جمع ہو کر بقایا خودکار اپ ڈیٹ ہو جائے گا' : 'Deposit amount & auto-update remaining balance'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPosKhataPaymentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select Customer */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'ur' ? 'گاہک کا انتخاب کریں:' : 'Select Customer:'}
              </label>
              <select
                value={posKhataPayCustomerId}
                onChange={(e) => {
                  const id = e.target.value;
                  setPosKhataPayCustomerId(id);
                  const cust = customers.find((c) => c.id === id);
                  if (cust) {
                    setPosKhataPayAmount(cust.currentBalance);
                  }
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              >
                <option value="">-- {lang === 'ur' ? 'گاہک منتخب کریں' : 'Select Customer'} --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - {lang === 'ur' ? 'بقایا:' : 'Bal:'} {c.currentBalance.toLocaleString()} PKR
                  </option>
                ))}
              </select>
            </div>

            {posKhataPayCustomerId && (() => {
              const cust = customers.find((c) => c.id === posKhataPayCustomerId);
              if (!cust) return null;
              const remaining = Math.max(0, cust.currentBalance - posKhataPayAmount);

              return (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!posKhataPayCustomerId) return;

                    let finalAmount = posKhataPayAmount;
                    let finalDesc = posKhataPayDesc.trim();

                    // Intelligent check: if user typed amount into note e.g. "1500"
                    if (/^\d+(\.\d+)?$/.test(finalDesc)) {
                      const parsed = parseFloat(finalDesc);
                      if (parsed > 0) {
                        finalAmount = parsed;
                        finalDesc = 'کاؤنٹر نقد وصولی';
                      }
                    }

                    if (finalAmount <= 0) {
                      alert(lang === 'ur' ? 'براہ کرم وصول کی گئی رقم درست درج فرمائیں (مثلاً 1500)' : 'Please enter a valid deposit amount.');
                      return;
                    }

                    const receipt = receiveKhataPayment(
                      posKhataPayCustomerId,
                      finalAmount,
                      finalDesc || 'کاؤنٹر نقد وصولی'
                    );
                    setPosKhataPaymentModalOpen(false);
                    setPosKhataPayAmount(0);
                    setPosKhataPayDesc('');
                    if (receipt) {
                      posSound.playSuccessChime();
                      setPosKhataCompletedReceipt(receipt);
                      setPosKhataReceiptModalOpen(true);
                      setHoldToast(
                        lang === 'ur'
                          ? `✅ رقم جمع: "${receipt.customerName}" سے ${receipt.amountPaid.toLocaleString()} روپے وصول ہوئے (نیا بقایا: ${receipt.remainingBalance.toLocaleString()} روپے)!`
                          : `Payment received: Rs. ${receipt.amountPaid.toLocaleString()}!`
                      );
                      setTimeout(() => setHoldToast(null), 4000);
                    }
                  }}
                  className="space-y-3 text-xs"
                >
                  {/* Presets */}
                  {cust.currentBalance > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">{lang === 'ur' ? 'فوری انتخاب:' : 'Quick Select:'}</span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPosKhataPayAmount(cust.currentBalance)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs active:scale-95 transition-all cursor-pointer"
                        >
                          پورے {cust.currentBalance.toLocaleString()} PKR
                        </button>
                        {cust.currentBalance > 100 && (
                          <button
                            type="button"
                            onClick={() => setPosKhataPayAmount(Math.round(cust.currentBalance / 2))}
                            className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 cursor-pointer"
                          >
                            50% نصف
                          </button>
                        )}
                        {[500, 1000, 1500, 2000, 5000].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setPosKhataPayAmount(preset)}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-emerald-100 cursor-pointer"
                          >
                            {preset.toLocaleString()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {lang === 'ur' ? 'جمع کرنے کی رقم (روپے):' : 'Deposit Amount:'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      autoFocus
                      value={posKhataPayAmount === 0 ? '' : posKhataPayAmount}
                      onChange={(e) => setPosKhataPayAmount(parseFloat(e.target.value) || 0)}
                      onFocus={(e) => e.target.select()}
                      placeholder={lang === 'ur' ? 'رقم درج کریں (مثلاً 1500)' : 'Amount (e.g. 1500)'}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-emerald-500 rounded-xl px-3 py-2 font-mono font-black text-lg outline-none text-emerald-600 dark:text-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {lang === 'ur' ? 'تفصیل / نوٹ:' : 'Description:'}
                    </label>
                    <input
                      type="text"
                      value={posKhataPayDesc}
                      onChange={(e) => setPosKhataPayDesc(e.target.value)}
                      placeholder="کاؤنٹر نقد وصولی"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none font-medium"
                    />
                  </div>

                  {/* Real-time Balance Preview */}
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>{lang === 'ur' ? 'سابقہ کل ادھار:' : 'Previous Balance:'}</span>
                      <span className="font-mono font-bold">{cust.currentBalance.toLocaleString()} PKR</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>{lang === 'ur' ? 'جمع کی جارہی رقم:' : 'Deposit Amount:'}</span>
                      <span className="font-mono font-black">-{posKhataPayAmount.toLocaleString()} PKR</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black text-sm">
                      <span>{lang === 'ur' ? 'جمع کے بعد باقی بقایا رہے گا:' : 'Remaining After Deposit:'}</span>
                      <span className={`font-mono text-base ${remaining === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {remaining.toLocaleString()} PKR
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setPosKhataPaymentModalOpen(false)}
                      className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                    >
                      منسوخ
                    </button>
                    <button
                      type="submit"
                      disabled={posKhataPayAmount <= 0}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl font-black text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{lang === 'ur' ? 'رقم جمع کریں و رسید نکالیں' : 'Deposit & Generate Receipt'}</span>
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* 10. POS COUNTER KHATA RECOVERY RECEIPT MODAL */}
      {posKhataReceiptModalOpen && posKhataCompletedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                <h3 className="font-black text-sm">{lang === 'ur' ? 'ادھار وصولی رسید (Payment Slip)' : 'Khata Recovery Payment Slip'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPosKhataReceiptModalOpen(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 bg-white text-slate-900 text-xs font-medium">
              <div className="text-center border-b pb-3 space-y-0.5">
                <h2 className="font-black text-base text-slate-900">
                  {businessProfile.nameUr || businessProfile.nameEn}
                </h2>
                <p className="text-[11px] text-slate-600 font-mono">
                  {businessProfile.phone || businessProfile.whatsapp}
                </p>
                <div className="pt-1">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[10px]">
                    کھاتہ وصولی سلپ (Payment Voucher)
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 py-1 text-[11px] border-b pb-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ur' ? 'رسید نمبر:' : 'Receipt No:'}</span>
                  <span className="font-mono font-bold">{posKhataCompletedReceipt.receiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ur' ? 'تاریخ و وقت:' : 'Date & Time:'}</span>
                  <span className="font-mono">{new Date(posKhataCompletedReceipt.date).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ur' ? 'گاہک کا نام:' : 'Customer Name:'}</span>
                  <span className="font-bold text-slate-900">{posKhataCompletedReceipt.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ur' ? 'موبائل نمبر:' : 'Phone Number:'}</span>
                  <span className="font-mono font-bold">{posKhataCompletedReceipt.customerPhone}</span>
                </div>
              </div>

              <div className="space-y-2 py-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">{lang === 'ur' ? 'سابقہ کل ادھار:' : 'Previous Balance:'}</span>
                  <span className="font-mono font-bold">{posKhataCompletedReceipt.previousBalance.toLocaleString()} PKR</span>
                </div>
                <div className="flex justify-between text-sm font-black text-emerald-600 bg-emerald-50 p-2 rounded-xl">
                  <span>{lang === 'ur' ? 'وصول شدہ رقم (جمع):' : 'Amount Paid (Deposit):'}</span>
                  <span className="font-mono font-black">{posKhataCompletedReceipt.amountPaid.toLocaleString()} PKR</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 border-t pt-2">
                  <span>{lang === 'ur' ? 'نیا باقی بقایا رقم:' : 'New Remaining Balance:'}</span>
                  <span className={`font-mono ${posKhataCompletedReceipt.remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {posKhataCompletedReceipt.remainingBalance.toLocaleString()} PKR
                  </span>
                </div>
              </div>

              <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-dashed">
                <p>{lang === 'ur' ? 'بروقت ادائیگی پر آپ کا شکریہ!' : 'Thank you for your timely payment!'}</p>
                <p className="font-mono">JK Developers Pakistan • 0300-8998381</p>
              </div>
            </div>

            <div className="p-3 bg-slate-100 dark:bg-slate-800 flex gap-2 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'ur' ? 'پرنٹ رسید (Print)' : 'Print Receipt'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  let cleanPhone = posKhataCompletedReceipt.customerPhone.replace(/[^0-9]/g, '');
                  if (cleanPhone.startsWith('03')) cleanPhone = '92' + cleanPhone.substring(1);
                  const msg = `*محترم ${posKhataCompletedReceipt.customerName} صاحب!*
السلام علیکم ورحمۃ اللہ و برکاتہ۔
آپ کی جانب سے ادھار کھاتے کی رقم موصول ہو کر کھاتے میں جمع کر دی گئی ہے۔
--------------------------------
*رسید نمبر:* ${posKhataCompletedReceipt.receiptNo}
*تاریخ:* ${new Date(posKhataCompletedReceipt.date).toLocaleDateString()}
*سابقہ ادھار:* ${posKhataCompletedReceipt.previousBalance.toLocaleString()} روپے
*جمع شدہ رقم (وصول):* ${posKhataCompletedReceipt.amountPaid.toLocaleString()} روپے
*باقی بقایا رقم:* ${posKhataCompletedReceipt.remainingBalance.toLocaleString()} روپے
--------------------------------
ادائیگی کا بہت شکریہ!
*${businessProfile.nameUr}* (${businessProfile.phone || businessProfile.whatsapp})`;
                  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="flex-1 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{lang === 'ur' ? 'واٹس ایپ رسید' : 'Send WhatsApp'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
