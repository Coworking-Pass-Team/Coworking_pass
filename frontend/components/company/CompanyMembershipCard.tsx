'use client';

import { Building2, Mail, Users } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useApp } from '@/app/store';
import CompanyAllowanceCard from '@/components/company/CompanyAllowanceCard';

/**
 * Shown to a member account that belongs to a company team: which company and who manages it.
 * Members cannot leave on their own; only the company's HR admin adds and removes team members.
 */
export default function CompanyMembershipCard({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const { currentUser, companyData } = useApp();

  const companyId = currentUser?.companyId;
  if (!currentUser || currentUser.role !== 'individual' || !companyId) return null;
  // Company details arrive with the company record; show the card once it is the member's own company
  const company = companyData && companyData.id === companyId ? companyData : null;
  const companyName: string = company?.companyName || currentUser.orgName || t('companyMember.yourCompany');
  const hrAdmin: { name?: string; email?: string } | undefined = company?.hrAdmin;
  const teamSize = Array.isArray(company?.employees) ? company.employees.length : null;

  return (
    <div className={`rounded-3xl border border-eucalyptus/40 bg-[#E5ECE9]/60 ${compact ? 'p-4' : 'p-5 sm:p-6'} shadow-2xs`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-soot text-plaster flex items-center justify-center shrink-0">
            <Building2 size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-moss">{t('companyMember.title')}</div>
            <div className="text-lg font-semibold text-soot truncate">{companyName}</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-moss">
              {hrAdmin?.name && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={12} className="shrink-0" />
                  {t('companyMember.managedBy', { name: hrAdmin.name })}
                  {hrAdmin.email && <a href={`mailto:${hrAdmin.email}`} dir="ltr" className="underline underline-offset-2 hover:text-soot">{hrAdmin.email}</a>}
                </span>
              )}
              {teamSize !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <Users size={12} className="shrink-0" />
                  {t('companyMember.teamSize', { count: teamSize })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      {!compact && <div className="mt-4"><CompanyAllowanceCard compact /></div>}
      {!compact && <p className="text-xs text-moss mt-3 leading-relaxed">{t('companyMember.explainer')}</p>}
    </div>
  );
}
