'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Printer,
  FileText,
  RotateCcw,
  Banknote,
  Package,
  Lock,
  ArrowUpRight,
  UserCheck,
  Settings,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Plus,
  Save,
  Check,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { useLanguage } from '@/context/LanguageContext';
import { AuditLog, Product, BusinessPresetType } from '@/types';
import { posSound } from '@/lib/sound';

export const AuditView: React.FC = () => {
  const { auditLogs, businessProfile, products, saveProduct, invoices, addAuditLog, activePreset } = useShop();
  const { lang } = useLanguage();

  // Active Audit Module Tab: 'stock_audit' or 'system_logs'
  const [activeAuditTab, setActiveAuditTab] = useState<'stock_audit' | 'system_logs'>('stock_audit');

  // Stock Audit State
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockFilterPreset, setStockFilterPreset] = useState<string>('all');
  const [onlyZeroStock, setOnlyZeroStock] = useState<boolean>(false);
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number | string>>({});
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);
  const [bulkSavedSuccess, setBulkSavedSuccess] = useState<boolean>(false);

  // System Logs State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // 1. Overall Calculations for the KPI Summary Boxes (باکسز)
  const totalStockCount = useMemo(() => {
    return products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  }, [products]);

  const totalCatalogItems = products.length;

  const totalCostValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (Number(p.stock) || 0) * (Number(p.costPrice) || 0), 0);
  }, [products]);

  const totalSaleValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (Number(p.stock) || 0) * (Number(p.salePrice) || 0), 0);
  }, [products]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayInvoices = useMemo(() => {
    return invoices.filter((inv) => (inv.date || '').startsWith(todayStr));
  }, [invoices, todayStr]);

  const todaySalesTotal = useMemo(() => {
    return todayInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
  }, [todayInvoices]);

  const zeroStockItemsCount = useMemo(() => {
    return products.filter((p) => (Number(p.stock) || 0) === 0).length;
  }, [products]);

  // 2. Filter Products for Stock Audit Table
  const filteredAuditProducts = useMemo(() => {
    return products.filter((p) => {
      const matchPreset = stockFilterPreset === 'all' || p.preset === stockFilterPreset;
      const matchZero = !onlyZeroStock || (Number(p.stock) || 0) === 0;
      const q = stockSearchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (p.nameUr || '').toLowerCase().includes(q) ||
        (p.nameEn || '').toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.categoryUr || '').toLowerCase().includes(q);

      return matchPreset && matchZero && matchSearch;
    });
  }, [products, stockFilterPreset, onlyZeroStock, stockSearchQuery]);

  // 3. Filter System Activity Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchAction = selectedAction === 'ALL' || log.action === selectedAction;
      const matchDate = !selectedDate || log.timestamp.startsWith(selectedDate);
      const matchSearch =
        !searchQuery ||
        (log.details || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.refId && (log.refId || '').toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.role || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchAction && matchDate && matchSearch;
    });
  }, [auditLogs, selectedAction, selectedDate, searchQuery]);

  // 4. Handle Individual Product Stock Save
  const handleSaveIndividualStock = (product: Product) => {
    const enteredValue = physicalCounts[product.id];
    const newStock = enteredValue !== undefined && enteredValue !== '' ? Number(enteredValue) : product.stock;

    if (isNaN(newStock) || newStock < 0) {
      alert(lang === 'ur' ? 'براہ کرم درست اسٹاک تعداد درج کریں!' : 'Please enter valid stock number!');
      return;
    }

    const previousStock = product.stock || 0;
    saveProduct({
      ...product,
      stock: newStock,
    });

    addAuditLog(
      'STOCK_UPDATED',
      `اسٹاک آڈٹ انٹری: ${product.nameUr} کا اسٹاک ${previousStock} سے تبدیل کر کے ${newStock} ${product.unit} درج کیا گیا۔`,
      newStock,
      product.barcode
    );

    posSound.playScanBeep();
    setSavedSuccessId(product.id);
    setTimeout(() => {
      setSavedSuccessId(null);
    }, 2500);
  };

  // 5. Handle Bulk Save All Modified Counts
  const handleSaveAllModifiedCounts = () => {
    const keys = Object.keys(physicalCounts);
    if (keys.length === 0) {
      alert(lang === 'ur' ? 'آپ نے کسی آئٹم کا نیا اسٹاک درج نہیں کیا!' : 'No new physical counts entered!');
      return;
    }

    let updatedCount = 0;
    keys.forEach((id) => {
      const val = physicalCounts[id];
      if (val !== undefined && val !== '') {
        const num = Number(val);
        if (!isNaN(num) && num >= 0) {
          const prod = products.find((p) => p.id === id);
          if (prod) {
            saveProduct({
              ...prod,
              stock: num,
            });
            updatedCount++;
          }
        }
      }
    });

    addAuditLog(
      'STOCK_UPDATED',
      `بلک فزیکل اسٹاک آڈٹ: دکان کے ${updatedCount} پروڈکٹس کا اصل اسٹاک ڈیٹا بیس میں محفوظ کیا گیا۔`,
      updatedCount
    );

    posSound.playSuccessChime();
    setBulkSavedSuccess(true);
    setPhysicalCounts({});
    setTimeout(() => {
      setBulkSavedSuccess(false);
    }, 3500);
  };

  // 6. Reset all stock to 0
  const handleResetAllToZero = () => {
    if (
      confirm(
        lang === 'ur'
          ? 'کیا آپ واقعی تمام اشیاء کا اسٹاک صفر (0) کرنا چاہتے ہیں تاکہ نئی شاپ کا ڈیٹا نئے سرے سے انٹر ہو سکے؟'
          : 'Are you sure you want to reset all product stock to 0 for a clean new start?'
      )
    ) {
      products.forEach((p) => {
        saveProduct({ ...p, stock: 0 });
      });
      addAuditLog('STOCK_UPDATED', 'ایڈمن نے سسٹم میں تمام پروڈکٹس کا اسٹاک 0 (صفر) پر سیٹ کر دیا۔');
      posSound.playScanBeep();
      alert(lang === 'ur' ? '✅ تمام اشیاء کا اسٹاک کامیابی سے صفر (0) کر دیا گیا ہے!' : 'All stock reset to 0!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'SALE_CREATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <FileText className="w-3.5 h-3.5" />
            {lang === 'ur' ? 'بل کا اندراج' : 'Sale Created'}
          </span>
        );
      case 'SALE_RETURN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <RotateCcw className="w-3.5 h-3.5" />
            {lang === 'ur' ? 'مال واپسی' : 'Sale Return'}
          </span>
        );
      case 'KHATA_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <Banknote className="w-3.5 h-3.5" />
            {lang === 'ur' ? 'کھاتہ وصولی' : 'Khata Payment'}
          </span>
        );
      case 'EXPENSE_RECORDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {lang === 'ur' ? 'روزنامچہ خرچ' : 'Expense Added'}
          </span>
        );
      case 'STOCK_UPDATED':
      case 'STOCK_ADDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
            <Package className="w-3.5 h-3.5" />
            {lang === 'ur' ? 'سٹاک آڈٹ / ترمیم' : 'Stock Edit'}
          </span>
        );
      case 'SETTINGS_CHANGED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
            <Settings className="w-3.5 h-3.5" />
            {lang === 'ur' ? 'سیٹنگز تبدیل' : 'Settings'}
          </span>
        );
      case 'LOGIN_ADMIN':
      case 'LOGIN_MANAGER':
      case 'CASHIER_ACCESS_GRANTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
            <Lock className="w-3.5 h-3.5" />
            {lang === 'ur' ? 'سیکیورٹی / لاگ ان' : 'Security Log'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="p-3 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* 1. TOP HEADER & MAIN MODULE TABS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-md shadow-indigo-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {lang === 'ur' ? 'اسٹاک فزیکل آڈٹ و سسٹم لاگز' : 'Stock Physical Audit & System Logs'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-mono">
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'ur'
                ? 'تمام اشیاء کا ڈیٹا موجود ہے، فزیکل اسٹاک درج کریں، سیل و فروخت کی مالیات چیک کریں'
                : 'All products cataloged with zero initial stock. Enter physical inventory and inspect audit trail.'}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-850 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 no-print">
          <button
            onClick={() => setActiveAuditTab('stock_audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeAuditTab === 'stock_audit'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>{lang === 'ur' ? '📦 اسٹاک فزیکل آڈٹ (Stock Audit)' : 'Stock Audit'}</span>
          </button>

          <button
            onClick={() => setActiveAuditTab('system_logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeAuditTab === 'system_logs'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>{lang === 'ur' ? '🛡️ سسٹم ایکٹیویٹی لاگ (Activity Trail)' : 'System Trail'}</span>
          </button>
        </div>
      </div>

      {/* 2. ALL KPI SUMMARY BOXES (تمام طرح کے باکسز: اسٹاک، سیل، فروخت، آڈٹ، انوینٹری) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 no-print">
        {/* BOX 1: STOCK BOX (اسٹاک باکس) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {lang === 'ur' ? '📦 موجودہ کل اسٹاک' : 'Total Shop Stock'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white block">
              {totalStockCount.toLocaleString()}
            </span>
            <span className="text-[10.5px] font-bold text-slate-400 mt-0.5 block">
              {totalStockCount === 0
                ? (lang === 'ur' ? 'صفر (0) - صارف اپنا اسٹاک داخل کرے' : 'Zero (Ready for input)')
                : (lang === 'ur' ? 'یونٹس گودام / شاپ میں موجود' : 'Units available in shop')}
            </span>
          </div>
        </div>

        {/* BOX 2: CATALOG DATA BOX (ڈیٹا انٹری آئٹمز) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {lang === 'ur' ? '🏷️ کل ڈیٹا انٹری اشیاء' : 'Catalog Ready'}
            </span>
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 block">
              {totalCatalogItems}
            </span>
            <span className="text-[10.5px] font-bold text-slate-400 mt-0.5 block">
              {lang === 'ur' ? 'کریانہ، جنرل، سویٹس، گارمنٹس' : 'All 4 business categories ready'}
            </span>
          </div>
        </div>

        {/* BOX 3: SALES / REVENUE BOX (سیل و فروخت باکس) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {lang === 'ur' ? '💰 آج کی کل سیل / فروخت' : 'Today Sales'}
            </span>
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 block">
              Rs. {todaySalesTotal.toLocaleString()}
            </span>
            <span className="text-[10.5px] font-bold text-slate-400 mt-0.5 block">
              {todayInvoices.length} {lang === 'ur' ? 'بلز جاری ہوئے' : 'Invoices checked out'}
            </span>
          </div>
        </div>

        {/* BOX 4: STOCK INVENTORY VALUE (اسٹاک لاگت مالیت) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-purple-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {lang === 'ur' ? '🏬 اسٹاک مالیت (خریداری)' : 'Stock Cost Valuation'}
            </span>
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400 block">
              Rs. {totalCostValue.toLocaleString()}
            </span>
            <span className="text-[10.5px] font-bold text-slate-400 mt-0.5 block">
              {lang === 'ur' ? 'اسٹاک داخل کرنے پر بڑھے گی' : 'Calculated at wholesale cost'}
            </span>
          </div>
        </div>

        {/* BOX 5: AUDIT STATUS (آڈٹ اسٹیٹس باکس) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {lang === 'ur' ? '🛡️ آڈٹ کاؤنٹ باکس' : 'Audit Progress'}
            </span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 block">
              {totalCatalogItems - zeroStockItemsCount} / {totalCatalogItems}
            </span>
            <span className="text-[10.5px] font-bold text-slate-400 mt-0.5 block">
              {zeroStockItemsCount} {lang === 'ur' ? 'اشیاء کا اسٹاک صفر (0) ہے' : 'Items with zero stock'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. TAB 1: STOCK PHYSICAL AUDIT VIEW (اسٹاک فزیکل آڈٹ و گنتی) */}
      {activeAuditTab === 'stock_audit' && (
        <div className="space-y-4">
          {/* Action Notification Banner */}
          {bulkSavedSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-emerald-900/30 animate-in fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>{lang === 'ur' ? '✅ تمام فزیکل اسٹاک انٹریز ڈیٹا بیس میں کامیابی سے محفوظ ہو گئیں!' : 'All physical counts successfully saved!'}</span>
              </span>
              <span className="font-mono text-[11px] bg-emerald-700 px-2 py-0.5 rounded-lg">UPDATED</span>
            </div>
          )}

          {/* Controls Bar: Search, Category Filter, Zero Filter, Bulk Buttons */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs no-print">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                  placeholder={lang === 'ur' ? 'پروڈکٹ کا نام، بارکوڈ یا کیٹیگری تلاش کریں...' : 'Search item name, barcode, category...'}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-xs font-medium"
                />
              </div>

              {/* Category Preset Filter */}
              <select
                value={stockFilterPreset}
                onChange={(e) => setStockFilterPreset(e.target.value)}
                className="bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-xs outline-none"
              >
                <option value="all">{lang === 'ur' ? '✨ تمام شعبہ جات (All Categories)' : '✨ All Categories'}</option>
                <option value="karyana">🌾 {lang === 'ur' ? 'کریانہ و اجناس (Karyana)' : 'Karyana Commodities'}</option>
                <option value="general_store">🛒 {lang === 'ur' ? 'جنرل سٹور و صابن (General Store)' : 'General Store'}</option>
                <option value="sweets">🍰 {lang === 'ur' ? 'سویٹس اینڈ بیکرز (Sweets & Bakers)' : 'Sweets & Bakers'}</option>
                <option value="garments">👔 {lang === 'ur' ? 'گارمنٹس و کلاتھنگ (Garments)' : 'Garments'}</option>
                <option value="confectionery">🍬 {lang === 'ur' ? 'کنفیکشنری و کینڈی (Confectionery)' : 'Confectionery'}</option>
                <option value="restaurant">🍽️ {lang === 'ur' ? 'ریسٹورنٹ و فاسٹ فوڈ (Restaurant)' : 'Restaurant'}</option>
              </select>

              {/* Zero Stock Only Filter Toggle */}
              <button
                type="button"
                onClick={() => setOnlyZeroStock(!onlyZeroStock)}
                className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all border ${
                  onlyZeroStock
                    ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{lang === 'ur' ? 'صرف صفر (0) اسٹاک والی اشیاء' : 'Zero Stock Items Only'}</span>
              </button>
            </div>

            {/* Action Buttons: Save Bulk, Print Sheet, Reset Stock */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSaveAllModifiedCounts}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                title="تمام درج شدہ فزیکل اسٹاک کو ایک ساتھ محفوظ کریں"
              >
                <Save className="w-4 h-4" />
                <span>{lang === 'ur' ? 'تمام فزیکل اسٹاک محفوظ کریں' : 'Save All Counts'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-slate-700 shadow-sm active:scale-95 transition-all"
                title="دکان پر فزیکل کاؤنٹنگ کے لیے شیٹ پرنٹ کریں"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'ur' ? 'آڈٹ شیٹ پرنٹ' : 'Print Sheet'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetAllToZero}
                className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 hover:bg-rose-100 rounded-xl font-bold text-xs flex items-center gap-1 border border-rose-200 dark:border-rose-900 transition-all"
                title="تمام اشیاء کا اسٹاک 0 کریں"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{lang === 'ur' ? 'تمام اسٹاک صفر (0) کریں' : 'Reset All to 0'}</span>
              </button>
            </div>
          </div>

          {/* Printable Header */}
          <div className="hidden print:block p-4 border-b-2 border-slate-900 text-center mb-4">
            <h2 className="text-2xl font-black">{businessProfile.nameUr || businessProfile.nameEn}</h2>
            <p className="text-xs font-bold text-slate-600 mt-1">
              اسٹاک فزیکل آڈٹ و شمار شیٹ (Stock Audit & Verification Count Sheet) • تاریخ: {new Date().toLocaleDateString('ur-PK')}
            </p>
          </div>

          {/* Stock Audit Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-black">
                  <tr>
                    <th className="p-3 text-center">#</th>
                    <th className="p-3">پروڈکٹ کا نام و تفصیل</th>
                    <th className="p-3">بارکوڈ / SKU</th>
                    <th className="p-3">کیٹیگری</th>
                    <th className="p-3 text-center">قیمت خرید</th>
                    <th className="p-3 text-center">قیمت فروخت</th>
                    <th className="p-3 text-center bg-slate-100 dark:bg-slate-800/80 font-black text-slate-900 dark:text-white">
                      سسٹم اسٹاک (موجودہ)
                    </th>
                    <th className="p-3 text-center bg-indigo-50 dark:bg-indigo-950/40 font-black text-indigo-700 dark:text-indigo-300">
                      دکان کا اصل اسٹاک درج کریں (Physical Count)
                    </th>
                    <th className="p-3 text-center no-print">کارروائی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredAuditProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        کوئی پروڈکٹ نہیں ملی۔ سرچ یا فلٹر تبدیل کریں۔
                      </td>
                    </tr>
                  ) : (
                    filteredAuditProducts.map((p, idx) => {
                      const isZero = (Number(p.stock) || 0) === 0;
                      const enteredVal = physicalCounts[p.id];
                      const isRecentlySaved = savedSuccessId === p.id;

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors"
                        >
                          <td className="p-3 text-center text-slate-400 font-mono font-bold text-[11px]">
                            {idx + 1}
                          </td>

                          {/* Name */}
                          <td className="p-3">
                            <div className="font-bold text-slate-900 dark:text-white text-xs md:text-sm">
                              {p.nameUr}
                            </div>
                            <div className="text-[10.5px] text-slate-400 font-sans">
                              {p.nameEn}
                            </div>
                          </td>

                          {/* Barcode */}
                          <td className="p-3 font-mono text-[11px] text-slate-500">
                            <div>{p.barcode}</div>
                            <div className="text-[9.5px] text-slate-400 font-sans">{p.sku}</div>
                          </td>

                          {/* Category */}
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {p.categoryUr}
                            </span>
                          </td>

                          {/* Cost */}
                          <td className="p-3 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                            Rs. {p.costPrice}
                          </td>

                          {/* Sale */}
                          <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            Rs. {p.salePrice}
                          </td>

                          {/* Current System Stock (واضح طور پر لکھا ہوا کہ اسٹاک صفر ہے یا موجود ہے) */}
                          <td className="p-3 text-center bg-slate-50/60 dark:bg-slate-850/40">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-mono font-black border ${
                                isZero
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              }`}
                            >
                              <span>{p.stock}</span>
                              <span className="text-[10px] font-sans font-bold">{p.unit}</span>
                              {isZero && <span className="text-[9px] font-sans font-black">(صفر)</span>}
                            </span>
                          </td>

                          {/* Physical Count Entry Box (صارف اپنا اسٹاک یہاں درج کرے گا) */}
                          <td className="p-3 text-center bg-indigo-50/30 dark:bg-indigo-950/20">
                            <div className="inline-flex items-center gap-1.5 justify-center">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={enteredVal !== undefined ? enteredVal : ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPhysicalCounts((prev) => ({
                                    ...prev,
                                    [p.id]: val,
                                  }));
                                }}
                                placeholder={`${p.stock}`}
                                className="w-24 text-center py-1.5 px-2 bg-white dark:bg-slate-800 border-2 border-indigo-300 dark:border-indigo-700 rounded-xl font-mono text-xs md:text-sm font-bold text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                              />
                              <span className="text-[11px] font-bold text-slate-500">{p.unit}</span>
                            </div>
                          </td>

                          {/* Action Button */}
                          <td className="p-3 text-center no-print">
                            {isRecentlySaved ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs">
                                <Check className="w-3.5 h-3.5" />
                                <span>محفوظ</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSaveIndividualStock(p)}
                                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-xs active:scale-95"
                              >
                                {lang === 'ur' ? 'محفوظ کریں' : 'Save'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Footer Info */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500">
              <span className="font-bold">
                {lang === 'ur'
                  ? `مجموعی اشیاء: ${filteredAuditProducts.length} میں سے صفر اسٹاک والی اشیاء: ${
                      filteredAuditProducts.filter((x) => (Number(x.stock) || 0) === 0).length
                    }`
                  : `Showing ${filteredAuditProducts.length} items`}
              </span>
              <span className="font-mono text-[11px]">
                OneShop POS • Enterprise Bilingual Inventory Audit
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: SYSTEM ACTIVITY AUDIT TRAIL VIEW (سسٹم لاگ) */}
      {activeAuditTab === 'system_logs' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 no-print">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === 'ur' ? 'تلاش کریں (تفصیل، بل نمبر، رول)...' : 'Search details, invoice #, role...'}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Action Filter */}
              <div className="relative">
                <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  <option value="ALL">{lang === 'ur' ? 'تمام کارروائیاں (All Actions)' : 'All Actions'}</option>
                  <option value="SALE_CREATED">{lang === 'ur' ? 'فروخت کے بل (Sale Created)' : 'Sale Created'}</option>
                  <option value="SALE_RETURN">{lang === 'ur' ? 'مال واپسی (Sale Return)' : 'Sale Return'}</option>
                  <option value="KHATA_PAYMENT">{lang === 'ur' ? 'کھاتہ وصولی (Khata Payment)' : 'Khata Payment'}</option>
                  <option value="EXPENSE_RECORDED">{lang === 'ur' ? 'روزنامچہ خرچ (Expenses)' : 'Expenses'}</option>
                  <option value="STOCK_UPDATED">{lang === 'ur' ? 'سٹاک ترمیم و آڈٹ (Stock Audits)' : 'Stock Edits'}</option>
                  <option value="LOGIN_ADMIN">{lang === 'ur' ? 'ایڈمن لاگ ان (Admin Login)' : 'Admin Login'}</option>
                  <option value="CASHIER_ACCESS_GRANTED">{lang === 'ur' ? 'کیشیئر رول (Cashier Access)' : 'Cashier Access'}</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Clear Filter Tag */}
            {(selectedAction !== 'ALL' || selectedDate || searchQuery) && (
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-slate-500">{lang === 'ur' ? 'فلٹرز فعال ہیں:' : 'Active filters:'}</span>
                <button
                  onClick={() => {
                    setSelectedAction('ALL');
                    setSelectedDate('');
                    setSearchQuery('');
                  }}
                  className="text-emerald-600 hover:text-emerald-500 font-bold underline"
                >
                  {lang === 'ur' ? 'تمام فلٹرز ختم کریں' : 'Clear all filters'}
                </button>
              </div>
            )}
          </div>

          {/* Audit Log Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3.5">وقت و تاریخ</th>
                    <th className="p-3.5">کارروائی</th>
                    <th className="p-3.5">تفصیلات و ماڈیول</th>
                    <th className="p-3.5">رقم / ریفرنس</th>
                    <th className="p-3.5">صارف (رول)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        {lang === 'ur' ? 'کوئی آڈٹ ریکارڈ موجود نہیں ہے۔' : 'No audit records found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString(lang === 'ur' ? 'ur-PK' : 'en-US')}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">{getActionBadge(log.action)}</td>
                        <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200 max-w-md">
                          {log.details}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] whitespace-nowrap">
                          {log.amount !== undefined && (
                            <span className="font-bold text-slate-900 dark:text-white">
                              Rs. {log.amount.toLocaleString()}
                            </span>
                          )}
                          {log.refId && (
                            <span className="block text-slate-400 text-[10px]">
                              Ref: {log.refId}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              log.role === 'ADMIN' || log.role === 'MANAGER'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            <UserCheck className="w-3 h-3" />
                            {log.role === 'ADMIN' || log.role === 'MANAGER'
                              ? lang === 'ur'
                                ? 'ایڈمن'
                                : 'Admin'
                              : lang === 'ur'
                              ? 'کیشیئر'
                              : 'Cashier'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
