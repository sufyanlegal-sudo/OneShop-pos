const fs = require('fs');

let content = fs.readFileSync('components/inventory/InventoryView.tsx', 'utf8');

const targetStr = `                    <td className="p-3 text-right font-mono text-slate-500">
                      {p.costPrice.toLocaleString()} PKR
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {p.salePrice.toLocaleString()} PKR
                    </td>`;

const replacementStr = `                    <td className="p-3 text-right font-mono text-slate-500">
                      <button
                        type="button"
                        onClick={() => {
                          const newCost = prompt(
                            lang === 'ur'
                              ? \`خرید قیمت (Cost Price) تبدیل کریں (\${p.nameUr}):\`
                              : \`Edit Cost Price for \${p.nameEn}:\`,
                            p.costPrice.toString()
                          );
                          if (newCost !== null) {
                            const val = parseFloat(newCost);
                            if (!isNaN(val) && val >= 0) {
                              saveProduct({ ...p, costPrice: val });
                            }
                          }
                        }}
                        className="hover:text-emerald-600 hover:underline inline-flex items-center justify-end gap-1 font-mono group"
                        title={lang === 'ur' ? 'خرید قیمت تبدیل کرنے کے لیے کلک کریں' : 'Click to edit Cost Price'}
                      >
                        <span>{p.costPrice.toLocaleString()} PKR</span>
                        <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 opacity-60 group-hover:opacity-100" />
                      </button>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      <button
                        type="button"
                        onClick={() => {
                          const newSale = prompt(
                            lang === 'ur'
                              ? \`فروخت قیمت (Sale Price) تبدیل کریں (\${p.nameUr}):\`
                              : \`Edit Sale Price for \${p.nameEn}:\`,
                            p.salePrice.toString()
                          );
                          if (newSale !== null) {
                            const val = parseFloat(newSale);
                            if (!isNaN(val) && val >= 0) {
                              saveProduct({ ...p, salePrice: val });
                            }
                          }
                        }}
                        className="hover:text-emerald-500 hover:underline inline-flex items-center justify-end gap-1 font-mono font-black group"
                        title={lang === 'ur' ? 'فروخت قیمت تبدیل کرنے کے لیے کلک کریں' : 'Click to edit Sale Price'}
                      >
                        <span>{p.salePrice.toLocaleString()} PKR</span>
                        <Edit2 className="w-3 h-3 text-emerald-500 opacity-60 group-hover:opacity-100" />
                      </button>
                    </td>`;

const normContent = content.replace(/\r\n/g, '\n');
const normTarget = targetStr.replace(/\r\n/g, '\n');
const normReplacement = replacementStr.replace(/\r\n/g, '\n');

if (!normContent.includes(normTarget)) {
  console.error('Target not found in components/inventory/InventoryView.tsx!');
  process.exit(1);
}

const updated = normContent.replace(normTarget, normReplacement);
fs.writeFileSync('components/inventory/InventoryView.tsx', updated, 'utf8');
console.log('Successfully updated components/inventory/InventoryView.tsx!');
