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

  const [isApprovedAndUnlocking, setIsApprovedAndUnlocking] = useState(false);

  // REAL-TIME AUTO UNLOCK: Continuously checks every 2.5s if Super Admin approved this user.
  // The moment Admin clicks "Approve", the client screen automatically unlocks and launches the POS!
  useEffect(() => {
    const targetEmail = pendingUser?.email || (currentUserEmail && !isApprovedUser ? currentUserEmail : null);
    if (!targetEmail) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/users?email=${encodeURIComponent(targetEmail)}`);
        const data = await res.json();
        if (data.success && data.found && data.approved) {
          clearInterval(interval);
          setIsApprovedAndUnlocking(true);
          loginUser({ email: targetEmail });
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
      setLoginError('Please enter a valid Gmail address.');
      return;
    }

    // STRICT ANTI-HIJACK CHECK: Users cannot log into developer's Super Admin email via regular form
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setLoginError('⛔ This email is reserved for Developer Master Access. Please sign in with your own registered account.');
      return;
    }

    setIsLoggingIn(true);
    const res = loginUser({
      email: cleanEmail,
      password: loginPassword,
    });
    setIsLoggingIn(false);

    if (res.status === 'NOT_FOUND') {
      setLoginError(res.message || 'Account not found. Please create a new account.');
      return;
    }

    if (res.status === 'WRONG_PASSWORD') {
      setLoginError(res.message || 'Incorrect password. Please try again.');
      return;
    }

    if (res.status === 'PENDING') {
      setPendingUser({
        name: res.user?.name || cleanEmail.split('@')[0],
        businessName: res.user?.businessName || res.user?.shopName || 'Store',
        phone: res.user?.phone || '',
        email: cleanEmail,
      });
      return;
    }

    if (res.status === 'DENIED') {
      setLoginError(res.message || 'Access has been denied by administrator.');
      return;
    }
  };

  // 2. Handle Client Registration
  const handleClientRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim()) {
      setRegError('Please enter your full name.');
      return;
    }
    if (!regBusinessName.trim()) {
      setRegError('Please enter your shop or business name.');
      return;
    }
    if (!regPhone.trim()) {
      setRegError('Please enter your mobile / WhatsApp number.');
      return;
    }
    const cleanEmail = regEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setRegError('Please enter a valid Gmail address.');
      return;
    }
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setRegError('This email address is reserved. Please enter your personal or business Gmail.');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setRegError('Password must be at least 4 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please re-enter carefully.');
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
      setRegError(res.message || 'An account with this email already exists.');
      return;
    }
    if (res.status === 'ERROR') {
      setRegError(res.message || 'An error occurred during registration.');
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

    // Automatically trigger WhatsApp notification so the request is sent immediately
    setTimeout(() => {
      handleSendWhatsAppNotification(newClient);
    }, 400);
  };

  // 3. Handle Secret Master Key Submit (Only for developer)
  const handleMasterKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterKeyInput.trim()) {
      setMasterKeyError('Please enter the Master Security Key.');
      return;
    }

    const res = superAdminLoginWithMasterKey(masterKeyInput);
    if (!res.success) {
      setMasterKeyError(res.message || 'Invalid Master Key. Access Denied.');
      return;
    }

    setMasterKeyModalOpen(false);
    setMasterKeyInput('');
    setMasterKeyError('');
  };

  // 4. Handle WhatsApp Notification to Company
  const handleSendWhatsAppNotification = (userToNotify?: {
    name: string;
    businessName: string;
    phone: string;
    email: string;
  }) => {
    const u = userToNotify || pendingUser;
    const msg = `Salam JK Developers Pakistan!
I have registered a new store account on OneShop POS:
━━━━━━━━━━━━━━━━━━
👤 Owner Name: ${u?.name || 'Client'}
🏪 Business: ${u?.businessName || 'Store'}
📱 Phone/WhatsApp: ${u?.phone || 'N/A'}
📧 Gmail: ${u?.email || currentUserEmail}
🕒 Time: ${new Date().toLocaleString('en-US')}
━━━━━━━━━━━━━━━━━━
Please review and grant approval to activate my software license. Thank you!`;

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
      alert('Please enter a valid Gmail address.');
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
            `No online cloud backup found for account (${targetEmail}).`,
        });
      }
    } catch (e: any) {
      setRestoreStatus({
        success: false,
        message: 'Error searching cloud backup: ' + (e.message || ''),
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
          message: res.message || 'Backup successfully restored!',
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setRestoreStatus({
          success: false,
          message: res.message || 'Failed to restore backup.',
        });
      }
    } catch (e: any) {
      setRestoreStatus({
        success: false,
        message: 'Restore error: ' + (e.message || ''),
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
          alert('✓ Data, inventory and accounts successfully restored from backup file!');
          window.location.reload();
        } else {
          alert('Failed to import backup file!');
        }
      } catch (err: any) {
        alert('File is not in valid format: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      dir="ltr"
      className="min-h-screen bg-[#07131b] text-slate-100 flex flex-col justify-between p-3 sm:p-5 lg:p-6 font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-white"
    >
      {/* Background ambient lighting glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Split-Screen Layout Grid */}
      <div className="w-full max-w-7xl mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: HERO SHOWCASE ILLUSTRATION                                   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3] rounded-3xl overflow-hidden border border-cyan-900/40 shadow-2xl bg-[#091b26] group">
            <img
              src="/images/oneshop-pos-supermarket.jpg"
              alt="OneShop POS Supermarket - Developed & Licensed by JK Developers Pakistan"
              className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-102"
            />
            {/* Subtle dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: DARK GLASS AUTH CARD (MATCHING USER MOCKUP EXACTLY)         */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto bg-[#0f2430]/90 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-cyan-950/50 text-white relative">
            {/* Top Brand Header matching mockup */}
            <div className="text-center space-y-1 mb-5">
              <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 text-2xl shadow-lg shadow-amber-500/25 border border-amber-300/40">
                🛒
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight font-mono">
                  <span className="text-white">ONE </span>
                  <span className="text-cyan-400">SHOP POS</span>
                </h2>
                <p className="text-sm font-bold text-slate-200 font-urdu tracking-wide mt-0.5">
                  ون شاپ پی او ایس
                </p>
                <p className="text-xs italic text-teal-300 font-serif font-medium mt-0.5">
                  سیکیور کلاؤڈ سسٹم
                </p>
                <p className="text-[10px] text-slate-400 font-sans tracking-wide mt-0.5">
                  (Admin Approval Required)
                </p>
              </div>
            </div>

        {/* ========================================================================= */}
        {/* VIEW A: PENDING APPROVAL SCREEN (WHEN CLIENT REGISTERED OR UNAPPROVED)    */}
        {/* ========================================================================= */}
        {(pendingUser || (currentUserEmail && !isApprovedUser)) && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 text-left">
            {isApprovedAndUnlocking ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-200 p-6 rounded-2xl shadow-xl text-center space-y-3 animate-in zoom-in-95">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-8 h-8 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-emerald-700 dark:text-emerald-300">
                    🎉 License Approved!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                    Your OneShop POS account has been successfully approved by JK Developers Pakistan.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Launching your POS now...</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#162e3d]/80 border border-amber-500/50 text-amber-200 p-5 rounded-2xl shadow-sm text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>

                <div>
                  <h3 className="font-black text-base sm:text-lg text-white">
                    ⏳ Account Awaiting Approval
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">
                    Your store details have been registered. For security and license protection, administrator approval is required before you can access the POS software.
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 text-emerald-300 rounded-full text-[11px] font-bold border border-emerald-700/60">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Live Auto-Sync Active (Screen unlocks upon approval)</span>
                  </div>
                </div>

                {/* Registered details card */}
                <div className="bg-[#0d212b] rounded-xl p-3 border border-slate-700 text-xs text-left space-y-1.5 font-mono">
                  {pendingUser?.name && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-sans">Full Name:</span>
                      <span className="font-bold font-sans text-white">
                        {pendingUser.name}
                      </span>
                    </div>
                  )}
                  {pendingUser?.businessName && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-sans">Business / Shop:</span>
                      <span className="font-bold font-sans text-white">
                        {pendingUser.businessName}
                      </span>
                    </div>
                  )}
                  {pendingUser?.phone && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-sans">Mobile / WhatsApp:</span>
                      <span className="font-bold text-white">
                        {pendingUser.phone}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-sans">Registered Gmail:</span>
                    <span className="font-bold text-white">
                      {pendingUser?.email || currentUserEmail}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-700/60">
                    <span className="text-slate-400 font-sans">License Status:</span>
                    <span className="font-bold text-amber-400 font-sans bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded-full text-[11px]">
                      Pending Approval (Locked)
                    </span>
                  </div>
                </div>

                {/* Notification Action Buttons */}
                <div className="space-y-2 pt-1">
                  {/* 1. WhatsApp Button */}
                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppNotification()}
                    className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Send Request via WhatsApp (0300-8998381)</span>
                  </button>

                  {/* 2. Gmail / Email Button */}
                  <button
                    type="button"
                    onClick={() => handleSendEmailNotification()}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Send Request via Gmail (jkdevelopers.pk@gmail.com)</span>
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
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              <span>Sign Out & Return to Login</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW B: MAIN LOGIN & REGISTRATION INTERFACE                               */}
        {/* ========================================================================= */}
        {!pendingUser && (!currentUserEmail || isApprovedUser === false) && (
          <div className="space-y-4 text-left">
            {/* Top Navigation Bar only shown when NOT on primary login screen */}
            {activeTab !== 'login' && (
              <div className="flex items-center justify-between p-2 rounded-2xl bg-[#132a38] border border-slate-700/60 mb-2">
                <span className="text-xs font-bold text-cyan-300 px-2">
                  {activeTab === 'register' ? 'New Store Account' : 'Cloud Restore'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setLoginError('');
                    setRegError('');
                  }}
                  className="px-3 py-1 bg-[#162e3d] hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 border border-slate-600/50"
                >
                  <ArrowRight className="w-3 h-3 rotate-180" />
                  <span>لاگ ان پر واپس جائیں (Back)</span>
                </button>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 1: CLIENT SIGN IN (MATCHING USER MOCKUP EXACTLY)           */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'login' && (
              <form onSubmit={handleClientLogin} className="space-y-3.5 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    User ID
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
                      placeholder="User ID / Username"
                      className="w-full px-4 py-2.5 text-xs font-mono rounded-xl border border-slate-700 bg-[#162e3d] text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-left pr-10"
                      autoFocus
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Password
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
                      placeholder="Password"
                      className="w-full px-4 py-2.5 text-xs font-mono rounded-xl border border-slate-700 bg-[#162e3d] text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-left pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
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

                {/* VIBRANT TEAL/CYAN GRADIENT LOGIN BUTTON (MATCHING MOCKUP) */}
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 disabled:opacity-50 text-slate-950 rounded-xl font-black text-sm uppercase tracking-wide shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Verifying credentials...</span>
                    </>
                  ) : (
                    <span>لاگ ان / LOGIN</span>
                  )}
                </button>

                {/* Checkbox & Forgot Password Row (Matching Mockup) */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('restore')}
                    className="hover:text-cyan-400 transition"
                  >
                    Forgot Password?
                  </button>

                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-300 transition select-none">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded accent-cyan-500 bg-slate-800 border-slate-700"
                    />
                    <span>Remember Me</span>
                  </label>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-bold transition"
                  >
                    New Business? Register a new account here
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
                  <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
                    Owner Full Name:
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value);
                      setRegError('');
                    }}
                    placeholder="e.g. Kamran Rafique"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-700 bg-[#162e3d] text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
                    Shop / Business Name:
                  </label>
                  <input
                    type="text"
                    value={regBusinessName}
                    onChange={(e) => {
                      setRegBusinessName(e.target.value);
                      setRegError('');
                    }}
                    placeholder="e.g. Farhan Superstore"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-700 bg-[#162e3d] text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
                    Mobile / WhatsApp Number:
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
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-700 bg-[#162e3d] text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-left"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
                    Gmail Address:
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
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-700 bg-[#162e3d] text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-left"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
                      Password:
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
                      className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-700 bg-[#162e3d] text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-left"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
                      Confirm Password:
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
                      className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-700 bg-[#162e3d] text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-left"
                    />
                  </div>
                </div>

                {regError && (
                  <div className="p-2.5 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 text-white rounded-xl font-black text-xs shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all mt-2"
                >
                  {isRegistering ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Registration & Notification...</span>
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4" />
                      <span>Register & Request Account Approval</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-bold"
                  >
                    Already have an account? Sign In here
                  </button>
                </div>
              </form>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 3: 1-CLICK RESTORE FROM GOOGLE ACCOUNT                     */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'restore' && (
              <div className="bg-[#162e3d]/80 border border-slate-700 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-cyan-600 text-white rounded-xl shrink-0 shadow-sm">
                    <CloudDownload className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs text-white">
                      Google Cloud Restore
                    </h3>
                    <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                      On a new PC, enter your registered Gmail to automatically restore all inventory, ledgers, and sales data from cloud.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-300">
                    Registered Gmail Address:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      dir="ltr"
                      value={restoreEmail}
                      onChange={(e) => setRestoreEmail(e.target.value)}
                      placeholder="yourstore@gmail.com"
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-700 bg-[#0d212b] text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-cyan-400 text-left"
                    />
                    <button
                      type="button"
                      disabled={isSearchingBackup || isRestoring}
                      onClick={handleSearchBackup}
                      className="px-3 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 text-white rounded-xl text-xs font-black shrink-0 shadow-md flex items-center gap-1"
                    >
                      {isSearchingBackup ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>🔍 Search</span>}
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
                  <div className="bg-[#0f2430] border border-cyan-500/50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-cyan-400">✓ Cloud Backup Found!</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(foundBackup.exportedAt).toLocaleDateString('en-US')}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={handleExecuteRestore}
                      className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-black text-xs shadow-md flex items-center justify-center gap-2"
                    >
                      {isRestoring ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Restoring Data...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Restore All Data from Cloud</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Or restore from JSON file:</span>
                  <label className="cursor-pointer px-2.5 py-1 bg-[#0d212b] hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 font-bold inline-flex items-center gap-1">
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Choose File (.json)</span>
                    <input type="file" accept=".json" onChange={handleFileUploadRestore} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>

  {/* ========================================================================= */}
  {/* FULL-WIDTH BOTTOM FOOTER BAR (EXACTLY MATCHING USER MOCKUP)                */}
  {/* ========================================================================= */}
  <footer className="w-full max-w-7xl mx-auto mt-4 pt-3 border-t border-cyan-950/80 text-center text-xs text-slate-400 space-y-1">
    <p className="font-medium text-slate-300">
      Developed & Licensed by <span className="text-white font-bold">JK Developers Pakistan</span> • <span className="font-urdu">جے کے ڈویلپرز پاکستان</span>
    </p>
    <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
      <span>© 2026 JK Developers Pakistan</span>
      <span>•</span>
      <button
        type="button"
        onClick={() => {
          setMasterKeyInput('');
          setMasterKeyError('');
          setMasterKeyModalOpen(true);
        }}
        className="p-1 hover:text-cyan-400 transition"
        title="Master Key Access"
      >
        <Lock className="w-3 h-3 inline opacity-40 hover:opacity-100" />
      </button>
    </div>
  </footer>

      {/* ========================================================================= */}
      {/* DEVELOPER MASTER KEY SECRET MODAL (ONLY FOR JK DEVELOPERS PAKISTAN)        */}
      {/* ========================================================================= */}
      {masterKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir="ltr">
          <div className="bg-slate-900 border-2 border-emerald-500/70 rounded-3xl w-full max-w-sm p-6 text-white shadow-2xl relative animate-in fade-in zoom-in-95 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-emerald-200">
                  Developer Master Access
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  JK Developers Pakistan
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              This panel is restricted exclusively to JK Developers Pakistan. Please enter your Master Security Key.
            </p>

            <form onSubmit={handleMasterKeySubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Master Security Key:
                </label>
                <input
                  type="password"
                  dir="ltr"
                  value={masterKeyInput}
                  onChange={(e) => {
                    setMasterKeyInput(e.target.value);
                    setMasterKeyError('');
                  }}
                  placeholder="Enter secret key..."
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
                  Verify & Unlock
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
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
