'use client';

import { useEffect, useState } from 'react';
import { Check, UserPlus, X } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useApp } from '@/app/store';
import { answerJoinRequestApi, listCompanyJoinRequestsApi, type CompanyJoinRequestItem } from '@/services/api';
import UserAvatar from '@/components/ui/UserAvatar';

/** For the HR admin: employees who signed up (or asked from their profile) to join the company team. */
export default function CompanyJoinRequestsPanel() {
  const { t, translateMessage, lang } = useI18n();
  const { currentUser, companyData, fetchCompanyWallet, showToast } = useApp();
  const [requests, setRequests] = useState<CompanyJoinRequestItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const isHrAdmin = currentUser?.role === 'organization';
  const userId = currentUser?.id;

  useEffect(() => {
    if (!isHrAdmin || !userId) return;
    let cancelled = false;
    listCompanyJoinRequestsApi().then((res) => {
      if (!cancelled && res.success && Array.isArray(res.data)) setRequests(res.data);
    });
    return () => { cancelled = true; };
  }, [isHrAdmin, userId]);

  if (!isHrAdmin || requests.length === 0) return null;

  const answer = async (item: CompanyJoinRequestItem, action: 'approve' | 'decline') => {
    setBusyId(item.id);
    const res = await answerJoinRequestApi(item.id, action);
    setBusyId(null);
    if (!res.success) {
      showToast(translateMessage(res.error), 'error');
      return;
    }
    setRequests((prev) => prev.filter((r) => r.id !== item.id));
    showToast(t(action === 'approve' ? 'companyJoin.approved' : 'companyJoin.declined', { name: item.user.name }), action === 'approve' ? 'success' : 'info');
    const companyId = currentUser?.companyId || companyData?.id;
    if (action === 'approve' && companyId) fetchCompanyWallet(companyId).catch(() => {});
  };

  const dateFormat = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'short' });

  return (
    <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-6 shadow-2xs">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
          <UserPlus size={17} />
        </div>
        <div>
          <div className="text-sm font-semibold text-soot">{t('companyJoin.requestsTitle', { count: requests.length })}</div>
          <p className="text-xs text-amber-900/80">{t('companyJoin.requestsBody')}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {requests.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 flex-wrap bg-plaster-surface rounded-2xl border border-soot/10 px-3.5 py-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <UserAvatar name={item.user.name} size="sm" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-soot truncate">{item.user.name}</div>
                <div className="text-xs text-moss truncate" dir="ltr">{item.user.email}</div>
              </div>
              <span className="text-[11px] text-moss shrink-0">{dateFormat.format(new Date(item.createdAt))}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => answer(item, 'decline')}
                disabled={busyId === item.id}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-soot/15 bg-white text-soot text-xs font-semibold hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X size={13} />
                {t('companyJoin.decline')}
              </button>
              <button
                type="button"
                onClick={() => answer(item, 'approve')}
                disabled={busyId === item.id}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-soot text-plaster text-xs font-semibold hover:bg-soot/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Check size={13} />
                {t('companyJoin.approve')}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
