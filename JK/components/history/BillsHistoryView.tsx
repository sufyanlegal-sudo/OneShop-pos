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
  DollarSign,
  User,
  Phone,
  Clock,
  ArrowRight,
  X,
  Share2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { Invoice, SaleReturn } from '@/types';
import { PrintReceiptModal } from '@/components/pos/PrintReceiptModal';

export const BillsHistoryView: React.FC = () => {
  const { lang, t } = useLanguage();
  const { invoices, processSaleReturn, businessProfile, currentRole } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [reprintModalOpen, setReprintModalOpen] = useState(false);

  // Return Modal State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnInvoice, setReturnInvoice] = useState<Invoice | null>(null);
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'KHATA_CREDIT'>('CASH');
  const [returnReason, setReturnReason] = useState('خراب مال / کسٹمر کی تبدیلی');
  const [completedReturn, setCompletedReturn] = useState<SaleReturn | null>(null);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        inv.invoiceNo.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.customerPhone && inv.customerPhone.includes(q));

      const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchQuery, filterStatus]);

  // Handle open return modal
  const handleOpenReturn = (inv: Invoice) => {
    setReturnInvoice(inv);
    // Default return qty to 0 for each item
    const initQtys: Record<string, number> = {};
    inv.items.forEach((it) => {
      initQtys[it.productId] = 0;
    });
    setReturnQtys(initQtys);
    setReturnModalOpen(true);
  };

  // Submit Sale Return
  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnInvoice) return;

    const returnItems = Object.entries(returnQtys)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (returnItems.length === 0) {
      alert(lang === 'ur' ? 'براہ کرم واپسی کے لیے کم از کم ایک آئٹم کی تعداد درج کریں!' : 'Please enter quantity to return!');
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
            {lang === 'ur' ? 'مکمل بل' : 'Completed'}
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
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {inv.status === 'COMPLETED'
                          ? lang === 'ur' ? 'مکمل' : 'Completed'
                          : lang === 'ur' ? 'واپسی شدہ' : 'Returned'}
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
                          onClick={() => handleOpenReturn(inv)}
                          className="px-2 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-lg font-bold flex items-center gap-1 text-[11px]"
                          title="Process Sale Return"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{lang === 'ur' ? 'واپسی' : 'Return'}</span>
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

      {/* Sale Return Modal */}
      {returnModalOpen && returnInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {lang === 'ur' ? 'مال کی واپسی و ریفنڈ' : 'Process Sales Return'}
                </h3>
              </div>
              <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                #{returnInvoice.invoiceNo}
              </span>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  {lang === 'ur' ? 'واپسی والے آئٹمز کی تعداد منتخب کریں:' : 'Select items and quantity to return:'}
                </label>

                {returnInvoice.items.map((item) => {
                  const maxReturnable = item.quantity - (item.returnedQuantity || 0);
                  return (
                    <div
                      key={item.productId}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {lang === 'ur' ? item.nameUr : item.nameEn}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          فروخت ریٹ: {item.unitPrice} PKR | خریدی گئی: {item.quantity} (پہلے واپس: {item.returnedQuantity || 0})
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-slate-500 font-bold">واپسی تعداد:</label>
                        <input
                          type="number"
                          min="0"
                          max={maxReturnable}
                          value={returnQtys[item.productId] || 0}
                          onChange={(e) => {
                            const val = Math.min(maxReturnable, Math.max(0, parseInt(e.target.value) || 0));
                            setReturnQtys({ ...returnQtys, [item.productId]: val });
                          }}
                          className="w-16 text-center font-mono font-bold text-rose-600 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded py-1 outline-none text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Refund Method */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'ur' ? 'ریفنڈ ادائیگی کا طریقہ:' : 'Refund Method:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRefundMethod('CASH')}
                    className={`py-2 rounded-xl font-bold ${
                      refundMethod === 'CASH'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    نقد کیش واپس کریں (Cash Refund)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundMethod('KHATA_CREDIT')}
                    className={`py-2 rounded-xl font-bold ${
                      refundMethod === 'KHATA_CREDIT'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    کھاتے میں کٹوتی کریں (Credit Khata)
                  </button>
                </div>
              </div>

              {/* Return Reason */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'ur' ? 'واپسی کی وجہ:' : 'Reason for Return:'}
                </label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-md"
                >
                  {lang === 'ur' ? 'واپسی مکمل کریں' : 'Confirm Return'}
                </button>
              </div>
            </form>
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
