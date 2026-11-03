'use client';

import React, { useState } from 'react';
import { Mic, MicOff, Sparkles, Loader2, Check, X, Volume2 } from 'lucide-react';
import { useVoice } from '@/hooks/useVoice';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'order' | 'search' | 'customer';
  onApplySearch?: (query: string) => void;
  onApplyCustomer?: (data: { name: string; phone: string; address: string }) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  mode,
  onApplySearch,
  onApplyCustomer,
}) => {
  const { lang, t } = useLanguage();
  const { products, addToCart } = useShop();
  const [voiceLang, setVoiceLang] = useState<'ur-PK' | 'en-US'>('ur-PK');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { isListening, transcript, isSupported, startListening, stopListening } = useVoice({
    lang: voiceLang,
    onResult: (text) => {
      setCurrentText(text);
      if (mode === 'order') {
        processVoiceOrderAI(text);
      } else if (mode === 'search') {
        if (onApplySearch) onApplySearch(text);
      } else if (mode === 'customer') {
        parseSpokenCustomer(text);
      }
    },
    onError: (err) => {
      setErrorMsg(typeof err === 'string' ? err : 'Error recognizing speech');
    },
  });

  const processVoiceOrderAI = async (text: string) => {
    setIsProcessingAI(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          inventory: products,
        }),
      });
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setParsedItems(data.items);
      } else {
        setErrorMsg(
          lang === 'ur'
            ? 'کوئی پروڈکٹ مطابقت نہیں رکھتا۔ دوبارہ بولیں۔'
            : 'No matching products found. Try speaking again.'
        );
      }
    } catch (e: any) {
      setErrorMsg('AI Processing failed: ' + e.message);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const parseSpokenCustomer = (text: string) => {
    // Basic phone and name extraction from text
    const phoneMatch = text.match(/03\d{2}[-\s]?\d{7}/) || text.match(/\d{11}/);
    const phone = phoneMatch ? phoneMatch[0].replace(/[\s-]/g, '') : '';
    const name = text.replace(phone, '').trim();
    if (onApplyCustomer) {
      onApplyCustomer({
        name: name || text,
        phone: phone || '',
        address: '',
      });
    }
  };

  const handleApplyItemsToCart = () => {
    parsedItems.forEach((item) => {
      const matched = products.find((p) => p.id === item.productId);
      if (matched) {
        addToCart(matched, item.quantity, item.unit);
      }
    });
    setParsedItems([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Mic className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {mode === 'order'
                ? lang === 'ur' ? 'آواز سے آرڈر درج کریں' : 'Voice Order AI'
                : mode === 'search'
                ? lang === 'ur' ? 'آواز سے تلاش' : 'Voice Search'
                : lang === 'ur' ? 'آواز سے گاہک اندراج' : 'Voice Customer Dictation'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ur'
                ? 'اردو یا انگریزی میں براہ راست بولیں'
                : 'Speak naturally in Urdu or English'}
            </p>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center justify-between mb-4 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-xl text-xs">
          <span className="text-slate-600 dark:text-slate-300 font-medium px-2">
            {lang === 'ur' ? 'آواز کی زبان:' : 'Recognition Language:'}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setVoiceLang('ur-PK')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                voiceLang === 'ur-PK'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              اردو (Urdu)
            </button>
            <button
              onClick={() => setVoiceLang('en-US')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                voiceLang === 'en-US'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Big Mic Button */}
        <div className="flex flex-col items-center justify-center my-6">
          <button
            onClick={() => {
              if (isListening) {
                stopListening();
              } else {
                startListening(voiceLang);
              }
            }}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-xl ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-600 text-white ring-8 ring-rose-500/30 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white ring-4 ring-emerald-500/20'
            }`}
          >
            {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
          </button>
          <span className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            {isListening
              ? lang === 'ur' ? 'سُن رہا ہوں... بولتے رہیں' : 'Listening... speak now'
              : lang === 'ur' ? 'بولنے کے لیے بٹن دبائیں' : 'Click to start speaking'}
          </span>
        </div>

        {/* Transcript display */}
        <div className="min-h-16 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center mb-4">
          <p className="text-slate-800 dark:text-slate-200 text-base font-medium">
            {transcript || currentText || (
              <span className="text-slate-400 italic text-sm">
                {lang === 'ur'
                  ? 'مثال: "پانچ کلو چینی اور دو کلو گھی"'
                  : 'Example: "5 kg sugar and 2 packs ghee"'}
              </span>
            )}
          </p>
        </div>

        {/* Processing Indicator */}
        {isProcessingAI && (
          <div className="flex items-center justify-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl mb-4 text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>
              {lang === 'ur' ? 'اے آئی آرڈر کی تصدیق کر رہا ہے...' : 'AI is parsing your order...'}
            </span>
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <p className="text-xs text-rose-500 text-center mb-3">{errorMsg}</p>
        )}

        {/* Parsed items preview */}
        {parsedItems.length > 0 && (
          <div className="space-y-2 mb-4 max-h-44 overflow-y-auto">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {lang === 'ur' ? 'شناخت شدہ اشیاء:' : 'Identified Items:'}
            </h4>
            {parsedItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-sm"
              >
                <div className="font-semibold text-emerald-900 dark:text-emerald-200">
                  {item.productName}
                </div>
                <div className="text-slate-600 dark:text-slate-400 font-mono">
                  {item.quantity} {item.unit} × {item.unitPrice} = {item.total} PKR
                </div>
              </div>
            ))}
            <button
              onClick={handleApplyItemsToCart}
              className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <Check className="w-5 h-5" />
              <span>
                {lang === 'ur' ? 'یہ اشیاء بل میں شامل کریں' : 'Add Items to Active Bill'}
              </span>
            </button>
          </div>
        )}

        {!isSupported && (
          <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800 text-center">
            {lang === 'ur'
              ? 'براؤزر میں مائیکروفون کی اجازت درکار ہے (Google Chrome یا Edge تجویز کیا جاتا ہے)'
              : 'Web Speech API requires microphone permissions. Recommended: Chrome or Edge.'}
          </div>
        )}
      </div>
    </div>
  );
};
