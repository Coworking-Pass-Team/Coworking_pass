'use client';

import { useCallback, useEffect, useState } from 'react';
import { Gauge, Pencil } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useApp } from '@/app/store';
import { getCompanyMemberFundsApi, setCompanyMemberLimitApi, type MemberFundsRow } from '@/services/api';
import Modal from '@/components/ui/Modal';

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/**
 * HR admin: the company money each member still holds, what they spent of it this month and their optional
 * monthly limit. Members spend company money first; past the limit they pay with their own money. When a member
 * is removed, the unspent company money returns to the company wallet.
 */
export default function CompanyMemberFundsCard() {
  const { t, translateMessage } = useI18n();
  const { currentUser, companyData, companyWalletBalance, showToast } = useApp();
  const companyId = currentUser?.companyId || companyData?.id;
  const [rows, setRows] = useState<MemberFundsRow[]>([]);
  const [editing, setEditing] = useState<MemberFundsRow | null>(null);
  const [limitInput, setLimitInput] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) return;
    const res = await getCompanyMemberFundsApi(companyId);
    if (res.success) setRows(res.data);
  }, [companyId]);

  // Reload after allocations and removals, which change the company balance
  useEffect(() => {
    load();
  }, [load, companyWalletBalance, companyData?.employees]);

  if (!companyId || currentUser?.role !== 'organization' || rows.length === 0) return null;

  const openEdit = (row: MemberFundsRow) => {
    setEditing(row);
    setLimitInput(row.monthlyLimit === null ? '' : String(row.monthlyLimit));
  };

  const save = async (limit: number | null) => {
    if (!editing) return;
    if (limit !== null && !(limit >= 0)) {
      showToast(t('memberFunds.errLimit'), 'error');
      return;
    }
    setSaving(true);
    const res = await setCompanyMemberLimitApi(companyId, editing.userId, limit);
    setSaving(false);
    if (!res.success) {
      showToast(translateMessage(res.error), 'error');
      return;
    }
    showToast(translateMessage(res.message), 'success');
    setEditing(null);
    await load();
  };

  return (
    <div className="rounded-3xl border border-soot/12 bg-plaster-surface p-5 sm:p-6 shadow-2xs space-y-4" data-testid="member-funds-card">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-soot text-plaster flex items-center justify-center shrink-0"><Gauge size={20} /></div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-soot">{t('memberFunds.title')}</h2>
          <p className="text-xs text-moss leading-relaxed mt-0.5 max-w-xl">{t('memberFunds.body')}</p>
        </div>
      </div>

      <ul className="divide-y divide-soot/8 rounded-2xl border border-soot/10 bg-white overflow-hidden">
        {rows.map((row) => (
          <li key={row.userId} className="flex items-center gap-3 px-4 py-3 flex-wrap">
            <div className="min-w-0 flex-1 basis-40">
              <div className="text-sm font-medium text-soot truncate">{row.name}</div>
              <div className="text-[11px] text-moss truncate" dir="ltr">{row.email}</div>
            </div>
            <div className="text-xs text-moss space-y-0.5 text-end">
              <div>{t('memberFunds.unspent', { currency: t('common.sar'), amount: money(row.companyCredit) })}</div>
              <div>
                {row.monthlyLimit === null
                  ? t('memberFunds.spentNoLimit', { currency: t('common.sar'), spent: money(row.spentThisMonth) })
                  : t('memberFunds.spentOfLimit', { currency: t('common.sar'), spent: money(row.spentThisMonth), limit: money(row.monthlyLimit) })}
              </div>
            </div>
            <button type="button" onClick={() => openEdit(row)} className="btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1.5">
              <Pencil size={12} />
              {t('memberFunds.setLimit')}
            </button>
          </li>
        ))}
      </ul>

      <Modal
        open={!!editing}
        onClose={() => !saving && setEditing(null)}
        title={t('memberFunds.limitTitle', { name: editing?.name ?? '' })}
        size="sm"
        footer={
          <>
            {editing?.monthlyLimit !== null && (
              <button type="button" onClick={() => save(null)} disabled={saving} className="btn-secondary disabled:opacity-50" data-testid="member-limit-remove">{t('memberFunds.removeLimit')}</button>
            )}
            <button
              type="button"
              onClick={() => save(limitInput.trim() === '' ? null : Number(limitInput))}
              disabled={saving}
              className="btn-primary disabled:opacity-50"
              data-testid="member-limit-save"
            >
              {t('memberFunds.save')}
            </button>
          </>
        }
      >
        <label htmlFor="member-limit" className="block text-xs font-semibold text-moss mb-1">{t('memberFunds.limitLabel', { currency: t('common.sar') })}</label>
        <input
          id="member-limit"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={limitInput}
          onChange={(e) => setLimitInput(e.target.value)}
          className="w-48 px-3.5 py-2.5 rounded-xl border border-soot/15 bg-white text-soot text-sm outline-none focus:border-eucalyptus"
        />
        <p className="text-[11px] text-moss mt-2 leading-relaxed">{t('memberFunds.limitHint')}</p>
      </Modal>
    </div>
  );
}
