'use client';

import React, { useState } from 'react';
import {
  X,
  Mail,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Database,
  Calendar,
  Sparkles,
  Send,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const { lang, t } = useLanguage();
  const {
    businessProfile,
    updateBusinessProfile,
    exportDataBackup,
    sendBackupToEmail,
    products,
    invoices,
    customers,
    vendors,
  } = useShop();

  const [emailInput, setEmailInput] = useState(
    businessProfile.backupEmail || ''
  );
  const [autoBackup, setAutoBackup] = useState(
    businessProfile.autoDailyBackup ?? true
  );
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSendEmail = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      setStatusMessage({
        type: 'error',
        text:
          lang === 'ur'
            ? 'براہ کرم درست جی میل ایڈریس درج کریں'
            : 'Please enter a valid Gmail address',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    // Save email preference
    updateBusinessProfile({
      backupEmail: emailInput,
      autoDailyBackup: autoBackup,
      lastBackupDate: new Date().toISOString(),
    });

    const result = await sendBackupToEmail(emailInput);
    setIsLoading(false);

    if (result.success) {
      setStatusMessage({
        type: 'success',
        text:
          lang === 'ur'
            ? `ڈیٹا بیک اپ کامیابی کے ساتھ ${emailInput} پر بھیج دیا گیا ہے!`
            : `Data backup successfully dispatched to ${emailInput}!`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: result.message,
      });
    }
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDataBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JK_POS_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatusMessage({
      type: 'success',
      text:
        lang === 'ur'
          ? 'بیک اپ فائل آپ کے کمپیوٹر میں ڈاؤنلوڈ ہو گئی ہے!'
          : 'Backup JSON downloaded to your computer!',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 text-white shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-2xl">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black">
              {lang === 'ur'
                ? 'جی میل آٹو ڈیٹا بیک اپ'
                : 'Gmail Auto Data Backup'}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'ur'
                ? 'دکان کا تمام ڈیٹا خودکار طور پر آپ کے ذاتی جی میل پر محفوظ کریں'
                : 'Safely backup all ERP data, invoices & ledgers directly to your Gmail'}
            </p>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl mb-4 text-xs font-bold flex items-center gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Stats Snapshot */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-5 grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-[10px] text-slate-500">
              {lang === 'ur' ? 'پروڈکٹس' : 'Products'}
            </p>
            <p className="text-base font-black text-white mt-0.5">
              {products.length}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">
              {lang === 'ur' ? 'بلز و رسیدیں' : 'Invoices'}
            </p>
            <p className="text-base font-black text-emerald-400 mt-0.5">
              {invoices.length}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">
              {lang === 'ur' ? 'گاہک' : 'Customers'}
            </p>
            <p className="text-base font-black text-blue-400 mt-0.5">
              {customers.length}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">
              {lang === 'ur' ? 'سپلائرز' : 'Vendors'}
            </p>
            <p className="text-base font-black text-amber-400 mt-0.5">
              {vendors.length}
            </p>
          </div>
        </div>

        {/* Gmail Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {lang === 'ur'
                ? 'بیک اپ وصول کنندہ جی میل (Gmail Address)'
                : 'Backup Recipient Gmail'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="yourshopname@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {lang === 'ur'
                ? 'اسی ای میل پر تمام ڈیٹا کا روزانہ آٹو بیک اپ روانہ ہوگا'
                : 'Daily automated backup snapshot will be delivered to this address'}
            </p>
          </div>

          {/* Auto Backup Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-200">
                {lang === 'ur' ? 'روزانہ آٹو بیک اپ فعال کریں' : 'Enable Daily Auto Backup'}
              </p>
              <p className="text-[10px] text-slate-400">
                {lang === 'ur'
                  ? 'ہر روز دکان بند کرتے وقت خودکار بیک اپ محفوظ ہوگا'
                  : 'Automatically sync backup copy every day'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={(e) => setAutoBackup(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSendEmail}
            disabled={isLoading}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold rounded-xl text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{lang === 'ur' ? 'جی میل پر بھیجیں' : 'Send to Gmail'}</span>
          </button>

          <button
            onClick={handleDownloadBackup}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs md:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'ur' ? 'ڈاؤنلوڈ فائل' : 'Download JSON'}</span>
          </button>
        </div>

        {/* Developer Branding */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-mono text-amber-300 font-bold">OneShop POS • JK Developers Pakistan</span>
          <span>Helpline: 03008998381</span>
        </div>
      </div>
    </div>
  );
};
