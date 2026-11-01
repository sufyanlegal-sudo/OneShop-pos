'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/Navbar';
import { PosTerminal } from '@/components/pos/PosTerminal';
import { AuthLicenseGate } from '@/components/auth/AuthLicenseGate';
import { useShop } from '@/context/ShopContext';
import { Headphones } from 'lucide-react';

// Lightweight fast loader for dynamic tabs
const ViewLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs font-bold text-slate-500 font-nastaliq">لوڈ ہو رہا ہے...</span>
    </div>
  </div>
);

// High-Performance Next.js Code-Splitting (Reduces initial mobile bundle by >65%)
const BillsHistoryView = dynamic(() => import('@/components/history/BillsHistoryView').then((m) => m.BillsHistoryView), {
  ssr: false,
  loading: () => <ViewLoader />,
});
const GRNView = dynamic(() => import('@/components/grn/GRNView').then((m) => m.GRNView), {
  ssr: false,
  loading: () => <ViewLoader />,
});
const VendorsView = dynamic(() => import('@/components/vendors/VendorsView').then((m) => m.VendorsView), {
  ssr: false,
  loading: () => <ViewLoader />,
});
const RoznamchaView = dynamic(() => import('@/components/roznamcha/RoznamchaView').then((m) => m.RoznamchaView), {
  ssr: false,
  loading: () => <ViewLoader />,
});
const KhataView = dynamic(() => import('@/components/khata/KhataView').then((m) => m.KhataView), {
  ssr: false,
  loading: () => <ViewLoader />,
});
const InventoryView = dynamic(() => import('@/components/inventory/InventoryView').then((m) => m.InventoryView), {
  ssr: false,
  loading: () => <ViewLoader />,
});
const StaffView = dynamic(() => import('@/components/staff/StaffView').then((m) => m.StaffView), {
  ssr: false,
  loading: () => <ViewLoader />,
});
const ReportsView = dynamic(() => import('@/components/reports/ReportsView').then((m) => m.ReportsView), {
  ssr: false,
  loading: () => <ViewLoader />,
});
const AuditView = dynamic(() => import('@/components/audit/AuditView').then((m) => m.AuditView), {
  ssr: false,
  loading: () => <ViewLoader />,
});
const WhatsAppBotView = dynamic(() => import('@/components/whatsapp/WhatsAppBotView').then((m) => m.WhatsAppBotView), {
  ssr: false,
  loading: () => <ViewLoader />,
});
const SettingsView = dynamic(() => import('@/components/settings/SettingsView').then((m) => m.SettingsView), {
  ssr: false,
  loading: () => <ViewLoader />,
});
const AiChatboardView = dynamic(() => import('@/components/ai/AiChatboardView').then((m) => m.AiChatboardView), {
  ssr: false,
  loading: () => <ViewLoader />,
});
const AiChatboardFloatingButton = dynamic(() => import('@/components/ai/AiChatboardFloatingButton').then((m) => m.AiChatboardFloatingButton), {
  ssr: false,
});
const WhatsAppOrdersModal = dynamic(() => import('@/components/whatsapp/WhatsAppOrdersModal').then((m) => m.WhatsAppOrdersModal), {
  ssr: false,
});
const SuperAdminModal = dynamic(() => import('@/components/auth/SuperAdminModal').then((m) => m.SuperAdminModal), {
  ssr: false,
});
const SupportModal = dynamic(() => import('@/components/support/SupportModal').then((m) => m.SupportModal), {
  ssr: false,
});

export default function Home() {
  const { currentRole } = useShop();
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [showSupportModal, setShowSupportModal] = useState(false);

  // If cashier tries to view AI chatboard tab, route back to pos terminal
  const effectiveTab = (activeTab === 'aiChatboard' && currentRole !== 'ADMIN') ? 'pos' : activeTab;

  return (
    <AuthLicenseGate>
      <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {/* Dynamic Header & Navigation */}
        <Navbar activeTab={effectiveTab} setActiveTab={setActiveTab} />

        {/* Main Tab View Content */}
        <main className="flex-1">
          {effectiveTab === 'pos' && <PosTerminal onNavigate={setActiveTab} />}
          {effectiveTab === 'billsHistory' && <BillsHistoryView />}
          {effectiveTab === 'grn' && <GRNView />}
          {effectiveTab === 'vendors' && <VendorsView />}
          {effectiveTab === 'roznamcha' && <RoznamchaView />}
          {effectiveTab === 'khata' && <KhataView />}
          {effectiveTab === 'inventory' && <InventoryView />}
          {effectiveTab === 'staff' && <StaffView />}
          {effectiveTab === 'reports' && <ReportsView />}
          {effectiveTab === 'audit' && <AuditView />}
          {effectiveTab === 'aiChatboard' && currentRole === 'ADMIN' && <AiChatboardView />}
          {effectiveTab === 'whatsapp' && (
            <WhatsAppBotView onPushToPos={() => setActiveTab('pos')} />
          )}
          {effectiveTab === 'settings' && <SettingsView />}
        </main>

        {/* Floating AI Business & Report Assistant Trigger (ONLY for ADMIN) */}
        {currentRole === 'ADMIN' && <AiChatboardFloatingButton />}

        {/* Persistent Developer Bottom Bar with Support Phone */}
        <footer className="no-print bg-slate-900 text-slate-400 py-2.5 px-4 border-t border-slate-800 text-center text-xs flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[11px] text-slate-400 font-bold">
            OneShop POS v2.0
          </span>

          {/* Clickable Developer Support Trigger */}
          <button
            onClick={() => setShowSupportModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold transition-all shadow-sm"
          >
            <Headphones className="w-3.5 h-3.5 text-amber-400" />
            <span className="tracking-wider">JK Developers Pakistan</span>
            <span className="text-slate-500">|</span>
            <span className="font-mono text-emerald-400 font-bold">03008998381</span>
          </button>

          <span className="text-[11px] text-slate-500">
            Official Support & Customization by JK Developers Pakistan
          </span>
        </footer>

        {/* Quick Support Modal */}
        <SupportModal
          isOpen={showSupportModal}
          onClose={() => setShowSupportModal(false)}
        />

        {/* Global WhatsApp Orders & Pending Billing Manager Modal */}
        <WhatsAppOrdersModal onNavigateToPos={() => setActiveTab('pos')} />

        {/* Super Admin Control Panel Modal for jkdevelopers.pk@gmail.com */}
        <SuperAdminModal />
      </div>
    </AuthLicenseGate>
  );
}
