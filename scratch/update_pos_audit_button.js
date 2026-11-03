const fs = require('fs');

let content = fs.readFileSync('components/pos/PosTerminal.tsx', 'utf8');

// 1. Add ShieldCheck to lucide-react imports if not present
if (!content.includes('ShieldCheck,')) {
  content = content.replace(
    '  Edit2,\n} from \'lucide-react\';',
    '  Edit2,\n  ShieldCheck,\n} from \'lucide-react\';'
  );
}

// 2. Add PosTerminalProps
const oldComp = 'export const PosTerminal: React.FC = () => {';
const newComp = `interface PosTerminalProps {
  onNavigate?: (tab: string) => void;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({ onNavigate }) => {`;

if (content.includes(oldComp)) {
  content = content.replace(oldComp, newComp);
}

// 3. Add button right after Exchange button
const targetButton = `          {/* Quick Return & Exchange Button */}
          <button
            type="button"
            onClick={() => setIsExchangeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 text-blue-300 border border-blue-500/30 font-bold text-xs transition-all shadow-sm active:scale-95"
            title="مال کی واپسی و ایکسچینج (Return & Exchange)"
          >
            <Repeat className="w-3.5 h-3.5 text-blue-400" />
            <span>{lang === 'ur' ? '🔁 مال کا تبادلہ' : 'Exchange'}</span>
          </button>`;

const newAuditButton = `          {/* Quick Return & Exchange Button */}
          <button
            type="button"
            onClick={() => setIsExchangeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 text-blue-300 border border-blue-500/30 font-bold text-xs transition-all shadow-sm active:scale-95"
            title="مال کی واپسی و ایکسچینج (Return & Exchange)"
          >
            <Repeat className="w-3.5 h-3.5 text-blue-400" />
            <span>{lang === 'ur' ? '🔁 مال کا تبادلہ' : 'Exchange'}</span>
          </button>

          {/* Quick Stock & System Audit Button */}
          <button
            type="button"
            onClick={() => onNavigate?.('audit')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-sm active:scale-95"
            title={lang === 'ur' ? 'اسٹاک فزیکل آڈٹ اور سسٹم لاگز دیکھیں' : 'Stock & System Audit'}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-100" />
            <span>{lang === 'ur' ? '📋 اسٹاک و سسٹم آڈٹ' : 'Audit'}</span>
          </button>`;

const normContent = content.replace(/\r\n/g, '\n');
const normTarget = targetButton.replace(/\r\n/g, '\n');
const normNewAudit = newAuditButton.replace(/\r\n/g, '\n');

if (!normContent.includes(normTarget)) {
  console.error('Target not found in PosTerminal.tsx');
  process.exit(1);
}

const updated = normContent.replace(normTarget, normNewAudit);
fs.writeFileSync('components/pos/PosTerminal.tsx', updated, 'utf8');
console.log('Successfully updated PosTerminal.tsx with onNavigate & Audit button!');
