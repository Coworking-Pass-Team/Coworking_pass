'use client';

import { useState } from 'react';
import { Building2, LogOut, Mail, Users } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useApp } from '@/app/store';
import { removeCompanyEmployeeApi } from '@/services/authApi';
import Modal from '@/components/ui/Modal';

/**
 * Shown to a member account that belongs to a company team: which company, who manages it, and a way to leave.
 * Personal bookings and the personal wallet stay the member's own; team bookings are arranged by the HR admin.
 */
export default function CompanyMembershipCard({ compact = false }: { compact?: boolean }) {
  const { t, translateMessage } = useI18n();
  const { currentUser, companyData, updateCurrentUser, showToast } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const companyId = currentUser?.companyId;
  if (!currentUser || currentUser.role !== 'individual' || !companyId) return null;
  // Company details arrive with the company record; show the card once it is the member's own company
  const company = companyData && companyData.id === companyId ? companyData : null;
  const companyName: string = company?.companyName || currentUser.orgName || t('companyMember.yourCompany');
  const hrAdmin: { name?: string; email?: string } | undefined = company?.hrAdmin;
  const teamSize = Array.isArray(company?.employees) ? company.employees.length : null;

  const leave = async () => {
    setLeaving(true);
    const res = await removeCompanyEmployeeApi(companyId, currentUser.id);
    setLeaving(false);
    if (!res.success) {
      showToast(translateMessage(res.error), 'error');
      return;
    }
    setConfirmOpen(false);
    updateCurrentUser({ companyId: undefined, orgName: undefined }, { silent: true });
    showToast(t('companyMember.left', { company: companyName }), 'success');
  };

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
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-soot/15 bg-white text-soot text-xs font-semibold hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer"
        >
          <LogOut size={14} className="rtl:rotate-180" />
          {t('companyMember.leave')}
        </button>
      </div>
      {!compact && <p className="text-xs text-moss mt-3 leading-relaxed">{t('companyMember.explainer')}</p>}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('companyMember.leaveTitle')}
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setConfirmOpen(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button type="button" onClick={leave} disabled={leaving} className="btn-danger disabled:opacity-50">{t('companyMember.leaveConfirm')}</button>
          </>
        }
      >
        <p className="text-sm text-moss leading-relaxed">{t('companyMember.leaveBody', { company: companyName })}</p>
      </Modal>
    </div>
  );
}
