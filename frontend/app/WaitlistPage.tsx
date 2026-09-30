'use client';

import { useI18n } from '@/i18n';
import { useSpaceText } from '@/i18n/space-text';
import React, { useState, useMemo } from 'react';
import {
  Clock,
  Building2,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Bell,
  Star,
} from 'lucide-react';
import { useApp } from '@/app/store';
import { Space, WaitlistEntry } from '@/types/types';
import Modal from '@/components/ui/Modal';

const FALLBACK_SPACE_IMAGE =
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80';

export default function WaitlistPage() {
  const { t, translateMessage } = useI18n();
  const sx = useSpaceText();
  const {
    currentUser,
    spaces,
    waitlist,
    leaveWaitlist,
    navigate,
    autobooking,
    enableAutoBooking,
    disableAutoBooking,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedSpaceToLeave, setSelectedSpaceToLeave] = useState<{ id: string; name: string } | null>(null);

  // Compute active waitlist items for the current user
  const waitlistItems = useMemo(() => {
    if (!currentUser) return [];

    const activeSpaceIds: string[] = [];
    Object.entries(waitlist || {}).forEach(([key, isActive]) => {
      if (isActive && key.startsWith(`${currentUser.id}_`)) {
        const sId = key.replace(`${currentUser.id}_`, '');
        activeSpaceIds.push(sId);
      }
    });

    return activeSpaceIds.map((spaceId) => {
      const sp = spaces.find((s) => s.id === spaceId);
      const isAutoBooking = Boolean(autobooking?.[`${currentUser.id}_${spaceId}`]);

      // Calculate approximate queue position
      const totalInQueue = Object.keys(waitlist || {}).filter((k) => k.endsWith(`_${spaceId}`)).length;

      const item: WaitlistEntry & { space?: Space } = {
        id: `waitlist-${currentUser.id}-${spaceId}`,
        userId: currentUser.id,
        spaceId,
        spaceName: sp?.name || 'Coworking Hub',
        spaceCity: sp?.city || 'Saudi Arabia',
        spaceDistrict: sp?.district || '',
        spaceImage: sp?.images?.[0] || FALLBACK_SPACE_IMAGE,
        joinedAt: new Date().toISOString(),
        status: 'WAITLISTED',
        queuePosition: Math.max(1, totalInQueue),
        autoBookingEnabled: isAutoBooking,
        space: sp,
      };

      return item;
    });
  }, [currentUser, waitlist, spaces, autobooking]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return waitlistItems;
    return waitlistItems.filter(
      (item) =>
        item.spaceName?.toLowerCase().includes(q) ||
        item.spaceCity?.toLowerCase().includes(q) ||
        item.spaceDistrict?.toLowerCase().includes(q)
    );
  }, [waitlistItems, query]);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-soot/5 flex items-center justify-center mx-auto mb-4 text-soot">
          <Clock size={32} />
        </div>
        <h1 className="text-2xl font-serif-display text-soot mb-2">{t('waitlist.pleaseLogIn')}</h1>
        <p className="text-sm text-moss mb-6">{t('waitlist.logInToViewAnd')}</p>
        <button
          type="button"
          onClick={() => navigate('login')}
          className="btn-primary px-6 py-2.5 text-sm"
        >
          {t('waitlist.signInToAccount')}
        </button>
      </div>
    );
  }

  const handleConfirmLeave = () => {
    if (selectedSpaceToLeave) {
      leaveWaitlist(selectedSpaceToLeave.id);
      setSelectedSpaceToLeave(null);
    }
  };

  const isOrg = currentUser.role === 'organization';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-soot/8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-moss uppercase tracking-wider mb-1.5">
            <button
              type="button"
              onClick={() => navigate(isOrg ? 'org-dashboard' : 'ind-dashboard')}
              className="hover:text-soot transition-colors cursor-pointer"
            >
              {t('waitlist.dashboard')}
            </button>
            <span>/</span>
            <span className="text-soot">{t('waitlist.priorityWaitlist')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display tracking-tight flex items-center gap-3">
            <span>{t('waitlist.workspaceWaitlist')}</span>
            <Clock className="text-emerald-700 w-7 h-7 shrink-0 hidden sm:inline" />
          </h1>
          <p className="text-moss text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            {t('waitlist.trackYourQueuedPositionsAt')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('browse')}
            className="btn-primary px-4 py-2.5 text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Building2 size={16} />
            <span>{t('waitlist.browseWorkspaces')}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Waitlists',
            count: waitlistItems.length,
            desc: 'Currently queued spaces',
            icon: Clock,
            iconBg: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
          },
          {
            label: 'Queue Status',
            count: waitlistItems.length > 0 ? '#1 Priority' : 'Inactive',
            desc: 'Real-time FIFO queue order',
            icon: Users,
            iconBg: 'bg-blue-500/15 text-blue-800 border-blue-500/30',
          },
          {
            label: 'Alert Channels',
            count: 'SMS & Email',
            desc: 'Immediate vacancy alerts',
            icon: Bell,
            iconBg: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
          },
          {
            label: 'Reservation Window',
            count: '15 Minutes',
            desc: 'Guaranteed desk hold',
            icon: Zap,
            iconBg: 'bg-soot/10 text-soot border-soot/20',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-plaster-surface rounded-3xl border border-soot/12 p-5 shadow-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${stat.iconBg}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <div className="text-2xl font-serif-display font-medium text-soot tracking-tight">
                  {typeof stat.count === 'string' ? translateMessage(stat.count) : stat.count}
                </div>
                <div className="text-xs font-semibold text-soot mt-0.5">{translateMessage(stat.label)}</div>
                <div className="text-[11px] text-moss">{translateMessage(stat.desc)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      {waitlistItems.length > 0 && (
        <div className="relative">
          <Search size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-moss" />
          <input
            type="text"
            placeholder={t('waitlist.searchWaitlistedSpacesByName')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 rounded-2xl bg-plaster-surface border border-soot/15 text-sm text-soot placeholder:text-moss/60 focus:outline-none focus:ring-2 focus:ring-soot/20"
          />
        </div>
      )}

      {/* Main Content Area */}
      {waitlistItems.length === 0 ? (
        /* Empty State */
        <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-12 text-center shadow-xs max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#DDE6DF] text-soot flex items-center justify-center mx-auto shadow-2xs border border-soot/10">
            <Clock size={32} className="text-emerald-800" />
          </div>
          <div>
            <h2 className="text-2xl font-serif-display text-soot font-medium">{t('waitlist.noActiveWaitlists')}</h2>
            <p className="text-xs sm:text-sm text-moss mt-1.5 max-w-md mx-auto leading-relaxed">
              {t('waitlist.whenAWorkspaceReaches100')}
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('browse')}
              className="btn-primary px-6 py-2.5 text-sm inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Building2 size={16} />
              <span>{t('waitlist.exploreCoworkingSpaces')}</span>
            </button>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-10 text-center shadow-xs text-moss">
          <Search size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">{t('waitlist.noWaitlistEntriesMatchYour')}</p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="mt-2 text-xs text-soot font-semibold underline hover:text-emerald-800 cursor-pointer"
          >
            {t('waitlist.clearSearch')}
          </button>
        </div>
      ) : (
        /* Waitlist Cards */
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const space = item.space;
            return (
              <div
                key={item.spaceId}
                className="bg-plaster-surface rounded-3xl border border-soot/12 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
              >
                {/* Space Media & Info */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <img
                    src={item.spaceImage}
                    alt={item.space ? sx.name(item.space) : translateMessage(item.spaceName || "")}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-soot/10 shadow-2xs shrink-0 cursor-pointer"
                    onClick={() => navigate('space-details', { spaceId: item.spaceId })}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-900 border border-emerald-500/30">
                        <Sparkles size={11} className="text-emerald-700" />
                        <span>{translateMessage(`Queue Position #${item.queuePosition}`)}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-900 border border-amber-500/30">
                        <Clock size={11} />
                        <span>{t('waitlist.waitingForVacancy')}</span>
                      </span>
                    </div>

                    <h3
                      onClick={() => navigate('space-details', { spaceId: item.spaceId })}
                      className="text-lg sm:text-xl font-semibold text-soot hover:text-emerald-800 transition-colors cursor-pointer truncate"
                    >
                      {item.space ? sx.name(item.space) : translateMessage(item.spaceName || "")}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-moss mt-1 font-medium flex-wrap">
                      <span className="flex items-center gap-1 text-soot">
                        <MapPin size={13} className="text-moss" />
                        <span>{item.space ? sx.city(item.space) : translateMessage(item.spaceCity || "")}{item.spaceDistrict ? ` · ${item.spaceDistrict}` : ''}</span>
                      </span>
                      <span>·</span>
                      {space?.rating && (
                        <>
                          <span className="flex items-center gap-1 text-amber-600 font-semibold">
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                            <span>{space.rating}</span>
                          </span>
                          <span>·</span>
                        </>
                      )}
                      <span>{t('waitlist.daily')} {space?.pricing?.daily || 100} {t('common.sar')}</span>
                    </div>

                    <p className="text-xs text-moss mt-2 line-clamp-1">
                      {(space && sx.description(space)) || translateMessage('Full-featured coworking space with ultra high-speed Wi-Fi, meeting rooms, and focus pods.')}
                    </p>
                  </div>
                </div>

                {/* Queue Actions */}
                <div className="flex items-center gap-2.5 flex-wrap lg:flex-nowrap shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-soot/8 justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('space-details', { spaceId: item.spaceId })}
                    className="btn-secondary px-3.5 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{t('waitlist.viewSpace')}</span>
                    <ExternalLink size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (isOrg) {
                        navigate('team-booking', { spaceId: item.spaceId });
                      } else {
                        navigate('booking-flow', { spaceId: item.spaceId });
                      }
                    }}
                    className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Zap size={14} />
                    <span>{t('waitlist.checkAvailability')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSpaceToLeave({ id: item.spaceId, name: item.spaceName || 'Workspace' })}
                    className="p-2 rounded-xl text-moss hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                    title={t('waitlist.leaveWaitlist')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* How Priority Waitlist Works Info Box */}
      <div className="bg-[#FAF8F5] rounded-3xl border border-soot/12 p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-xs font-bold text-moss uppercase tracking-wider block mb-1">
            {t('waitlist.fairTransparentAccess')}
          </span>
          <h2 className="text-xl sm:text-2xl font-serif-display text-soot">{t('waitlist.howThePriorityWaitlistSystem')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-800 flex items-center justify-center border border-emerald-500/25">
              <Users size={20} />
            </div>
            <h4 className="font-semibold text-soot text-sm">{t('waitlist.1StrictFifoQueue')}</h4>
            <p className="text-xs text-moss leading-relaxed">
              {t('waitlist.spotsAreOfferedSequentiallyIn')}
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-800 flex items-center justify-center border border-blue-500/25">
              <Bell size={20} />
            </div>
            <h4 className="font-semibold text-soot text-sm">{t('waitlist.2InstantVacancyAlert')}</h4>
            <p className="text-xs text-moss leading-relaxed">
              {t('waitlist.whenADeskFreesUp')}
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center border border-amber-500/25">
              <ShieldCheck size={20} />
            </div>
            <h4 className="font-semibold text-soot text-sm">{t('waitlist.315MinuteReservedHold')}</h4>
            <p className="text-xs text-moss leading-relaxed">
              {t('waitlist.youAreGuaranteedA15')}
            </p>
          </div>
        </div>
      </div>

      {/* Leave Waitlist Confirmation Modal */}
      {selectedSpaceToLeave && (
        <Modal
          open={!!selectedSpaceToLeave}
          onClose={() => setSelectedSpaceToLeave(null)}
          title={t('waitlist.leavePriorityWaitlist')}
          size="sm"
          footer={
            <>
              <button
                type="button"
                onClick={() => setSelectedSpaceToLeave(null)}
                className="btn-secondary"
              >
                {t('waitlist.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                className="btn-danger"
              >
                {t('waitlist.leaveWaitlist')}
              </button>
            </>
          }
        >
          <div className="text-sm text-soot space-y-2 py-2">
            <p>
              {t('waitlist.leaveQ')} <span className="font-semibold">{sx.name(selectedSpaceToLeave)}</span>?
            </p>
            <p className="text-xs text-moss">
              {t('waitlist.youWillForfeitYourCurrent')}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
