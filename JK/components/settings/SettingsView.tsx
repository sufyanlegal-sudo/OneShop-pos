'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Check,
  RotateCcw,
  Download,
  Upload,
  Lock,
  Building2,
  Phone,
  MapPin,
  Sparkles,
  ShieldCheck,
  Monitor,
  Users,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  History,
  Truck,
  BookOpen,
  Boxes,
  UserPlus,
  BarChart3,
  MessageSquare,
  KeyRound,
  Image as ImageIcon,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { storage } from '@/lib/storage';
import { CashierAccount, CashierModulePermissions } from '@/types';

export const SettingsView: React.FC = () => {
  const { lang, t } = useLanguage();
  const {
    businessProfile,
    updateBusinessProfile,
    resetSystemData,
    activePreset,
    cashierAccounts,
    saveCashiers,
    updateCashierAccount,
    cashierPermissions,
    updateCashierPermissions,
  } = useShop();

  const [activeTab, setActiveTab] = useState<'identity' | 'permissions' | 'counters' | 'backup'>('identity');

  // Business profile form
  const [form, setForm] = useState({
    softwareName: 'OneShop POS',
    nameEn: businessProfile.nameEn,
    nameUr: businessProfile.nameUr,
    taglineEn: businessProfile.taglineEn,
    taglineUr: businessProfile.taglineUr,
    addressEn: businessProfile.addressEn,
    addressUr: businessProfile.addressUr,
    branch: businessProfile.branch,
    phone: businessProfile.phone,
    whatsapp: businessProfile.whatsapp,
    ntn: businessProfile.ntn,
    logoUrl: businessProfile.logoUrl || '',
    adminPin: businessProfile.adminPin || '1234',
    backupEmail: businessProfile.backupEmail || '',
    autoDailyBackup: businessProfile.autoDailyBackup ?? true,
  });

  // Local cashier permissions copy
  const [localPerms, setLocalPerms] = useState<CashierModulePermissions>(cashierPermissions);

  // Local 10 counters copy
  const [localCounters, setLocalCounters] = useState<CashierAccount[]>(cashierAccounts);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [permsSavedSuccess, setPermsSavedSuccess] = useState(false);
  const [countersSavedSuccess, setCountersSavedSuccess] = useState(false);

  useEffect(() => {
    setForm({
      softwareName: 'OneShop POS',
      nameEn: businessProfile.nameEn,
      nameUr: businessProfile.nameUr,
      taglineEn: businessProfile.taglineEn,
      taglineUr: businessProfile.taglineUr,
      addressEn: businessProfile.addressEn,
      addressUr: businessProfile.addressUr,
      branch: businessProfile.branch,
      phone: businessProfile.phone,
      whatsapp: businessProfile.whatsapp,
      ntn: businessProfile.ntn,
      logoUrl: businessProfile.logoUrl || '',
      adminPin: businessProfile.adminPin || '1234',
      backupEmail: businessProfile.backupEmail || '',
      autoDailyBackup: businessProfile.autoDailyBackup ?? true,
    });
  }, [businessProfile]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert(lang === 'ur' ? 'لوگو کا سائز 2MB سے کم ہونا چاہیے' : 'Logo size must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setForm((prev) => ({ ...prev, logoUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    setLocalPerms(cashierPermissions);
  }, [cashierPermissions]);

  useEffect(() => {
    setLocalCounters(cashierAccounts);
  }, [cashierAccounts]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessProfile(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handlePermsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCashierPermissions(localPerms);
    setPermsSavedSuccess(true);
    setTimeout(() => setPermsSavedSuccess(false), 3000);
  };

  const applyPermissionPreset = (preset: 'only_pos' | 'pos_khata' | 'pos_stock' | 'full') => {
    if (preset === 'only_pos') {
      setLocalPerms({
        pos: true,
        canDiscount: false,
        maxDiscountAmount: 0,
        canReturn: false,
        canViewCostMargin: false,
        billsHistory: true,
        grn: false,
        vendors: false,
        roznamcha: false,
        khata: false,
        inventory: false,
        staff: false,
        reports: false,
        audit: false,
        whatsapp: false,
        settings: false,
      });
    } else if (preset === 'pos_khata') {
      setLocalPerms({
        pos: true,
        canDiscount: false,
        maxDiscountAmount: 100,
        canReturn: false,
        canViewCostMargin: false,
        billsHistory: true,
        grn: false,
        vendors: false,
        roznamcha: false,
        khata: true,
        inventory: false,
        staff: false,
        reports: false,
        audit: false,
        whatsapp: false,
        settings: false,
      });
    } else if (preset === 'pos_stock') {
      setLocalPerms({
        pos: true,
        canDiscount: true,
        maxDiscountAmount: 200,
        canReturn: true,
        canViewCostMargin: false,
        billsHistory: true,
        grn: false,
        vendors: false,
        roznamcha: false,
        khata: false,
        inventory: true,
        staff: false,
        reports: false,
        audit: false,
        whatsapp: false,
        settings: false,
      });
    } else if (preset === 'full') {
      setLocalPerms({
        pos: true,
        canDiscount: true,
        maxDiscountAmount: 1000,
        canReturn: true,
        canViewCostMargin: true,
        billsHistory: true,
        grn: true,
        vendors: true,
        roznamcha: true,
        khata: true,
        inventory: true,
        staff: true,
        reports: true,
        audit: true,
        whatsapp: true,
        settings: true,
      });
    }
  };

  const handleCounterChange = (id: string, field: keyof CashierAccount, value: any) => {
    setLocalCounters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSaveAllCounters = () => {
    saveCashiers(localCounters);
    setCountersSavedSuccess(true);
    setTimeout(() => setCountersSavedSuccess(false), 3000);
  };

  const handleExportBackup = () => {
    const jsonStr = storage.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `JK_ERP_Backup_${activePreset}_${Date.now()}.json`;
    link.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storage.importBackup(content);
      if (success) {
        alert(
          lang === 'ur'
            ? 'ڈیٹا کامیابی سے بحال ہو گیا ہے! صفحہ ریفریش ہو رہا ہے۔'
            : 'Backup restored successfully! Reloading...'
        );
        window.location.reload();
      } else {
        alert(lang === 'ur' ? 'فائل درست نہیں ہے!' : 'Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-2xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {t('businessSettings')}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'ur'
                ? 'شاپ کا نام، سافٹ ویئر برانڈنگ، 10 کاؤنٹرز اور کیشیئر کے اختیارات کی ترتیبات'
                : 'Configure Shop Name, Software Branding, 10 Counters & Cashier Permissions'}
            </p>
          </div>
        </div>

        {/* Preset & Admin Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1 bg-purple-100 dark:bg-purple-950/70 border border-purple-300 dark:border-purple-800 rounded-xl text-purple-700 dark:text-purple-300">
            👑 Admin Control
          </span>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
            {activePreset.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('identity')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'identity'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{lang === 'ur' ? '1. شاپ و سافٹ ویئر کی شناخت' : '1. Shop & Software Identity'}</span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'permissions'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'ur' ? '2. کیشیئر کے اختیارات (Permissions)' : '2. Cashier Permissions'}</span>
        </button>

        <button
          onClick={() => setActiveTab('counters')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'counters'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>{lang === 'ur' ? '3. 10 کاؤنٹرز و کیشیئرز سیٹ اپ' : '3. 10 Counters & Cashiers'}</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'backup'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>{lang === 'ur' ? '4. بیک اپ و ری سیٹ' : '4. Backup & Reset'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SHOP & SOFTWARE IDENTITY                                          */}
      {/* ========================================================================= */}
      {activeTab === 'identity' && (
        <form
          onSubmit={handleProfileSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 text-xs"
        >
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300">
            <span className="font-bold block mb-1">
              {lang === 'ur' ? '💡 اہم معلومات:' : '💡 Important Note:'}
            </span>
            {lang === 'ur'
              ? 'یہاں لکھا گیا دکان کا نام بل اور رسید پر خودکار پرنٹ ہوگا، جبکہ سافٹ ویئر کا نام ڈیش بورڈ، ہیڈر اور رسید کے فوٹر پر نمایاں ہوگا۔'
              : 'The Shop Name configured here prints on customer receipts/invoices. The Software Name displays on dashboard header and footer.'}
          </div>

          {/* PERMANENT LOCKED SOFTWARE & DEVELOPER IDENTITY (Non-editable by client) */}
          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                {lang === 'ur' ? 'سافٹ ویئر کا مستقل نام (سسٹم ڈیفالٹ):' : 'Official Software Brand (System Default):'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {lang === 'ur' ? 'محفوظ و ناقابلِ تبدیلی' : 'Locked & Permanent'}
              </span>
            </div>
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
              <span>OneShop POS</span>
              <span className="text-[10px] text-slate-400 font-sans font-normal hidden sm:inline">
                Enterprise Multi-Counter POS & ERP
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                {lang === 'ur' ? 'آفیشل ڈویلپر ادارہ:' : 'Official Developer Organization:'}
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400 font-sans">
                JK Developers Pakistan <span className="text-slate-400 font-mono text-[11px]">(03008998381)</span>
              </span>
            </div>
          </div>

          {/* SHOP LOGO UPLOAD (FOR RECEIPT & INVOICE PRINTING) */}
          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-xs">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                {lang === 'ur' ? 'دکان کا لوگو برائے بل و رسید (Shop Logo):' : 'Shop Logo for Receipts & Invoices:'}
              </label>
              {form.logoUrl && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, logoUrl: '' })}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold"
                >
                  {lang === 'ur' ? 'لوگو ہٹائیں (Remove)' : 'Remove Logo'}
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {form.logoUrl ? (
                <div className="relative w-20 h-20 rounded-xl border-2 border-emerald-500 p-1 bg-white overflow-hidden shadow-sm flex items-center justify-center">
                  <img src={form.logoUrl} alt="Shop Logo" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 text-[10px] bg-white dark:bg-slate-900">
                  <ImageIcon className="w-6 h-6 mb-1 text-slate-400" />
                  <span>لوگو نہیں ہے</span>
                </div>
              )}

              <div className="flex-1 min-w-[200px] space-y-1.5">
                <input
                  type="file"
                  accept="image/*"
                  id="shop-logo-file-input"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <label
                  htmlFor="shop-logo-file-input"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {form.logoUrl
                      ? (lang === 'ur' ? 'لوگو تبدیل کریں (Change Logo)' : 'Change Logo')
                      : (lang === 'ur' ? 'شاپ کا لوگو منتخب کریں (Upload Logo)' : 'Upload Shop Logo')}
                  </span>
                </label>
                <p className="text-[11px] text-slate-500">
                  {lang === 'ur'
                    ? 'PNG یا JPG تصویر منتخب کریں۔ بل پرنٹنگ کے وقت دکان کے نام کے ساتھ یہ لوگو خودکار پرنٹ ہوگا۔'
                    : 'Select PNG or JPG file. This logo will print on receipts alongside the shop name.'}
                </p>
              </div>
            </div>
          </div>

          {/* Shop Name in Urdu & English */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('businessNameUr')} (دکان کا نام اردو - بل پر پرنٹ ہوگا):
              </label>
              <input
                type="text"
                required
                value={form.nameUr}
                onChange={(e) => setForm({ ...form, nameUr: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-nastaliq text-base outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('businessNameEn')} (Shop Name English - Printed on Bill):
              </label>
              <input
                type="text"
                required
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-semibold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                سلوگن / ٹیگ لائن (اردو):
              </label>
              <input
                type="text"
                value={form.taglineUr}
                onChange={(e) => setForm({ ...form, taglineUr: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 font-nastaliq outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Tagline / Slogan (English):
              </label>
              <input
                type="text"
                value={form.taglineEn}
                onChange={(e) => setForm({ ...form, taglineEn: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('address')} (پتہ برائے بل):
              </label>
              <input
                type="text"
                value={form.addressUr}
                onChange={(e) => setForm({ ...form, addressUr: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 font-nastaliq outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('branch')}:
              </label>
              <input
                type="text"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 outline-none font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('phone')}:
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 font-mono outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('whatsappNumber')}:
              </label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 font-mono outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('ntnNumber')}:
              </label>
              <input
                type="text"
                value={form.ntn}
                onChange={(e) => setForm({ ...form, ntn: e.target.value })}
                placeholder="NTN-XXXXXXX-X"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 font-mono outline-none"
              />
            </div>
          </div>

          {/* Admin PIN Setting */}
          <div className="bg-purple-50/60 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-purple-600" />
                <span>خفیہ ایڈمن لاگ ان پن کوڈ (Admin PIN)</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                {lang === 'ur'
                  ? 'ایڈمن موڈ کو ان لاک کرنے، حساس ماڈیولز دیکھنے اور نفع چیک کرنے کا کوڈ (ڈیفالٹ: 1234)'
                  : 'PIN required to unlock admin mode, modify sensitive settings, and view profit'}
              </p>
            </div>

            <input
              type="password"
              maxLength={10}
              value={form.adminPin}
              onChange={(e) => setForm({ ...form, adminPin: e.target.value })}
              className="w-32 text-center text-lg tracking-widest font-mono font-bold bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-xl py-1.5 outline-none text-purple-600"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            {savedSuccess && (
              <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>{lang === 'ur' ? 'شاپ و سافٹ ویئر کی ترتیبات محفوظ ہوگئیں!' : 'Saved successfully!'}</span>
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all text-sm"
              >
                <Save className="w-4 h-4" />
                <span>{t('saveSettings')}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CASHIER PERMISSIONS & ACCESS CONTROL                              */}
      {/* ========================================================================= */}
      {activeTab === 'permissions' && (
        <form
          onSubmit={handlePermsSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 text-xs"
        >
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>{lang === 'ur' ? 'کیشیئر اختیارات کنٹرول (Granular Permissions)' : 'Cashier Access Control'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'ur'
                ? 'مین لاگ ان ہمیشہ ایڈمن کے پاس ہوگا۔ یہاں منتخب کریں کہ کیشیئر کو کون کون سی چیزوں کی ایکسس دینی ہے اور کون سی لاک رکھنی ہیں۔'
                : 'Admin holds master access. Select which modules and features the cashier counters are allowed to use.'}
            </p>
          </div>

          {/* 1-Click Quick Permission Presets */}
          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
              {lang === 'ur' ? '⚡ فوری اجازت نامہ پری سیٹ (1-Click Presets):' : '⚡ Quick Presets:'}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => applyPermissionPreset('only_pos')}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-emerald-50 hover:border-emerald-500 font-bold text-slate-700 dark:text-slate-200 transition-all"
              >
                🛒 {lang === 'ur' ? 'صرف بل بنانا (POS & History)' : 'Only Billing (POS)'}
              </button>

              <button
                type="button"
                onClick={() => applyPermissionPreset('pos_khata')}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-emerald-50 hover:border-emerald-500 font-bold text-slate-700 dark:text-slate-200 transition-all"
              >
                👥 {lang === 'ur' ? 'بلنگ + ادھار کھاتہ (POS + Khata)' : 'Billing + Customer Khata'}
              </button>

              <button
                type="button"
                onClick={() => applyPermissionPreset('pos_stock')}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-emerald-50 hover:border-emerald-500 font-bold text-slate-700 dark:text-slate-200 transition-all"
              >
                📦 {lang === 'ur' ? 'بلنگ + اسٹاک + ڈسکاؤنٹ (POS + Stock)' : 'Billing + Inventory'}
              </button>

              <button
                type="button"
                onClick={() => applyPermissionPreset('full')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-all shadow-sm"
              >
                👑 {lang === 'ur' ? 'تمام اختیارات دیں (Full Access)' : 'Full Access'}
              </button>
            </div>
          </div>

          {/* Detailed Permissions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 1. POS Terminal */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 cursor-pointer hover:border-emerald-500 transition-all">
              <input
                type="checkbox"
                checked={localPerms.pos}
                onChange={(e) => setLocalPerms({ ...localPerms, pos: e.target.checked })}
                className="mt-1 w-4 h-4 text-emerald-600 rounded"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-500" />
                  <span>{lang === 'ur' ? 'بلنگ ٹرمینل (POS Terminal)' : 'POS Billing Terminal'}</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  {lang === 'ur' ? 'کاؤنٹر پر بل بنانا، کیش اور آن لائن ادائیگی وصول کرنا' : 'Create invoices, scan barcode, take cash'}
                </p>
              </div>
            </label>

            {/* 2. Discount Permission */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPerms.canDiscount}
                  onChange={(e) => setLocalPerms({ ...localPerms, canDiscount: e.target.checked })}
                  className="mt-1 w-4 h-4 text-emerald-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {lang === 'ur' ? 'ڈسکاؤنٹ دینے کی اجازت (Allow Discount)' : 'Allow Discount on Bill'}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'ur' ? 'اگر ان چیک ہو تو کیشیئر بل پر رعایت نہیں دے سکے گا' : 'Cashier cannot discount unless checked'}
                  </p>
                </div>
              </label>

              {localPerms.canDiscount && (
                <div className="flex items-center gap-2 pl-7 pt-1 text-xs">
                  <span className="text-slate-600 dark:text-slate-400">
                    {lang === 'ur' ? 'زیادہ سے زیادہ اجازت شدہ رعایت (PKR):' : 'Max Allowed Discount:'}
                  </span>
                  <input
                    type="number"
                    value={localPerms.maxDiscountAmount || 0}
                    onChange={(e) =>
                      setLocalPerms({
                        ...localPerms,
                        maxDiscountAmount: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    className="w-24 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold outline-none"
                  />
                </div>
              )}
            </div>

            {/* 3. Sale Return */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 cursor-pointer hover:border-emerald-500 transition-all">
              <input
                type="checkbox"
                checked={localPerms.canReturn}
                onChange={(e) => setLocalPerms({ ...localPerms, canReturn: e.target.checked })}
                className="mt-1 w-4 h-4 text-emerald-600 rounded"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {lang === 'ur' ? 'سیل ریٹرن و واپسی (Process Return)' : 'Process Sale Return & Refund'}
                </span>
                <p className="text-[11px] text-slate-500">
                  {lang === 'ur' ? 'پرانا بل واپس لینا اور رقم ریفنڈ کرنا' : 'Authorize refunds and stock returns'}
                </p>
              </div>
            </label>

            {/* 4. Cost Price & Margins */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 cursor-pointer hover:border-emerald-500 transition-all">
              <input
                type="checkbox"
                checked={localPerms.canViewCostMargin}
                onChange={(e) => setLocalPerms({ ...localPerms, canViewCostMargin: e.target.checked })}
                className="mt-1 w-4 h-4 text-emerald-600 rounded"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {lang === 'ur' ? 'خرید قیمت اور نفع مارجن دیکھنا (Cost & Profit Margin)' : 'View Cost Price & Profit'}
                </span>
                <p className="text-[11px] text-slate-500">
                  {lang === 'ur' ? 'اگر ان چیک ہو تو کیشیئر سے اصل خرید قیمت اور منافع چھپا رہے گا' : 'Keep original purchase cost and profits secret'}
                </p>
              </div>
            </label>

            {/* 5. Bills History */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 cursor-pointer hover:border-emerald-500 transition-all">
              <input
                type="checkbox"
                checked={localPerms.billsHistory}
                onChange={(e) => setLocalPerms({ ...localPerms, billsHistory: e.target.checked })}
                className="mt-1 w-4 h-4 text-emerald-600 rounded"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-500" />
                  <span>{lang === 'ur' ? 'بل ہسٹری دیکھنا (Bills History)' : 'Bills & Invoices History'}</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  {lang === 'ur' ? 'پرانے بلز دیکھنا اور دوبارہ پرنٹ نکالنا' : 'View past invoices and re-print receipts'}
                </p>
              </div>
            </label>

            {/* 6. Inventory & Stock */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 cursor-pointer hover:border-emerald-500 transition-all">
              <input
                type="checkbox"
                checked={localPerms.inventory}
                onChange={(e) => setLocalPerms({ ...localPerms, inventory: e.target.checked })}
                className="mt-1 w-4 h-4 text-emerald-600 rounded"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-amber-500" />
                  <span>{lang === 'ur' ? 'اسٹاک و پروڈکٹس رجسٹر (Inventory & Stock)' : 'Stock & Inventory Management'}</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  {lang === 'ur' ? 'پروڈکٹس دیکھنا، نئی پروڈکٹ شامل کرنا یا ریٹ تبدیل کرنا' : 'Add products, update stock and prices'}
                </p>
              </div>
            </label>

            {/* 7. Khata Ledger */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 cursor-pointer hover:border-emerald-500 transition-all">
              <input
                type="checkbox"
                checked={localPerms.khata}
                onChange={(e) => setLocalPerms({ ...localPerms, khata: e.target.checked })}
                className="mt-1 w-4 h-4 text-emerald-600 rounded"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-500" />
                  <span>{lang === 'ur' ? 'گاہکوں کا ادھار کھاتہ (Customer Khata)' : 'Customer Credit Khata Ledger'}</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  {lang === 'ur' ? 'گاہکوں کا ادھار، بقایا اور وصولی درج کرنا' : 'View customer receivables and payments'}
                </p>
              </div>
            </label>

            {/* 8. Roznamcha Cashbook */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 cursor-pointer hover:border-emerald-500 transition-all">
              <input
                type="checkbox"
                checked={localPerms.roznamcha}
                onChange={(e) => setLocalPerms({ ...localPerms, roznamcha: e.target.checked })}
                className="mt-1 w-4 h-4 text-emerald-600 rounded"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <span>{lang === 'ur' ? 'روزنامچہ کیش بک (Roznamcha Register)' : 'Daily Cashbook & Roznamcha'}</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  {lang === 'ur' ? 'دکان کے روزانہ اخراجات، کیش اِن اور کیش آؤٹ' : 'Daily expenses and cash tracking'}
                </p>
              </div>
            </label>

            {/* 9. Vendors & GRN */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 cursor-pointer hover:border-emerald-500 transition-all">
              <input
                type="checkbox"
                checked={localPerms.vendors}
                onChange={(e) => setLocalPerms({ ...localPerms, vendors: e.target.checked, grn: e.target.checked })}
                className="mt-1 w-4 h-4 text-emerald-600 rounded"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-teal-500" />
                  <span>{lang === 'ur' ? 'سپلائرز اور مال وصولی (Vendors & GRN)' : 'Suppliers & Goods Received (GRN)'}</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  {lang === 'ur' ? 'ہول سیلرز کا کھاتہ اور مال کی پرچیز انٹری' : 'Manage supplier balances and purchases'}
                </p>
              </div>
            </label>

            {/* 10. Staff & Payroll */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 cursor-pointer hover:border-emerald-500 transition-all">
              <input
                type="checkbox"
                checked={localPerms.staff}
                onChange={(e) => setLocalPerms({ ...localPerms, staff: e.target.checked })}
                className="mt-1 w-4 h-4 text-emerald-600 rounded"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-pink-500" />
                  <span>{lang === 'ur' ? 'سٹاف اور تنخواہ رجسٹر (Staff Payroll)' : 'Staff & Salary Register'}</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  {lang === 'ur' ? 'ملازمین کا ریکارڈ اور ماہانہ تنخواہ کی ادائیگی' : 'Employee list and monthly payroll'}
                </p>
              </div>
            </label>

            {/* 11. Reports & Analytics */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 cursor-pointer hover:border-emerald-500 transition-all">
              <input
                type="checkbox"
                checked={localPerms.reports}
                onChange={(e) => setLocalPerms({ ...localPerms, reports: e.target.checked })}
                className="mt-1 w-4 h-4 text-emerald-600 rounded"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  <span>{lang === 'ur' ? 'رپورٹس اور نفع و نقصان (Reports)' : 'Reports & Net Profit'}</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  {lang === 'ur' ? 'دکان کی مجموعی سیل، خالص نفع اور کاروباری تجزیہ' : 'Sales analytics and financial profit'}
                </p>
              </div>
            </label>

            {/* 12. Settings Access */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 cursor-pointer hover:border-emerald-500 transition-all">
              <input
                type="checkbox"
                checked={localPerms.settings}
                onChange={(e) => setLocalPerms({ ...localPerms, settings: e.target.checked })}
                className="mt-1 w-4 h-4 text-emerald-600 rounded"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-slate-600" />
                  <span>{lang === 'ur' ? 'سیٹنگز ماڈیول (Settings Module)' : 'Access Settings Module'}</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  {lang === 'ur' ? 'سسٹم سیٹنگز اور کنفیگریشن میں داخلہ' : 'Open system settings and configurations'}
                </p>
              </div>
            </label>
          </div>

          {/* Action button */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            {permsSavedSuccess && (
              <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>{lang === 'ur' ? 'کیشیئر کے اختیارات محفوظ ہوگئے!' : 'Permissions updated!'}</span>
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all text-sm"
              >
                <Save className="w-4 h-4" />
                <span>{lang === 'ur' ? 'اختیارات محفوظ کریں' : 'Save Permissions'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: 10 MULTI-COUNTERS & CASHIERS MANAGEMENT                           */}
      {/* ========================================================================= */}
      {activeTab === 'counters' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Monitor className="w-5 h-5 text-emerald-500" />
                <span>{lang === 'ur' ? '10 کاؤنٹرز و کیشیئرز کا نظام (Multi-Counter System)' : '10 Cashier Counters Configuration'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'ur'
                  ? 'بیک وقت 10 کیشیئرز کام کر سکتے ہیں۔ ہر کاؤنٹر کا الگ پن کوڈ ہے اور بل پر کاؤنٹر نمبر اور کیشیئر کا نام پرنٹ ہوتا ہے۔'
                  : 'Manage up to 10 active billing counters. Each counter has its own PIN and appears separately in manager reports.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveAllCounters}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{lang === 'ur' ? 'تمام کاؤنٹرز محفوظ کریں' : 'Save All Counters'}</span>
            </button>
          </div>

          {countersSavedSuccess && (
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{lang === 'ur' ? 'تمام 10 کاؤنٹرز کی معلومات اور پن کوڈز کامیابی سے محفوظ ہو گئے ہیں!' : 'All 10 counter profiles updated!'}</span>
            </div>
          )}

          {/* Table / Grid of 10 Counters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localCounters.slice(0, 10).map((c, idx) => (
              <div
                key={c.id}
                className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-mono font-black text-xs flex items-center justify-center shadow-sm">
                      #{c.counterNumber}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {lang === 'ur' ? `کاؤنٹر نمبر ${c.counterNumber}` : `Counter #${c.counterNumber}`}
                    </span>
                  </div>

                  {/* Status Toggle */}
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span className="text-[10px] text-slate-500 font-bold">
                      {c.status === 'ACTIVE' ? (lang === 'ur' ? 'فعال' : 'Active') : (lang === 'ur' ? 'غیر فعال' : 'Disabled')}
                    </span>
                    <input
                      type="checkbox"
                      checked={c.status === 'ACTIVE'}
                      onChange={(e) =>
                        handleCounterChange(c.id, 'status', e.target.checked ? 'ACTIVE' : 'INACTIVE')
                      }
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">
                      {lang === 'ur' ? 'کیشیئر کا نام:' : 'Cashier Name:'}
                    </label>
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => handleCounterChange(c.id, 'name', e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">
                      {lang === 'ur' ? 'خفیہ لاگ ان پن (PIN):' : 'Secret PIN:'}
                    </label>
                    <input
                      type="password"
                      maxLength={10}
                      value={c.pin}
                      onChange={(e) => handleCounterChange(c.id, 'pin', e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold tracking-widest text-center outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">
                    {lang === 'ur' ? 'کیشیئر کا فون نمبر (اختیاری):' : 'Cashier Contact Phone:'}
                  </label>
                  <input
                    type="text"
                    value={c.phone || ''}
                    onChange={(e) => handleCounterChange(c.id, 'phone', e.target.value)}
                    placeholder="0300-XXXXXXX"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSaveAllCounters}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all text-sm"
            >
              <Save className="w-4 h-4" />
              <span>{lang === 'ur' ? 'تمام کاؤنٹرز محفوظ کریں' : 'Save All Counters'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DATA BACKUP & RESTORE                                              */}
      {/* ========================================================================= */}
      {activeTab === 'backup' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 text-xs">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {lang === 'ur' ? 'ڈیٹا بیک اپ و بحالی (Backup & Restore)' : 'Data Backup & Restore'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'ur'
                ? 'مکمل دکان کا ریکارڈ، 10 کاؤنٹرز، گاہک، اسٹاک، انوائسز اور روزنامچہ کو ایک کلک پر محفوظ یا بحال کریں'
                : 'Export or import your entire ERP database with a single click'}
            </p>
          </div>

          {/* Gmail Auto Backup Setting */}
          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>{lang === 'ur' ? 'جی میل آٹو ڈیٹا بیک اپ ایڈریس' : 'Gmail Auto Backup Address'}</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {lang === 'ur'
                    ? 'دکان دار کا ذاتی جی میل جس پر روزانہ تمام کھاتوں کا ڈیٹا خودکار بھیجا جائے گا'
                    : 'Owner Gmail address where daily automated backup files will be dispatched'}
                </p>
              </div>

              <input
                type="email"
                value={form.backupEmail}
                onChange={(e) => setForm({ ...form, backupEmail: e.target.value })}
                placeholder="shopowner@gmail.com"
                className="w-full sm:w-72 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono outline-none"
              />
            </div>
          </div>

          {/* Export / Import Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleExportBackup}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'ur' ? 'مکمل بیک اپ فائل ڈاؤن لوڈ کریں' : 'Export Full Backup'}</span>
            </button>

            <label className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>{lang === 'ur' ? 'بیک اپ فائل اپلوڈ کریں' : 'Import Backup JSON'}</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>

            <button
              onClick={() => {
                if (
                  confirm(
                    lang === 'ur'
                      ? 'کیا آپ تمام ڈیٹا کو اصل حالت پر بحال کرنا چاہتے ہیں؟'
                      : 'Reset all data to seed defaults?'
                  )
                ) {
                  resetSystemData();
                  window.location.reload();
                }
              }}
              className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-400 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ml-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{lang === 'ur' ? 'تمام ڈیٹا ری سیٹ کریں' : 'Reset to Default Seed'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Official Developer Helpline Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-mono font-black text-lg">
              {businessProfile.softwareName || 'OneShop POS'} • JK Developers Pakistan
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              Official Helpline
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            سافٹ ویئر کی تیاری، نئی خصوصیات، تھرمل پرنٹر انسٹالیشن اور ٹریننگ کے لیے براہِ راست رابطہ کریں۔
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/923008998381?text=السلام%20علیکم!%20مجھے%20OneShop%20POS%20(جے%20کے%20ڈویلپرز%20پاکستان)%20کی%20سپورٹ%20درکار%20ہے۔"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50"
          >
            <span>WhatsApp: 03008998381</span>
          </a>
        </div>
      </div>
    </div>
  );
};
