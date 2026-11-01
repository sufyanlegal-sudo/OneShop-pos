'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Barcode,
  Layers,
  ArrowRightLeft,
  Check,
  X,
  Copy,
  Banknote,
  Package,
  TrendingUp,
  Camera,
  QrCode,
  Scan,
  Zap,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { Product } from '@/types';
import { posSound } from '@/lib/sound';

export const InventoryView: React.FC = () => {
  const { lang, t } = useLanguage();
  const { products, saveProduct, deleteProduct, activePreset, currentRole, switchRole } = useShop();

  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Pagination State for 60fps Mobile Performance
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Scanner & Live Stock Taking States
  const [scannerInput, setScannerInput] = useState('');
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [quickStockDelta, setQuickStockDelta] = useState<number>(1);
  const [quickSetStock, setQuickSetStock] = useState<string>('');
  const [quickCostPrice, setQuickCostPrice] = useState<number>(0);
  const [quickSalePrice, setQuickSalePrice] = useState<number>(0);
  const [scanToast, setScanToast] = useState<{ message: string; type: 'success' | 'warn' } | null>(null);

  const scannerInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Edit/Add Modal (Local Manual Entry)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Reset pagination when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, lowStockOnly, pageSize]);

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const cat = lang === 'ur' ? (p.categoryUr || p.categoryEn) : (p.categoryEn || p.categoryUr);
      if (cat && cat.trim()) set.add(cat.trim());
    });
    return ['all', ...Array.from(set)];
  }, [products, lang]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const pCat = lang === 'ur' ? (p.categoryUr || p.categoryEn) : (p.categoryEn || p.categoryUr);
      const catMatch =
        filterCategory === 'all' ||
        pCat === filterCategory ||
        p.categoryUr === filterCategory ||
        p.categoryEn === filterCategory;

      const q = (searchQuery || '').toLowerCase().trim();
      const textMatch =
        !q ||
        (p.nameEn || '').toLowerCase().includes(q) ||
        (p.nameUr || '').toLowerCase().includes(q) ||
        (p.barcode || '').includes(q) ||
        (p.sku || '').toLowerCase().includes(q);

      const stockMatch = !lowStockOnly || p.stock <= p.minStockAlert;

      return catMatch && textMatch && stockMatch;
    });
  }, [products, filterCategory, searchQuery, lowStockOnly, lang]);

  // Paginated Products (Renders 25-50 rows max to make mobile 100% smooth)
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Process Scanned Code (Works for Barcode, QR Code & SKU)
  const handleProcessScan = (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase() === code.toLowerCase()) ||
        p.id === code ||
        (p.barcode && code.includes(p.barcode))
    );

    if (matched) {
      posSound.playScanBeep();
      if (continuousMode) {
        // Continuous Fast Scan Mode: auto-increment +1 stock
        const newStock = (Number(matched.stock) || 0) + 1;
        saveProduct({
          ...matched,
          stock: newStock,
        });
        setScanToast({
          message:
            lang === 'ur'
              ? `✓ "${matched.nameUr}" اسٹاک +1 کر دیا گیا! نیا کل اسٹاک: ${newStock}`
              : `✓ "${matched.nameEn}" stock +1! Total: ${newStock}`,
          type: 'success',
        });
        setTimeout(() => setScanToast(null), 3000);
      } else {
        // Detailed Quick Stock & Price Update Modal
        setScannedProduct(matched);
        setQuickStockDelta(1);
        setQuickSetStock(String(matched.stock || 0));
        setQuickCostPrice(matched.costPrice || 0);
        setQuickSalePrice(matched.salePrice || 0);
      }
    } else {
      posSound.playErrorBuzz();
      setScanToast({
        message:
          lang === 'ur'
            ? `بارکوڈ یا کیو آر "${code}" سسٹم میں موجود نہیں ملا!`
            : `Barcode / QR "${code}" not found!`,
        type: 'warn',
      });
      setTimeout(() => setScanToast(null), 4000);

      const shouldCreate = confirm(
        lang === 'ur'
          ? `یہ بارکوڈ / کیو آر کوڈ (${code}) سسٹم میں موجود نہیں ہے۔ کیا آپ اس کوڈ کے ساتھ نیا پروڈکٹ ایڈ کرنا چاہتے ہیں؟`
          : `Code (${code}) not found in inventory. Do you want to add a new product with this code?`
      );
      if (shouldCreate) {
        setEditingProduct({
          preset: activePreset,
          barcode: code,
          sku: `SKU-${Date.now().toString().slice(-4)}`,
          nameEn: '',
          nameUr: '',
          categoryEn: 'General',
          categoryUr: 'عام اشیاء',
          unit: 'Piece',
          costPrice: 0,
          salePrice: 0,
          wholesaleRate: 0,
          stock: 1,
          minStockAlert: 5,
        });
        setModalOpen(true);
      }
    }
    setScannerInput('');
    scannerInputRef.current?.focus();
  };

  // Camera video stream life-cycle & live Barcode/QR detector
  useEffect(() => {
    let stream: MediaStream | null = null;
    let detectorInterval: any = null;

    if (cameraModalOpen && isCameraActive && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }

          if (typeof window !== 'undefined' && (window as any).BarcodeDetector) {
            try {
              const detector = new (window as any).BarcodeDetector({
                formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e'],
              });
              detectorInterval = setInterval(async () => {
                if (videoRef.current && videoRef.current.readyState >= 2) {
                  try {
                    const barcodes = await detector.detect(videoRef.current);
                    if (barcodes && barcodes.length > 0) {
                      const detected = barcodes[0].rawValue;
                      if (detected) {
                        handleProcessScan(detected);
                        if (!continuousMode) {
                          setIsCameraActive(false);
                          setCameraModalOpen(false);
                        }
                      }
                    }
                  } catch (e) {}
                }
              }, 400);
            } catch (e) {}
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
      if (detectorInterval) clearInterval(detectorInterval);
    };
  }, [cameraModalOpen, isCameraActive, continuousMode]);

  // Handle Quick Scanned Product Save
  const handleSaveScannedStock = () => {
    if (!scannedProduct) return;
    posSound.playSuccessChime();

    let finalStock = scannedProduct.stock;
    if (quickSetStock.trim() !== '') {
      const parsedSet = parseFloat(quickSetStock);
      if (!isNaN(parsedSet)) finalStock = parsedSet;
    } else {
      finalStock = (Number(scannedProduct.stock) || 0) + quickStockDelta;
    }

    saveProduct({
      ...scannedProduct,
      stock: finalStock,
      costPrice: quickCostPrice >= 0 ? quickCostPrice : scannedProduct.costPrice,
      salePrice: quickSalePrice > 0 ? quickSalePrice : scannedProduct.salePrice,
    });

    setScanToast({
      message:
        lang === 'ur'
          ? `✓ "${scannedProduct.nameUr}" کا اسٹاک اپ ڈیٹ ہو گیا! موجودہ اسٹاک: ${finalStock}`
          : `✓ "${scannedProduct.nameEn}" updated! Current Stock: ${finalStock}`,
      type: 'success',
    });
    setTimeout(() => setScanToast(null), 3500);

    setScannedProduct(null);
    scannerInputRef.current?.focus();
  };

  const handleOpenAdd = () => {
    setEditingProduct({
      preset: activePreset,
      barcode: Date.now().toString().slice(-12),
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      nameEn: '',
      nameUr: '',
      categoryEn: 'General',
      categoryUr: 'عام اشیاء',
      unit: 'Piece',
      costPrice: 0,
      salePrice: 0,
      wholesaleRate: 0,
      stock: 0,
      minStockAlert: 5,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct({ ...p });
    setModalOpen(true);
  };

  const handleDuplicate = (p: Product) => {
    setEditingProduct({
      ...p,
      id: undefined,
      barcode: Date.now().toString().slice(-12),
      sku: `${p.sku}-COPY`,
      nameEn: `${p.nameEn} (Copy)`,
      nameUr: `${p.nameUr} (کاپی)`,
    });
    setModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.nameUr || !editingProduct.nameEn) return;

    saveProduct(editingProduct as any);
    setModalOpen(false);
    setEditingProduct(null);
  };

  const totalStockCount = useMemo(() => {
    return products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  }, [products]);

  const totalCostValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (Number(p.stock) || 0) * (Number(p.costPrice) || 0), 0);
  }, [products]);

  const totalSaleValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (Number(p.stock) || 0) * (Number(p.salePrice) || 0), 0);
  }, [products]);

  const handleAdminPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = switchRole('ADMIN', adminPinInput);
    if (success) {
      posSound.playSuccessChime();
      setAdminPinInput('');
      setAdminPinError('');
    } else {
      posSound.playErrorBuzz();
      setAdminPinError(lang === 'ur' ? 'غلط ایڈمن پن کوڈ درج کیا گیا ہے!' : 'Incorrect Admin PIN!');
    }
  };

  // STRICT ACCESS CONTROL: Only ADMIN can access Barcode/QR Inventory Stock Intake!
  if (currentRole !== 'ADMIN') {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-5 animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border-2 border-amber-300 dark:border-amber-700 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {lang === 'ur' ? '🔒 ایڈمن سیکیورٹی لاک' : '🔒 Admin Security Lock'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-medium">
              {lang === 'ur'
                ? 'پروڈکٹ کے اوپر موجود بارکوڈ یا کیو آر کوڈ سے اسکین کر کے اسٹاک انٹری کرنے اور انوینٹری میں ترمیم کی مکمل اجازت صرف ایڈمن کے پاس ہے۔'
                : 'Scanning barcodes/QR codes for inventory intake and stock adjustments is strictly restricted to Admin.'}
            </p>
          </div>

          <form onSubmit={handleAdminPinSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5 text-center">
                {lang === 'ur' ? 'ایڈمن پن کوڈ درج کریں:' : 'Enter Admin PIN:'}
              </label>
              <input
                type="password"
                maxLength={6}
                value={adminPinInput}
                onChange={(e) => {
                  setAdminPinInput(e.target.value);
                  setAdminPinError('');
                }}
                placeholder="••••"
                className="w-48 mx-auto text-center font-mono text-2xl font-black tracking-widest py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 focus:border-emerald-500 rounded-2xl outline-none"
                autoFocus
              />
              {adminPinError && (
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-2">
                  {adminPinError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-emerald-700/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{lang === 'ur' ? 'ایڈمن تصدیق اور انوینٹری اسکینر کھولیں' : 'Verify Admin & Unlock Inventory'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 max-w-7xl mx-auto space-y-4">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-2xl">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {t('inventory')}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'ur'
                ? 'بارکوڈ و کیو آر کوڈ اسکیننگ، لوکل انٹری، خرید و فروخت ریٹس اور اسٹاک کنٹرول'
                : 'Barcode & QR Code Scanning, Local Entry, Cost/Sale rates & Stock Control'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCameraModalOpen(true);
              setIsCameraActive(true);
            }}
            className="px-3.5 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl text-xs md:text-sm font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>{lang === 'ur' ? 'کیمرہ اسکینر' : 'Camera Scan'}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs md:text-sm font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'ur' ? '+ نئی پروڈکٹ (لوکل انٹری)' : '+ Local New Item'}</span>
          </button>
        </div>
      </div>

      {/* 📷 UNIVERSAL BARCODE & QR SCANNER + FAST STOCK-TAKING TOOLBAR */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border-2 border-emerald-500/50 rounded-2xl p-3.5 sm:p-4 shadow-xl text-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-emerald-300">
                  {lang === 'ur' ? 'پروڈکٹ بارکوڈ و کیو آر کوڈ اسکیننگ انٹری' : 'Product Barcode & QR Code Stock Intake'}
                </h3>
                <span className="bg-emerald-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{lang === 'ur' ? 'ایڈمن ایکسس فعال' : 'Admin Access Active'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                {lang === 'ur'
                  ? 'پروڈکٹ کے ڈبے پر موجود بارکوڈ یا کیو آر کوڈ اسکین کریں اور فوری اسٹاک انٹری کریں'
                  : 'Scan the barcode or QR code on product packaging for instant stock intake'}
              </p>
            </div>
          </div>

          {/* Continuous Auto-Increment Mode Switch */}
          <button
            type="button"
            onClick={() => {
              setContinuousMode(!continuousMode);
              posSound.playClick();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
              continuousMode
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="ہر اسکین پر خودکار +1 اسٹاک میں اضافہ"
          >
            <Zap className={`w-3.5 h-3.5 ${continuousMode ? 'text-amber-300 fill-amber-300' : 'text-slate-400'}`} />
            <span>
              {lang === 'ur'
                ? (continuousMode ? '⚡ تیز رفتار اسکین موڈ فعال (+1 خودکار)' : '⚡ تیز رفتار موڈ: آف')
                : (continuousMode ? '⚡ Fast Scan Active (+1 auto)' : '⚡ Fast Scan: Off')}
            </span>
          </button>
        </div>

        {/* Scanner Form Input */}
        <div className="flex flex-wrap items-center gap-2.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleProcessScan(scannerInput);
            }}
            className="flex-1 min-w-[260px] relative"
          >
            <Barcode className="w-5 h-5 absolute left-3.5 top-3 text-emerald-400 pointer-events-none" />
            <input
              ref={scannerInputRef}
              type="text"
              value={scannerInput}
              onChange={(e) => setScannerInput(e.target.value)}
              placeholder={
                lang === 'ur'
                  ? '📷 بارکوڈ / کیو آر کوڈ اسکین کریں یا ٹائپ کریں (Enter دبائیں)...'
                  : 'Scan barcode or QR code with laser or type and press Enter...'
              }
              className="w-full pl-11 pr-24 py-2.5 bg-slate-850/90 border-2 border-emerald-500/50 focus:border-emerald-400 rounded-xl text-xs sm:text-sm font-mono font-bold text-white placeholder-slate-400 focus:ring-4 focus:ring-emerald-500/20 outline-none"
            />
            <button
              type="submit"
              disabled={!scannerInput.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-black transition-all"
            >
              {lang === 'ur' ? 'اسکین' : 'Scan'}
            </button>
          </form>
        </div>

        {/* Scan Toast Feedback Notification */}
        {scanToast && (
          <div
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${
              scanToast.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{scanToast.message}</span>
          </div>
        )}
      </div>

      {/* 4 KPI Summary Boxes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">{lang === 'ur' ? 'کل ڈیٹا انٹری اشیاء' : 'Total Items'}</span>
            <span className="text-base md:text-lg font-black font-mono text-slate-900 dark:text-white">{products.length} {lang === 'ur' ? 'اشیاء' : 'Items'}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">{lang === 'ur' ? 'موجودہ کل اسٹاک' : 'Total Stock'}</span>
            <span className="text-base md:text-lg font-black font-mono text-slate-900 dark:text-white">
              {totalStockCount.toLocaleString()} {lang === 'ur' ? (totalStockCount === 0 ? '(صفر)' : 'یونٹس') : 'Units'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">{lang === 'ur' ? 'اسٹاک مالیت (خرید)' : 'Stock Cost Value'}</span>
            <span className="text-base md:text-lg font-black font-mono text-purple-600 dark:text-purple-400">Rs. {totalCostValue.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">{lang === 'ur' ? 'متوقع فروخت / سیل' : 'Sale Value'}</span>
            <span className="text-base md:text-lg font-black font-mono text-amber-600 dark:text-amber-400">Rs. {totalSaleValue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchProductPlaceholder')}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 outline-none font-medium text-xs font-bold"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all'
                  ? (lang === 'ur' ? '✨ تمام اشیاء (All Products)' : '✨ All Products')
                  : c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            lowStockOnly
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{t('lowStockAlerts')}</span>
        </button>
      </div>

      {/* Products Table (Renders 25-50 paginated rows max for lightning mobile speed) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">SKU / بارکوڈ</th>
                <th className="p-3">نام و تفصیل</th>
                <th className="p-3">کیٹیگری</th>
                <th className="p-3 text-right">خرید قیمت</th>
                <th className="p-3 text-right">فروخت قیمت</th>
                <th className="p-3 text-right">ہول سیل ریٹ</th>
                <th className="p-3 text-center">موجودہ اسٹاک</th>
                <th className="p-3 text-center">ایکشن</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {paginatedProducts.map((p) => {
                const isLow = p.stock <= p.minStockAlert;
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3 font-mono">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{p.sku}</div>
                      <div className="text-[10px] text-slate-400">{p.barcode}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {p.nameEn}
                      </div>
                      <div className="font-nastaliq text-xs text-slate-700 dark:text-slate-300">
                        {p.nameUr}
                      </div>
                      {p.subUnit && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          1 {p.unit} = {p.conversionFactor} {p.subUnit}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500">
                      {lang === 'ur' ? p.categoryUr : p.categoryEn}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      <button
                        type="button"
                        onClick={() => {
                          const newCost = prompt(
                            lang === 'ur'
                              ? `خرید قیمت (Cost Price) تبدیل کریں (${p.nameUr}):`
                              : `Edit Cost Price for ${p.nameEn}:`,
                            p.costPrice.toString()
                          );
                          if (newCost !== null) {
                            const val = parseFloat(newCost);
                            if (!isNaN(val) && val >= 0) {
                              saveProduct({ ...p, costPrice: val });
                            }
                          }
                        }}
                        className="hover:text-emerald-600 hover:underline inline-flex items-center justify-end gap-1 font-mono group"
                        title={lang === 'ur' ? 'خرید قیمت تبدیل کرنے کے لیے کلک کریں' : 'Click to edit Cost Price'}
                      >
                        <span>{p.costPrice.toLocaleString()} PKR</span>
                        <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 opacity-60 group-hover:opacity-100" />
                      </button>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      <button
                        type="button"
                        onClick={() => {
                          const newSale = prompt(
                            lang === 'ur'
                              ? `فروخت قیمت (Sale Price) تبدیل کریں (${p.nameUr}):`
                              : `Edit Sale Price for ${p.nameEn}:`,
                            p.salePrice.toString()
                          );
                          if (newSale !== null) {
                            const val = parseFloat(newSale);
                            if (!isNaN(val) && val >= 0) {
                              saveProduct({ ...p, salePrice: val });
                            }
                          }
                        }}
                        className="hover:text-emerald-500 hover:underline inline-flex items-center justify-end gap-1 font-mono font-black group"
                        title={lang === 'ur' ? 'فروخت قیمت تبدیل کرنے کے لیے کلک کریں' : 'Click to edit Sale Price'}
                      >
                        <span>{p.salePrice.toLocaleString()} PKR</span>
                        <Edit2 className="w-3 h-3 text-emerald-500 opacity-60 group-hover:opacity-100" />
                      </button>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-300">
                      {(p.wholesaleRate || p.wholesalePrice || p.salePrice).toLocaleString()} PKR
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                          isLow
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 animate-pulse'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setScannedProduct(p);
                            setQuickStockDelta(1);
                            setQuickSetStock(String(p.stock || 0));
                            setQuickCostPrice(p.costPrice || 0);
                            setQuickSalePrice(p.salePrice || 0);
                          }}
                          className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] rounded-lg border border-emerald-200 dark:border-emerald-800 transition-all flex items-center gap-1 shadow-2xs"
                          title={lang === 'ur' ? 'اسٹاک و ریٹ ایڈٹ کریں' : 'Quick Stock & Price'}
                        >
                          <Scan className="w-3 h-3" />
                          <span>{lang === 'ur' ? 'اسٹاک' : 'Stock'}</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(p)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(lang === 'ur' ? 'کیا آپ اس آئٹم کو حذف کرنا چاہتے ہیں؟' : 'Delete item?')) {
                              deleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* High-Performance Mobile & Desktop Pagination Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
            <span>
              {lang === 'ur'
                ? `صفحہ ${currentPage} از ${totalPages} (کل ${filteredProducts.length.toLocaleString()} اشیاء)`
                : `Page ${currentPage} of ${totalPages} (${filteredProducts.length.toLocaleString()} total items)`}
            </span>
            <span className="mx-1">•</span>
            <span>{lang === 'ur' ? 'فی صفحہ:' : 'Per page:'}</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 outline-none font-bold"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>

          <div className="flex items-center gap-1 font-mono">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 📷 Live Camera Scanner Modal */}
      {cameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-500" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  {lang === 'ur' ? 'کیمرہ بارکوڈ و کیو آر اسکینر' : 'Live Camera Barcode / QR Scanner'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCameraActive(false);
                  setCameraModalOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500 bg-black aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-2 border-emerald-400/60 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="w-48 h-32 border-2 border-dashed border-emerald-400 rounded-lg animate-pulse" />
              </div>
            </div>

            <p className="text-xs text-center text-slate-500">
              {lang === 'ur'
                ? 'پروڈکٹ کے بارکوڈ یا کیو آر کوڈ کے سامنے کیمرہ رکھیں'
                : 'Point camera at product barcode or QR code'}
            </p>

            {/* Manual fallback input inside camera modal */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const code = (e.currentTarget.elements.namedItem('manualCode') as HTMLInputElement)?.value;
                if (code) {
                  handleProcessScan(code);
                  setIsCameraActive(false);
                  setCameraModalOpen(false);
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                name="manualCode"
                placeholder={lang === 'ur' ? 'یا کوڈ یہاں ٹائپ کریں...' : 'Or type code here...'}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black"
              >
                {lang === 'ur' ? 'داخل کریں' : 'Submit'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 📦 Quick Scanned Product Stock Adjustment Modal */}
      {scannedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                  <Scan className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {lang === 'ur' ? 'فوری اسٹاک انٹری (اسکین شدہ اشیاء)' : 'Quick Stock Intake (Scanned Product)'}
                  </h3>
                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {scannedProduct.sku} • {scannedProduct.barcode}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScannedProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Overview Card */}
            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750 flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  {lang === 'ur' ? scannedProduct.nameUr : scannedProduct.nameEn}
                </h4>
                <p className="text-xs text-slate-500 font-bold">
                  {lang === 'ur' ? scannedProduct.categoryUr : scannedProduct.categoryEn}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block">{lang === 'ur' ? 'موجودہ اسٹاک' : 'Current Stock'}</span>
                <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {scannedProduct.stock} {scannedProduct.unit}
                </span>
              </div>
            </div>

            {/* Stock Adjustment Controls */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'ur' ? 'کتنا اسٹاک شامل کرنا ہے؟ (+Add Quantity):' : 'Stock Quantity to Add:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={quickStockDelta}
                    onChange={(e) => {
                      setQuickStockDelta(parseFloat(e.target.value) || 0);
                      setQuickSetStock('');
                    }}
                    className="flex-1 bg-white dark:bg-slate-800 border-2 border-emerald-500 rounded-xl px-3 py-2 text-base font-mono font-black text-emerald-700 dark:text-emerald-300 outline-none"
                  />
                  <div className="flex gap-1">
                    {[1, 5, 10, 25, 50, 100].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setQuickStockDelta(num);
                          setQuickSetStock('');
                        }}
                        className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-mono font-bold transition-all"
                      >
                        +{num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Or Exact Set Stock */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  {lang === 'ur' ? 'یا نیا کل اسٹاک خود سیٹ کریں (Set Exact Total):' : 'Or set exact total stock count:'}
                </label>
                <input
                  type="number"
                  value={quickSetStock}
                  onChange={(e) => setQuickSetStock(e.target.value)}
                  placeholder={String((Number(scannedProduct.stock) || 0) + quickStockDelta)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none"
                />
              </div>

              {/* Quick Rate Edit */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">خرید قیمت (Cost Price):</label>
                  <input
                    type="number"
                    value={quickCostPrice}
                    onChange={(e) => setQuickCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block mb-1">فروخت قیمت (Sale Price):</label>
                  <input
                    type="number"
                    value={quickSalePrice}
                    onChange={(e) => setQuickSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-black text-emerald-700 dark:text-emerald-300 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setScannedProduct(null)}
                className="flex-1 py-2.5 bg-slate-150 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveScannedStock}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{lang === 'ur' ? 'اسٹاک محفوظ کریں ✓' : 'Save Stock Update ✓'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Product Modal */}
      {modalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl my-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingProduct.id
                ? lang === 'ur' ? 'پروڈکٹ میں ترمیم' : 'Edit Product'
                : lang === 'ur' ? 'نیا پروڈکٹ شامل کریں' : 'Add New Product'}
            </h3>

            <form onSubmit={handleSaveSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    نام (اردو نستعلیق)*:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.nameUr || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameUr: e.target.value })}
                    placeholder="مثلاً: سفید چینی اعلٰی کوالٹی"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-nastaliq text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Name (English)*:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.nameEn || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameEn: e.target.value })}
                    placeholder="e.g. Refined White Sugar"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-medium outline-none"
                  />
                </div>
              </div>

              {/* پورشن / کیٹیگری کا انتخاب (Category / Section) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    پورشن / کیٹیگری (Category / Portion)*:
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    اسی پورشن اور تمام اشیاء دونوں میں نظر آئے گا ✓
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    list="category-suggestions"
                    value={editingProduct.categoryUr || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingProduct({
                        ...editingProduct,
                        categoryUr: val,
                        categoryEn: val,
                      });
                    }}
                    placeholder="پورشن کا نام درج کریں یا نیچے سے منتخب کریں..."
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <datalist id="category-suggestions">
                    {categories
                      .filter((c) => c !== 'all')
                      .map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                  </datalist>
                </div>

                {/* Quick 1-Click Category Selection Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium">فوری پورشن منتخب کریں:</span>
                  {categories
                    .filter((c) => c !== 'all')
                    .map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() =>
                          setEditingProduct({
                            ...editingProduct,
                            categoryUr: cat,
                            categoryEn: cat,
                          })
                        }
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                          editingProduct.categoryUr === cat
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    SKU Code:
                  </label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Barcode:
                  </label>
                  <input
                    type="text"
                    value={editingProduct.barcode || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    بنیادی اکائی (Unit):
                  </label>
                  <input
                    type="text"
                    value={editingProduct.unit || 'Kg'}
                    onChange={(e) => {
                      const val = e.target.value;
                      const isWeight = val.toLowerCase() === 'kg' || val === 'کلو';
                      setEditingProduct({
                        ...editingProduct,
                        unit: val,
                        subUnit: isWeight && !editingProduct.subUnit ? 'Grams' : editingProduct.subUnit,
                        conversionFactor: isWeight && !editingProduct.conversionFactor ? 1000 : editingProduct.conversionFactor,
                      });
                    }}
                    placeholder="Kg / Piece / Carton"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none font-medium"
                  />
                  <div className="flex gap-1 mt-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingProduct({
                          ...editingProduct,
                          unit: 'Kg',
                          subUnit: 'Grams',
                          conversionFactor: 1000,
                        })
                      }
                      className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold"
                    >
                      وزن: Kg + Grams
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingProduct({
                          ...editingProduct,
                          unit: 'عدد',
                          subUnit: undefined,
                          conversionFactor: undefined,
                        })
                      }
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      عدد
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    ذیلی اکائی (Sub-Unit):
                  </label>
                  <input
                    type="text"
                    value={editingProduct.subUnit || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subUnit: e.target.value })}
                    placeholder="Grams / Piece / Pkt"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    تبدیلی تناسب (Factor):
                  </label>
                  <input
                    type="number"
                    value={editingProduct.conversionFactor || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        conversionFactor: parseFloat(e.target.value) || undefined,
                      })
                    }
                    placeholder="1000 / 24 / 12"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    خرید قیمت (Cost):
                  </label>
                  <input
                    type="number"
                    value={editingProduct.costPrice || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    فروخت قیمت (Sale):
                  </label>
                  <input
                    type="number"
                    value={editingProduct.salePrice || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, salePrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-emerald-600 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    ہول سیل ریٹ:
                  </label>
                  <input
                    type="number"
                    value={editingProduct.wholesaleRate || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        wholesaleRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    موجودہ اسٹاک تعداد:
                  </label>
                  <input
                    type="number"
                    value={editingProduct.stock !== undefined ? editingProduct.stock : 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stock: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-rose-500 block mb-1">
                    کم اسٹاک وارننگ لیول:
                  </label>
                  <input
                    type="number"
                    value={editingProduct.minStockAlert || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        minStockAlert: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
