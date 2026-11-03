'use client';

import React, { useState, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';
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
  Link as LinkIcon,
} from 'lucide-react';

export const SuperAdminModal: React.FC = () => {
  const {
    currentUserEmail,
    usersDB,
    isSuperAdminModalOpen,
    setIsSuperAdminModalOpen,
    toggleUserApproval,
    addUserLicense,
    deleteUserLicense,
    refreshUsersFromCloud,
    logoutUser,
  } = useShop();

  const SUPER_ADMIN_EMAIL = 'jkdevelopers.pk@gmail.com';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newBusiness, setNewBusiness] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-sync with cloud database when open & every 2 seconds
  useEffect(() => {
    if (!isSuperAdminModalOpen) return;
    refreshUsersFromCloud();
    const interval = setInterval(() => {
      refreshUsersFromCloud();
    }, 2000);
    return () => clearInterval(interval);
  }, [isSuperAdminModalOpen]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshUsersFromCloud();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (!isSuperAdminModalOpen) return null;

  const totalClients = usersDB.length;
  const approvedClients = usersDB.filter((u) => u.approved).length;
  const pendingClients = usersDB.filter((u) => !u.approved && u.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()).length;

  const sortedAndFilteredUsers = usersDB
    .filter((u) => {
      if (filterTab === 'pending') return !u.approved && u.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase();
      if (filterTab === 'approved') return u.approved;
      return true;
    })
    .filter(
      (u) =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.businessName && u.businessName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.phone && u.phone.includes(searchQuery))
    )
    .sort((a, b) => {
      // Pending first
      if (!a.approved && b.approved) return -1;
      if (a.approved && !b.approved) return 1;
      // Newest first
      const dateA = new Date(a.registeredAt || 0).getTime();
      const dateB = new Date(b.registeredAt || 0).getTime();
      return dateB - dateA;
    });

  const handleAddNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      alert('براہِ کرم درست جی میل ایڈریس درج فرمائیں۔');
      return;
    }
    addUserLicense(
      newEmail.trim(),
      newName.trim(),
      true,
      newBusiness.trim(),
      newPhone.trim()
    );
    setNewEmail('');
    setNewName('');
    setNewBusiness('');
    setNewPhone('');
  };

  const handleSendApprovalWhatsApp = (user: any) => {
    let cleanPhone = (user.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('03')) {
      cleanPhone = '92' + cleanPhone.substring(1);
    }
    if (!cleanPhone) {
      alert('اس صارف کا کوئی فون نمبر درج نہیں ہے۔');
      return;
    }

    const msg = `السلام علیکم محترم ${user.name || 'کسٹمر'} صاحب!
آپ کے کاروبار "${user.businessName || user.shopName || 'آپ کے اسٹور'}" کے لیے ون شاپ پی او ایس (OneShop POS) کا لائف ٹائم لائسنس منظور کر دیا گیا ہے۔

اب آپ اپنی رجسٹرڈ جی میل (${user.email}) سے لاگ ان کر کے اپنا سافٹ ویئر چلا سکتے ہیں۔
تشریف آوری اور اعتماد کا بہت شکریہ!
━━━━━━━━━━━━━━━━━━
ادارہ: JK Developers Pakistan (جے کے ڈویلپرز پاکستان)
ہیلپ لائن و کسٹمر سپورٹ: 0300-8998381`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCopyClientLink = (email: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const url = `${origin}/?email=${encodeURIComponent(email)}`;
    navigator.clipboard.writeText(url);
    alert(`کلائنٹ لاگ ان لنک کاپی ہو گیا ہے:\n${url}\n\nاس لنک سے اوپن کرنے پر پرانا سیشن ختم ہوگا اور صارف سے پاسورڈ مانگا جائے گا (کوئی آٹو لاگ ان نہیں ہوگا)۔`);
  };

  const handleAdminLogout = () => {
    setIsSuperAdminModalOpen(false);
    logoutUser();
    alert('سپر ایڈمن سیشن کامیابی سے لاگ آؤٹ ہو گیا ہے۔');
    window.location.reload();
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-150 text-slate-800 dark:text-slate-100 font-sans"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base md:text-lg font-black tracking-tight font-sans">
                  ⚙️ سپر ایڈمن کنٹرول پینل (JK Developers Pakistan)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-700">
                  JK Developers پاکستان
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                تمام کلائنٹس کے اکاؤنٹس یہاں لائیو سنکرونائز ہیں، آپ کسی بھی وقت منظوری یا بلاک کر سکتے ہیں
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAdminLogout}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              title="سپر ایڈمن سیشن بند اور لاگ آؤٹ کریں"
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

        {/* Interactive Filter Tabs & KPI Cards */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setFilterTab('pending')}
            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
              filterTab === 'pending'
                ? 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-md ring-2 ring-amber-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-amber-500/40'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="text-xs font-bold text-amber-500">⚡ منظوری کے منتظر (Pending)</span>
              {pendingClients > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono font-black text-[10px] animate-pulse">
                  {pendingClients}
                </span>
              )}
            </div>
            <span className="text-2xl font-black font-mono text-amber-500">
              {pendingClients}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('approved')}
            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
              filterTab === 'approved'
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-md ring-2 ring-emerald-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-emerald-500/40'
            }`}
          >
            <span className="text-xs font-bold text-emerald-600 block mb-1">✓ منظور شدہ لائسنس (Approved)</span>
            <span className="text-2xl font-black font-mono text-emerald-600">
              {approvedClients}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-blue-500/15 border-blue-500 text-blue-400 shadow-md ring-2 ring-blue-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-blue-500/40'
            }`}
          >
            <span className="text-xs font-bold text-slate-400 block mb-1">📋 تمام کلائنٹس (All Clients)</span>
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {totalClients}
            </span>
          </button>
        </div>

        {/* Pending Clients Notification Banner */}
        {pendingClients > 0 && (
          <div className="px-4 py-2 bg-gradient-to-r from-amber-600/20 via-rose-600/20 to-amber-600/20 border-b border-amber-500/40 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <span className="animate-pulse text-base">⚡</span>
              <span className="font-bold">
                {pendingClients} نیا کلائنٹ منظوری کا منتظر ہے! فوری رسائی دینے کے لیے سبز بٹن "منظور کریں" پر کلک کریں۔
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFilterTab('pending')}
              className="text-[11px] underline font-bold hover:text-white"
            >
              صرف منتظر دکھائیں
            </button>
          </div>
        )}

        {/* Add New Client Bar */}
        <form onSubmit={handleAddNewClient} className="p-3 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
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
              placeholder="صارف کا نام"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="w-40">
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

          <button
            type="submit"
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-md transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>فوری شامل و منظور کریں</span>
          </button>
        </form>

        {/* Search Bar & Refresh */}
        <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="کلائنٹ جی میل، نام، فون یا شاپ تلاش کریں..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pr-9 pl-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition active:scale-95 disabled:opacity-50"
              title="تمام نئے کلائنٹس کا ڈیٹا لائیو کلاؤڈ سے تازہ کریں"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>تازہ کریں (Live Sync)</span>
            </button>

            <span className="text-[11px] text-slate-500">
              نتائج: <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{sortedAndFilteredUsers.length}</span>
            </span>
          </div>
        </div>

        {/* Clients Table */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 text-center w-10">#</th>
                  <th className="p-3">صارف و جی میل</th>
                  <th className="p-3">دکان / کاروبار</th>
                  <th className="p-3 text-center">موبائل</th>
                  <th className="p-3 text-center w-28">اسٹیٹس</th>
                  <th className="p-3 text-center w-64">ایکشن (منظوری و رابطہ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedAndFilteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      {filterTab === 'pending'
                        ? 'کوئی نیا کلائنٹ منظوری کے لیے پینڈنگ نہیں ہے۔ سب منظور شدہ ہیں!'
                        : 'کوئی کلائنٹ ریکارڈ نہیں ملا۔'}
                    </td>
                  </tr>
                ) : (
                  sortedAndFilteredUsers.map((user, idx) => {
                    const isMaster = user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
                    return (
                      <tr
                        key={user.email}
                        className={`transition ${
                          !user.approved
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 border-r-4 border-r-amber-500'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-850/80'
                        }`}
                      >
                        <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{user.name || 'نامعلوم'}</span>
                            {isMaster && (
                              <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black text-[9.5px]">
                                👑 ڈویلپر
                              </span>
                            )}
                            {!user.approved && (
                              <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[9px] animate-pulse">
                                نیا درخواست گزار
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-slate-500 block text-[11px]" dir="ltr">
                            {user.email}
                          </span>
                          {user.registeredAt && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              رجسٹرڈ: {new Date(user.registeredAt).toLocaleString('ur-PK')}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                          {user.businessName || user.shopName || '-'}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-400" dir="ltr">
                          {user.phone || '-'}
                        </td>
                        <td className="p-3 text-center">
                          {user.approved ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-black text-[11px] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approved</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-black text-[11px] inline-flex items-center gap-1 animate-pulse">
                              <Clock className="w-3 h-3" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {isMaster ? (
                            <span className="text-xs font-bold text-slate-400">ماسٹر ڈویلپر</span>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {user.approved ? (
                                <button
                                  onClick={async () => {
                                    if (confirm(`کیا آپ واقعی (${user.name || user.email}) کی رسائی روکنا (Revoke) چاہتے ہیں؟ سافٹ ویئر فوری طور پر اس کلائنٹ کے لیے لاک ہو جائے گا۔`)) {
                                      await toggleUserApproval(user.email);
                                      alert(`⛔ صارف (${user.name || user.email}) کی رسائی کامیابی سے روک دی گئی ہے۔ کلائنٹ کا سافٹ ویئر لاک ہو چکا ہے۔`);
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs transition shadow-sm active:scale-95 cursor-pointer"
                                  title="رسائی معطل / بند کریں"
                                >
                                  رسائی روکیں (Revoke)
                                </button>
                              ) : (
                                <button
                                  onClick={async () => {
                                    await toggleUserApproval(user.email);
                                    alert(`✓ صارف (${user.name || user.email}) کا اکاؤنٹ کامیابی سے منظور کر دیا گیا ہے! ان کا سافٹ ویئر فوری طور پر ان لاک ہو جائے گا۔`);
                                    if (user.phone) {
                                      if (confirm(`صارف (${user.name || user.email}) کا لائسنس منظور ہو چکا ہے! کیا آپ انہیں واٹس ایپ پر بھی مطلع کرنا چاہتے ہیں؟`)) {
                                        handleSendApprovalWhatsApp(user);
                                      }
                                    }
                                  }}
                                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-xs transition shadow-md active:scale-95 flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>✓ فوری منظور کریں</span>
                                </button>
                              )}

                              {user.phone && (
                                <button
                                  onClick={() => handleSendApprovalWhatsApp(user)}
                                  className="p-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg transition shadow-xs"
                                  title="صارف کو واٹس ایپ پر منظوری کی اطلاع بھیجیں"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => handleCopyClientLink(user.email)}
                                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition shadow-xs"
                                title="کلائنٹ کے لیے لاگ ان لنک کاپی کریں (کوئی آٹو لاگ ان نہیں ہوگا)"
                              >
                                <LinkIcon className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`کیا آپ واقعی ${user.email} کا ریکارڈ ڈیٹا بیس سے ڈیلیٹ کرنا چاہتے ہیں؟`)) {
                                    deleteUserLicense(user.email);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition"
                                title="ڈیلیٹ کریں"
                              >
                                <Trash2 className="w-4 h-4" />
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
      </div>
    </div>
  );
};
