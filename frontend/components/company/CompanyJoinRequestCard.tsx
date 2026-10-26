'use client';

import { useEffect, useState } from 'react';
import { Building2, Clock, Send, X } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useApp } from '@/app/store';
import { cancelJoinRequestApi, createJoinRequestApi, getMyJoinRequestApi, type MyJoinRequest } from '@/services/api';

/**
 * For member accounts outside a company team: shows a pending request to join a company (with a way to withdraw it),
 * and, when `showJoinForm` is set, lets the member ask to join their company by the HR admin's email.
 * It also picks up a membership the HR admin approved since the member signed in.
 */
export default function CompanyJoinRequestCard({ showJoinForm = false }: { showJoinForm?: boolean }) {
  const { t, translateMessage } = useI18n();
  const { currentUser, updateCurrentUser, showToast } = useApp();
  const [request, setRequest] = useState<MyJoinRequest | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [hrEmail, setHrEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const eligible = Boolean(currentUser && currentUser.role === 'individual' && !currentUser.companyId);
  const userId = currentUser?.id;

  useEffect(() => {
    if (!eligible || !userId) return;
    let cancelled = false;
    getMyJoinRequestApi().then((res) => {
      if (cancelled || !res.success) return;
      if (res.data.company) {
        // Approved while signed in: switch to the company view
        updateCurrentUser({ companyId: res.data.company.id, orgName: res.data.company.companyName }, { silent: true });
        return;
      }
      setRequest(res.data.request);
      setLoaded(true);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible, userId]);

  if (!eligible || !loaded) return null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = hrEmail.trim();
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t('companyJoin.errEmail'));
      return;
    }
    setBusy(true);
    setError('');
    const res = await createJoinRequestApi(email);
    if (!res.success) {
      setBusy(false);
      setError(translateMessage(res.error));
      return;
    }
    const refreshed = await getMyJoinRequestApi();
    setBusy(false);
    if (refreshed.success) setRequest(refreshed.data.request);
    setHrEmail('');
    showToast(t('companyJoin.sent', { company: res.data.companyName }), 'success');
  };

  const withdraw = async () => {
    if (!request) return;
    setBusy(true);
    const res = await cancelJoinRequestApi(request.id);
    setBusy(false);
    if (!res.success) {
      showToast(translateMessage(res.error), 'error');
      return;
    }
    setRequest(null);
    showToast(t('companyJoin.withdrawn'), 'info');
  };

  if (request) {
    const hr = request.company.hrAdmin;
    return (
      <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-6 shadow-2xs">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">{t('companyJoin.pendingTitle')}</div>
              <div className="text-lg font-semibold text-soot truncate">{request.company.companyName}</div>
              <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
                {hr?.name ? t('companyJoin.pendingBody', { name: hr.name }) : t('companyJoin.pendingBodyNoName')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={withdraw}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-soot/15 bg-white text-soot text-xs font-semibold hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={14} />
            {t('companyJoin.withdraw')}
          </button>
        </div>
      </div>
    );
  }

  if (!showJoinForm) return null;

  return (
    <div className="rounded-3xl border border-soot/10 bg-plaster-surface p-5 sm:p-6 shadow-2xs">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-soot/10 text-soot flex items-center justify-center shrink-0">
          <Building2 size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-soot">{t('companyJoin.formTitle')}</div>
          <p className="text-xs text-moss mt-1 leading-relaxed">{t('companyJoin.formBody')}</p>
          <form onSubmit={send} className="mt-3 flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={hrEmail}
              onChange={(e) => { setHrEmail(e.target.value); if (error) setError(''); }}
              placeholder="hr@company.com"
              aria-label={t('companyJoin.hrEmailLabel')}
              className={`flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-plaster border ${error ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-soot/15'} text-soot placeholder:text-moss/50 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs`}
            />
            <button type="submit" disabled={busy} className="btn-primary px-4 py-2.5 text-sm disabled:opacity-50 inline-flex items-center justify-center gap-1.5">
              <Send size={14} className="rtl:-scale-x-100" />
              {t('companyJoin.send')}
            </button>
          </form>
          {error && <p className="text-rose-600 text-xs mt-1.5 font-medium">* {error}</p>}
        </div>
      </div>
    </div>
  );
}
