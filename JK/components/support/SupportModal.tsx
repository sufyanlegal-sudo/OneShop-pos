'use client';

import React from 'react';
import {
  X,
  Phone,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Headphones,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const { lang } = useLanguage();

  if (!isOpen) return null;

  const whatsappNumber = '03008998381';
  const whatsappUrl = `https://wa.me/923008998381?text=${encodeURIComponent(
    'السلام علیکم! مجھے OneShop POS (جے کے ڈویلپرز پاکستان) کے حوالے سے تکنیکی رہنمائی اور سپورٹ درکار ہے۔'
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 text-white shadow-2xl relative overflow-hidden">
        {/* Top Decorative Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 rounded-full blur-sm"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
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
            <p className="text-xs text-slate-400">
              {lang === 'ur'
                ? 'کسی بھی مدد، پرنٹر سیٹ اپ، ڈیٹا بحالی یا کسٹم فیچرز کیلئے ہم 24/7 حاضر ہیں'
                : '24/7 Dedicated Technical Support, Printer Setup & ERP Customization'}
            </p>
          </div>
        </div>

        {/* Official Contact Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 mb-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              {lang === 'ur' ? 'آفیشل ہیلپ لائن / واٹس ایپ:' : 'Official Helpline / WhatsApp:'}
            </span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {lang === 'ur' ? 'آن لائن دستیاب' : 'Online & Ready'}
            </span>
          </div>

          <div className="text-center py-2">
            <a
              href={`tel:${whatsappNumber}`}
              className="text-3xl font-black font-mono tracking-widest text-white hover:text-amber-400 transition-colors inline-block"
            >
              {whatsappNumber}
            </a>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === 'ur' ? 'براہ راست کال کریں یا واٹس ایپ میسج بھیجیں' : 'Direct Call or WhatsApp Message'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* WhatsApp Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>{lang === 'ur' ? 'واٹس ایپ رابطہ' : 'WhatsApp Chat'}</span>
            </a>

            {/* Direct Call Button */}
            <a
              href={`tel:${whatsappNumber}`}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-95"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>{lang === 'ur' ? 'کال کریں' : 'Call Now'}</span>
            </a>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-2 mb-6">
          <p className="text-xs font-bold text-slate-400">
            {lang === 'ur' ? 'ہماری فراہم کردہ سہولیات:' : 'Services Included:'}
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
              <span>{lang === 'ur' ? 'نئے فیچرز اور کسٹم رپورٹس' : 'Custom ERP Reports & Features'}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/40 p-2 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{lang === 'ur' ? 'سٹاف اور کیشیئر ٹریننگ' : 'Staff & Cashier Training'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono">OneShop POS • JK Developers Pakistan © 2026</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
          >
            {lang === 'ur' ? 'بند کریں' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
