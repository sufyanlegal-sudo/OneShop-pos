'use client';

import React, { useState, useMemo } from 'react';
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
  Cloud,
  RefreshCw,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
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
    isCloudSyncing,
    lastCloudSyncTime,
    syncWithCloud,
    usersDB,
  } = useShop();

  const pendingUsersCount = useMemo(() => {
    return (usersDB || []).filter(
      (u) => !u.approved && u.email?.toLowerCase() !== 'jkdevelopers.pk@gmail.com'
    ).length;
  }, [usersDB]);

  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleManualCloudSync = async () => {
    posSound.playClick();
    const res = await syncWithCloud();
    setSyncFeedback(res.message);
    setTimeout(() => {
      setSyncFeedback(null);
    }, 4000);
  };

  // Modals state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleModalTab, setRoleModalTab] = useState<'admin' | 'cashier'>('admin');
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showControlCenterModal, setShowControlCenterModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    posSound.playClick();
    if (typeof document !== 'undefined') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    }
  };

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

  // Modules for the colorful toolbar (Modern OneShop Square Box Tile Style)
  const masterPosItem = {
    id: 'pos',
    label: lang === 'ur' ? 'کاؤنٹر بلنگ' : 'POS Billing',
    icon: ShoppingBag,
    shortcut: 'F1',
    bgClass: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500',
    activeClass: 'bg-emerald-600 text-white ring-2 ring-white shadow-xl shadow-emerald-950/80 border-white',
  };

  const navItems = [
    {
      id: 'billsHistory',
      label: lang === 'ur' ? 'بلز ہسٹری' : 'Bills History',
      icon: History,
      shortcut: 'F2',
      bgClass: 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500',
      activeClass: 'bg-blue-600 text-white ring-2 ring-white shadow-xl shadow-blue-950/70 border-white',
    },
    {
      id: 'audit',
      label: lang === 'ur' ? 'اسٹاک آڈٹ' : 'Stock Audit',
      icon: ShieldCheck,
      shortcut: 'F3',
      bgClass: 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500',
      activeClass: 'bg-indigo-600 text-white ring-2 ring-white shadow-xl shadow-indigo-950/70 border-white',
    },
    {
      id: 'inventory',
      label: lang === 'ur' ? 'اسٹاک اشیاء' : 'Inventory',
      icon: Boxes,
      shortcut: 'F4',
      bgClass: 'bg-teal-600 hover:bg-teal-500 text-white border-teal-500',
      activeClass: 'bg-teal-600 text-white ring-2 ring-white shadow-xl shadow-teal-950/70 border-white',
    },
    {
      id: 'reports',
      label: lang === 'ur' ? 'رپورٹس و نفع' : 'Reports & P&L',
      icon: BarChart3,
      shortcut: 'F5',
      bgClass: 'bg-red-600 hover:bg-red-500 text-white border-red-500',
      activeClass: 'bg-red-600 text-white ring-2 ring-white shadow-xl shadow-red-950/70 border-white',
    },
    {
      id: 'roznamcha',
      label: lang === 'ur' ? 'روزنامچہ' : 'Cash Book',
      icon: BookOpen,
      shortcut: 'F6',
      bgClass: 'bg-sky-600 hover:bg-sky-500 text-white border-sky-500',
      activeClass: 'bg-sky-600 text-white ring-2 ring-white shadow-xl shadow-sky-950/70 border-white',
    },
    {
      id: 'khata',
      label: lang === 'ur' ? 'ادھار کھاتہ' : 'Khata Ledger',
      icon: Users,
      shortcut: 'F7',
      bgClass: 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500',
      activeClass: 'bg-rose-600 text-white ring-2 ring-white shadow-xl shadow-rose-950/70 border-white',
    },
    {
      id: 'grn',
      label: lang === 'ur' ? 'خریداری مال' : 'Purchase GRN',
      icon: Truck,
      shortcut: 'F8',
      bgClass: 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500',
      activeClass: 'bg-amber-600 text-white ring-2 ring-white shadow-xl shadow-amber-950/70 border-white',
    },
    {
      id: 'vendors',
      label: lang === 'ur' ? 'سپلائرز' : 'Suppliers',
      icon: Building2,
      shortcut: 'F9',
      bgClass: 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500',
      activeClass: 'bg-purple-600 text-white ring-2 ring-white shadow-xl shadow-purple-950/70 border-white',
    },
    {
      id: 'staff',
      label: lang === 'ur' ? 'اسٹاف ممبرز' : 'Staff & Users',
      icon: UserPlus,
      shortcut: 'F10',
      bgClass: 'bg-yellow-600 hover:bg-yellow-500 text-white border-yellow-500',
      activeClass: 'bg-yellow-600 text-white ring-2 ring-white shadow-xl shadow-yellow-950/70 border-white',
    },
    {
      id: 'aiChatboard',
      label: lang === 'ur' ? 'AI اسسٹنٹ' : 'AI Assistant',
      icon: Bot,
      shortcut: 'AI',
      bgClass: 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white border-fuchsia-500',
      activeClass: 'bg-fuchsia-600 text-white ring-2 ring-white shadow-xl shadow-fuchsia-950/70 border-white',
    },
    {
      id: 'whatsapp',
      label: lang === 'ur' ? 'واٹس ایپ' : 'WhatsApp',
      icon: MessageSquare,
      shortcut: 'WA',
      bgClass: 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-500',
      activeClass: 'bg-emerald-700 text-white ring-2 ring-white shadow-xl shadow-emerald-950/70 border-white',
    },
    {
      id: 'settings',
      label: lang === 'ur' ? 'سیٹنگز' : 'Settings',
      icon: Settings,
      shortcut: 'F11',
      bgClass: 'bg-slate-700 hover:bg-slate-600 text-white border-slate-500',
      activeClass: 'bg-slate-700 text-white ring-2 ring-white shadow-xl shadow-slate-950/70 border-white',
    },
  ];

  const allModulesList = [masterPosItem, ...navItems];

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
        {/* Live Cloud Two-Way Sync Feedback Toast */}
        {syncFeedback && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs px-4 py-2 text-center font-bold font-nastaliq shadow-lg border-b border-emerald-400 flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
            <Cloud className="w-4 h-4 text-emerald-100" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Top Bar: Clean Executive Software Header (Single Row) */}
        <div className="bg-slate-950 px-3 sm:px-4 py-2 border-b border-slate-800 flex items-center justify-between gap-2 shadow-md">
          {/* Left: Brand Identity & Support Contact */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-[1.5px] shadow-lg shadow-emerald-950/60 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="font-mono font-black text-[11px] sm:text-xs text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                  POS
                </span>
              </div>
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm sm:text-base text-white font-mono tracking-tight flex items-center gap-1.5">
                  <span>{businessProfile.softwareName || 'OneShop POS'}</span>
                </h1>
                <span className="text-[10px] font-mono font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  v2.0 PRO
                </span>
                {/* Active Role & Counter Indicator */}
                <button
                  type="button"
                  onClick={() => {
                    posSound.playClick();
                    setRoleModalTab(currentRole === 'ADMIN' || currentRole === 'MANAGER' ? 'cashier' : 'admin');
                    setShowRoleModal(true);
                  }}
                  className={`hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border transition active:scale-95 ${
                    currentRole === 'ADMIN' || currentRole === 'MANAGER'
                      ? 'bg-purple-950/70 text-purple-300 border-purple-600/50 hover:bg-purple-900/60'
                      : 'bg-emerald-950/70 text-emerald-300 border-emerald-600/50 hover:bg-emerald-900/60'
                  }`}
                  title={lang === 'ur' ? 'کاؤنٹر اور ایڈمن لاگ ان تبدیل کریں' : 'Switch Counter / Admin'}
                >
                  {currentRole === 'ADMIN' || currentRole === 'MANAGER' ? (
                    <>
                      <Unlock className="w-3 h-3 text-purple-400" />
                      <span>👑 ایڈمن</span>
                    </>
                  ) : (
                    <>
                      <Monitor className="w-3 h-3 text-emerald-400" />
                      <span>کاؤنٹر #{activeCounter}</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium flex items-center gap-1.5 truncate">
                <span>Powered by JK Developers Pakistan</span>
                <span className="text-slate-600">•</span>
                <span
                  onClick={() => {
                    posSound.playClick();
                    setShowSupportModal(true);
                  }}
                  className="text-amber-400/90 hover:text-amber-300 cursor-pointer font-mono font-bold transition hover:underline"
                  title="سپورٹ اور ہیلپ لائن کے لیے کلک کریں (0300-8998381)"
                >
                  03008998381
                </span>
              </p>
            </div>
          </div>

          {/* Right: Quick Action Controls & Hero Control Center Button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Super Admin Client Approvals Fast Button */}
            <button
              type="button"
              onClick={() => {
                posSound.playClick();
                setIsSuperAdminModalOpen(true);
              }}
              className="h-7 sm:h-8 px-2.5 rounded-lg bg-gradient-to-r from-amber-950/80 to-emerald-950/80 hover:from-amber-900 hover:to-emerald-900 border border-amber-500/60 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              title="سپر ایڈمن کنٹرول و کلائنٹس لائسنس منظوری پینل"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold hidden md:inline">سپر ایڈمن</span>
              {pendingUsersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono font-black text-[9px] animate-pulse">
                  {pendingUsersCount}
                </span>
              )}
            </button>

            {/* 1. Quick Language Switch (Urdu / English) */}
            <button
              type="button"
              onClick={() => {
                posSound.playClick();
                toggleLang();
              }}
              className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 font-bold text-xs flex items-center gap-1 transition active:scale-95 shadow-xs"
              title={lang === 'ur' ? 'Switch to English' : 'اردو میں تبدیل کریں'}
            >
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-[11px]">{lang === 'ur' ? 'English' : 'اردو'}</span>
            </button>

            {/* 2. Quick Sound Toggle */}
            <button
              type="button"
              onClick={handleToggleSound}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border transition active:scale-95 shadow-xs ${
                soundActive
                  ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-600/70 text-emerald-400'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title={soundActive ? (lang === 'ur' ? 'ساؤنڈ آن ہے (کلک کر کے بند کریں)' : 'Sound ON') : (lang === 'ur' ? 'ساؤنڈ آف ہے (آن کریں)' : 'Sound OFF')}
            >
              {soundActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* 3. Quick Cloud Sync */}
            <button
              type="button"
              disabled={isCloudSyncing}
              onClick={handleManualCloudSync}
              className={`h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg border font-bold text-xs flex items-center gap-1 transition active:scale-95 shadow-xs ${
                isCloudSyncing
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-200'
              }`}
              title={lang === 'ur' ? 'کلاؤڈ سے ڈیٹا فوری سنک کریں' : 'Sync Data with Cloud'}
            >
              <Cloud className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-bounce text-cyan-400' : 'text-cyan-400'}`} />
              <span className="hidden md:inline text-[11px]">
                {isCloudSyncing ? (lang === 'ur' ? 'سنک...' : 'Sync...') : (lang === 'ur' ? 'کلاؤڈ سنک' : 'Sync')}
              </span>
              {lastCloudSyncTime && !isCloudSyncing && (
                <span className="text-[10px] text-emerald-400 font-mono">✓</span>
              )}
            </button>

            {/* 4. Small Fullscreen Toggle Icon Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 flex items-center justify-center transition active:scale-95 shadow-xs"
              title={lang === 'ur' ? 'فل اسکرین موڈ (Full Screen)' : 'Toggle Full Screen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-300" />}
            </button>

            {/* 5. Collapse / Expand Ribbon Icon Button */}
            <button
              type="button"
              onClick={toggleHeaderCollapsed}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border transition active:scale-95 shadow-xs ${
                isHeaderCollapsed
                  ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={isHeaderCollapsed ? (lang === 'ur' ? 'ٹول بار کھولیں' : 'Expand Toolbar') : (lang === 'ur' ? 'ٹول بار بند کریں (بڑی اسکرین)' : 'Collapse Toolbar')}
            >
              {isHeaderCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-emerald-300" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>

            {/* 6. HERO: QUICK CONTROL CENTER & TOOLS MODAL BUTTON */}
            <button
              type="button"
              onClick={() => {
                posSound.playClick();
                setShowControlCenterModal(true);
              }}
              className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-lg bg-gradient-to-r from-teal-600 via-emerald-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/60 border border-emerald-400/40 transition active:scale-95"
              title={lang === 'ur' ? 'کوئیک ٹولز و سسٹم کنٹرول سینٹر کھولیں' : 'Open Quick Tools & Control Center'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
              <span className="text-[11px] sm:text-[11.5px] font-bold">
                {lang === 'ur' ? 'کوئیک ٹولز' : 'Quick Tools'}
              </span>
              {pendingWhatsAppOrdersCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping"></span>
              )}
            </button>
          </div>
        </div>

        {/* TWO-TIER RIBBON & CHAKOR SHORTCUT BOXES (Collapsible for Max Screen Space) */}
        {!isHeaderCollapsed && (
          <div className="animate-in fade-in duration-150">
            {/* 1. TOP RIBBON TABS (NAMES STRIP - EXACTLY LIKE EXCEL RIBBON EXAMPLE) */}
            <div
              className="bg-slate-900 border-b border-slate-700/80 px-4 pt-1 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {allModulesList
                .filter((m) => m.id !== 'aiChatboard' || currentRole === 'ADMIN')
                .map((m) => {
                  const isActive = activeTab === m.id;
                  const Icon = m.icon;
                  return (
                    <button
                      key={`tab-${m.id}`}
                      type="button"
                      onClick={() => handleTabClick(m.id)}
                      className={`px-3 sm:px-4 py-1.5 text-xs sm:text-[13px] rounded-t-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none border-t-2 ${
                        isActive
                          ? 'bg-slate-850 text-emerald-400 border-emerald-400 font-black shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border-transparent font-bold'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
            </div>

            {/* 2. DEDICATED SEPARATE SHORTCUT BOXES TOOLBAR (CHAKOR SQUARE SHORTCUT BOXES BELOW) */}
            <div className="bg-slate-950/90 px-4 py-1.5 flex items-center gap-2 border-b border-slate-800 shadow-inner">
              {/* Scroll Left Button */}
              <button
                type="button"
                onClick={() => scrollNav('left')}
                className="flex items-center justify-center w-7 h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-xs shrink-0 active:scale-95 transition-all mr-1 z-10"
                title={lang === 'ur' ? 'پچھلے شارٹ کٹس (Scroll Left)' : 'Scroll Left'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Carousel Slider of Shortcut Boxes */}
              <nav
                ref={navSliderRef}
                className="flex items-center gap-2 overflow-x-auto py-0.5 scroll-smooth no-scrollbar flex-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {allModulesList
                  .filter((m) => m.id !== 'aiChatboard' || currentRole === 'ADMIN')
                  .map((m) => {
                    const Icon = m.icon;
                    const isActive = activeTab === m.id;
                    const isLocked = !hasAccess(m.id);

                    return (
                      <button
                        key={`box-${m.id}`}
                        type="button"
                        onClick={() => handleTabClick(m.id)}
                        className={`relative min-w-[70px] sm:min-w-[78px] h-12 px-2 py-1 rounded-xl text-xs font-black flex flex-col justify-between items-center transition-all border shrink-0 active:translate-y-0.5 select-none shadow-sm cursor-pointer ${
                          isActive
                            ? `${m.activeClass} -translate-y-0.5 ring-2 ring-white shadow-md`
                            : `${m.bgClass} hover:brightness-110 border-slate-700`
                        }`}
                        title={isLocked ? (lang === 'ur' ? 'کیشیئر کے لیے لاک (ایڈمن پن درکار ہے)' : 'Locked for cashier') : `${m.label} (${m.shortcut})`}
                      >
                        {/* Top: Function Key Badge & Icon */}
                        <div className="flex items-center justify-between w-full px-0.5">
                          <div className="w-4 h-4 rounded bg-black/25 flex items-center justify-center shrink-0 border border-white/10">
                            <Icon className="w-2.5 h-2.5 text-white/90" />
                          </div>
                          <span className="px-1.5 py-0.2 rounded bg-black/40 text-white font-mono text-[9px] font-black border border-white/15 shadow-inner">
                            {m.shortcut}
                          </span>
                        </div>

                        {/* Bottom: Label */}
                        <div className="w-full flex items-center justify-center gap-0.5">
                          <span className="font-bold text-[10px] sm:text-[10.5px] tracking-tight leading-none truncate text-center">
                            {m.label}
                          </span>
                          {isLocked && <Lock className="w-2 h-2 text-amber-200 shrink-0" />}
                        </div>

                        {m.id === 'whatsapp' && pendingWhatsAppOrdersCount > 0 && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              posSound.playClick();
                              setIsWhatsAppOrdersModalOpen(true);
                            }}
                            className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] animate-pulse hover:scale-105 cursor-pointer shadow-md"
                            title="پینڈنگ آرڈرز دیکھیں اور بل بنائیں"
                          >
                            {pendingWhatsAppOrdersCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </nav>

              {/* Scroll Right Button */}
              <button
                type="button"
                onClick={() => scrollNav('right')}
                className="flex items-center justify-center w-7 h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-xs shrink-0 active:scale-95 transition-all ml-1 z-10"
                title={lang === 'ur' ? 'اگلے شارٹ کٹس (Scroll Right)' : 'Scroll Right'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
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

        {/* 3. Quick Control Center & Essential Tools Modal */}
        {showControlCenterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl text-white shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px] shadow-lg shadow-emerald-950 flex items-center justify-center shrink-0">
                    <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                      <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white flex items-center gap-2">
                      <span>{lang === 'ur' ? 'کوئیک ٹولز و سسٹم کنٹرول سینٹر' : 'Quick Tools & Control Center'}</span>
                      <span className="text-[10px] uppercase font-mono font-black px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        1-Click
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      {lang === 'ur'
                        ? 'تمام اہم یوٹیلیٹیز، بیک اپ، کلاؤڈ اور سیشن کنٹرول ایک ہی کلک پر دستیاب ہیں'
                        : 'All essential utilities, cloud sync, backups and session settings in 1-click'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowControlCenterModal(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid of 1-Click Cards */}
              <div className="p-4 sm:p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                {/* 1. Barcode & QR Generator */}
                <button
                  type="button"
                  onClick={() => {
                    posSound.playClick();
                    setShowControlCenterModal(false);
                    setShowBarcodeModal(true);
                  }}
                  className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/70 transition-all text-left flex items-start gap-3 group active:scale-98 shadow-sm cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-700/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white group-hover:text-emerald-300 transition">
                        {lang === 'ur' ? 'بارکوڈ و کیو آر جنریٹر' : 'Barcode / QR Generator'}
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                        {lang === 'ur' ? 'پرنٹ' : 'Print'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {lang === 'ur' ? 'پروڈکٹس کے بارکوڈ اور ریٹیل کیو آر اسٹیکر تیار و پرنٹ کریں' : 'Generate & print custom product barcode labels'}
                    </p>
                  </div>
                </button>

                {/* 2. Gmail Cloud Backup */}
                <button
                  type="button"
                  onClick={() => {
                    posSound.playClick();
                    setShowControlCenterModal(false);
                    setShowBackupModal(true);
                  }}
                  className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/70 transition-all text-left flex items-start gap-3 group active:scale-98 shadow-sm cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-700/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white group-hover:text-cyan-300 transition">
                        {lang === 'ur' ? 'جی میل ڈیٹا بیک اپ' : 'Gmail Cloud Backup'}
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                        {lang === 'ur' ? 'محفوظ' : 'Secure'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {lang === 'ur' ? 'تمام کھاتہ جات اور انوینٹری ڈیٹا جی میل پر فوری بیک اپ بھیجیں' : 'Safely send full shop database backup to your Gmail'}
                    </p>
                  </div>
                </button>

                {/* 3. JK Support Helpline */}
                <button
                  type="button"
                  onClick={() => {
                    posSound.playClick();
                    setShowControlCenterModal(false);
                    setShowSupportModal(true);
                  }}
                  className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/70 transition-all text-left flex items-start gap-3 group active:scale-98 shadow-sm cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 border border-amber-700/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white group-hover:text-amber-300 transition">
                        {lang === 'ur' ? 'جے کے آفیشل ہیلپ لائن' : 'JK Official Helpline'}
                      </span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                        03008998381
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {lang === 'ur' ? 'جے کے ڈویلپرز پاکستان تکنیکی رہنمائی، واٹس ایپ و کال سپورٹ' : 'Direct developer phone, WhatsApp and technical assistance'}
                    </p>
                  </div>
                </button>

                {/* 4. Cloud Two-Way Sync */}
                <button
                  type="button"
                  disabled={isCloudSyncing}
                  onClick={() => {
                    handleManualCloudSync();
                  }}
                  className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/70 transition-all text-left flex items-start gap-3 group active:scale-98 shadow-sm cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-xl bg-blue-950 text-blue-400 border border-blue-700/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition ${isCloudSyncing ? 'animate-bounce' : ''}`}>
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white group-hover:text-blue-300 transition">
                        {lang === 'ur' ? 'کلاؤڈ ڈیٹا سنک' : 'Cloud Two-Way Sync'}
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800 font-mono">
                        {isCloudSyncing ? (lang === 'ur' ? 'سنک جاری...' : 'Syncing...') : (lastCloudSyncTime ? 'Synced ✓' : 'Online')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {lang === 'ur' ? 'موبائل اور تمام کاؤنٹرز کا ڈیٹا فوری کلاؤڈ سرور سے ہم آہنگ کریں' : 'Instant 2-way live sync across multiple counters & mobile'}
                    </p>
                  </div>
                </button>

                {/* 5. Role & 10 Cashier Counters Switcher */}
                <button
                  type="button"
                  onClick={() => {
                    posSound.playClick();
                    setShowControlCenterModal(false);
                    setRoleModalTab(currentRole === 'ADMIN' || currentRole === 'MANAGER' ? 'cashier' : 'admin');
                    setShowRoleModal(true);
                  }}
                  className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 hover:border-purple-500/70 transition-all text-left flex items-start gap-3 group active:scale-98 shadow-sm cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-950 text-purple-400 border border-purple-700/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white group-hover:text-purple-300 transition">
                        {lang === 'ur' ? 'کاؤنٹر و ایڈمن سیشن' : 'Counter & Admin Session'}
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800">
                        {currentRole === 'ADMIN' ? '👑 Admin' : `Counter #${activeCounter}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {lang === 'ur' ? '10 کاؤنٹرز میں سے مطلوبہ کاؤنٹر یا ایڈمن پینل لاگ ان میں سوئچ کریں' : 'Switch active cashier counter or unlock full Admin mode'}
                    </p>
                  </div>
                </button>

                {/* 6. Sound Effects On/Off */}
                <button
                  type="button"
                  onClick={() => {
                    handleToggleSound();
                  }}
                  className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 hover:border-teal-500/70 transition-all text-left flex items-start gap-3 group active:scale-98 shadow-sm cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-950 text-teal-400 border border-teal-700/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    {soundActive ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white group-hover:text-teal-300 transition">
                        {lang === 'ur' ? 'پی او ایس آواز و بیپ' : 'Audio Sound Effects'}
                      </span>
                      <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded border ${soundActive ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {soundActive ? (lang === 'ur' ? 'فعال (ON)' : 'ON') : (lang === 'ur' ? 'بند (OFF)' : 'OFF')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {lang === 'ur' ? 'بارکوڈ اسکین اور کی پیڈ کی میکینیکل کلک ساؤنڈ آن / آف کریں' : 'Barcode scanner beep and keypad mechanical sound effects'}
                    </p>
                  </div>
                </button>

                {/* 7. Language Switcher */}
                <button
                  type="button"
                  onClick={() => {
                    posSound.playClick();
                    toggleLang();
                  }}
                  className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/70 transition-all text-left flex items-start gap-3 group active:scale-98 shadow-sm cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-700/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Languages className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white group-hover:text-indigo-300 transition">
                        {lang === 'ur' ? 'انٹرفیس زبان تبدیل کریں' : 'Switch Language'}
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800">
                        {lang === 'ur' ? 'اردو' : 'English'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {lang === 'ur' ? 'مکمل سافٹ ویئر کو اردو / انگریزی زبان میں سوئچ کرنے کیلئے کلک کریں' : 'Switch complete software language to Urdu / English'}
                    </p>
                  </div>
                </button>

                {/* 8. Pending WhatsApp Orders */}
                <button
                  type="button"
                  onClick={() => {
                    posSound.playClick();
                    setShowControlCenterModal(false);
                    setIsWhatsAppOrdersModalOpen(true);
                  }}
                  className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 hover:border-rose-500/70 transition-all text-left flex items-start gap-3 group active:scale-98 shadow-sm cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-950 text-rose-400 border border-rose-700/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white group-hover:text-rose-300 transition">
                        {lang === 'ur' ? 'پینڈنگ واٹس ایپ آرڈرز' : 'Pending WhatsApp Orders'}
                      </span>
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${pendingWhatsAppOrdersCount > 0 ? 'bg-amber-400 text-slate-950 border-amber-300 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {pendingWhatsAppOrdersCount} {lang === 'ur' ? 'آرڈرز' : 'Orders'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {lang === 'ur' ? 'گاہکوں کے واٹس ایپ آرڈرز کا جائزہ لیں اور فوری بل بنائیں' : 'Review pending customer WhatsApp orders & generate bill'}
                    </p>
                  </div>
                </button>

                {/* 9. Full System Settings */}
                <button
                  type="button"
                  onClick={() => {
                    posSound.playClick();
                    setShowControlCenterModal(false);
                    handleTabClick('settings');
                  }}
                  className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-500/70 transition-all text-left flex items-start gap-3 group active:scale-98 shadow-sm cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white group-hover:text-cyan-300 transition">
                        {lang === 'ur' ? 'مکمل سسٹم سیٹنگز' : 'System Settings'}
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        Config
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {lang === 'ur' ? 'دکان کی پروفائل، پرنٹر سائز، بارکوڈ اور ٹیکس سیٹنگز' : 'Shop profile, thermal printer, tax and barcode configuration'}
                    </p>
                  </div>
                </button>

                {/* 10. Super Admin (if authorized) */}
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      posSound.playClick();
                      setShowControlCenterModal(false);
                      setIsSuperAdminModalOpen(true);
                    }}
                    className="p-3.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-600/70 transition-all text-left flex items-start gap-3 group active:scale-98 shadow-sm cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-900 text-amber-300 border border-emerald-500/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-amber-300">
                          {lang === 'ur' ? 'سپر ایڈمن کنٹرول پینل' : 'Super Admin Master Panel'}
                        </span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Master
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1">
                        {lang === 'ur' ? 'لائسنسنگ اور سسٹم ماسٹر کنفیگریشن تک خصوصی رسائی' : 'Licensing and core master system controls'}
                      </p>
                    </div>
                  </button>
                )}

                {/* 11. Sign Out */}
                <button
                  type="button"
                  onClick={() => {
                    posSound.playClick();
                    setShowControlCenterModal(false);
                    logoutUser();
                    window.location.reload();
                  }}
                  className="p-3.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 hover:border-rose-600 transition-all text-left flex items-start gap-3 group active:scale-98 shadow-sm cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-950 text-rose-400 border border-rose-700/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-rose-300">
                        {lang === 'ur' ? 'لاگ آؤٹ و سیشن بند' : 'Sign Out / Close Session'}
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                        Exit
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {currentUserEmail ? `${currentUserEmail} کا سیشن ختم کریں` : 'Sign out from current user account safely'}
                    </p>
                  </div>
                </button>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-emerald-400 font-mono font-bold">OneShop POS v2.0 PRO</span>
                  <span>•</span>
                  <span className="text-slate-500">JK Developers Pakistan</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowControlCenterModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  {lang === 'ur' ? 'بند کریں (Close)' : 'Close'}
                </button>
              </div>
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
