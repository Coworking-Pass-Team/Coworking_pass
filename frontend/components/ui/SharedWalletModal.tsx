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
  ArrowUpRight,
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingWallet(true);
      fetchCompanyWallet(currentUser?.companyId).finally(() => setIsLoadingWallet(false));
    }
  }, [isOpen, currentUser?.companyId]);

  if (!isOpen || !currentUser) return null;

  const currentBalance = companyWalletBalance ?? companyData?.balance ?? 0;
  const companyName = companyData?.companyName || currentUser.orgName || 'Corporate Account';
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
    setSuccessMessage(null);
    const res = await depositToCompanyWallet(num, currentUser?.companyId || companyData?.id);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(`Successfully added SAR ${num.toLocaleString()} to corporate wallet.`);
      setAmountInput('');
      setTimeout(() => {
        setSuccessMessage(null);
        setActiveTab('overview');
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-soot/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="bg-plaster-surface w-full max-w-lg rounded-3xl shadow-2xl border border-soot/12 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-plaster-dark/40 border-b border-soot/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-soot text-plaster flex items-center justify-center font-bold shadow-xs">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif-display font-normal text-soot">Corporate Shared Wallet</h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-[#DDE6DF] text-soot border border-soot/10 tracking-wide uppercase">
                  B2B Pool
                </span>
              </div>
              <p className="text-xs text-moss">{companyName} · All-Access Pass Allocation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-soot/5 hover:bg-soot/10 text-soot flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Main Shared Wallet Balance Card */}
          <div className="relative overflow-hidden rounded-3xl bg-soot p-6 text-plaster shadow-xl border border-soot/20">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#DDE6DF]/15 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-semibold text-plaster/70 tracking-wider uppercase flex items-center gap-1.5">
                  <Coins size={14} className="text-[#98AA9D]" />
                  <span>Available Balance</span>
                </span>
                <div className="text-3xl sm:text-4xl font-serif-display font-normal mt-1 tracking-tight flex items-baseline gap-2 text-plaster">
                  <span className="text-base font-sans font-medium text-plaster/70">SAR</span>
                  <span>{currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="text-xs text-plaster/60 mt-1 font-sans">
                  Shared corporate funds available for verified team bookings
                </div>
              </div>
              <button
                onClick={() => {
                  setIsLoadingWallet(true);
                  fetchCompanyWallet(currentUser?.companyId).finally(() => setIsLoadingWallet(false));
                }}
                disabled={isLoadingWallet}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-plaster transition-colors cursor-pointer"
                title="Refresh live balance"
              >
                <RefreshCw size={15} className={isLoadingWallet ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  setActiveTab(activeTab === 'deposit' ? 'overview' : 'deposit');
                  setAmountInput('');
                  setSuccessMessage(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#DDE6DF] hover:bg-[#CFDDD2] text-soot text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <PlusCircle size={15} />
                <span>{activeTab === 'deposit' ? 'View Overview' : 'Top Up Wallet'}</span>
              </button>
            </div>
          </div>

          {/* Success Message Alert */}
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Deposit Form */}
          {activeTab === 'deposit' && (
            <form
              onSubmit={handleDepositSubmit}
              className="bg-plaster-dark/30 border border-soot/12 rounded-3xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-soot flex items-center gap-2">
                  <PlusCircle size={16} className="text-moss" />
                  Top Up Company Balance
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="text-xs text-moss hover:text-soot underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <label className="block text-xs font-semibold text-soot mb-2">
                  Quick Amount (SAR)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[500, 1000, 2500, 5000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickAmount(val)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        amountInput === val.toString()
                          ? 'bg-soot text-plaster border-soot shadow-xs'
                          : 'bg-plaster-surface border-soot/15 text-soot hover:border-soot/40'
                      }`}
                    >
                      +{val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-soot mb-1">
                  Deposit Amount (SAR) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="e.g. 1500"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-soot/15 bg-plaster-surface text-soot text-sm focus:outline-none focus:ring-2 focus:ring-soot/20"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-moss font-semibold pointer-events-none">
                    SAR
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !amountInput || parseFloat(amountInput) <= 0}
                className="w-full py-3 rounded-xl bg-soot hover:bg-soot-light disabled:opacity-50 text-plaster text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw size={16} className="animate-spin text-plaster" />
                ) : (
                  <>
                    <CheckCircle2 size={16} className="text-[#98AA9D]" />
                    <span>Confirm Deposit</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Metrics Grid for B2B Allocation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-plaster-dark/30 border border-soot/10 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#DDE6DF] text-soot flex items-center justify-center shrink-0 border border-soot/10 shadow-2xs">
                <Users size={18} />
              </div>
              <div>
                <div className="text-xs text-moss font-medium">Enrolled Members</div>
                <div className="text-base font-serif-display font-normal text-soot">{employeeCount} Team Members</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-plaster-dark/30 border border-soot/10 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#DDE6DF] text-soot flex items-center justify-center shrink-0 border border-soot/10 shadow-2xs">
                <Briefcase size={18} />
              </div>
              <div>
                <div className="text-xs text-moss font-medium">Allocated Credits</div>
                <div className="text-base font-serif-display font-normal text-soot">{totalPassesAllocated} Monthly Passes</div>
              </div>
            </div>
          </div>

          {/* How Shared Wallet Works Info */}
          <div className="p-4 rounded-2xl bg-plaster-dark/20 border border-soot/10 space-y-2 text-xs text-moss">
            <div className="font-semibold text-soot flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-[#697C70]" />
              <span>How Corporate Shared Wallet Works:</span>
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-moss leading-relaxed">
              <li>Corporate balance is shared across all registered company employees.</li>
              <li>Booking fees for workspaces and meeting rooms are automatically deducted from this balance.</li>
              <li>Company HR & Admin can top up funds at any time with instant balance updates.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-plaster-dark/30 border-t border-soot/10 flex items-center justify-between text-xs text-moss">
          <span>Enterprise Billing · Coworking Pass</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-soot/5 hover:bg-soot/10 text-soot font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
