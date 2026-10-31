'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  TrendingUp,
  AlertTriangle,
  Clock,
  RefreshCw,
  BarChart2,
  DollarSign,
  PackageCheck,
  Zap,
  X,
  MessageSquare,
  Copy,
  Check,
  HelpCircle,
  FileText,
  Boxes,
  Users,
} from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { useLanguage } from '@/context/LanguageContext';
import { Product, Invoice } from '@/types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  cards?: {
    title: string;
    items: { label: string; value: string; badge?: string; badgeColor?: string }[];
  };
}

export const AiChatboardView: React.FC<{ isModal?: boolean; onClose?: () => void }> = ({
  isModal = false,
  onClose,
}) => {
  const { lang, t } = useLanguage();
  const {
    products,
    allProducts,
    invoices,
    roznamcha,
    customers,
    vendors,
    businessProfile,
  } = useShop();

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `السلام علیکم و رحمتہ اللہ! میں آپ کا اسمارٹ بزنس و رپورٹ اسسٹنٹ (OneShop AI) ہوں۔\nآپ مجھ سے آج کی سیل، ایکسپائری، کم اسٹاک یا زیادہ بکنے والے (رننگ) آئٹمز کی لائیو رپورٹ کسی بھی وقت پوچھ سکتے ہیں۔`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // -------------------------------------------------------------
  // INTELLIGENT REAL-TIME DATA CALCULATIONS
  // -------------------------------------------------------------
  const getTodaySalesMetrics = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayInvoices = invoices.filter((inv) => inv.date.startsWith(today));
    const totalSales = todayInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const cashReceived = todayInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const creditSales = todayInvoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
    const totalProfit = todayInvoices.reduce((sum, inv) => sum + (inv.totalProfit || 0), 0);
    const invoiceCount = todayInvoices.length;

    // Expenses from Roznamcha
    const todayExpenses = roznamcha
      .filter((r) => r.date.startsWith(today) && (!r.isCashIn || r.type === 'EXPENSE'))
      .reduce((sum, r) => sum + r.amount, 0);

    return {
      totalSales,
      cashReceived,
      creditSales,
      totalProfit,
      invoiceCount,
      todayExpenses,
      netInHand: cashReceived - todayExpenses,
    };
  };

  const getLowStockItems = () => {
    const targetProducts = allProducts && allProducts.length > 0 ? allProducts : products;
    return targetProducts.filter((p) => {
      const minAlert = p.minStockAlert ?? 5;
      return (p.stock ?? 0) <= minAlert;
    });
  };

  const getFastSellingRunningItems = () => {
    const itemSalesCount: Record<string, { name: string; qty: number; revenue: number }> = {};

    invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const pId = item.productId || item.productName;
        if (!itemSalesCount[pId]) {
          itemSalesCount[pId] = {
            name: item.nameUr || item.productName || item.nameEn,
            qty: 0,
            revenue: 0,
          };
        }
        itemSalesCount[pId].qty += item.quantity || 0;
        itemSalesCount[pId].revenue += item.total || 0;
      });
    });

    const sorted = Object.values(itemSalesCount).sort((a, b) => b.qty - a.qty);
    return sorted.slice(0, 8);
  };

  const getExpiryItems = () => {
    const targetProducts = allProducts && allProducts.length > 0 ? allProducts : products;
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);

    const expired: Product[] = [];
    const expiringSoon: { product: Product; daysLeft: number }[] = [];

    targetProducts.forEach((p) => {
      const expStr = (p as any).expiryDate || (p as any).expiry;
      if (expStr) {
        const expDate = new Date(expStr);
        if (!isNaN(expDate.getTime())) {
          if (expDate < now) {
            expired.push(p);
          } else if (expDate <= thirtyDaysLater) {
            const diffTime = Math.abs(expDate.getTime() - now.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            expiringSoon.push({ product: p, daysLeft: diffDays });
          }
        }
      }
    });

    return { expired, expiringSoon };
  };

  const getTotalValuation = () => {
    const targetProducts = allProducts && allProducts.length > 0 ? allProducts : products;
    const totalCost = targetProducts.reduce((sum, p) => sum + (p.costPrice || 0) * (p.stock || 0), 0);
    const totalSale = targetProducts.reduce((sum, p) => sum + (p.salePrice || 0) * (p.stock || 0), 0);
    return { totalCost, totalSale, totalItems: targetProducts.length };
  };

  // -------------------------------------------------------------
  // INTELLIGENT INTENT PROCESSOR
  // -------------------------------------------------------------
  const generateResponse = (query: string): ChatMessage => {
    const q = query.toLowerCase();
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // 1. SALES REPORT (سیل، آج کی رپورٹ، منافع)
    if (
      q.includes('سیل') ||
      q.includes('sale') ||
      q.includes('رپورٹ') ||
      q.includes('report') ||
      q.includes('نفع') ||
      q.includes('profit') ||
      q.includes('کیش') ||
      q.includes('cash')
    ) {
      const m = getTodaySalesMetrics();
      return {
        id: Date.now().toString(),
        sender: 'assistant',
        timestamp: time,
        text: `📊 **آج کی مکمل سیل و مالی رپورٹ:**\n\n• کل سیل: **${m.totalSales.toLocaleString()} روپے**\n• نقد وصولی: **${m.cashReceived.toLocaleString()} روپے**\n• ادھار سیل: **${m.creditSales.toLocaleString()} روپے**\n• کل منافع (Profit): **${m.totalProfit.toLocaleString()} روپے**\n• آج کے اخراجات: **${m.todayExpenses.toLocaleString()} روپے**\n• نقد دراز (Cash in Hand): **${m.netInHand.toLocaleString()} روپے**\n• کاٹے گئے بلوں کی تعداد: **${m.invoiceCount} بل**`,
        cards: {
          title: "آج کے اہم اعداد و شمار",
          items: [
            { label: 'کل فروخت (Total Sale)', value: `${m.totalSales.toLocaleString()} روپے`, badge: 'Today', badgeColor: 'bg-emerald-500' },
            { label: 'خالص منافع (Net Profit)', value: `${m.totalProfit.toLocaleString()} روپے`, badge: 'Profit', badgeColor: 'bg-cyan-500' },
            { label: 'نقد وصولی (Cash Paid)', value: `${m.cashReceived.toLocaleString()} روپے` },
            { label: 'روزنامچہ اخراجات (Expenses)', value: `${m.todayExpenses.toLocaleString()} روپے` },
          ],
        },
      };
    }

    // 2. LOW STOCK / SHORTAGE (کم اسٹاک، ختم مال)
    if (
      q.includes('اسٹاک') ||
      q.includes('stock') ||
      q.includes('کم') ||
      q.includes('short') ||
      q.includes('ختم')
    ) {
      const lowItems = getLowStockItems();
      if (lowItems.length === 0) {
        return {
          id: Date.now().toString(),
          sender: 'assistant',
          timestamp: time,
          text: `✅ **تمام اسٹاک تسلی بخش ہے!**\nکوئی بھی پروڈکٹ اس وقت خطرے کی حد یا کم اسٹاک میں نہیں ہے۔`,
        };
      }

      const listStr = lowItems
        .slice(0, 8)
        .map(
          (p, idx) =>
            `${idx + 1}. **${p.nameUr || p.nameEn}** - موجودہ اسٹاک: **${p.stock} ${p.unit}** (الرٹ حد: ${p.minStockAlert ?? 5})`
        )
        .join('\n');

      return {
        id: Date.now().toString(),
        sender: 'assistant',
        timestamp: time,
        text: `⚠️ **کم اسٹاک اور ختم ہونے والے آئٹمز کی فہرست (${lowItems.length} آئٹمز):**\n\n${listStr}\n\n💡 *مشورہ: ان آئٹمز کا فورا نیا آرڈر (GRN) وینڈرز کو بھیجیں تاکہ سیل متاثر نہ ہو۔*`,
        cards: {
          title: 'فوری توجہ طلب آئٹمز',
          items: lowItems.slice(0, 5).map((p) => ({
            label: p.nameUr || p.nameEn,
            value: `${p.stock} ${p.unit}`,
            badge: p.stock <= 0 ? 'Out of Stock' : 'Low Stock',
            badgeColor: p.stock <= 0 ? 'bg-rose-500' : 'bg-amber-500',
          })),
        },
      };
    }

    // 3. FAST SELLING / RUNNING ITEMS (رننگ آئٹمز، زیادہ بکنے والا مال)
    if (
      q.includes('رننگ') ||
      q.includes('running') ||
      q.includes('زیادہ') ||
      q.includes('fast') ||
      q.includes('top')
    ) {
      const topItems = getFastSellingRunningItems();
      if (topItems.length === 0) {
        return {
          id: Date.now().toString(),
          sender: 'assistant',
          timestamp: time,
          text: `ℹ️ ابھی تک کوئی بل یا سیلز ریکارڈ موجود نہیں ہے، جیسے ہی بل بنیں گے ٹاپ رننگ آئٹمز خودکار طور پر یہاں ظاہر ہو جائیں گے۔`,
        };
      }

      const listStr = topItems
        .map(
          (item, idx) =>
            `${idx + 1}. **${item.name}**\n   • فروخت شدہ تعداد: **${item.qty}** | کل رقم: **${item.revenue.toLocaleString()} روپے**`
        )
        .join('\n\n');

      return {
        id: Date.now().toString(),
        sender: 'assistant',
        timestamp: time,
        text: `🚀 **سب سے زیادہ بکنے والے (Top Running) آئٹمز کی فہرست:**\n\n${listStr}`,
        cards: {
          title: 'ٹاپ 4 فاسٹ رننگ اشیاء',
          items: topItems.slice(0, 4).map((it) => ({
            label: it.name,
            value: `${it.qty} عدد فروخت`,
            badge: `${it.revenue.toLocaleString()} روپے`,
            badgeColor: 'bg-emerald-600',
          })),
        },
      };
    }

    // 4. EXPIRY (ایکسپائری، ایکسپائرڈ، تاریخ ختم)
    if (
      q.includes('ایکسپائر') ||
      q.includes('expiry') ||
      q.includes('expire') ||
      q.includes('تاریخ')
    ) {
      const { expired, expiringSoon } = getExpiryItems();

      if (expired.length === 0 && expiringSoon.length === 0) {
        return {
          id: Date.now().toString(),
          sender: 'assistant',
          timestamp: time,
          text: `🛡️ **ماشاءاللہ! کوئی بھی آئٹم ایکسپائر نہیں ہے!**\nاگلے 30 دنوں میں بھی کسی پروڈکٹ کی میعاد ختم ہونے کا خطرہ نہیں ہے۔ آپ کا اسٹاک مکمل طور پر محفوظ ہے۔`,
        };
      }

      let resp = `⏳ **ایکسپائری رپورٹ:**\n\n`;
      if (expired.length > 0) {
        resp += `❌ **میعاد ختم شدہ (${expired.length} آئٹمز):**\n` +
          expired.slice(0, 5).map((p) => `• ${p.nameUr || p.nameEn}`).join('\n') +
          `\n\n`;
      }

      if (expiringSoon.length > 0) {
        resp += `⚠️ **اگلے 30 دنوں میں ایکسپائر ہونے والے (${expiringSoon.length} آئٹمز):**\n` +
          expiringSoon.slice(0, 5).map((e) => `• ${e.product.nameUr || e.product.nameEn} (${e.daysLeft} دن باقی)`).join('\n');
      }

      return {
        id: Date.now().toString(),
        sender: 'assistant',
        timestamp: time,
        text: resp,
        cards: {
          title: 'ایکسپائری کاؤنٹر',
          items: [
            { label: 'ایکسپائرڈ اشیاء', value: `${expired.length} آئٹمز`, badge: 'Action Required', badgeColor: 'bg-rose-600' },
            { label: 'قریب المیعاد اشیاء (30 دن)', value: `${expiringSoon.length} آئٹمز`, badge: 'Warning', badgeColor: 'bg-amber-500' },
          ],
        },
      };
    }

    // 5. KHATA / CUSTOMER CREDIT (ادھار، کھاتہ)
    if (q.includes('کھاتہ') || q.includes('ادھار') || q.includes('udhaar') || q.includes('khata')) {
      const totalKhata = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
      const topDebtors = [...customers].sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0)).slice(0, 5);

      return {
        id: Date.now().toString(),
        sender: 'assistant',
        timestamp: time,
        text: `👥 **کھاتہ و ادھار سمری:**\n\n• مارکیٹ میں کل ادھار بقایا جات: **${totalKhata.toLocaleString()} روپے**\n• کل کھاتہ دار گاہک: **${customers.length} افراد**`,
        cards: {
          title: 'ٹاپ ادھار دار گاہک',
          items: topDebtors.map((c) => ({
            label: c.name,
            value: `${(c.currentBalance || 0).toLocaleString()} روپے`,
            badge: c.phone || 'No Phone',
            badgeColor: 'bg-slate-700',
          })),
        },
      };
    }

    // 6. TOTAL VALUATION (مالیت، ٹوٹل انوینٹری)
    if (q.includes('مالیت') || q.includes('انوینٹری') || q.includes('valuation') || q.includes('total')) {
      const v = getTotalValuation();
      return {
        id: Date.now().toString(),
        sender: 'assistant',
        timestamp: time,
        text: `📦 **دکان کے کل مال کی موجودہ مالیت:**\n\n• کل پروڈکٹس: **${v.totalItems} اقسام**\n• خریدارانہ قیمت (Cost Value): **${v.totalCost.toLocaleString()} روپے**\n• متوقع سیل ویلیو (Sale Value): **${v.totalSale.toLocaleString()} روپے**\n• متوقع مجموعی منافع: **${(v.totalSale - v.totalCost).toLocaleString()} روپے**`,
      };
    }

    // DEFAULT SMART FALLBACK WITH HELPFUL PROMPTS
    return {
      id: Date.now().toString(),
      sender: 'assistant',
      timestamp: time,
      text: `محترم، آپ کی دکان کے تمام ریکارڈز میرے پاس موجود ہیں۔ آپ مجھ سے درج ذیل سوالات پوچھ سکتے ہیں:\n\n1. "آج کی سیل کی رپورٹ دو"\n2. "کون سا اسٹاک کم ہے؟"\n3. "زیادہ بکنے والے (رننگ) آئٹمز کون سے ہیں؟"\n4. "ایکسپائری کا کیا اسٹیٹس ہے؟"\n5. "کل ادھار یا دکان کی مالیت کتنی ہے؟"`,
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate smart thinking delay for realism
    setTimeout(() => {
      const response = generateResponse(text);
      setMessages((prev) => [...prev, response]);
      setIsLoading(false);
    }, 450);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPills = [
    { label: '📊 آج کی سیل رپورٹ', query: 'آج کی سیل کی مکمل رپورٹ دیں' },
    { label: '⚠️ کم اسٹاک (Shortage)', query: 'کون سا اسٹاک کم ہے یا ختم ہونے والا ہے؟' },
    { label: '🚀 رننگ آئٹمز (Fast Selling)', query: 'سب سے زیادہ بکنے والے رننگ آئٹمز بتائیں' },
    { label: '⏳ ایکسپائری رپورٹ', query: 'کیا کوئی چیز ایکسپائر ہو رہی ہے؟' },
    { label: '💰 آج کا منافع (Profit)', query: 'آج کی کل فروخت اور نفع کتنا ہے؟' },
    { label: '👥 کھاتہ / ادھار سمری', query: 'کل ادھار اور کھاتہ کتنا ہے؟' },
  ];

  return (
    <div
      dir="rtl"
      className={`flex flex-col bg-slate-900 text-slate-100 rounded-3xl overflow-hidden border border-cyan-500/30 shadow-2xl ${
        isModal ? 'h-[85vh] w-full max-w-3xl mx-auto' : 'h-[calc(100vh-140px)] w-full'
      }`}
    >
      {/* ------------------------------------------------------------- */}
      {/* CHATBOARD HEADER BAR                                          */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 bg-gradient-to-r from-[#0d222e] via-[#091b24] to-[#07131b] border-b border-cyan-500/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20 border border-cyan-300/40">
            <Bot className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white font-mono tracking-wide">
                OneShop AI Assistant
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                لائیو رپورٹنگ چیٹ بورڈ
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              سیل، اسٹاک، ایکسپائری اور رننگ آئٹمز کا سمارٹ تجزیہ کار
            </p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* QUICK SUGGESTION PILLS                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/60 overflow-x-auto flex items-center gap-2 no-scrollbar shrink-0">
        <span className="text-[11px] text-slate-400 font-bold shrink-0 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          فوری رپورٹس:
        </span>
        {quickPills.map((pill, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(pill.query)}
            className="px-3 py-1 rounded-xl text-xs font-bold bg-[#142936] hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 whitespace-nowrap transition-all shadow-sm active:scale-95"
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CHAT MESSAGES SCROLL AREA                                     */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-start' : 'items-end'
            } animate-in fade-in duration-200`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-md text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-br-none text-right'
                  : 'bg-[#122834] text-slate-100 border border-cyan-500/20 rounded-bl-none text-right'
              }`}
            >
              {/* Message Content */}
              <div className="whitespace-pre-wrap font-sans space-y-1">
                {msg.text}
              </div>

              {/* Optional Structured Data Card */}
              {msg.cards && (
                <div className="mt-3 pt-3 border-t border-cyan-500/20 bg-slate-950/40 rounded-xl p-3 space-y-2">
                  <div className="text-[11px] font-black text-cyan-300 font-mono tracking-wide">
                    {msg.cards.title}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {msg.cards.items.map((item, i) => (
                      <div
                        key={i}
                        className="bg-[#163140] p-2 rounded-lg border border-slate-700/60 flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-300 font-medium">{item.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white font-mono">{item.value}</span>
                          {item.badge && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded text-white font-bold ${
                                item.badgeColor || 'bg-cyan-600'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamp & Copy Action */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1 border-t border-white/10 font-mono">
                <span>{msg.timestamp}</span>
                {msg.sender === 'assistant' && (
                  <button
                    onClick={() => copyToClipboard(msg.text, msg.id)}
                    className="hover:text-cyan-300 flex items-center gap-1 transition"
                    title="کاپی کریں"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">کاپی ہو گیا</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>کاپی</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-end justify-start gap-2">
            <div className="bg-[#122834] border border-cyan-500/20 rounded-2xl rounded-bl-none p-3 shadow-md flex items-center gap-2 text-xs text-cyan-300">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>رپورٹ تیار کی جا رہی ہے...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* INPUT MESSAGE FORM                                            */}
      {/* ------------------------------------------------------------- */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-gradient-to-r from-[#0d222e] via-[#091b24] to-[#07131b] border-t border-cyan-500/20 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="رپورٹ یا سوال یہاں لکھیں (مثلاً: آج کی سیل کیسی ہے؟ کون سا اسٹاک کم ہے؟)"
          className="flex-1 px-4 py-3 rounded-2xl bg-[#142834] border border-slate-700 text-white placeholder-slate-400 text-xs sm:text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/25 active:scale-95 transition-all shrink-0"
        >
          <Send className="w-4 h-4 rotate-180" />
          <span>پوچھیں</span>
        </button>
      </form>
    </div>
  );
};
