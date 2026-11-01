'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  BookOpen,
  Users,
  Boxes,
  BarChart3,
  MessageSquare,
  Settings,
  Languages,
  Store,
  Sparkles,
  PhoneCall,
  MapPin,
  Edit3,
  History,
  ShieldCheck,
  UserCheck,
  Lock,
  Unlock,
  KeyRound,
  X,
  Truck,
  Building2,
  UserPlus,
  Mail,
  Headphones,
  Monitor,
  CheckCircle2,
  QrCode,
  Clock,
  LogOut,
  Bot,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { posSound } from '@/lib/sound';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { BusinessPresetType } from '@/types';
import { SupportModal } from './support/SupportModal';
import { BackupModal } from './backup/BackupModal';
import { BarcodeGeneratorModal } from './barcode/BarcodeGeneratorModal';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { lang, toggleLang, t } = useLanguage();
  const {
    activePreset,
    setPreset,
    businessProfile,
    currentRole,
    switchRole,
    hasAccess,
    activeCounter,
    activeCashier,
    cashierAccounts,
    switchCashierCounter,
    pendingWhatsAppOrdersCount,
    setIsWhatsAppOrdersModalOpen,
    currentUserEmail,
    isSuperAdmin,
    logoutUser,
    setIsSuperAdminModalOpen,
  } = useShop();

  // Modals state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleModalTab, setRoleModalTab] = useState<'admin' | 'cashier'>('admin');
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pos_header_collapsed') === 'true';
    }
    return false;
  });

  // Sound Engine State
  const [soundActive, setSoundActive] = useState<boolean>(() => {
    return posSound.isEnabled();
  });

  const handleToggleSound = () => {
    const next = posSound.toggleSound();
    setSoundActive(next);
  };

  // Nav Carousel Slider Ref & Controls
  const navSliderRef = React.useRef<HTMLDivElement>(null);
  const scrollNav = (direction: 'left' | 'right') => {
    if (navSliderRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      navSliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      posSound.playClick();
    }
  };

  const toggleHeaderCollapsed = () => {
    setIsHeaderCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_header_collapsed', String(next));
      }
      return next;
    });
  };

  // Admin PIN state
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  // Cashier counter selection state
  const [selectedCounterNum, setSelectedCounterNum] = useState<number>(activeCounter || 1);
  const [cashierPinInput, setCashierPinInput] = useState('');
  const [cashierPinError, setCashierPinError] = useState('');

  const presets: { id: BusinessPresetType; labelUr: string; labelEn: string; icon: string }[] = [
    { id: 'karyana', labelUr: 'کریانہ و اجناس', labelEn: 'Karyana Commodities', icon: '🌾' },
    { id: 'general_store', labelUr: 'جنرل سٹور و صابن', labelEn: 'General Store', icon: '🛒' },
    { id: 'garments', labelUr: 'گارمنٹس و کلاتھنگ', labelEn: 'Garments', icon: '👔' },
    { id: 'sweets', labelUr: 'سویٹس اینڈ بیکرز', labelEn: 'Sweets & Bakers', icon: '🍰' },
    { id: 'confectionery', labelUr: 'گول ٹافی و کینڈی', labelEn: 'Wholesale Candy', icon: '🍬' },
    { id: 'restaurant', labelUr: 'ریسٹورنٹ و کیفے', labelEn: 'Restaurant (KOT)', icon: '🍽️' },
  ];

  // Modules for the colorful toolbar (Candela & Nebs POS Style)
  const navItems = [
    {
      id: 'billsHistory',
      label: t('billsHistory'),
      icon: History,
      shortcut: 'F2',
      bgClass: 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400',
      activeClass: 'bg-blue-500 text-white ring-4 ring-white shadow-xl shadow-blue-900/60 scale-105 border-white',
    },
    {
      id: 'audit',
      label: lang === 'ur' ? 'اسٹاک و سسٹم آڈٹ' : 'Stock & Audit',
      icon: ShieldCheck,
      shortcut: 'F3',
      bgClass: 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400',
      activeClass: 'bg-indigo-500 text-white ring-4 ring-white shadow-xl shadow-indigo-900/60 scale-105 border-white',
    },
    {
      id: 'inventory',
      label: t('inventory'),
      icon: Boxes,
      shortcut: 'F4',
      bgClass: 'bg-teal-600 hover:bg-teal-500 text-white border-teal-400',
      activeClass: 'bg-teal-500 text-white ring-4 ring-white shadow-xl shadow-teal-900/60 scale-105 border-white',
    },
    {
      id: 'reports',
      label: t('reports'),
      icon: BarChart3,
      shortcut: 'F5',
      bgClass: 'bg-red-600 hover:bg-red-500 text-white border-red-400',
      activeClass: 'bg-red-500 text-white ring-4 ring-white shadow-xl shadow-red-900/60 scale-105 border-white',
    },
    {
      id: 'roznamcha',
      label: t('roznamcha'),
      icon: BookOpen,
      shortcut: 'F6',
      bgClass: 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400',
      activeClass: 'bg-sky-500 text-white ring-4 ring-white shadow-xl shadow-sky-900/60 scale-105 border-white',
    },
    {
      id: 'khata',
      label: t('khataLedger'),
      icon: Users,
      shortcut: 'F7',
      bgClass: 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400',
      activeClass: 'bg-rose-500 text-white ring-4 ring-white shadow-xl shadow-rose-900/60 scale-105 border-white',
    },
    {
      id: 'grn',
      label: t('grnTitle'),
      icon: Truck,
      shortcut: 'F8',
      bgClass: 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400',
      activeClass: 'bg-amber-500 text-white ring-4 ring-white shadow-xl shadow-amber-900/60 scale-105 border-white',
    },
    {
      id: 'vendors',
      label: t('vendorsTitle'),
      icon: Building2,
      shortcut: 'F9',
      bgClass: 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400',
      activeClass: 'bg-purple-500 text-white ring-4 ring-white shadow-xl shadow-purple-900/60 scale-105 border-white',
    },
    {
      id: 'staff',
      label: t('staffTitle'),
      icon: UserPlus,
      shortcut: 'F10',
      bgClass: 'bg-yellow-600 hover:bg-yellow-500 text-white border-yellow-400',
      activeClass: 'bg-yellow-500 text-white ring-4 ring-white shadow-xl shadow-yellow-900/60 scale-105 border-white',
    },
    {
      id: 'aiChatboard',
      label: lang === 'ur' ? 'AI رپورٹ چیٹ' : 'AI Chatboard',
      icon: Bot,
      shortcut: 'AI',
      bgClass: 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white border-fuchsia-400',
      activeClass: 'bg-fuchsia-500 text-white ring-4 ring-white shadow-xl shadow-fuchsia-900/60 scale-105 border-white',
    },
    {
      id: 'whatsapp',
      label: t('whatsappBot'),
      icon: MessageSquare,
      shortcut: 'WA',
      bgClass: 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-400',
      activeClass: 'bg-emerald-600 text-white ring-4 ring-white shadow-xl shadow-emerald-900/60 scale-105 border-white',
    },
    {
      id: 'settings',
      label: t('settings'),
      icon: Settings,
      shortcut: 'F10',
      bgClass: 'bg-cyan-800 hover:bg-cyan-700 text-white border-cyan-500',
      activeClass: 'bg-cyan-700 text-white ring-4 ring-white shadow-xl shadow-cyan-900/60 scale-105 border-white',
    },
  ];

  const handleTabClick = (tabId: string) => {
    posSound.playClick();
    const isAllowed = hasAccess(tabId);
    if (!isAllowed) {
      setPendingTab(tabId);
      setRoleModalTab('admin');
      setShowRoleModal(true);
      return;
    }
    setActiveTab(tabId);
  };

  const handleVerifyAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = switchRole('ADMIN', pinInput);
    if (success) {
      setShowRoleModal(false);
      setPinInput('');
      setPinError('');
      if (pendingTab) {
        setActiveTab(pendingTab);
        setPendingTab(null);
      }
    } else {
      setPinError(lang === 'ur' ? 'غلط ایڈمن پن کوڈ درج کیا گیا ہے!' : 'Incorrect Admin PIN!');
    }
  };

  const handleCashierLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const res = switchCashierCounter(selectedCounterNum, cashierPinInput);
    if (res.success) {
      setShowRoleModal(false);
      setCashierPinInput('');
      setCashierPinError('');
      // If currently on an unauthorized tab, redirect to pos
      if (!hasAccess(activeTab)) {
        setActiveTab('pos');
      }
    } else {
      setCashierPinError(res.message);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
        {/* Top Bar: Software Branding & Quick Tools (Collapsible for Max Screen Space) */}
        {!isHeaderCollapsed && (
          <div className="bg-slate-950/90 px-4 py-2 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="font-mono font-black text-emerald-400 tracking-wide text-xs">
                  {businessProfile.softwareName || 'OneShop POS'}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Multi-Counter ERP
                </span>
              </div>

              <div className="hidden md:flex items-center gap-3 text-slate-400 text-[11px]">
                <span>
                  Powered by <strong className="text-amber-400 font-sans">JK Developers Pakistan</strong>
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-mono font-bold">Helpline: 03008998381</span>
              </div>
            </div>

            {/* Quick Buttons: Collapse Top, Barcode Generator, Backup, Support, Role, Language */}
            <div className="flex items-center gap-2">
              {/* Collapse Top Header Button */}
              <button
                type="button"
                onClick={toggleHeaderCollapsed}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition shadow-md active:scale-95 border border-cyan-300"
                title={lang === 'ur' ? 'اوپر والا ایریا بند کریں تاکہ بلنگ کیلئے بڑی اسکرین مل سکے' : 'Collapse Header for Max Screen Space'}
              >
                <ChevronUp className="w-4 h-4 stroke-[3]" />
                <span>{lang === 'ur' ? 'اوپر بند کریں (Full Screen)' : 'Collapse Top'}</span>
              </button>

              {/* Barcode / QR Code Generator Button */}
              <button
                onClick={() => setShowBarcodeModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 font-bold transition-all shadow-sm"
                title={lang === 'ur' ? 'بارکوڈ اور کیو آر کوڈ بنائیں / پرنٹ کریں' : 'Generate & Print Barcode / QR'}
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">
                  {lang === 'ur' ? 'بارکوڈ و کیو آر جنریٹر' : 'Barcode/QR'}
                </span>
              </button>

              {/* Gmail Backup Button */}
              <button
                onClick={() => setShowBackupModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-all"
                title={lang === 'ur' ? 'جی میل پر ڈیٹا بیک اپ بھیجیں' : 'Backup to Gmail'}
              >
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">{lang === 'ur' ? 'جی میل بیک اپ' : 'Gmail Backup'}</span>
              </button>

              {/* JK Developers Pakistan Support Button */}
              <button
                onClick={() => setShowSupportModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold transition-all shadow-sm"
                title="JK Developers Pakistan Official Support: 03008998381"
              >
                <Headphones className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono text-[11px] font-bold">JK Developers: 03008998381</span>
              </button>

              {/* Multi-Counter & Role Switcher */}
              <button
                onClick={() => {
                  setRoleModalTab(currentRole === 'ADMIN' || currentRole === 'MANAGER' ? 'cashier' : 'admin');
                  setShowRoleModal(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
                  currentRole === 'ADMIN' || currentRole === 'MANAGER'
                    ? 'bg-purple-950/80 border-purple-600/70 text-purple-200 hover:bg-purple-900'
                    : 'bg-emerald-950/80 border-emerald-600/70 text-emerald-200 hover:bg-emerald-900'
                }`}
                title={lang === 'ur' ? 'کاؤنٹر اور ایڈمن لاگ ان تبدیل کریں' : 'Switch Counter / Admin'}
              >
                {currentRole === 'ADMIN' || currentRole === 'MANAGER' ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-purple-400" />
                    <span>{lang === 'ur' ? '👑 ایڈمن موڈ' : '👑 Admin'}</span>
                  </>
                ) : (
                  <>
                    <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {lang === 'ur'
                        ? `کاؤنٹر #${activeCounter} (${activeCashier?.name ? activeCashier.name.slice(0, 14) : 'کیشیئر'})`
                        : `Counter #${activeCounter} (${activeCashier?.name ? activeCashier.name.slice(0, 14) : 'Cashier'})`}
                    </span>
                  </>
                )}
              </button>

              {/* Quick Pending WhatsApp Orders Button */}
              {pendingWhatsAppOrdersCount > 0 && (
                <button
                  type="button"
                  onClick={() => setIsWhatsAppOrdersModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all animate-pulse"
                  title={lang === 'ur' ? 'پینڈنگ واٹس ایپ آرڈرز دیکھیں اور بل بنائیں' : 'View Pending Orders'}
                >
                  <Clock className="w-3.5 h-3.5 text-slate-950" />
                  <span>{pendingWhatsAppOrdersCount} {lang === 'ur' ? 'پینڈنگ آرڈرز' : 'Pending'}</span>
                </button>
              )}

              {/* 1-Click Language Switcher */}
              <button
                onClick={toggleLang}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-sm active:scale-95"
                title="Toggle Urdu / English"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{lang === 'ur' ? 'English' : 'اردو'}</span>
              </button>

              {/* POS Mechanical Sound Effects Toggle Button */}
              <button
                type="button"
                onClick={handleToggleSound}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold transition-all shadow-sm active:scale-95 ${
                  soundActive
                    ? 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border-emerald-500/80 shadow-emerald-900/30'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700'
                }`}
                title={lang === 'ur' ? (soundActive ? 'کلک اور ٹائپنگ ساؤنڈ آن ہے (کلک کر کے بند کریں)' : 'ساؤنڈ آف ہے (آن کریں)') : 'Toggle POS Sound Effects'}
              >
                {soundActive ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] font-mono hidden sm:inline">ساؤنڈ آن</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] font-mono hidden sm:inline">ساؤنڈ آف</span>
                  </>
                )}
              </button>

              {/* Super Admin Control Panel Trigger (Only for jkdevelopers.pk@gmail.com) */}
              {isSuperAdmin && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsSuperAdminModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs shadow-md transition-all active:scale-95"
                    title="سپر ایڈمن کنٹرول پینل کھولیں"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                    <span>ایڈمن پینل</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      logoutUser();
                      window.location.reload();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition-all"
                    title="سپر ایڈمن موڈ فوری بند اور لاگ آؤٹ کریں"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>لاگ آؤٹ</span>
                  </button>
                </div>
              )}

              {/* Logged in User Pill & Logout */}
              {currentUserEmail && (
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs">
                  <span className="text-emerald-400 font-mono text-[11px] truncate max-w-[130px]" dir="ltr">
                    {currentUserEmail}
                  </span>
                  <button
                    type="button"
                    onClick={logoutUser}
                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                    title="لاگ آؤٹ کریں"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Bar: Software Title (Compact when collapsed) */}
        <div className={`px-4 flex flex-wrap items-center justify-between gap-3 transition-all ${isHeaderCollapsed ? 'py-1.5' : 'py-2.5'}`}>
          {/* Software Title Only */}
          <div className="flex items-center gap-3">
            <div className={`rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-slate-900 flex items-center justify-center shadow-lg font-black text-white border border-emerald-400/30 transition-all ${isHeaderCollapsed ? 'w-8 h-8 text-xs' : 'w-11 h-11 text-sm'}`}>
              POS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`font-black tracking-tight leading-tight text-white font-mono flex items-center gap-2 ${isHeaderCollapsed ? 'text-base' : 'text-xl'}`}>
                  <span>{businessProfile.softwareName || 'OneShop POS'}</span>
                </h1>
                <span className="text-[10px] uppercase font-mono font-black tracking-widest text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 shadow-sm">
                  v2.0 PRO
                </span>
                {isHeaderCollapsed && (
                  <button
                    type="button"
                    onClick={toggleHeaderCollapsed}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600 text-cyan-300 hover:text-slate-950 border border-cyan-500/50 font-bold text-[11px] transition active:scale-95 shadow-sm"
                    title="اوپر والا ایریا کھولیں"
                  >
                    <span>{lang === 'ur' ? 'اوپر کھولیں' : 'Expand Top'}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                )}
                {(currentRole === 'ADMIN' || currentRole === 'MANAGER') && !isHeaderCollapsed && (
                  <button
                    onClick={() => handleTabClick('settings')}
                    className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition-colors"
                    title={lang === 'ur' ? 'سیٹنگز کھولیں' : 'Open Settings'}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {!isHeaderCollapsed && (
                <p className="text-[11px] text-slate-400 font-medium">
                  {lang === 'ur'
                    ? 'جے کے ڈویلپرز پاکستان • مکمل ریٹیل و ہول سیل پی او ایس سسٹم (03008998381)'
                    : 'Powered by JK Developers Pakistan • Multi-Counter Enterprise POS (03008998381)'}
                </p>
              )}
            </div>
          </div>

          {/* Dynamic Business Profile Preset Switcher (Hidden when collapsed) */}
          {!isHeaderCollapsed && (
            <div className="hidden 2xl:flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium px-2 flex items-center gap-1">
                <Store className="w-3 h-3 text-slate-400" />
                {lang === 'ur' ? 'ماڈل:' : 'Niche:'}
              </span>
              {presets.map((p) => {
                const isActive = activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p.id)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{lang === 'ur' ? p.labelUr : p.labelEn}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Navigation Bar (Candela & Nebs Style): Pinned Master POS Button + Colorful Modules Ribbon */}
          <div className="flex items-center gap-2 max-w-full flex-1 min-w-0">
            {/* 1. PINNED MASTER POS BUTTON (NEVER SCROLLED - ALWAYS VISIBLE LIKE CANDELA / NEBS) */}
            <button
              type="button"
              onClick={() => handleTabClick('pos')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shrink-0 border-2 active:scale-95 ${
                activeTab === 'pos'
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 text-white border-white ring-4 ring-emerald-400/40 shadow-xl shadow-emerald-950/70 scale-105'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/80 shadow-md'
              }`}
              title={lang === 'ur' ? 'کاؤنٹر بلنگ سکرین (F1) - براہِ راست بل بنائیں' : 'POS Billing Counter (F1)'}
            >
              <ShoppingBag className="w-4 h-4 text-emerald-100" />
              <span className="tracking-wide font-black">{t('posTerminal')}</span>
              <span className="px-1.5 py-0.2 rounded bg-black/25 text-emerald-200 font-mono text-[10px] font-black border border-white/20">
                F1
              </span>
            </button>

            {/* 2. COLORFUL MODULES SLIDER CAROUSEL */}
            <div className="relative flex items-center max-w-full flex-1 min-w-0">
              {/* Scroll Left Button */}
              <button
                type="button"
                onClick={() => scrollNav('left')}
                className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-md shrink-0 active:scale-90 transition-all mr-1 z-10"
                title={lang === 'ur' ? 'پچھلے آپشنز دیکھیں (Scroll Left)' : 'Scroll Left'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Carousel Slider */}
              <nav
                ref={navSliderRef}
                className="flex items-center gap-1.5 overflow-x-auto py-1 scroll-smooth no-scrollbar flex-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const isLocked = !hasAccess(item.id);

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-black flex items-center gap-1.5 whitespace-nowrap transition-all border shadow-md shrink-0 active:scale-95 ${
                        isActive
                          ? item.activeClass
                          : `${item.bgClass} shadow-sm`
                      }`}
                      title={isLocked ? (lang === 'ur' ? 'کیشیئر کے لیے لاک (ایڈمن پن درکار ہے)' : 'Locked for cashier') : ''}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span className="px-1.5 py-0.2 rounded bg-black/25 text-white/90 font-mono text-[9.5px] font-bold">
                          {item.shortcut}
                        </span>
                      )}
                      {item.id === 'whatsapp' && pendingWhatsAppOrdersCount > 0 && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            posSound.playClick();
                            setIsWhatsAppOrdersModalOpen(true);
                          }}
                          className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] animate-pulse hover:scale-110 cursor-pointer"
                          title="پینڈنگ آرڈرز دیکھیں اور بل بنائیں"
                        >
                          {pendingWhatsAppOrdersCount}
                        </span>
                      )}
                      {isLocked && <Lock className="w-3 h-3 text-amber-200 ml-0.5" />}
                    </button>
                  );
                })}
              </nav>

              {/* Scroll Right Button */}
              <button
                type="button"
                onClick={() => scrollNav('right')}
                className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-md shrink-0 active:scale-90 transition-all ml-1 z-10"
                title={lang === 'ur' ? 'اگلے آپشنز دیکھیں (Scroll Right)' : 'Scroll Right'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Preset Selector Bar (Hidden when collapsed) */}
        {!isHeaderCollapsed && (
          <div className="2xl:hidden px-3 py-1.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center gap-1 overflow-x-auto text-xs animate-in fade-in duration-150">
            <span className="text-[10px] text-slate-400 whitespace-nowrap">
              {lang === 'ur' ? 'ماڈل:' : 'Niche:'}
            </span>
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap ${
                  activePreset === p.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {p.icon} {lang === 'ur' ? p.labelUr : p.labelEn}
              </button>
            ))}
          </div>
        )}

        {/* Admin & Multi-Counter Cashier Session Modal */}
        {showRoleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 text-white shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setPinInput('');
                  setPinError('');
                  setCashierPinInput('');
                  setCashierPinError('');
                  setPendingTab(null);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Tabs Header */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                <button
                  onClick={() => {
                    setRoleModalTab('admin');
                    setPinError('');
                    setCashierPinError('');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    roleModalTab === 'admin'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Unlock className="w-4 h-4 text-purple-300" />
                  <span>{lang === 'ur' ? 'ایڈمن لاگ ان (Admin PIN)' : 'Admin Login'}</span>
                </button>

                <button
                  onClick={() => {
                    setRoleModalTab('cashier');
                    setPinError('');
                    setCashierPinError('');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    roleModalTab === 'cashier'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Monitor className="w-4 h-4 text-emerald-300" />
                  <span>{lang === 'ur' ? '10 کاؤنٹرز لاگ ان (Cashier Counters)' : '10 Cashier Counters'}</span>
                </button>
              </div>

              {/* TAB 1: ADMIN LOGIN */}
              {roleModalTab === 'admin' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {lang === 'ur' ? 'ایڈمن سیکیورٹی پن درج کریں' : 'Enter Admin PIN'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {pendingTab
                          ? (lang === 'ur' ? 'اس ماڈیول کی رسائی کے لیے ایڈمن پن درکار ہے' : 'Admin PIN required for this module')
                          : (lang === 'ur' ? 'ڈیفالٹ پن: 1234 (سیٹنگز سے تبدیل ہو سکتا ہے)' : 'Default PIN: 1234')}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleVerifyAdminPin} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        {lang === 'ur' ? 'ایڈمن خفیہ پن کوڈ' : 'Admin Secret PIN'}
                      </label>
                      <input
                        type="password"
                        autoFocus
                        maxLength={10}
                        value={pinInput}
                        onChange={(e) => {
                          setPinInput(e.target.value);
                          setPinError('');
                        }}
                        placeholder="****"
                        className="w-full text-center tracking-widest text-2xl font-mono py-2.5 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                      />
                      {pinError && (
                        <p className="text-xs text-rose-400 font-bold mt-1 text-center">
                          {pinError}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowRoleModal(false);
                          setPinInput('');
                          setPinError('');
                          setPendingTab(null);
                        }}
                        className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                      >
                        {lang === 'ur' ? 'منسوخ' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors shadow-lg shadow-purple-900/40"
                      >
                        {lang === 'ur' ? 'ایڈمن لاگ ان کریں' : 'Unlock Admin'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: 10 CASHIER COUNTERS LOGIN */}
              {roleModalTab === 'cashier' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-emerald-400" />
                      <span>{lang === 'ur' ? 'کاؤنٹر اور کیشیئر منتخب کریں (1 تا 10)' : 'Select Counter & Cashier (1 to 10)'}</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      {lang === 'ur'
                        ? 'جس کاؤنٹر پر بل بنانا ہے اسے منتخب کریں اور اس کا پن درج کریں'
                        : 'Choose your active counter and enter cashier PIN to start billing'}
                    </p>
                  </div>

                  {/* 10 Counters Quick Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    {cashierAccounts.slice(0, 10).map((c) => {
                      const isSelected = selectedCounterNum === c.counterNumber;
                      const isCurrentlyActive = currentRole === 'CASHIER' && activeCounter === c.counterNumber;

                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCounterNum(c.counterNumber);
                            setCashierPinError('');
                          }}
                          className={`p-2 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                            isSelected
                              ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-md shadow-emerald-950'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/70 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-xs text-emerald-400">
                              #{c.counterNumber}
                            </span>
                            {isCurrentlyActive && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                            )}
                          </div>
                          <div className="text-[11px] font-bold truncate mt-1">
                            {c.name.replace(/کاؤنٹر\s*\d+\s*\(/g, '').replace(')', '')}
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono">
                            PIN: {c.pin}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* PIN verification for selected counter */}
                  <form onSubmit={handleCashierLogin} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300">
                        {lang === 'ur' ? `منتخب شدہ: کاؤنٹر #${selectedCounterNum}` : `Selected: Counter #${selectedCounterNum}`}
                      </span>
                      <span className="text-[11px] text-emerald-400">
                        {cashierAccounts.find((c) => c.counterNumber === selectedCounterNum)?.name}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        {lang === 'ur' ? 'کیشیئر پن کوڈ' : 'Cashier PIN'}
                      </label>
                      <input
                        type="password"
                        autoFocus
                        maxLength={10}
                        value={cashierPinInput}
                        onChange={(e) => {
                          setCashierPinInput(e.target.value);
                          setCashierPinError('');
                        }}
                        placeholder={`PIN (e.g. ${cashierAccounts.find((c) => c.counterNumber === selectedCounterNum)?.pin || '****'})`}
                        className="w-full text-center tracking-widest text-xl font-mono py-2 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                      />
                      {cashierPinError && (
                        <p className="text-xs text-rose-400 font-bold mt-1 text-center">
                          {cashierPinError}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowRoleModal(false);
                          setCashierPinInput('');
                          setCashierPinError('');
                        }}
                        className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                      >
                        {lang === 'ur' ? 'منسوخ' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors shadow-lg shadow-emerald-900/40"
                      >
                        {lang === 'ur' ? `کاؤنٹر #${selectedCounterNum} فعال کریں` : `Switch to Counter #${selectedCounterNum}`}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Support & Backup & Barcode Modals */}
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
      <BackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
      />
      <BarcodeGeneratorModal
        isOpen={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
      />
    </>
  );
};
