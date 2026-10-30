'use client';

import React, { useState, useEffect } from 'react';
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
  Building2,
  KeyRound,
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
  Eye,
  EyeOff,
} from 'lucide-react';

interface AuthLicenseGateProps {
  children: React.ReactNode;
}

export const AuthLicenseGate: React.FC<AuthLicenseGateProps> = ({ children }) => {
  const {
    currentUserEmail,
    isApprovedUser,
    isSuperAdmin,
    loginUser,
    registerUser,
    superAdminLoginWithMasterKey,
    logoutUser,
    setIsSuperAdminModalOpen,
    fetchGoogleBackup,
    restoreFromGoogleCloud,
    usersDB,
  } = useShop();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'restore'>('login');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Registration Form States
  const [regName, setRegName] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Pending user tracking (if client just registered or is awaiting approval)
  const [pendingUser, setPendingUser] = useState<{
    name: string;
    businessName: string;
    phone: string;
    email: string;
  } | null>(null);

  // Restore states
  const [restoreEmail, setRestoreEmail] = useState('');
  const [isSearchingBackup, setIsSearchingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [foundBackup, setFoundBackup] = useState<any | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Hidden Super Admin Master Key States (NO visible public button)
  const [masterKeyModalOpen, setMasterKeyModalOpen] = useState(false);
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [masterKeyError, setMasterKeyError] = useState('');

  const SUPER_ADMIN_EMAIL = 'jkdevelopers.pk@gmail.com';
  const ADMIN_WHATSAPP = '+923008998381';

  // Secret Keyboard Shortcut (Ctrl + Shift + S) to open Master Security Key dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        setMasterKeyInput('');
        setMasterKeyError('');
        setMasterKeyModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Inspect URL parameters: If a link is opened or sent for another email, NEVER auto-log in!
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const emailParam = urlParams.get('email');
      const actionParam = urlParams.get('action');

      if (emailParam) {
        logoutUser();
        setLoginEmail(emailParam);
        if (actionParam === 'register') {
          setActiveTab('register');
          setRegEmail(emailParam);
        } else {
          setActiveTab('login');
        }
      }
    }
  }, []);

  // If user is logged in and approved (or is Super Admin), render the full software!
  if (currentUserEmail && isApprovedUser) {
    return <>{children}</>;
  }

  // 1. Handle Client Login
  const handleClientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setLoginError('براہِ کرم درست جی میل (Gmail) ایڈریس درج فرمائیں۔');
      return;
    }

    // STRICT ANTI-HIJACK CHECK: Users cannot log into developer's Super Admin email via regular form
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setLoginError('⛔ یہ ای میل ڈیولپر کے لیے مخصوص ہے۔ برائے مہربانی اپنا ذاتی رجسٹرڈ اکاؤنٹ استعمال فرمائیں۔');
      return;
    }

    setIsLoggingIn(true);
    const res = loginUser({
      email: cleanEmail,
      password: loginPassword,
    });
    setIsLoggingIn(false);

    if (res.status === 'NOT_FOUND') {
      setLoginError(res.message);
      return;
    }

    if (res.status === 'WRONG_PASSWORD') {
      setLoginError(res.message);
      return;
    }

    if (res.status === 'PENDING') {
      setPendingUser({
        name: res.user?.name || cleanEmail.split('@')[0],
        businessName: res.user?.businessName || res.user?.shopName || 'کاروبار',
        phone: res.user?.phone || '',
        email: cleanEmail,
      });
      return;
    }

    if (res.status === 'DENIED') {
      setLoginError(res.message);
      return;
    }
  };

  // 2. Handle Client Registration
  const handleClientRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim()) {
      setRegError('براہِ کرم اپنا نام درج فرمائیں۔');
      return;
    }
    if (!regBusinessName.trim()) {
      setRegError('براہِ کرم اپنی دکان یا کاروبار کا نام درج فرمائیں۔');
      return;
    }
    if (!regPhone.trim()) {
      setRegError('براہِ کرم اپنا موبائل / واٹس ایپ نمبر درج فرمائیں۔');
      return;
    }
    const cleanEmail = regEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setRegError('براہِ کرم درست جی میل (Gmail) درج فرمائیں۔');
      return;
    }
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setRegError('یہ ای میل ایڈریس محفوظ ہے۔ برائے مہربانی اپنی ذاتی جی میل درج فرمائیں۔');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setRegError('پاسورڈ کم از کم 4 ہندسوں یا حروف پر مشتمل ہونا چاہیے۔');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('دونوں پاسورڈ میچ نہیں ہو رہے۔ برائے مہربانی دوبارہ چیک کریں۔');
      return;
    }

    setIsRegistering(true);
    const res = await registerUser({
      name: regName.trim(),
      businessName: regBusinessName.trim(),
      phone: regPhone.trim(),
      email: cleanEmail,
      password: regPassword,
    });
    setIsRegistering(false);

    if (res.status === 'EXISTS') {
      setRegError(res.message);
      return;
    }
    if (res.status === 'ERROR') {
      setRegError(res.message);
      return;
    }

    // Set client into Pending state
    setPendingUser({
      name: regName.trim(),
      businessName: regBusinessName.trim(),
      phone: regPhone.trim(),
      email: cleanEmail,
    });
  };

  // 3. Handle Secret Master Key Submit (Only for developer Sufyan Habib)
  const handleMasterKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterKeyInput.trim()) {
      setMasterKeyError('براہِ کرم ماسٹر سیکیورٹی کی درج فرمائیں۔');
      return;
    }

    const res = superAdminLoginWithMasterKey(masterKeyInput);
    if (!res.success) {
      setMasterKeyError(res.message);
      return;
    }

    setMasterKeyModalOpen(false);
    setMasterKeyInput('');
    setMasterKeyError('');
  };

  // 4. Handle WhatsApp Notification to Developer
  const handleSendWhatsAppNotification = (userToNotify?: {
    name: string;
    businessName: string;
    phone: string;
    email: string;
  }) => {
    const u = userToNotify || pendingUser;
    const msg = `السلام علیکم سفیان حبیب صاحب (JK Developers)!
میں نے ون شاپ پی او ایس (OneShop POS) میں نیا اکاؤنٹ بنایا ہے۔
━━━━━━━━━━━━━━━━━━
👤 نام: ${u?.name || 'صارف'}
🏪 کاروبار: ${u?.businessName || 'دکان'}
📱 موبائل نمبر: ${u?.phone || 'N/A'}
📧 جی میل: ${u?.email || currentUserEmail}
🕒 وقت: ${new Date().toLocaleString('ur-PK')}
━━━━━━━━━━━━━━━━━━
براہ کرم میرا اکاؤنٹ چیک فرما کر سافٹ ویئر چلانے کی منظوری (Approval) عنایت فرمائیں۔ شکریہ!`;

    const cleanPhone = ADMIN_WHATSAPP.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // 5. Restore Search
  const handleSearchBackup = async () => {
    const targetEmail = restoreEmail.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      alert('براہِ کرم درست جی میل (Gmail) درج فرمائیں۔');
      return;
    }

    if (targetEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
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
            `اس اکاؤنٹ (${targetEmail}) کا کوئی آن لائن کلاؤڈ بیک اپ نہیں ملا۔`,
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

  // 6. Restore Execution
  const handleExecuteRestore = async () => {
    const targetEmail = restoreEmail.trim().toLowerCase();
    setIsRestoring(true);
    setRestoreStatus(null);

    try {
      const res = await restoreFromGoogleCloud(targetEmail);
      if (res.success) {
        setRestoreStatus({
          success: true,
          message: res.message,
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
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

  // 7. Manual JSON File Restore
  const handleFileUploadRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const { storage } = await import('@/lib/storage');
        const success = storage.importBackup(content);
        if (success) {
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

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-3 sm:p-5 font-sans text-slate-100"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 m-2 transition-all text-slate-900 dark:text-slate-100 relative">
        {/* Top Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-slate-900 flex items-center justify-center shadow-lg text-white font-black text-2xl">
            🛍️
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            OneShop POS v2.0 PRO
          </h1>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
            پوائنٹ آف سیل و انوائسنگ سسٹم • کلاؤڈ سیکیور پورٹل
          </p>
        </div>

        {/* ========================================================================= */}
        {/* VIEW A: PENDING APPROVAL SCREEN (WHEN CLIENT REGISTERED OR UNAPPROVED)    */}
        {/* ========================================================================= */}
        {(pendingUser || (currentUserEmail && !isApprovedUser)) && (
          <div className="space-y-4 animate-in fade-in zoom-in-95">
            <div className="bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-400 dark:border-amber-700 text-amber-950 dark:text-amber-200 p-5 rounded-2xl shadow-sm text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>

              <div>
                <h3 className="font-black text-base sm:text-lg">
                  ⏳ اکاؤنٹ زیرِ جائزہ ہے (Awaiting Approval)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                  آپ کی معلومات سسٹم میں محفوظ ہو چکی ہیں اور ایڈمن کو الرٹ موصول ہو چکا ہے۔ سیکیورٹی پروٹیکشن کے تحت سافٹ ویئر چلانے کے لیے ایڈمن کی منظوری ضروری ہے۔
                </p>
              </div>

              {/* Registered details card */}
              <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-3 border border-amber-200 dark:border-amber-800 text-xs text-right space-y-1 font-mono">
                {pendingUser?.name && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">صارف کا نام:</span>
                    <span className="font-bold font-sans text-slate-900 dark:text-white">
                      {pendingUser.name}
                    </span>
                  </div>
                )}
                {pendingUser?.businessName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">کاروبار / دکان:</span>
                    <span className="font-bold font-sans text-slate-900 dark:text-white">
                      {pendingUser.businessName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">رجسٹرڈ جی میل:</span>
                  <span className="font-bold text-slate-900 dark:text-white" dir="ltr">
                    {pendingUser?.email || currentUserEmail}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
                  <span className="text-slate-500 font-sans">اسٹیٹس:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 font-sans">
                    غیر منظور شدہ (Pending)
                  </span>
                </div>
              </div>

              {/* WhatsApp Notification Button */}
              <button
                type="button"
                onClick={() => handleSendWhatsAppNotification()}
                className="w-full py-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <Phone className="w-4 h-4" />
                <span>واٹس ایپ پر فوری منظوری کی درخواست بھیجیں (0300-8998381)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setPendingUser(null);
                logoutUser();
                setActiveTab('login');
              }}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>لاگ آؤٹ کریں اور واپس لاگ ان پر جائیں</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW B: MAIN LOGIN & REGISTRATION INTERFACE                               */}
        {/* ========================================================================= */}
        {!pendingUser && (!currentUserEmail || isApprovedUser === false) && (
          <div className="space-y-4">
            {/* Tab Bar */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setLoginError('');
                  setRegError('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'login'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>لاگ ان کریں</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setLoginError('');
                  setRegError('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'register'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>نیا اکاؤنٹ بنائیں</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('restore');
                  setRestoreStatus(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'restore'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CloudDownload className="w-3.5 h-3.5" />
                <span>بیک اپ ری اسٹور</span>
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* TAB 1: CLIENT SIGN IN                                          */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'login' && (
              <form onSubmit={handleClientLogin} className="space-y-3.5 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    جی میل ایڈریس (Gmail Address):
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      dir="ltr"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        setLoginError('');
                      }}
                      placeholder="e.g. yourstore@gmail.com"
                      className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-left"
                      autoFocus
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    پاسورڈ (Password):
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      dir="ltr"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError('');
                      }}
                      placeholder="پاسورڈ درج کریں..."
                      className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-left pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-black text-xs shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>تصدیق ہو رہی ہے...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>سافٹ ویئر میں لاگ ان کریں</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    نیا کاروبار ہے؟ یہاں نیا اکاؤنٹ رجسٹر کریں
                  </button>
                </div>
              </form>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 2: STORE OWNER REGISTRATION FORM                           */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'register' && (
              <form onSubmit={handleClientRegister} className="space-y-3 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                    صارف کا نام (Full Name):
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value);
                      setRegError('');
                    }}
                    placeholder="مثال: محمد احمد"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                    دکان / کاروبار کا نام (Business / Store Name):
                  </label>
                  <input
                    type="text"
                    value={regBusinessName}
                    onChange={(e) => {
                      setRegBusinessName(e.target.value);
                      setRegError('');
                    }}
                    placeholder="مثال: المدینہ کریانہ و جنرل اسٹور"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                    موبائل / واٹس ایپ نمبر:
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={regPhone}
                    onChange={(e) => {
                      setRegPhone(e.target.value);
                      setRegError('');
                    }}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-left"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                    جی میل ایڈریس (Gmail Address):
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      setRegError('');
                    }}
                    placeholder="yourstore@gmail.com"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-left"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      پاسورڈ:
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      dir="ltr"
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        setRegError('');
                      }}
                      placeholder="****"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-left"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      پاسورڈ تصدیق:
                    </label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      dir="ltr"
                      value={regConfirmPassword}
                      onChange={(e) => {
                        setRegConfirmPassword(e.target.value);
                        setRegError('');
                      }}
                      placeholder="****"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-left"
                    />
                  </div>
                </div>

                {regError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-black text-xs shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all mt-2"
                >
                  {isRegistering ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>رجسٹریشن و نوٹیفکیشن ارسال ہو رہا ہے...</span>
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4" />
                      <span>اکاؤنٹ رجسٹر کریں اور منظوری کے لیے بھیجیں</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold"
                  >
                    پہلے سے اکاؤنٹ ہے؟ یہاں لاگ ان کریں
                  </button>
                </div>
              </form>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 3: 1-CLICK RESTORE FROM GOOGLE ACCOUNT                     */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'restore' && (
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-400/70 dark:border-emerald-800 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 shadow-sm">
                    <CloudDownload className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs text-emerald-950 dark:text-emerald-100">
                      Google Cloud Restore
                    </h3>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                      نئے کمپیوٹر پر اپنی رجسٹرڈ جی میل درج کریں، کلاؤڈ سے سارا اسٹاک، کھاتے اور ڈیٹا خودکار بحال ہو جائے گا۔
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    رجسٹرڈ جی میل (Gmail) درج فرمائیں:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      dir="ltr"
                      value={restoreEmail}
                      onChange={(e) => setRestoreEmail(e.target.value)}
                      placeholder="yourstore@gmail.com"
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                    />
                    <button
                      type="button"
                      disabled={isSearchingBackup || isRestoring}
                      onClick={handleSearchBackup}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shrink-0 shadow-md flex items-center gap-1"
                    >
                      {isSearchingBackup ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>🔍 تلاش</span>}
                    </button>
                  </div>
                </div>

                {restoreStatus && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      restoreStatus.success
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300'
                    }`}
                  >
                    {restoreStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                    <span>{restoreStatus.message}</span>
                  </div>
                )}

                {foundBackup && (
                  <div className="bg-white dark:bg-slate-800 border-2 border-emerald-500 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-emerald-600">✓ کلاؤڈ بیک اپ مل گیا!</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(foundBackup.exportedAt).toLocaleDateString('ur-PK')}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={handleExecuteRestore}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black text-xs shadow-md flex items-center justify-center gap-2"
                    >
                      {isRestoring ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>بحال ہو رہا ہے...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>سارا ڈیٹا بحال کریں (Restore All Data)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">یا فائل سے بحال کریں:</span>
                  <label className="cursor-pointer px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-bold inline-flex items-center gap-1">
                    <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                    <span>فائل منتخب کریں (.json)</span>
                    <input type="file" accept=".json" onChange={handleFileUploadRestore} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Credit & Discreet Hidden Developer Access Trigger */}
        <div className="mt-6 pt-3 border-t border-slate-200 dark:border-slate-800 text-center flex items-center justify-between text-[11px] text-slate-400">
          <span>© 2026 JK Developers پاکستان</span>

          {/* Discreet Developer Key Lock Trigger (No visible text saying 'Super Admin') */}
          <button
            type="button"
            onClick={() => {
              setMasterKeyInput('');
              setMasterKeyError('');
              setMasterKeyModalOpen(true);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition"
            title="Master Access"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DEVELOPER MASTER KEY SECRET MODAL (ONLY FOR SUFYAN HABIB • JK DEVELOPERS)  */}
      {/* ========================================================================= */}
      {masterKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border-2 border-emerald-500/70 rounded-3xl w-full max-w-sm p-6 text-white shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-emerald-200">
                  خفیہ ماسٹر سیکیورٹی رسائی
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  JK Developers Pakistan
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              یہ پینل صرف سافٹ ویئر ڈویلپر (سفیان حبیب) کے لیے مخصوص ہے۔ برائے مہربانی اپنی خفیہ ماسٹر کی درج فرمائیں۔
            </p>

            <form onSubmit={handleMasterKeySubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  ماسٹر سیکیورٹی کی (Master Key):
                </label>
                <input
                  type="password"
                  dir="ltr"
                  value={masterKeyInput}
                  onChange={(e) => {
                    setMasterKeyInput(e.target.value);
                    setMasterKeyError('');
                  }}
                  placeholder="Secret Key درج کریں..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs font-mono outline-none text-white focus:ring-2 focus:ring-emerald-500/40 text-left"
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
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-lg active:scale-95 transition-all"
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
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded-xl text-xs"
                >
                  منسوخ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
