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
} from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { useLanguage } from '@/context/LanguageContext';
import { AuditLog } from '@/types';

export const AuditView: React.FC = () => {
  const { auditLogs, businessProfile } = useShop();
  const { lang, t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Filter logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchAction = selectedAction === 'ALL' || log.action === selectedAction;
      const matchDate = !selectedDate || log.timestamp.startsWith(selectedDate);
      const matchSearch =
        !searchQuery ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.refId && log.refId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        log.role.toLowerCase().includes(searchQuery.toLowerCase());

      return matchAction && matchDate && matchSearch;
    });
  }, [auditLogs, selectedAction, selectedDate, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = auditLogs.length;
    const sales = auditLogs.filter((l) => l.action === 'SALE_CREATED').length;
    const returns = auditLogs.filter((l) => l.action === 'SALE_RETURN').length;
    const khata = auditLogs.filter((l) => l.action === 'KHATA_PAYMENT').length;
    const stock = auditLogs.filter(
      (l) => l.action === 'STOCK_UPDATED' || l.action === 'STOCK_ADDED'
    ).length;
    return { total, sales, returns, khata, stock };
  }, [auditLogs]);

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
            {lang === 'ur' ? 'سٹاک ترمیم' : 'Stock Edit'}
          </span>
        );
      case 'SETTINGS_CHANGED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
            <Settings className="w-3.5 h-3.5" />
            {lang === 'ur' ? 'سیٹنگز تبدیل' : 'Settings'}
          </span>
        );
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
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                {lang === 'ur' ? 'سسٹم آڈٹ ٹریل اور سیکیورٹی لاگز' : 'System Audit Trail & Security Logs'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'ur'
                  ? 'تمام فروخت، مال کی واپسی، کھاتہ کی ادائیگیاں، اور سٹاک کی تبدیلیوں کا مکمل ریکارڈ'
                  : 'Immutable record of sales, returns, khata payments, expenses, and stock edits'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="no-print self-start md:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
        >
          <Printer className="w-4 h-4 text-emerald-400" />
          <span>{lang === 'ur' ? 'آڈٹ رپورٹ پرنٹ کریں' : 'Print Audit Report'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 no-print">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500">{lang === 'ur' ? 'کل آڈٹ ریکارڈز' : 'Total Logs'}</p>
          <p className="text-xl font-black mt-1 text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500">{lang === 'ur' ? 'فروخت کے بل' : 'Sales Created'}</p>
          <p className="text-xl font-black mt-1 text-emerald-600">{stats.sales}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500">{lang === 'ur' ? 'مال واپسی' : 'Sale Returns'}</p>
          <p className="text-xl font-black mt-1 text-amber-600">{stats.returns}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500">{lang === 'ur' ? 'کھاتہ ریکوری' : 'Khata Recoveries'}</p>
          <p className="text-xl font-black mt-1 text-blue-600">{stats.khata}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500">{lang === 'ur' ? 'سٹاک تبدیلیاں' : 'Stock Edits'}</p>
          <p className="text-xl font-black mt-1 text-purple-600">{stats.stock}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">{lang === 'ur' ? 'تمام کارروائیاں (All Actions)' : 'All Actions'}</option>
              <option value="SALE_CREATED">{lang === 'ur' ? 'فروخت کے بل (Sale Created)' : 'Sale Created'}</option>
              <option value="SALE_RETURN">{lang === 'ur' ? 'مال واپسی (Sale Return)' : 'Sale Return'}</option>
              <option value="KHATA_PAYMENT">{lang === 'ur' ? 'کھاتہ وصولی (Khata Payment)' : 'Khata Payment'}</option>
              <option value="EXPENSE_RECORDED">{lang === 'ur' ? 'روزنامچہ خرچ (Expenses)' : 'Expenses'}</option>
              <option value="STOCK_UPDATED">{lang === 'ur' ? 'سٹاک ترمیم (Stock Edits)' : 'Stock Edits'}</option>
              <option value="LOGIN_MANAGER">{lang === 'ur' ? 'مینجر لاگ ان (Manager Login)' : 'Manager Login'}</option>
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
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
        {/* Printable Header */}
        <div className="hidden print:block p-4 border-b border-slate-300 text-center">
          <h2 className="text-xl font-black">
            {lang === 'ur' ? businessProfile.nameUr : businessProfile.nameEn}
          </h2>
          <p className="text-xs text-slate-600">
            {lang === 'ur' ? 'سسٹم آڈٹ رپورٹ' : 'System Audit & Activity Report'} -{' '}
            {new Date().toLocaleString('en-PK')}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs md:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5 text-center w-12">#</th>
                <th className="p-3.5 text-right">{lang === 'ur' ? 'وقت اور تاریخ' : 'Date & Time'}</th>
                <th className="p-3.5 text-center">{lang === 'ur' ? 'کارروائی' : 'Action'}</th>
                <th className="p-3.5 text-center">{lang === 'ur' ? 'رول' : 'User Role'}</th>
                <th className="p-3.5 text-right">{lang === 'ur' ? 'تفصیلات' : 'Details'}</th>
                <th className="p-3.5 text-center">{lang === 'ur' ? 'حوالہ نمبر' : 'Ref ID'}</th>
                <th className="p-3.5 text-left">{lang === 'ur' ? 'رقم' : 'Amount'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    {lang === 'ur' ? 'کوئی آڈٹ ریکارڈ دستیاب نہیں' : 'No audit records match the current filters'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3.5 text-center font-mono text-slate-400 text-xs">
                      {index + 1}
                    </td>
                    <td className="p-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-PK', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          log.role === 'MANAGER'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <UserCheck className="w-3 h-3" />
                        {log.role === 'MANAGER'
                          ? lang === 'ur'
                            ? 'مینجر'
                            : 'Manager'
                          : lang === 'ur'
                          ? 'کیشیئر'
                          : 'Cashier'}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">
                      {log.details}
                    </td>
                    <td className="p-3.5 text-center font-mono text-xs text-slate-500">
                      {log.refId ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          {log.refId}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3.5 text-left font-mono font-bold text-slate-900 dark:text-white">
                      {log.amount !== undefined ? `Rs. ${log.amount.toLocaleString()}` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Footer */}
        <div className="hidden print:block p-4 border-t border-slate-300 text-center text-xs text-slate-500 font-mono">
          OneShop POS • JK Developers Pakistan
        </div>
      </div>
    </div>
  );
};
