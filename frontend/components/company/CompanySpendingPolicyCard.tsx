'use client';

import { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useApp } from '@/app/store';
import { updateCompanyApi } from '@/services/authApi';

/**
 * Corporate policy for the HR admin: may team members pay their own bookings from the company wallet, and how much
 * each member may take per month. The server refuses a member's payment once the limit is reached.
 */
export default function CompanySpendingPolicyCard() {
  const { t, translateMessage } = useI18n();
  const { currentUser, companyData, fetchCompanyWallet, showToast } = useApp();
  const companyId = currentUser?.companyId || companyData?.id;
  const [enabled, setEnabled] = useState(false);
  const [limit, setLimit] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!companyData) return;
    setEnabled(!!companyData.employeeSpendingEnabled);
    setLimit(typeof companyData.employeeMonthlyLimit === 'number' ? String(companyData.employeeMonthlyLimit) : '');
  }, [companyData?.id, companyData?.employeeSpendingEnabled, companyData?.employeeMonthlyLimit]);

  if (!companyId || currentUser?.role !== 'organization') return null;

  const limitNumber = Number(limit);
  const limitValid = limit.trim() !== '' && Number.isFinite(limitNumber) && limitNumber > 0;
  const dirty =
    enabled !== !!companyData?.employeeSpendingEnabled ||
    (limitValid ? limitNumber : null) !== (typeof companyData?.employeeMonthlyLimit === 'number' ? companyData.employeeMonthlyLimit : null);

  const save = async () => {
    if (enabled && !limitValid) {
      showToast(t('spendingPolicy.limitRequired'), 'error');
      return;
    }
    setSaving(true);
    const res = await updateCompanyApi(companyId, {
      employeeSpendingEnabled: enabled,
      employeeMonthlyLimit: limitValid ? limitNumber : null,
    });
    setSaving(false);
    if (!res.success) {
      showToast(translateMessage(res.error), 'error');
      return;
    }
    await fetchCompanyWallet(companyId);
    showToast(t('spendingPolicy.saved'), 'success');
  };

  return (
    <div className="rounded-3xl border border-soot/12 bg-plaster-surface p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-soot text-plaster flex items-center justify-center shrink-0">
          <Wallet size={20} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-soot">{t('spendingPolicy.title')}</h2>
          <p className="text-xs text-moss leading-relaxed mt-0.5">{t('spendingPolicy.body')}</p>
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm font-medium text-soot cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="w-4 h-4 rounded border-soot/30 accent-soot cursor-pointer"
        />
        {t('spendingPolicy.enable')}
      </label>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="member-monthly-limit" className="block text-xs font-semibold text-moss mb-1">
            {t('spendingPolicy.limitLabel', { currency: t('common.sar') })}
          </label>
          <input
            id="member-monthly-limit"
            type="number"
            min="1"
            inputMode="decimal"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            disabled={!enabled}
            placeholder="500"
            className="w-44 px-3 py-2.5 rounded-xl border border-soot/15 bg-white text-soot text-sm outline-none focus:border-eucalyptus disabled:opacity-50"
          />
        </div>
        <button type="button" onClick={save} disabled={saving || !dirty} className="btn-primary px-5 py-2.5 text-xs disabled:opacity-50">
          {t('spendingPolicy.save')}
        </button>
      </div>
      <p className="text-[11px] text-moss">{t('spendingPolicy.note')}</p>
    </div>
  );
}
