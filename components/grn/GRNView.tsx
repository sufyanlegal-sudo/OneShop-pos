'use client';

import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  Calendar,
  Printer,
  FileText,
  CheckCircle2,
  Trash2,
  Package,
  Layers,
  Sparkles,
  X,
  Building,
  Boxes,
  PenTool,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { useLanguage } from '@/context/LanguageContext';
import { printElement } from '@/lib/printService';
import { GRN, GRNItem } from '@/types';

export const GRNView: React.FC = () => {
  const {
    grnList,
    createGRN,
    vendors,
    products,
    allProducts,
    saveProduct,
    businessProfile,
  } = useShop();
  const { lang } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('ALL');
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeGRNToPrint, setActiveGRNToPrint] = useState<GRN | null>(null);

  // New GRN form state
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [biltyNo, setBiltyNo] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [grnItems, setGrnItems] = useState<GRNItem[]>([]);
  const [extraExpenses, setExtraExpenses] = useState<number>(0);
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK' | 'CREDIT' | 'PARTIAL'>('CREDIT');
  const [notes, setNotes] = useState('');

  // Item selector mode: 'EXISTING' vs 'NEW'
  const [itemInputMode, setItemInputMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [productSearchInput, setProductSearchInput] = useState('');

  // Transaction type: 'RECEIVE' (مال وصولی) vs 'RETURN' (مال واپسی / ریٹرن کلیم)
  const [itemTxType, setItemTxType] = useState<'RECEIVE' | 'RETURN'>('RECEIVE');
  const [returnReasonPreset, setReturnReasonPreset] = useState<string>('لیکج (Leakage)');
  const [customReturnReason, setCustomReturnReason] = useState<string>('');

  // Item selector state for existing product
  const [chosenProductId, setChosenProductId] = useState('');
  const [chosenQty, setChosenQty] = useState<number>(1);
  const [chosenCost, setChosenCost] = useState<number>(0);
  const [chosenSale, setChosenSale] = useState<number>(0);

  // New Product direct entry state
  const [newProdNameUr, setNewProdNameUr] = useState('');
  const [newProdNameEn, setNewProdNameEn] = useState('');
  const [newProdCategoryUr, setNewProdCategoryUr] = useState('جنرل سٹور');
  const [newProdUnit, setNewProdUnit] = useState('عدد');
  const [newProdCost, setNewProdCost] = useState<number>(0);
  const [newProdSale, setNewProdSale] = useState<number>(0);
  const [newProdQty, setNewProdQty] = useState<number>(1);
  const [newProdBarcode, setNewProdBarcode] = useState('');

  // Filtered existing products by search
  const filteredExistingProducts = useMemo(() => {
    if (!productSearchInput.trim()) return allProducts;
    const q = productSearchInput.toLowerCase().trim();
    return allProducts.filter(
      (p) =>
        p.nameUr.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }, [allProducts, productSearchInput]);

  // When vendor selection changes, auto pick
  const selectedVendor = useMemo(() => {
    return vendors.find((v) => v.id === selectedVendorId);
  }, [vendors, selectedVendorId]);

  // Product selection handler
  const handleProductSelect = (prodId: string) => {
    setChosenProductId(prodId);
    const prod = allProducts.find((p) => p.id === prodId);
    if (prod) {
      setChosenCost(prod.costPrice);
      setChosenSale(prod.salePrice);
    }
  };

  // Add existing item to draft GRN (handles both Receive and Return)
  const handleAddItem = () => {
    if (!chosenProductId || chosenQty <= 0) return;
    const prod = allProducts.find((p) => p.id === chosenProductId);
    if (!prod) return;

    const isReturn = itemTxType === 'RETURN';
    const finalReason = isReturn
      ? (customReturnReason.trim() || returnReasonPreset || 'لیکج / ایکسپائری')
      : undefined;

    const totalCost = chosenQty * chosenCost;
    const newItem: GRNItem = {
      productId: prod.id,
      productName: prod.nameUr || prod.nameEn,
      quantity: chosenQty,
      unit: prod.unit,
      costPrice: chosenCost,
      salePrice: chosenSale || prod.salePrice,
      discount: 0,
      totalCost,
      isReturn,
      returnReason: finalReason,
    };

    setGrnItems([...grnItems, newItem]);
    setChosenProductId('');
    setChosenQty(1);
    setChosenCost(0);
    setChosenSale(0);
    setProductSearchInput('');
    setCustomReturnReason('');
  };

  // Add brand new custom product to inventory AND draft GRN
  const handleAddNewProductToGRN = () => {
    if (!newProdNameUr.trim()) {
      alert(lang === 'ur' ? 'پروڈکٹ کا نام درج کریں' : 'Please enter product name');
      return;
    }
    if (newProdCost <= 0) {
      alert(lang === 'ur' ? 'خرید ریٹ درست درج کریں' : 'Please enter valid cost price');
      return;
    }
    if (newProdQty <= 0) {
      alert(lang === 'ur' ? 'تعداد یا مقدار درج کریں' : 'Please enter valid quantity');
      return;
    }

    const finalSale = newProdSale > 0 ? newProdSale : Math.round(newProdCost * 1.25);
    const barcode = newProdBarcode.trim() || '896' + Math.floor(100000000 + Math.random() * 900000000).toString();

    // 1. Create and save new product in database with stock: 0 (GRN will increment stock when saved)
    const createdProd = saveProduct({
      nameUr: newProdNameUr.trim(),
      nameEn: newProdNameEn.trim() || newProdNameUr.trim(),
      categoryUr: newProdCategoryUr || 'جنرل سٹور',
      categoryEn: 'General',
      unit: newProdUnit,
      costPrice: newProdCost,
      salePrice: finalSale,
      stock: 0,
      minStockAlert: 5,
      barcode,
    });

    // 2. Add to GRN draft list (Received or Return)
    const isReturn = itemTxType === 'RETURN';
    const finalReason = isReturn
      ? (customReturnReason.trim() || returnReasonPreset || 'لیکج / ایکسپائری')
      : undefined;

    const totalCost = newProdQty * newProdCost;
    const newItem: GRNItem = {
      productId: createdProd.id,
      productName: createdProd.nameUr,
      quantity: newProdQty,
      unit: createdProd.unit,
      costPrice: newProdCost,
      salePrice: finalSale,
      discount: 0,
      totalCost,
      isReturn,
      returnReason: finalReason,
    };

    setGrnItems([...grnItems, newItem]);

    // Reset fields
    setNewProdNameUr('');
    setNewProdNameEn('');
    setNewProdCost(0);
    setNewProdSale(0);
    setNewProdQty(1);
    setNewProdBarcode('');
    setCustomReturnReason('');
    setItemInputMode('EXISTING');
  };

  const handleGenerateRandomBarcode = () => {
    setNewProdBarcode('896' + Math.floor(100000000 + Math.random() * 900000000).toString());
  };

  const handleRemoveItem = (index: number) => {
    setGrnItems(grnItems.filter((_, i) => i !== index));
  };

  // Calculations for current draft: Received vs Returned (Negative Deduction)
  const draftReceivedSubtotal = useMemo(() => {
    return grnItems
      .filter((item) => !item.isReturn)
      .reduce((sum, item) => sum + item.totalCost, 0);
  }, [grnItems]);

  const draftReturnTotal = useMemo(() => {
    return grnItems
      .filter((item) => item.isReturn)
      .reduce((sum, item) => sum + item.totalCost, 0);
  }, [grnItems]);

  const draftGrandTotal = useMemo(() => {
    return Math.max(
      0,
      draftReceivedSubtotal - draftReturnTotal - overallDiscount + Number(extraExpenses || 0)
    );
  }, [draftReceivedSubtotal, draftReturnTotal, overallDiscount, extraExpenses]);

  // Handle Save GRN
  const handleSaveGRN = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId) {
      alert(lang === 'ur' ? 'برائے مہربانی سپلائر کا انتخاب کریں' : 'Please select a vendor');
      return;
    }
    if (grnItems.length === 0) {
      alert(lang === 'ur' ? 'کم از کم ایک پروڈکٹ شامل کریں' : 'Please add at least one item');
      return;
    }

    const vendor = vendors.find((v) => v.id === selectedVendorId);
    const balanceAmount = Math.max(0, draftGrandTotal - paidAmount);

    const newGRN = createGRN({
      date: new Date().toISOString(),
      vendorId: selectedVendorId,
      vendorName: vendor ? vendor.companyName || vendor.name : 'سپلائر',
      biltyNo,
      invoiceNo,
      items: grnItems,
      subtotal: draftReceivedSubtotal,
      returnTotal: draftReturnTotal,
      discount: overallDiscount,
      extraExpenses,
      grandTotal: draftGrandTotal,
      paidAmount,
      balanceAmount,
      paymentMethod,
      notes,
      receivedBy: 'ایڈمن (Admin)',
    });

    // Reset Form
    setShowNewModal(false);
    setSelectedVendorId('');
    setBiltyNo('');
    setInvoiceNo('');
    setGrnItems([]);
    setExtraExpenses(0);
    setOverallDiscount(0);
    setPaidAmount(0);
    setPaymentMethod('CREDIT');
    setNotes('');

    // Open print view for the new GRN
    setActiveGRNToPrint(newGRN);
  };

  // Filter GRN list
  const filteredGRNs = useMemo(() => {
    return grnList.filter((grn) => {
      const matchVendor = selectedVendorFilter === 'ALL' || grn.vendorId === selectedVendorFilter;
      const matchSearch =
        !searchQuery ||
        grn.grnNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grn.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (grn.biltyNo && grn.biltyNo.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchVendor && matchSearch;
    });
  }, [grnList, selectedVendorFilter, searchQuery]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                {lang === 'ur'
                  ? 'مال وصولی و خریداری (GRN - Goods Received Note)'
                  : 'Goods Received Notes (GRN Purchases)'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'ur'
                  ? 'وینڈرز سے آنے والے مال کی وصولی، اسٹاک میں خودکار اضافہ اور سپلائر کھاتہ'
                  : 'Receive stock from suppliers, update purchase cost & automatically adjust vendor khata'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'ur' ? 'نیا مال وصولی اندراج (New GRN)' : 'Create New GRN'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500">{lang === 'ur' ? 'کل خریداری رسیدیں' : 'Total GRNs'}</p>
          <p className="text-xl font-black mt-1 text-slate-900 dark:text-white">{grnList.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500">{lang === 'ur' ? 'کل خریداری رقم' : 'Total Purchases'}</p>
          <p className="text-xl font-black mt-1 text-emerald-600">
            Rs. {grnList.reduce((s, g) => s + g.grandTotal, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500">{lang === 'ur' ? 'ادا شدہ نقد رقم' : 'Paid Amount'}</p>
          <p className="text-xl font-black mt-1 text-blue-600">
            Rs. {grnList.reduce((s, g) => s + g.paidAmount, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500">{lang === 'ur' ? 'بقایا واجب الادا' : 'Balance Payable'}</p>
          <p className="text-xl font-black mt-1 text-amber-600">
            Rs. {grnList.reduce((s, g) => s + g.balanceAmount, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ur' ? 'تلاش کریں (GRN نمبر، سپلائر، بلٹی)...' : 'Search GRN #, vendor, bilty...'}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={selectedVendorFilter}
            onChange={(e) => setSelectedVendorFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">{lang === 'ur' ? 'تمام سپلائرز (All Vendors)' : 'All Vendors'}</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.companyName || v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* GRN Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs md:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5 text-center">GRN #</th>
                <th className="p-3.5 text-right">{lang === 'ur' ? 'تاریخ و وقت' : 'Date'}</th>
                <th className="p-3.5 text-right">{lang === 'ur' ? 'سپلائر / وینڈر' : 'Vendor'}</th>
                <th className="p-3.5 text-center">{lang === 'ur' ? 'بلٹی / انوائس #' : 'Bilty / Inv #'}</th>
                <th className="p-3.5 text-center">{lang === 'ur' ? 'آئٹمز تعداد' : 'Items'}</th>
                <th className="p-3.5 text-left">{lang === 'ur' ? 'کل رقم' : 'Grand Total'}</th>
                <th className="p-3.5 text-left">{lang === 'ur' ? 'ادا شدہ' : 'Paid'}</th>
                <th className="p-3.5 text-left">{lang === 'ur' ? 'بقایا' : 'Balance'}</th>
                <th className="p-3.5 text-center">{lang === 'ur' ? 'ایکشن' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredGRNs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    {lang === 'ur'
                      ? 'ابھی تک کوئی مال وصولی ریکارڈ نہیں ہوئی۔ "نیا مال وصولی اندراج" پر کلک کریں۔'
                      : 'No GRN records found. Click "Create New GRN" to receive stock.'}
                  </td>
                </tr>
              ) : (
                filteredGRNs.map((grn) => (
                  <tr key={grn.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="p-3.5 text-center font-mono font-bold text-emerald-600">
                      {grn.grnNo}
                    </td>
                    <td className="p-3.5 text-slate-500 whitespace-nowrap text-xs">
                      {new Date(grn.date).toLocaleDateString('en-PK')}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      {grn.vendorName}
                    </td>
                    <td className="p-3.5 text-center font-mono text-xs text-slate-500">
                      {grn.biltyNo || grn.invoiceNo || '—'}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-xs">
                        {grn.items.length} {lang === 'ur' ? 'اشیاء' : 'items'}
                      </span>
                    </td>
                    <td className="p-3.5 text-left font-mono font-bold text-slate-900 dark:text-white">
                      Rs. {grn.grandTotal.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-left font-mono text-emerald-600">
                      Rs. {grn.paidAmount.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-left font-mono text-amber-600 font-bold">
                      Rs. {grn.balanceAmount.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setActiveGRNToPrint(grn)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 mx-auto"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{lang === 'ur' ? 'رسیدہ' : 'Print'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New GRN Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col text-white shadow-2xl relative overflow-hidden">
            {/* Top Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black">
                    {lang === 'ur' ? 'نیا مال وصولی اندراج (GRN Entry)' : 'New GRN Purchase Entry'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {lang === 'ur'
                      ? 'اشیاء درج کریں، سٹاک خود بخود بڑھ جائے گا اور سپلائر کا کھاتہ اپ ڈیٹ ہوگا'
                      : 'Add purchased items, stock automatically increases & vendor balance is updated'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveGRN} className="p-5 space-y-5 overflow-y-auto flex-1 text-xs md:text-sm">
              {/* Vendor & Invoice Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {lang === 'ur' ? 'سپلائر / وینڈر کا انتخاب *' : 'Select Vendor *'}
                  </label>
                  <select
                    required
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">{lang === 'ur' ? 'سپلائر منتخب کریں...' : 'Choose Vendor...'}</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.companyName || v.name} (بقایا: {v.balance.toLocaleString()} Rs)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {lang === 'ur' ? 'بلٹی / ٹرانسپورٹ نمبر' : 'Bilty / Cargo #'}
                  </label>
                  <input
                    type="text"
                    value={biltyNo}
                    onChange={(e) => setBiltyNo(e.target.value)}
                    placeholder="e.g. BL-9842"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {lang === 'ur' ? 'سپلائر کا انوائس نمبر' : 'Vendor Bill / Invoice #'}
                  </label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="e.g. INV-1049"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Add Item to GRN (Search Existing or Add New Manually) */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Package className="w-4 h-4" />
                      <span>{lang === 'ur' ? 'آئٹم کا اندراج:' : 'Add Product to GRN:'}</span>
                    </span>

                    {/* Transaction Type: Receive (وصولی) vs Return (واپسی / منفی رقم) */}
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setItemTxType('RECEIVE')}
                        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                          itemTxType === 'RECEIVE'
                            ? 'bg-emerald-600 text-white shadow-sm font-black'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-300" />
                        <span>{lang === 'ur' ? '📥 مال وصولی' : 'Receive'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setItemTxType('RETURN')}
                        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                          itemTxType === 'RETURN'
                            ? 'bg-rose-600 text-white shadow-sm font-black'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-rose-300" />
                        <span>{lang === 'ur' ? '↩️ مال واپسی (منفی کٹوتی)' : 'Return / Claim'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Mode Toggle Buttons: Existing vs New Product */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setItemInputMode('EXISTING')}
                      className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                        itemInputMode === 'EXISTING'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      <span>{lang === 'ur' ? 'موجودہ لسٹ سے سرچ کریں' : 'Search Inventory'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setItemInputMode('NEW');
                        if (!newProdBarcode) handleGenerateRandomBarcode();
                      }}
                      className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                        itemInputMode === 'NEW'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>{lang === 'ur' ? 'نیا پروڈکٹ خود ایڈ کریں' : 'Add New Item'}</span>
                    </button>
                  </div>
                </div>

                {/* RETURN REASON SELECTOR & NOTICE (Shown when Return mode is selected) */}
                {itemTxType === 'RETURN' && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 space-y-2 text-xs animate-fadeIn">
                    <div className="flex items-center justify-between text-rose-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>{lang === 'ur' ? 'سپلائر کو مال واپسی کی تفصیل (یہ رقم بل سے منفی ہوگی):' : 'Supplier Return & Damage Claim (Will be deducted from total):'}</span>
                      </span>
                      <span className="text-[10px] bg-rose-900 text-rose-200 px-2 py-0.5 rounded-full font-mono">
                        منفی کٹوتی (Deduction)
                      </span>
                    </div>

                    <div>
                      <span className="block text-[11px] font-bold text-rose-300 mb-1.5">
                        {lang === 'ur' ? 'واپسی کی وجہ منتخب کریں یا لکھیں *:' : 'Reason for Return *:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {[
                          { id: 'EXPIRY', labelUr: '⚠️ ایکسپائری (Expired)' },
                          { id: 'LEAKAGE', labelUr: '💧 لیکج (Leakage)' },
                          { id: 'DAMAGE', labelUr: '🔨 ٹوٹ پھوٹ / ڈیمج (Damage)' },
                          { id: 'DEFECTIVE', labelUr: '❌ خراب کوالٹی (Defective)' },
                          { id: 'WRONG_ITEM', labelUr: '📦 غلط مال / پیکنگ (Wrong Item)' },
                        ].map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setReturnReasonPreset(preset.labelUr);
                              setCustomReturnReason(preset.labelUr);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              customReturnReason === preset.labelUr || returnReasonPreset === preset.labelUr
                                ? 'bg-rose-600 text-white shadow-sm ring-1 ring-white/50'
                                : 'bg-rose-900/40 hover:bg-rose-900/70 text-rose-200 border border-rose-700/60'
                            }`}
                          >
                            {preset.labelUr}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        value={customReturnReason}
                        onChange={(e) => setCustomReturnReason(e.target.value)}
                        placeholder={
                          lang === 'ur'
                            ? 'وجہ تفصیل سے لکھیں (مثلاً: دودھ کے 5 ڈبے لیکیج / 2 پیکٹ ایکسپائر ہو گئے)...'
                            : 'Write detailed reason (e.g. 5 leaking packets / expired stock)...'
                        }
                        className="w-full px-3 py-1.5 bg-slate-950 border border-rose-500/60 rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* MODE 1: SEARCH & SELECT EXISTING PRODUCT */}
                {itemInputMode === 'EXISTING' && (
                  <div className="space-y-3">
                    {/* Live Search Input */}
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={productSearchInput}
                        onChange={(e) => setProductSearchInput(e.target.value)}
                        placeholder={
                          lang === 'ur'
                            ? 'پروڈکٹ کا نام، بارکوڈ، یا SKU لکھ کر فوری سرچ کریں...'
                            : 'Search item by name, barcode, or SKU...'
                        }
                        className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5">
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] text-slate-400 mb-1">
                          {lang === 'ur' ? 'منتخب پروڈکٹ:' : 'Select Product:'}
                        </label>
                        <select
                          value={chosenProductId}
                          onChange={(e) => handleProductSelect(e.target.value)}
                          className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">{lang === 'ur' ? '-- پروڈکٹ منتخب کریں --' : '-- Choose item --'}</option>
                          {filteredExistingProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nameUr} ({p.nameEn}) - اسٹاک: {p.stock} {p.unit}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          {itemTxType === 'RETURN'
                            ? (lang === 'ur' ? 'واپس تعداد (Qty):' : 'Return Qty:')
                            : (lang === 'ur' ? 'تعداد / مقدار:' : 'Quantity:')}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={chosenQty || ''}
                          onChange={(e) => setChosenQty(Number(e.target.value))}
                          placeholder="1"
                          className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono font-bold outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          {itemTxType === 'RETURN'
                            ? (lang === 'ur' ? 'واپسی ریٹ (Cost):' : 'Return Rate:')
                            : (lang === 'ur' ? 'خرید ریٹ (Cost):' : 'Cost Price:')}
                        </label>
                        <input
                          type="number"
                          value={chosenCost || ''}
                          onChange={(e) => setChosenCost(Number(e.target.value))}
                          placeholder="0"
                          className={`w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono font-bold outline-none ${
                            itemTxType === 'RETURN' ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleAddItem}
                          className={`w-full py-2 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all text-white ${
                            itemTxType === 'RETURN'
                              ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/50'
                              : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50'
                          }`}
                        >
                          {itemTxType === 'RETURN' ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>{lang === 'ur' ? '↩️ واپسی شامل کریں' : 'Add Return'}</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>{lang === 'ur' ? 'شامل کریں' : 'Add Item'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODE 2: DIRECT NEW PRODUCT REGISTRATION & GRN INCLUSION */}
                {itemInputMode === 'NEW' && (
                  <div className="bg-slate-900/90 p-3.5 rounded-xl border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold border-b border-slate-800 pb-1.5">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        {lang === 'ur'
                          ? 'نئی پروڈکٹ شامل کریں (یہ انوینٹری اور رسید دونوں میں محفوظ ہوگی):'
                          : 'Register New Product Directly into GRN & Inventory:'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-slate-400 mb-1">
                          {lang === 'ur' ? 'پروڈکٹ کا نام (اردو نستعلیق):' : 'Product Name (Urdu):'}
                        </label>
                        <input
                          type="text"
                          required
                          value={newProdNameUr}
                          onChange={(e) => setNewProdNameUr(e.target.value)}
                          placeholder="مثلاً: نیشنل چلی گارلک ساس 300 گرام"
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-nastaliq outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-slate-400 mb-1">
                          {lang === 'ur' ? 'پروڈکٹ کا نام (انگریزی - اختیاری):' : 'Name (English):'}
                        </label>
                        <input
                          type="text"
                          value={newProdNameEn}
                          onChange={(e) => setNewProdNameEn(e.target.value)}
                          placeholder="e.g. National Chilli Garlic Sauce 300g"
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          {itemTxType === 'RETURN'
                            ? (lang === 'ur' ? 'واپس تعداد:' : 'Return Qty:')
                            : (lang === 'ur' ? 'تعداد (وصول شدہ):' : 'Received Qty:')}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={newProdQty || ''}
                          onChange={(e) => setNewProdQty(Number(e.target.value))}
                          placeholder="1"
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono font-bold outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          {lang === 'ur' ? 'یونٹ (پیکنگ):' : 'Unit:'}
                        </label>
                        <select
                          value={newProdUnit}
                          onChange={(e) => setNewProdUnit(e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs outline-none"
                        >
                          <option value="عدد">عدد (Piece)</option>
                          <option value="کلو">کلو (Kg)</option>
                          <option value="گرام">گرام (Gram)</option>
                          <option value="لیٹر">لیٹر (Liter)</option>
                          <option value="پیکٹ">پیکٹ (Pack)</option>
                          <option value="درجن">درجن (Dozen)</option>
                          <option value="کاٹن">کاٹن (Carton)</option>
                          <option value="پیٹی">پیٹی (Box)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          {lang === 'ur' ? 'خرید ریٹ (Cost):' : 'Cost Price (Rs):'}
                        </label>
                        <input
                          type="number"
                          value={newProdCost || ''}
                          onChange={(e) => setNewProdCost(Number(e.target.value))}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono font-bold outline-none text-rose-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          {lang === 'ur' ? 'فروخت ریٹ (Sale):' : 'Sale Price (Rs):'}
                        </label>
                        <input
                          type="number"
                          value={newProdSale || ''}
                          onChange={(e) => setNewProdSale(Number(e.target.value))}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono font-bold outline-none text-emerald-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          {lang === 'ur' ? 'بارکوڈ / SKU:' : 'Barcode:'}
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={newProdBarcode}
                            onChange={(e) => setNewProdBarcode(e.target.value)}
                            placeholder="خودکار بارکوڈ"
                            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-[11px] font-mono outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleGenerateRandomBarcode}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-[10px] font-bold"
                            title="نیا بارکوڈ"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleAddNewProductToGRN}
                        className={`w-full py-2 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all ${
                          itemTxType === 'RETURN'
                            ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                        }`}
                      >
                        {itemTxType === 'RETURN' ? (
                          <>
                            <RotateCcw className="w-4 h-4" />
                            <span>{lang === 'ur' ? '↩️ نیا پروڈکٹ بطور واپسی مال شامل کریں (منفی رقم)' : 'Add New Product as Return Claim'}</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>{lang === 'ur' ? 'نیا پروڈکٹ سیو کر کے مال میں شامل کریں' : 'Save New Product & Add to GRN'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Items List Table (Supports both Received & Returned Items) */}
              <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5 text-center w-8">#</th>
                      <th className="p-2.5 text-right">{lang === 'ur' ? 'پروڈکٹ کا نام و تفصیل' : 'Item Description'}</th>
                      <th className="p-2.5 text-center">{lang === 'ur' ? 'نوعیت / قسم' : 'Type'}</th>
                      <th className="p-2.5 text-center">{lang === 'ur' ? 'تعداد' : 'Qty'}</th>
                      <th className="p-2.5 text-left">{lang === 'ur' ? 'خرید قیمت' : 'Cost Rate'}</th>
                      <th className="p-2.5 text-left">{lang === 'ur' ? 'کل رقم' : 'Total'}</th>
                      <th className="p-2.5 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {grnItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-5 text-center text-slate-500">
                          {lang === 'ur' ? 'ابھی کوئی آئٹم شامل نہیں کیا گیا۔ اوپر سے پروڈکٹ منتخب کریں۔' : 'No items added yet'}
                        </td>
                      </tr>
                    ) : (
                      grnItems.map((item, index) => {
                        const isReturn = item.isReturn;
                        return (
                          <tr
                            key={index}
                            className={`transition-colors ${
                              isReturn
                                ? 'bg-rose-950/30 hover:bg-rose-950/50 border-r-4 border-rose-500'
                                : 'hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="p-2.5 text-center font-mono text-slate-400">
                              {index + 1}
                            </td>
                            <td className="p-2.5 font-medium">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={isReturn ? 'text-rose-200 font-bold' : 'text-slate-100 font-bold'}>
                                  {item.productName}
                                </span>
                                {isReturn && item.returnReason && (
                                  <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-rose-900/80 text-rose-200 border border-rose-700/60 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                                    <span>{item.returnReason}</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-2.5 text-center">
                              {isReturn ? (
                                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black bg-rose-900 text-rose-100 border border-rose-700">
                                  {lang === 'ur' ? '↩️ مال واپسی' : 'Return'}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  {lang === 'ur' ? '📥 مال وصولی' : 'Received'}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold">
                              {isReturn ? (
                                <span className="text-rose-400 font-black">
                                  - {item.quantity} {item.unit}
                                </span>
                              ) : (
                                <span className="text-slate-200">
                                  {item.quantity} {item.unit}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-left font-mono">
                              Rs. {item.costPrice.toLocaleString()}
                            </td>
                            <td className="p-2.5 text-left font-mono font-bold">
                              {isReturn ? (
                                <span className="text-rose-400 font-black tracking-tight">
                                  - Rs. {item.totalCost.toLocaleString()}
                                  <span className="text-[10px] ml-1 font-normal text-rose-300">(کٹوتی)</span>
                                </span>
                              ) : (
                                <span className="text-emerald-400">
                                  Rs. {item.totalCost.toLocaleString()}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition"
                                title="خارج کریں"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Expenses, Discount & Payment Row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {lang === 'ur' ? 'کرایہ / لیبر اخراجات (Freight)' : 'Freight / Labour (Rs)'}
                  </label>
                  <input
                    type="number"
                    value={extraExpenses}
                    onChange={(e) => setExtraExpenses(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {lang === 'ur' ? 'مجموعی رعایت (Discount Rs)' : 'Discount in Rs'}
                  </label>
                  <input
                    type="number"
                    value={overallDiscount}
                    onChange={(e) => setOverallDiscount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {lang === 'ur' ? 'ادائیگی کا طریقہ' : 'Payment Mode'}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                  >
                    <option value="CREDIT">{lang === 'ur' ? 'مکمل ادھار (To Khata)' : 'Full Credit'}</option>
                    <option value="CASH">{lang === 'ur' ? 'نقد ادائیگی (Cash Out)' : 'Cash Out'}</option>
                    <option value="BANK">{lang === 'ur' ? 'بینک ٹرانسفر (Bank)' : 'Bank Transfer'}</option>
                    <option value="PARTIAL">{lang === 'ur' ? 'جزوی ادائیگی (Partial)' : 'Partial Payment'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {lang === 'ur' ? 'ادا شدہ رقم (Paid Amount)' : 'Paid Amount (Rs)'}
                  </label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono text-emerald-400 font-bold"
                  />
                </div>
              </div>

              {/* Total Summary Banner (Clear Breakdown of Received vs Returned vs Net) */}
              <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px] font-bold">
                      {lang === 'ur' ? 'کل وصول شدہ مال:' : 'Gross Received:'}
                    </span>
                    <span className="font-mono font-black text-emerald-400 text-sm sm:text-base">
                      Rs. {draftReceivedSubtotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60">
                    <span className="text-rose-300 block text-[11px] font-bold">
                      {lang === 'ur' ? 'منفی: مال واپسی کٹوتی:' : 'Returns Deducted:'}
                    </span>
                    <span className="font-mono font-black text-rose-400 text-sm sm:text-base">
                      - Rs. {draftReturnTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-700/60">
                    <span className="text-emerald-300 block text-[11px] font-black">
                      {lang === 'ur' ? 'خالص کل بل (Grand Total):' : 'Grand Total:'}
                    </span>
                    <span className="font-mono font-black text-white text-sm sm:text-base">
                      Rs. {draftGrandTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-amber-950/50 p-2.5 rounded-xl border border-amber-700/60">
                    <span className="text-amber-300 block text-[11px] font-black">
                      {lang === 'ur' ? 'سپلائر کھاتے میں بقایا:' : 'To Vendor Khata:'}
                    </span>
                    <span className="font-mono font-black text-amber-400 text-sm sm:text-base">
                      Rs. {Math.max(0, draftGrandTotal - paidAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  {lang === 'ur' ? 'منسوخ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50"
                >
                  {lang === 'ur' ? 'مال وصول کریں اور محفوظ کریں' : 'Confirm & Receive Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print GRN Modal - A4 Plain Printer Optimized */}
      {activeGRNToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl relative overflow-hidden my-auto">
            {/* Top Bar (no-print) */}
            <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600 rounded-xl">
                  <Printer className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base">
                    {lang === 'ur' ? 'مال وصولی و واپسی واؤچر پرنٹ (A4 Plain Printer)' : 'Print GRN & Return Voucher'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'ur'
                      ? 'سادہ A4 پرنٹر یا تھرمل پرنٹر پر پرنٹ نکالنے کے لیے نیچے بٹن دبائیں'
                      : 'Optimized for Standard Plain A4 Paper Printers & Thermal Printers'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    printElement('printable-grn-voucher', {
                      format: 'a4',
                      isUrdu: lang === 'ur',
                      title: `GRN-Voucher-${activeGRNToPrint.grnNo}`,
                    })
                  }
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{lang === 'ur' ? '🖨️ سادہ پرنٹر (A4 پرنٹ)' : 'Print (A4 Plain)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    printElement('printable-grn-voucher', {
                      format: 'thermal80',
                      isUrdu: lang === 'ur',
                      title: `GRN-Voucher-${activeGRNToPrint.grnNo}`,
                    })
                  }
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-slate-700"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'ur' ? 'تھرمل 80mm' : 'Thermal 80mm'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveGRNToPrint(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
                  title="بند کریں"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Document Preview Area */}
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
              {/* Actual Printable Document */}
              <div
                id="printable-grn-voucher"
                className="a4-receipt w-full max-w-[210mm] bg-white text-black p-6 sm:p-8 text-xs font-sans border border-slate-300 shadow-md space-y-4"
                dir={lang === 'ur' ? 'rtl' : 'ltr'}
              >
                {/* 1. Header with Store & Document Title */}
                <div className="text-center border-b-2 border-black pb-4 space-y-1">
                  <div className="text-xl sm:text-2xl font-black text-black">
                    {lang === 'ur' ? (businessProfile.nameUr || 'ون شاپ پی او ایس') : (businessProfile.nameEn || 'OneShop POS')}
                  </div>
                  {businessProfile.taglineUr && (
                    <p className="text-xs text-slate-600 font-semibold">{businessProfile.taglineUr}</p>
                  )}
                  <p className="text-xs text-slate-700">{businessProfile.addressUr || businessProfile.addressEn}</p>
                  <p className="text-xs font-mono font-bold" dir="ltr">
                    <span>فون: </span>
                    <span className="phone-number">{businessProfile.phone}</span>
                  </p>
                  <div className="inline-block px-4 py-1 rounded-full bg-slate-100 border border-black font-black text-xs sm:text-sm mt-1 tracking-wide">
                    {lang === 'ur'
                      ? 'خریداری و مال وصولی و واپسی واؤچر (GRN & Return Voucher)'
                      : 'GOODS RECEIVED & RETURN VOUCHER (GRN)'}
                  </div>
                </div>

                {/* 2. Voucher & Supplier Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 bg-slate-50 border border-slate-300 rounded text-xs">
                  <div>
                    <span className="text-slate-600 font-bold block">{lang === 'ur' ? 'واؤچر نمبر:' : 'GRN #:'}</span>
                    <span className="font-mono font-black text-sm">{activeGRNToPrint.grnNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-bold block">{lang === 'ur' ? 'تاریخ و وقت:' : 'Date & Time:'}</span>
                    <span className="font-mono">{new Date(activeGRNToPrint.date).toLocaleString(lang === 'ur' ? 'ur-PK' : 'en-PK')}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-bold block">{lang === 'ur' ? 'سپلائر / وینڈر:' : 'Vendor Name:'}</span>
                    <span className="font-black text-sm">{activeGRNToPrint.vendorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-bold block">{lang === 'ur' ? 'بلٹی / ٹرانسپورٹ #:' : 'Bilty #:'}</span>
                    <span className="font-mono">{activeGRNToPrint.biltyNo || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-bold block">{lang === 'ur' ? 'سپلائر بل / انوائس #:' : 'Vendor Invoice #:'}</span>
                    <span className="font-mono">{activeGRNToPrint.invoiceNo || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-bold block">{lang === 'ur' ? 'ادائیگی کا طریقہ:' : 'Payment Mode:'}</span>
                    <span className="font-bold">
                      {activeGRNToPrint.paymentMethod === 'CREDIT'
                        ? 'ادھار (To Khata)'
                        : activeGRNToPrint.paymentMethod === 'CASH'
                        ? 'نقد ادائیگی (Cash)'
                        : activeGRNToPrint.paymentMethod === 'BANK'
                        ? 'بینک ٹرانسفر'
                        : 'جزوی نقد'}
                    </span>
                  </div>
                </div>

                {/* 3. Section 1: Received Items Table */}
                {(() => {
                  const receivedItems = activeGRNToPrint.items.filter((i) => !i.isReturn);
                  const returnedItems = activeGRNToPrint.items.filter((i) => i.isReturn);
                  const receivedSubtotal = receivedItems.reduce((s, i) => s + i.totalCost, 0);
                  const returnTotal = returnedItems.reduce((s, i) => s + i.totalCost, 0);

                  return (
                    <div className="space-y-4">
                      {/* Received Items */}
                      <div className="space-y-1.5">
                        <div className="font-black text-xs text-slate-800 flex items-center justify-between border-b border-black pb-1">
                          <span>{lang === 'ur' ? '📥 وصول شدہ سامان کی تفصیل (Received Goods):' : 'Goods Received Items:'}</span>
                          <span className="font-mono">{receivedItems.length} {lang === 'ur' ? 'اشیاء' : 'items'}</span>
                        </div>

                        <table className="w-full text-right text-xs border border-black border-collapse">
                          <thead className="bg-slate-100 font-black border-b border-black">
                            <tr>
                              <th className="p-2 text-center w-8 border-l border-black">#</th>
                              <th className="p-2 text-right border-l border-black">{lang === 'ur' ? 'تفصیل پروڈکٹ' : 'Item Description'}</th>
                              <th className="p-2 text-center w-20 border-l border-black">{lang === 'ur' ? 'پیکنگ' : 'Unit'}</th>
                              <th className="p-2 text-center w-24 border-l border-black">{lang === 'ur' ? 'تعداد' : 'Qty'}</th>
                              <th className="p-2 text-left w-24 border-l border-black font-mono">{lang === 'ur' ? 'خرید ریٹ' : 'Rate'}</th>
                              <th className="p-2 text-left w-28 font-mono">{lang === 'ur' ? 'کل رقم (PKR)' : 'Total'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-300">
                            {receivedItems.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-3 text-center text-slate-500 italic">
                                  {lang === 'ur' ? 'کوئی نیا مال وصول نہیں کیا گیا (صرف واپسی واؤچر)' : 'No received items'}
                                </td>
                              </tr>
                            ) : (
                              receivedItems.map((it, idx) => (
                                <tr key={idx} className="border-b border-slate-200">
                                  <td className="p-2 text-center font-mono border-l border-slate-200">{idx + 1}</td>
                                  <td className="p-2 font-bold border-l border-slate-200">{it.productName}</td>
                                  <td className="p-2 text-center border-l border-slate-200">{it.unit}</td>
                                  <td className="p-2 text-center font-mono font-bold border-l border-slate-200">{it.quantity}</td>
                                  <td className="p-2 text-left font-mono border-l border-slate-200">Rs. {it.costPrice.toLocaleString()}</td>
                                  <td className="p-2 text-left font-mono font-black">Rs. {it.totalCost.toLocaleString()}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                          {receivedItems.length > 0 && (
                            <tfoot>
                              <tr className="bg-slate-50 font-black border-t border-black">
                                <td colSpan={5} className="p-2 text-right">{lang === 'ur' ? 'کل وصول شدہ مال کی رقم:' : 'Gross Received Total:'}</td>
                                <td className="p-2 text-left font-mono font-black">Rs. {receivedSubtotal.toLocaleString()}</td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>

                      {/* Section 2: Returned Items Table (Rendered whenever returns exist) */}
                      {returnedItems.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="font-black text-xs text-rose-800 flex items-center justify-between border-b-2 border-rose-600 pb-1">
                            <span className="flex items-center gap-1.5">
                              <span>⚠️</span>
                              <span>{lang === 'ur' ? '↩️ واپس شدہ سامان و کٹوتی کلیمز (Returns, Expiry & Leakage Claims):' : 'Returned Goods & Rejection Claims:'}</span>
                            </span>
                            <span className="font-mono text-rose-700 font-bold">{returnedItems.length} {lang === 'ur' ? 'واپس اشیاء' : 'items returned'}</span>
                          </div>

                          <table className="w-full text-right text-xs border border-rose-600 border-collapse">
                            <thead className="bg-rose-50 text-rose-950 font-black border-b border-rose-600">
                              <tr>
                                <th className="p-2 text-center w-8 border-l border-rose-300">#</th>
                                <th className="p-2 text-right border-l border-rose-300">{lang === 'ur' ? 'واپس شدہ پروڈکٹ' : 'Returned Item'}</th>
                                <th className="p-2 text-right border-l border-rose-300">{lang === 'ur' ? 'واپسی کی وجہ (لیکج، ایکسپائری وغیرہ)' : 'Reason (Expiry/Leakage)'}</th>
                                <th className="p-2 text-center w-20 border-l border-rose-300">{lang === 'ur' ? 'واپس تعداد' : 'Qty'}</th>
                                <th className="p-2 text-left w-24 border-l border-rose-300 font-mono">{lang === 'ur' ? 'ریٹ' : 'Rate'}</th>
                                <th className="p-2 text-left w-32 font-mono text-rose-700">{lang === 'ur' ? 'منفی کٹوتی رقم' : 'Deducted'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-rose-200">
                              {returnedItems.map((it, idx) => (
                                <tr key={idx} className="bg-rose-50/40">
                                  <td className="p-2 text-center font-mono border-l border-rose-200">{idx + 1}</td>
                                  <td className="p-2 font-black text-slate-900 border-l border-rose-200">{it.productName}</td>
                                  <td className="p-2 font-bold text-rose-800 border-l border-rose-200">{it.returnReason || 'لیکج / ایکسپائری'}</td>
                                  <td className="p-2 text-center font-mono font-black text-rose-700 border-l border-rose-200">- {it.quantity} {it.unit}</td>
                                  <td className="p-2 text-left font-mono border-l border-rose-200">Rs. {it.costPrice.toLocaleString()}</td>
                                  <td className="p-2 text-left font-mono font-black text-rose-700">- Rs. {it.totalCost.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-rose-100 text-rose-900 font-black border-t border-rose-600">
                                <td colSpan={5} className="p-2 text-right">{lang === 'ur' ? 'کل مال واپسی کی کٹوتی (Total Deducted):' : 'Total Return Deduction:'}</td>
                                <td className="p-2 text-left font-mono font-black text-rose-900">- Rs. {returnTotal.toLocaleString()}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}

                      {/* 4. Accounts Breakdown Summary Box */}
                      <div className="flex justify-end pt-2">
                        <div className="w-full sm:w-80 border-2 border-black p-3 space-y-1.5 text-xs bg-slate-50 rounded">
                          <div className="flex justify-between font-bold">
                            <span>{lang === 'ur' ? 'وصول شدہ مال کی رقم:' : 'Gross Received:'}</span>
                            <span className="font-mono">Rs. {receivedSubtotal.toLocaleString()}</span>
                          </div>

                          {returnTotal > 0 && (
                            <div className="flex justify-between font-black text-rose-700 border-b border-rose-200 pb-1">
                              <span>{lang === 'ur' ? 'منفی: واپس شدہ مال کی کٹوتی:' : 'Less: Return Claims:'}</span>
                              <span className="font-mono">- Rs. {returnTotal.toLocaleString()}</span>
                            </div>
                          )}

                          {activeGRNToPrint.discount > 0 && (
                            <div className="flex justify-between font-bold text-rose-600">
                              <span>{lang === 'ur' ? 'منفی: مجموعی رعایت (ڈسکاؤنٹ):' : 'Less: Discount:'}</span>
                              <span className="font-mono">- Rs. {activeGRNToPrint.discount.toLocaleString()}</span>
                            </div>
                          )}

                          {activeGRNToPrint.extraExpenses > 0 && (
                            <div className="flex justify-between font-bold">
                              <span>{lang === 'ur' ? 'جمع: کرایہ و لیبر اخراجات:' : 'Add: Freight / Labour:'}</span>
                              <span className="font-mono">+ Rs. {activeGRNToPrint.extraExpenses.toLocaleString()}</span>
                            </div>
                          )}

                          <div className="flex justify-between font-black text-sm border-t-2 border-black pt-1.5 text-black">
                            <span>{lang === 'ur' ? 'خالص کل بل (Grand Total):' : 'NET GRAND TOTAL:'}</span>
                            <span className="font-mono">Rs. {activeGRNToPrint.grandTotal.toLocaleString()}</span>
                          </div>

                          <div className="flex justify-between font-bold text-emerald-800">
                            <span>{lang === 'ur' ? 'ادا شدہ نقد رقم:' : 'Paid Amount:'}</span>
                            <span className="font-mono">Rs. {activeGRNToPrint.paidAmount.toLocaleString()}</span>
                          </div>

                          <div className="flex justify-between font-black text-amber-900 bg-amber-100 p-1 rounded border border-amber-400">
                            <span>{lang === 'ur' ? 'سپلائر کے کھاتے میں بقایا:' : 'Balance to Khata:'}</span>
                            <span className="font-mono">Rs. {activeGRNToPrint.balanceAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* 5. Formal Signatures Section */}
                      <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                        <div className="border-t-2 border-dashed border-black pt-2">
                          <p className="font-bold">{lang === 'ur' ? 'دستخط وصول کنندہ / خریدار دکان دار' : 'Store Receiver Signature'}</p>
                          <p className="text-[10px] text-slate-500">{activeGRNToPrint.receivedBy || 'ایڈمن'}</p>
                        </div>
                        <div className="border-t-2 border-dashed border-black pt-2">
                          <p className="font-bold">{lang === 'ur' ? 'دستخط سپلائر / مال بردار ڈرائیور' : 'Supplier / Driver Signature'}</p>
                          <p className="text-[10px] text-slate-500">{activeGRNToPrint.vendorName}</p>
                        </div>
                      </div>

                      {/* 6. Footer Developer Branding & Helpline */}
                      <div className="border-t border-slate-300 pt-3 text-center text-[10px] text-slate-600 font-mono flex items-center justify-center gap-2" dir="ltr">
                        <span>★ OneShop POS v2.0 PRO ★</span>
                        <span>•</span>
                        <span>JK Developers Pakistan</span>
                        <span>•</span>
                        <span>Helpline: <bdi className="phone-number font-black">0300-8998381</bdi></span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
