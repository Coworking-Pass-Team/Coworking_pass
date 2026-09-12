'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  DollarSign,
  Sparkles,
  ShieldCheck,
  Tag,
  Clock
} from 'lucide-react';
import { useApp } from '@/app/store';
import { getPaymentsApi, PaymentItemApi } from '@/services/authApi';

export default function PaymentsAdmin() {
  const { fetchPayments, paymentsApi } = useApp();
  const [payments, setPayments] = useState<PaymentItemApi[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [filterPaymentFor, setFilterPaymentFor] = useState<'ALL' | 'SUBSCRIPTION' | 'DIRECT_BOOKING' | 'HOURLY_BOOKING' | 'POINTS_REDEMPTION'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadPaymentsData = async () => {
    setLoading(true);
    await fetchPayments();
    const res = await getPaymentsApi();

    const apiList: PaymentItemApi[] = res.success && Array.isArray(res.data) ? res.data : [];
    const storeList: PaymentItemApi[] = Array.isArray(paymentsApi) ? (paymentsApi as any) : [];

    const mergedMap = new Map<string, PaymentItemApi>();
    apiList.forEach(p => mergedMap.set(p.id, p));
    storeList.forEach(p => mergedMap.set(p.id, p as any));

    setPayments(Array.from(mergedMap.values()));
    setLoading(false);
  };

  useEffect(() => {
    loadPaymentsData();
  }, []);

  const filteredPayments = payments.filter(p => {
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const matchesFor = filterPaymentFor === 'ALL' || p.paymentFor === filterPaymentFor;

    const userName = p.user?.name || '';
    const userEmail = p.user?.email || '';
    const refId = p.referenceId || '';
    const search = searchQuery.toLowerCase();

    const matchesSearch =
      p.id.toLowerCase().includes(search) ||
      p.userId.toLowerCase().includes(search) ||
      userName.toLowerCase().includes(search) ||
      userEmail.toLowerCase().includes(search) ||
      refId.toLowerCase().includes(search) ||
      p.method.toLowerCase().includes(search);

    return matchesStatus && matchesFor && matchesSearch;
  });

  const totalCount = payments.length;
  const successCount = payments.filter(p => p.status === 'SUCCESS').length;
  const failedCount = payments.filter(p => p.status === 'FAILED').length;
  const totalVolume = payments
    .filter(p => p.status === 'SUCCESS')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="space-y-8">
      {/* 4 Theme-Aligned Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-soot/8 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-moss">Automated Payments</span>
            <div className="w-8 h-8 rounded-xl bg-soot/5 flex items-center justify-center text-soot">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif-display text-soot">{totalCount}</div>
          <span className="text-[11px] text-moss mt-1 block">Auto-synced with PostgreSQL</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-soot/8 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-moss">Total Sales Volume</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-700">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif-display text-emerald-950">
            SAR {totalVolume.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
            {successCount} Successful Checkout Records
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-soot/8 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-moss">Failed Transactions</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-700">
              <XCircle size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif-display text-rose-950">{failedCount}</div>
          <span className="text-[11px] text-rose-700 font-medium mt-1 block">
            Auto-flagged Gateway Failures
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-soot/8 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-moss">Gateway Protection</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-700">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-sm font-semibold text-soot">MADA, VISA, Apple Pay</div>
          <span className="text-[11px] text-moss mt-1 block">SAMA Standard Compliant</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-soot/8 shadow-sm p-6 sm:p-8">
        {/* Header & Refresh */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-soot/8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-soot/5 text-moss text-xs font-semibold mb-2">
              <Sparkles size={13} className="text-eucalyptus shrink-0" />
              <span>Automated PostgreSQL Audit Log</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif-display font-normal text-soot tracking-tight">
              Payments & Financial Audit Log
            </h2>
            <p className="text-moss text-xs sm:text-sm mt-1">
              Payments are recorded automatically in PostgreSQL whenever users purchase subscriptions or book workspaces.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadPaymentsData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-soot/15 bg-white text-soot hover:bg-plaster-dark/40 text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Sync Records</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 my-6">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-moss pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Payment ID, User Email, Name, or Reference ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-soot/15 bg-plaster-surface text-soot text-xs sm:text-sm placeholder:text-moss/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-2xs"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-plaster-dark/40 rounded-2xl border border-soot/8 shrink-0">
            {(['ALL', 'SUCCESS', 'FAILED'] as const).map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-soot text-plaster shadow-xs'
                    : 'text-moss hover:text-soot'
                }`}
              >
                {st === 'ALL' ? 'All Status' : st}
              </button>
            ))}
          </div>

          {/* Payment For Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-plaster-dark/40 rounded-2xl border border-soot/8 shrink-0 overflow-x-auto">
            {(['ALL', 'SUBSCRIPTION', 'DIRECT_BOOKING', 'HOURLY_BOOKING', 'POINTS_REDEMPTION'] as const).map(pf => (
              <button
                key={pf}
                type="button"
                onClick={() => setFilterPaymentFor(pf)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filterPaymentFor === pf
                    ? 'bg-soot text-plaster shadow-xs'
                    : 'text-moss hover:text-soot'
                }`}
              >
                {pf === 'ALL' ? 'All Purpose' : pf.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Payments Table */}
        {loading ? (
          <div className="py-16 text-center text-moss">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-soot" />
            <p className="text-xs sm:text-sm font-medium">Fetching payment audit logs from database...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-soot/15 rounded-3xl my-4">
            <CreditCard size={32} className="mx-auto mb-3 text-moss/50" />
            <p className="text-soot font-semibold text-sm">No payment records found</p>
            <p className="text-moss text-xs mt-1 max-w-sm mx-auto">
              Payments are recorded automatically when users buy subscriptions or book spaces.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-soot/10 shadow-2xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-plaster-dark/60 border-b border-soot/10 text-moss uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Payment ID</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Payment For</th>
                  <th className="py-3.5 px-4">Reference ID</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soot/8 text-soot font-medium">
                {filteredPayments.map(p => {
                  const isSuccess = p.status === 'SUCCESS';
                  return (
                    <tr key={p.id} className="hover:bg-plaster-dark/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-soot">
                        {p.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-soot">{p.user?.name || 'User'}</div>
                        <div className="text-[11px] text-moss font-mono truncate max-w-[170px]">
                          {p.user?.email || p.userId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-soot">
                        SAR {p.amount}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-soot/5 border border-soot/10 text-soot font-semibold text-xs">
                          <CreditCard size={12} className="text-moss" />
                          {p.method}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-plaster-dark/60 text-soot text-xs font-semibold">
                          <Tag size={11} className="text-moss" />
                          {p.paymentFor.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-moss">
                        {p.referenceId || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {isSuccess ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          <span>{p.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
