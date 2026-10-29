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
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useShop } from '@/context/ShopContext';
import { Product } from '@/types';

export const InventoryView: React.FC = () => {
  const { lang, t } = useLanguage();
  const { products, saveProduct, deleteProduct, activePreset } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Edit/Add Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(lang === 'ur' ? p.categoryUr : p.categoryEn));
    return ['all', ...Array.from(set)];
  }, [products, lang]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const catMatch =
        filterCategory === 'all' ||
        (lang === 'ur' ? p.categoryUr === filterCategory : p.categoryEn === filterCategory);

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
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 outline-none font-medium"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? t('allCategories') : c}
              </option>
            ))}
          </select>
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

      {/* Products Table */}
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
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    placeholder="Kg / Piece / Carton"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 outline-none font-medium"
                  />
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
