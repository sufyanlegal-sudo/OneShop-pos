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
  } = useShop();

  const [inputEmail, setInputEmail] = useState('');
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);

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

    const res = loginWithGoogle(targetEmail);
    setShowEmailPrompt(false);
    setInputEmail('');

    if (res.status === 'PENDING') {
      setNotificationSent(true);
    }
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
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 m-2 transition-all">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-slate-900 flex items-center justify-center shadow-lg text-white font-black text-xl">
            🛍️
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            ون شاپ پی او ایس
          </h1>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 rounded-full inline-block mt-1">
            سکیور کلاؤڈ سسٹم (Admin Approval Required)
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Developed & Licensed by JK Developers Pakistan
          </p>
        </div>

        {/* 1. LOGIN SECTION (When not logged in) */}
        {!currentUserEmail && (
          <div className="space-y-4">
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
                <span>گوگل (Gmail) سے لاگ ان کریں</span>
              </button>
            ) : (
              <div className="space-y-3 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  اپنی جی میل (Gmail) درج فرمائیں:
                </label>
                <div className="relative">
                  <input
                    type="email"
                    dir="ltr"
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSimulateLogin();
                    }}
                    placeholder="client@gmail.com"
                    autoFocus
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-left font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSimulateLogin()}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md"
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

            {/* Quick Demo Test Buttons */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold block text-center">
                ٹیسٹنگ کے لیے فوری اکاؤنٹس:
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSimulateLogin(SUPER_ADMIN_EMAIL)}
                  className="flex-1 py-1.5 px-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 text-purple-700 dark:text-purple-300 rounded-xl text-[10.5px] font-bold text-center"
                >
                  👑 سپر ایڈمن (jkdevelopers)
                </button>
                <button
                  onClick={() => handleSimulateLogin('client_demo@gmail.com')}
                  className="flex-1 py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 rounded-xl text-[10.5px] font-bold text-center"
                >
                  👤 نیا کلائنٹ (پینڈنگ ٹیسٹ)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. PENDING / BLOCKED SECTION (Logged in, but awaiting Super Admin approval) */}
        {currentUserEmail && !isApprovedUser && (
          <div className="text-center space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 p-5 rounded-2xl shadow-sm space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-1">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>

              <h3 className="font-black text-lg font-nastaliq">⏳ منظوری کا انتظار ہے</h3>
              <p className="text-xs leading-relaxed font-nastaliq">
                آپ کا اکاؤنٹ فی الحال پینڈنگ ہے۔ سافٹ ویئر تک مکمل رسائی کے لیے ایڈمن (سفیان حبیب) کی باضابطہ منظوری درکار ہے۔
              </p>

              <div className="p-2 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200" dir="ltr">
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
    </div>
  );
};
