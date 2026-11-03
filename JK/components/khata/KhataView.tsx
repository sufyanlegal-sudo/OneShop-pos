'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  MessageSquare,
  Printer,
  Phone,
  MapPin,
  CheckCircle,
  FileText,
  Mic,
  Banknote,
  TrendingDown,
  X,
  CheckCircle2,
  Receipt,
  ExternalLink,
  Edit3,
  Trash2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { Customer, KhataPaymentReceipt } from '@/types';
import { VoiceAssistantModal } from '@/components/VoiceAssistantModal';
import { printElement } from '@/lib/printService';

export const KhataView: React.FC = () => {
  const { lang, t } = useLanguage();
  const { customers, receiveKhataPayment, adjustCustomerBalance, deleteKhataEntry, addCustomer, businessProfile } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [newCustomerModalOpen, setNewCustomerModalOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  // Recovery Receipt Modal State
  const [completedReceipt, setCompletedReceipt] = useState<KhataPaymentReceipt | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDesc, setPaymentDesc] = useState('');

  // Balance Adjustment Form (کھاتہ درستی فارم)
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustTargetBalance, setAdjustTargetBalance] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');

  // New Customer form
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custCreditLimit, setCustCreditLimit] = useState<number>(50000);

  // Selected Customer details
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0] || null;
  }, [customers, selectedCustomerId]);

  // Selected Customer Ledger Statistics (کل ادھار، کل جمع شدہ وصولی، خالص بقایا)
  const customerStats = useMemo(() => {
    if (!selectedCustomer) return { totalDebit: 0, totalCredit: 0, balance: 0 };
    let totalDebit = 0;
    let totalCredit = 0;
    selectedCustomer.khata.forEach((k) => {
      if (k.type === 'DEBIT') totalDebit += k.amount;
      if (k.type === 'CREDIT') totalCredit += k.amount;
    });
    return {
      totalDebit,
      totalCredit,
      balance: selectedCustomer.currentBalance,
    };
  }, [selectedCustomer]);

  // Total Outstanding Debt across all customers
  const totalMarketDebt = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.currentBalance, 0);
  }, [customers]);

  // Filtered and Ranked Customers (sorted by highest debt first)
  const rankedCustomers = useMemo(() => {
    return [...customers]
      .filter((c) => {
        const q = searchQuery.toLowerCase().trim();
        return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.address.toLowerCase().includes(q);
      })
      .sort((a, b) => b.currentBalance - a.currentBalance);
  }, [customers, searchQuery]);

  // Handle Receive Payment (کھاتے میں رقم جمع کرنا)
  const handleReceivePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    let finalAmount = paymentAmount;
    let finalDesc = paymentDesc.trim();

    // Intelligent safety detection: If user typed the amount (e.g. 1500) into the description field!
    if (/^\d+(\.\d+)?$/.test(finalDesc)) {
      const parsedNum = parseFloat(finalDesc);
      if (parsedNum > 0) {
        finalAmount = parsedNum;
        finalDesc = 'نقد وصولی برائے کیش';
      }
    }

    if (finalAmount <= 0) {
      alert(lang === 'ur' ? 'براہ کرم جمع کرنے والی رقم درست درج فرمائیں (مثلاً 1500)' : 'Please enter a valid deposit amount.');
      return;
    }

    const receipt = receiveKhataPayment(
      selectedCustomer.id,
      finalAmount,
      finalDesc || 'نقد وصولی برائے کیش'
    );

    setPaymentModalOpen(false);
    setPaymentAmount(0);
    setPaymentDesc('');

    if (receipt) {
      setCompletedReceipt(receipt);
      setReceiptModalOpen(true);
    }
  };

  // Handle Adjust Balance (کھاتہ بیلنس درستی جمع کرانا)
  const handleAdjustBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const success = adjustCustomerBalance(
      selectedCustomer.id,
      Math.max(0, adjustTargetBalance),
      adjustReason.trim() || 'کھاتہ بیلنس درستی'
    );

    if (success) {
      setAdjustModalOpen(false);
      setAdjustTargetBalance(0);
      setAdjustReason('');
      alert(lang === 'ur' ? `کھاتہ بیلنس کامیابی سے ${adjustTargetBalance} PKR درست کر دیا گیا!` : 'Balance adjusted successfully!');
    }
  };

  // Handle Add Customer
  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    const newCust = addCustomer(
      custName.trim(),
      custPhone.trim() || 'N/A',
      custAddress.trim(),
      custCreditLimit
    );

    setSelectedCustomerId(newCust.id);
    setNewCustomerModalOpen(false);
    setCustName('');
    setCustPhone('');
    setCustAddress('');
  };

  // WhatsApp reminder generator (پالائٹ یاد دہانی)
  const sendWhatsAppReminder = (cust: Customer) => {
    let cleanPhone = cust.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('03')) {
      cleanPhone = '92' + cleanPhone.substring(1);
    }
    const msg = `محترم ${cust.name} صاحب!
السلام علیکم ورحمۃ اللہ و برکاتہ۔
امید ہے آپ بخیریت ہوں گے۔
آپ کے نام ${businessProfile.nameUr} کے کھاتے میں اس وقت کل واجب الادا بقایا رقم ${cust.currentBalance.toLocaleString()} روپے ہے۔
برائے مہربانی سہولت کے مطابق ادائیگی کا انتظام فرما کر تعاون فرمائیں۔
شکریہ!
${businessProfile.nameUr} (${businessProfile.phone || businessProfile.whatsapp})`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // WhatsApp payment receipt generator (رقم جمع ہونے کی تصدیق)
  const sendWhatsAppReceipt = (rec: KhataPaymentReceipt) => {
    let cleanPhone = rec.customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('03')) {
      cleanPhone = '92' + cleanPhone.substring(1);
    }
    const msg = `*محترم ${rec.customerName} صاحب!*
السلام علیکم ورحمۃ اللہ و برکاتہ۔
آپ کی جانب سے ادھار کھاتے کی رقم موصول ہو کر کھاتے میں جمع کر دی گئی ہے۔
--------------------------------
*رسید نمبر:* ${rec.receiptNo}
*تاریخ:* ${new Date(rec.date).toLocaleDateString()}
*سابقہ ادھار:* ${rec.previousBalance.toLocaleString()} روپے
*جمع شدہ رقم (وصول):* ${rec.amountPaid.toLocaleString()} روپے
*باقی بقایا رقم:* ${rec.remainingBalance.toLocaleString()} روپے
--------------------------------
ادائیگی کا بہت شکریہ!
*${businessProfile.nameUr}* (${businessProfile.phone || businessProfile.whatsapp})`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Top Bar Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {t('khataTitle')}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'ur'
                ? 'خودکار ادھار لیجر، کسٹمر اسٹیٹمنٹس، وصولی کا اندراج اور واٹس ایپ الرٹ'
                : 'Customer Credit Ledgers, Running Statements, Payment Recoveries & WhatsApp Alerts'}
            </p>
          </div>
        </div>

        {/* Total Debt Badge & Actions */}
        <div className="flex items-center gap-3">
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] uppercase font-bold text-rose-600 block">
              {lang === 'ur' ? 'مارکیٹ میں کل بقایا ادھار:' : 'Total Market Debt:'}
            </span>
            <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
              {totalMarketDebt.toLocaleString()} PKR
            </span>
          </div>

          <button
            onClick={() => setNewCustomerModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addCustomer')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Customers List (35%) & Right Ledger Statement (65%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Ranked Customers List */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[650px]">
          {/* Search bar */}
          <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'ur' ? 'گاہک کا نام یا فون تلاش کریں...' : 'Search customer...'}
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none"
              />
            </div>
            <button
              onClick={() => setVoiceModalOpen(true)}
              className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 rounded-xl"
              title="Voice Search Customer"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-600" />
            </button>
          </div>

          {/* Customer Ranking List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {rankedCustomers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {lang === 'ur' ? 'کوئی گاہک نہیں ملا' : 'No customers found'}
              </div>
            ) : (
              rankedCustomers.map((c, index) => {
                const isSelected = selectedCustomer?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={`p-3 cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-bold flex items-center justify-center text-slate-600 dark:text-slate-400">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                          {c.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono">{c.phone}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`font-black text-xs font-mono ${c.currentBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {c.currentBalance.toLocaleString()} PKR
                      </div>
                      <span className="text-[9px] text-slate-400">
                        {c.khata.length} {lang === 'ur' ? 'اندراجات' : 'entries'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Detailed Customer Khata Statement */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[650px]">
          {selectedCustomer ? (
            <>
              {/* Customer Header Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedCustomer.name}
                    </h3>
                    <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-mono">
                      {selectedCustomer.phone}
                    </span>
                  </div>
                  {selectedCustomer.address && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {selectedCustomer.address}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPaymentAmount(0);
                      setPaymentDesc('');
                      setPaymentModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Banknote className="w-4 h-4" />
                    <span>{lang === 'ur' ? '💵 رقم جمع کریں (وصولی)' : 'Deposit / Receive Payment'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setAdjustTargetBalance(selectedCustomer.currentBalance);
                      setAdjustReason('');
                      setAdjustModalOpen(true);
                    }}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                    title="کھاتہ میں بقایا رقم کی تصحیح یا درستی کریں"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>{lang === 'ur' ? '✏️ کھاتہ درست کریں' : 'Adjust Balance'}</span>
                  </button>

                  <button
                    onClick={() => sendWhatsAppReminder(selectedCustomer)}
                    className="px-3 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                    title="Send Polite WhatsApp Reminder"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t('sendReminder')}</span>
                  </button>
                </div>
              </div>

              {/* 3-PILLAR LEDGER BALANCE STATS (کل ادھار، کل جمع رقم، اور خالص بقایا رقم) */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-100/70 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 text-xs shrink-0">
                {/* 1. Total Debit (ادھار لیا) */}
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col justify-between">
                  <span className="text-[10.5px] font-bold text-rose-700 dark:text-rose-400">
                    {lang === 'ur' ? 'کل ادھار (سودا لیا):' : 'Total Credit Taken:'}
                  </span>
                  <span className="text-base font-black font-mono text-rose-600 dark:text-rose-300 mt-1">
                    {customerStats.totalDebit.toLocaleString()} PKR
                  </span>
                </div>

                {/* 2. Total Credit (رقم جمع کرائی) */}
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex flex-col justify-between">
                  <span className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400">
                    {lang === 'ur' ? 'کل جمع رقم (وصول):' : 'Total Deposited (Paid):'}
                  </span>
                  <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-300 mt-1">
                    {customerStats.totalCredit.toLocaleString()} PKR
                  </span>
                </div>

                {/* 3. Remaining Balance (باقی بقایا رقم) */}
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-col justify-between">
                  <span className="text-[10.5px] font-bold text-blue-700 dark:text-blue-400">
                    {lang === 'ur' ? 'باقی بقایا رقم:' : 'Remaining Balance:'}
                  </span>
                  <span className={`text-base font-black font-mono mt-1 ${customerStats.balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {customerStats.balance.toLocaleString()} PKR
                  </span>
                </div>
              </div>

              {/* Khata Entries Table */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="p-3">{t('date')}</th>
                      <th className="p-3">{t('description')}</th>
                      <th className="p-3 text-right text-rose-600 dark:text-rose-400">
                        {lang === 'ur' ? 'نامے / ادھار (+)' : 'Debit (+)'}
                      </th>
                      <th className="p-3 text-right text-emerald-600 dark:text-emerald-400">
                        {lang === 'ur' ? 'جمع / وصول شدہ (-)' : 'Credit / Paid (-)'}
                      </th>
                      <th className="p-3 text-right text-slate-900 dark:text-white">
                        {lang === 'ur' ? 'باقی بقایا رقم' : 'Remaining Balance'}
                      </th>
                      <th className="p-3 text-center w-10">
                        {lang === 'ur' ? 'منسوخی' : 'Undo'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                    {selectedCustomer.khata.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          {lang === 'ur'
                            ? 'اس گاہک کے کھاتے میں کوئی سابقہ اندراج نہیں ہے'
                            : 'No khata transactions for this customer yet.'}
                        </td>
                      </tr>
                    ) : (
                      selectedCustomer.khata.map((k) => (
                        <tr
                          key={k.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                        >
                          <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                            {new Date(k.date).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-slate-800 dark:text-slate-200">
                            <div>{k.description}</div>
                            {k.invoiceId && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                #{k.invoiceId}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                            {k.type === 'DEBIT' ? `+${k.amount.toLocaleString()} PKR` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {k.type === 'CREDIT' ? `${k.amount.toLocaleString()} PKR جمع` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white">
                            {k.balanceAfter.toLocaleString()} PKR
                          </td>
                          <td className="p-2 text-center w-10">
                            <button
                              type="button"
                              onClick={() => {
                                const confirmMsg = lang === 'ur'
                                  ? `کیا آپ یہ اندراج (${k.description} - ${k.amount.toLocaleString()} PKR) منسوخ / ڈیلیٹ کرنا چاہتے ہیں؟\nاس سے گاہک کا بقایا خودکار درست ہو جائے گا۔`
                                  : `Delete this entry (${k.amount} PKR)? Balance will automatically adjust.`;
                                if (confirm(confirmMsg)) {
                                  deleteKhataEntry(selectedCustomer.id, k.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded transition-all cursor-pointer"
                              title={lang === 'ur' ? 'یہ اندراج منسوخ کریں' : 'Delete / Undo Entry'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {selectedCustomer.khata.length > 0 && (
                    <tfoot className="bg-slate-100 dark:bg-slate-800 font-black text-xs border-t-2 border-slate-300 dark:border-slate-700">
                      <tr>
                        <td colSpan={2} className="p-3 text-slate-700 dark:text-slate-300">
                          {lang === 'ur' ? 'کل میزان (Total Statement):' : 'Total Statement:'}
                        </td>
                        <td className="p-3 text-right text-rose-600 dark:text-rose-400 font-mono">
                          +{customerStats.totalDebit.toLocaleString()} PKR
                        </td>
                        <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-mono">
                          -{customerStats.totalCredit.toLocaleString()} PKR
                        </td>
                        <td className="p-3 text-right font-mono text-sm text-slate-900 dark:text-white">
                          {customerStats.balance.toLocaleString()} PKR
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              {lang === 'ur' ? 'کوئی گاہک منتخب کریں' : 'Select a customer to view ledger'}
            </div>
          )}
        </div>
      </div>

      {/* ADJUST BALANCE MODAL (کھاتہ بیلنس درستی فارم) */}
      {adjustModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {lang === 'ur' ? 'کھاتہ بیلنس درست کریں' : 'Adjust Khata Balance'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedCustomer.name} ({selectedCustomer.phone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustBalanceSubmit} className="space-y-3 text-xs">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs space-y-1">
                <span className="font-bold text-amber-900 dark:text-amber-200 block">
                  💡 {lang === 'ur' ? 'موجودہ درج شدہ بقایا:' : 'Current Recorded Balance:'} <strong className="font-mono text-sm">{selectedCustomer.currentBalance.toLocaleString()} PKR</strong>
                </span>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  {lang === 'ur'
                    ? 'اگر کسی غلط اندراج کی وجہ سے بیلنس غلط ہو گیا ہو تو یہاں گاہک کا اصل درست بقایا لکھیں۔ سسٹم خودکار ایڈجسٹمنٹ انٹری درج کر دے گا۔'
                    : 'Enter the actual correct balance due. The system will record an adjustment entry automatically.'}
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'ur' ? 'اصل درست بقایا رقم (PKR):' : 'Correct Balance Due (PKR):'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  autoFocus
                  value={adjustTargetBalance}
                  onChange={(e) => setAdjustTargetBalance(parseFloat(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  placeholder="300"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-amber-500 rounded-xl px-3 py-2.5 font-mono font-black text-lg outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'ur' ? 'درستی کی وجہ / نوٹ:' : 'Reason for Adjustment:'}
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder={lang === 'ur' ? 'سابقہ غلط اندراج کی تصحیح (300 بقایا)' : 'Correction of previous entry'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-md active:scale-95 transition-all text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === 'ur' ? 'بیلنس درست کریں' : 'Save Adjustment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIVE PAYMENT MODAL (کھاتے میں رقم جمع کرنے کا فارم مع لائیو بقایا حساب) */}
      {paymentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {lang === 'ur' ? 'کھاتے میں رقم جمع کریں' : 'Receive Khata Payment'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedCustomer.name} ({selectedCustomer.phone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick 1-Click Amount Buttons */}
            {selectedCustomer.currentBalance > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {lang === 'ur' ? 'فوری انتخاب (1-کلک):' : 'Quick Presets:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(selectedCustomer.currentBalance)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    پورے {selectedCustomer.currentBalance.toLocaleString()} PKR جمع کریں
                  </button>
                  {selectedCustomer.currentBalance > 100 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(Math.round(selectedCustomer.currentBalance / 2))}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 active:scale-95 cursor-pointer"
                    >
                      50% نصف رقم
                    </button>
                  )}
                  {[500, 1000, 1500, 2000, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPaymentAmount(preset)}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-950/40 cursor-pointer"
                    >
                      {preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleReceivePayment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'ur' ? 'جمع کرنے کی رقم (روپے):' : 'Amount to Deposit (PKR):'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  autoFocus
                  value={paymentAmount === 0 ? '' : paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  placeholder={lang === 'ur' ? 'رقم درج کریں (مثلاً 1500)' : 'Enter amount (e.g. 1500)'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-emerald-500 rounded-xl px-3 py-2.5 font-mono font-black text-lg outline-none text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'ur' ? 'تفصیل / نوٹ:' : 'Description / Note:'}
                </label>
                <input
                  type="text"
                  value={paymentDesc}
                  onChange={(e) => setPaymentDesc(e.target.value)}
                  placeholder={lang === 'ur' ? 'نقد وصولی بذریعہ کیش' : 'Cash deposit'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none font-medium"
                />
              </div>

              {/* LIVE BALANCE CALCULATION PREVIEW (رقم جمع ہونے کے بعد نیا بقایا) */}
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>{lang === 'ur' ? 'سابقہ کل ادھار:' : 'Previous Balance:'}</span>
                  <span className="font-mono font-bold">{selectedCustomer.currentBalance.toLocaleString()} PKR</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>{lang === 'ur' ? 'جمع کی جا رہی رقم (وصولی):' : 'Amount Deposited:'}</span>
                  <span className="font-mono font-black">-{paymentAmount.toLocaleString()} PKR</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black text-sm">
                  <span>{lang === 'ur' ? 'جمع کے بعد باقی بقایا رہے گا:' : 'Remaining Balance After Deposit:'}</span>
                  <span className={`font-mono text-base ${Math.max(0, selectedCustomer.currentBalance - paymentAmount) === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {Math.max(0, selectedCustomer.currentBalance - paymentAmount).toLocaleString()} PKR
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={paymentAmount <= 0}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl font-bold shadow-md active:scale-95 transition-all text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{lang === 'ur' ? 'رقم جمع کریں و رسید نکالیں' : 'Deposit & Print'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECOVERY RECEIPT MODAL (وصولی رسید مع تھرمل پرنٹ اور واٹس ایپ) */}
      {receiptModalOpen && completedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                <h3 className="font-black text-sm">
                  {lang === 'ur' ? 'ادھار وصولی رسید (Payment Receipt)' : 'Khata Payment Receipt'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReceiptModalOpen(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Slip Body */}
            <div id="printable-khata-slip" className="p-5 space-y-3 bg-white text-slate-900 text-xs font-medium">
              <div className="text-center border-b pb-3 space-y-0.5">
                <h2 className="font-black text-base text-slate-900">
                  {businessProfile.nameUr || businessProfile.nameEn}
                </h2>
                <p className="text-[11px] text-slate-600 font-mono">
                  {businessProfile.phone || businessProfile.whatsapp}
                </p>
                {businessProfile.addressUr && (
                  <p className="text-[10px] text-slate-500">{businessProfile.addressUr}</p>
                )}
                <div className="pt-1">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[10px]">
                    کھاتہ وصولی سلپ (Payment Voucher)
                  </span>
                </div>
              </div>

              {/* Receipt Details */}
              <div className="space-y-1.5 py-1 text-[11px] border-b pb-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">رسید نمبر:</span>
                  <span className="font-mono font-bold">{completedReceipt.receiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">تاریخ و وقت:</span>
                  <span className="font-mono">{new Date(completedReceipt.date).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">گاہک کا نام:</span>
                  <span className="font-bold text-slate-900">{completedReceipt.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">موبائل نمبر:</span>
                  <span className="font-mono font-bold">{completedReceipt.customerPhone}</span>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="space-y-2 py-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">سابقہ کل ادھار:</span>
                  <span className="font-mono font-bold">{completedReceipt.previousBalance.toLocaleString()} PKR</span>
                </div>
                <div className="flex justify-between text-sm font-black text-emerald-600 bg-emerald-50 p-2 rounded-xl">
                  <span>وصول شدہ رقم (جمع):</span>
                  <span className="font-mono font-black">{completedReceipt.amountPaid.toLocaleString()} PKR</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 border-t pt-2">
                  <span>نیا باقی بقایا رقم:</span>
                  <span className={`font-mono ${completedReceipt.remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {completedReceipt.remainingBalance.toLocaleString()} PKR
                  </span>
                </div>
              </div>

              <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-dashed">
                <p>بروقت ادائیگی پر آپ کا شکریہ!</p>
                <p className="font-mono">JK Developers Pakistan • 0300-8998381</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800 flex gap-2 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() =>
                  printElement('printable-khata-slip', {
                    format: 'thermal80',
                    isUrdu: true,
                    title: `Payment Receipt #${completedReceipt.receiptNo}`,
                  })
                }
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>پرنٹ رسید (Print)</span>
              </button>

              <button
                type="button"
                onClick={() => sendWhatsAppReceipt(completedReceipt)}
                className="flex-1 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>واٹس ایپ رسید</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {newCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {t('addCustomer')}
            </h3>

            <form onSubmit={handleAddCustomerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  {t('customerName')}:
                </label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder={lang === 'ur' ? 'گاہک کا پورا نام درج کریں' : 'Full Name'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  {t('customerPhone')}:
                </label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  {t('address')}:
                </label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder={lang === 'ur' ? 'پتہ یا علاقہ' : 'Address / Area'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  {lang === 'ur' ? 'ادھار کی حد (کریڈٹ لمٹ):' : 'Credit Limit (PKR):'}
                </label>
                <input
                  type="number"
                  value={custCreditLimit}
                  onChange={(e) => setCustCreditLimit(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewCustomerModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        mode="search"
        onApplySearch={(text) => {
          setSearchQuery(text);
          setVoiceModalOpen(false);
        }}
      />
    </div>
  );
};
