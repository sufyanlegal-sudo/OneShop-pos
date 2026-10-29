'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  QrCode,
  Barcode,
  Printer,
  Download,
  X,
  Sparkles,
  Check,
  Tag,
  Search,
  PenTool,
  Boxes,
  RefreshCw,
} from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { useLanguage } from '@/context/LanguageContext';
import QRCodeLib from 'qrcode';
import JsBarcode from 'jsbarcode';

interface BarcodeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductId?: string;
}

export const BarcodeGeneratorModal: React.FC<BarcodeGeneratorModalProps> = ({
  isOpen,
  onClose,
  initialProductId,
}) => {
  const { products, businessProfile } = useShop();
  const { lang } = useLanguage();

  // Mode: 'inventory' (select from list) vs 'manual' (type custom product freely)
  const [inputMode, setInputMode] = useState<'inventory' | 'manual'>('inventory');

  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId || '');
  const [productSearch, setProductSearch] = useState<string>('');
  const [barcodeValue, setBarcodeValue] = useState<string>('896400010001');
  const [productName, setProductName] = useState<string>('White Sugar (سفید چینی)');
  const [price, setPrice] = useState<number>(140);
  const [codeType, setCodeType] = useState<'barcode' | 'qr' | 'both'>('both');
  const [labelSize, setLabelSize] = useState<'50x30' | '40x25' | 'a4_sheet'>('50x30');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const barcodeSvgRef = useRef<SVGSVGElement>(null);

  // Filter products for dropdown
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.nameEn.toLowerCase().includes(q) ||
        p.nameUr.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  // When initialProductId changes or on open
  useEffect(() => {
    if (initialProductId) {
      const p = products.find((prod) => prod.id === initialProductId);
      if (p) {
        setSelectedProductId(p.id);
        setBarcodeValue(p.barcode || p.sku);
        setProductName(`${p.nameEn} (${p.nameUr})`);
        setPrice(p.salePrice);
        setInputMode('inventory');
      }
    } else if (products.length > 0 && !selectedProductId) {
      const p = products[0];
      setSelectedProductId(p.id);
      setBarcodeValue(p.barcode || p.sku);
      setProductName(`${p.nameEn} (${p.nameUr})`);
      setPrice(p.salePrice);
    }
  }, [initialProductId, products, isOpen]);

  // Handle product select change
  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const p = products.find((prod) => prod.id === id);
    if (p) {
      setBarcodeValue(p.barcode || p.sku);
      setProductName(`${p.nameEn} (${p.nameUr})`);
      setPrice(p.salePrice);
    }
  };

  // Switch to Manual Mode
  const handleSwitchToManual = () => {
    setInputMode('manual');
    setSelectedProductId('');
    // Generate fresh barcode if needed
    if (!barcodeValue || barcodeValue.length < 8) {
      handleGenerateRandomBarcode();
    }
  };

  // Switch to Inventory Mode
  const handleSwitchToInventory = () => {
    setInputMode('inventory');
    if (products.length > 0) {
      const p = products[0];
      setSelectedProductId(p.id);
      setBarcodeValue(p.barcode || p.sku);
      setProductName(`${p.nameEn} (${p.nameUr})`);
      setPrice(p.salePrice);
    }
  };

  // Generate QR Code data URL & Barcode SVG
  useEffect(() => {
    if (!isOpen) return;

    // 1. Generate QR Code
    const qrPayload = JSON.stringify({
      code: barcodeValue,
      name: productName,
      price: price,
      software: 'OneShop POS',
      dev: 'JK Developers Pakistan (03008998381)',
    });

    QRCodeLib.toDataURL(qrPayload, {
      width: 256,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));

    // 2. Generate Barcode with JsBarcode
    if (barcodeSvgRef.current && barcodeValue) {
      try {
        JsBarcode(barcodeSvgRef.current, barcodeValue, {
          format: 'CODE128',
          width: 1.8,
          height: 45,
          displayValue: true,
          fontSize: 12,
          margin: 4,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (err) {
        // Fallback for non-alphanumeric
        try {
          JsBarcode(
            barcodeSvgRef.current,
            barcodeValue.replace(/[^0-9]/g, '') || '123456789012',
            {
              format: 'CODE128',
              width: 1.8,
              height: 45,
              displayValue: true,
              fontSize: 12,
              margin: 4,
            }
          );
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [barcodeValue, productName, price, isOpen]);

  if (!isOpen) return null;

  const handlePrintLabels = () => {
    window.print();
  };

  const handleGenerateRandomBarcode = () => {
    const random12 = '896' + Math.floor(100000000 + Math.random() * 900000000).toString();
    setBarcodeValue(random12);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                {lang === 'ur'
                  ? 'بارکوڈ و کیو آر کوڈ جنریٹر اور لیبل پرنٹر'
                  : 'Barcode & QR Code Generator & Label Print'}
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                OneShop POS • JK Developers Pakistan (03008998381)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950">
          {/* LEFT: Generator Controls Form */}
          <div className="no-print space-y-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
            {/* INPUT MODE TOGGLE: Select from List VS Type Custom */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                {lang === 'ur' ? 'طریقہ منتخب کریں:' : 'Select Mode:'}
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={handleSwitchToInventory}
                  className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    inputMode === 'inventory'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>{lang === 'ur' ? 'موجودہ لسٹ سے منتخب کریں' : 'From Inventory'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSwitchToManual}
                  className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    inputMode === 'manual'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{lang === 'ur' ? 'خود دستی نیا لکھیں' : 'Type Custom Manually'}</span>
                </button>
              </div>
            </div>

            {/* MODE 1: SELECT EXISTING FROM INVENTORY */}
            {inputMode === 'inventory' && (
              <div className="space-y-2 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder={lang === 'ur' ? 'پروڈکٹ کا نام یا SKU تلاش کریں...' : 'Search product...'}
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs outline-none"
                  />
                </div>

                <div>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none text-slate-800 dark:text-slate-200"
                  >
                    {filteredProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nameEn} ({p.nameUr}) - Rs. {p.salePrice}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* MODE 2: CUSTOM MANUAL ENTRY */}
            {inputMode === 'manual' && (
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-1.5 text-amber-800 dark:text-amber-300 text-[11px]">
                <span className="font-bold flex items-center gap-1">
                  <PenTool className="w-3.5 h-3.5" />
                  {lang === 'ur'
                    ? 'دستی آئٹم: آپ بغیر لسٹ کے کسی بھی نئی چیز کا نام، قیمت اور بارکوڈ خود لکھ سکتے ہیں:'
                    : 'Manual Custom Item: Freely type any product name, price, and barcode:'}
                </span>
              </div>
            )}

            {/* Common Inputs (Product Name, Price, Barcode Number) */}
            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'ur' ? 'پروڈکٹ کا نام برائے لیبل (اردو یا انگلش):' : 'Product Name on Label:'}
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. سوتی قمیض (Cotton Shirt) یا کھلا مصالحہ"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {lang === 'ur' ? 'بارکوڈ نمبر / SKU:' : 'Barcode Number / SKU:'}
                  </label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={barcodeValue}
                      onChange={(e) => setBarcodeValue(e.target.value)}
                      placeholder="896400010001"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-mono font-bold text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateRandomBarcode}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm"
                      title="نیا خودکار بارکوڈ بنائیں"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>نیا</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {lang === 'ur' ? 'قیمت برائے پرنٹ (PKR):' : 'Price on Label (PKR):'}
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-mono font-bold text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Code type */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'ur' ? 'کوڈ کی قسم:' : 'Code Format:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCodeType('barcode')}
                  className={`py-2 rounded-xl font-bold border transition-all ${
                    codeType === 'barcode'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  بارکوڈ (1D)
                </button>
                <button
                  type="button"
                  onClick={() => setCodeType('qr')}
                  className={`py-2 rounded-xl font-bold border transition-all ${
                    codeType === 'qr'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  کیو آر کوڈ (2D)
                </button>
                <button
                  type="button"
                  onClick={() => setCodeType('both')}
                  className={`py-2 rounded-xl font-bold border transition-all ${
                    codeType === 'both'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  دونوں (Both)
                </button>
              </div>
            </div>

            {/* Label Print Size */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'ur' ? 'لیبل سائز (پرنٹر سائز):' : 'Label Sticker Size:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setLabelSize('50x30')}
                  className={`py-2 rounded-xl font-bold border text-[11px] transition-all ${
                    labelSize === '50x30'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  50mm x 30mm (معیاری)
                </button>
                <button
                  type="button"
                  onClick={() => setLabelSize('40x25')}
                  className={`py-2 rounded-xl font-bold border text-[11px] transition-all ${
                    labelSize === '40x25'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  40mm x 25mm (چھوٹا)
                </button>
                <button
                  type="button"
                  onClick={() => setLabelSize('a4_sheet')}
                  className={`py-2 rounded-xl font-bold border text-[11px] transition-all ${
                    labelSize === 'a4_sheet'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  A4 اسٹیکر شیٹ (24x)
                </button>
              </div>
            </div>

            {/* Print Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePrintLabels}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-95 transition-all"
              >
                <Printer className="w-5 h-5" />
                <span>{lang === 'ur' ? 'اسٹیکر / لیبل پرنٹ نکالیں (Print Now)' : 'Print Label Stickers'}</span>
              </button>
            </div>
          </div>

          {/* RIGHT: Live Printable Preview */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-200 dark:bg-slate-900/80 rounded-2xl border border-slate-300 dark:border-slate-800 overflow-y-auto">
            <span className="no-print text-xs font-bold text-slate-500 mb-3">
              {lang === 'ur' ? '🔍 پرنٹ کا لائیو پری ویو (Live Print Preview):' : '🔍 Live Sticker Preview:'}
            </span>

            {/* Single Sticker Card (50x30 / 40x25) */}
            {labelSize !== 'a4_sheet' ? (
              <div
                id="printable-label"
                dir="ltr"
                className="bg-white text-black p-2 border-2 border-dashed border-gray-400 rounded-lg shadow-xl flex flex-col items-center justify-between text-center select-none"
                style={{
                  width: labelSize === '50x30' ? '50mm' : '40mm',
                  minHeight: labelSize === '50x30' ? '30mm' : '25mm',
                }}
              >
                {/* Shop Name on top of label */}
                <div className="font-bold text-[9px] uppercase tracking-tight text-gray-800 truncate w-full">
                  {businessProfile.nameUr || businessProfile.nameEn}
                </div>

                {/* Product Name */}
                <div className="font-black text-[10.5px] leading-tight text-black line-clamp-1 w-full px-1">
                  {productName}
                </div>

                {/* Codes Display */}
                <div className="my-1 flex items-center justify-center gap-1 w-full">
                  {(codeType === 'barcode' || codeType === 'both') && (
                    <div className="flex flex-col items-center">
                      <svg ref={barcodeSvgRef} className="max-w-[140px] h-[36px]" />
                    </div>
                  )}

                  {(codeType === 'qr' || codeType === 'both') && qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="QR"
                      className="w-12 h-12 object-contain border border-gray-200"
                    />
                  )}
                </div>

                {/* Price & Software Brand */}
                <div className="w-full flex items-center justify-between border-t border-black pt-0.5 text-[9px] font-bold">
                  <span className="font-black text-[12px] font-mono text-black">
                    Rs. {price.toLocaleString()}
                  </span>
                  <span className="text-[7.5px] uppercase font-sans text-gray-700 font-bold">
                    OneShop POS
                  </span>
                </div>
              </div>
            ) : (
              /* A4 Sticker Sheet (Grid of 24 stickers) */
              <div className="bg-white text-black p-3 rounded shadow-xl border border-gray-300 grid grid-cols-3 gap-2 w-full max-w-[320px] text-center text-[8px]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border border-gray-300 p-1 rounded flex flex-col items-center">
                    <span className="font-black truncate w-full text-[8px]">{productName.slice(0, 15)}</span>
                    {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-8 h-8 my-0.5" />}
                    <span className="font-bold text-[9px]">Rs. {price}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="no-print text-[10px] text-slate-500 mt-4 text-center">
              لیبل پرنٹر (Xprinter, Zebra, TSC) یا عام پرنٹر پر اسٹیکر پیپر لگا کر پرنٹ نکالیں۔
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
