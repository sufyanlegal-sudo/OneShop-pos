'use client';

import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Barcode,
  Layers,
  ArrowRightLeft,
  Check,
  X,
  Copy,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { Product } from '@/types';
import { getProductImageUrl, PRESET_IMAGE_OPTIONS } from '@/utils/productImages';

export const InventoryView: React.FC = () => {
  const { lang, t } = useLanguage();
  const { products, saveProduct, deleteProduct, activePreset } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Edit/Add Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const cat = lang === 'ur' ? (p.categoryUr || p.categoryEn) : (p.categoryEn || p.categoryUr);
      if (cat && cat.trim()) set.add(cat.trim());
    });
    return ['all', ...Array.from(set)];
  }, [products, lang]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const pCat = lang === 'ur' ? (p.categoryUr || p.categoryEn) : (p.categoryEn || p.categoryUr);
      const catMatch =
        filterCategory === 'all' ||
        pCat === filterCategory ||
        p.categoryUr === filterCategory ||
        p.categoryEn === filterCategory;

      const q = searchQuery.toLowerCase().trim();
      const textMatch =
        !q ||
        p.nameEn.toLowerCase().includes(q) ||
        p.nameUr.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.sku.toLowerCase().includes(q);

      const stockMatch = !lowStockOnly || p.stock <= p.minStockAlert;

      return catMatch && textMatch && stockMatch;
    });
  }, [products, filterCategory, searchQuery, lowStockOnly, lang]);

  const handleOpenAdd = () => {
    setEditingProduct({
      preset: activePreset,
      barcode: Date.now().toString().slice(-12),
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      nameEn: '',
      nameUr: '',
      categoryEn: 'General',
      categoryUr: 'عام اشیاء',
      unit: 'Piece',
      costPrice: 0,
      salePrice: 0,
      wholesaleRate: 0,
      stock: 50,
      minStockAlert: 10,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct({ ...p });
    setModalOpen(true);
  };

  const handleDuplicate = (p: Product) => {
    setEditingProduct({
      ...p,
      id: undefined,
      barcode: Date.now().toString().slice(-12),
      sku: `${p.sku}-COPY`,
      nameEn: `${p.nameEn} (Copy)`,
      nameUr: `${p.nameUr} (کاپی)`,
    });
    setModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.nameUr || !editingProduct.nameEn) return;

    saveProduct(editingProduct as any);
    setModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-2xl">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {t('inventory')}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'ur'
                ? 'اشیاء، بارکوڈز، ملٹی یونٹ کنورژن، خرید و فروخت ریٹس اور الرٹس'
                : 'Products, Barcodes, Multi-unit conversion, Cost/Sale rates & Stock Alerts'}
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'ur' ? 'نیا پروڈکٹ شامل کریں' : 'Add New Item'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchProductPlaceholder')}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 outline-none font-medium text-xs font-bold"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all'
                  ? (lang === 'ur' ? '✨ تمام اشیاء (All Products)' : '✨ All Products')
                  : c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle: Cards Grid vs Table List */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'cards'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>کارڈز گرڈ</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>ٹیبل لسٹ</span>
            </button>
          </div>

          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              lowStockOnly
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t('lowStockAlerts')}</span>
          </button>
        </div>
      </div>

      {/* Render Products View: Cards Grid OR Table List */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredProducts.map((p) => {
            const isLow = p.stock <= p.minStockAlert;
            const imgUrl = getProductImageUrl(p);
            const displayUnit = p.unit || (lang === 'ur' ? 'Piece' : 'Piece');

            return (
              <div
                key={p.id}
                className="group relative bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 rounded-3xl p-3 flex items-center justify-between gap-3 transition-all shadow-xs hover:shadow-md"
              >
                {isLow && (
                  <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs">
                    کم اسٹاک
                  </span>
                )}

                {/* Left: Image & Unit */}
                <div className="w-24 h-28 flex flex-col items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-1.5 border border-slate-150 dark:border-slate-750">
                  <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
                    <img
                      src={imgUrl}
                      alt={p.nameUr || p.nameEn}
                      className="max-h-full max-w-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 font-sans tracking-wide mt-1 text-center truncate w-full">
                    {displayUnit}
                  </span>
                </div>

                {/* Right: Details & Action */}
                <div className="flex-1 flex flex-col justify-between h-full min-w-0 text-right py-0.5">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {lang === 'ur' ? p.nameUr : p.nameEn}
                    </h4>
                    {p.nameEn && p.nameUr && (
                      <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 font-sans line-clamp-1 mt-0.5">
                        {lang === 'ur' ? p.nameEn : p.nameUr}
                      </p>
                    )}
                  </div>

                  <div className="my-1">
                    <div className="flex items-baseline justify-end gap-1 font-mono">
                      <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        {p.salePrice.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        PKR
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">
                      اسٹاک: {p.stock} {p.unit}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-950 rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                      title="ترمیم کریں"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>ترمیم</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(p)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      title="کاپی / نقل"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(lang === 'ur' ? 'کیا آپ اس آئٹم کو حذف کرنا چاہتے ہیں؟' : 'Delete item?')) {
                          deleteProduct(p.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                      title="حذف کریں"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Products Table */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">SKU / بارکوڈ</th>
                  <th className="p-3">نام و تفصیل</th>
                  <th className="p-3">کیٹیگری</th>
                  <th className="p-3 text-right">خرید قیمت</th>
                  <th className="p-3 text-right">فروخت قیمت</th>
                  <th className="p-3 text-right">ہول سیل ریٹ</th>
                  <th className="p-3 text-center">موجودہ اسٹاک</th>
                  <th className="p-3 text-center">ایکشن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {filteredProducts.map((p) => {
                  const isLow = p.stock <= p.minStockAlert;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3 font-mono">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{p.sku}</div>
                        <div className="text-[10px] text-slate-400">{p.barcode}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {p.nameEn}
                        </div>
                        <div className="font-nastaliq text-xs text-slate-700 dark:text-slate-300">
                          {p.nameUr}
                        </div>
                        {p.subUnit && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            1 {p.unit} = {p.conversionFactor} {p.subUnit}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500">
                        {lang === 'ur' ? p.categoryUr : p.categoryEn}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-500">
                        {p.costPrice.toLocaleString()} PKR
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {p.salePrice.toLocaleString()} PKR
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-300">
                        {(p.wholesaleRate || p.wholesalePrice || p.salePrice).toLocaleString()} PKR
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                            isLow
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 animate-pulse'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {p.stock} {p.unit}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(lang === 'ur' ? 'کیا آپ اس آئٹم کو حذف کرنا چاہتے ہیں؟' : 'Delete item?')) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / Add Product Modal */}
      {modalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl my-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingProduct.id
                ? lang === 'ur' ? 'پروڈکٹ میں ترمیم' : 'Edit Product'
                : lang === 'ur' ? 'نیا پروڈکٹ شامل کریں' : 'Add New Product'}
            </h3>

            <form onSubmit={handleSaveSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    نام (اردو نستعلیق)*:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.nameUr || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameUr: e.target.value })}
                    placeholder="مثلاً: سفید چینی اعلٰی کوالٹی"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-nastaliq text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Name (English)*:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.nameEn || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameEn: e.target.value })}
                    placeholder="e.g. Refined White Sugar"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-medium outline-none"
                  />
                </div>
              </div>

              {/* پورشن / کیٹیگری کا انتخاب (Category / Section) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    پورشن / کیٹیگری (Category / Portion)*:
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    اسی پورشن اور تمام اشیاء دونوں میں نظر آئے گا ✓
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    list="category-suggestions"
                    value={editingProduct.categoryUr || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingProduct({
                        ...editingProduct,
                        categoryUr: val,
                        categoryEn: val,
                      });
                    }}
                    placeholder="پورشن کا نام درج کریں یا نیچے سے منتخب کریں..."
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <datalist id="category-suggestions">
                    {categories
                      .filter((c) => c !== 'all')
                      .map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                  </datalist>
                </div>

                {/* Quick 1-Click Category Selection Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium">فوری پورشن منتخب کریں:</span>
                  {categories
                    .filter((c) => c !== 'all')
                    .map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() =>
                          setEditingProduct({
                            ...editingProduct,
                            categoryUr: cat,
                            categoryEn: cat,
                          })
                        }
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                          editingProduct.categoryUr === cat
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    SKU Code:
                  </label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Barcode:
                  </label>
                  <input
                    type="text"
                    value={editingProduct.barcode || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    بنیادی اکائی (Unit):
                  </label>
                  <input
                    type="text"
                    value={editingProduct.unit || 'Kg'}
                    onChange={(e) => {
                      const val = e.target.value;
                      const isWeight = val.toLowerCase() === 'kg' || val === 'کلو';
                      setEditingProduct({
                        ...editingProduct,
                        unit: val,
                        subUnit: isWeight && !editingProduct.subUnit ? 'Grams' : editingProduct.subUnit,
                        conversionFactor: isWeight && !editingProduct.conversionFactor ? 1000 : editingProduct.conversionFactor,
                      });
                    }}
                    placeholder="Kg / Piece / Carton"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none font-medium"
                  />
                  <div className="flex gap-1 mt-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingProduct({
                          ...editingProduct,
                          unit: 'Kg',
                          subUnit: 'Grams',
                          conversionFactor: 1000,
                        })
                      }
                      className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold"
                    >
                      وزن: Kg + Grams
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingProduct({
                          ...editingProduct,
                          unit: 'عدد',
                          subUnit: undefined,
                          conversionFactor: undefined,
                        })
                      }
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      عدد
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    ذیلی اکائی (Sub-Unit):
                  </label>
                  <input
                    type="text"
                    value={editingProduct.subUnit || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subUnit: e.target.value })}
                    placeholder="Grams / Piece / Pkt"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    تبدیلی تناسب (Factor):
                  </label>
                  <input
                    type="number"
                    value={editingProduct.conversionFactor || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        conversionFactor: parseFloat(e.target.value) || undefined,
                      })
                    }
                    placeholder="1000 / 24 / 12"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    خرید قیمت (Cost):
                  </label>
                  <input
                    type="number"
                    value={editingProduct.costPrice || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    فروخت قیمت (Sale):
                  </label>
                  <input
                    type="number"
                    value={editingProduct.salePrice || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, salePrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-emerald-600 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    ہول سیل ریٹ:
                  </label>
                  <input
                    type="number"
                    value={editingProduct.wholesaleRate || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        wholesaleRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    موجودہ اسٹاک تعداد:
                  </label>
                  <input
                    type="number"
                    value={editingProduct.stock || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stock: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-rose-500 block mb-1">
                    کم اسٹاک وارننگ لیول:
                  </label>
                  <input
                    type="number"
                    value={editingProduct.minStockAlert || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        minStockAlert: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono outline-none"
                  />
                </div>
              </div>

              {/* Product Image Selection & Live Card Preview */}
              <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    <span>پروڈکٹ کی تصویر (Product Image):</span>
                  </label>
                  <span className="text-[10px] text-slate-500">
                    تصویر منتخب کریں یا فائل اپلوڈ کریں
                  </span>
                </div>

                {/* 1-Click Preset Images */}
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_IMAGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, image: opt.value })}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                        editingProduct.image === opt.value
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Upload or Custom URL */}
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={editingProduct.image || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                    placeholder="تصویر کا لنک (Image URL) یا نیچے سے فائل منتخب کریں..."
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs outline-none"
                  />
                  <label className="px-3 py-1.5 bg-slate-200 dark:bg-slate-750 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-1 shrink-0 transition-all">
                    <Upload className="w-3.5 h-3.5 text-emerald-500" />
                    <span>فائل اپلوڈ</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setEditingProduct({
                                ...editingProduct,
                                image: event.target.result as string,
                              });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {editingProduct.image && (
                    <button
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, image: '' })}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-bold"
                      title="تصویر ختم کریں"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Live Card Preview Box */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <div className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 mb-1.5">
                    ✨ پیش نظارہ (Live Card Preview) - یہ پروڈکٹ سکرین پر ایسی نظر آئے گی:
                  </div>
                  <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3 flex items-center justify-between gap-3 shadow-md">
                    {/* Left: Image & Unit */}
                    <div className="w-24 h-28 flex flex-col items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-1.5 border border-slate-150 dark:border-slate-750">
                      <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
                        <img
                          src={getProductImageUrl(editingProduct as any)}
                          alt="Preview"
                          className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                        />
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 font-sans tracking-wide mt-1 text-center truncate w-full">
                        {editingProduct.unit || 'Piece'}
                      </span>
                    </div>

                    {/* Right: Details & Button */}
                    <div className="flex-1 flex flex-col justify-between h-full min-w-0 text-right py-0.5">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                          {editingProduct.nameUr || 'پروڈکٹ کا نام (اردو)'}
                        </h4>
                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 font-sans line-clamp-1 mt-0.5">
                          {editingProduct.nameEn || 'Product Name (English)'}
                        </p>
                      </div>

                      <div className="my-1">
                        <div className="flex items-baseline justify-end gap-1 font-mono">
                          <span className="text-xl font-black text-slate-900 dark:text-white">
                            {(editingProduct.salePrice || 0).toLocaleString()}
                          </span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            PKR
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">
                          {editingProduct.unit || 'Piece'}
                        </div>
                      </div>

                      <div className="flex items-center justify-end pt-1">
                        <div className="px-3 py-1.5 bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                          <Plus className="w-3 h-3" />
                          <span className="font-sans font-bold">+ Add to Cart</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
