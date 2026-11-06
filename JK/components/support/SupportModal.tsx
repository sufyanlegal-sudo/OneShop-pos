'use client';

import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Headphones,
  CheckCircle2,
  ExternalLink,
  Ticket,
  Copy,
  Clock,
  Send,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const { lang } = useLanguage();
  const { businessProfile, currentUserEmail, activeCashier } = useShop();

  const [activeTicket, setActiveTicket] = useState<string | null>(null);
  const [ticketIssuedAt, setTicketIssuedAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const helplineDisplay = '0300-8998381';
  const cleanHelplineNumber = '923008998381';

  // Generate Unique Ticket, alert Super Admin via API, & Open WhatsApp
  const handleGenerateTicketAndConnect = async () => {
    const timestamp = new Date().toLocaleString('ur-PK');
    const clientStoreName = businessProfile?.nameUr || businessProfile?.nameEn || 'ون شاپ کلائنٹ سٹور';
    const clientContactPhone = businessProfile?.phone || businessProfile?.whatsapp || '0300-8998381';
    const operatorName = activeCashier?.name || currentUserEmail?.split('@')[0] || 'سٹور کیشیئر / ایڈمن';

    let generatedTicketId = `TICK-${Date.now().toString().slice(-4)}`;

    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: `${operatorName} (${clientStoreName})`,
          userPhone: clientContactPhone,
          userEmail: currentUserEmail || '',
          subject: `ٹیکنیکل سپورٹ انکوائری - ${clientStoreName}`,
          message: `السلام علیکم جے کے ڈویلپرز! مجھے اپنے OneShop POS سسٹم کے متعلق تکنیکی سپورٹ درکار ہے۔`,
        }),
      });
      const data = await res.json();
      if (data.ticketId) {
        generatedTicketId = data.ticketId;
      }
    } catch (err) {
      console.warn('Ticket API call fallback:', err);
    }

    setActiveTicket(generatedTicketId);
    setTicketIssuedAt(timestamp);

    const whatsappText = `🚨 *نئی کسٹمر سپورٹ انکوائری (OneShop POS)*
━━━━━━━━━━━━━━━━━━
🎫 *ٹکٹ نمبر:* ${generatedTicketId}
🏪 *دکان / کاروبار:* ${clientStoreName}
👤 *صارف / کیشیئر:* ${operatorName}
📱 *رابطہ فون:* ${clientContactPhone}
📧 *ای میل:* ${currentUserEmail || 'N/A'}
🕒 *تاریخ و وقت:* ${timestamp}
━━━━━━━━━━━━━━━━━━
السلام علیکم جے کے ڈویلپرز! مجھے اپنے OneShop POS سسٹم کے متعلق تکنیکی سپورٹ درکار ہے۔
میرا سپورٹ ٹکٹ نمبر *${generatedTicketId}* ہے۔ برائے مہربانی فوری رہنمائی فرمائیں۔`;

    const targetUrl = `https://wa.me/${cleanHelplineNumber}?text=${encodeURIComponent(whatsappText)}`;
    window.open(targetUrl, '_blank');
  };

  const handleCopyTicket = () => {
    if (!activeTicket) return;
    navigator.clipboard.writeText(activeTicket);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl w-full max-w-lg p-6 text-white shadow-2xl relative overflow-hidden">
        {/* Top Decorative Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 rounded-full blur-sm"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg font-black text-xl text-white">
            OS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-amber-300 font-mono tracking-wider">
                OneShop POS
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                JK Developers Pakistan
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {lang === 'ur'
                ? 'فوری تکنیکی مدد، پرنٹر سیٹ اپ اور کسٹم فیچرز کیلئے 24/7 ٹکٹ سسٹم'
                : '24/7 Automated Ticket Support, Printer Setup & ERP Customization'}
            </p>
          </div>
        </div>

        {/* ACTIVE SUPPORT TICKET BANNER (IF GENERATED) */}
        {activeTicket && (
          <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-2 border-emerald-500 shadow-xl space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                <Ticket className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'ur' ? 'سپورٹ ٹکٹ جاری ہو گیا ہے:' : 'Support Ticket Issued:'}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                اوپن و واٹس ایپ ارسال ✓
              </span>
            </div>

            <div className="flex items-center justify-between bg-black/50 p-2.5 rounded-xl border border-emerald-500/30">
              <span dir="ltr" className="font-mono text-xl font-black text-amber-300 tracking-wider">
                {activeTicket}
              </span>
              <button
                type="button"
                onClick={handleCopyTicket}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? (lang === 'ur' ? 'کاپی ہوا ✓' : 'Copied!') : (lang === 'ur' ? 'کاپی' : 'Copy')}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-300 leading-snug">
              {lang === 'ur'
                ? 'یہ ٹکٹ نمبر جے کے ڈویلپرز پاکستان کے آفیشل واٹس ایپ پر موصول ہو چکا ہے۔ ہماری سپورٹ ٹیم جلد رابطہ کرے گی۔'
                : 'This ticket has been dispatched to JK Developers WhatsApp. Our team will assist you shortly.'}
            </p>
          </div>
        )}

        {/* Official Contact Card with Automated Ticket Trigger */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 mb-5 space-y-4 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">
              {lang === 'ur' ? 'آفیشل ہیلپ لائن (ٹکٹ جنریٹر):' : 'Official Helpline (Ticket Generator):'}
            </span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {lang === 'ur' ? 'آن لائن 24/7' : 'Online 24/7'}
            </span>
          </div>

          <div className="text-center py-1">
            <button
              type="button"
              onClick={handleGenerateTicketAndConnect}
              className="group inline-flex flex-col items-center cursor-pointer"
              title="کلک کر کے ٹکٹ بنائیں اور واٹس ایپ پر رابطہ کریں"
            >
              <span
                dir="ltr"
                className="text-3xl font-black font-mono tracking-widest text-emerald-400 group-hover:text-amber-400 transition-colors inline-block phone-number"
              >
                {helplineDisplay}
              </span>
              <span className="text-[11px] text-amber-300 group-hover:underline mt-1 flex items-center gap-1 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'ur' ? 'کلک کریں ➔ خودکار ٹکٹ نمبر جاری ہوگا اور واٹس ایپ کھلے گا' : 'Click to auto-issue Ticket & connect on WhatsApp'}</span>
              </span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* WhatsApp Button with Ticket Generation */}
            <button
              type="button"
              onClick={handleGenerateTicketAndConnect}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>{lang === 'ur' ? 'ٹکٹ بنائیں و واٹس ایپ' : 'Get Ticket & WhatsApp'}</span>
            </button>

            {/* Direct Call Button */}
            <a
              href="tel:03008998381"
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-95"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>{lang === 'ur' ? 'ڈائریکٹ کال کریں' : 'Call Directly'}</span>
            </a>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-2 mb-5">
          <p className="text-xs font-bold text-slate-400">
            {lang === 'ur' ? 'سپورٹ سروسز و سہولیات:' : 'Services Included:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 bg-slate-800/40 p-2 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{lang === 'ur' ? 'تھرمل پرنٹر اور بارکوڈ سیٹ اپ' : 'Thermal & Barcode Setup'}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/40 p-2 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{lang === 'ur' ? 'روزانہ آٹو جی میل بیک اپ' : 'Daily Gmail Auto Backup'}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/40 p-2 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{lang === 'ur' ? 'نئے فیچرز اور کسٹم انوائس فارمیٹس' : 'Custom ERP Reports & Features'}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/40 p-2 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{lang === 'ur' ? 'سٹاف اور کیشیئر ٹریننگ' : 'Staff & Cashier Training'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-3.5 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono">OneShop POS • JK Developers Pakistan © 2026</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer"
          >
            {lang === 'ur' ? 'بند کریں' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
