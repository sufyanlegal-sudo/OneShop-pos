'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Banknote,
  Phone,
  Briefcase,
  Calendar,
  CheckCircle2,
  X,
  CreditCard,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { useLanguage } from '@/context/LanguageContext';
import { Staff } from '@/types';

export const StaffView: React.FC = () => {
  const { staffList, addStaff, updateStaff, payStaffSalary } = useShop();
  const { lang } = useLanguage();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedStaffToPay, setSelectedStaffToPay] = useState<Staff | null>(null);

  // New staff form state
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState<Staff['designation']>('SALESMAN');
  const [phone, setPhone] = useState('');
  const [monthlySalary, setMonthlySalary] = useState<number>(25000);
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().slice(0, 10));

  // Salary payment state
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMonth, setPayMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payType, setPayType] = useState<'SALARY' | 'ADVANCE' | 'BONUS'>('SALARY');
  const [payNotes, setPayNotes] = useState('');

  // Handle Add Staff
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    addStaff({
      name,
      designation,
      phone,
      monthlySalary: Number(monthlySalary) || 0,
      joiningDate,
      status: 'ACTIVE',
    });

    setShowAddModal(false);
    setName('');
    setPhone('');
    setMonthlySalary(25000);
  };

  // Handle Pay Salary
  const handlePaySalary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffToPay || payAmount <= 0) return;

    payStaffSalary(selectedStaffToPay.id, payAmount, payMonth, payType, payNotes);
    setShowPayModal(false);
    setPayAmount(0);
    setPayNotes('');
    setSelectedStaffToPay(null);
  };

  const totalMonthlyPayroll = useMemo(() => {
    return staffList.reduce((sum, s) => sum + s.monthlySalary, 0);
  }, [staffList]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-xl">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                {lang === 'ur' ? 'سٹاف اور تنخواہ رجسٹر (Staff & Payroll)' : 'Staff & Payroll Management'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'ur'
                  ? 'دکان کا عملہ، کیشیئرز، سیلزمین کا ریکارڈ اور ماہانہ تنخواہ کی ادائیگی'
                  : 'Manage shop personnel, assign roles, and record salary & advance payouts'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-950/40 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>{lang === 'ur' ? 'نیا ملازم شامل کریں' : 'Add New Staff'}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500">{lang === 'ur' ? 'کل ملازمین' : 'Total Staff'}</p>
          <p className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{staffList.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500">{lang === 'ur' ? 'ماہانہ تنخواہ کا بجٹ' : 'Monthly Payroll Budget'}</p>
          <p className="text-2xl font-black mt-1 text-purple-600 font-mono">
            Rs. {totalMonthlyPayroll.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500">{lang === 'ur' ? 'کل تنخواہ ادائیگیاں' : 'Total Salaries Paid'}</p>
          <p className="text-2xl font-black mt-1 text-emerald-600 font-mono">
            Rs.{' '}
            {staffList
              .reduce(
                (sum, s) =>
                  sum + s.payments.reduce((pSum, p) => pSum + p.amount, 0),
                0
              )
              .toLocaleString()}
          </p>
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffList.map((staff) => (
          <div
            key={staff.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 hover:border-purple-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {staff.name}
                  </h3>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    {staff.designation === 'CASHIER'
                      ? 'کاؤنٹر کیشیئر'
                      : staff.designation === 'SALESMAN'
                      ? 'سیلزمین'
                      : staff.designation === 'MANAGER'
                      ? 'سٹور ایڈمن'
                      : 'ہیلپر / ورکر'}
                  </span>
                </div>
                <div className="text-left font-mono">
                  <span className="text-[11px] text-slate-400 block">{lang === 'ur' ? 'ماہانہ تنخواہ' : 'Salary'}</span>
                  <span className="font-bold text-sm text-emerald-600">
                    Rs. {staff.monthlySalary.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-3 text-xs text-slate-600 dark:text-slate-400">
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-purple-500" />
                  <span>{staff.phone}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {lang === 'ur' ? 'تاریخ شمولیت:' : 'Joined:'} {staff.joiningDate}
                  </span>
                </p>
              </div>

              {/* Recent Payment Tag */}
              {staff.payments.length > 0 && (
                <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px] flex justify-between">
                  <span className="text-slate-500">
                    {lang === 'ur' ? 'آخری ادائیگی:' : 'Last Paid:'} ({staff.payments[0].month})
                  </span>
                  <span className="font-mono font-bold text-emerald-600">
                    Rs. {staff.payments[0].amount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Pay Button */}
            <button
              onClick={() => {
                setSelectedStaffToPay(staff);
                setPayAmount(staff.monthlySalary);
                setShowPayModal(true);
              }}
              className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>{lang === 'ur' ? 'تنخواہ / ایڈوانس ادا کریں' : 'Pay Salary / Advance'}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 text-white shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-xl">
                <UserPlus className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black">
                {lang === 'ur' ? 'نیا ملازم رجسٹر کریں' : 'Register New Staff Member'}
              </h2>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === 'ur' ? 'ملازم کا پورا نام *' : 'Staff Full Name *'}
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً: محمد رضوان"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === 'ur' ? 'عہدہ / ذمہ داری (Designation)' : 'Designation / Role'}
                </label>
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="SALESMAN">{lang === 'ur' ? 'سیلزمین (Salesman)' : 'Salesman'}</option>
                  <option value="CASHIER">{lang === 'ur' ? 'کاؤنٹر کیشیئر (Cashier)' : 'Cashier'}</option>
                  <option value="MANAGER">{lang === 'ur' ? 'سٹور ایڈمن / سپروائزر (Admin)' : 'Manager'}</option>
                  <option value="HELPER">{lang === 'ur' ? 'ہیلپر / لیبر (Helper)' : 'Helper'}</option>
                  <option value="OTHER">{lang === 'ur' ? 'دیگر (Other)' : 'Other'}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {lang === 'ur' ? 'موبائل نمبر *' : 'Phone Number *'}
                  </label>
                  <input
                    required
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0302-1234567"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {lang === 'ur' ? 'ماہانہ تنخواہ (Rs)' : 'Monthly Salary (Rs)'}
                  </label>
                  <input
                    type="number"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === 'ur' ? 'تاریخ شمولیت' : 'Joining Date'}
                </label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  {lang === 'ur' ? 'منسوخ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-950/50"
                >
                  {lang === 'ur' ? 'محفوظ کریں' : 'Save Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Salary Modal */}
      {showPayModal && selectedStaffToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 text-white shadow-2xl relative">
            <button
              onClick={() => setShowPayModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl">
                <Banknote className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black">
                  {lang === 'ur' ? 'تنخواہ یا ایڈوانس ادائیگی' : 'Salary Payout'}
                </h2>
                <p className="text-xs text-slate-400">
                  {selectedStaffToPay.name} (طے شدہ: Rs. {selectedStaffToPay.monthlySalary.toLocaleString()})
                </p>
              </div>
            </div>

            <form onSubmit={handlePaySalary} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === 'ur' ? 'ادائیگی کی قسم' : 'Payment Type'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayType('SALARY')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      payType === 'SALARY'
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {lang === 'ur' ? 'ماہانہ تنخواہ' : 'Salary'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayType('ADVANCE')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      payType === 'ADVANCE'
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {lang === 'ur' ? 'ایڈوانس' : 'Advance'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayType('BONUS')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      payType === 'BONUS'
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {lang === 'ur' ? 'بونس' : 'Bonus'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {lang === 'ur' ? 'ادائیگی رقم (Rs) *' : 'Amount (Rs) *'}
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {lang === 'ur' ? 'ماہ (Month)' : 'Month'}
                  </label>
                  <input
                    type="month"
                    value={payMonth}
                    onChange={(e) => setPayMonth(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === 'ur' ? 'تفصیل یا رسید ریمارکس' : 'Remarks'}
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="مثلاً: کیش ادا کی گئی"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  {lang === 'ur' ? 'منسوخ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/50"
                >
                  {lang === 'ur' ? 'ادائیگی کا اندراج کریں' : 'Confirm Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
