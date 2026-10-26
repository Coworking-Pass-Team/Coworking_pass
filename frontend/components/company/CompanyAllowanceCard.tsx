'use client';

import { Building2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useApp } from '@/app/store';

/** The company wallet a team member can see, and what the company's policy lets them spend from it this month. */
export function useCompanyAllowance() {
  const { currentUser, companyData, companyWalletBalance } = useApp();
  const isEmployee = !!currentUser && currentUser.role === 'individual' && !!currentUser.companyId;
  const company = isEmployee && companyData?.id === currentUser?.companyId ? companyData : null;
  return {
    isEmployee,
    company,
    balance: company ? companyWalletBalance || 0 : 0,
    allowance: (company?.memberAllowance ?? null) as { enabled: boolean; monthlyLimit: number | null; spentThisMonth: number; remaining: number } | null,
  };
}

export default function CompanyAllowanceCard({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const { isEmployee, company, balance, allowance } = useCompanyAllowance();
  if (!isEmployee || !company) return null;
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <div className={`rounded-2xl border border-soot/15 bg-soot/5 ${compact ? 'p-3.5' : 'p-4'} space-y-2`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-soot text-plaster flex items-center justify-center shrink-0">
            <Building2 size={17} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-moss">{t('companyWallet.title')}</div>
            <div className="text-xs text-moss truncate">{company.companyName}</div>
          </div>
        </div>
        <div className="text-end">
          <div className="text-[11px] font-semibold text-moss">{t('companyWallet.balance')}</div>
          <div className="text-lg font-bold text-soot flex items-baseline gap-1 justify-end">
            <span className="text-[11px] text-moss font-medium">{t('common.sar')}</span>
            <span>{fmt(balance)}</span>
          </div>
        </div>
      </div>
      {allowance?.enabled ? (
        <div className="text-xs text-soot bg-white/70 border border-soot/10 rounded-xl px-3 py-2 flex items-center justify-between gap-3 flex-wrap">
          <span>{t('companyWallet.allowanceLeft', { currency: t('common.sar'), remaining: fmt(allowance.remaining), limit: fmt(allowance.monthlyLimit ?? 0) })}</span>
          <span className="text-moss">{t('companyWallet.spentThisMonth', { currency: t('common.sar'), amount: fmt(allowance.spentThisMonth) })}</span>
        </div>
      ) : (
        <p className="text-xs text-moss leading-relaxed">{t('companyWallet.spendingOff')}</p>
      )}
    </div>
  );
}
