'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useShop } from '@/context/ShopContext';
import { PosUserLicense } from '@/types';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Trash2,
  UserPlus,
  X,
  Search,
  ExternalLink,
  Phone,
  RefreshCw,
  AlertTriangle,
  Building2,
  LogOut,
  Send,
  Calendar,
  Lock,
  Unlock,
  Check,
  AlertCircle,
  Hourglass,
  Sparkles,
} from 'lucide-react';

export const SuperAdminModal: React.FC = () => {
  const {
    usersDB,
    isSuperAdminModalOpen,
    setIsSuperAdminModalOpen,
    deleteUserLicense,
    refreshUsersFromCloud,
    logoutUser,
  } = useShop();

  const SUPER_ADMIN_EMAIL = 'jkdevelopers.pk@gmail.com';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'active' | 'expired' | 'blocked'>('pending');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add Client Form States
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newBusiness, setNewBusiness] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDuration, setNewDuration] = useState<number>(12);

  // Slide-Over Drawer States for User Approval & Duration Management
  const [selectedUserForApproval, setSelectedUserForApproval] = useState<PosUserLicense | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(12); // Default: 1 Year (12 months)
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Duration Options (Strictly 1, 3, 6, 12, 36, 60 Months)
  const durationOptions = [
    { months: 1, labelUr: '1 ماہ', labelEn: '1 Month', tag: 'آزمائشی' },
    { months: 3, labelUr: '3 ماہ', labelEn: '3 Months', tag: 'کوارٹرلی' },
    { months: 6, labelUr: '6 ماہ', labelEn: '6 Months', tag: 'ہاف ایئرلی' },
    { months: 12, labelUr: '1 سال', labelEn: '1 Year', tag: 'تجویز کردہ (مقبول)', popular: true },
    { months: 36, labelUr: '3 سال', labelEn: '3 Years', tag: 'طویل مدتی' },
    { months: 60, labelUr: '5 سال', labelEn: '5 Years', tag: 'لائف ٹائم پلس' },
  ];

  // Auto-sync with cloud database when open & every 3 seconds
  useEffect(() => {
    if (!isSuperAdminModalOpen) return;
    refreshUsersFromCloud();
    const interval = setInterval(() => {
      refreshUsersFromCloud();
    }, 3000);
    return () => clearInterval(interval);
  }, [isSuperAdminModalOpen]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshUsersFromCloud();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Helper to calculate user status
  const getUserStatus = (user: PosUserLicense): 'pending' | 'active' | 'expired' | 'blocked' => {
    const isMaster = user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    if (isMaster) return 'active';

    if (user.status) {
      if (user.status === 'blocked') return 'blocked';
      if (user.status === 'expired') return 'expired';
      if (user.status === 'pending') return 'pending';
      if (user.status === 'active') {
        if (user.expiry_date && new Date(user.expiry_date).getTime() <= Date.now()) {
          return 'expired';
        }
        return 'active';
      }
    }

    if (user.approved) {
      if (user.expiry_date && new Date(user.expiry_date).getTime() <= Date.now()) {
        return 'expired';
      }
      return 'active';
    }

    return 'pending';
  };

  // Helper to compute remaining days
  const getRemainingDays = (user: PosUserLicense): number => {
    if (user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return 9999;
    if (!user.expiry_date) return 0;
    const diff = new Date(user.expiry_date).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Preview new expiry date
  const previewExpiryDate = useMemo(() => {
    const now = new Date();
    const expiry = new Date(now);
    expiry.setMonth(expiry.getMonth() + selectedDuration);
    return expiry.toLocaleDateString('ur-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [selectedDuration]);

  if (!isSuperAdminModalOpen) return null;

  // Counts
  const totalClients = usersDB.length;
  const pendingCount = usersDB.filter(
    (u) => getUserStatus(u) === 'pending' && u.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()
  ).length;
  const activeCount = usersDB.filter((u) => getUserStatus(u) === 'active').length;
  const expiredCount = usersDB.filter((u) => getUserStatus(u) === 'expired').length;
  const blockedCount = usersDB.filter((u) => getUserStatus(u) === 'blocked').length;

  // Filtered & Sorted Users
  const filteredUsers = usersDB
    .filter((u) => {
      const status = getUserStatus(u);
      if (filterTab === 'pending') return status === 'pending';
      if (filterTab === 'active') return status === 'active';
      if (filterTab === 'expired') return status === 'expired';
      if (filterTab === 'blocked') return status === 'blocked';
      return true;
    })
    .filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        u.email.toLowerCase().includes(q) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.businessName && u.businessName.toLowerCase().includes(q)) ||
        (u.shopName && u.shopName.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q))
      );
    })
    .sort((a, b) => {
      const statusA = getUserStatus(a);
      const statusB = getUserStatus(b);
      // Pending first, then Expired, then Active, then Blocked
      const order = { pending: 1, expired: 2, active: 3, blocked: 4 };
      if (order[statusA] !== order[statusB]) {
        return order[statusA] - order[statusB];
      }
      return new Date(b.registeredAt || 0).getTime() - new Date(a.registeredAt || 0).getTime();
    });

  // Handle Approve or Update Duration via API
  const handleApproveWithDuration = async (user: PosUserLicense, months: number) => {
    setIsSubmittingApproval(true);
    setActionSuccessMessage(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('pos_session_token') : null;
      const res = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          'x-super-admin-key': 'JK@8998381',
        },
        body: JSON.stringify({
          userId: user.id || user.email,
          email: user.email,
          action: 'approve',
          durationMonths: months,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccessMessage(`✓ صارف ${user.name || user.email} کو ${months} ماہ کیلئے کامیابی سے فعال کر دیا گیا!`);
        await refreshUsersFromCloud();
        setTimeout(() => {
          setSelectedUserForApproval(null);
          setActionSuccessMessage(null);
        }, 1200);
      } else {
        alert(data.message || 'منظوری میں خرابی پیش آگئی۔');
      }
    } catch (err: any) {
      alert('نیٹ ورک ایرر: ' + err.message);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Handle Block User via API
  const handleBlockUser = async (user: PosUserLicense) => {
    if (!confirm(`کیا آپ واقعی صارف "${user.name || user.email}" کو بلاک کرنا چاہتے ہیں؟ اس سے سافٹ ویئر رسائی فوری بند ہو جائے گی۔`)) {
      return;
    }
    setIsSubmittingApproval(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('pos_session_token') : null;
      const res = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          'x-super-admin-key': 'JK@8998381',
        },
        body: JSON.stringify({
          userId: user.id || user.email,
          email: user.email,
          action: 'block',
        }),
      });

      const data = await res.json();
      if (data.success) {
        await refreshUsersFromCloud();
        setSelectedUserForApproval(null);
      } else {
        alert(data.message || 'بلاک کرنے میں خرابی۔');
      }
    } catch (err: any) {
      alert('نیٹ ورک ایرر: ' + err.message);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Quick WhatsApp Notification
  const handleSendWhatsAppNotice = (user: PosUserLicense) => {
    let cleanPhone = (user.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('03')) cleanPhone = '92' + cleanPhone.substring(1);
    if (!cleanPhone) {
      alert('اس صارف کا کوئی فون نمبر درج نہیں ہے۔');
      return;
    }

    const expiryDateFormatted = user.expiry_date
      ? new Date(user.expiry_date).toLocaleDateString('en-GB')
      : 'لائف ٹائم';
    const remainingDays = getRemainingDays(user);

    const msg = `السلام علیکم محترم ${user.name || 'کسٹمر'} صاحب!
آپ کے کاروبار "${user.shopName || user.businessName || 'آپ کے اسٹور'}" کے لیے OneShop POS سافٹ ویئر کی سبسکرپشن منظور و فعال کر دی گئی ہے۔

📅 *ایکسپائری تاریخ:* ${expiryDateFormatted}
⏳ *باقی میعاد:* ${remainingDays} دن
🔑 *لاگ ان ای میل:* ${user.email}

تشریف آوری اور اعتماد کا بہت شکریہ!
━━━━━━━━━━━━━━━━━━
ادارہ: JK Developers Pakistan
کسٹمر ہیلپ لائن: 0300-8998381`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Add New Client Form
  const handleAddNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      alert('براہِ کرم درست جی میل ایڈریس درج فرمائیں۔');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail.trim(),
          ownerName: newName.trim(),
          shopName: newBusiness.trim(),
          phone: newPhone.trim(),
          password: 'User@123',
        }),
      });

      const regData = await res.json();
      if (regData.success) {
        // Immediately approve with duration
        await handleApproveWithDuration(
          {
            email: newEmail.trim(),
            name: newName.trim(),
            shopName: newBusiness.trim(),
            phone: newPhone.trim(),
            approved: false,
          },
          newDuration
        );

        setNewEmail('');
        setNewName('');
        setNewBusiness('');
        setNewPhone('');
      } else {
        alert(regData.message || 'رجسٹریشن میں خرابی');
      }
    } catch (err: any) {
      alert('ایرر: ' + err.message);
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-in fade-in text-slate-800 dark:text-slate-100 font-sans"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] relative">
        {/* Header */}
        <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base md:text-lg font-black tracking-tight font-sans">
                  ⚙️ سپر ایڈمن سبسکرپشن و رسائی منیجر
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-700">
                  JK Developers Pakistan
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                کلائنٹس کی منظوری، سبسکرپشن میعاد (1 ماہ تا 5 سال)، ریئل ٹائم سیکیورٹی اور خودکار نوٹیفکیشن
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsSuperAdminModalOpen(false);
                logoutUser();
                window.location.reload();
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              title="سپر ایڈمن سیشن بند کریں"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>لاگ آؤٹ (Lock)</span>
            </button>
            <button
              onClick={() => setIsSuperAdminModalOpen(false)}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive KPI & Filter Tabs */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-2">
          {/* Pending */}
          <button
            type="button"
            onClick={() => setFilterTab('pending')}
            className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
              filterTab === 'pending'
                ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-md ring-2 ring-amber-500/40'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-amber-500/40'
            }`}
          >
            <span className="text-[11px] font-bold block mb-0.5">⚡ منظوری کے منتظر</span>
            <span className="text-xl font-black font-mono text-amber-500">{pendingCount}</span>
          </button>

          {/* Active */}
          <button
            type="button"
            onClick={() => setFilterTab('active')}
            className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
              filterTab === 'active'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500 shadow-md ring-2 ring-emerald-500/40'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-emerald-500/40'
            }`}
          >
            <span className="text-[11px] font-bold block mb-0.5">🟢 فعال لائسنس</span>
            <span className="text-xl font-black font-mono text-emerald-500">{activeCount}</span>
          </button>

          {/* Expired */}
          <button
            type="button"
            onClick={() => setFilterTab('expired')}
            className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
              filterTab === 'expired'
                ? 'bg-rose-500/20 border-rose-500 text-rose-500 shadow-md ring-2 ring-rose-500/40'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-rose-500/40'
            }`}
          >
            <span className="text-[11px] font-bold block mb-0.5">⌛ ایکسپائرڈ اکاؤنٹس</span>
            <span className="text-xl font-black font-mono text-rose-500">{expiredCount}</span>
          </button>

          {/* Blocked */}
          <button
            type="button"
            onClick={() => setFilterTab('blocked')}
            className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
              filterTab === 'blocked'
                ? 'bg-slate-700/40 border-slate-500 text-slate-200 shadow-md ring-2 ring-slate-500/40'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-500/40'
            }`}
          >
            <span className="text-[11px] font-bold block mb-0.5">🚫 بلاک شدہ</span>
            <span className="text-xl font-black font-mono text-slate-400">{blockedCount}</span>
          </button>

          {/* All */}
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer col-span-2 sm:col-span-1 ${
              filterTab === 'all'
                ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-md ring-2 ring-blue-500/40'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-blue-500/40'
            }`}
          >
            <span className="text-[11px] font-bold block mb-0.5">📋 تمام صارفین</span>
            <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{totalClients}</span>
          </button>
        </div>

        {/* Quick Add Form */}
        <form
          onSubmit={handleAddNewClient}
          className="p-3 bg-slate-100 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2"
        >
          <div className="flex-1 min-w-[170px]">
            <input
              type="email"
              dir="ltr"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="نئی کلائنٹ جی میل (e.g. client@gmail.com)"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-left font-mono outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="w-36">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="مالک کا نام"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="w-36">
            <input
              type="text"
              value={newBusiness}
              onChange={(e) => setNewBusiness(e.target.value)}
              placeholder="دکان / کاروبار"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="w-32">
            <input
              type="tel"
              dir="ltr"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="0300-1234567"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-left outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="w-32">
            <select
              value={newDuration}
              onChange={(e) => setNewDuration(Number(e.target.value))}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
            >
              <option value={1}>1 ماہ</option>
              <option value={3}>3 ماہ</option>
              <option value={6}>6 ماہ</option>
              <option value={12}>1 سال (مقبول)</option>
              <option value={36}>3 سال</option>
              <option value={60}>5 سال</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-md transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>شامل و منظور کریں</span>
          </button>
        </form>

        {/* Search Bar & Manual Sync */}
        <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="صارف کا نام، فون، شاپ یا ای میل تلاش کریں..."
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl pr-9 pl-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>تازہ کریں (Live Sync)</span>
            </button>
            <span className="text-[11px] text-slate-500">
              تعداد: <span className="font-mono font-bold text-slate-900 dark:text-white">{filteredUsers.length}</span>
            </span>
          </div>
        </div>

        {/* User Directory Table with Strict Columns */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 text-center w-10">#</th>
                  <th className="p-3">صارف و کاروبار (User Name)</th>
                  <th className="p-3 text-center">فون (Phone)</th>
                  <th className="p-3 text-center">رجسٹریشن (Registered Date)</th>
                  <th className="p-3 text-center">ایکسپائری (Expiry Date)</th>
                  <th className="p-3 text-center">باقی دن (Remaining Days)</th>
                  <th className="p-3 text-center">اسٹیٹس (Status)</th>
                  <th className="p-3 text-center w-60">ایکشن (منظوری و دورانیہ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      کوئی ریکارڈ موجود نہیں ہے۔
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, idx) => {
                    const status = getUserStatus(user);
                    const remaining = getRemainingDays(user);
                    const isMaster = user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

                    return (
                      <tr
                        key={user.id || user.email}
                        className={`transition ${
                          status === 'pending'
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 border-r-4 border-r-amber-500'
                            : status === 'expired'
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 border-r-4 border-r-rose-500'
                            : status === 'blocked'
                            ? 'bg-slate-200/50 dark:bg-slate-900/80 opacity-75 border-r-4 border-r-slate-500'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-850/80'
                        }`}
                      >
                        <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>

                        {/* User Name & Shop */}
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{user.name || user.ownerName || 'نامعلوم'}</span>
                            {isMaster && (
                              <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black text-[9.5px]">
                                👑 سپر ایڈمن
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            {user.shopName || user.businessName || 'عام اسٹور'}
                          </span>
                          <span className="font-mono text-slate-400 block text-[10px]" dir="ltr">
                            {user.email}
                          </span>
                        </td>

                        {/* Phone */}
                        <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300" dir="ltr">
                          {user.phone || '-'}
                        </td>

                        {/* Registered Date */}
                        <td className="p-3 text-center text-slate-500 font-mono text-[11px]">
                          {user.registeredAt
                            ? new Date(user.registeredAt).toLocaleDateString('en-GB')
                            : '-'}
                        </td>

                        {/* Expiry Date */}
                        <td className="p-3 text-center font-mono text-[11px]">
                          {isMaster ? (
                            <span className="text-emerald-500 font-bold">لائف ٹائم</span>
                          ) : user.expiry_date ? (
                            <span className={status === 'expired' ? 'text-rose-500 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                              {new Date(user.expiry_date).toLocaleDateString('en-GB')}
                            </span>
                          ) : (
                            <span className="text-slate-400">نامتعین</span>
                          )}
                        </td>

                        {/* Remaining Days */}
                        <td className="p-3 text-center font-mono font-bold">
                          {isMaster ? (
                            <span className="text-emerald-400">∞</span>
                          ) : status === 'expired' ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px]">
                              0 دن (ختم)
                            </span>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] ${
                                remaining <= 7
                                  ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                                  : 'bg-emerald-500/20 text-emerald-400'
                              }`}
                            >
                              {remaining} دن
                            </span>
                          )}
                        </td>

                        {/* Status Column */}
                        <td className="p-3 text-center">
                          {status === 'pending' && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 font-bold text-[10px] animate-pulse">
                              ⚡ منتظر (Pending)
                            </span>
                          )}
                          {status === 'active' && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 font-bold text-[10px]">
                              ✓ فعال (Active)
                            </span>
                          )}
                          {status === 'expired' && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-500 border border-rose-500/40 font-bold text-[10px]">
                              ⌛ ایکسپائرڈ (Expired)
                            </span>
                          )}
                          {status === 'blocked' && (
                            <span className="px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600 font-bold text-[10px]">
                              🚫 بلاکڈ (Blocked)
                            </span>
                          )}
                        </td>

                        {/* Action Column */}
                        <td className="p-3 text-center">
                          {!isMaster && (
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {/* Open Approval & Duration Drawer */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUserForApproval(user);
                                  setSelectedDuration(user.durationMonths || 12);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
                                title="سبسکرپشن دورانیہ منتخب کر کے منظور کریں"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>منظوری و دورانیہ</span>
                              </button>

                              {/* WhatsApp Contact */}
                              {user.phone && (
                                <button
                                  type="button"
                                  onClick={() => handleSendWhatsAppNotice(user)}
                                  className="p-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 hover:text-white transition cursor-pointer"
                                  title="واٹس ایپ پر سبسکرپشن تفصیل ارسال کریں"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Toggle Block / Unblock */}
                              <button
                                type="button"
                                onClick={() => (status === 'blocked' ? handleApproveWithDuration(user, 12) : handleBlockUser(user))}
                                className={`p-1.5 rounded-xl transition cursor-pointer ${
                                  status === 'blocked'
                                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 hover:text-rose-500'
                                }`}
                                title={status === 'blocked' ? 'اکاؤنٹ بحال کریں' : 'اکاؤنٹ بلاک کریں'}
                              >
                                {status === 'blocked' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => deleteUserLicense(user.email)}
                                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white transition cursor-pointer"
                                title="اکاؤنٹ مکمل ختم کریں"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SLIDE-OVER APPROVAL & SUBSCRIPTION DURATION DRAWER (MODAL)     */}
        {/* ------------------------------------------------------------- */}
        {selectedUserForApproval && (
          <div className="fixed inset-0 z-60 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div
              dir="rtl"
              className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-in slide-in-from-left duration-200"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Hourglass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      سبسکرپشن میعاد منیجر
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      صارف کے لیے لائسنس کی مدت منتخب کریں
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUserForApproval(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Snapshot Card */}
              <div className="my-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">صارف کا نام:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedUserForApproval.name || 'نامعلوم'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">دکان / ادارہ:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedUserForApproval.shopName || selectedUserForApproval.businessName || 'عام اسٹور'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">فون نمبر:</span>
                  <span className="font-mono font-bold" dir="ltr">
                    {selectedUserForApproval.phone || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">جی میل:</span>
                  <span className="font-mono text-slate-400 text-[11px]" dir="ltr">
                    {selectedUserForApproval.email}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400">موجودہ اسٹیٹس:</span>
                  <span className="font-bold uppercase text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {getUserStatus(selectedUserForApproval)}
                  </span>
                </div>
              </div>

              {/* Success Feedback Alert */}
              {actionSuccessMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionSuccessMessage}</span>
                </div>
              )}

              {/* STRICT DURATION SELECTION BUTTONS (1, 3, 6 Months, 1, 3, 5 Years) */}
              <div className="space-y-3 mb-6">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span>مطلوبہ میعاد منتخب فرمائیں (Subscription Duration):</span>
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  {durationOptions.map((opt) => {
                    const isSelected = selectedDuration === opt.months;
                    return (
                      <button
                        key={opt.months}
                        type="button"
                        onClick={() => setSelectedDuration(opt.months)}
                        className={`p-3 rounded-2xl border text-right transition-all relative cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-emerald-500 text-emerald-400 ring-2 ring-emerald-500/50 shadow-md'
                            : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-sm">{opt.labelUr}</span>
                          <span className="font-mono text-[10px] text-slate-400">{opt.labelEn}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">{opt.tag}</span>
                        {isSelected && (
                          <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Calculated Expiry Preview */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/40 mb-6 space-y-1.5">
                <span className="text-[11px] text-emerald-300 font-bold block">
                  نئی مقررہ ایکسپائری تاریخ (New Expiry Date):
                </span>
                <span className="text-lg font-black text-amber-300 font-mono block">
                  {previewExpiryDate}
                </span>
                <p className="text-[10px] text-slate-400">
                  اس تاریخ تک یہ کلائنٹ بغیر کسی رکاوٹ کے پی او ایس سافٹ ویئر چلا سکے گا۔ میعاد ختم ہونے پر اکاؤنٹ خودکار بلاک ہوگا اور آپ کو واٹس ایپ و ای میل الرٹ موصول ہوگا۔
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isSubmittingApproval}
                  onClick={() => handleApproveWithDuration(selectedUserForApproval, selectedDuration)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isSubmittingApproval
                      ? 'منظور کیا جا رہا ہے...'
                      : `منظور و فعال کریں (${durationOptions.find((d) => d.months === selectedDuration)?.labelUr})`}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isSubmittingApproval}
                    onClick={() => handleBlockUser(selectedUserForApproval)}
                    className="py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 font-bold text-xs transition active:scale-95 cursor-pointer"
                  >
                    بلاک کریں (Block)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppNotice(selectedUserForApproval)}
                    className="py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>واٹس ایپ اطلاع</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
