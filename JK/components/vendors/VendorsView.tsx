'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Phone,
  MessageCircle,
  Banknote,
  FileText,
  UserCheck,
  MapPin,
  X,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { useLanguage } from '@/context/LanguageContext';
import { Vendor } from '@/types';

export const VendorsView: React.FC = () => {
  const { vendors, addVendor, updateVendor, payVendor, businessProfile } = useShop();
  const { lang } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVendorForLedger, setSelectedVendorForLedger] = useState<Vendor | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [vendorToPay, setVendorToPay] = useState<Vendor | null>(null);

  // New Vendor Form
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  // Pay Vendor Form
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'CASH' | 'BANK'>('CASH');
  const [payDesc, setPayDesc] = useState('');

  // Handle Add Vendor
  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName && !contactName) return;

    addVendor({
      companyName: companyName || contactName,
      name: contactName || companyName,
      phone,
      whatsapp: whatsapp || phone,
      address,
      openingBalance: Number(openingBalance) || 0,
    });

    setShowAddModal(false);
    setCompanyName('');
    setContactName('');
    setPhone('');
    setWhatsapp('');
    setAddress('');
    setOpeningBalance(0);
  };

  // Handle Payout
  const handlePayVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorToPay || payAmount <= 0) return;

    payVendor(vendorToPay.id, payAmount, payMethod, payDesc || 'سپلائر بل کی ادائیگی');
    setShowPayModal(false);
    setPayAmount(0);
    setPayDesc('');
    setVendorToPay(null);
  };

  // Filter vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const match =
        !searchQuery ||
        v.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.phone.includes(searchQuery);
      return match;
    });
  }, [vendors, searchQuery]);

  const totalPayable = useMemo(() => {
    return vendors.reduce((sum, v) => sum + v.balance, 0);
  }, [vendors]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                {lang === 'ur' ? 'وینڈرز و سپلائرز کھاتہ رجسٹر' : 'Vendors & Suppliers Ledger'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'ur'
                  ? 'ہول سیل ڈیلرز اور سپلائرز کا مکمل کھاتہ، ادائیگیاں اور بقایا جات'
                  : 'Manage supplier accounts, track purchases, payments & outstanding payables'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-950/40 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'ur' ? 'نیا سپلائر شامل کریں' : 'Add New Vendor'}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500">{lang === 'ur' ? 'کل رجسٹرڈ وینڈرز' : 'Total Vendors'}</p>
          <p className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{vendors.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500">{lang === 'ur' ? 'کل واجب الادا رقم (سپلائر قرض)' : 'Total Payables'}</p>
          <p className="text-2xl font-black mt-1 text-amber-600">
            Rs. {totalPayable.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500">{lang === 'ur' ? 'کل کی گئی ادائیگیاں' : 'Total Payouts Done'}</p>
          <p className="text-2xl font-black mt-1 text-emerald-600">
            Rs.{' '}
            {vendors
              .reduce(
                (sum, v) =>
                  sum +
                  v.khata
                    .filter((k) => k.type === 'PAYMENT')
                    .reduce((kSum, k) => kSum + k.amount, 0),
                0
              )
              .toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ur' ? 'سپلائر تلاش کریں (نام، کمپنی، فون)...' : 'Search vendors (name, company, phone)...'}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
            {lang === 'ur' ? 'کوئی سپلائر نہیں ملا' : 'No vendors found'}
          </div>
        ) : (
          filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 hover:border-blue-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      {vendor.companyName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      رابطہ شخص: {vendor.name}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                      vendor.balance > 0
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    Rs. {vendor.balance.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1.5 pt-3 text-xs text-slate-600 dark:text-slate-400">
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-500" />
                    <span>{vendor.phone}</span>
                  </p>
                  {vendor.address && (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{vendor.address}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                {/* Pay Button */}
                <button
                  onClick={() => {
                    setVendorToPay(vendor);
                    setPayAmount(vendor.balance > 0 ? vendor.balance : 0);
                    setShowPayModal(true);
                  }}
                  className="py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1 shadow-sm"
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>{lang === 'ur' ? 'ادائیگی' : 'Pay'}</span>
                </button>

                {/* Ledger View Button */}
                <button
                  onClick={() => setSelectedVendorForLedger(vendor)}
                  className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{lang === 'ur' ? 'لیجر' : 'Khata'}</span>
                </button>

                {/* WhatsApp Button */}
                <a
                  href={`https://wa.me/92${vendor.phone.replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(
                    `محترم ${vendor.companyName}! ${businessProfile.nameUr} کی جانب سے آپ کے کھاتے کی تفصیل: موجودہ بقایا واجب الادا رقم: ${vendor.balance.toLocaleString()} روپے ہے۔ شکریہ!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center gap-1 border border-emerald-500/30"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 text-white shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black">
                {lang === 'ur' ? 'نیا سپلائر / وینڈر درج کریں' : 'Register New Vendor'}
              </h2>
            </div>

            <form onSubmit={handleAddVendor} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === 'ur' ? 'کمپنی / ڈسٹری بیوشن کا نام *' : 'Company / Firm Name *'}
                </label>
                <input
                  required
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="مثلاً: المدینہ گڈز ایجنسی"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === 'ur' ? 'ڈیلر / رابطہ کار کا نام' : 'Contact Person Name'}
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="حاجی طارق صاحب"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {lang === 'ur' ? 'فون نمبر *' : 'Phone Number *'}
                  </label>
                  <input
                    required
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {lang === 'ur' ? 'ابتدائی بقایا (Opening Balance)' : 'Opening Balance (Rs)'}
                  </label>
                  <input
                    type="number"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === 'ur' ? 'ایڈریس / منڈی' : 'Address / Market Location'}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="دکان 5، غلہ منڈی لاہور"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  {lang === 'ur' ? 'منسوخ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-950/50"
                >
                  {lang === 'ur' ? 'محفوظ کریں' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Vendor Modal */}
      {showPayModal && vendorToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 text-white shadow-2xl relative">
            <button
              onClick={() => setShowPayModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl">
                <Banknote className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black">
                  {lang === 'ur' ? 'سپلائر کو رقم کی ادائیگی' : 'Payout to Supplier'}
                </h2>
                <p className="text-xs text-slate-400">{vendorToPay.companyName}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 mb-4 flex justify-between items-center text-xs">
              <span className="text-slate-400">{lang === 'ur' ? 'موجودہ واجب الادا بقایا:' : 'Current Payable:'}</span>
              <span className="font-mono text-base font-bold text-amber-400">
                Rs. {vendorToPay.balance.toLocaleString()}
              </span>
            </div>

            <form onSubmit={handlePayVendor} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === 'ur' ? 'ادائیگی رقم (Amount in PKR) *' : 'Payment Amount *'}
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full text-center text-xl font-mono py-2 bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === 'ur' ? 'طریقہ ادائیگی' : 'Payment Method'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('CASH')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      payMethod === 'CASH'
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {lang === 'ur' ? 'نقد (Cash Out)' : 'Cash'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('BANK')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      payMethod === 'BANK'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {lang === 'ur' ? 'بینک ٹرانسفر (Online)' : 'Bank Transfer'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === 'ur' ? 'تفصیل یا رسید نمبر' : 'Notes / Slip #'}
                </label>
                <input
                  type="text"
                  value={payDesc}
                  onChange={(e) => setPayDesc(e.target.value)}
                  placeholder="چیک نمبر یا کیش رسید"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  {lang === 'ur' ? 'منسوخ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/50"
                >
                  {lang === 'ur' ? 'ادائیگی مکمل کریں' : 'Confirm Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Ledger Modal */}
      {selectedVendorForLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col text-white shadow-2xl relative overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-blue-400">
                  {selectedVendorForLedger.companyName}
                </h2>
                <p className="text-xs text-slate-400">
                  {lang === 'ur' ? 'سپلائر کھاتہ لیجر ہسٹری' : 'Supplier Ledger History'}
                </p>
              </div>
              <button
                onClick={() => setSelectedVendorForLedger(null)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">{lang === 'ur' ? 'کل واجب الادا رقم:' : 'Balance Due:'}</span>
                  <p className="text-2xl font-black text-amber-400 font-mono">
                    Rs. {selectedVendorForLedger.balance.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{lang === 'ur' ? 'پرنٹ کھاتہ' : 'Print Ledger'}</span>
                </button>
              </div>

              {/* Transactions List */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3 text-right">{lang === 'ur' ? 'تاریخ' : 'Date'}</th>
                      <th className="p-3 text-right">{lang === 'ur' ? 'تفصیل' : 'Description'}</th>
                      <th className="p-3 text-center">{lang === 'ur' ? 'قسم' : 'Type'}</th>
                      <th className="p-3 text-left">{lang === 'ur' ? 'رقم' : 'Amount'}</th>
                      <th className="p-3 text-left">{lang === 'ur' ? 'بقایا بعد' : 'Balance'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {selectedVendorForLedger.khata.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500">
                          {lang === 'ur' ? 'کوئی ٹرانزیکشن موجود نہیں' : 'No entries found'}
                        </td>
                      </tr>
                    ) : (
                      selectedVendorForLedger.khata.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-800/40">
                          <td className="p-3 text-slate-400 font-mono text-[11px]">
                            {new Date(entry.date).toLocaleDateString('en-PK')}
                          </td>
                          <td className="p-3 font-medium">{entry.description}</td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                entry.type === 'PURCHASE'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}
                            >
                              {entry.type === 'PURCHASE'
                                ? lang === 'ur'
                                  ? 'خریداری'
                                  : 'Purchase'
                                : lang === 'ur'
                                ? 'ادائیگی'
                                : 'Payment'}
                            </span>
                          </td>
                          <td className="p-3 text-left font-mono font-bold">
                            Rs. {entry.amount.toLocaleString()}
                          </td>
                          <td className="p-3 text-left font-mono text-amber-400 font-bold">
                            Rs. {entry.balanceAfter.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 text-center text-[11px] text-slate-500 font-mono">
              OneShop POS • JK Developers Pakistan
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
