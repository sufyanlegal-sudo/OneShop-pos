'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  Calendar,
  Wallet,
  Coffee,
  Zap,
  Building,
  UserCheck,
  Printer,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { RoznamchaEntry, RoznamchaType } from '@/types';

export const RoznamchaView: React.FC = () => {
  const { lang, t } = useLanguage();
  const { roznamcha, addRoznamchaEntry, businessProfile, invoices } = useShop();

  const [filterType, setFilterType] = useState<string>('all');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState<number>(5000);
  const [actualDrawerCash, setActualDrawerCash] = useState<string>('');

  // Form state
  const [entryType, setEntryType] = useState<RoznamchaType>('EXPENSE');
  const [category, setCategory] = useState('چائے و ریفریشمنٹ (Tea/Snacks)');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');

  // Calculations
  const calculations = useMemo(() => {
    let totalCashIn = 0;
    let totalCashOut = 0;

    roznamcha.forEach((r) => {
      if (r.isCashIn) {
        totalCashIn += r.amount;
      } else {
        totalCashOut += r.amount;
      }
    });

    // Also calculate total udhaar given from invoices
    const totalUdhaarGiven = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

    const calculatedClosing = openingBalance + totalCashIn - totalCashOut;
    const actual = parseFloat(actualDrawerCash) || calculatedClosing;
    const difference = actual - calculatedClosing;

    return {
      totalCashIn,
      totalCashOut,
      totalUdhaarGiven,
      calculatedClosing,
      actual,
      difference,
    };
  }, [roznamcha, openingBalance, actualDrawerCash, invoices]);

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    const isCashIn = entryType === 'CASH_SALE' || entryType === 'CREDIT_RECOVERY' || entryType === 'CASH_IN';

    addRoznamchaEntry({
      type: entryType,
      category,
      amount,
      isCashIn,
      description: description.trim() || category,
    });

    setExpenseModalOpen(false);
    setAmount(0);
    setDescription('');
  };

  const handlePrintRoznamcha = () => {
    window.print();
  };

  const filteredEntries = useMemo(() => {
    if (filterType === 'all') return roznamcha;
    if (filterType === 'in') return roznamcha.filter((r) => r.isCashIn);
    if (filterType === 'out') return roznamcha.filter((r) => !r.isCashIn);
    return roznamcha.filter((r) => r.type === filterType);
  }, [roznamcha, filterType]);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-2xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {t('roznamchaTitle')}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'ur'
                ? 'خودکار کیش بک، نقد آمدنی، یومیہ اخراجات اور دراز کا حساب'
                : 'Automated Daily Cash Book, Income, Expenses & Drawer Reconciliation'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpenseModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{lang === 'ur' ? 'خرچہ یا اندراج درج کریں' : 'Record Expense / Cash'}</span>
          </button>

          <button
            onClick={handlePrintRoznamcha}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>{t('print')}</span>
          </button>
        </div>
      </div>

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Opening Balance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 mb-1 flex items-center justify-between">
            <span>{t('openingBalance')}</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {openingBalance.toLocaleString()}{' '}
            <span className="text-xs font-normal">PKR</span>
          </div>
        </div>

        {/* Total Cash In (آمد) */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 p-3.5 rounded-2xl shadow-sm">
          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center justify-between">
            <span>{t('cashIn')}</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            +{calculations.totalCashIn.toLocaleString()}{' '}
            <span className="text-xs font-normal">PKR</span>
          </div>
        </div>

        {/* Total Cash Out (خرچ) */}
        <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 p-3.5 rounded-2xl shadow-sm">
          <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 mb-1 flex items-center justify-between">
            <span>{t('cashOut')}</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
            -{calculations.totalCashOut.toLocaleString()}{' '}
            <span className="text-xs font-normal">PKR</span>
          </div>
        </div>

        {/* Closing Cash in Drawer */}
        <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/50 p-3.5 rounded-2xl shadow-sm">
          <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 mb-1 flex items-center justify-between">
            <span>{t('closingBalance')}</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {calculations.calculatedClosing.toLocaleString()}{' '}
            <span className="text-xs font-normal">PKR</span>
          </div>
        </div>
      </div>

      {/* Drawer Reconciliation Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            {t('reconcile')}
          </h4>
          <p className="text-xs text-slate-500">
            {lang === 'ur'
              ? 'دراز میں موجود اصل نوٹوں کی گنتی درج کریں اور فرق چیک کریں'
              : 'Enter physical cash count in drawer to find any difference'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {t('actualDrawerCash')}:
            </label>
            <input
              type="number"
              value={actualDrawerCash}
              onChange={(e) => setActualDrawerCash(e.target.value)}
              placeholder={calculations.calculatedClosing.toString()}
              className="w-32 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold outline-none"
            />
          </div>

          {actualDrawerCash && (
            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono ${
                calculations.difference === 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : calculations.difference > 0
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {calculations.difference === 0
                ? lang === 'ur' ? 'حساب بالکل برابر ہے ✓' : 'Balanced Perfectly ✓'
                : `${lang === 'ur' ? 'فرق:' : 'Diff:'} ${calculations.difference > 0 ? '+' : ''}${calculations.difference.toLocaleString()} PKR`}
            </div>
          )}
        </div>
      </div>

      {/* Roznamcha Transactions Feed */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Filter Tabs */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-bold ${
                filterType === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {lang === 'ur' ? 'تمام اندراجات' : 'All Entries'} ({roznamcha.length})
            </button>
            <button
              onClick={() => setFilterType('in')}
              className={`px-3 py-1 rounded-lg font-bold ${
                filterType === 'in'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {t('cashIn')}
            </button>
            <button
              onClick={() => setFilterType('out')}
              className={`px-3 py-1 rounded-lg font-bold ${
                filterType === 'out'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {t('cashOut')}
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            {new Date().toLocaleDateString()}
          </span>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">{t('time')}</th>
                <th className="p-3">{t('expenseCategory')}</th>
                <th className="p-3">{t('description')}</th>
                <th className="p-3 text-right">{t('amount')} (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {filteredEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                        entry.isCashIn
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      {entry.isCashIn ? (
                        <ArrowDownLeft className="w-3 h-3" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3" />
                      )}
                      {entry.category}
                    </span>
                  </td>
                  <td className="p-3 text-slate-800 dark:text-slate-200">
                    <div>{entry.description}</div>
                    {entry.refInvoiceId && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Invoice: #{entry.refInvoiceId}
                      </span>
                    )}
                  </td>
                  <td
                    className={`p-3 text-right font-mono font-bold text-sm ${
                      entry.isCashIn
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {entry.isCashIn ? '+' : '-'}{entry.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {lang === 'ur' ? 'روزنامچہ میں نیا اندراج' : 'Record Roznamcha Entry'}
            </h3>

            <form onSubmit={handleSaveEntry} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  {lang === 'ur' ? 'اندراج کی نوعیت:' : 'Entry Type:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEntryType('EXPENSE');
                      setCategory('چائے و ریفریشمنٹ (Tea/Snacks)');
                    }}
                    className={`py-2 rounded-xl font-bold ${
                      entryType === 'EXPENSE'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    خرچ / ادائیگی (Cash Out)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEntryType('CASH_IN');
                      setCategory('متفرق آمدنی (Miscellaneous Income)');
                    }}
                    className={`py-2 rounded-xl font-bold ${
                      entryType === 'CASH_IN'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    آمدنی / وصولی (Cash In)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  {t('expenseCategory')}:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none font-medium"
                >
                  <option value="چائے و ریفریشمنٹ (Tea/Snacks)">چائے و ریفریشمنٹ (Tea/Snacks)</option>
                  <option value="بجلی بل و یوٹیلیٹی (Electricity/Gas)">بجلی بل و یوٹیلیٹی (Electricity/Gas)</option>
                  <option value="دکان کرایہ (Shop Rent)">دکان کرایہ (Shop Rent)</option>
                  <option value="ملازمین تنخواہ (Staff Salary)">ملازمین تنخواہ (Staff Salary)</option>
                  <option value="سپلائر ادائیگی (Supplier Payout)">سپلائر ادائیگی (Supplier Payout)</option>
                  <option value="سٹیشنری و پیکیجنگ (Packaging/Bags)">سٹیشنری و پیکیجنگ (Packaging/Bags)</option>
                  <option value="دیگر متفرق اخراجات (Other Expenses)">دیگر متفرق اخراجات (Other Expenses)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  {t('amount')} (PKR):
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="500"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-sm outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  {t('description')}:
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={lang === 'ur' ? 'تفصیل لکھیں...' : 'Enter details...'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
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
