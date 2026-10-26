'use client';

import { useEffect, useRef, useState } from 'react';
import { LifeBuoy, MessageSquarePlus, RefreshCw, Send, CheckCircle2, Clock, Loader2, Lock } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useApp } from '@/app/store';
import type { SupportTicket, TicketStatus } from '@/types';

const STATUS_STYLE: Record<TicketStatus, string> = {
  open: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
  'in-progress': 'bg-blue-500/15 text-blue-800 border-blue-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
  closed: 'bg-soot/10 text-soot border-soot/20',
};

function StatusBadge({ status }: { status: TicketStatus }) {
  const { t } = useI18n();
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_STYLE[status]}`}>
      {t(`tickets.status.${status}` as 'tickets.status.open')}
    </span>
  );
}

/** The signed-in user's own support tickets: status, the full conversation with support, and a way to answer. */
export default function MyTickets() {
  const { t, translateMessage } = useI18n();
  const { currentUser, supportTickets, fetchTickets, sendTicketMessage, closeMyTicket, navigate, showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    await fetchTickets().catch(() => undefined);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Load once when the page opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only the signed-in account's own tickets (an admin's full list lives in the admin dashboard)
  const mine: SupportTicket[] = supportTickets.filter((tk) => !tk.userId || tk.userId === currentUser?.id);
  const selected = mine.find((tk) => tk.id === selectedId) ?? mine[0] ?? null;

  useEffect(() => {
    if (!selectedId && mine[0]) setSelectedId(mine[0].id);
  }, [mine, selectedId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selected?.id, selected?.replies?.length]);

  const send = async () => {
    if (!selected || !draft.trim()) return;
    setSending(true);
    const res = await sendTicketMessage(selected.id, draft);
    setSending(false);
    if (!res.success) {
      showToast(translateMessage(res.error ?? ''), 'error');
      return;
    }
    setDraft('');
    showToast(t('tickets.sent'), 'success');
  };

  const close = async () => {
    if (!selected) return;
    const res = await closeMyTicket(selected.id);
    if (!res.success) {
      showToast(translateMessage(res.error ?? ''), 'error');
      return;
    }
    showToast(t('tickets.closedToast'), 'success');
  };

  const isClosed = selected?.status === 'closed' || selected?.status === 'resolved';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-moss block mb-1">{t('tickets.eyebrow')}</span>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">{t('tickets.title')}</h1>
          <p className="text-moss text-sm mt-1">{t('tickets.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            aria-label={t('tickets.refresh')}
            title={t('tickets.refresh')}
            className="p-2.5 rounded-xl border border-soot/12 text-moss hover:text-soot cursor-pointer"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button type="button" onClick={() => navigate('contact')} className="btn-primary px-4 py-2.5 text-xs inline-flex items-center gap-2">
            <MessageSquarePlus size={15} />
            {t('tickets.new')}
          </button>
        </div>
      </div>

      {loading && mine.length === 0 ? (
        <div className="bg-white rounded-3xl border border-soot/8 py-14 flex items-center justify-center gap-2 text-moss text-sm">
          <Loader2 size={16} className="animate-spin" />
          {t('tickets.loading')}
        </div>
      ) : mine.length === 0 ? (
        <div className="bg-white rounded-3xl border border-soot/8 py-14 px-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-soot/8 text-moss flex items-center justify-center mx-auto">
            <LifeBuoy size={22} />
          </div>
          <h2 className="text-lg font-semibold text-soot">{t('tickets.emptyTitle')}</h2>
          <p className="text-sm text-moss max-w-md mx-auto">{t('tickets.emptyBody')}</p>
          <button type="button" onClick={() => navigate('contact')} className="btn-primary px-5 py-2.5 text-xs">
            {t('tickets.new')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
          {/* Ticket list */}
          <div className="space-y-2" role="list" aria-label={t('tickets.title')}>
            {mine.map((tk) => (
              <button
                key={tk.id}
                type="button"
                role="listitem"
                onClick={() => setSelectedId(tk.id)}
                className={`w-full text-start rounded-2xl border p-4 transition-colors cursor-pointer ${
                  selected?.id === tk.id ? 'bg-white border-soot/30 shadow-xs' : 'bg-plaster-surface border-soot/10 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-mono text-moss" dir="ltr">{tk.ticketNumber}</span>
                  <StatusBadge status={tk.status} />
                </div>
                <div className="text-sm font-semibold text-soot line-clamp-2">{translateMessage(tk.subject)}</div>
                <div className="text-[11px] text-moss mt-1.5 flex items-center gap-1.5">
                  <Clock size={11} />
                  <span>{tk.createdAt}</span>
                  {(tk.replies?.length ?? 0) > 0 && <span>· {t('tickets.messages', { count: tk.replies?.length ?? 0 })}</span>}
                </div>
              </button>
            ))}
          </div>

          {/* Conversation */}
          {selected && (
            <div className="bg-white rounded-3xl border border-soot/10 shadow-xs flex flex-col min-h-[420px]">
              <div className="p-5 border-b border-soot/8 flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono text-moss" dir="ltr">{selected.ticketNumber}</span>
                    <StatusBadge status={selected.status} />
                  </div>
                  <h2 className="text-lg font-semibold text-soot">{translateMessage(selected.subject)}</h2>
                  <div className="text-[11px] text-moss mt-1">{t('tickets.opened', { date: selected.createdAt })}</div>
                </div>
                {!isClosed && (
                  <button type="button" onClick={close} className="px-3.5 py-2 rounded-xl border border-soot/15 text-xs font-semibold text-soot hover:bg-soot/5 inline-flex items-center gap-1.5 cursor-pointer">
                    <CheckCircle2 size={14} />
                    {t('tickets.closeIt')}
                  </button>
                )}
              </div>

              <div className="p-5 space-y-4 flex-1 overflow-y-auto max-h-[460px]">
                {/* The original request */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-ee-md bg-soot text-plaster px-4 py-3 text-sm whitespace-pre-wrap break-words">
                    {selected.message}
                  </div>
                </div>
                {(selected.replies ?? []).map((r) => {
                  const fromMe = r.userId === currentUser?.id;
                  return (
                    <div key={r.id} className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap break-words ${fromMe ? 'rounded-ee-md bg-soot text-plaster' : 'rounded-es-md bg-[#E5ECE9] text-soot'}`}>
                        <div className={`text-[11px] font-semibold mb-1 ${fromMe ? 'text-plaster/70' : 'text-moss'}`}>
                          {fromMe ? t('tickets.you') : t('tickets.support')}
                          {r.createdAt && <span className="font-normal"> · {r.createdAt}</span>}
                        </div>
                        {r.message}
                      </div>
                    </div>
                  );
                })}
                {(selected.replies?.length ?? 0) === 0 && (
                  <p className="text-xs text-moss text-center py-2">{t('tickets.waiting')}</p>
                )}
                <div ref={threadEndRef} />
              </div>

              {isClosed ? (
                <div className="p-4 border-t border-soot/8 bg-soot/5 rounded-b-3xl flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xs text-moss inline-flex items-center gap-2"><Lock size={13} />{t('tickets.closedNote')}</span>
                  <button type="button" onClick={() => navigate('contact')} className="btn-primary px-4 py-2 text-xs">{t('tickets.new')}</button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); send(); }}
                  className="p-4 border-t border-soot/8 flex items-end gap-3"
                >
                  <label htmlFor="ticket-reply" className="sr-only">{t('tickets.replyLabel')}</label>
                  <textarea
                    id="ticket-reply"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={2}
                    maxLength={2000}
                    placeholder={t('tickets.replyPlaceholder')}
                    className="flex-1 resize-none px-3.5 py-2.5 rounded-xl border border-soot/15 bg-plaster-dark/20 text-sm text-soot outline-none focus:border-eucalyptus"
                  />
                  <button type="submit" disabled={sending || !draft.trim()} className="btn-primary px-4 py-3 text-xs inline-flex items-center gap-2 disabled:opacity-50">
                    {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} className="rtl:-scale-x-100" />}
                    {t('tickets.send')}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
