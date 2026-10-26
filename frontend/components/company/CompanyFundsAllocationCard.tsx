'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Send, Users, Wallet } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useApp } from '@/app/store';
import { allocateCompanyFundsApi, getCompanyAllocationsApi } from '@/services/authApi';
import Modal from '@/components/ui/Modal';

type Mode = 'EQUAL' | 'SPECIFIC';
interface Member { id: string; name: string; email: string }
interface HistoryRow { id: string; amount: number; employeeName: string; createdAt: string }

const cents = (n: number) => Math.round(n * 100);
const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/**
 * HR admin: move money from the company wallet into team members' own wallets, either shared equally among
 * everyone or as chosen amounts for chosen people. Employees never see the company balance; they only see
 * what lands in their own wallet and book with it like any other balance.
 */
export default function CompanyFundsAllocationCard() {
  const { t, translateMessage, formatDate } = useI18n();
  const { currentUser, companyData, companyWalletBalance, fetchCompanyWallet, showToast } = useApp();
  const companyId = currentUser?.companyId || companyData?.id;
  const [mode, setMode] = useState<Mode>('EQUAL');
  const [total, setTotal] = useState('');
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [bulk, setBulk] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  // One id per confirmation, so pressing the button twice or retrying after a dropped connection pays once
  const requestIdRef = useRef<string>('');

  const members: Member[] = useMemo(
    () =>
      (Array.isArray(companyData?.employees) ? companyData.employees : [])
        .filter((e: any) => e.role === 'B2C' && e.id !== currentUser?.id)
        .map((e: any) => ({ id: e.id, name: e.name || e.email || '', email: e.email || '' })),
    [companyData?.employees, currentUser?.id]
  );

  const loadHistory = useCallback(async () => {
    if (!companyId) return;
    const res = await getCompanyAllocationsApi(companyId);
    if (res.success) setHistory(res.data.slice(0, 10));
  }, [companyId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  if (!companyId || currentUser?.role !== 'organization') return null;

  const balance = companyWalletBalance || 0;
  const equalTotal = Number(total);
  const equalShare = members.length > 0 && equalTotal > 0 ? Math.floor(cents(equalTotal) / members.length) / 100 : 0;
  const equalSum = Math.round(equalShare * members.length * 100) / 100;
  const picked = members.filter((m) => Number(amounts[m.id]) > 0);
  const specificSum = Math.round(picked.reduce((s, m) => s + cents(Number(amounts[m.id])), 0)) / 100;
  const sum = mode === 'EQUAL' ? equalSum : specificSum;
  const recipients = mode === 'EQUAL' ? members.length : picked.length;

  const problem = (() => {
    if (members.length === 0) return t('allocation.noMembers');
    if (mode === 'EQUAL' && equalShare <= 0) return t('allocation.errAmount');
    if (mode === 'SPECIFIC' && picked.length === 0) return t('allocation.errNone');
    if (sum > balance + 0.0001) return t('allocation.errNotEnough');
    return '';
  })();

  const applyBulk = () => {
    const value = Number(bulk);
    if (!(value > 0)) return;
    setAmounts((prev) => {
      const next = { ...prev };
      for (const m of members) if (next[m.id] !== undefined && Number(next[m.id]) > 0) next[m.id] = String(value);
      return next;
    });
  };

  const toggleMember = (id: string, on: boolean) => {
    setAmounts((prev) => {
      const next = { ...prev };
      if (on) next[id] = bulk && Number(bulk) > 0 ? bulk : next[id] && Number(next[id]) > 0 ? next[id] : '1';
      else delete next[id];
      return next;
    });
  };

  const openConfirm = () => {
    if (problem) {
      showToast(problem, 'error');
      return;
    }
    requestIdRef.current = (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    setConfirmOpen(true);
  };

  const submit = async () => {
    setSending(true);
    const res = await allocateCompanyFundsApi(
      companyId,
      mode === 'EQUAL'
        ? { requestId: requestIdRef.current, mode, amount: equalTotal }
        : { requestId: requestIdRef.current, mode, allocations: picked.map((m) => ({ userId: m.id, amount: Number(amounts[m.id]) })) }
    );
    setSending(false);
    if (!res.success) {
      showToast(translateMessage(res.error ?? ''), 'error');
      return;
    }
    setConfirmOpen(false);
    setTotal('');
    setAmounts({});
    setBulk('');
    showToast(t('allocation.done', { count: res.data.recipients, currency: t('common.sar'), total: money(res.data.total) }), 'success');
    await fetchCompanyWallet(companyId);
    await loadHistory();
  };

  return (
    <div className="rounded-3xl border border-soot/12 bg-plaster-surface p-5 sm:p-6 shadow-2xs space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-soot text-plaster flex items-center justify-center shrink-0"><Send size={20} /></div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-soot">{t('allocation.title')}</h2>
            <p className="text-xs text-moss leading-relaxed mt-0.5 max-w-xl">{t('allocation.body')}</p>
          </div>
        </div>
        <div className="text-end">
          <div className="text-[11px] font-semibold text-moss flex items-center gap-1.5 justify-end"><Wallet size={12} />{t('allocation.balance')}</div>
          <div className="text-xl font-bold text-soot">{t('common.sar')} {money(balance)}</div>
        </div>
      </div>

      <div className="inline-flex p-1 rounded-2xl bg-white border border-soot/12 shadow-2xs" role="tablist">
        {(['EQUAL', 'SPECIFIC'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${mode === m ? 'bg-soot text-plaster shadow-xs' : 'text-moss hover:text-soot'}`}
          >
            {m === 'EQUAL' ? t('allocation.modeEqual') : t('allocation.modeSpecific')}
          </button>
        ))}
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-moss">{t('allocation.noMembers')}</p>
      ) : mode === 'EQUAL' ? (
        <div className="space-y-2">
          <label htmlFor="alloc-total" className="block text-xs font-semibold text-moss">{t('allocation.totalLabel', { currency: t('common.sar') })}</label>
          <input
            id="alloc-total"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="1000"
            className="w-56 px-3.5 py-2.5 rounded-xl border border-soot/15 bg-white text-soot text-sm outline-none focus:border-eucalyptus"
          />
          {equalShare > 0 && (
            <p className="text-xs text-soot bg-white/70 border border-soot/10 rounded-xl px-3 py-2 inline-flex items-center gap-2">
              <Users size={13} className="text-moss" />
              {t('allocation.perMember', { count: members.length, currency: t('common.sar'), amount: money(equalShare) })}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-end gap-2 flex-wrap">
            <div>
              <label htmlFor="alloc-bulk" className="block text-xs font-semibold text-moss mb-1">{t('allocation.sameAmount', { currency: t('common.sar') })}</label>
              <input
                id="alloc-bulk"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
                className="w-40 px-3 py-2 rounded-xl border border-soot/15 bg-white text-soot text-sm outline-none focus:border-eucalyptus"
              />
            </div>
            <button type="button" onClick={applyBulk} className="btn-secondary px-3.5 py-2 text-xs">{t('allocation.applyToSelected')}</button>
          </div>
          <ul className="divide-y divide-soot/8 rounded-2xl border border-soot/10 bg-white overflow-hidden">
            {members.map((m) => {
              const on = amounts[m.id] !== undefined;
              return (
                <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => toggleMember(m.id, e.target.checked)}
                    aria-label={m.name}
                    className="w-4 h-4 rounded border-soot/30 accent-soot cursor-pointer shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-soot truncate">{m.name}</div>
                    <div className="text-[11px] text-moss truncate" dir="ltr">{m.email}</div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    disabled={!on}
                    value={amounts[m.id] ?? ''}
                    onChange={(e) => setAmounts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                    aria-label={t('allocation.amountFor', { name: m.name })}
                    className="w-28 px-3 py-1.5 rounded-lg border border-soot/15 bg-white text-soot text-sm outline-none focus:border-eucalyptus disabled:opacity-40"
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
        <div className="text-xs text-moss space-y-0.5">
          <div>{t('allocation.totalToSend', { count: recipients, currency: t('common.sar'), amount: money(sum) })}</div>
          <div>{t('allocation.balanceAfter', { currency: t('common.sar'), amount: money(Math.max(0, balance - sum)) })}</div>
        </div>
        <button type="button" onClick={openConfirm} disabled={sum <= 0} className="btn-primary px-5 py-2.5 text-xs disabled:opacity-50">
          {t('allocation.review')}
        </button>
      </div>
      {problem && sum > 0 && <p className="text-xs text-red-700">{problem}</p>}

      {history.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-moss mb-2">{t('allocation.historyTitle')}</h3>
          <ul className="divide-y divide-soot/8 rounded-2xl border border-soot/10 bg-white overflow-hidden text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 px-4 py-2">
                <span className="text-soot truncate">{h.employeeName}</span>
                <span className="text-moss text-xs shrink-0">{formatDate(h.createdAt)}</span>
                <span className="font-semibold text-soot shrink-0">{t('common.sar')} {money(h.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => !sending && setConfirmOpen(false)}
        title={t('allocation.confirmTitle')}
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setConfirmOpen(false)} disabled={sending} className="btn-secondary">{t('common.cancel')}</button>
            <button type="button" onClick={submit} disabled={sending} className="btn-primary disabled:opacity-50">{t('allocation.confirm')}</button>
          </>
        }
      >
        <p className="text-sm text-moss leading-relaxed">
          {t('allocation.confirmBody', { currency: t('common.sar'), total: money(sum), count: recipients })}
        </p>
      </Modal>
    </div>
  );
}
