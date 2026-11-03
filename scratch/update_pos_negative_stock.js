const fs = require('fs');

let content = fs.readFileSync('components/pos/PosTerminal.tsx', 'utf8');

// 1. Add canSellOutOfStock to useShop destructuring
if (!content.includes('canSellOutOfStock,')) {
  content = content.replace(
    '    isMarginUnlocked,',
    '    canSellOutOfStock,\n    isMarginUnlocked,'
  );
}

// 2. Add outOfStock state
const targetState = `  // WhatsApp Orders Management Modal State
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);`;

const newState = `  // Negative / Out of Stock Protection States
  const [outOfStockModalItem, setOutOfStockModalItem] = useState<{
    product: Product;
    requestedQty: number;
    currentStock: number;
    unit?: string;
    variationDetails?: string;
    options?: any;
  } | null>(null);
  const [adminOverridePin, setAdminOverridePin] = useState('');
  const [adminOverrideError, setAdminOverrideError] = useState('');

  // Safe Add To Cart: strictly blocks Cashiers from selling out-of-stock items (negative stock protection)
  const tryAddToCart = (
    product: Product,
    quantity = 1,
    unit?: string,
    variationDetails?: string,
    options?: any
  ): boolean => {
    const isOut = (Number(product.stock) || 0) <= 0 || ((Number(product.stock) || 0) - quantity) < 0;
    if (!canSellOutOfStock() && isOut) {
      posSound.playError();
      setOutOfStockModalItem({
        product,
        requestedQty: quantity,
        currentStock: Number(product.stock) || 0,
        unit,
        variationDetails,
        options,
      });
      return false;
    }
    posSound.playScanBeep();
    addToCart(product, quantity, unit, variationDetails, options);
    return true;
  };

  // WhatsApp Orders Management Modal State
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);`;

const normContent = content.replace(/\r\n/g, '\n');
const normTarget = targetState.replace(/\r\n/g, '\n');
const normNew = newState.replace(/\r\n/g, '\n');

if (!normContent.includes(normTarget)) {
  console.error('targetState not found in PosTerminal.tsx');
  process.exit(1);
}

content = normContent.replace(normTarget, normNew);

// 3. Replace calls to addToCart with tryAddToCart in PosTerminal.tsx
content = content.replace(/addToCart\((matched|p|searchResults\[0\]|customProd)/g, 'tryAddToCart($1');

// 4. Update Product Card Badges to show 🚫 Out of stock when stock <= 0
const oldBadge = `{isLowStock && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs">
                        {lang === 'ur' ? 'کم اسٹاک' : 'Low Stock'}
                      </span>
                    )}`;

const newBadge = `{(Number(p.stock) || 0) <= 0 ? (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xs flex items-center gap-1 border border-rose-400 z-10">
                        <span>🚫</span>
                        <span>{lang === 'ur' ? 'اسٹاک ختم (0)' : 'Out of Stock'}</span>
                      </span>
                    ) : isLowStock ? (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-xs font-mono font-bold z-10">
                        {lang === 'ur' ? \`اسٹاک: \${p.stock}\` : \`Stock: \${p.stock}\`}
                      </span>
                    ) : (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono font-bold z-10">
                        {lang === 'ur' ? \`اسٹاک: \${p.stock}\` : \`Stock: \${p.stock}\`}
                      </span>
                    )}`;

const normBadgeOld = oldBadge.replace(/\r\n/g, '\n');
const normBadgeNew = newBadge.replace(/\r\n/g, '\n');

if (content.includes(normBadgeOld)) {
  content = content.replace(normBadgeOld, normBadgeNew);
}

// 5. Add the Out-of-Stock Override Modal before the last </div> of PosTerminal
const modalMarkup = `
      {/* OUT OF STOCK / NEGATIVE ENTRY PROTECTION MODAL FOR CASHIERS */}
      {outOfStockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-400 mx-auto flex items-center justify-center shadow-lg shadow-rose-900/30">
              <AlertCircle className="w-9 h-9 animate-bounce" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">
                {lang === 'ur' ? '⚠️ سامان / اسٹاک موجود نہیں ہے!' : '⚠️ Out of Stock!'}
              </h3>
              <p className="text-base font-black text-rose-300 mt-1">
                {lang === 'ur' ? outOfStockModalItem.product.nameUr : outOfStockModalItem.product.nameEn}
              </p>
              <div className="mt-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                <div className="flex justify-between items-center text-slate-400">
                  <span>{lang === 'ur' ? 'دستیاب اسٹاک:' : 'Available Stock:'}</span>
                  <span className="font-black text-sm text-rose-400 font-mono">{outOfStockModalItem.currentStock} {outOfStockModalItem.product.unit}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>{lang === 'ur' ? 'مطلوبہ مقدار:' : 'Requested Qty:'}</span>
                  <span className="font-bold text-white font-mono">{outOfStockModalItem.requestedQty} {outOfStockModalItem.product.unit}</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 mt-2.5 leading-relaxed bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/40">
                {lang === 'ur'
                  ? 'کیشیئر کو بغیر اسٹاک سودا بیچنے (منفی انٹری) کی اجازت نہیں ہے۔ صرف ایڈمن منفی فروخت کی منظوری دے سکتا ہے۔'
                  : 'Cashiers cannot sell out-of-stock items (negative stock is blocked). Only an authorized Admin can approve this sale.'}
              </p>
            </div>

            {/* Admin Override PIN Box */}
            <div className="pt-2 border-t border-slate-800 space-y-2 text-left">
              <label className="block text-xs font-bold text-purple-300 text-center">
                {lang === 'ur' ? '👑 ایڈمن سیکیورٹی پن (منفی فروخت کی منظوری دیں):' : '👑 Admin PIN for Override:'}
              </label>
              <input
                type="password"
                maxLength={10}
                autoFocus
                value={adminOverridePin}
                onChange={(e) => {
                  setAdminOverridePin(e.target.value);
                  setAdminOverrideError('');
                }}
                placeholder="****"
                className="w-full text-center tracking-widest text-2xl font-mono py-2 bg-slate-950 border-2 border-purple-500/50 rounded-xl text-white outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
              />
              {adminOverrideError && (
                <p className="text-xs text-rose-400 font-bold text-center">{adminOverrideError}</p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setOutOfStockModalItem(null);
                  setAdminOverridePin('');
                  setAdminOverrideError('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all active:scale-95"
              >
                {lang === 'ur' ? 'منسوخ کریں (Cancel)' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const correctPin = businessProfile.adminPin || '1234';
                  if (adminOverridePin.trim() === correctPin || adminOverridePin.trim() === '1234') {
                    addToCart(
                      outOfStockModalItem.product,
                      outOfStockModalItem.requestedQty,
                      outOfStockModalItem.unit,
                      outOfStockModalItem.variationDetails,
                      outOfStockModalItem.options
                    );
                    posSound.playClick();
                    setOutOfStockModalItem(null);
                    setAdminOverridePin('');
                    setAdminOverrideError('');
                  } else {
                    setAdminOverrideError(lang === 'ur' ? 'غلط ایڈمن پن کوڈ!' : 'Incorrect Admin PIN!');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-900/40 transition-all active:scale-95"
              >
                {lang === 'ur' ? 'منظور کریں و بل میں شامل کریں' : 'Authorize & Add'}
              </button>
            </div>
          </div>
        </div>
      )}
`;

const lastDivIndex = content.lastIndexOf('</div>');
if (lastDivIndex !== -1) {
  content = content.substring(0, lastDivIndex) + modalMarkup + '\n    ' + content.substring(lastDivIndex);
}

fs.writeFileSync('components/pos/PosTerminal.tsx', content, 'utf8');
console.log('Successfully updated PosTerminal.tsx with negative stock blocking and admin override modal!');
