'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Phone,
  ShoppingBag,
  ExternalLink,
  X,
  Trash2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';

interface WhatsAppOrdersModalProps {
  onNavigateToPos?: () => void;
}

export const WhatsAppOrdersModal: React.FC<WhatsAppOrdersModalProps> = ({ onNavigateToPos }) => {
  const { lang, t } = useLanguage();
  const {
    businessProfile,
    whatsappOrders,
    pendingWhatsAppOrdersCount,
    isWhatsAppOrdersModalOpen,
    setIsWhatsAppOrdersModalOpen,
    updateWhatsAppOrderStatus,
    loadWhatsAppOrderIntoCart,
  } = useShop();

  const [waFilter, setWaFilter] = useState<'PENDING' | 'COMPLETED' | 'ALL'>('PENDING');

  if (!isWhatsAppOrdersModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-black tracking-tight font-sans">
                  {lang === 'ur' ? 'واٹس ایپ آرڈرز و بلنگ مینیجر' : 'WhatsApp Orders & Auto-Billing Manager'}
                </h2>
                {pendingWhatsAppOrdersCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs animate-pulse">
                    {pendingWhatsAppOrdersCount} پینڈنگ (Pending)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {lang === 'ur'
                  ? 'گاہک کے واٹس ایپ میسج سے خودکار بل تیار کریں، پینڈنگ لسٹ دیکھیں اور 1-کلک سے POS میں لوڈ کریں'
                  : 'Auto-calculate bills from WhatsApp messages & convert to POS sales with one click'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${(businessProfile.whatsapp || '').replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold transition-all shadow"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{lang === 'ur' ? 'شاپ واٹس ایپ لنک' : 'Shop WhatsApp'}</span>
            </a>

            <button
              onClick={() => setIsWhatsAppOrdersModalOpen(false)}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setWaFilter('PENDING')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                waFilter === 'PENDING'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{lang === 'ur' ? '⏳ پینڈنگ آرڈرز' : 'Pending Orders'}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-white text-[10px]">
                {whatsappOrders.filter((o) => o.status === 'PENDING').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setWaFilter('COMPLETED')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                waFilter === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{lang === 'ur' ? '✅ مکمل شدہ' : 'Completed / Accepted'}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white text-[10px]">
                {whatsappOrders.filter((o) => o.status === 'ACCEPTED' || o.status === 'COMPLETED').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setWaFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                waFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {lang === 'ur' ? 'تمام آرڈرز' : 'All Orders'} ({whatsappOrders.length})
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Realtime Auto-Sync with WhatsApp
          </span>
        </div>

        {/* Orders List Area */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-950 flex-1">
          {whatsappOrders
            .filter((o) => {
              if (waFilter === 'PENDING') return o.status === 'PENDING';
              if (waFilter === 'COMPLETED') return o.status === 'ACCEPTED' || o.status === 'COMPLETED';
              return true;
            })
            .map((ord) => {
              return (
                <div
                  key={ord.id}
                  className={`p-4 md:p-5 rounded-2xl border transition-all space-y-3.5 ${
                    ord.status === 'PENDING'
                      ? 'bg-white dark:bg-slate-900 border-amber-400/90 shadow-md ring-2 ring-amber-400/20'
                      : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Top Bar of Order Card */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        #{ord.orderNo}
                      </span>
                      <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3" />
                        {new Date(ord.date).toLocaleDateString()} {new Date(ord.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {ord.status === 'PENDING' && (
                        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40 font-black text-xs flex items-center gap-1.5 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>⏳ پینڈنگ (Pending)</span>
                        </span>
                      )}
                      {ord.status === 'ACCEPTED' && (
                        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40 font-bold text-xs flex items-center gap-1">
                          <span>🛒 بل تیار کیا جا رہا ہے (In Progress)</span>
                        </span>
                      )}
                      {ord.status === 'COMPLETED' && (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 font-bold text-xs flex items-center gap-1">
                          <span>✅ بل مکمل ہو گیا (Completed)</span>
                        </span>
                      )}
                      {ord.status === 'CANCELLED' && (
                        <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-600 border border-rose-500/40 font-bold text-xs">
                          ❌ منسوخ (Cancelled)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer Details & Raw Message */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">گاہک کا نام:</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{ord.customerName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">واٹس ایپ فون:</span>
                        <a
                          href={`https://wa.me/${ord.customerPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{ord.customerPhone}</span>
                        </a>
                      </div>
                      {ord.customerAddress && (
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-slate-500">پتہ برائے ڈیلیوری:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{ord.customerAddress}</span>
                        </div>
                      )}
                    </div>

                    {/* Customer WhatsApp Message Bubble */}
                    {ord.rawMessage && (
                      <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block mb-1">
                          💬 کسٹمر کا اصل واٹس ایپ میسج:
                        </span>
                        <p className="font-nastaliq text-[13px] leading-relaxed text-slate-800 dark:text-slate-200" dir="rtl">
                          "{ord.rawMessage}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Items Breakdown Table */}
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                        <tr>
                          <th className="p-2 text-center w-8">#</th>
                          <th className="p-2">سامان کی تفصیل (آئٹم)</th>
                          <th className="p-2 text-center w-24">تعداد / مقدار</th>
                          <th className="p-2 text-left w-24">ریٹ (PKR)</th>
                          <th className="p-2 text-left w-28">کل رقم (PKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {ord.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                            <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-2 font-bold text-slate-900 dark:text-white">
                              {item.productName}
                            </td>
                            <td className="p-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="p-2 text-left font-mono text-slate-600 dark:text-slate-400">
                              {item.unitPrice.toLocaleString()}
                            </td>
                            <td className="p-2 text-left font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {item.total.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Total & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-bold">
                        {lang === 'ur' ? 'کل بل کی رقم:' : 'Grand Total:'}
                      </span>
                      <span className="font-mono font-black text-xl text-emerald-600 dark:text-emerald-400">
                        {ord.grandTotal.toLocaleString()} PKR
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 1-Click Load into POS Bill */}
                      {ord.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => {
                            const res = loadWhatsAppOrderIntoCart(ord.id);
                            if (res.success) {
                              setIsWhatsAppOrdersModalOpen(false);
                              if (onNavigateToPos) {
                                onNavigateToPos();
                              }
                            }
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>{lang === 'ur' ? '🛒 بل میں لوڈ کریں اور پرنٹ نکالیں' : 'Convert to POS Bill'}</span>
                        </button>
                      )}

                      {/* Send WhatsApp Bill Message to Customer */}
                      <button
                        type="button"
                        onClick={() => {
                          const itemsText = ord.items
                            .map((it) => `- ${it.productName}: ${it.quantity} ${it.unit} = ${it.total} روپے`)
                            .join('\n');
                          const msg = `محترم جناب ${ord.customerName}!
آپ کے واٹس ایپ آرڈر #${ord.orderNo} کا بل درج ذیل بن گیا ہے:
${itemsText}
------------------------
کل واجب الادا رقم: ${ord.grandTotal.toLocaleString()} روپے
ہم آپ کا آرڈر تیار کر رہے ہیں۔ تشریف آوری یا ڈیلیوری کا شکریہ!
${businessProfile.nameUr} (${businessProfile.phone})`;
                          let cleanPhone = ord.customerPhone.replace(/[^0-9]/g, '');
                          if (cleanPhone.startsWith('03')) cleanPhone = '92' + cleanPhone.substring(1);
                          window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="px-3 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{lang === 'ur' ? 'گاہک کو واٹس ایپ بل بھیجیں' : 'Send WhatsApp Bill'}</span>
                      </button>

                      {ord.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => updateWhatsAppOrderStatus(ord.id, 'CANCELLED')}
                          className="px-2.5 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl font-bold text-xs"
                        >
                          {lang === 'ur' ? 'منسوخ' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          {whatsappOrders.filter((o) => {
            if (waFilter === 'PENDING') return o.status === 'PENDING';
            if (waFilter === 'COMPLETED') return o.status === 'ACCEPTED' || o.status === 'COMPLETED';
            return true;
          }).length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
              <p className="font-bold text-sm">
                {lang === 'ur' ? 'اس وقت کوئی پینڈنگ واٹس ایپ آرڈر موجود نہیں ہے!' : 'No pending WhatsApp orders!'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'ur'
                  ? 'جب بھی کوئی گاہک واٹس ایپ پر آرڈر بھیجے گا وہ فوری طور پر یہاں ظاہر ہو جائے گا۔'
                  : 'Incoming customer orders via WhatsApp will automatically appear here as Pending.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
