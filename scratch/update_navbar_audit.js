const fs = require('fs');

let content = fs.readFileSync('components/Navbar.tsx', 'utf8');

const oldNavItems = `  // Modules for the colorful toolbar (Candela & Nebs POS Style)
  const navItems = [
    {
      id: 'billsHistory',
      label: t('billsHistory'),
      icon: History,
      shortcut: 'F2',
      bgClass: 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400',
      activeClass: 'bg-blue-500 text-white ring-4 ring-white shadow-xl shadow-blue-900/60 scale-105 border-white',
    },
    {
      id: 'grn',
      label: t('grnTitle'),
      icon: Truck,
      shortcut: 'F3',
      bgClass: 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400',
      activeClass: 'bg-amber-500 text-white ring-4 ring-white shadow-xl shadow-amber-900/60 scale-105 border-white',
    },
    {
      id: 'vendors',
      label: t('vendorsTitle'),
      icon: Building2,
      shortcut: 'F4',
      bgClass: 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400',
      activeClass: 'bg-purple-500 text-white ring-4 ring-white shadow-xl shadow-purple-900/60 scale-105 border-white',
    },
    {
      id: 'roznamcha',
      label: t('roznamcha'),
      icon: BookOpen,
      shortcut: 'F5',
      bgClass: 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400',
      activeClass: 'bg-sky-500 text-white ring-4 ring-white shadow-xl shadow-sky-900/60 scale-105 border-white',
    },
    {
      id: 'khata',
      label: t('khataLedger'),
      icon: Users,
      shortcut: 'F6',
      bgClass: 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400',
      activeClass: 'bg-rose-500 text-white ring-4 ring-white shadow-xl shadow-rose-900/60 scale-105 border-white',
    },
    {
      id: 'inventory',
      label: t('inventory'),
      icon: Boxes,
      shortcut: 'F7',
      bgClass: 'bg-teal-600 hover:bg-teal-500 text-white border-teal-400',
      activeClass: 'bg-teal-500 text-white ring-4 ring-white shadow-xl shadow-teal-900/60 scale-105 border-white',
    },
    {
      id: 'staff',
      label: t('staffTitle'),
      icon: UserPlus,
      shortcut: 'F8',
      bgClass: 'bg-yellow-600 hover:bg-yellow-500 text-white border-yellow-400',
      activeClass: 'bg-yellow-500 text-white ring-4 ring-white shadow-xl shadow-yellow-900/60 scale-105 border-white',
    },
    {
      id: 'reports',
      label: t('reports'),
      icon: BarChart3,
      shortcut: 'F9',
      bgClass: 'bg-red-600 hover:bg-red-500 text-white border-red-400',
      activeClass: 'bg-red-500 text-white ring-4 ring-white shadow-xl shadow-red-900/60 scale-105 border-white',
    },
    {
      id: 'aiChatboard',
      label: lang === 'ur' ? 'AI رپورٹ چیٹ' : 'AI Chatboard',
      icon: Bot,
      shortcut: 'AI',
      bgClass: 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white border-fuchsia-400',
      activeClass: 'bg-fuchsia-500 text-white ring-4 ring-white shadow-xl shadow-fuchsia-900/60 scale-105 border-white',
    },
    {
      id: 'audit',
      label: lang === 'ur' ? 'اسٹاک و سسٹم آڈٹ' : 'Stock & Audit',
      icon: ShieldCheck,
      shortcut: 'F10',
      bgClass: 'bg-indigo-700 hover:bg-indigo-600 text-white border-indigo-400',
      activeClass: 'bg-indigo-600 text-white ring-4 ring-white shadow-xl shadow-indigo-900/60 scale-105 border-white',
    },`;

const newNavItems = `  // Modules for the colorful toolbar (Candela & Nebs POS Style)
  const navItems = [
    {
      id: 'billsHistory',
      label: t('billsHistory'),
      icon: History,
      shortcut: 'F2',
      bgClass: 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400',
      activeClass: 'bg-blue-500 text-white ring-4 ring-white shadow-xl shadow-blue-900/60 scale-105 border-white',
    },
    {
      id: 'audit',
      label: lang === 'ur' ? 'اسٹاک و سسٹم آڈٹ' : 'Stock & Audit',
      icon: ShieldCheck,
      shortcut: 'F3',
      bgClass: 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400',
      activeClass: 'bg-indigo-500 text-white ring-4 ring-white shadow-xl shadow-indigo-900/60 scale-105 border-white',
    },
    {
      id: 'inventory',
      label: t('inventory'),
      icon: Boxes,
      shortcut: 'F4',
      bgClass: 'bg-teal-600 hover:bg-teal-500 text-white border-teal-400',
      activeClass: 'bg-teal-500 text-white ring-4 ring-white shadow-xl shadow-teal-900/60 scale-105 border-white',
    },
    {
      id: 'reports',
      label: t('reports'),
      icon: BarChart3,
      shortcut: 'F5',
      bgClass: 'bg-red-600 hover:bg-red-500 text-white border-red-400',
      activeClass: 'bg-red-500 text-white ring-4 ring-white shadow-xl shadow-red-900/60 scale-105 border-white',
    },
    {
      id: 'roznamcha',
      label: t('roznamcha'),
      icon: BookOpen,
      shortcut: 'F6',
      bgClass: 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400',
      activeClass: 'bg-sky-500 text-white ring-4 ring-white shadow-xl shadow-sky-900/60 scale-105 border-white',
    },
    {
      id: 'khata',
      label: t('khataLedger'),
      icon: Users,
      shortcut: 'F7',
      bgClass: 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400',
      activeClass: 'bg-rose-500 text-white ring-4 ring-white shadow-xl shadow-rose-900/60 scale-105 border-white',
    },
    {
      id: 'grn',
      label: t('grnTitle'),
      icon: Truck,
      shortcut: 'F8',
      bgClass: 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400',
      activeClass: 'bg-amber-500 text-white ring-4 ring-white shadow-xl shadow-amber-900/60 scale-105 border-white',
    },
    {
      id: 'vendors',
      label: t('vendorsTitle'),
      icon: Building2,
      shortcut: 'F9',
      bgClass: 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400',
      activeClass: 'bg-purple-500 text-white ring-4 ring-white shadow-xl shadow-purple-900/60 scale-105 border-white',
    },
    {
      id: 'staff',
      label: t('staffTitle'),
      icon: UserPlus,
      shortcut: 'F10',
      bgClass: 'bg-yellow-600 hover:bg-yellow-500 text-white border-yellow-400',
      activeClass: 'bg-yellow-500 text-white ring-4 ring-white shadow-xl shadow-yellow-900/60 scale-105 border-white',
    },
    {
      id: 'aiChatboard',
      label: lang === 'ur' ? 'AI رپورٹ چیٹ' : 'AI Chatboard',
      icon: Bot,
      shortcut: 'AI',
      bgClass: 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white border-fuchsia-400',
      activeClass: 'bg-fuchsia-500 text-white ring-4 ring-white shadow-xl shadow-fuchsia-900/60 scale-105 border-white',
    },`;

const normContent = content.replace(/\r\n/g, '\n');
const normOld = oldNavItems.replace(/\r\n/g, '\n');
const normNew = newNavItems.replace(/\r\n/g, '\n');

if (!normContent.includes(normOld)) {
  console.error('oldNavItems not found in Navbar.tsx');
  process.exit(1);
}

const updated = normContent.replace(normOld, normNew);
fs.writeFileSync('components/Navbar.tsx', updated, 'utf8');
console.log('Successfully updated Navbar.tsx!');
