'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Building2,
  Sparkles,
  Calendar
} from 'lucide-react';
import { useApp } from '@/app/store';
import { getPayoutsApi, PayoutItemApi } from '@/services/authApi';

export default function PayoutsAdmin() {
  const { partners, payoutsApi, fetchPayouts } = useApp();
  const [payouts, setPayouts] = useState<PayoutItemApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadPayoutsData = async () => {
    setLoading(true);
    await fetchPayouts();
    const res = await getPayoutsApi();

    const apiList: PayoutItemApi[] = res.success && Array.isArray(res.data) ? res.data : [];
    const storeList: PayoutItemApi[] = Array.isArray(payoutsApi) ? (payoutsApi as any) : [];

    const mergedMap = new Map<string, PayoutItemApi>();
    apiList.forEach(p => mergedMap.set(p.id, p));
    storeList.forEach(p => mergedMap.set(p.id, p as any));

    setPayouts(Array.from(mergedMap.values()));
    setLoading(false);
  };

  useEffect(() => {
    loadPayoutsData();
  }, []);

  const filteredPayouts = payouts.filter(p => {
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const partnerName = p.partner?.brandName || '';
    const search = searchQuery.toLowerCase();

    const matchesSearch =
      p.id.toLowerCase().includes(search) ||
      p.partnerId.toLowerCase().includes(search) ||
      partnerName.toLowerCase().includes(search) ||
      p.billingMonth.toLowerCase().includes(search);

    return matchesStatus && matchesSearch;
  });

  const totalCount = payouts.length;
  const paidCount = payouts.filter(p => p.status === 'PAID').length;
  const pendingCount = payouts.filter(p => p.status === 'PENDING').length;
  const totalAmountDue = payouts
    .filter(p => p.status === 'PENDING')
    .reduce((acc, curr) => acc + (Number(curr.amountDue) || 0), 0);

  return (
    <div className="space-y-8">
      {/* 4 Theme-Aligned Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-soot/8 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-moss">Automated Payouts</span>
            <div className="w-8 h-8 rounded-xl bg-soot/5 flex items-center justify-center text-soot">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif-display text-soot">{totalCount}</div>
          <span className="text-[11px] text-moss mt-1 block">Calculated by Platform Engine</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-soot/8 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-moss">Pending Settlement</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif-display text-amber-950">
            SAR {totalAmountDue.toLocaleString()}
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-1 block">
            {pendingCount} Pending Transfers
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-soot/8 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-moss">Settled Statements</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-700">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif-display text-emerald-950">{paidCount}</div>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
            Transferred to Partners
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-soot/8 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-moss">Registered Partners</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-700">
              <Building2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif-display text-soot">{partners.length}</div>
          <span className="text-[11px] text-moss mt-1 block">Active Network Providers</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-soot/8 shadow-sm p-6 sm:p-8">
        {/* Header & Sync */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-soot/8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-soot/5 text-moss text-xs font-semibold mb-2">
              <Sparkles size={13} className="text-eucalyptus shrink-0" />
              <span>Automated PostgreSQL Partner Audit Log</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif-display font-normal text-soot tracking-tight">
              Partner Payouts & Revenue Share Audit
            </h2>
            <p className="text-moss text-xs sm:text-sm mt-1">
              Partner settlements are calculated automatically by the system based on visit scans and revenue share percentages.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadPayoutsData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-soot/15 bg-white text-soot hover:bg-plaster-dark/40 text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Sync Settlements</span>
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
              placeholder="Search by Payout ID, Partner Name, Partner ID, or Billing Month..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-soot/15 bg-plaster-surface text-soot text-xs sm:text-sm placeholder:text-moss/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-2xs"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-plaster-dark/40 rounded-2xl border border-soot/8 shrink-0">
            {(['ALL', 'PENDING', 'PAID'] as const).map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-soot text-plaster shadow-xs'
                    : 'text-moss hover:text-soot'
                }`}
              >
                {st === 'ALL' ? 'All Status' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Payouts Table */}
        {loading ? (
          <div className="py-16 text-center text-moss">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-soot" />
            <p className="text-xs sm:text-sm font-medium">Fetching partner payout audit logs from database...</p>
          </div>
        ) : filteredPayouts.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-soot/15 rounded-3xl my-4">
            <DollarSign size={32} className="mx-auto mb-3 text-moss/50" />
            <p className="text-soot font-semibold text-sm">No payout records found</p>
            <p className="text-moss text-xs mt-1 max-w-sm mx-auto">
              Partner payouts are generated automatically by the platform engine at monthly settlement periods.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-soot/10 shadow-2xs">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-plaster-dark/60 border-b border-soot/10 text-moss uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Payout ID</th>
                  <th className="py-3.5 px-4">Partner Brand</th>
                  <th className="py-3.5 px-4">Billing Month</th>
                  <th className="py-3.5 px-4">Total Visits</th>
                  <th className="py-3.5 px-4">Amount Due</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soot/8 text-soot font-medium">
                {filteredPayouts.map(p => {
                  const isPaid = p.status === 'PAID';
                  return (
                    <tr key={p.id} className="hover:bg-plaster-dark/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-soot">
                        {p.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-soot">{p.partner?.brandName || 'Partner'}</div>
                        <div className="text-[11px] text-moss font-mono truncate max-w-[170px]">
                          {p.partnerId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-soot/5 text-soot text-xs font-semibold">
                          <Calendar size={12} className="text-moss" />
                          {p.billingMonth}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-soot">
                        {p.totalVisitsReceived} visits
                      </td>
                      <td className="py-3.5 px-4 font-bold text-soot">
                        SAR {p.amountDue}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
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
