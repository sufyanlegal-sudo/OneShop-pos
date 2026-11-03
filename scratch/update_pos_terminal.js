const fs = require('fs');

let content = fs.readFileSync('components/pos/PosTerminal.tsx', 'utf8');

// 1. Add Edit2 to imports
content = content.replace(
  '  ChevronDown,\n  Zap,',
  '  ChevronDown,\n  Zap,\n  Edit2,'
);

// 2. Add clickable rate edit button
const targetStr = `                    <span>
                      ریٹ: <strong>{unitRate.toLocaleString()} PKR</strong> / {displayUnit}
                    </span>`;

const replacementStr = `                    <span className="inline-flex items-center gap-1">
                      <span>ریٹ: <strong>{unitRate.toLocaleString()} PKR</strong> / {displayUnit}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newRateStr = prompt(
                            lang === 'ur'
                              ? \`سیل ریٹ تبدیل کریں (\${item.product.nameUr}):\`
                              : \`Edit Sale Rate for \${item.product.nameEn}:\`,
                            unitRate.toString()
                          );
                          if (newRateStr !== null) {
                            const parsedRate = parseFloat(newRateStr);
                            if (!isNaN(parsedRate) && parsedRate >= 0) {
                              updateCartItem(item.id, {
                                unitPrice: parsedRate,
                                total: Math.round(item.quantity * parsedRate),
                              });
                            }
                          }
                        }}
                        className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-emerald-600 dark:text-emerald-400 transition ml-1"
                        title={lang === 'ur' ? 'ریٹ تبدیل کرنے کے لیے کلک کریں' : 'Click to edit price'}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </span>`;

const normContent = content.replace(/\r\n/g, '\n');
const normTarget = targetStr.replace(/\r\n/g, '\n');
const normReplacement = replacementStr.replace(/\r\n/g, '\n');

if (!normContent.includes(normTarget)) {
  console.error('Target not found in components/pos/PosTerminal.tsx!');
  process.exit(1);
}

const updated = normContent.replace(normTarget, normReplacement);
fs.writeFileSync('components/pos/PosTerminal.tsx', updated, 'utf8');
console.log('Successfully updated components/pos/PosTerminal.tsx!');
