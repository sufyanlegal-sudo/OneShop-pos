'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Printer,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Phone,
  Clock,
  ArrowRight,
  X,
  Share2,
  Repeat,
  Plus,
  Minus,
  Trash2,
  ArrowLeftRight,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { Invoice, SaleReturn, SaleExchange } from '@/types';
import { PrintReceiptModal } from '@/components/pos/PrintReceiptModal';

export const BillsHistoryView: React.FC = () => {
  const { lang, t } = useLanguage();
  const {
    invoices,
    processSaleReturn,
    processSaleExchange,
    allProducts,
    businessProfile,
    currentRole,
  } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [reprintModalOpen, setReprintModalOpen] = useState(false);

  // Return & Exchange Modal State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'RETURN' | 'EXCHANGE'>('RETURN');
  const [returnInvoice, setReturnInvoice] = useState<Invoice | null>(null);
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'KHATA_CREDIT'>('CASH');
  const [returnReason, setReturnReason] = useState('خراب مال / کسٹمر کی تبدیلی');

  // Exchange Specific State
  const [exchangeNewItems, setExchangeNewItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // Completed Confirmation State
  const [completedReturn, setCompletedReturn] = useState<SaleReturn | null>(null);
  const [completedExchange, setCompletedExchange] = useState<SaleExchange | null>(null);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (inv.invoiceNo || '').toLowerCase().includes(q) ||
        (inv.customerName || '').toLowerCase().includes(q) ||
        (inv.customerPhone && inv.customerPhone.includes(q));

      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'PENDING' && (inv.status === 'PENDING' || inv.balanceDue > 0)) ||
        (filterStatus === 'COMPLETED' && inv.status === 'COMPLETED' && inv.balanceDue === 0) ||
        inv.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchQuery, filterStatus]);

  // Calculations for Return & Exchange
  const totalReturnValue = useMemo(() => {
    if (!returnInvoice) return 0;
    return Object.entries(returnQtys).reduce((sum, [pid, qty]) => {
      const it = returnInvoice.items.find((item) => item.productId === pid);
      return sum + qty * (it?.unitPrice || 0);
    }, 0);
  }, [returnInvoice, returnQtys]);

  const totalNewValue = useMemo(() => {
    return exchangeNewItems.reduce((sum, ni) => {
      const p = allProducts.find((prod) => prod.id === ni.productId);
      return sum + ni.quantity * (p?.salePrice || 0);
    }, 0);
  }, [exchangeNewItems, allProducts]);

  const differenceAmount = totalNewValue - totalReturnValue;

  // Search replacement items
  const searchedProducts = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.toLowerCase().trim();
    return allProducts
      .filter(
        (p) =>
          p.nameUr.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.includes(q))
      )
      .slice(0, 8);
  }, [allProducts, productSearch]);

  const handleAddNewItemToExchange = (productId: string) => {
    const existing = exchangeNewItems.find((it) => it.productId === productId);
    if (existing) {
      setExchangeNewItems(
        exchangeNewItems.map((it) =>
          it.productId === productId ? { ...it, quantity: it.quantity + 1 } : it
        )
      );
    } else {
      setExchangeNewItems([...exchangeNewItems, { productId, quantity: 1 }]);
    }
    setProductSearch('');
  };

  const handleUpdateExchangeItemQty = (productId: string, delta: number) => {
    setExchangeNewItems(
      exchangeNewItems
        .map((it) => {
          if (it.productId === productId) {
            const newQty = it.quantity + delta;
            return newQty > 0 ? { ...it, quantity: newQty } : null;
          }
          return it;
        })
        .filter(Boolean) as { productId: string; quantity: number }[]
    );
  };

  const handleRemoveExchangeItem = (productId: string) => {
    setExchangeNewItems(exchangeNewItems.filter((it) => it.productId !== productId));
  };

  // Handle open return / exchange modal
  const handleOpenReturn = (inv: Invoice, mode: 'RETURN' | 'EXCHANGE' = 'RETURN') => {
    setReturnInvoice(inv);
    setModalMode(mode);
    setExchangeNewItems([]);
    setProductSearch('');
    // Default return qty to 0 for each item
    const initQtys: Record<string, number> = {};
    inv.items.forEach((it) => {
      initQtys[it.productId] = 0;
    });
    setReturnQtys(initQtys);
    setReturnReason(
      mode === 'EXCHANGE'
        ? 'مال کا تبادلہ / دوسری چیز کا انتخاب'
        : 'خراب مال / کسٹمر کی واپسی'
    );
    setReturnModalOpen(true);
  };

  // Submit Sale Return or Exchange
  const handleSubmitReturnOrExchange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnInvoice) return;

    const returnItems = Object.entries(returnQtys)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (modalMode === 'RETURN') {
      if (returnItems.length === 0) {
        alert(
          lang === 'ur'
            ? 'براہ کرم واپسی کے لیے کم از کم ایک آئٹم کی تعداد درج کریں!'
            : 'Please enter quantity to return!'
        );
        return;
      }

      const ret = processSaleReturn({
        invoiceId: returnInvoice.id,
        returnedItems: returnItems,
        refundMethod,
        reason: returnReason,
      });

      if (ret) {
        setCompletedReturn(ret);
        setReturnModalOpen(false);
      }
    } else {
      // EXCHANGE MODE
      if (returnItems.length === 0 && exchangeNewItems.length === 0) {
        alert(
          lang === 'ur'
            ? 'براہ کرم تبادلے کے لیے واپس ہونے والے اور نئے آئٹمز منتخب کریں!'
            : 'Please select items to return and new replacement items!'
        );
        return;
      }

      const exc = processSaleExchange({
        invoiceId: returnInvoice.id,
        invoiceNo: returnInvoice.invoiceNo,
        returnedItems: returnItems,
        newItems: exchangeNewItems,
        paymentMethod: refundMethod,
        reason: returnReason,
        customerId: returnInvoice.customerId,
        customerName: returnInvoice.customerName,
        customerPhone: returnInvoice.customerPhone,
      });

      if (exc) {
        setCompletedExchange(exc);
        setReturnModalOpen(false);
      }
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 rounded-2xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {t('billsHistory')}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'ur'
                ? 'تمام سابقہ بلوں کا ریکارڈ، دوبارہ پرنٹ، مال کی واپسی (Sales Return) اور کیش ریفنڈ'
                : 'Complete Invoices Archive, Duplicate Print, Sales Return & Cash Refund'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl font-mono font-bold text-slate-700 dark:text-slate-300">
            {lang === 'ur' ? 'کل بلز:' : 'Total Invoices:'} {invoices.length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ur' ? 'بل نمبر، گاہک کا نام یا فون تلاش کریں...' : 'Search by Invoice #, Customer or Phone...'}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {lang === 'ur' ? 'تمام' : 'All'}
          </button>
          <button
            onClick={() => setFilterStatus('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              filterStatus === 'COMPLETED'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {lang === 'ur' ? 'مکمل کیش' : 'Cash Bills'}
          </button>
          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              filterStatus === 'PENDING'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {lang === 'ur' ? '⏳ پینڈنگ ادھار' : 'Pending Udhaar'}
          </button>
          <button
            onClick={() => setFilterStatus('PARTIAL_RETURN')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              filterStatus === 'PARTIAL_RETURN'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {lang === 'ur' ? 'واپسی شدہ' : 'Returns'}
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">انوائس #</th>
                <th className="p-3">تاریخ و وقت</th>
                <th className="p-3">گاہک</th>
                <th className="p-3 text-center">آئٹمز</th>
                <th className="p-3 text-right">کل رقم</th>
                <th className="p-3 text-right">ادا شدہ</th>
                <th className="p-3 text-right">بقایا (ادھار)</th>
                <th className="p-3 text-center">حالت</th>
                <th className="p-3 text-center">ایکشن</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    {lang === 'ur' ? 'کوئی بل نہیں ملا' : 'No invoices found.'}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                      #{inv.invoiceNo}
                    </td>
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(inv.date).toLocaleDateString()} {new Date(inv.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {inv.customerName}
                      </div>
                      {inv.customerPhone && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {inv.customerPhone}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                        {inv.items.reduce((s, i) => s + i.quantity, 0)}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {inv.grandTotal.toLocaleString()} PKR
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {inv.paidAmount.toLocaleString()} PKR
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      {inv.balanceDue > 0 ? (
                        <span className="text-rose-600">{inv.balanceDue.toLocaleString()} PKR</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10.5px] font-bold ${
                          inv.balanceDue > 0 || inv.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200'
                            : inv.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {inv.balanceDue > 0 || inv.status === 'PENDING'
                          ? (lang === 'ur' ? '⏳ پینڈنگ ادھار' : 'Pending Udhaar')
                          : inv.status === 'COMPLETED'
                          ? (lang === 'ur' ? 'مکمل ادا شدہ' : 'Paid')
                          : (lang === 'ur' ? 'واپسی شدہ' : 'Returned')}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setReprintModalOpen(true);
                          }}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 text-slate-700 dark:text-slate-300 hover:text-emerald-700 rounded-lg font-bold flex items-center gap-1 text-[11px]"
                          title="Reprint Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{t('print')}</span>
                        </button>

                        <button
                          onClick={() => handleOpenReturn(inv, 'RETURN')}
                          className="px-2 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-lg font-bold flex items-center gap-1 text-[11px]"
                          title="مال کی واپسی و کیش ریفنڈ"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{lang === 'ur' ? 'واپسی' : 'Return'}</span>
                        </button>

                        <button
                          onClick={() => handleOpenReturn(inv, 'EXCHANGE')}
                          className="px-2 py-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-lg font-bold flex items-center gap-1 text-[11px]"
                          title="مال کا تبادلہ / ایکسچینج"
                        >
                          <Repeat className="w-3.5 h-3.5" />
                          <span>{lang === 'ur' ? 'ایکسچینج' : 'Exchange'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Return & Exchange Modal */}
      {returnModalOpen && returnInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-5 md:p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header & Mode Switcher */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  بل #{returnInvoice.invoiceNo}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  گاہک: {returnInvoice.customerName}
                </span>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setModalMode('RETURN')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                    modalMode === 'RETURN'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>🔄 صرف مال واپسی (Refund)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('EXCHANGE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                    modalMode === 'EXCHANGE'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>🔁 مال کا تبادلہ (Exchange)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturnOrExchange} className="space-y-4 text-xs">
              {/* SECTION 1: ITEMS TO RETURN FROM INVOICE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>1. واپس ہونے والی اشیاء منتخب کریں (Returned Items):</span>
                  </label>
                  <span className="text-[11px] font-mono font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-lg">
                    واپسی مالیت: {totalReturnValue.toLocaleString()} PKR
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {returnInvoice.items.map((item) => {
                    const maxReturnable = item.quantity - (item.returnedQuantity || 0);
                    const currentQty = returnQtys[item.productId] || 0;
                    return (
                      <div
                        key={item.productId}
                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          currentQty > 0
                            ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                            : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {lang === 'ur' ? item.nameUr : item.nameEn}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            ریٹ: {item.unitPrice} PKR | خریدی گئی: {item.quantity}{' '}
                            {item.returnedQuantity ? `(سابقہ واپس: ${item.returnedQuantity})` : ''}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] text-slate-500 font-bold whitespace-nowrap">
                            واپسی:
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const val = Math.max(0, currentQty - 1);
                                setReturnQtys({ ...returnQtys, [item.productId]: val });
                              }}
                              className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              max={maxReturnable}
                              value={currentQty}
                              onChange={(e) => {
                                const val = Math.min(
                                  maxReturnable,
                                  Math.max(0, parseInt(e.target.value) || 0)
                                );
                                setReturnQtys({ ...returnQtys, [item.productId]: val });
                              }}
                              className="w-12 text-center font-mono font-bold text-rose-600 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded py-0.5 outline-none text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const val = Math.min(maxReturnable, currentQty + 1);
                                setReturnQtys({ ...returnQtys, [item.productId]: val });
                              }}
                              className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setReturnQtys({ ...returnQtys, [item.productId]: maxReturnable })
                            }
                            className="text-[9px] font-bold text-slate-400 hover:text-slate-600 underline"
                          >
                            مکمل
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: NEW REPLACEMENT ITEMS (ONLY IN EXCHANGE MODE) */}
              {modalMode === 'EXCHANGE' && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                      <span>2. نیا متبادل سامان منتخب کریں (New Replacement Items):</span>
                    </label>
                    <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg">
                      نئی اشیاء کی رقم: {totalNewValue.toLocaleString()} PKR
                    </span>
                  </div>

                  {/* Search Bar for Replacement Items */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="نئی پروڈکٹ تلاش کریں (نام، بارکوڈ یا SKU درج کریں)..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-medium"
                    />

                    {/* Instant Search Results Dropdown */}
                    {searchedProducts.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {searchedProducts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleAddNewItemToExchange(p.id)}
                            className="w-full p-2.5 flex items-center justify-between text-right hover:bg-blue-50 dark:hover:bg-slate-800 transition-all text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {lang === 'ur' ? p.nameUr : p.nameEn}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                کوڈ: {p.sku} | موجود اسٹاک: {p.stock} {p.unit}
                              </div>
                            </div>
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                              {p.salePrice.toLocaleString()} PKR +
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Replacement Items List */}
                  {exchangeNewItems.length > 0 ? (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {exchangeNewItems.map((item) => {
                        const p = allProducts.find((prod) => prod.id === item.productId);
                        if (!p) return null;
                        const subtotal = item.quantity * p.salePrice;
                        return (
                          <div
                            key={item.productId}
                            className="p-2 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white truncate">
                                {lang === 'ur' ? p.nameUr : p.nameEn}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                ریٹ: {p.salePrice} PKR | کل: {subtotal.toLocaleString()} PKR
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateExchangeItemQty(item.productId, -1)}
                                className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold text-xs px-1.5">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateExchangeItemQty(item.productId, 1)}
                                className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveExchangeItem(item.productId)}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-slate-400 bg-slate-50 dark:bg-slate-850 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-[11px]">
                      گاہک جو متبادل چیزیں لینا چاہتا ہے، اوپر سرچ بار میں نام لکھ کر منتخب کریں۔
                    </div>
                  )}

                  {/* EXCHANGE DIFFERENCE & SETTLEMENT CARD */}
                  <div className="p-3 rounded-xl border space-y-2 bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 dark:from-slate-850 dark:to-slate-850 border-blue-200 dark:border-blue-900">
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>تبادلے کے فرق کا خلاصہ (Exchange Balance):</span>
                      <span className="font-mono text-sm font-black">
                        {differenceAmount > 0
                          ? `+${differenceAmount.toLocaleString()} PKR (اضافی لینا ہے)`
                          : differenceAmount < 0
                          ? `-${Math.abs(differenceAmount).toLocaleString()} PKR (واپس کرنا ہے)`
                          : '0 PKR (برابر تبادلہ)'}
                      </span>
                    </div>

                    {differenceAmount > 0 && (
                      <div className="p-2.5 rounded-lg bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center justify-between">
                        <span>نئی اشیاء کی رقم زیادہ ہے۔ گاہک مزید رقم ادا کرے گا:</span>
                        <span className="font-mono font-black text-sm">
                          {differenceAmount.toLocaleString()} PKR
                        </span>
                      </div>
                    )}

                    {differenceAmount < 0 && (
                      <div className="p-2.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                        <span>واپس شدہ سامان کی رقم زیادہ ہے۔ دکان دار بقایا ریفنڈ کرے گا:</span>
                        <span className="font-mono font-black text-sm">
                          {Math.abs(differenceAmount).toLocaleString()} PKR
                        </span>
                      </div>
                    )}

                    {differenceAmount === 0 && (
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold text-center">
                        ✓ برابر کا تبادلہ ہے، کوئی اضافی رقم لین دین نہیں ہوگی۔
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PAYMENT / REFUND METHOD SELECTION */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {modalMode === 'RETURN'
                    ? 'ریفنڈ کی ادائیگی کا طریقہ:'
                    : differenceAmount > 0
                    ? 'اضافی رقم وصولی کا طریقہ:'
                    : 'بقایا رقم واپس کرنے کا طریقہ:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRefundMethod('CASH')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 ${
                      refundMethod === 'CASH'
                        ? modalMode === 'EXCHANGE'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>نقد کیش (Cash)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundMethod('KHATA_CREDIT')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 ${
                      refundMethod === 'KHATA_CREDIT'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>کسٹمر کھاتہ (Khata)</span>
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {modalMode === 'RETURN' ? 'واپسی کی وجہ:' : 'تبادلے کی وجہ:'}
                </label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-1.5 transition-all ${
                    modalMode === 'EXCHANGE'
                      ? 'bg-blue-600 hover:bg-blue-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {modalMode === 'EXCHANGE' ? (
                    <>
                      <Repeat className="w-4 h-4" />
                      <span>ایکسچینج مکمل کریں</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>واپسی مکمل کریں</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETED RETURN CONFIRMATION */}
      {completedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {lang === 'ur' ? 'مال کی واپسی کامیاب ہو گئی!' : 'Return Processed Successfully!'}
            </h3>
            <p className="text-xs text-slate-500">
              واپسی نمبر: <span className="font-mono font-bold">#{completedReturn.returnNo}</span>
              <br />
              کل ریفنڈ رقم:{' '}
              <span className="font-mono font-bold text-rose-600">
                {completedReturn.totalRefund.toLocaleString()} PKR
              </span>
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">
              اسٹاک میں اشیاء خودکار طور پر واپس جمع کر دی گئی ہیں اور روزنامچہ اپڈیٹ ہو گیا ہے۔
            </p>
            <button
              onClick={() => setCompletedReturn(null)}
              className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {/* COMPLETED EXCHANGE CONFIRMATION & RECEIPT */}
      {completedExchange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 my-8 text-xs">
            {/* Header */}
            <div className="text-center space-y-1 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 mx-auto flex items-center justify-center mb-1">
                <Repeat className="w-6 h-6" />
              </div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                رسید تبادلہ مال (Exchange Receipt)
              </h3>
              <p className="text-[11px] font-mono text-slate-500">
                #{completedExchange.exchangeNo} • {new Date(completedExchange.date).toLocaleDateString('ur-PK')}
              </p>
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                گاہک: {completedExchange.customerName}
              </p>
            </div>

            {/* Returned Items */}
            {completedExchange.returnedItems.length > 0 && (
              <div className="space-y-1">
                <div className="font-black text-[11px] text-rose-600 flex items-center justify-between">
                  <span>← واپس شدہ اشیاء (Returned Items):</span>
                  <span>{completedExchange.totalReturnValue.toLocaleString()} PKR</span>
                </div>
                <div className="bg-rose-50/60 dark:bg-rose-950/20 p-2 rounded-xl divide-y divide-rose-100 dark:divide-rose-900/40">
                  {completedExchange.returnedItems.map((it, idx) => (
                    <div key={idx} className="flex justify-between py-1 text-[11px]">
                      <span>{it.productName} × {it.quantity}</span>
                      <span className="font-mono font-bold">{it.totalRefund.toLocaleString()} PKR</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Replacement Items */}
            {completedExchange.newItems.length > 0 && (
              <div className="space-y-1">
                <div className="font-black text-[11px] text-blue-600 flex items-center justify-between">
                  <span>→ نئی اشیاء (Replacement Items):</span>
                  <span>{completedExchange.totalNewValue.toLocaleString()} PKR</span>
                </div>
                <div className="bg-blue-50/60 dark:bg-blue-950/20 p-2 rounded-xl divide-y divide-blue-100 dark:divide-blue-900/40">
                  {completedExchange.newItems.map((it, idx) => (
                    <div key={idx} className="flex justify-between py-1 text-[11px]">
                      <span>{it.productName} × {it.quantity}</span>
                      <span className="font-mono font-bold">{it.total.toLocaleString()} PKR</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Net Difference Summary */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 space-y-1">
              <div className="flex justify-between font-bold text-[11px]">
                <span>کل واپسی مالیت:</span>
                <span className="font-mono">{completedExchange.totalReturnValue.toLocaleString()} PKR</span>
              </div>
              <div className="flex justify-between font-bold text-[11px]">
                <span>نئی اشیاء کی رقم:</span>
                <span className="font-mono">{completedExchange.totalNewValue.toLocaleString()} PKR</span>
              </div>
              <div className="pt-1 border-t border-slate-300 dark:border-slate-700 flex justify-between font-black text-sm">
                <span>نیٹ فرق:</span>
                <span
                  className={`font-mono ${
                    completedExchange.differenceAmount > 0
                      ? 'text-amber-600'
                      : completedExchange.differenceAmount < 0
                      ? 'text-emerald-600'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {completedExchange.differenceAmount > 0
                    ? `+${completedExchange.differenceAmount.toLocaleString()} PKR (وصول شدہ)`
                    : completedExchange.differenceAmount < 0
                    ? `-${Math.abs(completedExchange.differenceAmount).toLocaleString()} PKR (ریفنڈ شدہ)`
                    : '0 PKR (برابر تبادلہ)'}
                </span>
              </div>
            </div>

            {/* Developer Helpline Branding */}
            <div className="text-[10px] text-center text-slate-400 font-mono">
              OneShop POS • JK Developers Pakistan (03008998381)
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>رسید پرنٹ کریں</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const msg = `*رسید تبادلہ مال - ${businessProfile.nameUr || businessProfile.nameEn}*\nایکسچینج نمبر: #${completedExchange.exchangeNo}\nگاہک: ${completedExchange.customerName}\nواپسی مالیت: ${completedExchange.totalReturnValue} PKR\nنئی اشیاء: ${completedExchange.totalNewValue} PKR\nنیٹ فرق: ${completedExchange.differenceAmount} PKR\nشکریہ!`;
                  navigator.clipboard.writeText(msg);
                  alert('ایکسچینج کی مکمل رسید کاپی ہو گئی ہے! آپ واٹس ایپ پر پیسٹ کر کے بھیج سکتے ہیں۔');
                }}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>واٹس ایپ شیئر</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCompletedExchange(null)}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {/* Return Success Note */}
      {completedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {lang === 'ur' ? 'مال کی واپسی کامیاب ہو گئی!' : 'Return Processed Successfully!'}
            </h3>
            <p className="text-xs text-slate-500">
              واپسی نمبر: <span className="font-mono font-bold">#{completedReturn.returnNo}</span>
              <br />
              کل ریفنڈ رقم: <span className="font-mono font-bold text-rose-600">{completedReturn.totalRefund.toLocaleString()} PKR</span>
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">
              اسٹاک میں اشیاء خودکار طور پر واپس جمع کر دی گئی ہیں اور روزنامچہ اپڈیٹ ہو گیا ہے۔
            </p>
            <button
              onClick={() => setCompletedReturn(null)}
              className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {/* Reprint Receipt Modal */}
      <PrintReceiptModal
        isOpen={reprintModalOpen}
        onClose={() => setReprintModalOpen(false)}
        invoice={selectedInvoice}
        businessProfile={businessProfile}
      />
    </div>
  );
};
