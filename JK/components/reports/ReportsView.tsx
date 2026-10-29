'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Printer,
  Calendar,
  AlertOctagon,
  Award,
  Users,
  PieChart,
  FileSpreadsheet,
  Truck,
  RotateCcw,
  Tag,
  Percent,
  CheckCircle2,
  Package,
  Monitor,
  Eye,
  X,
  MessageSquare,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';

export const ReportsView: React.FC = () => {
  const { lang, t } = useLanguage();
  const {
    invoices,
    roznamcha,
    customers,
    products,
    grnList,
    saleReturns,
    vendors,
    businessProfile,
    cashierAccounts,
    pendingWhatsAppOrdersCount,
    setIsWhatsAppOrdersModalOpen,
    whatsappOrders,
  } = useShop();

  // Period filter: Daily, Weekly, Monthly, Yearly, All
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'>('daily');
  // Report Tab
  const [activeReportTab, setActiveReportTab] = useState<
    'counters' | 'sales' | 'purchases' | 'discounts' | 'returns' | 'analytics'
  >('counters');

  const [selectedCounterForBills, setSelectedCounterForBills] = useState<any | null>(null);
  const [selectedCounterForZReport, setSelectedCounterForZReport] = useState<any | null>(null);

  // Filter items by period
  const filterByDate = (dateStr: string) => {
    if (period === 'all') return true;
    const d = new Date(dateStr);
    const now = new Date();

    if (period === 'daily') {
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }
    if (period === 'weekly') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= oneWeekAgo;
    }
    if (period === 'monthly') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (period === 'yearly') {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const periodInvoices = useMemo(() => invoices.filter((i) => filterByDate(i.date)), [invoices, period]);
  const periodGRNs = useMemo(() => grnList.filter((g) => filterByDate(g.date)), [grnList, period]);
  const periodReturns = useMemo(() => saleReturns.filter((r) => filterByDate(r.date)), [saleReturns, period]);
  const periodRoznamcha = useMemo(() => roznamcha.filter((r) => filterByDate(r.date)), [roznamcha, period]);

  // Compute analytics
  const analytics = useMemo(() => {
    let totalSales = 0;
    let totalCost = 0;
    let totalGrossProfit = 0;
    let totalDiscounts = 0;

    const productSalesMap: Record<string, { nameEn: string; nameUr: string; qty: number; revenue: number }> = {};

    periodInvoices.forEach((inv) => {
      totalSales += inv.grandTotal;
      totalDiscounts += inv.discount;

      inv.items.forEach((item) => {
        const itemCost = item.costPrice * item.quantity;
        totalCost += itemCost;
        totalGrossProfit += item.profit;

        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = {
            nameEn: item.nameEn,
            nameUr: item.nameUr,
            qty: 0,
            revenue: 0,
          };
        }
        productSalesMap[item.productId].qty += item.quantity;
        productSalesMap[item.productId].revenue += item.total;
      });
    });

    // Purchases & GRNs
    const totalPurchases = periodGRNs.reduce((s, g) => s + g.grandTotal, 0);
    const totalPurchasesPaid = periodGRNs.reduce((s, g) => s + g.paidAmount, 0);

    // Returns
    const totalReturnsRefunded = periodReturns.reduce((s, r) => s + r.totalRefund, 0);

    // Expenses
    const totalExpenses = periodRoznamcha
      .filter((r) => !r.isCashIn)
      .reduce((sum, r) => sum + r.amount, 0);

    const netProfit = totalGrossProfit - totalExpenses;

    // Top Selling Products
    const topProducts = Object.values(productSalesMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

    // Dead Stock
    const deadStock = products.filter((p) => !productSalesMap[p.id]).slice(0, 6);

    // Debtor Ranking
    const topDebtors = [...customers]
      .filter((c) => c.currentBalance > 0)
      .sort((a, b) => b.currentBalance - a.currentBalance)
      .slice(0, 5);

    const totalReceivables = customers.reduce((sum, c) => sum + c.currentBalance, 0);
    const totalPayables = vendors.reduce((sum, v) => sum + v.balance, 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + p.costPrice * p.stock, 0);

    return {
      totalSales,
      totalCost,
      totalGrossProfit,
      totalDiscounts,
      totalPurchases,
      totalPurchasesPaid,
      totalReturnsRefunded,
      totalExpenses,
      netProfit,
      topProducts,
      deadStock,
      topDebtors,
      totalReceivables,
      totalPayables,
      totalInventoryValue,
    };
  }, [periodInvoices, periodGRNs, periodReturns, periodRoznamcha, products, customers, vendors]);

  // Compute 10 Counters Sales & Cash reconciliation
  const counterSummaries = useMemo(() => {
    return cashierAccounts.map((account) => {
      const counterNum = account.counterNumber;
      const counterInvoices = periodInvoices.filter(
        (inv) =>
          inv.counterNumber === counterNum ||
          (inv.counterNumber === undefined && inv.cashier.includes(`کاؤنٹر ${counterNum}`))
      );
      const counterReturnsList = periodReturns.filter(
        (ret) =>
          ret.counterNumber === counterNum ||
          (ret.counterNumber === undefined && ret.cashier.includes(`کاؤنٹر ${counterNum}`))
      );

      const totalSales = counterInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
      const totalCash = counterInvoices
        .filter((inv) => inv.paymentMethod === 'CASH')
        .reduce((sum, inv) => sum + inv.paidAmount, 0);
      const totalOnline = counterInvoices
        .filter((inv) => inv.paymentMethod === 'ONLINE')
        .reduce((sum, inv) => sum + inv.paidAmount, 0);
      const totalCredit = counterInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
      const totalDiscount = counterInvoices.reduce((sum, inv) => sum + inv.discount, 0);
      const totalRefunds = counterReturnsList.reduce((sum, ret) => sum + ret.totalRefund, 0);
      const netCashInDrawer = totalCash - totalRefunds;

      return {
        counterNumber: counterNum,
        cashierName: account.name,
        status: account.status,
        phone: account.phone,
        invoicesCount: counterInvoices.length,
        returnsCount: counterReturnsList.length,
        totalSales,
        totalCash,
        totalOnline,
        totalCredit,
        totalDiscount,
        totalRefunds,
        netCashInDrawer,
        invoices: counterInvoices,
      };
    });
  }, [cashierAccounts, periodInvoices, periodReturns]);

  // Overall counters total metrics
  const totalCounterSales = useMemo(
    () => counterSummaries.reduce((sum, c) => sum + c.totalSales, 0),
    [counterSummaries]
  );
  const totalCounterCashInDrawer = useMemo(
    () => counterSummaries.reduce((sum, c) => sum + c.netCashInDrawer, 0),
    [counterSummaries]
  );
  const totalCounterInvoices = useMemo(
    () => counterSummaries.reduce((sum, c) => sum + c.invoicesCount, 0),
    [counterSummaries]
  );

  // Export to CSV
  const handleExportCSV = () => {
    let csv = 'Type,Reference,Customer/Vendor,Amount,Date\n';
    if (activeReportTab === 'sales' || activeReportTab === 'analytics') {
      periodInvoices.forEach((inv) => {
        csv += `Sale,Invoice #${inv.invoiceNo},${inv.customerName},${inv.grandTotal},${inv.date}\n`;
      });
    }
    if (activeReportTab === 'purchases') {
      periodGRNs.forEach((grn) => {
        csv += `Purchase,GRN #${grn.grnNo},${grn.vendorName},${grn.grandTotal},${grn.date}\n`;
      });
    }
    if (activeReportTab === 'returns') {
      periodReturns.forEach((ret) => {
        csv += `Return,Return #${ret.returnNo},${ret.customerName},${ret.totalRefund},${ret.date}\n`;
      });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JK_${activeReportTab}_report_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                {lang === 'ur'
                  ? 'جامع کاروباری رپورٹس اور اینالسٹکس'
                  : 'Comprehensive ERP Reports & Analytics'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'ur'
                  ? 'فروخت، خریداری (GRN)، رعایت، مال واپسی اور منافع کے یومیہ، ہفتہ وار، ماہانہ اور سالانہ اعدادوشمار'
                  : 'Daily, weekly, monthly & yearly breakdown of sales, purchases, discounts, returns & net profit'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 no-print">
          {/* Period Selector */}
          <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'daily'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'ur' ? 'یومیہ' : 'Daily'}
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'weekly'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'ur' ? 'ہفتہ وار' : 'Weekly'}
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'monthly'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'ur' ? 'ماہانہ' : 'Monthly'}
            </button>
            <button
              onClick={() => setPeriod('yearly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'yearly'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'ur' ? 'سالانہ' : 'Yearly'}
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'all'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'ur' ? 'مکمل' : 'All'}
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Live WhatsApp Orders Pending Alert Banner */}
      {pendingWhatsAppOrdersCount > 0 && (
        <div
          onClick={() => setIsWhatsAppOrdersModalOpen(true)}
          className="no-print cursor-pointer hover:bg-emerald-500/20 active:scale-[0.99] transition-all bg-emerald-500/10 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-2xl flex items-center justify-between shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="font-bold text-sm">
                  {lang === 'ur'
                    ? `واٹس ایپ پر ${pendingWhatsAppOrdersCount} نئے آرڈرز موصول ہوئے ہیں (پینڈنگ)!`
                    : `${pendingWhatsAppOrdersCount} New WhatsApp Orders Received (Pending)!`}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'ur'
                    ? 'پینڈنگ آرڈرز کی تفصیل دیکھنے اور 1-کلک سے بل بنانے کے لیے یہاں کلک کریں۔'
                    : 'Click here to view pending orders and convert to bill with one click.'}
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsWhatsAppOrdersModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow cursor-pointer active:scale-95 transition-all"
          >
            {pendingWhatsAppOrdersCount} {lang === 'ur' ? 'پینڈنگ آرڈرز کھولیں' : 'Open Pending Orders'}
          </button>
        </div>
      )}

      {/* Top 4 KPI Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
        {/* Total Sales */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">{lang === 'ur' ? 'مجموعی فروخت (Sales)' : 'Total Revenue'}</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl md:text-2xl font-black font-mono text-slate-900 dark:text-white">
            Rs. {analytics.totalSales.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
            {periodInvoices.length} {lang === 'ur' ? 'کاؤنٹر بلز' : 'Invoices'}
          </span>
        </div>

        {/* Total Purchases (GRN) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">{lang === 'ur' ? 'خریداری (GRN)' : 'Total Purchases'}</span>
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl md:text-2xl font-black font-mono text-blue-600">
            Rs. {analytics.totalPurchases.toLocaleString()}
          </p>
          <span className="text-[10px] text-blue-500 font-bold mt-1 block">
            {periodGRNs.length} {lang === 'ur' ? 'مال وصولی رسیدیں' : 'GRNs'}
          </span>
        </div>

        {/* Total Discounts */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">{lang === 'ur' ? 'دی گئی رعایت (Discount)' : 'Discounts Given'}</span>
            <Tag className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl md:text-2xl font-black font-mono text-amber-600">
            Rs. {analytics.totalDiscounts.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 font-bold mt-1 block">
            {lang === 'ur' ? 'روپے میں رعایت' : 'Flat PKR Discount'}
          </span>
        </div>

        {/* Net Profit */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">{lang === 'ur' ? 'خالص منافع (Net Profit)' : 'Net Profit'}</span>
            <DollarSign className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl md:text-2xl font-black font-mono text-purple-600">
            Rs. {analytics.netProfit.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 font-bold mt-1 block">
            {lang === 'ur' ? 'اخراجات منہا کرنے کے بعد' : 'After Deducting Expenses'}
          </span>
        </div>
      </div>

      {/* Report Categories Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 no-print">
        <button
          onClick={() => setActiveReportTab('counters')}
          className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeReportTab === 'counters'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Monitor className="w-4 h-4 text-emerald-300" />
          <span>{lang === 'ur' ? '10 کاؤنٹرز کا حساب کتاب (Counter Z-Report)' : '10 Counters Reconciliation'}</span>
        </button>

        <button
          onClick={() => setActiveReportTab('sales')}
          className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeReportTab === 'sales'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{lang === 'ur' ? 'سیل رپورٹ (Sales Report)' : 'Sales Report'}</span>
        </button>

        <button
          onClick={() => setActiveReportTab('purchases')}
          className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeReportTab === 'purchases'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>{lang === 'ur' ? 'خریداری رپورٹ (GRN Purchases)' : 'Purchases & GRN'}</span>
        </button>

        <button
          onClick={() => setActiveReportTab('discounts')}
          className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeReportTab === 'discounts'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>{lang === 'ur' ? 'ڈسکاؤنٹ رپورٹ (Discounts)' : 'Discounts Report'}</span>
        </button>

        <button
          onClick={() => setActiveReportTab('returns')}
          className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeReportTab === 'returns'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>{lang === 'ur' ? 'رٹرن و ریفنڈ رپورٹ (Returns)' : 'Returns & Refunds'}</span>
        </button>

        <button
          onClick={() => setActiveReportTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeReportTab === 'analytics'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>{lang === 'ur' ? 'اینالسٹکس و بصیرت (Analytics)' : 'Analytics & Insights'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB CONTENT 0: 10 COUNTERS RECONCILIATION                                 */}
      {/* ========================================================================= */}
      {activeReportTab === 'counters' && (
        <div className="space-y-6">
          {/* Top Counter Summary Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Monitor className="w-6 h-6" />
                </span>
                <div>
                  <h2 className="text-lg font-black tracking-tight">
                    {lang === 'ur' ? 'کاؤنٹر نمبر کے حساب سے الگ الگ حساب کتاب' : 'Counter-wise Daily Reconciliation'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {lang === 'ur'
                      ? 'مینجر لاگ ان میں تمام 10 کاؤنٹرز کی دراز میں موجود نقد رقم، آن لائن، ادھار اور بلز کا الگ الگ حساب'
                      : 'Audit drawer cash, sales, and shift balance individually for Counter #1 through #10'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                <span className="text-[10px] text-slate-400 block font-bold">
                  {lang === 'ur' ? 'کل کاؤنٹرز کی سیل' : 'Total Sales'}
                </span>
                <span className="text-sm font-black font-mono text-emerald-400">
                  Rs. {totalCounterSales.toLocaleString()}
                </span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-700 text-center">
                <span className="text-[10px] text-emerald-300 block font-bold">
                  {lang === 'ur' ? 'درازوں سے وصول شدہ کل کیش' : 'Total Drawer Cash'}
                </span>
                <span className="text-base font-black font-mono text-emerald-400">
                  Rs. {totalCounterCashInDrawer.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 10 Counters Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {counterSummaries.slice(0, 10).map((c) => (
              <div
                key={c.counterNumber}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm space-y-3 transition-all ${
                  c.invoicesCount > 0
                    ? 'border-emerald-500/50 dark:border-emerald-500/40 shadow-emerald-950/10'
                    : 'border-slate-200 dark:border-slate-800 opacity-80'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-mono font-black text-xs flex items-center justify-center shadow-sm">
                      #{c.counterNumber}
                    </span>
                    <span className="font-bold text-xs truncate max-w-[110px]" title={c.cashierName}>
                      {c.cashierName.replace(/کاؤنٹر\s*\d+\s*\(/g, '').replace(')', '')}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      c.status === 'ACTIVE'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {c.status === 'ACTIVE' ? 'فعال' : 'بند'}
                  </span>
                </div>

                {/* Counter Metrics */}
                <div className="space-y-1.5 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-slate-500">
                    <span>بلز کی تعداد:</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {c.invoicesCount}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>کل سیل:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      Rs. {c.totalSales.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>نقد وصولی:</span>
                    <span className="font-mono text-emerald-600 font-bold">
                      Rs. {c.totalCash.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>آن لائن ادائیگی:</span>
                    <span className="font-mono text-blue-500 font-bold">
                      Rs. {c.totalOnline.toLocaleString()}
                    </span>
                  </div>
                  {c.totalCredit > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>ادھار سیل:</span>
                      <span className="font-mono text-amber-500 font-bold">
                        Rs. {c.totalCredit.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {c.totalRefunds > 0 && (
                    <div className="flex justify-between text-rose-500">
                      <span>سیل واپسی:</span>
                      <span className="font-mono font-bold">
                        -Rs. {c.totalRefunds.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Net Drawer Balance Box */}
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block">
                    {lang === 'ur' ? 'دراز میں نقد بیلنس (وصول کریں):' : 'Net Cash in Drawer:'}
                  </span>
                  <span className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-400 block mt-0.5">
                    Rs. {c.netCashInDrawer.toLocaleString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => setSelectedCounterForBills(c)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
                  >
                    <Eye className="w-3 h-3" />
                    <span>بلز</span>
                  </button>
                  <button
                    onClick={() => setSelectedCounterForZReport(c)}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-sm transition-all"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Z-سلپ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Full Detailed Comparison Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Monitor className="w-4 h-4 text-emerald-500" />
                <span>{lang === 'ur' ? 'تمام 10 کاؤنٹرز کا موازنہ و حساب کتاب (10 Counters Breakdown)' : '10 Counters Audit Table'}</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                کل ٹرانزیکشنز: {totalCounterInvoices}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-850 font-bold border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-3 text-center">کاؤنٹر #</th>
                    <th className="p-3">کیشیئر کا نام</th>
                    <th className="p-3 text-center">اسٹیٹس</th>
                    <th className="p-3 text-center">بلز کی تعداد</th>
                    <th className="p-3">کل سیل (PKR)</th>
                    <th className="p-3">نقد وصولی</th>
                    <th className="p-3">آن لائن</th>
                    <th className="p-3">ادھار</th>
                    <th className="p-3">سیل واپسی</th>
                    <th className="p-3 font-black text-emerald-600">دراز میں کیش رقم</th>
                    <th className="p-3 text-center no-print">ایکشن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {counterSummaries.slice(0, 10).map((c) => (
                    <tr key={c.counterNumber} className="hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors">
                      <td className="p-3 text-center font-mono font-bold text-emerald-600">
                        #{c.counterNumber}
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {c.cashierName}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {c.status === 'ACTIVE' ? 'فعال' : 'بند'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold">{c.invoicesCount}</td>
                      <td className="p-3 font-mono font-black text-slate-900 dark:text-white">
                        Rs. {c.totalSales.toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-emerald-600 font-bold">
                        Rs. {c.totalCash.toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-blue-500">
                        Rs. {c.totalOnline.toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-amber-500">
                        Rs. {c.totalCredit.toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-rose-500">
                        Rs. {c.totalRefunds.toLocaleString()}
                      </td>
                      <td className="p-3 font-mono font-black text-emerald-600 text-sm">
                        Rs. {c.netCashInDrawer.toLocaleString()}
                      </td>
                      <td className="p-3 text-center no-print">
                        <button
                          onClick={() => setSelectedCounterForZReport(c)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-600 text-white font-bold text-[11px] transition-all"
                        >
                          Z-رپورٹ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 1: SALES REPORT */}
      {activeReportTab === 'sales' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-sm">
              {lang === 'ur' ? 'فروخت کے بلز کی مکمل رپورٹ' : 'Sales Invoices Breakdown'} ({period.toUpperCase()})
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              کل فروخت: Rs. {analytics.totalSales.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="p-3 text-center">بل #</th>
                  <th className="p-3 text-right">تاریخ</th>
                  <th className="p-3 text-right">گاہک کا نام</th>
                  <th className="p-3 text-center">طریقہ ادائیگی</th>
                  <th className="p-3 text-left">سب ٹوٹل</th>
                  <th className="p-3 text-left">ڈسکاؤنٹ</th>
                  <th className="p-3 text-left">فائنل بل</th>
                  <th className="p-3 text-left">نفع (Profit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {periodInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="p-3 text-center font-mono font-bold text-emerald-600">
                      {inv.invoiceNo}
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {new Date(inv.date).toLocaleDateString('en-PK')}
                    </td>
                    <td className="p-3 font-medium">{inv.customerName}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 text-left font-mono">Rs. {inv.subtotal.toLocaleString()}</td>
                    <td className="p-3 text-left font-mono text-amber-600">
                      Rs. {inv.discount.toLocaleString()}
                    </td>
                    <td className="p-3 text-left font-mono font-bold text-slate-900 dark:text-white">
                      Rs. {inv.grandTotal.toLocaleString()}
                    </td>
                    <td className="p-3 text-left font-mono font-bold text-emerald-600">
                      Rs. {inv.totalProfit.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: PURCHASES / GRN REPORT */}
      {activeReportTab === 'purchases' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-sm">
              {lang === 'ur' ? 'خریداری و مال وصولی (GRN) رپورٹ' : 'GRN Purchases Report'} ({period.toUpperCase()})
            </h3>
            <span className="text-xs text-blue-500 font-mono font-bold">
              کل خریداری: Rs. {analytics.totalPurchases.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="p-3 text-center">GRN #</th>
                  <th className="p-3 text-right">تاریخ</th>
                  <th className="p-3 text-right">سپلائر کا نام</th>
                  <th className="p-3 text-center">بلٹی / انوائس #</th>
                  <th className="p-3 text-center">آئٹمز تعداد</th>
                  <th className="p-3 text-left">کل بل</th>
                  <th className="p-3 text-left">نقد ادا شدہ</th>
                  <th className="p-3 text-left">کھاتے میں بقایا</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {periodGRNs.map((grn) => (
                  <tr key={grn.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="p-3 text-center font-mono font-bold text-blue-600">
                      {grn.grnNo}
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {new Date(grn.date).toLocaleDateString('en-PK')}
                    </td>
                    <td className="p-3 font-medium">{grn.vendorName}</td>
                    <td className="p-3 text-center font-mono text-slate-500">
                      {grn.biltyNo || grn.invoiceNo || '—'}
                    </td>
                    <td className="p-3 text-center font-mono">{grn.items.length} items</td>
                    <td className="p-3 text-left font-mono font-bold text-slate-900 dark:text-white">
                      Rs. {grn.grandTotal.toLocaleString()}
                    </td>
                    <td className="p-3 text-left font-mono text-emerald-600">
                      Rs. {grn.paidAmount.toLocaleString()}
                    </td>
                    <td className="p-3 text-left font-mono text-amber-600 font-bold">
                      Rs. {grn.balanceAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: DISCOUNT REPORT */}
      {activeReportTab === 'discounts' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-sm">
              {lang === 'ur' ? 'گاہکوں کو دی گئی رعایت (Discounts) کی مکمل تفصیل' : 'Discount Audit Report'}
            </h3>
            <span className="text-xs text-amber-500 font-mono font-bold">
              کل ڈسکاؤنٹ: Rs. {analytics.totalDiscounts.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="p-3 text-center">بل #</th>
                  <th className="p-3 text-right">تاریخ</th>
                  <th className="p-3 text-right">گاہک کا نام</th>
                  <th className="p-3 text-left">اصلی سب ٹوٹل</th>
                  <th className="p-3 text-left">رعایت رقم (Discount PKR)</th>
                  <th className="p-3 text-left">وصول شدہ بل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {periodInvoices
                  .filter((inv) => inv.discount > 0)
                  .map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="p-3 text-center font-mono font-bold text-emerald-600">
                        {inv.invoiceNo}
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">
                        {new Date(inv.date).toLocaleDateString('en-PK')}
                      </td>
                      <td className="p-3 font-medium">{inv.customerName}</td>
                      <td className="p-3 text-left font-mono">Rs. {inv.subtotal.toLocaleString()}</td>
                      <td className="p-3 text-left font-mono font-bold text-rose-600">
                        Rs. {inv.discount.toLocaleString()}
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-emerald-600">
                        Rs. {inv.grandTotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: RETURNS & REFUNDS REPORT */}
      {activeReportTab === 'returns' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-sm">
              {lang === 'ur' ? 'مال واپسی اور ریفنڈ رپورٹ' : 'Sales Return & Refund Report'}
            </h3>
            <span className="text-xs text-rose-500 font-mono font-bold">
              کل ریفنڈ رقم: Rs. {analytics.totalReturnsRefunded.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="p-3 text-center">واپسی #</th>
                  <th className="p-3 text-center">اصلی بل #</th>
                  <th className="p-3 text-right">تاریخ</th>
                  <th className="p-3 text-right">گاہک کا نام</th>
                  <th className="p-3 text-right">وجہ واپسی</th>
                  <th className="p-3 text-center">طریقہ ریفنڈ</th>
                  <th className="p-3 text-left">ریفنڈ رقم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {periodReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="p-3 text-center font-mono font-bold text-rose-600">
                      {ret.returnNo}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-500">{ret.invoiceNo}</td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {new Date(ret.date).toLocaleDateString('en-PK')}
                    </td>
                    <td className="p-3 font-medium">{ret.customerName}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{ret.reason}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                        {ret.refundMethod === 'CASH' ? 'نقد کیش واپس' : 'کھاتے میں جمع'}
                      </span>
                    </td>
                    <td className="p-3 text-left font-mono font-bold text-rose-600">
                      Rs. {ret.totalRefund.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: ADVANCED ANALYTICS & INSIGHTS */}
      {activeReportTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Selling Products */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <Award className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {lang === 'ur' ? 'سب سے زیادہ بکنے والی اشیاء (Top Selling)' : 'Top Selling Products'}
              </h3>
            </div>
            <div className="space-y-3">
              {analytics.topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-medium">{lang === 'ur' ? p.nameUr : p.nameEn}</span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {p.qty} فروخت
                    </span>
                    <span className="text-slate-400 block text-[11px]">
                      Rs. {p.revenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Debtors */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <Users className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {lang === 'ur' ? 'سب سے زیادہ ادھار والے گاہک (Top Debtors)' : 'Top Debtors'}
              </h3>
            </div>
            <div className="space-y-3">
              {analytics.topDebtors.map((c, idx) => (
                <div key={c.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-medium block">{c.name}</span>
                      <span className="text-[10px] text-slate-400">{c.phone}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-amber-600">
                    Rs. {c.currentBalance.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Developer Branding Footer for Reports */}
      <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-mono">
        {businessProfile.softwareName || 'OneShop POS'} • JK Developers Pakistan
      </div>

      {/* MODAL 1: Counter Bills List */}
      {selectedCounterForBills && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl p-5 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setSelectedCounterForBills(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-mono font-black flex items-center justify-center">
                #{selectedCounterForBills.counterNumber}
              </span>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {lang === 'ur'
                    ? `کاؤنٹر #${selectedCounterForBills.counterNumber} کے تمام بلز (${selectedCounterForBills.cashierName})`
                    : `Invoices for Counter #${selectedCounterForBills.counterNumber}`}
                </h3>
                <p className="text-xs text-slate-500">
                  کل فروخت: Rs. {selectedCounterForBills.totalSales.toLocaleString()} | دراز کیش: Rs. {selectedCounterForBills.netCashInDrawer.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-3">
              {selectedCounterForBills.invoices.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  {lang === 'ur' ? 'اس مدت میں اس کاؤنٹر سے کوئی بل نہیں بنا۔' : 'No invoices generated for this counter.'}
                </div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 font-bold border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-2.5">بل نمبر</th>
                      <th className="p-2.5">وقت / تاریخ</th>
                      <th className="p-2.5">گاہک</th>
                      <th className="p-2.5 text-center">ادائیگی</th>
                      <th className="p-2.5">کل رقم</th>
                      <th className="p-2.5">نقد وصول</th>
                      <th className="p-2.5">بقایا</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedCounterForBills.invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                        <td className="p-2.5 font-mono font-bold text-emerald-600">
                          #{inv.invoiceNo}
                        </td>
                        <td className="p-2.5 text-slate-500">
                          {new Date(inv.date).toLocaleDateString()} {new Date(inv.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                          {inv.customerName}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {inv.paymentMethod}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-white">
                          Rs. {inv.grandTotal.toLocaleString()}
                        </td>
                        <td className="p-2.5 font-mono text-emerald-600 font-bold">
                          Rs. {inv.paidAmount.toLocaleString()}
                        </td>
                        <td className="p-2.5 font-mono text-rose-500">
                          {inv.balanceDue > 0 ? `Rs. ${inv.balanceDue.toLocaleString()}` : '0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedCounterForBills(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                بند کریں (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Counter Shift Handover & Z-Report Slip Modal */}
      {selectedCounterForZReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-4 shadow-2xl relative my-auto">
            <button
              onClick={() => setSelectedCounterForZReport(null)}
              className="no-print absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Top Modal Controls */}
            <div className="no-print pb-3 mb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                {lang === 'ur' ? 'کاؤنٹر شفٹ کلوزنگ Z-سلپ' : 'Counter Z-Report Slip'}
              </h3>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>پرنٹ سلپ</span>
              </button>
            </div>

            {/* Printable Thermal Z-Slip */}
            <div
              dir="ltr"
              id="printable-receipt"
              className="bg-white text-black p-3 font-mono text-[11px] leading-snug border border-gray-400 rounded shadow-inner"
            >
              {/* Slip Header */}
              <div className="text-center pb-2 border-b-2 border-black space-y-0.5">
                <div className="font-nastaliq text-[16px] font-bold" dir="rtl">
                  {businessProfile.nameUr}
                </div>
                <div className="text-[12px] font-black uppercase font-sans">
                  {businessProfile.nameEn}
                </div>
                <div className="text-[10px] font-bold text-gray-700">
                  {businessProfile.softwareName || 'OneShop POS'} • Shift Closing Z-Report
                </div>
                <div className="text-[9px] text-gray-600">
                  {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </div>
              </div>

              {/* Meta */}
              <div className="py-2 border-b border-dashed border-black text-[10px] space-y-1">
                <div className="flex justify-between font-black text-sm">
                  <span>COUNTER:</span>
                  <span>Counter #{selectedCounterForZReport.counterNumber}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>CASHIER:</span>
                  <span className="font-sans">{selectedCounterForZReport.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>PERIOD AUDIT:</span>
                  <span className="uppercase">{period}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>BILLS GENERATED:</span>
                  <span>{selectedCounterForZReport.invoicesCount} Invoices</span>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="py-2 border-b-2 border-black space-y-1 text-[11px]">
                <div className="flex justify-between font-bold">
                  <span>GROSS SALES:</span>
                  <span>Rs. {selectedCounterForZReport.totalSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Payments Received:</span>
                  <span>Rs. {selectedCounterForZReport.totalCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Online / Bank Received:</span>
                  <span>Rs. {selectedCounterForZReport.totalOnline.toLocaleString()}</span>
                </div>
                {selectedCounterForZReport.totalCredit > 0 && (
                  <div className="flex justify-between">
                    <span>Credit / Khata Sales:</span>
                    <span>Rs. {selectedCounterForZReport.totalCredit.toLocaleString()}</span>
                  </div>
                )}
                {selectedCounterForZReport.totalRefunds > 0 && (
                  <div className="flex justify-between text-black">
                    <span>Sale Returns Refunded:</span>
                    <span>- Rs. {selectedCounterForZReport.totalRefunds.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-[13px] font-black border-t-2 border-b-2 border-black py-1 my-1">
                  <span>NET CASH IN DRAWER:</span>
                  <span>Rs. {selectedCounterForZReport.netCashInDrawer.toLocaleString()}</span>
                </div>
              </div>

              {/* Cash Handover Notice & Signatures */}
              <div className="pt-2 text-[10px] space-y-3">
                <div className="text-center italic text-gray-700">
                  Please verify drawer cash and hand over exact cash to store manager.
                </div>

                <div className="pt-4 flex justify-between text-[10px] font-bold">
                  <div className="text-center">
                    <div className="w-24 border-b border-black mb-1"></div>
                    <span>Cashier Sign</span>
                  </div>
                  <div className="text-center">
                    <div className="w-24 border-b border-black mb-1"></div>
                    <span>Manager Sign</span>
                  </div>
                </div>

                <div className="text-center pt-2 text-[8px] font-sans font-bold tracking-widest uppercase border-t border-gray-300">
                  {businessProfile.softwareName || 'OneShop POS'} • JK Developers Pakistan
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
