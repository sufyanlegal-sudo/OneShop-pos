'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Repeat,
  RotateCcw,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  Share2,
  CheckCircle,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { Invoice, SaleReturn, SaleExchange, Product } from '@/types';

interface ExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInvoice?: Invoice | null;
}

export const ExchangeModal: React.FC<ExchangeModalProps> = ({
  isOpen,
  onClose,
  initialInvoice,
}) => {
  const { lang, t } = useLanguage();
  const {
    invoices,
    allProducts,
    processSaleReturn,
    processSaleExchange,
    businessProfile,
  } = useShop();

  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState<'EXCHANGE' | 'RETURN'>('EXCHANGE');

  // Quantities of items returned from activeInvoice
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});

  // Replacement items chosen for exchange
  const [exchangeNewItems, setExchangeNewItems] = useState<
    { productId: string; quantity: number }[]
  >([]);
  const [replacementSearch, setReplacementSearch] = useState('');

  // Settlement and Reason
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'KHATA_CREDIT'>('CASH');
  const [reason, setReason] = useState('مال کا تبادلہ / دوسری چیز کا انتخاب');

  // Completed Confirmation State
  const [completedExchange, setCompletedExchange] = useState<SaleExchange | null>(null);
  const [completedReturn, setCompletedReturn] = useState<SaleReturn | null>(null);

  // Initialize or reset when opened or initialInvoice changes
  useEffect(() => {
    if (isOpen) {
      if (initialInvoice) {
        setActiveInvoice(initialInvoice);
        const initQtys: Record<string, number> = {};
        initialInvoice.items.forEach((it) => {
          initQtys[it.productId] = 0;
        });
        setReturnQtys(initQtys);
      } else {
        setActiveInvoice(null);
        setReturnQtys({});
      }
      setExchangeNewItems([]);
      setReplacementSearch('');
      setInvoiceSearchQuery('');
      setCompletedExchange(null);
      setCompletedReturn(null);
      setModalMode('EXCHANGE');
      setReason('مال کا تبادلہ / دوسری چیز کا انتخاب');
    }
  }, [isOpen, initialInvoice]);

  // When a user selects an invoice from the search list
  const handleSelectInvoice = (inv: Invoice) => {
    setActiveInvoice(inv);
    const initQtys: Record<string, number> = {};
    inv.items.forEach((it) => {
      initQtys[it.productId] = 0;
    });
    setReturnQtys(initQtys);
  };

  // Filtered invoices for search
  const filteredInvoiceList = useMemo(() => {
    if (!invoiceSearchQuery.trim()) return invoices.slice(0, 5);
    const q = invoiceSearchQuery.toLowerCase().trim();
    return invoices
      .filter(
        (inv) =>
          inv.invoiceNo.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          (inv.customerPhone && inv.customerPhone.includes(q))
      )
      .slice(0, 8);
  }, [invoices, invoiceSearchQuery]);

  // Calculations
  const totalReturnValue = useMemo(() => {
    if (!activeInvoice) return 0;
    return Object.entries(returnQtys).reduce((sum, [pid, qty]) => {
      const it = activeInvoice.items.find((item) => item.productId === pid);
      return sum + qty * (it?.unitPrice || 0);
    }, 0);
  }, [activeInvoice, returnQtys]);

  const totalNewValue = useMemo(() => {
    return exchangeNewItems.reduce((sum, ni) => {
      const p = allProducts.find((prod) => prod.id === ni.productId);
      return sum + ni.quantity * (p?.salePrice || 0);
    }, 0);
  }, [exchangeNewItems, allProducts]);

  const differenceAmount = totalNewValue - totalReturnValue;

  // Search replacement items from allProducts
  const searchedProducts = useMemo(() => {
    if (!replacementSearch.trim()) return [];
    const q = replacementSearch.toLowerCase().trim();
    return allProducts
      .filter(
        (p) =>
          p.nameUr.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.includes(q))
      )
      .slice(0, 6);
  }, [allProducts, replacementSearch]);

  const handleAddNewItem = (productId: string) => {
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
    setReplacementSearch('');
  };

  const handleUpdateItemQty = (productId: string, delta: number) => {
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

  const handleRemoveItem = (productId: string) => {
    setExchangeNewItems(exchangeNewItems.filter((it) => it.productId !== productId));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice) return;

    const returnItems = Object.entries(returnQtys)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (modalMode === 'RETURN') {
      if (returnItems.length === 0) {
        alert('براہ کرم واپسی کے لیے کم از کم ایک آئٹم کی تعداد درج کریں!');
        return;
      }

      const ret = processSaleReturn({
        invoiceId: activeInvoice.id,
        returnedItems: returnItems,
        refundMethod: paymentMethod,
        reason: reason || 'گاہک کی درخواست پر مال واپسی',
      });

      if (ret) {
        setCompletedReturn(ret);
      }
    } else {
      // EXCHANGE
      if (returnItems.length === 0 && exchangeNewItems.length === 0) {
        alert('براہ کرم تبادلے کے لیے واپس ہونے والے اور متبادل آئٹمز کا انتخاب فرمائیں!');
        return;
      }

      const exc = processSaleExchange({
        invoiceId: activeInvoice.id,
        invoiceNo: activeInvoice.invoiceNo,
        returnedItems: returnItems,
        newItems: exchangeNewItems,
        paymentMethod,
        reason: reason || 'مال کا تبادلہ (Exchange)',
        customerId: activeInvoice.customerId,
        customerName: activeInvoice.customerName,
        customerPhone: activeInvoice.customerPhone,
      });

      if (exc) {
        setCompletedExchange(exc);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 md:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-5 md:p-6 shadow-2xl space-y-4 my-6 max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-xl">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                مال کا تبادلہ و واپسی (Return & Exchange)
              </h3>
              <p className="text-[11px] text-slate-500">
                گاہک کی سابقہ خریدی گئی اشیاء تبدیل کریں یا کیش ریفنڈ کریں
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: INVOICE SELECTION (If no active invoice yet) */}
        {!activeInvoice ? (
          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                سابقہ بل نمبر یا گاہک کا فون تلاش کریں:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={invoiceSearchQuery}
                  onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                  placeholder="مثال: 1001 یا گاہک کا نام/فون..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500">
                حالیہ بلوں کی فہرست (کلک کر کے تبادلہ شروع کریں):
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                {filteredInvoiceList.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 bg-white dark:bg-slate-850 hover:bg-blue-50/50 dark:hover:bg-slate-800 flex items-center justify-between gap-3 transition-all"
                  >
                    <div>
                      <div className="font-mono font-black text-slate-900 dark:text-white">
                        بل #{inv.invoiceNo}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        گاہک: {inv.customerName} | کل رقم: {inv.grandTotal.toLocaleString()} PKR ({inv.items.length} آئٹمز)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectInvoice(inv)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-xs active:scale-95 transition-all"
                    >
                      انتخاب کریں ↵
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: ACTIVE INVOICE RETURN & EXCHANGE WORKFLOW */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Active Invoice Info Strip & Mode Switcher */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex-wrap gap-2">
              <div>
                <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                  بل #{activeInvoice.invoiceNo}
                </span>
                <span className="text-slate-500 font-medium mr-2">
                  ({activeInvoice.customerName})
                </span>
                <button
                  type="button"
                  onClick={() => setActiveInvoice(null)}
                  className="text-[10px] text-blue-600 dark:text-blue-400 underline font-bold mr-2"
                >
                  دوسرا بل منتخب کریں
                </button>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 gap-1">
                <button
                  type="button"
                  onClick={() => setModalMode('EXCHANGE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                    modalMode === 'EXCHANGE'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>🔁 مال کا تبادلہ (Exchange)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('RETURN')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                    modalMode === 'RETURN'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>🔄 صرف کیش ریفنڈ (Return)</span>
                </button>
              </div>
            </div>

            {/* PART 1: ITEMS BEING RETURNED */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>1. واپس ہونے والے آئٹمز منتخب کریں (Returned Items):</span>
                </label>
                <span className="text-[11px] font-mono font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-lg">
                  واپسی مالیت: {totalReturnValue.toLocaleString()} PKR
                </span>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {activeInvoice.items.map((item) => {
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
                          {item.nameUr || item.nameEn}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ریٹ: {item.unitPrice} PKR | بل تعداد: {item.quantity}{' '}
                          {item.returnedQuantity ? `(سابقہ واپس: ${item.returnedQuantity})` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-bold">واپسی:</span>
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
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PART 2: NEW REPLACEMENT ITEMS (Only in Exchange Mode) */}
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

                {/* Replacement Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={replacementSearch}
                    onChange={(e) => setReplacementSearch(e.target.value)}
                    placeholder="نئی پروڈکٹ تلاش کریں (نام، بارکوڈ یا SKU درج کریں)..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-medium"
                  />

                  {/* Search Dropdown */}
                  {searchedProducts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {searchedProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleAddNewItem(p.id)}
                          className="w-full p-2.5 flex items-center justify-between text-right hover:bg-blue-50 dark:hover:bg-slate-800 transition-all text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {p.nameUr || p.nameEn}
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
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
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
                              {p.nameUr || p.nameEn}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              ریٹ: {p.salePrice} PKR | کل: {subtotal.toLocaleString()} PKR
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(item.productId, -1)}
                              className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-xs px-1.5">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(item.productId, 1)}
                              className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.productId)}
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
                    گاہک جو نیا سامان لے رہا ہے، اوپر سرچ بار میں نام لکھ کر ایڈ کریں۔
                  </div>
                )}

                {/* DIFFERENCE SUMMARY BANNER */}
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

            {/* PART 3: PAYMENT METHOD */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {modalMode === 'RETURN'
                  ? 'ریفنڈ ادائیگی کا طریقہ:'
                  : differenceAmount > 0
                  ? 'اضافی رقم وصولی کا طریقہ:'
                  : 'بقایا رقم واپس کرنے کا طریقہ:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'CASH'
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
                  onClick={() => setPaymentMethod('KHATA_CREDIT')}
                  className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'KHATA_CREDIT'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>کسٹمر کھاتہ (Khata)</span>
                </button>
              </div>
            </div>

            {/* PART 4: REASON */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {modalMode === 'RETURN' ? 'واپسی کی وجہ:' : 'تبادلے کی وجہ:'}
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none font-medium"
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
              >
                منسوخ کریں
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
        )}

        {/* COMPLETED RETURN POPUP */}
        {completedReturn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                مال کی واپسی کامیاب ہو گئی!
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
                onClick={() => {
                  setCompletedReturn(null);
                  onClose();
                }}
                className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs"
              >
                بند کریں
              </button>
            </div>
          </div>
        )}

        {/* COMPLETED EXCHANGE POPUP & RECEIPT */}
        {completedExchange && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 my-8 text-xs">
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

              {completedExchange.returnedItems.length > 0 && (
                <div className="space-y-1">
                  <div className="font-black text-[11px] text-rose-600 flex items-center justify-between">
                    <span>← واپس شدہ اشیاء (Returned):</span>
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

              {completedExchange.newItems.length > 0 && (
                <div className="space-y-1">
                  <div className="font-black text-[11px] text-blue-600 flex items-center justify-between">
                    <span>→ نئی تبدیل شدہ اشیاء (Replacement):</span>
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

              {/* Difference */}
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
                onClick={() => {
                  setCompletedExchange(null);
                  onClose();
                }}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200"
              >
                بند کریں
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
