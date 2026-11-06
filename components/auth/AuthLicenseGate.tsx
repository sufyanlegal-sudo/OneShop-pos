'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
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

const SuperAdminModal = dynamic(
  () => import('@/components/auth/SuperAdminModal').then((m) => m.SuperAdminModal),
  { ssr: false }
);

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
    isSuperAdminModalOpen,
    setIsSuperAdminModalOpen,
    fetchGoogleBackup,
    restoreFromGoogleCloud,
    syncWithCloud,
    refreshUsersFromCloud,
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

  // Super Admin Master Key States (Strictly restricted to developer)
  const [masterKeyModalOpen, setMasterKeyModalOpen] = useState(false);
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [showMasterKey, setShowMasterKey] = useState(false);
  const [masterKeyError, setMasterKeyError] = useState('');

  // 100% BULLETPROOF CRYPTOGRAPHIC SERVER-VERIFIED SESSION
  // Completely prevents any software engineer or hacker from forcing entry via DevTools / LocalStorage
  const [isServerVerified, setIsServerVerified] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);

  const SUPER_ADMIN_EMAIL = 'jkdevelopers.pk@gmail.com';
  const ADMIN_WHATSAPP = '+923008998381';

  const [isApprovedAndUnlocking, setIsApprovedAndUnlocking] = useState(false);

  // Computed: whether the screen is currently in Pending Approval mode (or in Login/Register mode)
  const isPendingApproval = Boolean(
    pendingUser ||
    (currentUserEmail && isApprovedUser === false && currentUserEmail.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase())
  );

  useEffect(() => {
    if (currentUserEmail && !loginEmail && currentUserEmail.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      setLoginEmail(currentUserEmail);
    }
  }, [currentUserEmail]);

  // Background user database sync
  useEffect(() => {
    refreshUsersFromCloud();
    const interval = setInterval(() => {
      refreshUsersFromCloud();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Strict Server Session Verification: Checks HMAC-SHA256 signature and live approval status
  const verifyServerSession = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('pos_session_token') : null;
      if (!token) {
        setIsServerVerified(false);
        setIsCheckingSession(false);
        return false;
      }

      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY',
          sessionToken: token,
        }),
        cache: 'no-store',
      });

      const data = await res.json();
      if (data.valid && data.user && data.user.approved) {
        setIsServerVerified(true);
        setIsCheckingSession(false);
        return true;
      } else {
        // Token forged, expired, or access revoked by Super Admin -> Purge all storage!
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pos_session_token');
          localStorage.removeItem('pos_current_user');
          sessionStorage.clear();
        }
        setIsServerVerified(false);
        setIsCheckingSession(false);
        return false;
      }
    } catch {
      setIsServerVerified(false);
      setIsCheckingSession(false);
      return false;
    }
  };

  useEffect(() => {
    verifyServerSession();
    // Continuous live security poll every 3.5s: If Super Admin clicks "Revoke", the screen locks immediately!
    const interval = setInterval(() => {
      verifyServerSession();
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // REAL-TIME AUTO UNLOCK: Continuously checks every 2.5s if Super Admin approved this user.
  // The moment Admin clicks "Approve", the client screen automatically unlocks and launches the POS!
  useEffect(() => {
    const targetEmail = pendingUser?.email || (currentUserEmail && !isApprovedUser ? currentUserEmail : null);
    if (!targetEmail) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/users?email=${encodeURIComponent(targetEmail)}&_t=${Date.now()}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (data.success && data.found && data.approved) {
          clearInterval(interval);
          setIsApprovedAndUnlocking(true);
          try {
            const sessRes = await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'LOGIN',
                email: targetEmail,
              }),
            });
            const sessData = await sessRes.json();
            if (sessData.sessionToken) {
              localStorage.setItem('pos_session_token', sessData.sessionToken);
              localStorage.setItem('pos_current_user', targetEmail);
              setIsServerVerified(true);
            }
          } catch {}
          loginUser({ email: targetEmail });
          try {
            await syncWithCloud(targetEmail);
          } catch {}
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        }
      } catch (err) {
        // Retry silently
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [pendingUser, currentUserEmail, isApprovedUser]);

  // Secret Developer Keyboard Shortcut (Ctrl + Shift + S or Ctrl + Shift + A or F9) to open Master Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's' || e.key === 'A' || e.key === 'a')) ||
        e.key === 'F9'
      ) {
        e.preventDefault();
        setMasterKeyInput('');
        setMasterKeyError('');
        setMasterKeyModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Inspect URL parameters: If a link is opened for another email, clean session
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

  // If user is logged in and verified by cryptographically signed server token, render the full software!
  if (isServerVerified && currentUserEmail && isApprovedUser) {
    return <>{children}</>;
  }

  // If still actively verifying session on cold boot, show sleek loader
  if (isCheckingSession && typeof window !== 'undefined' && localStorage.getItem('pos_session_token')) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-3 font-sans">
        <div className="w-9 h-9 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-xs font-mono font-bold text-slate-400">سیکیورٹی و سیشن تصدیق جاری ہے...</div>
      </div>
    );
  }

  // 1. Handle Client Login (With Server Cryptographic Token Issuance)
  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setLoginError('براہِ کرم درست ای میل ایڈریس درج فرمائیں۔');
      return;
    }

    // Developer Super Admin Email Check
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setMasterKeyInput('');
      setMasterKeyError('');
      setMasterKeyModalOpen(true);
      return;
    }

    if (!loginPassword) {
      setLoginError('براہِ کرم اپنا پاس ورڈ درج فرمائیں۔');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOGIN',
          email: cleanEmail,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      setIsLoggingIn(false);

      if (data.success && data.sessionToken) {
        localStorage.setItem('pos_session_token', data.sessionToken);
        localStorage.setItem('pos_current_user', cleanEmail);
        setIsServerVerified(true);
        loginUser({ email: cleanEmail });
        try {
          await syncWithCloud(cleanEmail);
        } catch {}
        window.location.reload();
        return;
      }

      if (data.status === 'PENDING' || data.status === 'pending') {
        const found = usersDB.find((u) => u.email.toLowerCase() === cleanEmail);
        setPendingUser({
          name: found?.name || cleanEmail.split('@')[0],
          businessName: found?.businessName || found?.shopName || 'Business Store',
          phone: found?.phone || '',
          email: cleanEmail,
        });
        return;
      }

      if (data.status === 'blocked') {
        setLoginError('⛔ آپ کا اکاؤنٹ سیکیورٹی وجوہات کی بنا پر بلاک ہے۔ برائے بحالی ہیلپ لائن (0300-8998381) سے رابطہ فرمائیں۔');
        return;
      }

      if (data.status === 'expired') {
        setLoginError('⌛ آپ کی سبسکرپشن کی میعاد ختم (Expired) ہو چکی ہے۔ تجدید کے لیے ایڈمن سے رابطہ فرمائیں۔');
        return;
      }

      setLoginError(data.message || 'غلط ای میل یا پاس ورڈ درج کیا گیا ہے۔');
    } catch {
      setIsLoggingIn(false);
      setLoginError('سرور سے رابطہ نہ ہو سکا۔ برائے مہربانی انٹرنیٹ چیک کریں۔');
    }
  };

  // 2. Handle Client Registration (Strictly Default Status: 'pending')
  const handleClientRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim()) {
      setRegError('براہِ کرم اپنا پورا نام درج فرمائیں۔');
      return;
    }
    if (!regBusinessName.trim()) {
      setRegError('براہِ کرم اپنی دکان یا کاروبار کا نام درج فرمائیں۔');
      return;
    }
    if (!regPhone.trim()) {
      setRegError('براہِ کرم اپنا موبائل یا واٹس ایپ نمبر درج فرمائیں۔');
      return;
    }
    const cleanEmail = regEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setRegError('براہِ کرم درست جی میل ایڈریس درج فرمائیں۔');
      return;
    }
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setRegError('یہ ای میل ایڈریس رجسٹر نہیں کیا جا سکتا۔ براہِ کرم اپنی ذاتی جی میل استعمال کریں۔');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setRegError('پاس ورڈ کم از کم 4 ہندسوں یا حروف کا ہونا لازمی ہے۔');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('پاس ورڈ کی تصدیق مماثل نہیں ہے، براہِ کرم دوبارہ چیک کریں۔');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: regBusinessName.trim(),
          ownerName: regName.trim(),
          phone: regPhone.trim(),
          email: cleanEmail,
          password: regPassword,
        }),
      });

      const data = await res.json();
      setIsRegistering(false);

      if (!data.success) {
        setRegError(data.message || 'رجسٹریشن کے دوران خرابی پیش آئی ہے۔');
        return;
      }

      // Set client into Pending state
      const newClient = {
        name: regName.trim(),
        businessName: regBusinessName.trim(),
        phone: regPhone.trim(),
        email: cleanEmail,
      };
      setPendingUser(newClient);
      await refreshUsersFromCloud();

      // Trigger user WhatsApp notice
      setTimeout(() => {
        handleSendWhatsAppNotification(newClient);
      }, 400);
    } catch (err: any) {
      setIsRegistering(false);
      setRegError('سرور سے رابطہ نہ ہو سکا۔ برائے مہربانی انٹرنیٹ چیک کریں۔');
    }
  };

  // 3. Handle Secret Master Key Submit (Only for developer)
  const handleMasterKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterKeyInput.trim()) {
      setMasterKeyError('براہِ کرم ماسٹر سیکیورٹی کی درج کریں۔');
      return;
    }

    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOGIN',
          email: SUPER_ADMIN_EMAIL.toLowerCase(),
          masterKey: masterKeyInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.sessionToken) {
        localStorage.setItem('pos_session_token', data.sessionToken);
        localStorage.setItem('pos_current_user', SUPER_ADMIN_EMAIL.toLowerCase());
        setIsServerVerified(true);
        superAdminLoginWithMasterKey(masterKeyInput.trim());
        setMasterKeyModalOpen(false);
        setMasterKeyInput('');
        setMasterKeyError('');
        window.location.reload();
        return;
      }
      setMasterKeyError(data.message || 'غلط سیکیورٹی کی! رسائی مسترد کر دی گئی۔');
    } catch {
      setMasterKeyError('سرور سے رابطہ نہ ہو سکا۔');
    }
  };

  // 4. Handle WhatsApp Notification to Company
  const handleSendWhatsAppNotification = (userToNotify?: {
    name: string;
    businessName: string;
    phone: string;
    email: string;
  }) => {
    const u = userToNotify || pendingUser;
    const msg = `السلام علیکم جے کے ڈویلپرز پاکستان!
میں نے ون شاپ پی او ایس (OneShop POS) پر اپنا نیا اسٹور اکاؤنٹ رجسٹر کیا ہے:
━━━━━━━━━━━━━━━━━━
👤 مالک کا نام: ${u?.name || 'کلائنٹ'}
🏪 دکان کا نام: ${u?.businessName || 'اسٹور'}
📱 موبائل / واٹس ایپ: ${u?.phone || 'N/A'}
📧 رجسٹرڈ جی میل: ${u?.email || currentUserEmail}
🕒 تاریخ و وقت: ${new Date().toLocaleString('ur-PK')}
━━━━━━━━━━━━━━━━━━
براہِ کرم تفصیلات کا جائزہ لے کر میرا لائف ٹائم لائسنس منظور فرما دیں۔ شکریہ!`;

    const cleanPhone = ADMIN_WHATSAPP.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // 4b. Handle Gmail / Email Notification to Company
  const handleSendEmailNotification = (userToNotify?: {
    name: string;
    businessName: string;
    phone: string;
    email: string;
  }) => {
    const u = userToNotify || pendingUser;
    const subject = encodeURIComponent(
      `OneShop POS Approval Request: ${u?.businessName || 'New Store'} (${u?.name || 'Client'})`
    );
    const body = encodeURIComponent(
`Respected JK Developers Pakistan Team,

I have created a new store account on OneShop POS. Please review and approve my account:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Owner Full Name: ${u?.name || 'N/A'}
- Business / Shop Name: ${u?.businessName || 'N/A'}
- Mobile / WhatsApp: ${u?.phone || 'N/A'}
- Registered Gmail: ${u?.email || currentUserEmail || 'N/A'}
- Registration Timestamp: ${new Date().toLocaleString('en-US')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please activate my software license so I can proceed with the system.

Thank you!
${u?.name || 'Store Owner'}`
    );

    window.open(`mailto:${SUPER_ADMIN_EMAIL}?subject=${subject}&body=${body}`, '_blank');
  };

  // 5. Restore Search
  const handleSearchBackup = async () => {
    const targetEmail = restoreEmail.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      alert('براہِ کرم درست جی میل ایڈریس درج کریں۔');
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
          message: res.message || `اکاؤنٹ (${targetEmail}) کا کوئی کلاؤڈ بیک اپ آن لائن دستیاب نہیں ملا۔`,
        });
      }
    } catch (e: any) {
      setRestoreStatus({
        success: false,
        message: 'کلاؤڈ بیک اپ تلاش کرنے میں خرابی: ' + (e.message || ''),
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
          message: res.message || 'کلاؤڈ ڈیٹا کامیابی سے بحال کر دیا گیا ہے!',
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setRestoreStatus({
          success: false,
          message: res.message || 'ڈیٹا بحال کرنے میں ناکامی ہوئی۔',
        });
      }
    } catch (e: any) {
      setRestoreStatus({
        success: false,
        message: 'خرابی: ' + (e.message || ''),
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // 7. Restore from Local File
  const handleFileUploadRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.products || parsed.invoices) {
          localStorage.setItem('jk_pos_backup_restore_pending', text);
          alert('بیک اپ فائل کامیابی سے امپورٹ ہو گئی ہے۔ سافٹ ویئر دوبارہ لوڈ ہو رہا ہے...');
          window.location.reload();
        } else {
          alert('فائل کا فارمیٹ درست نہیں ہے!');
        }
      } catch (err: any) {
        alert('درست فارمیٹ نہیں ہے: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-[#080d18] text-slate-100 flex flex-col lg:flex-row font-sans relative overflow-x-hidden selection:bg-emerald-500 selection:text-white"
    >
      {/* Background ambient lighting glows */}
      <div className="absolute top-0 right-1/4 w-[550px] h-[550px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* ========================================================================= */}
      {/* LEFT COLUMN: IMMERSIVE SUPERMARKET STORE HERO (DESKTOP)                   */}
      {/* ========================================================================= */}
      <div className="relative w-full lg:flex-1 h-[36vh] sm:h-[42vh] lg:h-screen lg:min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center">
        <img
          src="/images/oneshop-pos-supermarket.jpg"
          alt="OneShop POS - Enterprise Supermarket System"
          className="w-full h-full object-cover object-center transform transition-transform duration-1000 hover:scale-102 filter brightness-85 contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[#080d18] via-transparent to-transparent hidden lg:block pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080d18] via-transparent to-transparent lg:hidden pointer-events-none" />

        {/* Hero Overlay Branding Badge */}
        <div className="absolute bottom-6 right-6 hidden lg:block bg-slate-950/80 backdrop-blur-md border border-slate-800 p-4 rounded-2xl max-w-sm shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono font-bold text-xs text-emerald-400 uppercase tracking-wider">
              Enterprise Cloud ERP v2.0
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            10 کاؤنٹرز ہائی اسپیڈ بلنگ، تھرمل پرنٹ، بارکوڈ اسکینر اور 100% آن لائن و آف لائن محفوظ کلاؤڈ سنک۔
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: EXECUTIVE CORPORATE AUTHENTICATION PANEL                     */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[480px] xl:w-[520px] lg:min-h-screen flex flex-col justify-between p-6 sm:p-8 lg:p-10 border-t lg:border-t-0 lg:border-r border-slate-800/80 bg-[#090f1d] shadow-2xl relative z-10">
        <div className="my-auto w-full max-w-sm mx-auto relative z-10">
          {/* Top Brand Emblem */}
          <div className="text-center space-y-1 mb-6">
            <div className="w-12 h-12 mx-auto mb-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-[1.5px] shadow-lg shadow-emerald-950/60 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <span className="font-mono font-black text-sm text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                  POS
                </span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight flex items-center justify-center gap-1.5">
              <span>OneShop</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">POS</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                v2.0
              </span>
            </h2>

            <p className="text-xs text-slate-400 font-medium">
              Multi-Counter Enterprise ERP • JK Developers Pakistan
            </p>
          </div>

          {/* ========================================================================= */}
          {/* VIEW A: PENDING APPROVAL SCREEN (WHEN CLIENT REGISTERED OR UNAPPROVED)    */}
          {/* ========================================================================= */}
          {isPendingApproval ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 text-right">
              {isApprovedAndUnlocking ? (
                <div className="bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200 p-6 rounded-2xl shadow-xl text-center space-y-3 animate-in zoom-in-95">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-900 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-7 h-7 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-emerald-300">
                      🎉 لائسنس منظور ہو چکا ہے!
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      آپ کا اکاؤنٹ جے کے ڈویلپرز پاکستان کی جانب سے منظور کر دیا گیا ہے۔
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>سافٹ ویئر لانچ کیا جا رہا ہے...</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/90 border border-amber-500/40 text-amber-200 p-5 rounded-2xl shadow-sm text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>

                  <div>
                    <h3 className="font-black text-base text-white">
                      ⏳ اکاؤنٹ تصدیق کا منتظر ہے
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      آپ کے اسٹور کی رجسٹریشن موصول ہو چکی ہے۔ سسٹم سیکیورٹی اور لائسنس کے ضوابط کے تحت ایڈمنسٹریٹر کی منظوری درکار ہے۔
                    </p>
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 text-emerald-300 rounded-full text-[11px] font-bold border border-emerald-700/60">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>لائیو سنک فعال (منظور ہوتے ہی اسکرین خودکار کھل جائے گی)</span>
                    </div>
                  </div>

                  {/* Registered details card */}
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 text-xs text-right space-y-1.5">
                    {pendingUser?.name && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">مالک کا نام:</span>
                        <span className="font-bold text-white">{pendingUser.name}</span>
                      </div>
                    )}
                    {pendingUser?.businessName && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">دکان / کاروبار:</span>
                        <span className="font-bold text-white">{pendingUser.businessName}</span>
                      </div>
                    )}
                    {pendingUser?.phone && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">موبائل نمبر:</span>
                        <span className="font-mono text-white" dir="ltr">{pendingUser.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">رجسٹرڈ جی میل:</span>
                      <span className="font-mono text-white text-[11px]" dir="ltr">
                        {pendingUser?.email || currentUserEmail}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-800">
                      <span className="text-slate-400">اسٹیٹس:</span>
                      <span className="font-bold text-amber-400 bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded-full text-[10.5px]">
                        Pending Approval (Locked)
                      </span>
                    </div>
                  </div>

                  {/* Notification Action Buttons */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppNotification()}
                      className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      <Phone className="w-4 h-4" />
                      <span>واٹس ایپ پر درخواست بھیجیں</span>{' '}
                      <span dir="ltr" className="phone-number font-mono">(0300-8998381)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendEmailNotification()}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-95 cursor-pointer"
                    >
                      <Mail className="w-4 h-4 text-rose-400" />
                      <span>جی میل پر رابطہ کریں (jkdevelopers.pk@gmail.com)</span>
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setPendingUser(null);
                  logoutUser();
                  setActiveTab('login');
                }}
                className="w-full py-2 text-xs text-slate-400 hover:text-white font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>سائن آؤٹ کریں اور لاگ ان پر واپس جائیں</span>
              </button>
            </div>
          ) : (
            /* ========================================================================= */
            /* VIEW B: MAIN LOGIN & REGISTRATION INTERFACE (CLEAN CORPORATE DESIGN)       */
            /* ========================================================================= */
            <div className="space-y-4">
              {/* Segmented Top Tab Switcher */}
              <div className="p-1 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-1 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setLoginError('');
                    setRegError('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-slate-850 text-emerald-400 shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  لاگ ان (Sign In)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setLoginError('');
                    setRegError('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-slate-850 text-emerald-400 shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  نیا اکاؤنٹ (Register)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('restore');
                    setLoginError('');
                    setRegError('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'restore'
                      ? 'bg-slate-850 text-cyan-400 shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  کلاؤڈ ریکوری
                </button>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* TAB 1: CLIENT SIGN IN                                         */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'login' && (
                <form onSubmit={handleClientLogin} className="space-y-3.5 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 text-right">
                      صارف ای میل / User ID:
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
                        placeholder="yourstore@gmail.com"
                        className="w-full pl-3 pr-10 py-2.5 text-xs font-mono rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none text-left transition shadow-inner"
                        autoFocus
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 text-right">
                      پاس ورڈ / Password:
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
                        placeholder="••••••••"
                        className="w-full pl-3 pr-10 py-2.5 text-xs font-mono rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none text-left transition shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  {/* EXECUTIVE EMERALD GRADIENT LOGIN BUTTON */}
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl font-black text-xs sm:text-sm tracking-wide shadow-md shadow-emerald-950/60 border border-emerald-400/30 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
                  >
                    {isLoggingIn ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>تصدیق ہو رہی ہے...</span>
                      </>
                    ) : (
                      <span>لاگ ان کریں (Sign In)</span>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('restore')}
                      className="hover:text-emerald-400 transition cursor-pointer"
                    >
                      پاس ورڈ بھول گئے؟ (Forgot Password)
                    </button>

                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-300 transition select-none">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded accent-emerald-500 bg-slate-900 border-slate-700"
                      />
                      <span>یاد رکھیں (Remember)</span>
                    </label>
                  </div>

                  {/* DIRECT SWITCH TO REGISTRATION FOR NEW USERS */}
                  <div className="pt-3 border-t border-slate-800/80 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('register');
                        setLoginError('');
                        setRegError('');
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 hover:border-emerald-500/50 text-xs font-bold text-emerald-300 hover:text-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm group"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                      <span>نیا کاروبار ہے؟ نیا اکاؤنٹ رجسٹر کریں (New Store? Register here)</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 2: STORE OWNER REGISTRATION FORM                           */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'register' && (
                <form onSubmit={handleClientRegister} className="space-y-3 animate-in fade-in duration-150 text-right">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
                      مالک کا پورا نام (Owner Name):
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => {
                        setRegName(e.target.value);
                        setRegError('');
                      }}
                      placeholder="e.g. محمد سفیان"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
                      دکان یا کاروبار کا نام (Business Name):
                    </label>
                    <input
                      type="text"
                      value={regBusinessName}
                      onChange={(e) => {
                        setRegBusinessName(e.target.value);
                        setRegError('');
                      }}
                      placeholder="e.g. الفلاح سپر اسٹور"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
                      موبائل یا واٹس ایپ نمبر (Phone / WhatsApp):
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
                      className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:border-emerald-500 outline-none text-left"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
                      رجسٹرڈ جی میل ایڈریس (Gmail Address):
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
                      className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:border-emerald-500 outline-none text-left"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-right">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
                        پاس ورڈ:
                      </label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        dir="ltr"
                        value={regPassword}
                        onChange={(e) => {
                          setRegPassword(e.target.value);
                          setRegError('');
                        }}
                        placeholder="••••"
                        className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:border-emerald-500 outline-none text-left"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
                        تصدیق پاس ورڈ:
                      </label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        dir="ltr"
                        value={regConfirmPassword}
                        onChange={(e) => {
                          setRegConfirmPassword(e.target.value);
                          setRegError('');
                        }}
                        placeholder="••••"
                        className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-500 focus:border-emerald-500 outline-none text-left"
                      />
                    </div>
                  </div>

                  {regError && (
                    <div className="p-2.5 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{regError}</span>
                    </div>
                  )}

                  {/* Helpful explanatory notification banner */}
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-[11px] text-emerald-300 leading-relaxed text-right flex items-start gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>
                      اکاؤنٹ بناتے ہی فوری جے کے ڈویلپرز ایڈمن کو واٹس ایپ (<span dir="ltr" className="font-mono font-bold text-white phone-number">0300-8998381</span>) اور جی میل پر الرٹ چلا جائے گا، اور منظوری ملتے ہی سافٹ ویئر فوری خودکار ان لاک ہو جائے گا۔
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl font-black text-xs sm:text-sm shadow-md shadow-emerald-950/60 border border-emerald-400/30 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer mt-1"
                  >
                    {isRegistering ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>درخواست بھیجی جا رہی ہے...</span>
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4 text-emerald-300" />
                        <span>اکاؤنٹ رجسٹر کریں اور واٹس ایپ پر الرٹ بھیجیں</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 border-t border-slate-800/80 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('login');
                        setLoginError('');
                        setRegError('');
                      }}
                      className="text-xs font-bold text-slate-400 hover:text-white inline-flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>پہلے سے اکاؤنٹ موجود ہے؟ لاگ ان پر جائیں (Sign In)</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 3: CLOUD DATA RECOVERY                                    */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'restore' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150 text-right">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-xl shrink-0">
                      <CloudDownload className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-white">
                        کلاؤڈ ریکوری (ڈیوائس تبدیلی یا گمشدگی پر)
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                        اپنی رجسٹرڈ جی میل درج کریں؛ تمام انوینٹری اور کھاتہ جات کلاؤڈ سے فوری بحال ہو جائیں گے۔
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-300">
                      رجسٹرڈ جی میل ایڈریس:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        dir="ltr"
                        value={restoreEmail}
                        onChange={(e) => setRestoreEmail(e.target.value)}
                        placeholder="yourstore@gmail.com"
                        className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-800 bg-slate-900 text-white placeholder-slate-500 outline-none focus:border-cyan-500 text-left"
                      />
                      <button
                        type="button"
                        disabled={isSearchingBackup || isRestoring}
                        onClick={handleSearchBackup}
                        className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm flex items-center gap-1 cursor-pointer"
                      >
                        {isSearchingBackup ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>تلاش کریں</span>}
                      </button>
                    </div>
                  </div>

                  {restoreStatus && (
                    <div
                      className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        restoreStatus.success
                          ? 'bg-emerald-950 text-emerald-200 border border-emerald-700'
                          : 'bg-rose-950 text-rose-200 border border-rose-700'
                      }`}
                    >
                      {restoreStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                      <span>{restoreStatus.message}</span>
                    </div>
                  )}

                  {foundBackup && (
                    <div className="bg-slate-900 border border-cyan-500/50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-cyan-400">✓ کلاؤڈ بیک اپ دستیاب ہے!</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(foundBackup.exportedAt).toLocaleDateString('ur-PK')}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isRestoring}
                        onClick={handleExecuteRestore}
                        className="w-full py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isRestoring ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>ڈیٹا بحال ہو رہا ہے...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>تمام ڈیٹا کلاؤڈ سے بحال کریں</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">یا لوکل بیک اپ فائل سے:</span>
                    <label className="cursor-pointer px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 font-bold inline-flex items-center gap-1">
                      <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>فائل منتخب کریں (.json)</span>
                      <input type="file" accept=".json" onChange={handleFileUploadRestore} className="hidden" />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM FOOTER BAR (CLEAN, PROFESSIONAL, DISCREET MASTER ACCESS)           */}
        {/* ========================================================================= */}
        <footer className="mt-8 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400 space-y-1 w-full relative z-10">
          <p className="font-medium text-slate-300">
            OneShop POS • Licensed by <span className="text-white font-bold">JK Developers Pakistan</span>
          </p>
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <span>© 2026 JK Developers Pakistan</span>
            <span>•</span>
            <span dir="ltr" className="font-mono text-slate-400 phone-number">0300-8998381</span>
            <span>•</span>
            {/* Subtle discreet lock icon for developer master login (no public banner) */}
            <button
              type="button"
              onClick={() => {
                setMasterKeyInput('');
                setMasterKeyError('');
                setMasterKeyModalOpen(true);
              }}
              className="p-0.5 text-slate-600 hover:text-emerald-400 transition cursor-pointer"
              title="سیکیورٹی پروٹوکول"
            >
              <Lock className="w-3 h-3 opacity-30 hover:opacity-100" />
            </button>
          </div>
        </footer>
      </div>

      {/* ========================================================================= */}
      {/* DEVELOPER MASTER KEY SECRET MODAL (ONLY FOR JK DEVELOPERS PAKISTAN)        */}
      {/* ========================================================================= */}
      {masterKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir="rtl">
          <div className="bg-slate-900 border-2 border-emerald-500/70 rounded-3xl w-full max-w-sm p-6 text-white shadow-2xl relative animate-in fade-in zoom-in-95 text-right">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-emerald-200">
                  ڈویلپر ماسٹر ایکسس (Master Key)
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  JK Developers Pakistan
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              یہ پینل صرف جے کے ڈویلپرز پاکستان کے لیے مختص ہے۔ سپر ایڈمن میں داخل ہونے کے لیے ماسٹر سیکیورٹی کی درج فرمائیں۔
            </p>

            <form onSubmit={handleMasterKeySubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  ماسٹر سیکیورٹی کی (Security Key):
                </label>
                <div className="relative">
                  <input
                    type={showMasterKey ? 'text' : 'password'}
                    dir="ltr"
                    value={masterKeyInput}
                    onChange={(e) => {
                      setMasterKeyInput(e.target.value);
                      setMasterKeyError('');
                    }}
                    placeholder="Enter Master Security Key..."
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs font-mono outline-none text-white focus:ring-2 focus:ring-emerald-500/40 text-left"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowMasterKey(!showMasterKey)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showMasterKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  تصدیق کریں و لاگ ان
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMasterKeyModalOpen(false);
                    setMasterKeyInput('');
                    setMasterKeyError('');
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded-xl text-xs cursor-pointer"
                >
                  منسوخ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Modal (Only rendered when Master Key is verified) */}
      <SuperAdminModal />
    </div>
  );
};
