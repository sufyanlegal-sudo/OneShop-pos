'use client';

import React, { useState, useEffect } from 'react';
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

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>('');

  // Generate QR Code and Barcode images whenever modal opens or invoice changes
  useEffect(() => {
    if (!isOpen || !invoice) return;

    // 1. Generate QR Code
    const qrPayload = JSON.stringify({
      software: businessProfile.softwareName || 'OneShop POS',
      dev: 'JK Developers Pakistan (03008998381)',
      shop: businessProfile.nameUr || businessProfile.nameEn,
      inv: invoice.invoiceNo,
      date: invoice.date,
      total: invoice.grandTotal,
      paid: invoice.paidAmount,
      balance: invoice.balanceDue,
      counter: invoice.counterNumber !== undefined ? invoice.counterNumber : 1,
    });

    QRCodeLib.toDataURL(qrPayload, {
      width: 130,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR:', err));

    // 2. Generate Barcode as DataURL via offscreen canvas
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, invoice.invoiceNo, {
        format: 'CODE128',
        width: 1.5,
        height: 36,
        displayValue: true,
        fontSize: 10,
        margin: 2,
        background: '#ffffff',
        lineColor: '#000000',
      });
      setBarcodeDataUrl(canvas.toDataURL('image/png'));
    } catch (e) {
      console.error('Error generating Barcode:', e);
    }
  }, [isOpen, invoice, businessProfile]);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const custName = invoice.customerName || (lang === 'ur' ? 'محترم گاہک' : 'Customer');
  const counterLabel = invoice.counterNumber !== undefined ? (invoice.counterNumber === 0 ? 'Admin (مینجر)' : `کاؤنٹر #${invoice.counterNumber}`) : 'کاؤنٹر #1';
  const cashierLabel = invoice.cashier || 'کیشیئر';

  const changeAmount = (invoice.changeDue || ((invoice.tenderedAmount && invoice.tenderedAmount > invoice.grandTotal) ? (invoice.tenderedAmount - invoice.grandTotal) : 0));
  const changeLine = changeAmount > 0 ? `\nبقایا رقم واپس (Change Returned): ${changeAmount.toLocaleString()} روپے` : '';
  const dueLine = invoice.balanceDue > 0 ? `\nبقایا واجب الادا رقم (Balance Due): ${invoice.balanceDue.toLocaleString()} روپے` : '';

  // Exact polite Urdu WhatsApp Notification message
  const whatsAppMessage = `محترم ${custName} صاحب!
آپ کی آج کی خریداری کا بل ${invoice.grandTotal.toLocaleString()} روپے بنا۔
وصول شدہ رقم: ${(invoice.tenderedAmount || invoice.paidAmount).toLocaleString()} روپے${changeLine}${dueLine}
${
  invoice.previousBalance && invoice.previousBalance > 0
    ? `سابقہ بقایا کھاتہ: ${invoice.previousBalance.toLocaleString()} روپے\nکل واجب الادا قرض: ${(invoice.netTotalDebt || 0).toLocaleString()} روپے\n`
    : ''
}-------------------------------
کاؤنٹر نمبر: ${counterLabel}
کیشیئر کا نام: ${cashierLabel}
انوائس نمبر (Invoice #): #${invoice.invoiceNo}
-------------------------------
نوٹ: خریدا ہوا سامان غیر استعمال شدہ حالت میں اصلی رسید کے ہمراہ ایک دن کے اندر واپس یا تبدیل ہو سکتا ہے۔ امپورٹڈ سامان کی کوئی وارنٹی نہیں ہے۔
Note: Goods once sold can be returned, if unused, within one day on providing original receipt. No warranty on imported goods.
-------------------------------
آپ کے تعاون کا شکریہ۔
${businessProfile.nameUr} (${businessProfile.phone})
-------------------------------
سافٹ ویئر: ${businessProfile.softwareName || 'OneShop POS'}
ڈویلپر: JK Developers Pakistan (03008998381)`;

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

  // Helper for cash note denominations breakdown
  const getDenominationsText = () => {
    if (!invoice.currencyDenominations) return null;
    const d = invoice.currencyDenominations;
    const parts: string[] = [];
    if (d.note5000) parts.push(`5000×${d.note5000}`);
    if (d.note1000) parts.push(`1000×${d.note1000}`);
    if (d.note500) parts.push(`500×${d.note500}`);
    if (d.note100) parts.push(`100×${d.note100}`);
    if (d.note50) parts.push(`50×${d.note50}`);
    if (d.note20) parts.push(`20×${d.note20}`);
    if (d.note10) parts.push(`10×${d.note10}`);
    if (d.coins) parts.push(`Coins:${d.coins}`);
    if (parts.length === 0) return null;
    return parts.join(' | ');
  };

  const denominationsSummary = getDenominationsText();

  return (
    <div className="print-modal-wrapper fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 md:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Modal Top Control Bar (Hidden during print) */}
        <div className="no-print p-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">
              {lang === 'ur' ? 'رسید و انوائس پرنٹ سسٹم' : 'Receipt & Invoice Printing'}
            </h3>
            <span className="text-xs bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
              #{invoice.invoiceNo}
            </span>
          </div>

          {/* Format selector buttons */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFormat('thermal80')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                format === 'thermal80'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              80mm تھرمل
            </button>
            <button
              onClick={() => setFormat('thermal58')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                format === 'thermal58'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              58mm تھرمل
            </button>
            <button
              onClick={() => setFormat('a4')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                format === 'a4'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              عام پرنٹر (A4)
            </button>
            <button
              onClick={() => setFormat('a5')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                format === 'a5'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              عام پرنٹر (A5 ہاف پیج)
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Second Control Strip: Print Scaling & Barcode/QR toggles */}
        <div className="no-print px-4 py-2 bg-slate-800/90 text-white border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Zoom / Page Fit Scale */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1">
              <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
              {lang === 'ur' ? 'پیج سائز فٹنگ:' : 'Page Fit Scaling:'}
            </span>
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
              {[
                { val: 100, label: '100% اصل' },
                { val: 90, label: '90% فٹ' },
                { val: 80, label: '80% چھوٹا' },
              ].map((z) => (
                <button
                  key={z.val}
                  type="button"
                  onClick={() => setZoomScale(z.val)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                    zoomScale === z.val
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {z.label}
                </button>
              ))}
            </div>
          </div>

          {/* Barcode & QR code toggles */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showBarcode}
                onChange={(e) => setShowBarcode(e.target.checked)}
                className="rounded accent-emerald-500 w-3.5 h-3.5"
              />
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <BarcodeIcon className="w-3.5 h-3.5 text-slate-400" />
                {lang === 'ur' ? 'بارکوڈ پرنٹ کریں' : 'Print Barcode'}
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showQrCode}
                onChange={(e) => setShowQrCode(e.target.checked)}
                className="rounded accent-emerald-500 w-3.5 h-3.5"
              />
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-slate-400" />
                {lang === 'ur' ? 'کیو آر کوڈ پرنٹ کریں' : 'Print QR Code'}
              </span>
            </label>
          </div>
        </div>

        {/* Action Bar (Hidden during print) */}
        <div className="no-print px-4 py-2 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black flex items-center gap-2 shadow-md active:scale-95 transition-all text-xs"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ur' ? 'پرنٹر پر پرنٹ نکالیں (Print Now)' : 'Print Document'}</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{lang === 'ur' ? 'واٹس ایپ پر رسید بھیجیں' : 'Send WhatsApp'}</span>
            </button>

            <button
              onClick={handleCopyWhatsApp}
              className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-medium flex items-center gap-1.5 hover:bg-slate-300"
            >
              {copiedWhatsApp ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedWhatsApp ? 'کاپی ہو گیا' : 'میسج کاپی'}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            {format === 'thermal80'
              ? 'Roll: 80mm (Standard POS)'
              : format === 'thermal58'
              ? 'Roll: 58mm (Small Thermal)'
              : format === 'a5'
              ? 'Paper: A5 Half-Page (Normal Printer)'
              : 'Paper: A4 Standard (Normal Printer)'}
          </div>
        </div>

        {/* Printable Paper Area */}
        <div className="print-paper-area p-4 md:p-6 overflow-y-auto flex justify-center bg-slate-200 dark:bg-slate-950/70">
          <div
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
                dir="ltr"
                id="printable-receipt"
                className="thermal-80-receipt w-[76mm] max-w-[76mm] min-w-[76mm] bg-white text-black p-2 font-mono text-[11px] leading-snug shadow-2xl border border-gray-400 rounded-sm select-none"
              >
                {/* Header: SHOP LOGO & NAME ONLY ON RECEIPT */}
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
                  <div className="font-nastaliq text-[16px] font-bold leading-tight" dir="rtl">
                    {businessProfile.nameUr}
                  </div>
                  <div className="text-[12px] font-black tracking-tight font-sans uppercase">
                    {businessProfile.nameEn}
                  </div>
                  <div className="text-[9.5px] mt-0.5 leading-tight">
                    {businessProfile.addressEn}
                  </div>
                  <div className="text-[10px] font-bold">
                    Tel: {businessProfile.phone} | WA: {businessProfile.whatsapp}
                  </div>
                  {businessProfile.ntn && (
                    <div className="text-[9px] font-mono">NTN: {businessProfile.ntn}</div>
                  )}
                </div>

                {/* Meta */}
                <div className="py-1.5 border-b border-dashed border-black text-[10px] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[10.5px]">انوائس نمبر (Invoice #):</span>
                    <span className="font-black font-mono text-[11px]">#{invoice.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATE:</span>
                    <span>
                      {new Date(invoice.date).toLocaleDateString()} {new Date(invoice.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* PROMINENT CASHIER & COUNTER NUMBER BADGE */}
                  <div className="my-1 py-1 px-1.5 bg-gray-100 border border-black rounded-sm space-y-0.5">
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="font-bold">کاؤنٹر نمبر / COUNTER:</span>
                      <span className="font-black font-mono bg-black text-white px-1.5 py-0.2 rounded-sm text-[11px]">
                        {invoice.counterNumber !== undefined ? (invoice.counterNumber === 0 ? 'Admin (مینجر)' : `کاؤنٹر #${invoice.counterNumber}`) : 'کاؤنٹر #1'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10.5px] border-t border-gray-300 pt-0.5">
                      <span className="font-bold">کیشیئر / CASHIER:</span>
                      <span className="font-black font-sans truncate max-w-[170px]">
                        {invoice.cashier || 'کیشیئر'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-bold">CUSTOMER:</span>
                    <span className="font-bold font-sans truncate max-w-[170px]">
                      {invoice.customerName}
                    </span>
                  </div>
                  {invoice.customerPhone && (
                    <div className="flex justify-between">
                      <span>PHONE:</span>
                      <span>{invoice.customerPhone}</span>
                    </div>
                  )}
                  {invoice.tableNo && (
                    <div className="flex justify-between font-bold">
                      <span>TABLE / KOT:</span>
                      <span>{invoice.tableNo}</span>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div className="py-1 border-b-2 border-black">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-black text-[10px] font-black uppercase">
                        <th className="py-0.5 w-[50%]">Item Description</th>
                        <th className="py-0.5 text-center w-[16%]">Qty</th>
                        <th className="py-0.5 text-right w-[17%]">Rate</th>
                        <th className="py-0.5 text-right w-[17%]">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-dotted border-gray-400">
                          <td className="py-1 pr-1 font-sans align-top">
                            <div className="font-bold text-[10.5px] leading-tight">
                              {item.nameEn}
                            </div>
                            <div
                              dir="rtl"
                              className="font-nastaliq text-[11px] leading-tight text-gray-800"
                            >
                              {item.nameUr}
                            </div>
                            {item.variationDetails && (
                              <div className="text-[9px] text-gray-600 font-mono">
                                {item.variationDetails}
                              </div>
                            )}
                          </td>
                          <td className="py-1 text-center font-bold align-top text-[10.5px]">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-1 text-right font-mono align-top text-[10px]">
                            {item.unitPrice}
                          </td>
                          <td className="py-1 text-right font-mono font-black align-top text-[10.5px]">
                            {item.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bill Totals & Payment / Baqaya Breakdown */}
                <div className="py-1.5 border-b border-dashed border-black space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Subtotal (سب ٹوٹل):</span>
                    <span className="font-mono">{invoice.subtotal.toLocaleString()} PKR</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between">
                      <span>Discount (رعایت):</span>
                      <span className="font-mono font-bold">- {invoice.discount.toLocaleString()} PKR</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[13px] font-black border-t-2 border-b-2 border-black py-1 my-0.5">
                    <span>TOTAL PAYABLE (کل بل):</span>
                    <span className="font-mono">{invoice.grandTotal.toLocaleString()} PKR</span>
                  </div>

                  {/* Tendered / Cash Received */}
                  <div className="flex justify-between text-[11px]">
                    <span>وصول شدہ رقم ({invoice.paymentMethod === 'CASH' ? 'Cash Received' : invoice.paymentMethod}):</span>
                    <span className="font-mono font-black text-[12px]">
                      {(invoice.tenderedAmount || invoice.paidAmount).toLocaleString()} PKR
                    </span>
                  </div>

                  {/* CHANGE RETURNED (واپسی بقایا) - Prominently highlighted if change is due */}
                  {((invoice.tenderedAmount && invoice.tenderedAmount > invoice.grandTotal) || (invoice.changeDue && invoice.changeDue > 0)) && (
                    <div className="flex justify-between items-center text-[11.5px] font-black bg-gray-100 border border-black px-1.5 py-0.5 rounded-sm">
                      <span>بقایا رقم واپس (CHANGE RETURN):</span>
                      <span className="font-mono font-black text-[12.5px]">
                        {(invoice.changeDue || (invoice.tenderedAmount! - invoice.grandTotal)).toLocaleString()} PKR
                      </span>
                    </div>
                  )}

                  {/* BALANCE DUE (ادھار بقایا) - Prominently highlighted if underpaid */}
                  {invoice.balanceDue > 0 && (
                    <div className="flex justify-between items-center text-[11.5px] font-black bg-gray-100 border border-black px-1.5 py-0.5 rounded-sm">
                      <span>بقایا ادھار واجب الادا (BALANCE DUE):</span>
                      <span className="font-mono font-black text-[12.5px]">
                        {invoice.balanceDue.toLocaleString()} PKR
                      </span>
                    </div>
                  )}
                </div>

                {/* Currency Notes Tendered Breakdown (If Used) */}
                {denominationsSummary && (
                  <div className="py-1 border-b border-dashed border-black text-[9.5px] bg-gray-50 p-1 my-1">
                    <div className="font-bold uppercase tracking-tight text-center">
                      --- Cash Notes Breakdown (وصول شدہ نوٹ) ---
                    </div>
                    <div className="font-mono text-center text-[9px] py-0.5 font-bold">
                      {denominationsSummary}
                    </div>
                    <div className="flex justify-between font-mono pt-0.5 border-t border-dotted border-black">
                      <span>Tendered: {(invoice.tenderedAmount || invoice.paidAmount).toLocaleString()} PKR</span>
                      {invoice.tenderedAmount && invoice.tenderedAmount > invoice.grandTotal && (
                        <span className="font-black">
                          Change Return: {(invoice.tenderedAmount - invoice.grandTotal).toLocaleString()} PKR
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Outstanding Khata Debt (if exists) */}
                {((invoice.previousBalance || 0) > 0 || (invoice.netTotalDebt || 0) > 0) && (
                  <div className="py-1 border-b border-dashed border-black bg-gray-100 p-1 my-1 text-[10px] space-y-0.5">
                    <div className="font-black text-center uppercase tracking-wide">
                      --- Customer Khata Ledger ---
                    </div>
                    <div className="flex justify-between">
                      <span>Previous Outstanding:</span>
                      <span className="font-mono">{(invoice.previousBalance || 0).toLocaleString()} PKR</span>
                    </div>
                    <div className="flex justify-between font-black text-[11px] border-t border-black pt-0.5">
                      <span>NET TOTAL DEBT (کل بقایا):</span>
                      <span className="font-mono">{(invoice.netTotalDebt || 0).toLocaleString()} PKR</span>
                    </div>
                  </div>
                )}

                {/* QR Code & Barcode Section for 80mm */}
                {(showBarcode || showQrCode) && (
                  <div className="py-1.5 border-b border-dashed border-black flex flex-col items-center justify-center gap-1.5">
                    {showBarcode && barcodeDataUrl && (
                      <div className="flex flex-col items-center">
                        <img
                          src={barcodeDataUrl}
                          alt="Invoice Barcode"
                          className="h-9 w-auto object-contain max-w-[200px]"
                        />
                      </div>
                    )}
                    {showQrCode && qrDataUrl && (
                      <div className="flex flex-col items-center gap-0.5">
                        <img
                          src={qrDataUrl}
                          alt="Receipt QR"
                          className="w-16 h-16 object-contain"
                        />
                        <span className="text-[8.5px] text-gray-700 font-mono">Scan to Verify Bill</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Polite Footer & Return Policy Note */}
                <div className="text-center pt-1.5 pb-1 text-[10px] space-y-1">
                  <div className="font-nastaliq text-[12px] font-bold leading-tight" dir="rtl">
                    ہم سے خریداری کرنے کا شکریہ!
                  </div>
                  <div className="font-semibold">Thank you for your business!</div>

                  {/* Return Policy Note Box (Urdu & English) */}
                  <div className="mt-1 pt-1 border-t border-dashed border-gray-400 text-left text-[8.5px] leading-tight space-y-1 bg-gray-50 p-1.5 rounded-sm">
                    <p className="font-nastaliq text-[9.5px] leading-relaxed font-bold text-black" dir="rtl">
                      نوٹ: خریدا ہوا سامان غیر استعمال شدہ حالت میں اصلی رسید کے ہمراہ ایک دن کے اندر واپس یا تبدیل ہو سکتا ہے۔ امپورٹڈ سامان کی کوئی وارنٹی نہیں ہے۔
                    </p>
                    <p className="font-sans text-[7.5px] leading-tight text-gray-800" dir="ltr">
                      <strong>Note:</strong> Goods once sold can be returned, if unused, within one day on providing original receipt. No warranty on imported goods.
                    </p>
                  </div>
                </div>

                {/* MANDATORY DEVELOPER BRANDING SPECIFICATION */}
                <div className="border-t-2 border-b-2 border-black py-1 my-1 text-center font-sans">
                  <div className="font-black text-[10.5px] tracking-widest uppercase">
                    {businessProfile.softwareName || 'OneShop POS'}
                  </div>
                  <div className="font-bold text-[9.5px] uppercase tracking-wide text-gray-800">
                    Developed by JK Developers Pakistan
                  </div>
                  <div className="text-[8.5px] font-mono text-gray-700">
                    Helpline: 03008998381
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 2. THERMAL 58MM RECEIPT                                   */}
            {/* ========================================================= */}
            {format === 'thermal58' && (
              <div
                dir="ltr"
                id="printable-receipt"
                className="thermal-58-receipt w-[52mm] max-w-[52mm] min-w-[52mm] bg-white text-black p-1 font-mono text-[9.5px] leading-tight shadow-2xl border border-gray-400 rounded-sm select-none"
              >
                {/* Header: Shop Logo & Name */}
                <div className="text-center pb-1 border-b border-black">
                  {businessProfile.logoUrl && (
                    <div className="flex justify-center mb-1">
                      <img
                        src={businessProfile.logoUrl}
                        alt="Shop Logo"
                        className="max-h-10 w-auto object-contain filter grayscale contrast-125"
                      />
                    </div>
                  )}
                  <div className="font-nastaliq text-[13px] font-bold leading-tight" dir="rtl">
                    {businessProfile.nameUr}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-tight">
                    {businessProfile.nameEn}
                  </div>
                  <div className="text-[8.5px]">Tel: {businessProfile.phone}</div>
                </div>

                {/* Meta */}
                <div className="py-1 border-b border-dashed border-black text-[9px] space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">انوائس / Invoice #:</span>
                    <span className="font-black font-mono">#{invoice.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATE:</span>
                    <span>{new Date(invoice.date).toLocaleDateString()}</span>
                  </div>

                  {/* PROMINENT CASHIER & COUNTER NUMBER BADGE 58mm */}
                  <div className="my-0.5 py-0.5 px-1 bg-gray-100 border border-black rounded-sm space-y-0.5 text-[9px]">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">کاؤنٹر / CTR:</span>
                      <span className="font-black font-mono bg-black text-white px-1 rounded text-[9.5px]">
                        {invoice.counterNumber !== undefined ? (invoice.counterNumber === 0 ? 'Admin' : `#${invoice.counterNumber}`) : '#1'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-300 pt-0.5">
                      <span className="font-bold">کیشیئر / CSH:</span>
                      <span className="font-black truncate max-w-[110px]">{invoice.cashier || 'کیشیئر'}</span>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span>CUST:</span>
                    <span className="font-bold truncate max-w-[120px]">{invoice.customerName}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="py-1 border-b border-black">
                  <table className="w-full text-left border-collapse text-[9px]">
                    <thead>
                      <tr className="border-b border-black font-black uppercase">
                        <th className="py-0.5 w-[52%]">Item</th>
                        <th className="py-0.5 text-center w-[18%]">Qty</th>
                        <th className="py-0.5 text-right w-[30%]">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-dotted border-gray-300">
                          <td className="py-0.5 pr-0.5 font-sans align-top">
                            <div className="font-bold text-[9px] leading-tight">{item.nameEn}</div>
                            <div dir="rtl" className="font-nastaliq text-[9.5px] leading-tight">
                              {item.nameUr}
                            </div>
                          </td>
                          <td className="py-0.5 text-center font-bold align-top">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-0.5 text-right font-mono font-black align-top">
                            {item.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals & Baqaya Breakdown 58mm */}
                <div className="py-1 border-b border-dashed border-black space-y-0.5 text-[9.5px]">
                  <div className="flex justify-between font-black border-t border-b border-black py-0.5">
                    <span>TOTAL (کل بل):</span>
                    <span className="font-mono">{invoice.grandTotal.toLocaleString()} PKR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>وصول (Tendered):</span>
                    <span className="font-mono font-bold">{(invoice.tenderedAmount || invoice.paidAmount).toLocaleString()} PKR</span>
                  </div>

                  {/* Change Return (واپسی بقایا) */}
                  {((invoice.tenderedAmount && invoice.tenderedAmount > invoice.grandTotal) || (invoice.changeDue && invoice.changeDue > 0)) && (
                    <div className="flex justify-between font-black border border-black px-1 py-0.2 bg-gray-100 text-[10px]">
                      <span>بقایا واپس (Change):</span>
                      <span className="font-mono">{(invoice.changeDue || (invoice.tenderedAmount! - invoice.grandTotal)).toLocaleString()} PKR</span>
                    </div>
                  )}

                  {/* Balance Due (ادھار بقایا) */}
                  {invoice.balanceDue > 0 && (
                    <div className="flex justify-between font-black border border-black px-1 py-0.2 bg-gray-100 text-[10px]">
                      <span>بقایا ادھار (Due):</span>
                      <span className="font-mono">{invoice.balanceDue.toLocaleString()} PKR</span>
                    </div>
                  )}

                  {denominationsSummary && (
                    <div className="text-[8.5px] border-t border-dotted border-black pt-0.5">
                      <span>Notes: {denominationsSummary}</span>
                    </div>
                  )}
                  {(invoice.netTotalDebt || 0) > 0 && (
                    <div className="flex justify-between font-black border-t border-dotted border-black pt-0.5">
                      <span>کل بقایا کھاتہ:</span>
                      <span className="font-mono">{(invoice.netTotalDebt || 0).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* 58mm Barcode or QR */}
                {(showBarcode || showQrCode) && (
                  <div className="py-1 border-b border-dashed border-black flex flex-col items-center justify-center gap-1">
                    {showBarcode && barcodeDataUrl && (
                      <img src={barcodeDataUrl} alt="Barcode" className="h-7 w-auto object-contain max-w-[150px]" />
                    )}
                    {showQrCode && qrDataUrl && (
                      <img src={qrDataUrl} alt="QR" className="w-12 h-12 object-contain" />
                    )}
                  </div>
                )}

                {/* Footer & Return Policy Note */}
                <div className="text-center pt-1 text-[8.5px] space-y-0.5 border-t border-dotted border-gray-400">
                  <div className="font-nastaliq text-[10.5px] font-bold" dir="rtl">خریداری کا شکریہ!</div>
                  <div className="font-semibold text-[8px]">Thank you for your business!</div>
                  <div className="pt-0.5 text-left text-[7.5px] leading-tight space-y-0.5 bg-gray-50 p-1 rounded-sm border border-gray-300">
                    <p className="font-nastaliq text-[8.5px] leading-tight font-bold" dir="rtl">
                      نوٹ: خریدا ہوا سامان اصلی رسید کے ساتھ 1 دن میں قابلِ واپسی ہے۔ امپورٹڈ اشیاء کی وارنٹی نہیں۔
                    </p>
                    <p className="font-sans text-[6.5px] leading-tight text-gray-800" dir="ltr">
                      Note: Goods returnable within 1 day if unused with bill. No warranty on imported goods.
                    </p>
                  </div>
                </div>

                {/* MANDATORY DEVELOPER BRANDING SPECIFICATION */}
                <div className="border-t border-black pt-1 mt-0.5 text-center font-sans">
                  <div className="font-black text-[9px] uppercase">
                    {businessProfile.softwareName || 'OneShop POS'}
                  </div>
                  <div className="text-[8px] uppercase font-bold text-gray-800">
                    JK Developers Pakistan
                  </div>
                  <div className="text-[7.5px] font-mono">03008998381</div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 3. PROFESSIONAL A4 INVOICE (NORMAL PRINTER)               */}
            {/* ========================================================= */}
            {format === 'a4' && (
              <div
                dir="ltr"
                id="printable-receipt"
                className="a4-receipt w-full max-w-[780px] bg-white text-black p-8 font-sans text-xs shadow-2xl border border-gray-300 rounded-sm"
              >
                {/* Header: Shop Name & Details */}
                <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
                  <div className="flex items-start gap-4">
                    {businessProfile.logoUrl && (
                      <div className="p-1 border border-gray-300 rounded bg-white">
                        <img
                          src={businessProfile.logoUrl}
                          alt="Shop Logo"
                          className="h-16 w-auto max-w-[120px] object-contain"
                        />
                      </div>
                    )}
                    <div>
                      <div className="font-nastaliq text-2xl font-bold text-black leading-tight" dir="rtl">
                        {businessProfile.nameUr}
                      </div>
                      <h1 className="text-xl font-black uppercase tracking-tight text-black">
                        {businessProfile.nameEn}
                      </h1>
                      <p className="text-xs text-gray-700 mt-1">{businessProfile.addressEn}</p>
                      <p className="text-xs text-gray-800">
                        Phone: {businessProfile.phone} | WhatsApp: {businessProfile.whatsapp}
                      </p>
                      {businessProfile.ntn && (
                        <p className="text-xs text-gray-700 font-mono">NTN / Tax Reg: {businessProfile.ntn}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <div className="text-xl font-black uppercase tracking-wider text-black">
                      انوائس / INVOICE
                    </div>
                    <div className="flex items-center gap-1 font-mono text-base font-black text-black">
                      <span className="font-sans text-xs font-bold text-gray-700">انوائس نمبر (Invoice #):</span>
                      <span>#{invoice.invoiceNo}</span>
                    </div>
                    <div className="text-xs text-gray-700 mt-1">
                      Date: {new Date(invoice.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-700">
                      Time: {new Date(invoice.date).toLocaleTimeString()}
                    </div>
                    <div className="text-xs font-bold uppercase mt-1 px-2 py-0.5 border border-black inline-block">
                      Status: {invoice.paymentMethod}
                    </div>

                    {/* Barcode in A4 Header */}
                    {showBarcode && barcodeDataUrl && (
                      <div className="mt-2">
                        <img src={barcodeDataUrl} alt="Barcode" className="h-10 object-contain" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Box */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3.5 border-2 border-black mb-4 text-xs rounded-sm">
                  <div>
                    <span className="font-black uppercase text-gray-700 block text-[11px]">گاہک کی تفصیل (Billed To):</span>
                    <div className="font-black text-base text-black mt-0.5">{invoice.customerName}</div>
                    <div className="text-gray-700 text-xs mt-0.5 font-medium">فون نمبر: {invoice.customerPhone || 'N/A'}</div>
                    {businessProfile.branch && (
                      <div className="text-gray-600 text-[11px] mt-0.5">برانچ: {businessProfile.branch}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end justify-center">
                    <div className="bg-white p-2.5 border-2 border-black rounded shadow-sm text-right min-w-[240px]">
                      <div className="flex justify-between items-center gap-3 text-xs border-b border-gray-300 pb-1 mb-1">
                        <span className="font-black text-gray-800">کاؤنٹر نمبر (Counter #):</span>
                        <span className="font-black font-mono text-white bg-black px-2.5 py-0.5 rounded text-sm">
                          {invoice.counterNumber !== undefined ? (invoice.counterNumber === 0 ? 'Admin (مینجر کاؤنٹر)' : `Counter #${invoice.counterNumber}`) : 'Counter #1'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-3 text-xs">
                        <span className="font-black text-gray-800">کیشیئر کا نام (Cashier):</span>
                        <span className="font-black text-black text-sm">{invoice.cashier || 'کیشیئر'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left text-xs mb-4 border-collapse">
                  <thead>
                    <tr className="bg-black text-white">
                      <th className="p-2 w-8">#</th>
                      <th className="p-2">Item Description / تفصیل</th>
                      <th className="p-2 text-center w-24">Qty</th>
                      <th className="p-2 text-right w-28">Rate (PKR)</th>
                      <th className="p-2 text-right w-28">Total (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-300">
                        <td className="p-2 font-mono text-gray-600">{idx + 1}</td>
                        <td className="p-2">
                          <div className="font-bold">{item.nameEn}</div>
                          <div className="font-nastaliq text-xs text-gray-800" dir="rtl">
                            {item.nameUr}
                          </div>
                          {item.variationDetails && (
                            <div className="text-[11px] text-gray-600 font-mono">
                              {item.variationDetails}
                            </div>
                          )}
                        </td>
                        <td className="p-2 text-center font-bold">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-2 text-right font-mono">{item.unitPrice.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono font-bold">
                          {item.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals & Notes Breakdown */}
                <div className="flex justify-between items-start gap-6 border-t-2 border-black pt-3">
                  <div className="w-1/2 space-y-2">
                    {/* Customer Khata Ledger */}
                    <div className="bg-gray-50 p-3 border border-black text-xs">
                      <div className="font-bold uppercase mb-1">Customer Khata Ledger (کھاتہ):</div>
                      <div className="flex justify-between text-gray-700">
                        <span>Previous Khata Balance:</span>
                        <span className="font-mono">{(invoice.previousBalance || 0).toLocaleString()} PKR</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Current Unpaid Balance:</span>
                        <span className="font-mono">{invoice.balanceDue.toLocaleString()} PKR</span>
                      </div>
                      <div className="flex justify-between font-black border-t border-black pt-1 mt-1 text-sm">
                        <span>NET TOTAL DEBT (کل بقایا):</span>
                        <span className="font-mono">{(invoice.netTotalDebt || 0).toLocaleString()} PKR</span>
                      </div>
                    </div>

                    {/* Notes Breakdown */}
                    {denominationsSummary && (
                      <div className="bg-gray-50 p-2.5 border border-black text-[11px] font-mono">
                        <span className="font-bold block uppercase text-[10px] font-sans">Cash Notes Breakdown (وصول شدہ نوٹ):</span>
                        <div className="font-bold text-gray-800">{denominationsSummary}</div>
                        <div className="flex justify-between pt-1 mt-1 border-t border-gray-300">
                          <span>Total Cash Received: {(invoice.tenderedAmount || invoice.paidAmount).toLocaleString()} PKR</span>
                          {invoice.tenderedAmount && invoice.tenderedAmount > invoice.grandTotal && (
                            <span className="font-black">Change Returned: {(invoice.tenderedAmount - invoice.grandTotal).toLocaleString()} PKR</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* QR Code in A4 */}
                    {showQrCode && qrDataUrl && (
                      <div className="flex items-center gap-3 pt-2">
                        <img src={qrDataUrl} alt="QR Code" className="w-16 h-16 object-contain border border-black p-0.5" />
                        <div className="text-[10px] text-gray-600">
                          <p className="font-bold text-black">Digital Bill Verification</p>
                          <p>Scan to verify authenticity of this invoice</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="w-1/2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-mono">{invoice.subtotal.toLocaleString()} PKR</span>
                    </div>
                    {invoice.discount > 0 && (
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span className="font-mono">- {invoice.discount.toLocaleString()} PKR</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black border-t-2 border-b-2 border-black py-1.5 my-1">
                      <span>GRAND TOTAL (کل قابلِ ادا بل):</span>
                      <span className="font-mono">{invoice.grandTotal.toLocaleString()} PKR</span>
                    </div>

                    <div className="flex justify-between text-xs py-0.5">
                      <span className="font-bold">وصول شدہ رقم ({invoice.paymentMethod === 'CASH' ? 'Cash Tendered' : invoice.paymentMethod}):</span>
                      <span className="font-mono font-black text-sm">{(invoice.tenderedAmount || invoice.paidAmount).toLocaleString()} PKR</span>
                    </div>

                    {/* CHANGE RETURNED (واپسی بقایا) */}
                    {((invoice.tenderedAmount && invoice.tenderedAmount > invoice.grandTotal) || (invoice.changeDue && invoice.changeDue > 0)) && (
                      <div className="flex justify-between items-center bg-gray-100 border-2 border-black p-2 rounded shadow-sm text-sm font-black my-1">
                        <span>بقایا رقم واپس (CHANGE RETURNED):</span>
                        <span className="font-mono text-base font-black">
                          {(invoice.changeDue || (invoice.tenderedAmount! - invoice.grandTotal)).toLocaleString()} PKR
                        </span>
                      </div>
                    )}

                    {/* BALANCE DUE (ادھار بقایا) */}
                    {invoice.balanceDue > 0 && (
                      <div className="flex justify-between items-center bg-gray-100 border-2 border-black p-2 rounded shadow-sm text-sm font-black my-1">
                        <span>بقایا واجب الادا رقم (BALANCE DUE):</span>
                        <span className="font-mono text-base text-rose-700 font-black">
                          {invoice.balanceDue.toLocaleString()} PKR
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Polite Thank You & Return Policy Note */}
                <div className="mt-5 pt-3 border-t border-gray-400 text-center space-y-1">
                  <div className="font-nastaliq text-base font-bold text-black" dir="rtl">
                    ہم سے خریداری کرنے کا شکریہ!
                  </div>
                  <div className="text-xs font-semibold text-gray-700">Thank you for your business!</div>

                  <div className="mt-2 p-2.5 bg-gray-50 border border-gray-400 rounded text-left space-y-1">
                    <p className="font-nastaliq text-xs font-bold text-gray-900 leading-relaxed" dir="rtl">
                      نوٹ: خریدا ہوا سامان غیر استعمال شدہ حالت میں اصلی رسید کے ہمراہ ایک دن کے اندر واپس یا تبدیل ہو سکتا ہے۔ امپورٹڈ سامان کی کوئی وارنٹی نہیں ہے۔
                    </p>
                    <p className="font-sans text-[11px] text-gray-800" dir="ltr">
                      <strong>Note:</strong> Goods once sold can be returned, if unused, within one day on providing original receipt. No warranty on imported goods.
                    </p>
                  </div>
                </div>

                {/* MANDATORY DEVELOPER BRANDING SPECIFICATION */}
                <div className="mt-8 pt-3 border-t-2 border-black flex items-center justify-between font-sans text-xs">
                  <div>
                    <span className="font-black text-sm uppercase tracking-wide">
                      {businessProfile.softwareName || 'OneShop POS'}
                    </span>
                    <span className="text-gray-600 block text-[11px]">
                      A Product of JK Developers Pakistan
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-gray-800">Helpline: 03008998381</span>
                    <span className="block text-[10px] text-gray-500">Official Software Support</span>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 4. PROFESSIONAL A5 HALF-PAGE INVOICE (NORMAL PRINTER)      */}
            {/* ========================================================= */}
            {format === 'a5' && (
              <div
                dir="ltr"
                id="printable-receipt"
                className="a5-receipt w-full max-w-[540px] bg-white text-black p-5 font-sans text-[11px] shadow-2xl border border-gray-300 rounded-sm"
              >
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-3">
                  <div className="flex items-start gap-3">
                    {businessProfile.logoUrl && (
                      <div className="p-0.5 border border-gray-300 rounded bg-white">
                        <img
                          src={businessProfile.logoUrl}
                          alt="Shop Logo"
                          className="h-12 w-auto max-w-[90px] object-contain"
                        />
                      </div>
                    )}
                    <div>
                      <div className="font-nastaliq text-xl font-bold text-black leading-tight" dir="rtl">
                        {businessProfile.nameUr}
                      </div>
                      <h2 className="text-base font-black uppercase tracking-tight text-black">
                        {businessProfile.nameEn}
                      </h2>
                      <p className="text-[10px] text-gray-700">{businessProfile.addressEn}</p>
                      <p className="text-[10px] text-gray-800">Tel: {businessProfile.phone}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black uppercase tracking-wider">انوائس / INVOICE</div>
                    <div className="font-mono text-xs font-bold">انوائس نمبر (Invoice #): #{invoice.invoiceNo}</div>
                    <div className="text-[9.5px] text-gray-700">{new Date(invoice.date).toLocaleDateString()}</div>
                    <div className="text-[9.5px] font-bold uppercase mt-0.5 border border-black px-1.5 inline-block">
                      {invoice.paymentMethod}
                    </div>
                  </div>
                </div>

                {/* Customer Row */}
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 border-2 border-black mb-3 text-[10.5px] rounded-sm">
                  <div>
                    <span className="font-black text-gray-700 block text-[9.5px]">گاہک کی تفصیل (Customer):</span>
                    <div className="font-black text-[12px]">{invoice.customerName}</div>
                    {invoice.customerPhone && <div className="text-gray-600 text-[10px] font-mono">فون: {invoice.customerPhone}</div>}
                  </div>
                  <div className="flex flex-col items-end justify-center">
                    <div className="bg-white p-1.5 border border-black rounded text-right min-w-[190px]">
                      <div className="flex justify-between items-center text-[10px] border-b border-gray-200 pb-0.5 mb-0.5">
                        <span className="font-black">کاؤنٹر نمبر (Counter #):</span>
                        <span className="font-black font-mono bg-black text-white px-1.5 py-0.2 rounded text-[11px]">
                          {invoice.counterNumber !== undefined ? (invoice.counterNumber === 0 ? 'Admin' : `کاؤنٹر #${invoice.counterNumber}`) : 'کاؤنٹر #1'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-black">کیشیئر کا نام:</span>
                        <span className="font-black text-black">{invoice.cashier || 'کیشیئر'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left text-[10.5px] mb-3 border-collapse">
                  <thead>
                    <tr className="bg-black text-white">
                      <th className="p-1 w-6">#</th>
                      <th className="p-1">Item Description</th>
                      <th className="p-1 text-center w-16">Qty</th>
                      <th className="p-1 text-right w-20">Rate</th>
                      <th className="p-1 text-right w-20">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-300">
                        <td className="p-1 font-mono text-gray-600">{idx + 1}</td>
                        <td className="p-1">
                          <span className="font-bold">{item.nameEn}</span>
                          <span className="font-nastaliq text-[10px] text-gray-800 ml-1" dir="rtl">
                            ({item.nameUr})
                          </span>
                        </td>
                        <td className="p-1 text-center font-bold">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-1 text-right font-mono">{item.unitPrice.toLocaleString()}</td>
                        <td className="p-1 text-right font-mono font-bold">
                          {item.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals & Notes Breakdown */}
                <div className="flex justify-between items-start gap-4 border-t-2 border-black pt-2">
                  <div className="w-1/2 space-y-1.5">
                    {denominationsSummary && (
                      <div className="bg-gray-50 p-1.5 border border-black text-[10px] font-mono">
                        <span className="font-bold block uppercase text-[9px]">Notes Received:</span>
                        <div>{denominationsSummary}</div>
                      </div>
                    )}

                    {/* QR Code in A5 */}
                    {(showBarcode || showQrCode) && (
                      <div className="flex items-center gap-2 pt-1">
                        {showQrCode && qrDataUrl && (
                          <img src={qrDataUrl} alt="QR" className="w-12 h-12 object-contain" />
                        )}
                        {showBarcode && barcodeDataUrl && (
                          <img src={barcodeDataUrl} alt="Barcode" className="h-7 w-auto object-contain" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="w-1/2 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-mono">{invoice.subtotal.toLocaleString()} PKR</span>
                    </div>
                    {invoice.discount > 0 && (
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span className="font-mono">- {invoice.discount.toLocaleString()} PKR</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black border-t-2 border-b-2 border-black py-1 my-0.5">
                      <span>GRAND TOTAL (کل بل):</span>
                      <span className="font-mono">{invoice.grandTotal.toLocaleString()} PKR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold">وصول (Tendered):</span>
                      <span className="font-mono font-black">{(invoice.tenderedAmount || invoice.paidAmount).toLocaleString()} PKR</span>
                    </div>

                    {/* Change Return (واپسی بقایا) */}
                    {((invoice.tenderedAmount && invoice.tenderedAmount > invoice.grandTotal) || (invoice.changeDue && invoice.changeDue > 0)) && (
                      <div className="flex justify-between items-center bg-gray-100 border border-black p-1 rounded font-black text-xs my-0.5">
                        <span>بقایا واپس (Change):</span>
                        <span className="font-mono">
                          {(invoice.changeDue || (invoice.tenderedAmount! - invoice.grandTotal)).toLocaleString()} PKR
                        </span>
                      </div>
                    )}

                    {/* Balance Due (ادھار بقایا) */}
                    {invoice.balanceDue > 0 && (
                      <div className="flex justify-between items-center bg-gray-100 border border-black p-1 rounded font-black text-xs my-0.5">
                        <span>بقایا ادھار (Due):</span>
                        <span className="font-mono text-rose-700">
                          {invoice.balanceDue.toLocaleString()} PKR
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Polite Thank You & Return Policy Note */}
                <div className="mt-5 pt-3 border-t border-gray-400 text-center space-y-1">
                  <div className="font-nastaliq text-base font-bold text-black" dir="rtl">
                    ہم سے خریداری کرنے کا شکریہ!
                  </div>
                  <div className="text-xs font-semibold text-gray-700">Thank you for your business!</div>

                  <div className="mt-2 p-2.5 bg-gray-50 border border-gray-400 rounded text-left space-y-1">
                    <p className="font-nastaliq text-xs font-bold text-gray-900 leading-relaxed" dir="rtl">
                      نوٹ: خریدا ہوا سامان غیر استعمال شدہ حالت میں اصلی رسید کے ہمراہ ایک دن کے اندر واپس یا تبدیل ہو سکتا ہے۔ امپورٹڈ سامان کی کوئی وارنٹی نہیں ہے۔
                    </p>
                    <p className="font-sans text-[11px] text-gray-800" dir="ltr">
                      <strong>Note:</strong> Goods once sold can be returned, if unused, within one day on providing original receipt. No warranty on imported goods.
                    </p>
                  </div>
                </div>

                {/* MANDATORY DEVELOPER BRANDING SPECIFICATION */}
                <div className="mt-4 pt-2 border-t border-black flex items-center justify-between font-sans text-[10px]">
                  <div>
                    <span className="font-black uppercase tracking-wide">
                      {businessProfile.softwareName || 'OneShop POS'}
                    </span>
                    <span className="text-gray-600 block text-[9px]">
                      JK Developers Pakistan
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold">Helpline: 03008998381</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
