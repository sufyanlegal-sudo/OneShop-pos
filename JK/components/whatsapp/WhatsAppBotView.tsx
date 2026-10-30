'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  ShoppingBag,
  Check,
  CheckCheck,
  Clock,
  ArrowRight,
  Phone,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  Globe,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { WhatsAppMessage } from '@/types';

interface WhatsAppBotViewProps {
  onPushToPos?: () => void;
}

export const WhatsAppBotView: React.FC<WhatsAppBotViewProps> = ({ onPushToPos }) => {
  const { lang, t } = useLanguage();
  const {
    businessProfile,
    products,
    addToCart,
    addWhatsAppOrder,
    whatsappOrders,
    pendingWhatsAppOrdersCount,
    setIsWhatsAppOrdersModalOpen,
  } = useShop();

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([
    {
      id: 'msg-1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      sender: 'BOT',
      text: `السلام علیکم ورحمۃ اللہ و برکاتہ!
${businessProfile.nameUr} میں خوش آمدید۔
ہم آپ کی کیا خدمت کر سکتے ہیں؟ آپ کسی بھی چیز کا ریٹ، دستیابی معلوم کر سکتے ہیں یا اپنا آرڈر براہ راست تحریر فرما سکتے ہیں۔`,
    },
  ]);

  const [lastParsedOrder, setLastParsedOrder] = useState<any | null>(null);
  const [copiedPushed, setCopiedPushed] = useState(false);
  const [showVercelGuide, setShowVercelGuide] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg: WhatsAppMessage = {
      id: 'msg-' + Date.now(),
      timestamp: new Date().toISOString(),
      sender: 'CUSTOMER',
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: (m.sender === 'CUSTOMER' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          businessProfile,
          inventory: products,
          history,
        }),
      });

      const data = await res.json();

      const botMsg: WhatsAppMessage = {
        id: 'msg-' + (Date.now() + 1),
        timestamp: new Date().toISOString(),
        sender: 'BOT',
        text: data.reply || 'معذرت، میں آپ کی بات سمجھ نہیں سکا۔',
        parsedOrder: data.parsedOrder,
      };

      setMessages((prev) => [...prev, botMsg]);

      if (data.parsedOrder && data.parsedOrder.items && data.parsedOrder.items.length > 0) {
        setLastParsedOrder(data.parsedOrder);
        // Automatically save as a PENDING WhatsApp Order for dashboard & POS!
        addWhatsAppOrder({
          customerName: 'محترم واٹس ایپ گاہک',
          customerPhone: businessProfile.whatsapp || '0300-1234567',
          customerAddress: 'واٹس ایپ لوکیشن',
          items: data.parsedOrder.items.map((it: any) => ({
            productId: it.matchedProductId,
            productName: it.name,
            quantity: it.qty || 1,
            unit: it.unit || 'Kg',
            unitPrice: it.price || 0,
            total: it.total || ((it.qty || 1) * (it.price || 0)),
          })),
          grandTotal: data.parsedOrder.grandTotal || 0,
          rawMessage: text.trim(),
          notes: 'واٹس ایپ چیٹ کے ذریعے خودکار موصول شدہ آرڈر (Pending)',
        });
      }
    } catch (e: any) {
      const errorMsg: WhatsAppMessage = {
        id: 'msg-' + (Date.now() + 1),
        timestamp: new Date().toISOString(),
        sender: 'BOT',
        text: 'السلام علیکم! رابطہ میں دشواری پیش آ رہی ہے۔ براہ کرم دکان کے فون نمبر پر رابطہ فرمائیں۔',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushOrderToCart = (order: any) => {
    if (!order || !order.items) return;

    order.items.forEach((item: any) => {
      // Find matching product in catalog
      const matched =
        products.find((p) => p.id === item.matchedProductId) ||
        products.find(
          (p) =>
            p.nameUr.includes(item.name) ||
            p.nameEn.toLowerCase().includes(item.name.toLowerCase())
        );

      if (matched) {
        addToCart(matched, item.qty || 1, item.unit || matched.unit);
      }
    });

    setCopiedPushed(true);
    setTimeout(() => setCopiedPushed(false), 3000);
    if (onPushToPos) {
      onPushToPos();
    }
  };

  // Helper to guarantee all amounts and numbers are shown in standard English Math Digits
  const renderFormattedMessageText = (rawText: string) => {
    // 1. Convert eastern/arabic numerals to English math digits
    const easternDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    let text = rawText || '';
    for (let i = 0; i < 10; i++) {
      text = text.replaceAll(easternDigits[i], i.toString());
      text = text.replaceAll(arabicDigits[i], i.toString());
    }

    // 2. Remove raw JSON block and technical leaks
    text = text.replace(/```json[\s\S]*?```/gi, '').trim();
    text = text.replace(/تصدیقی\s*JSON/gi, 'تصدیقی بل');
    text = text.replace(/\bJSON\b/gi, 'بل');
    text = text.replace(/[-*•]?\s*پروڈکٹ\s*(آئی\s*ڈی|ID)\s*:\s*[^\n\r]+/gi, '');
    text = text.replace(/[-*•]?\s*ID\s*:\s*[^\n\r]+/gi, '');
    text = text.replace(/\*\*(.*?)\*\*/g, '$1');
    text = text.replace(/\*(.*?)\*/g, '$1');

    // 3. Highlight and format math numbers in standard English font
    const parts = text.split(/(\d+(?:[.,]\d+)?)/g);
    return parts.map((part, idx) => {
      if (/^\d+(?:[.,]\d+)?$/.test(part)) {
        return (
          <span
            key={idx}
            dir="ltr"
            className="font-mono font-black text-slate-900 dark:text-emerald-300 px-0.5 inline-block text-[13.5px]"
          >
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const samplePrompts = [
    'السلام علیکم! مٹھائی اور گلاب جامن کا کیا ریٹ ہے؟',
    'مجھے 2 کلو مکس مٹھائی اور 1 گلاب جامن کا ڈبہ بھیج دیں',
    'کیا چینی اور باسمتی چاول دستیاب ہیں؟',
    'پانچ کلو چینی اور دو کلو گھی کا بل کتنا بنے گا؟',
  ];

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-2xl">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {t('whatsappSimTitle')}
            </h2>
            <p className="text-xs text-slate-500">{t('whatsappSimSubtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingWhatsAppOrdersCount > 0 && (
            <button
              type="button"
              onClick={() => setIsWhatsAppOrdersModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all animate-pulse"
              title="پینڈنگ واٹس ایپ آرڈرز دیکھیں اور بل بنائیں"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{pendingWhatsAppOrdersCount} پینڈنگ آرڈرز کھولیں</span>
            </button>
          )}

          <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-full font-mono text-xs font-bold border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Groq Llama 3.3 Active
          </span>
          <button
            onClick={() => {
              setMessages([
                {
                  id: 'msg-init',
                  timestamp: new Date().toISOString(),
                  sender: 'BOT',
                  text: `السلام علیکم ورحمۃ اللہ! ${businessProfile.nameUr} میں خوش آمدید۔ ہم آپ کی کیا خدمت کر سکتے ہیں؟`,
                },
              ]);
              setLastParsedOrder(null);
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            title="Reset Chat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Vercel Live WhatsApp Deployment Guide Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-900 text-white rounded-2xl p-4 shadow-md border border-emerald-600/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Globe className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-nastaliq">ورسل (Vercel) پر لائیو واٹس ایپ آٹو ریپلائی اور آرڈر وصولی سیٹ اپ</h3>
              <p className="text-xs text-emerald-200">اگر ورسل پر گاہکوں کے پیغامات کا خودکار جواب نہیں جا رہا تو نیچے دی گئی سیٹنگز چیک کریں</p>
            </div>
          </div>
          <button
            onClick={() => setShowVercelGuide(!showVercelGuide)}
            className="px-4 py-1.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-black transition shadow flex items-center gap-1.5"
          >
            <span>{showVercelGuide ? 'سیٹ اپ گائیڈ چھپائیں ▲' : 'سیٹ اپ کی اہم معلومات دیکھیں ▼'}</span>
          </button>
        </div>

        {showVercelGuide && (
          <div className="mt-4 pt-4 border-t border-emerald-500/40 space-y-3 text-xs animate-fadeIn">
            <div className="bg-black/40 p-3 rounded-xl space-y-2 border border-white/10">
              <p className="font-bold text-amber-300">1. ورسل پر ضروری انوائرنمنٹ ویری ایبلز (Environment Variables) درج کریں:</p>
              <p className="text-slate-200 text-[11px]">
                ورسل ڈیش بورڈ میں پروجیکٹ کے <strong>Settings ➔ Environment Variables</strong> میں جا کر یہ ویری ایبلز درج کریں تاکہ واٹس ایپ میٹا کلاؤڈ API اور Groq AI لائیو کال ہو سکیں:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="bg-slate-900/80 p-2.5 rounded border border-white/10 flex justify-between items-center">
                  <div>
                    <span className="text-emerald-300 block font-bold">GROQ_API_KEY</span>
                    <span className="text-slate-400 text-[10px]">فوری اردو AI جوابات کیلئے</span>
                  </div>
                  <button onClick={() => copyToClipboard('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', 'groq')} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-[10px] text-white">
                    {copiedKey === 'groq' ? 'کاپی ہوا ✓' : 'کاپی کی'}
                  </button>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded border border-white/10 flex justify-between items-center">
                  <div>
                    <span className="text-emerald-300 block font-bold">WHATSAPP_VERIFY_TOKEN</span>
                    <span className="text-slate-400 text-[10px]">jk_erp_secret_token_2026</span>
                  </div>
                  <button onClick={() => copyToClipboard('jk_erp_secret_token_2026', 'token')} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-[10px] text-white">
                    {copiedKey === 'token' ? 'کاپی ہوا ✓' : 'کاپی ٹوکن'}
                  </button>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded border border-white/10 flex justify-between items-center">
                  <div>
                    <span className="text-emerald-300 block font-bold">WHATSAPP_ACCESS_TOKEN</span>
                    <span className="text-slate-400 text-[10px]">Meta WhatsApp Cloud API ٹوکن</span>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded border border-white/10 flex justify-between items-center">
                  <div>
                    <span className="text-emerald-300 block font-bold">WHATSAPP_PHONE_NUMBER_ID</span>
                    <span className="text-slate-400 text-[10px]">Meta Phone Number ID</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black/40 p-3 rounded-xl space-y-2 border border-white/10">
              <p className="font-bold text-amber-300">2. فیس بک ڈیولپر پورٹل (Meta WhatsApp Webhook Configuration):</p>
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 p-2.5 rounded border border-white/10 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Webhook Callback URL:</span>
                  <span className="text-white">https://[آپ_کا_ورسل_ڈومین].vercel.app/api/webhook/whatsapp</span>
                </div>
                <button
                  onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/api/webhook/whatsapp` : '/api/webhook/whatsapp', 'webhook')}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-[10px] text-white flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedKey === 'webhook' ? 'کاپی ہوا ✓' : 'ویب ہک URL کاپی'}</span>
                </button>
              </div>
              <p className="text-emerald-200 text-[11px] font-nastaliq leading-relaxed">
                میٹا فیس بک پورٹل میں Webhook فیلڈز میں <strong>messages</strong> کو سبسکرائب (Subscribe) کریں تاکہ ہر آنے والا گاہک کا میسج ورسل پر وصول ہو اور فوراً اردو میں باادب جواب اور بل واپس چلا جائے!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main WhatsApp Phone Simulator Frame */}
      <div className="bg-[#efeae2] dark:bg-slate-950 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[650px] relative">
        {/* WhatsApp Top Navigation Bar */}
        <div className="bg-[#075E54] text-white p-3.5 flex items-center justify-between shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white shadow">
              {businessProfile.nameEn.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight font-nastaliq">
                {businessProfile.nameUr} (آفیشل بزنس)
              </h3>
              <p className="text-[10px] text-emerald-200 flex items-center gap-1">
                <span>آن لائن</span>
                <span>•</span>
                <span>{businessProfile.whatsapp}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-emerald-100">
            <Phone className="w-4 h-4" />
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => {
            const isBot = m.sender === 'BOT';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed ${
                    isBot
                      ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/80 dark:border-slate-700'
                      : 'bg-[#d9fdd3] dark:bg-emerald-950 text-slate-900 dark:text-slate-100 rounded-tr-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-nastaliq text-[13px] leading-relaxed">
                    {renderFormattedMessageText(m.text)}
                  </div>

                  {/* If this message contains a parsed order preview */}
                  {m.parsedOrder && m.parsedOrder.items && (
                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 text-xs font-sans">
                      <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 mb-2">
                        <ShoppingBag className="w-4 h-4 text-emerald-600" />
                        <span>{t('parsedOrderNotice')}</span>
                      </div>
                      <div className="space-y-1 mb-2">
                        {m.parsedOrder.items.map((it: any, i: number) => (
                          <div key={i} className="flex justify-between text-slate-700 dark:text-slate-300">
                            <span>{it.name} ({it.qty} {it.unit})</span>
                            <span className="font-mono font-bold">{it.total} PKR</span>
                          </div>
                        ))}
                        <div className="border-t border-emerald-200 dark:border-emerald-700 pt-1 flex justify-between font-bold text-emerald-800 dark:text-emerald-300">
                          <span>کل بل:</span>
                          <span className="font-mono">{m.parsedOrder.grandTotal} PKR</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-1.5 mt-2">
                        <button
                          onClick={() => handlePushOrderToCart(m.parsedOrder)}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center justify-center gap-1 text-[11px] shadow transition-all active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{copiedPushed ? 'POS بل میں لوڈ ہو گیا ✓' : t('pushToPos')}</span>
                        </button>

                        <button
                          onClick={() => setIsWhatsAppOrdersModalOpen(true)}
                          className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold flex items-center justify-center gap-1 text-[11px] shadow transition-all active:scale-95"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>پینڈنگ آرڈرز لسٹ</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-slate-400 font-mono">
                    <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {!isBot && <CheckCheck className="w-3 h-3 text-emerald-600" />}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 text-slate-500 rounded-2xl rounded-tl-none max-w-[200px] shadow text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-[11px] font-nastaliq mr-1">اسسٹنٹ جواب تیار کر رہا ہے...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Pills */}
        <div className="p-2 bg-white/70 dark:bg-slate-900/70 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap px-1">
            فوری سوال:
          </span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 dark:text-slate-300 whitespace-nowrap text-[11px] font-nastaliq transition-all border border-slate-200 dark:border-slate-750"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Message Bar */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder={t('typeMessage')}
            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-nastaliq"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="w-10 h-10 rounded-full bg-[#075E54] hover:bg-[#064e46] disabled:opacity-50 text-white flex items-center justify-center shadow-md transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
