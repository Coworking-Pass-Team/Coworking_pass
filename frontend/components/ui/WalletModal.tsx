'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wallet, ArrowDownLeft, ArrowUpRight, PlusCircle, MinusCircle, 
  X, ShieldCheck, RefreshCw, CheckCircle2, History 
} from 'lucide-react';
import { useApp } from '@/app/store';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { currentUser, walletTransactions, fetchWallet, depositToWallet, withdrawFromWallet } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw'>('overview');
  const [amountInput, setAmountInput] = useState<string>('');
  const [descriptionInput, setDescriptionInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser?.id) {
      setIsLoadingWallet(true);
      fetchWallet(currentUser.id).finally(() => setIsLoadingWallet(false));
    }
  }, [isOpen, currentUser?.id]);

  if (!isOpen || !currentUser) return null;

  const currentBalance = currentUser.walletBalance || 0;

  const handleQuickAmount = (val: number) => {
    setAmountInput(val.toString());
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amountInput);
    if (isNaN(num) || num <= 0) return;

    setIsSubmitting(true);
    const res = await depositToWallet(num, descriptionInput.trim() || undefined);
    setIsSubmitting(false);

    if (res.success) {
      setAmountInput('');
      setDescriptionInput('');
      setActiveTab('overview');
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amountInput);
    if (isNaN(num) || num <= 0) return;
    if (num > currentBalance) return;

    setIsSubmitting(true);
    const res = await withdrawFromWallet(num, descriptionInput.trim() || undefined);
    setIsSubmitting(false);

    if (res.success) {
      setAmountInput('');
      setDescriptionInput('');
      setActiveTab('overview');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" dir="ltr">
      <div className="bg-[#FAF8F5] dark:bg-[#1A1F20] w-full max-w-lg rounded-3xl shadow-2xl border border-[#2D3536]/15 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#E8E4DF] dark:bg-[#252B2C] border-b border-[#2D3536]/10 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-moss/10 dark:bg-emerald-500/20 text-moss dark:text-emerald-400 flex items-center justify-center font-bold">
              <Wallet size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-soot dark:text-white">Digital Wallet</h2>
              <p className="text-xs text-soot/60 dark:text-white/60">Manage your balance, refunds & transactions</p>
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
          
          {/* Balance Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1C2D27] via-[#2A3F37] to-[#12211C] p-6 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-moss/20 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-medium text-emerald-200/80 tracking-wide uppercase">Available Balance</span>
                <div className="text-3xl font-extrabold mt-1 tracking-tight flex items-baseline gap-1.5">
                  <span className="text-sm font-semibold text-emerald-300">SAR</span>
                  <span>{currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (currentUser?.id) {
                    setIsLoadingWallet(true);
                    fetchWallet(currentUser.id).finally(() => setIsLoadingWallet(false));
                  }
                }}
                disabled={isLoadingWallet}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Refresh balance"
              >
                <RefreshCw size={16} className={isLoadingWallet ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  setActiveTab(activeTab === 'deposit' ? 'overview' : 'deposit');
                  setAmountInput('');
                  setDescriptionInput('');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <PlusCircle size={16} />
                <span>Top-up Wallet</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab(activeTab === 'withdraw' ? 'overview' : 'withdraw');
                  setAmountInput('');
                  setDescriptionInput('');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MinusCircle size={16} />
                <span>Withdraw</span>
              </button>
            </div>
          </div>

          {/* Form Tabs for Deposit / Withdraw */}
          {activeTab === 'deposit' && (
            <form onSubmit={handleDepositSubmit} className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <PlusCircle size={16} />
                  Top-up Wallet Balance
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="text-xs text-soot/60 dark:text-white/60 hover:underline"
                >
                  Cancel
                </button>
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <label className="block text-xs font-semibold text-soot/70 dark:text-white/70 mb-2">Quick Amounts (SAR)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 250, 500].map((val) => (
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
                      +SAR {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-soot/70 dark:text-white/70 mb-1">Amount (SAR)</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  placeholder="Enter amount..."
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-soot/15 dark:border-white/15 bg-white dark:bg-[#121617] text-soot dark:text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-xs font-semibold text-soot/70 dark:text-white/70 mb-1">Description / Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Credit card top-up..."
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
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
                    <span>Confirm Deposit</span>
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'withdraw' && (
            <form onSubmit={handleWithdrawSubmit} className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                  <MinusCircle size={16} />
                  Withdraw Funds
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="text-xs text-soot/60 dark:text-white/60 hover:underline"
                >
                  Cancel
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-soot/70 dark:text-white/70 mb-1">Amount to Withdraw (SAR)</label>
                <input
                  type="number"
                  min="1"
                  max={currentBalance}
                  step="any"
                  required
                  placeholder={`Available: SAR ${currentBalance}`}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-soot/15 dark:border-white/15 bg-white dark:bg-[#121617] text-soot dark:text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-xs font-semibold text-soot/70 dark:text-white/70 mb-1">Notes / Reason</label>
                <input
                  type="text"
                  placeholder="Bank account transfer..."
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-soot/15 dark:border-white/15 bg-white dark:bg-[#121617] text-soot dark:text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !amountInput || parseFloat(amountInput) <= 0 || parseFloat(amountInput) > currentBalance}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Confirm Withdrawal</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Transactions History List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-soot dark:text-white flex items-center gap-2">
                <History size={16} className="text-moss" />
                Recent Transactions
              </h3>
              <span className="text-xs text-soot/60 dark:text-white/60 font-medium">
                {walletTransactions.length} transaction{walletTransactions.length === 1 ? '' : 's'}
              </span>
            </div>

            {walletTransactions.length === 0 ? (
              <div className="p-8 text-center bg-white/50 dark:bg-white/5 rounded-2xl border border-dashed border-soot/15 dark:border-white/10">
                <Wallet className="mx-auto mb-2 text-soot/30 dark:text-white/30" size={32} />
                <p className="text-xs text-soot/60 dark:text-white/60 font-medium">No previous wallet transactions recorded yet</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pl-1">
                {walletTransactions.map((tx) => {
                  const txTypeUpper = (tx.type || '').toString().toUpperCase();
                  const descRaw = tx.description || '';
                  const descLower = descRaw.toLowerCase();

                  const isPositive =
                    txTypeUpper === 'DEPOSIT' ||
                    txTypeUpper === 'REFUND' ||
                    descLower.includes('refund') ||
                    descLower.includes('استرجاع') ||
                    descLower.includes('إيداع') ||
                    descLower.includes('top-up');

                  const isRefund = txTypeUpper === 'REFUND' || descLower.includes('refund') || descLower.includes('استرجاع');
                  const isDeposit = txTypeUpper === 'DEPOSIT' || descLower.includes('top-up') || descLower.includes('إيداع');

                  // Format description to English for historical records
                  let formattedDesc = descRaw;
                  if (!formattedDesc) {
                    formattedDesc = isDeposit ? 'Wallet Top-up' : isRefund ? 'Booking Refund' : 'Withdrawal';
                  } else {
                    formattedDesc = formattedDesc
                      .replace(/شحن رصيد المحفظة/g, 'Wallet Top-up')
                      .replace(/خصم من المحفظة/g, 'Wallet Withdrawal')
                      .replace(/استرجاع مبلغ الحجز الملغى/g, 'Refund for cancelled booking')
                      .replace(/استرجاع حجز/g, 'Booking refund')
                      .replace(/إيداع/g, 'Deposit')
                      .replace(/سحب/g, 'Withdrawal');
                  }

                  // Handle display of historical balanceAfter created with negative calculation
                  const displayBalanceAfter = Math.abs(tx.balanceAfter || 0);

                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-[#202627] border border-soot/10 dark:border-white/10 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isDeposit 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : isRefund
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          {isPositive ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-soot dark:text-white">
                            {formattedDesc}
                          </div>
                          <div className="text-[10px] text-soot/50 dark:text-white/50 flex items-center gap-2 mt-0.5">
                            <span>{new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            {tx.referenceId && <span className="font-mono">#{tx.referenceId.slice(-8)}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-sm font-extrabold ${
                          isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {isPositive ? '+' : '-'}{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
                        </div>
                        <div className="text-[10px] text-soot/50 dark:text-white/50">
                          Balance after: SAR {displayBalanceAfter.toLocaleString('en-US')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#E8E4DF] dark:bg-[#252B2C] border-t border-[#2D3536]/10 dark:border-white/10 flex items-center justify-between text-xs text-soot/60 dark:text-white/60 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Secure & Encrypted Transactions</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-soot/10 dark:bg-white/10 hover:bg-soot/20 dark:hover:bg-white/20 text-soot dark:text-white font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
