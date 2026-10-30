'use client';

import React, { useState } from 'react';
import { useShop } from '@/context/ShopContext';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Lock,
  Phone,
  LogOut,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  CloudDownload,
  Database,
  RefreshCw,
  FolderOpen,
  Calendar,
  Layers,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface AuthLicenseGateProps {
  children: React.ReactNode;
}

export const AuthLicenseGate: React.FC<AuthLicenseGateProps> = ({ children }) => {
  const {
    currentUserEmail,
    isApprovedUser,
    isSuperAdmin,
    loginWithGoogle,
    logoutUser,
    setIsSuperAdminModalOpen,
    fetchGoogleBackup,
    restoreFromGoogleCloud,
  } = useShop();

  const [activeTab, setActiveTab] = useState<'restore' | 'login'>('restore');
  const [inputEmail, setInputEmail] = useState('');
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);

  // Restore states
  const [restoreEmail, setRestoreEmail] = useState('');
  const [isSearchingBackup, setIsSearchingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [foundBackup, setFoundBackup] = useState<any | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Super Admin Master Key Protection States (Anti-Hijack)
  const [masterKeyModalOpen, setMasterKeyModalOpen] = useState(false);
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [masterKeyError, setMasterKeyError] = useState('');
  const [pendingAdminAction, setPendingAdminAction] = useState<'login' | 'restore' | null>(null);

  const SUPER_ADMIN_EMAIL = 'jkdevelopers.pk@gmail.com';
  const ADMIN_WHATSAPP = '+923008998381';

  // If user is logged in and approved (or is Super Admin), render the full software!
  if (currentUserEmail && isApprovedUser) {
    return <>{children}</>;
  }

  const handleSimulateLogin = (emailToUse?: string) => {
    const targetEmail = (emailToUse || inputEmail).trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      alert('براہِ کرم درست جی میل (Gmail) درج فرمائیں۔');
      return;
    }

    // STRICT ANTI-HIJACK CHECK: Users cannot use developer's Super Admin email
    if (targetEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setPendingAdminAction('login');
      setMasterKeyInput('');
      setMasterKeyError('');
      setMasterKeyModalOpen(true);
      return;
    }

    const res = loginWithGoogle(targetEmail);
    setShowEmailPrompt(false);
    setInputEmail('');

    if (res.status === 'DENIED') {
      alert(res.message);
      return;
    }

    if (res.status === 'PENDING') {
      setNotificationSent(true);
    }
  };

  const handleSearchBackup = async (emailToUse?: string) => {
    const targetEmail = (emailToUse || restoreEmail).trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      alert('براہِ کرم درست جی میل (Gmail) درج فرمائیں۔');
      return;
    }

    // STRICT ANTI-HIJACK CHECK: Users cannot fetch developer's private cloud backup
    if (targetEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setPendingAdminAction('restore');
      setMasterKeyInput('');
      setMasterKeyError('');
      setMasterKeyModalOpen(true);
      return;
    }

    setIsSearchingBackup(true);
    setRestoreStatus(null);
    setFoundBackup(null);

    try {
      const res = await fetchGoogleBackup(targetEmail);
      if (res.success && res.backup) {
        setFoundBackup(res);
      } else {
        setRestoreStatus({
          success: false,
          message:
            res.message ||
            `اس اکاؤنٹ (${targetEmail}) کا کوئی آن لائن کلاؤڈ بیک اپ نہیں ملا۔ آپ نیا سیٹ اپ کر سکتے ہیں یا فائل سے بحال کریں۔`,
        });
      }
    } catch (e: any) {
      setRestoreStatus({
        success: false,
        message: 'بیک اپ تلاش کرنے میں خرابی پیش آگئی: ' + (e.message || ''),
      });
    } finally {
      setIsSearchingBackup(false);
    }
  };

  const handleMasterKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterKeyInput.trim()) {
      setMasterKeyError('براہِ کرم ماسٹر سیکیورٹی کی درج فرمائیں۔');
      return;
    }

    if (pendingAdminAction === 'login') {
      const res = loginWithGoogle(SUPER_ADMIN_EMAIL, masterKeyInput);
      if (res.status === 'DENIED') {
        setMasterKeyError(res.message);
        return;
      }
      setMasterKeyModalOpen(false);
      setShowEmailPrompt(false);
      setInputEmail('');
    } else if (pendingAdminAction === 'restore') {
      setIsSearchingBackup(true);
      setRestoreStatus(null);
      setFoundBackup(null);
      const res = await fetchGoogleBackup(SUPER_ADMIN_EMAIL, masterKeyInput);
      setIsSearchingBackup(false);
      if (res.success && res.backup) {
        setFoundBackup(res);
        setMasterKeyModalOpen(false);
      } else {
        setMasterKeyError(res.message || 'غیر مجاز رسائی! ماسٹر سیکیورٹی کی غلط ہے۔');
      }
    }
  };

  const handleExecuteRestore = async () => {
    const targetEmail = (restoreEmail || currentUserEmail || 'client@gmail.com')
      .trim()
      .toLowerCase();

    setIsRestoring(true);
    setRestoreStatus(null);

    try {
      const res = await restoreFromGoogleCloud(targetEmail);
      if (res.success) {
        setRestoreStatus({
          success: true,
          message: res.message,
        });
      } else {
        setRestoreStatus({
          success: false,
          message: res.message,
        });
      }
    } catch (e: any) {
      setRestoreStatus({
        success: false,
        message: 'بحالی میں خرابی: ' + (e.message || ''),
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Offline / Manual JSON File Restore from Google Drive
  const handleFileUploadRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const { storage } = await import('@/lib/storage');
        const success = storage.importBackup(content);
        if (success) {
          const autoEmail = restoreEmail.trim() || 'restored_user@gmail.com';
          loginWithGoogle(autoEmail);
          alert('✓ فائل سے سارا ڈیٹا، اسٹاک اور کھاتے کامیابی سے بحال ہو گئے ہیں!');
          window.location.reload();
        } else {
          alert('فائل امپورٹ کرنے میں ناکامی ہوئی!');
        }
      } catch (err: any) {
        alert('فائل درست فارمیٹ میں نہیں ہے: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleRequestApprovalWhatsApp = () => {
    const msg = `السلام علیکم سفیان حبیب صاحب (JK Developers)!
میں نے ون شاپ پی او ایس (OneShop POS) میں لاگ ان کیا ہے۔
میری جی میل: ${currentUserEmail}
براہ کرم میرا اکاؤنٹ چیک کر کے سافٹ ویئر کے استعمال کی منظوری (Approval) عنایت فرمائیں۔ شکریہ!`;
    const cleanPhone = ADMIN_WHATSAPP.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-800 dark:text-slate-100"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 m-2 transition-all">
        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto mb-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-slate-900 flex items-center justify-center shadow-lg text-white font-black text-xl">
            🛍️
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            ون شاپ پی او ایس (OneShop POS)
          </h1>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 px-3 py-0.5 rounded-full inline-block mt-1">
            کلاؤڈ بیک اپ و لائف ٹائم لائسنس سسٹم
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Developed & Supported by JK Developers Pakistan • 0300-8998381
          </p>
        </div>

        {/* 1. SECTION: WHEN NOT LOGGED IN / FRESH SETUP */}
        {!currentUserEmail && (
          <div className="space-y-4">
            {/* Top Switcher Tabs: 1-Click Restore vs Standard Login */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('restore');
                  setRestoreStatus(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'restore'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CloudDownload className="w-4 h-4" />
                <span>🔄 سنگل کلک ری اسٹور</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setRestoreStatus(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'login'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>🔑 نیا لاگ ان / سیٹ اپ</span>
              </button>
            </div>

            {/* TAB 1: 1-CLICK RESTORE FROM GOOGLE ACCOUNT */}
            {activeTab === 'restore' && (
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-400/70 dark:border-emerald-800 rounded-2xl p-4 md:p-5 space-y-3.5 animate-fadeIn">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0 shadow-sm">
                    <CloudDownload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-emerald-950 dark:text-emerald-100">
                      Restore from Google Account
                    </h3>
                    <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                      اگر کمپیوٹر خراب، چوری یا ونڈوز کرپٹ ہو گئی ہے، تو نئے کمپیوٹر پر اپنی جی میل لاگ ان کریں، سافٹ ویئر خود ہی کلاؤڈ اور ڈرائیو سے آخری تاریخ کا بیک اپ تلاش کر کے سارا ڈیٹا، کھاتے اور اسٹاک چند سیکنڈ میں بحال کر دے گا۔
                    </p>
                  </div>
                </div>

                {/* Gmail Input for Restore */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    اپنا گوگل / جی میل (Gmail) اکاؤنٹ درج فرمائیں:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={restoreEmail}
                      onChange={(e) => setRestoreEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchBackup();
                        }
                      }}
                      placeholder="مثال: yourbusiness@gmail.com"
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <button
                      type="button"
                      disabled={isSearchingBackup || isRestoring}
                      onClick={() => handleSearchBackup()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shrink-0 shadow-md flex items-center gap-1.5 transition-all"
                    >
                      {isSearchingBackup ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>تلاش جاری ہے...</span>
                        </>
                      ) : (
                        <>
                          <span>🔍 بیک اپ تلاش کریں</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Status or Error Banner */}
                {restoreStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      restoreStatus.success
                        ? 'bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-100 dark:bg-rose-950 border border-rose-300 text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    {restoreStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{restoreStatus.message}</span>
                  </div>
                )}

                {/* Found Cloud Backup Card */}
                {foundBackup && (
                  <div className="bg-white dark:bg-slate-800 border-2 border-emerald-500 rounded-xl p-3.5 space-y-3 shadow-md animate-in zoom-in-95">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <span className="font-black text-xs text-slate-900 dark:text-white">
                          تازہ ترین محفوظ شدہ کلاؤڈ بیک اپ مل گیا!
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                        ✓ تیار برائے بحالی
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-slate-50 dark:bg-slate-750 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="block text-[10px] text-slate-400">📦 کل آئٹمز و اسٹاک</span>
                        <span className="font-mono font-black text-slate-800 dark:text-white text-sm">
                          {foundBackup.stats?.products || 0}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-750 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="block text-[10px] text-slate-400">👥 کسٹمرز و کھاتے</span>
                        <span className="font-mono font-black text-slate-800 dark:text-white text-sm">
                          {foundBackup.stats?.customers || 0}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-750 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="block text-[10px] text-slate-400">🧾 سابقہ انوائسز</span>
                        <span className="font-mono font-black text-slate-800 dark:text-white text-sm">
                          {foundBackup.stats?.invoices || 0}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-750 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="block text-[10px] text-slate-400">💰 روزنامچہ انٹریز</span>
                        <span className="font-mono font-black text-slate-800 dark:text-white text-sm">
                          {foundBackup.stats?.roznamcha || 0}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono text-center">
                      📅 آخری تاریخ: {new Date(foundBackup.exportedAt).toLocaleString('ur-PK')}
                    </div>

                    {/* 1-Click Restore Action Button */}
                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={handleExecuteRestore}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-xs shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
                    >
                      {isRestoring ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>سارا ڈیٹا، کھاتے اور اسٹاک بحال ہو رہا ہے...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>✨ سنگل کلک بحال کریں (Restore All Data Now)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Secondary Option: Upload JSON downloaded from Google Drive */}
                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    یا کمپیوٹر پر ڈاؤنلوڈ شدہ فائل سے بحال کریں:
                  </span>
                  <label className="cursor-pointer px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-bold inline-flex items-center gap-1 shadow-2xs">
                    <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                    <span>فائل منتخب کریں (.json)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUploadRestore}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: REGULAR LOGIN / SETUP */}
            {activeTab === 'login' && (
              <div className="space-y-3.5">
                {!showEmailPrompt ? (
                  <button
                    onClick={() => setShowEmailPrompt(true)}
                    className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-3.5 text-slate-800 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-md active:scale-98"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.14C3.15 21.36 7.23 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.62H1.18C.43 8.14 0 9.87 0 12s.43 3.86 1.18 5.38l4.09-3.14z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.15 2.64 1.18 6.62l4.09 3.14c.95-2.85 3.6-4.96 6.73-4.96z"
                      />
                    </svg>
                    <span>Google اکاؤنٹ کے ذریعے لاگ ان کریں</span>
                  </button>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      اپنا جی میل ایڈریس درج فرمائیں:
                    </label>
                    <input
                      type="email"
                      value={inputEmail}
                      onChange={(e) => setInputEmail(e.target.value)}
                      placeholder="username@gmail.com"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSimulateLogin()}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md"
                      >
                        لاگ ان تصدیق کریں
                      </button>
                      <button
                        onClick={() => setShowEmailPrompt(false)}
                        className="px-3 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
                      >
                        منسوخ
                      </button>
                    </div>
                  </div>
                )}

                {/* Enterprise Security Notice */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 font-bold">
                    🔒 انکرپٹڈ سیکیورٹی پروٹیکشن • برائے مہربانی صرف اپنی دکان یا کاروبار کی رجسٹرڈ جی میل درج فرمائیں۔
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. SECTION: PENDING / BLOCKED (Logged in, but awaiting Super Admin approval) */}
        {currentUserEmail && !isApprovedUser && (
          <div className="text-center space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 p-5 rounded-2xl shadow-sm space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-1">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>

              <h3 className="font-black text-lg">⏳ لائسنس منظوری کا انتظار ہے</h3>
              <p className="text-xs leading-relaxed">
                آپ کا اکاؤنٹ فی الحال پینڈنگ ہے۔ سافٹ ویئر تک مکمل رسائی کے لیے ایڈمن (سفیان حبیب) کی باضابطہ منظوری درکار ہے۔
              </p>

              <div
                className="p-2 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200"
                dir="ltr"
              >
                {currentUserEmail}
              </div>

              <div className="pt-2 text-xs space-y-1">
                <p className="text-slate-600 dark:text-slate-400 font-bold">ایڈمن واٹس ایپ رابطہ:</p>
                <button
                  onClick={handleRequestApprovalWhatsApp}
                  className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <Phone className="w-4 h-4" />
                  <span>واٹس ایپ پر فوری منظوری مانگیں (03008998381)</span>
                </button>
              </div>
            </div>

            <button
              onClick={logoutUser}
              className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>لاگ آؤٹ کریں اور دوسری جی میل آزمائیں</span>
            </button>
          </div>
        )}

        {/* Super Admin Quick Link */}
        {currentUserEmail === SUPER_ADMIN_EMAIL && (
          <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
            <button
              onClick={() => setIsSuperAdminModalOpen(true)}
              className="text-xs text-blue-600 dark:text-blue-400 font-black hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <span>⚙️ سپر ایڈمن کنٹرول پینل کھولیں</span>
            </button>
          </div>
        )}
      </div>

      <div className="text-center mt-3 text-[11px] text-slate-500">
        © 2026 JK Developers Pakistan • تمام جملہ حقوق بحقِ ایڈمن محفوظ ہیں
      </div>

      {/* Developer Master Key Security Modal */}
      {masterKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border-2 border-purple-500/60 rounded-3xl w-full max-w-md p-6 text-white shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-purple-200">
                  🔐 سپر ایڈمن ماسٹر سیکیورٹی کی
                </h3>
                <span className="text-[11px] font-mono text-purple-400">
                  {SUPER_ADMIN_EMAIL}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              یہ ای میل ایڈریس JK Developers کے چیف ڈویلپر کے لیے مخصوص ہے۔ عام صارفین اس ای میل سے داخل ہونے کے مجاز نہیں ہیں۔ اگر آپ مجاز ڈویلپر ہیں تو اپنی ماسٹر سیکیورٹی کی درج فرمائیں۔
            </p>

            <form onSubmit={handleMasterKeySubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  سپر ایڈمن ماسٹر پاس ورڈ:
                </label>
                <input
                  type="password"
                  value={masterKeyInput}
                  onChange={(e) => {
                    setMasterKeyInput(e.target.value);
                    setMasterKeyError('');
                  }}
                  placeholder="Master Security Key درج کریں..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 focus:border-purple-500 rounded-xl text-xs font-mono outline-none text-white focus:ring-2 focus:ring-purple-500/40"
                  autoFocus
                />
              </div>

              {masterKeyError && (
                <div className="p-2.5 bg-rose-950/70 border border-rose-800/80 rounded-xl text-rose-300 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{masterKeyError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-xs shadow-lg shadow-purple-900/40 active:scale-95 transition-all"
                >
                  تصدیق و داخلہ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMasterKeyModalOpen(false);
                    setMasterKeyInput('');
                    setMasterKeyError('');
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all"
                >
                  منسوخ کریں
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
