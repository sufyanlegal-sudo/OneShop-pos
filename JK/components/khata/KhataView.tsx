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
  DollarSign,
  TrendingDown,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { Customer } from '@/types';
import { VoiceAssistantModal } from '@/components/VoiceAssistantModal';

export const KhataView: React.FC = () => {
  const { lang, t } = useLanguage();
  const { customers, receiveKhataPayment, addCustomer, businessProfile } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [newCustomerModalOpen, setNewCustomerModalOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDesc, setPaymentDesc] = useState('');

  // New Customer form
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custCreditLimit, setCustCreditLimit] = useState<number>(50000);

  // Selected Customer details
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0] || null;
  }, [customers, selectedCustomerId]);

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

  // Handle Receive Payment
  const handleReceivePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || paymentAmount <= 0) return;

    receiveKhataPayment(
      selectedCustomer.id,
      paymentAmount,
      paymentDesc.trim() || 'نقد وصولی بذریعہ کھاتہ'
    );

    setPaymentModalOpen(false);
    setPaymentAmount(0);
    setPaymentDesc('');
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

  // WhatsApp reminder generator (exact polite template)
  const sendWhatsAppReminder = (cust: Customer) => {
    let cleanPhone = cust.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('03')) {
      cleanPhone = '92' + cleanPhone.substring(1);
    }
    const msg = `محترم ${cust.name} صاحب!
السلام علیکم ورحمۃ اللہ و برکاتہ۔
امید ہے آپ بخیریت ہوں گے۔
آپ کے نام ${businessProfile.nameUr} کے کھاتے میں اس وقت کل واجب الادا رقم ${cust.currentBalance.toLocaleString()} روپے ہے۔
برائے مہربانی سہولت کے مطابق ادائیگی کا انتظام فرما کر تعاون فرمائیں۔
شکریہ!
${businessProfile.nameUr} (${businessProfile.phone})`;

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
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
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
                      <div className="font-black text-xs text-rose-600 dark:text-rose-400 font-mono">
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
              <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
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
                    onClick={() => setPaymentModalOpen(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{t('receivePayment')}</span>
                  </button>

                  <button
                    onClick={() => sendWhatsAppReminder(selectedCustomer)}
                    className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    title="Send Polite WhatsApp Reminder"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t('sendReminder')}</span>
                  </button>
                </div>
              </div>

              {/* Outstanding Balance Banner */}
              <div className="px-4 py-2.5 bg-rose-50/70 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-900/40 flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-800 dark:text-rose-300">
                  {lang === 'ur' ? 'موجودہ کل واجب الادا بقایا رقم:' : 'Current Outstanding Balance:'}
                </span>
                <span className="text-base font-black text-rose-600 dark:text-rose-400 font-mono">
                  {selectedCustomer.currentBalance.toLocaleString()} PKR
                </span>
              </div>

              {/* Khata Entries Table */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="p-3">{t('date')}</th>
                      <th className="p-3">{t('description')}</th>
                      <th className="p-3 text-right">{t('debit')}</th>
                      <th className="p-3 text-right">{t('credit')}</th>
                      <th className="p-3 text-right">{t('runningBalance')}</th>
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
                            {k.type === 'DEBIT' ? `+${k.amount.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {k.type === 'CREDIT' ? `-${k.amount.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {k.balanceAfter.toLocaleString()} PKR
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
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

      {/* Receive Payment Modal */}
      {paymentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {t('receivePayment')}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {selectedCustomer.name} - {lang === 'ur' ? 'کل بقایا:' : 'Total Due:'}{' '}
              <span className="font-bold text-rose-600">
                {selectedCustomer.currentBalance.toLocaleString()} PKR
              </span>
            </p>

            <form onSubmit={handleReceivePayment} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  {lang === 'ur' ? 'وصول شدہ رقم (روپے):' : 'Amount Received (PKR):'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedCustomer.currentBalance}
                  required
                  autoFocus
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  placeholder={selectedCustomer.currentBalance.toString()}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-base outline-none text-emerald-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  {t('description')}:
                </label>
                <input
                  type="text"
                  value={paymentDesc}
                  onChange={(e) => setPaymentDesc(e.target.value)}
                  placeholder={lang === 'ur' ? 'مثلاً: نقد وصولی بذریعہ کیش' : 'e.g. Cash recovery'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
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
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md"
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
