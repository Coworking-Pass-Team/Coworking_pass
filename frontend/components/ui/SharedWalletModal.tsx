'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Building2,
  PlusCircle,
  X,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Users,
  Coins,
  ArrowDownLeft,
  Briefcase,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '@/app/store';

interface SharedWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SharedWalletModal({ isOpen, onClose }: SharedWalletModalProps) {
  const {
    currentUser,
    companyWalletBalance,
    companyData,
    fetchCompanyWallet,
    depositToCompanyWallet,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'deposit'>('overview');
  const [amountInput, setAmountInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingWallet(true);
      fetchCompanyWallet(currentUser?.companyId).finally(() => setIsLoadingWallet(false));
    }
  }, [isOpen, currentUser?.companyId]);

  if (!isOpen || !currentUser) return null;

  const currentBalance = companyWalletBalance || companyData?.balance || 0;
  const companyName = companyData?.companyName || currentUser.orgName || currentUser.name || 'Corporate Account';
  const employeeCount = (companyData?.employees?.length) || (currentUser.employees?.length) || 1;
  const totalPassesAllocated = companyData?.totalPassesAllocated || (employeeCount * 5);

  const handleQuickAmount = (val: number) => {
    setAmountInput(val.toString());
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amountInput);
    if (isNaN(num) || num <= 0) return;

    setIsSubmitting(true);
    const res = await depositToCompanyWallet(num, currentUser?.companyId || companyData?.id);
    setIsSubmitting(false);

    if (res.success) {
      setAmountInput('');
      setActiveTab('overview');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] dark:bg-[#1A1F20] w-full max-w-lg rounded-3xl shadow-2xl border border-[#2D3536]/15 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-[#E8E4DF] dark:bg-[#252B2C] border-b border-[#2D3536]/10 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2D3536] text-white flex items-center justify-center font-bold shadow-xs">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-soot dark:text-white">المحفظة المشتركة</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 uppercase">
                  Shared Wallet
                </span>
              </div>
              <p className="text-xs text-soot/60 dark:text-white/60">{companyName} · B2B Corporate Pass</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-soot dark:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Main Shared Wallet Balance Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B2822] via-[#243B31] to-[#121F1A] p-6 text-white shadow-xl border border-white/10">
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-semibold text-emerald-200/90 tracking-wider uppercase flex items-center gap-1.5">
                  <Coins size={14} className="text-emerald-300" />
                  <span>رصيد المحفظة المشتركة المتاح</span>
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold mt-1 tracking-tight flex items-baseline gap-2">
                  <span className="text-base font-semibold text-emerald-300">SAR</span>
                  <span>{currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="text-xs text-emerald-100/70 mt-1">
                  Corporate Shared Wallet Balance
                </div>
              </div>
              <button
                onClick={() => {
                  setIsLoadingWallet(true);
                  fetchCompanyWallet(currentUser?.companyId).finally(() => setIsLoadingWallet(false));
                }}
                disabled={isLoadingWallet}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="تحديث الرصيد"
              >
                <RefreshCw size={16} className={isLoadingWallet ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  setActiveTab(activeTab === 'deposit' ? 'overview' : 'deposit');
                  setAmountInput('');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <PlusCircle size={16} />
                <span>شحن المحفظة المشتركة (Top-up)</span>
              </button>
            </div>
          </div>

          {/* Deposit Form */}
          {activeTab === 'deposit' && (
            <form
              onSubmit={handleDepositSubmit}
              className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <PlusCircle size={16} />
                  إيداع رصيد جديد في محفظة الشركة (Deposit API)
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="text-xs text-soot/60 dark:text-white/60 hover:underline cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <label className="block text-xs font-semibold text-soot/70 dark:text-white/70 mb-2">
                  المبالغ السريعة (SAR)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[500, 1000, 2500, 5000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickAmount(val)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        amountInput === val.toString()
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-white/5 border-soot/15 text-soot dark:text-white hover:border-emerald-500'
                      }`}
                    >
                      +{val.toLocaleString()} ر.س
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-soot/70 dark:text-white/70 mb-1">
                  المبلغ المراد شحنه (SAR) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  placeholder="أدخل المبلغ مثل: 1000..."
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-soot/15 dark:border-white/15 bg-white dark:bg-[#121617] text-soot dark:text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !amountInput || parseFloat(amountInput) <= 0}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>تأكيد الإيداع في المحفظة المشتركة</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Metrics Grid for B2B Allocation (FR-B2B-01 & FR-B2B-02) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#202627] border border-soot/10 dark:border-white/10 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users size={18} />
              </div>
              <div>
                <div className="text-xs text-moss">أعضاء الفريق على المحفظة</div>
                <div className="text-base font-bold text-soot dark:text-white">{employeeCount} موظف مشترك</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#202627] border border-soot/10 dark:border-white/10 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Briefcase size={18} />
              </div>
              <div>
                <div className="text-xs text-moss">الحصص المخصصة للزيارات</div>
                <div className="text-base font-bold text-soot dark:text-white">{totalPassesAllocated} زيارة / باقة</div>
              </div>
            </div>
          </div>

          {/* How Shared Wallet Works Info */}
          <div className="p-4 rounded-2xl bg-[#ECE7E1]/50 dark:bg-white/5 border border-soot/10 dark:border-white/10 space-y-2 text-xs text-moss">
            <div className="font-semibold text-soot dark:text-white flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>كيف تعمل المحفظة المشتركة (Shared Wallet):</span>
            </div>
            <ul className="space-y-1 list-disc list-inside">
              <li>تقوم الشركة بشحن الرصيد المجمع للمؤسسة عبر الـ API الفوري.</li>
              <li>يستطيع أي موظف مسجل بالفريق حجز مساحة العمل الأقرب له مباشرة.</li>
              <li>يُخصم الحجز تلقائياً من رصيد المحفظة المشتركة دون الحاجة لدفع فردي.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#E8E4DF] dark:bg-[#252B2C] border-t border-[#2D3536]/10 dark:border-white/10 flex items-center justify-between text-xs text-soot/60 dark:text-white/60 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>متصلة مباشرة مع Backend API (/api/companies/:id/deposit)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-soot/10 dark:bg-white/10 hover:bg-soot/20 dark:hover:bg-white/20 text-soot dark:text-white font-semibold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
