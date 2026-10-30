'use client';

import React, { useState } from 'react';
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
    logoutUser,
  } = useShop();

  const SUPER_ADMIN_EMAIL = 'jkdevelopers.pk@gmail.com';

  const [searchQuery, setSearchQuery] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newBusiness, setNewBusiness] = useState('');
  const [newPhone, setNewPhone] = useState('');

  if (!isSuperAdminModalOpen) return null;

  const filteredUsers = usersDB.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.businessName && u.businessName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phone && u.phone.includes(searchQuery))
  );

  const totalClients = usersDB.length;
  const approvedClients = usersDB.filter((u) => u.approved).length;
  const pendingClients = usersDB.filter((u) => !u.approved).length;

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
سفیان حبیب • چیف ڈویلپر
JK Developers پاکستان - 03008998381`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
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
                  ⚙️ سپر ایڈمن کنٹرول پینل (JK Developers)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-700">
                  سفیان حبیب (چیف ایڈمن)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                یہاں سے آپ رجسٹرڈ صارفین کے کوائف دیکھ کر انہیں سافٹ ویئر چلانے کی منظوری دے سکتے ہیں
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

        {/* KPI Summary Cards */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-[10px] text-slate-500 font-bold block">کل رجسٹرڈ صارفین</span>
            <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {totalClients}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-[10px] text-emerald-600 font-bold block">منظور شدہ (Approved)</span>
            <span className="text-xl font-black font-mono text-emerald-600">
              {approvedClients}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-[10px] text-amber-600 font-bold block">منظوری کے منتظر (Pending)</span>
            <span className="text-xl font-black font-mono text-amber-600">
              {pendingClients}
            </span>
          </div>
        </div>

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

        {/* Search Bar */}
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

          <span className="text-[11px] text-slate-500">
            نتائج: <span className="font-mono font-bold">{filteredUsers.length}</span>
          </span>
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
                  <th className="p-3 text-center w-60">ایکشن (منظوری و رابطہ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((user, idx) => {
                  const isMaster = user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
                  return (
                    <tr
                      key={user.email}
                      className="hover:bg-slate-50 dark:hover:bg-slate-850/80 transition"
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
                        </div>
                        <span className="font-mono text-slate-500 block text-[11px]" dir="ltr">
                          {user.email}
                        </span>
                        {user.registeredAt && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            رجسٹرڈ: {new Date(user.registeredAt).toLocaleDateString('ur-PK')}
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
                                onClick={() => toggleUserApproval(user.email)}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs transition shadow-sm active:scale-95"
                              >
                                رسائی روکیں (Revoke)
                              </button>
                            ) : (
                              <button
                                onClick={() => toggleUserApproval(user.email)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition shadow-sm active:scale-95"
                              >
                                ✓ منظور کریں (Approve)
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
