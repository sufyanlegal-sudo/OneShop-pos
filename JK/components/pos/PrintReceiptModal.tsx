'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  Share2,
  X,
  Check,
  MessageSquare,
  QrCode,
  Barcode as BarcodeIcon,
  ZoomIn,
  Sliders,
  Globe,
} from 'lucide-react';
import { Invoice, BusinessProfile } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import QRCodeLib from 'qrcode';
import JsBarcode from 'jsbarcode';

interface PrintReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  businessProfile: BusinessProfile;
}

export type ReceiptFormat = 'thermal80' | 'thermal58' | 'a4' | 'a5';

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  isOpen,
  onClose,
  invoice,
  businessProfile,
}) => {
  const { lang } = useLanguage();
  const [format, setFormat] = useState<ReceiptFormat>('thermal80');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [showBarcode, setShowBarcode] = useState<boolean>(true);
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);
  const [receiptLang, setReceiptLang] = useState<'ur' | 'en'>('ur');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>('');
  const [customTendered, setCustomTendered] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setReceiptLang(lang === 'ur' ? 'ur' : 'en');
  }, [lang, isOpen]);

  useEffect(() => {
    setCustomTendered(null);
  }, [isOpen, invoice]);

  // Generate QR Code and Barcode images whenever modal opens or invoice changes
  useEffect(() => {
    if (!isOpen || !invoice) return;

    // 1. Generate QR Code
    try {
      const qrPayload = JSON.stringify({
        software: businessProfile?.softwareName || 'OneShop POS',
        dev: 'JK Developers Pakistan (03008998381)',
        shop: businessProfile?.nameUr || businessProfile?.nameEn || 'ون شاپ',
        inv: invoice.invoiceNo,
        date: invoice.date,
        total: invoice.grandTotal,
        paid: invoice.paidAmount,
        balance: invoice.balanceDue,
        counter: invoice.counterNumber !== undefined ? invoice.counterNumber : 1,
      });

      QRCodeLib.toDataURL(qrPayload, {
        width: 140,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR Code Generation Error:', err));
    } catch (e) {
      console.error('QR Payload Error:', e);
    }

    // 2. Generate Barcode (CODE128)
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, invoice.invoiceNo, {
        format: 'CODE128',
        lineColor: '#000000',
        width: 1.5,
        height: 38,
        displayValue: true,
        fontSize: 11,
        font: 'monospace',
        margin: 2,
      });
      setBarcodeDataUrl(canvas.toDataURL('image/png'));
    } catch (err) {
      console.error('Barcode Generation Error:', err);
    }
  }, [isOpen, invoice, businessProfile]);

  // ALL HOOKS MUST BE DECLARED ABOVE THIS LINE!
  if (!isOpen || !invoice || !mounted) return null;

  const handlePrint = () => {
    const prevZoom = zoomScale;
    setZoomScale(100);
    setTimeout(() => {
      window.print();
      setZoomScale(prevZoom);
    }, 100);
  };

  const isUrdu = receiptLang === 'ur';

  // Localized Labels and Content
  const shopName = isUrdu ? (businessProfile?.nameUr || businessProfile?.nameEn || 'ون شاپ') : (businessProfile?.nameEn || businessProfile?.nameUr || 'OneShop POS');
  const shopTagline = isUrdu ? businessProfile?.taglineUr : businessProfile?.taglineEn;
  const shopAddress = isUrdu ? (businessProfile?.addressUr || businessProfile?.addressEn) : (businessProfile?.addressEn || businessProfile?.addressUr);

  const invoiceNoLabel = isUrdu ? 'انوائس نمبر:' : 'Invoice #:';
  const dateLabel = isUrdu ? 'تاریخ و وقت:' : 'Date & Time:';
  const counterLabel = isUrdu
    ? (invoice.counterNumber !== undefined ? (invoice.counterNumber === 0 ? 'مینجر کاؤنٹر' : `کاؤنٹر #${invoice.counterNumber}`) : 'کاؤنٹر #1')
    : (invoice.counterNumber !== undefined ? (invoice.counterNumber === 0 ? 'Admin Counter' : `Counter #${invoice.counterNumber}`) : 'Counter #1');
  const cashierLabel = isUrdu ? (invoice.cashier || 'کیشیئر') : (invoice.cashier || 'Cashier');
  const cashierTitle = isUrdu ? 'کیشیئر:' : 'CASHIER:';
  const customerTitle = isUrdu ? 'گاہک کا نام:' : 'CUSTOMER:';
  const phoneTitle = isUrdu ? 'فون:' : 'PHONE:';
  const tableTitle = isUrdu ? 'ٹیبل نمبر:' : 'TABLE / KOT:';
  const custName = invoice.customerName || (isUrdu ? 'عام گاہک' : 'Walk-in Customer');

  const colItemDesc = isUrdu ? 'تفصیل اشیاء' : 'Item Description';
  const colQty = isUrdu ? 'تعداد / وزن' : 'Qty / Wt';
  const colRate = isUrdu ? 'ریٹ' : 'Rate';
  const colTotal = isUrdu ? 'کل رقم' : 'Amount';

  const subtotalLabel = isUrdu ? 'سب ٹوٹل:' : 'Subtotal:';
  const discountLabel = isUrdu ? 'رعایت (ڈسکاؤنٹ):' : 'Discount:';
  const totalPayableLabel = isUrdu ? 'کل واجب الادا رقم:' : 'TOTAL PAYABLE:';
  const cashReceivedLabel = isUrdu ? 'وصول شدہ رقم:' : 'Cash Tendered:';
  const changeReturnLabel = isUrdu ? 'بقایا رقم واپس (Change):' : 'CHANGE RETURN:';
  const balanceDueLabel = isUrdu ? 'بقایا ادھار واجب الادا:' : 'BALANCE DUE:';

  const footerNote = isUrdu
    ? 'ہماری دکان پر تشریف لانے کا شکریہ! برائے مہربانی سامان کاؤنٹر پر چیک کر لیں۔ خریدا گیا مال اصلی رسید کے ساتھ 3 دن میں تبدیل ہو سکتا ہے۔'
    : 'Thank you for shopping with us! Please verify goods before leaving counter. Items can be exchanged with receipt within 3 days.';

  const developerCredit = isUrdu
    ? 'سافٹ ویئر: ون شاپ پی او ایس (OneShop POS) • جے کے ڈویلپرز پاکستان (JK Developers) • ہیلپ لائن: 03008998381'
    : 'Software: OneShop POS • JK Developers Pakistan • Helpline: +923008998381';

  const activeTendered = customTendered !== null ? customTendered : (invoice.tenderedAmount || invoice.paidAmount || 0);
  const effectiveChange = activeTendered > invoice.grandTotal ? activeTendered - invoice.grandTotal : (invoice.changeDue || 0);

  const changeLine = effectiveChange > 0
    ? (isUrdu ? `\nبقایا رقم واپس (Change): ${effectiveChange.toLocaleString()} روپے` : `\nChange Return: Rs. ${effectiveChange.toLocaleString()}`)
    : '';

  const dueLine = invoice.balanceDue > 0
    ? (isUrdu ? `\nبقایا ادھار: ${invoice.balanceDue.toLocaleString()} روپے` : `\nBalance Due: Rs. ${invoice.balanceDue.toLocaleString()}`)
    : '';

  const itemsText = invoice.items
    .map((item) => {
      const name = isUrdu ? (item.nameUr || item.nameEn) : (item.nameEn || item.nameUr);
      if (item.isGram) {
        return isUrdu
          ? `• ${name}: ${item.weightInGrams || item.quantity} گرام (ریٹ: ${item.ratePerKg || item.unitPrice} روپے فی کلو) = ${item.total} روپے`
          : `• ${name}: ${item.weightInGrams || item.quantity}g (Rate: Rs. ${item.ratePerKg || item.unitPrice}/kg) = Rs. ${item.total}`;
      }
      if (item.isLiter && item.volumeInMl) {
        return isUrdu
          ? `• ${name}: ${item.volumeInMl === 500 ? 'ہاف لیٹر (500ml)' : `${item.volumeInMl} ملی لیٹر`} (ریٹ: ${item.ratePerLiter || item.unitPrice} روپے) = ${item.total} روپے`
          : `• ${name}: ${item.volumeInMl === 500 ? 'Half Liter (500ml)' : `${item.volumeInMl}ml`} (Rate: Rs. ${item.ratePerLiter || item.unitPrice}/L) = Rs. ${item.total}`;
      }
      return isUrdu
        ? `• ${name}: ${item.quantity} ${item.unit} (ریٹ: ${item.unitPrice}) = ${item.total} روپے`
        : `• ${name}: ${item.quantity} ${item.unit} (Rate: Rs. ${item.unitPrice}) = Rs. ${item.total}`;
    })
    .join('\n');

  // Exact WhatsApp Notification message
  const whatsAppMessage = isUrdu
    ? `محترم ${custName} صاحب!
آپ کی آج کی خریداری کا بل ${invoice.grandTotal.toLocaleString()} روپے بنا۔
وصول شدہ رقم: ${activeTendered.toLocaleString()} روپے${changeLine}${dueLine}
${
  invoice.previousBalance && invoice.previousBalance > 0
    ? `سابقہ بقایا کھاتہ: ${invoice.previousBalance.toLocaleString()} روپے\nکل واجب الادا رقم: ${(invoice.netTotalDebt || 0).toLocaleString()} روپے\n`
    : ''
}-------------------------------
تفصیل اشیاء:
${itemsText}
-------------------------------
کاؤنٹر: ${counterLabel}
کیشیئر: ${cashierLabel}
انوائس نمبر: #${invoice.invoiceNo}
-------------------------------
${footerNote}
-------------------------------
آپ کے تعاون کا شکریہ۔
${shopName} (${businessProfile.phone})
-------------------------------
سافٹ ویئر: ${businessProfile.softwareName || 'OneShop POS'}
${developerCredit}`
    : `Dear ${custName}!
Your bill total for today is Rs. ${invoice.grandTotal.toLocaleString()}.
Cash Tendered: Rs. ${activeTendered.toLocaleString()}${changeLine}${dueLine}
${
  invoice.previousBalance && invoice.previousBalance > 0
    ? `Previous Balance: Rs. ${invoice.previousBalance.toLocaleString()}\nNet Total Debt: Rs. ${(invoice.netTotalDebt || 0).toLocaleString()}\n`
    : ''
}-------------------------------
Items Breakdown:
${itemsText}
-------------------------------
Counter: ${counterLabel}
Cashier: ${cashierLabel}
Invoice #: #${invoice.invoiceNo}
-------------------------------
${footerNote}
-------------------------------
Thank you for your visit!
${shopName} (${businessProfile.phone})
-------------------------------
Software: ${businessProfile.softwareName || 'OneShop POS'}
${developerCredit}`;

  const handleSendWhatsApp = () => {
    let cleanPhone = (invoice.customerPhone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('03')) {
      cleanPhone = '92' + cleanPhone.substring(1);
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsAppMessage)}`;
    window.open(url, '_blank');
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsAppMessage);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  const modalContent = (
    <div
      className={`print-modal-wrapper print-format-${format} fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 md:p-4 overflow-y-auto`}
    >
      <div className="print-modal-inner bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Modal Top Control Bar (Hidden during print) */}
        <div className="no-print p-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">
              {isUrdu ? 'رسید و انوائس پرنٹ کاؤنٹر' : 'Receipt & Invoice Printing'}
            </h3>
            <span className="text-xs bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
              #{invoice.invoiceNo}
            </span>
          </div>

          {/* DEDICATED PRINT LANGUAGE SWITCHER TOGGLE */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-700">
            <button
              type="button"
              onClick={() => setReceiptLang('ur')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                receiptLang === 'ur'
                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="اردو میں خالص بل پرنٹ کریں"
            >
              <span>🇵🇰</span>
              <span>اردو بل</span>
            </button>
            <button
              type="button"
              onClick={() => setReceiptLang('en')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                receiptLang === 'en'
                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Print pure English receipt"
            >
              <span>🇬🇧</span>
              <span>English Bill</span>
            </button>
          </div>

          {/* Format selector buttons */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFormat('thermal80')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                format === 'thermal80'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              80mm تھرمل
            </button>
            <button
              onClick={() => setFormat('thermal58')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                format === 'thermal58'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              58mm تھرمل
            </button>
            <button
              onClick={() => setFormat('a4')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                format === 'a4'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              A4 فل پیج
            </button>
            <button
              onClick={() => setFormat('a5')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                format === 'a5'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              A5 ہاف پیج
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar (Print, WhatsApp, Zoom, Barcode/QR Toggles) */}
        <div className="no-print p-2.5 px-4 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all text-xs"
            >
              <Printer className="w-4 h-4" />
              <span>{isUrdu ? 'پرنٹر پر پرنٹ نکالیں (Print Now)' : 'Print Document Now'}</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all text-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isUrdu ? 'واٹس ایپ پر رسید بھیجیں' : 'Send via WhatsApp'}</span>
            </button>

            <button
              onClick={handleCopyWhatsApp}
              className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold rounded-xl flex items-center gap-1 transition-all"
            >
              {copiedWhatsApp ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedWhatsApp ? (isUrdu ? 'کاپی ہو گیا!' : 'Copied!') : (isUrdu ? 'ٹیکسٹ کاپی' : 'Copy Text')}</span>
            </button>
          </div>

          {/* Live Cash Tendered & Change Return Adjuster (Candela Style) */}
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/70 border-2 border-emerald-500 px-3 py-1.5 rounded-xl shadow-xs">
            <span className="font-black text-slate-900 dark:text-white text-xs">
              {isUrdu ? 'موصول کیش:' : 'Cash Tendered:'}
            </span>
            <input
              type="number"
              min="0"
              value={activeTendered || ''}
              onChange={(e) => setCustomTendered(parseFloat(e.target.value) || 0)}
              placeholder={String(invoice.grandTotal)}
              className="w-24 px-2 py-0.5 rounded-lg border-2 border-emerald-500 font-mono font-black text-xs text-center bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 outline-none shadow-xs"
            />
            {effectiveChange > 0 && (
              <span className="font-mono font-black text-xs text-white bg-emerald-600 px-2 py-0.5 rounded border border-emerald-400">
                {isUrdu ? `بقایا: ${effectiveChange.toLocaleString()} PKR` : `Change: Rs. ${effectiveChange.toLocaleString()}`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showBarcode}
                onChange={(e) => setShowBarcode(e.target.checked)}
                className="rounded accent-emerald-600"
              />
              <span>{isUrdu ? 'بارکوڈ' : 'Barcode'}</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showQrCode}
                onChange={(e) => setShowQrCode(e.target.checked)}
                className="rounded accent-emerald-600"
              />
              <span>{isUrdu ? 'کیو آر کوڈ' : 'QR Code'}</span>
            </label>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div className="print-paper-area p-4 md:p-6 overflow-y-auto flex justify-center bg-slate-200 dark:bg-slate-950/70">
          <div
            className="print-scale-container"
            style={{
              transform: zoomScale !== 100 ? `scale(${zoomScale / 100})` : undefined,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease',
            }}
          >
            {/* ========================================================= */}
            {/* 1. THERMAL 80MM RECEIPT                                   */}
            {/* ========================================================= */}
            {format === 'thermal80' && (
              <div
                dir={isUrdu ? 'rtl' : 'ltr'}
                id="printable-receipt"
                className={`thermal-80-receipt w-[76mm] max-w-[76mm] min-w-[76mm] bg-white text-black p-2.5 text-[11px] leading-snug shadow-2xl border border-gray-400 rounded-sm select-none ${
                  isUrdu ? 'font-nastaliq' : 'font-mono'
                }`}
              >
                {/* Header */}
                <div className="text-center pb-1.5 border-b-2 border-black">
                  {businessProfile.logoUrl && (
                    <div className="flex justify-center mb-1.5">
                      <img
                        src={businessProfile.logoUrl}
                        alt="Shop Logo"
                        className="max-h-12 w-auto object-contain filter grayscale contrast-125"
                      />
                    </div>
                  )}
                  <div className={`font-black leading-tight ${isUrdu ? 'text-[17px]' : 'text-[13px] uppercase tracking-wide'}`}>
                    {shopName}
                  </div>
                  {shopTagline && (
                    <div className="text-[10px] text-gray-700 mt-0.5 leading-tight">
                      {shopTagline}
                    </div>
                  )}
                  {shopAddress && (
                    <div className="text-[9.5px] mt-0.5 leading-tight">
                      {shopAddress}
                    </div>
                  )}
                  <div className="text-[10px] font-bold mt-0.5" dir="ltr">
                    {isUrdu ? `فون: ${businessProfile.phone} | واٹس ایپ: ${businessProfile.whatsapp}` : `Tel: ${businessProfile.phone} | WA: ${businessProfile.whatsapp}`}
                  </div>
                  {businessProfile.ntn && (
                    <div className="text-[9px] font-mono mt-0.5">
                      {isUrdu ? `این ٹی این: ${businessProfile.ntn}` : `NTN: ${businessProfile.ntn}`}
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="py-1.5 border-b border-dashed border-black text-[10px] space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{invoiceNoLabel}</span>
                    <span className="font-black font-mono text-[11px]">#{invoice.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{dateLabel}</span>
                    <span className="font-mono text-[9.5px]">
                      {new Date(invoice.date).toLocaleDateString(isUrdu ? 'ur-PK' : 'en-GB')} {new Date(invoice.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="my-1 py-1 px-1.5 bg-gray-100 border border-black rounded-sm space-y-0.5">
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="font-bold">{isUrdu ? 'کاؤنٹر نمبر:' : 'COUNTER:'}</span>
                      <span className="font-black font-mono bg-black text-white px-1.5 py-0.2 rounded-sm text-[11px]">
                        {counterLabel}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10.5px] border-t border-gray-300 pt-0.5">
                      <span className="font-bold">{cashierTitle}</span>
                      <span className="font-black truncate max-w-[170px]">{cashierLabel}</span>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-bold">{customerTitle}</span>
                    <span className="font-bold truncate max-w-[170px]">{custName}</span>
                  </div>
                  {invoice.customerPhone && (
                    <div className="flex justify-between font-mono">
                      <span>{phoneTitle}</span>
                      <span>{invoice.customerPhone}</span>
                    </div>
                  )}
                  {invoice.tableNo && (
                    <div className="flex justify-between font-bold">
                      <span>{tableTitle}</span>
                      <span className="font-mono">{invoice.tableNo}</span>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div className="py-1 border-b-2 border-black">
                  <table className={`w-full border-collapse ${isUrdu ? 'text-right' : 'text-left'}`}>
                    <thead>
                      <tr className="border-b border-black text-[10px] font-black uppercase">
                        <th className="py-0.5 w-[50%]">{colItemDesc}</th>
                        <th className="py-0.5 text-center w-[16%]">{colQty}</th>
                        <th className="py-0.5 text-right w-[17%]">{colRate}</th>
                        <th className="py-0.5 text-right w-[17%]">{colTotal}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, idx) => {
                        const itemName = isUrdu ? (item.nameUr || item.nameEn) : (item.nameEn || item.nameUr);
                        return (
                          <tr key={idx} className="border-b border-dotted border-gray-400">
                            <td className="py-1 pr-1 align-top">
                              <div className="font-bold text-[10.5px] leading-tight">
                                {itemName}
                              </div>
                              {item.isGram && (
                                <div className="text-[9px] font-bold text-black border border-black/40 bg-gray-50 px-1 py-0.2 rounded-xs mt-0.5 inline-block">
                                  {isUrdu
                                    ? `وزن: ${item.weightInGrams || item.quantity} گرام (فی کلو: ${item.ratePerKg || item.unitPrice} روپے)`
                                    : `Wt: ${item.weightInGrams || item.quantity}g (Rate/Kg: Rs. ${item.ratePerKg || item.unitPrice})`}
                                </div>
                              )}
                              {item.isLiter && item.volumeInMl && (
                                <div className="text-[9px] font-bold text-black border border-black/40 bg-gray-50 px-1 py-0.2 rounded-xs mt-0.5 inline-block">
                                  {isUrdu
                                    ? `مقدار: ${item.volumeInMl === 500 ? 'ہاف لیٹر (500ml)' : `${item.volumeInMl}ml`} (فی لیٹر: ${item.ratePerLiter || item.unitPrice} روپے)`
                                    : `Vol: ${item.volumeInMl === 500 ? '500ml (Half Liter)' : `${item.volumeInMl}ml`} (Rate/L: Rs. ${item.ratePerLiter || item.unitPrice})`}
                                </div>
                              )}
                              {item.variationDetails && (
                                <div className="text-[9px] text-gray-600 font-mono">
                                  {item.variationDetails}
                                </div>
                              )}
                            </td>
                            <td className="py-1 text-center font-bold align-top text-[10.5px]">
                              {item.isGram
                                ? `${item.weightInGrams || item.quantity}${isUrdu ? ' گرام' : 'g'}`
                                : item.isLiter && item.volumeInMl
                                ? (item.volumeInMl === 500 ? (isUrdu ? 'ہاف لیٹر' : '500ml') : `${item.volumeInMl}ml`)
                                : `${item.quantity} ${item.unit}`}
                            </td>
                            <td className="py-1 text-right font-mono align-top text-[10px]">
                              {item.ratePerKg || item.ratePerLiter || item.unitPrice}
                            </td>
                            <td className="py-1 text-right font-mono font-bold align-top text-[10.5px]">
                              {item.total.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Totals Breakdown */}
                <div className="py-1.5 border-b border-dashed border-black space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>{subtotalLabel}</span>
                    <span className="font-mono">{invoice.subtotal.toLocaleString()} PKR</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between">
                      <span>{discountLabel}</span>
                      <span className="font-mono font-bold">- {invoice.discount.toLocaleString()} PKR</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[13px] font-black border-t-2 border-b-2 border-black py-1 my-0.5">
                    <span>{totalPayableLabel}</span>
                    <span className="font-mono">{invoice.grandTotal.toLocaleString()} PKR</span>
                  </div>

                  <div className="flex justify-between text-[11px] font-bold">
                    <span>{cashReceivedLabel}</span>
                    <span className="font-mono font-black text-[12px]">
                      {activeTendered.toLocaleString()} PKR
                    </span>
                  </div>

                  {effectiveChange > 0 && (
                    <div className="flex justify-between items-center text-[12px] font-black bg-gray-100 border-2 border-black px-1.5 py-1 rounded-sm my-0.5">
                      <span>{changeReturnLabel}</span>
                      <span className="font-mono font-black text-[13px]">
                        {effectiveChange.toLocaleString()} PKR
                      </span>
                    </div>
                  )}

                  {invoice.balanceDue > 0 && (
                    <div className="flex justify-between items-center text-[11.5px] font-black bg-gray-100 border border-black px-1.5 py-0.5 rounded-sm">
                      <span>{balanceDueLabel}</span>
                      <span className="font-mono font-black text-[12.5px] text-rose-700">
                        {invoice.balanceDue.toLocaleString()} PKR
                      </span>
                    </div>
                  )}

                  {invoice.previousBalance && invoice.previousBalance > 0 && (
                    <div className="flex justify-between text-[10px] text-gray-700 pt-0.5 border-t border-gray-300">
                      <span>{isUrdu ? 'سابقہ ادھار کھاتہ:' : 'Previous Khata Balance:'}</span>
                      <span className="font-mono">{invoice.previousBalance.toLocaleString()} PKR</span>
                    </div>
                  )}
                  {invoice.netTotalDebt && invoice.netTotalDebt > 0 && (
                    <div className="flex justify-between text-[11px] font-bold">
                      <span>{isUrdu ? 'کل واجب الادا قرضہ:' : 'Net Total Debt Due:'}</span>
                      <span className="font-mono text-rose-700">{invoice.netTotalDebt.toLocaleString()} PKR</span>
                    </div>
                  )}
                </div>

                {/* Barcode & QR Code Section */}
                <div className="pt-2 text-center space-y-1">
                  {showBarcode && barcodeDataUrl && (
                    <div className="flex justify-center">
                      <img src={barcodeDataUrl} alt="Barcode" className="max-h-11 w-auto" />
                    </div>
                  )}
                  {showQrCode && qrDataUrl && (
                    <div className="flex justify-center">
                      <img src={qrDataUrl} alt="QR Code" className="w-20 h-20" />
                    </div>
                  )}
                </div>

                {/* Footer Note */}
                <div className="mt-2 pt-1 border-t border-black text-center text-[9.5px] leading-tight text-gray-800">
                  <p>{footerNote}</p>
                </div>

                {/* Developer & Software Prominent Branding */}
                <div className="mt-2.5 pt-2 border-t-2 border-black text-center space-y-0.5">
                  <div className="text-[10.5px] font-black uppercase tracking-wider text-black">
                    ★ OneShop POS v2.0 PRO ★
                  </div>
                  <div className="text-[9.5px] font-bold text-black">
                    {isUrdu ? 'ادارہ: JK Developers پاکستان' : 'JK Developers Pakistan'}
                  </div>
                  <div className="text-[9.5px] font-mono font-black text-black">
                    {isUrdu ? 'سرکاری ہیلپ لائن: 0300-8998381' : 'Official Helpline: +92 300 8998381'}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 2. THERMAL 58MM RECEIPT                                   */}
            {/* ========================================================= */}
            {format === 'thermal58' && (
              <div
                dir={isUrdu ? 'rtl' : 'ltr'}
                id="printable-receipt"
                className={`thermal-58-receipt w-[54mm] max-w-[54mm] min-w-[54mm] bg-white text-black p-1.5 text-[9.5px] leading-snug shadow-2xl border border-gray-400 rounded-sm select-none ${
                  isUrdu ? 'font-nastaliq' : 'font-mono'
                }`}
              >
                <div className="text-center pb-1 border-b border-black">
                  <div className="font-black text-[13px] leading-tight">{shopName}</div>
                  <div className="text-[9px] font-bold mt-0.5" dir="ltr">
                    {businessProfile.phone}
                  </div>
                </div>

                <div className="py-1 border-b border-dashed border-black text-[8.5px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>{invoiceNoLabel}</span>
                    <span className="font-mono font-bold">#{invoice.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{counterLabel}</span>
                    <span className="font-bold">{cashierLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{custName}</span>
                    <span className="font-mono">{new Date(invoice.date).toLocaleDateString(isUrdu ? 'ur-PK' : 'en-GB')}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="py-1 border-b border-black">
                  <table className={`w-full text-[9px] ${isUrdu ? 'text-right' : 'text-left'}`}>
                    <thead>
                      <tr className="border-b border-black font-bold">
                        <th className="w-[55%]">{colItemDesc}</th>
                        <th className="text-center w-[20%]">{colQty}</th>
                        <th className="text-right w-[25%]">{colTotal}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-dotted border-gray-300">
                          <td className="py-0.5 truncate max-w-[100px]">
                            {isUrdu ? (item.nameUr || item.nameEn) : (item.nameEn || item.nameUr)}
                          </td>
                          <td className="py-0.5 text-center font-bold">
                            {item.isGram
                              ? `${item.weightInGrams || item.quantity}g`
                              : item.isLiter && item.volumeInMl
                              ? (item.volumeInMl === 500 ? '500ml' : `${item.volumeInMl}ml`)
                              : item.quantity}
                          </td>
                          <td className="py-0.5 text-right font-mono font-bold">
                            {item.total.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div className="py-1 border-b border-black space-y-0.5 text-[9.5px]">
                  <div className="flex justify-between font-black text-[11px]">
                    <span>{totalPayableLabel}</span>
                    <span className="font-mono">{invoice.grandTotal.toLocaleString()} PKR</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>{cashReceivedLabel}</span>
                    <span className="font-mono">{activeTendered.toLocaleString()} PKR</span>
                  </div>
                  {effectiveChange > 0 && (
                    <div className="flex justify-between font-black bg-gray-100 border border-black p-0.5 rounded-sm">
                      <span>{changeReturnLabel}</span>
                      <span className="font-mono text-[10.5px]">{effectiveChange.toLocaleString()} PKR</span>
                    </div>
                  )}
                  {invoice.balanceDue > 0 && (
                    <div className="flex justify-between font-bold bg-gray-100 p-0.5 text-rose-700">
                      <span>{balanceDueLabel}</span>
                      <span className="font-mono">{invoice.balanceDue.toLocaleString()} PKR</span>
                    </div>
                  )}
                </div>

                <div className="mt-1 pt-1 text-center text-[8.5px] leading-tight">
                  <p>{footerNote}</p>
                </div>

                {/* Software & Developer Prominent Branding */}
                <div className="mt-2 pt-1 border-t-2 border-black text-center space-y-0.5 text-[8.5px]">
                  <div className="font-black text-black">★ OneShop POS v2.0 PRO ★</div>
                  <div className="font-bold text-black">
                    {isUrdu ? 'JK Developers پاکستان' : 'JK Developers Pakistan'}
                  </div>
                  <div className="font-mono font-bold text-black">0300-8998381</div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 3. A4 FULL PAGE INVOICE                                   */}
            {/* ========================================================= */}
            {format === 'a4' && (
              <div
                dir={isUrdu ? 'rtl' : 'ltr'}
                id="printable-receipt"
                className={`a4-receipt w-full max-w-[210mm] bg-white text-black p-8 text-xs shadow-2xl border border-gray-400 select-none ${
                  isUrdu ? 'font-nastaliq' : 'font-sans'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b-2 border-emerald-600">
                  <div>
                    <h1 className="text-2xl font-black text-emerald-800">{shopName}</h1>
                    {shopTagline && <p className="text-xs text-gray-600">{shopTagline}</p>}
                    <p className="text-xs text-gray-700 mt-1">{shopAddress}</p>
                    <p className="text-xs font-bold font-mono" dir="ltr">
                      Tel: {businessProfile.phone} | WhatsApp: {businessProfile.whatsapp}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-emerald-700 text-white font-bold rounded-lg text-sm uppercase">
                      {isUrdu ? 'سیلز رسید / ٹیکس انوائس' : 'TAX INVOICE'}
                    </span>
                    <div className="mt-2 text-xs font-mono">
                      <div><strong>{invoiceNoLabel}</strong> #{invoice.invoiceNo}</div>
                      <div><strong>{dateLabel}</strong> {new Date(invoice.date).toLocaleDateString(isUrdu ? 'ur-PK' : 'en-GB')}</div>
                      <div><strong>{counterLabel}</strong> | {cashierLabel}</div>
                    </div>
                  </div>
                </div>

                {/* Customer Meta */}
                <div className="my-4 p-3 bg-gray-50 border border-gray-200 rounded-xl flex justify-between">
                  <div>
                    <span className="text-gray-500 block text-[11px]">{customerTitle}</span>
                    <span className="font-black text-sm">{custName}</span>
                    {invoice.customerPhone && <span className="block text-xs font-mono">{invoice.customerPhone}</span>}
                  </div>
                  {invoice.tableNo && (
                    <div className="text-right">
                      <span className="text-gray-500 block text-[11px]">{tableTitle}</span>
                      <span className="font-black text-sm">{invoice.tableNo}</span>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <table className={`w-full border-collapse my-4 ${isUrdu ? 'text-right' : 'text-left'}`}>
                  <thead>
                    <tr className="bg-emerald-800 text-white text-xs uppercase">
                      <th className="p-2.5 w-[8%] text-center">#</th>
                      <th className="p-2.5 w-[50%]">{colItemDesc}</th>
                      <th className="p-2.5 w-[14%] text-center">{colQty}</th>
                      <th className="p-2.5 w-[14%] text-right">{colRate}</th>
                      <th className="p-2.5 w-[14%] text-right">{colTotal}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-2.5 text-center font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-bold">
                          {isUrdu ? (item.nameUr || item.nameEn) : (item.nameEn || item.nameUr)}
                          {item.isGram && (
                            <span className="block text-[11px] text-gray-500 font-normal">
                              وزن: {item.weightInGrams}g (فی کلو: {item.ratePerKg || item.unitPrice} PKR)
                            </span>
                          )}
                          {item.isLiter && item.volumeInMl && (
                            <span className="block text-[11px] text-gray-500 font-normal">
                              مقدار: {item.volumeInMl}ml (فی لیٹر: {item.ratePerLiter || item.unitPrice} PKR)
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-bold">
                          {item.isGram ? `${item.weightInGrams}g` : item.isLiter && item.volumeInMl ? `${item.volumeInMl}ml` : `${item.quantity} ${item.unit}`}
                        </td>
                        <td className="p-2.5 text-right font-mono">
                          {((item.ratePerKg || item.ratePerLiter || item.unitPrice) || 0).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-mono font-black">
                          {item.total.toLocaleString()} PKR
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end my-4">
                  <div className="w-72 space-y-1.5 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs">
                    <div className="flex justify-between">
                      <span>{subtotalLabel}</span>
                      <span className="font-mono">{invoice.subtotal.toLocaleString()} PKR</span>
                    </div>
                    {invoice.discount > 0 && (
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>{discountLabel}</span>
                        <span className="font-mono">-{invoice.discount.toLocaleString()} PKR</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black border-t-2 border-emerald-600 pt-1">
                      <span>{totalPayableLabel}</span>
                      <span className="font-mono text-emerald-800">{invoice.grandTotal.toLocaleString()} PKR</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-200 font-bold">
                      <span>{cashReceivedLabel}</span>
                      <span className="font-mono">{activeTendered.toLocaleString()} PKR</span>
                    </div>
                    {effectiveChange > 0 && (
                      <div className="flex justify-between font-black bg-emerald-100 border border-emerald-500 p-1 rounded text-emerald-900">
                        <span>{changeReturnLabel}</span>
                        <span className="font-mono text-base">{effectiveChange.toLocaleString()} PKR</span>
                      </div>
                    )}
                    {invoice.balanceDue > 0 && (
                      <div className="flex justify-between font-bold bg-rose-100 text-rose-800 p-1 rounded">
                        <span>{balanceDueLabel}</span>
                        <span className="font-mono">{invoice.balanceDue.toLocaleString()} PKR</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t-2 border-emerald-600 space-y-3">
                  <p className="font-bold text-center text-xs text-gray-700">{footerNote}</p>
                  <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black text-sm shadow-sm">
                        JK
                      </div>
                      <div>
                        <div className="font-black text-emerald-950 text-sm">OneShop POS v2.0 PRO</div>
                        <div className="text-gray-600 text-[11px]">
                          {isUrdu ? 'طاقتور کمپیوٹرائزڈ پوائنٹ آف سیل و انوائسنگ سسٹم' : 'Enterprise Point of Sale & Billing Solution'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-black text-slate-900 text-xs">
                        {isUrdu ? 'ادارہ: JK Developers پاکستان' : 'JK Developers Pakistan'}
                      </div>
                      <div className="text-emerald-700 font-black text-xs mt-0.5">
                        {isUrdu ? 'سرکاری رابطہ و ہیلپ لائن: 0300-8998381' : 'Official Helpline: +92 300 8998381'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 4. A5 HALF-PAGE INVOICE                                   */}
            {/* ========================================================= */}
            {format === 'a5' && (
              <div
                dir={isUrdu ? 'rtl' : 'ltr'}
                id="printable-receipt"
                className={`a5-receipt w-full max-w-[148mm] bg-white text-black p-5 text-xs shadow-2xl border border-gray-400 select-none ${
                  isUrdu ? 'font-nastaliq' : 'font-sans'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b-2 border-emerald-600">
                  <div>
                    <h2 className="text-lg font-black text-emerald-800">{shopName}</h2>
                    <p className="text-[11px] text-gray-700">{shopAddress}</p>
                    <p className="text-[11px] font-mono" dir="ltr">Tel: {businessProfile.phone}</p>
                  </div>
                  <div className="text-right text-[11px] font-mono">
                    <span className="px-2 py-0.5 bg-emerald-700 text-white font-bold rounded text-[10px]">
                      {isUrdu ? 'رسید بل' : 'INVOICE'}
                    </span>
                    <div className="mt-1">#{invoice.invoiceNo}</div>
                    <div>{new Date(invoice.date).toLocaleDateString(isUrdu ? 'ur-PK' : 'en-GB')}</div>
                  </div>
                </div>

                <div className="my-2 p-2 bg-gray-50 border border-gray-200 rounded text-[11px] flex justify-between">
                  <div>{customerTitle} <strong>{custName}</strong></div>
                  <div>{counterLabel} | {cashierLabel}</div>
                </div>

                <table className={`w-full border-collapse my-2 text-[11px] ${isUrdu ? 'text-right' : 'text-left'}`}>
                  <thead>
                    <tr className="bg-emerald-800 text-white">
                      <th className="p-1 w-[55%]">{colItemDesc}</th>
                      <th className="p-1 text-center w-[15%]">{colQty}</th>
                      <th className="p-1 text-right w-[15%]">{colRate}</th>
                      <th className="p-1 text-right w-[15%]">{colTotal}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200">
                        <td className="p-1 font-bold truncate max-w-[150px]">
                          {isUrdu ? (item.nameUr || item.nameEn) : (item.nameEn || item.nameUr)}
                        </td>
                        <td className="p-1 text-center">
                          {item.isGram ? `${item.weightInGrams}g` : item.isLiter && item.volumeInMl ? `${item.volumeInMl}ml` : item.quantity}
                        </td>
                        <td className="p-1 text-right font-mono">
                          {item.ratePerKg || item.ratePerLiter || item.unitPrice}
                        </td>
                        <td className="p-1 text-right font-mono font-bold">
                          {item.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end my-2">
                  <div className="w-56 space-y-1 p-2 bg-gray-50 border border-gray-200 rounded text-[11px]">
                    <div className="flex justify-between font-black text-sm border-b border-black pb-0.5">
                      <span>{totalPayableLabel}</span>
                      <span className="font-mono">{invoice.grandTotal.toLocaleString()} PKR</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>{cashReceivedLabel}</span>
                      <span className="font-mono">{activeTendered.toLocaleString()} PKR</span>
                    </div>
                    {effectiveChange > 0 && (
                      <div className="flex justify-between font-black bg-emerald-100 border border-emerald-500 p-0.5 rounded text-emerald-900">
                        <span>{changeReturnLabel}</span>
                        <span className="font-mono">{effectiveChange.toLocaleString()} PKR</span>
                      </div>
                    )}
                    {invoice.balanceDue > 0 && (
                      <div className="flex justify-between font-bold bg-rose-100 text-rose-800 p-0.5 rounded">
                        <span>{balanceDueLabel}</span>
                        <span className="font-mono">{invoice.balanceDue.toLocaleString()} PKR</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t-2 border-emerald-600 space-y-2">
                  <p className="text-[10px] text-gray-700 text-center">{footerNote}</p>
                  <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-black text-emerald-900">★ OneShop POS v2.0 PRO ★</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold">{isUrdu ? 'JK Developers پاکستان' : 'JK Developers Pakistan'}</span>
                      <span className="mx-1">•</span>
                      <span className="font-black text-emerald-700">0300-8998381</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
