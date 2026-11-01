'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { PosTerminal } from '@/components/pos/PosTerminal';
import { BillsHistoryView } from '@/components/history/BillsHistoryView';
import { GRNView } from '@/components/grn/GRNView';
import { VendorsView } from '@/components/vendors/VendorsView';
import { RoznamchaView } from '@/components/roznamcha/RoznamchaView';
import { KhataView } from '@/components/khata/KhataView';
import { InventoryView } from '@/components/inventory/InventoryView';
import { StaffView } from '@/components/staff/StaffView';
import { ReportsView } from '@/components/reports/ReportsView';
import { AuditView } from '@/components/audit/AuditView';
import { WhatsAppBotView } from '@/components/whatsapp/WhatsAppBotView';
import { WhatsAppOrdersModal } from '@/components/whatsapp/WhatsAppOrdersModal';
import { AuthLicenseGate } from '@/components/auth/AuthLicenseGate';
import { SuperAdminModal } from '@/components/auth/SuperAdminModal';
import { SettingsView } from '@/components/settings/SettingsView';
import { SupportModal } from '@/components/support/SupportModal';
import { AiChatboardView } from '@/components/ai/AiChatboardView';
import { AiChatboardFloatingButton } from '@/components/ai/AiChatboardFloatingButton';
import { useShop } from '@/context/ShopContext';
import { Phone, Headphones } from 'lucide-react';

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
