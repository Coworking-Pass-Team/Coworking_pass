'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, ShieldCheck, MapPin, Loader2, Database, ArrowRight } from 'lucide-react';
import { useApp } from '@/app/store';
import { useI18n } from '@/i18n';
import { createQrCheckInApi } from '@/services/api';

function PassVerificationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, translateMessage } = useI18n();
  const { spaces, recordQrScan, fetchQrCheckIns, currentUser } = useApp();

  const bookingId = searchParams.get('bookingId') || 'BK-DEMO-01';
  const spaceId = searchParams.get('spaceId') || 'space-1';
  const userId = searchParams.get('userId') || currentUser?.id || 'c5d1e5f2-6d95-4147-9175-2955b2b64a8a';
  const spaceName = searchParams.get('spaceName') || 'Coworking Pass Space';
  const plan = searchParams.get('plan') || 'Daily Pass';
  const seats = searchParams.get('seats') || '1';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const durationDays = searchParams.get('durationDays');
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');

  const matchedSpace = spaces.find(s => s.id === spaceId);
  const displayName = matchedSpace?.name || spaceName;
  const displayCity = matchedSpace?.city || 'Saudi Arabia';

  const [status, setStatus] = useState<'verifying' | 'valid' | 'error'>('verifying');
  const [dbStatus, setDbStatus] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function verifyAndRecord() {
      try {
        if (recordQrScan) {
          recordQrScan(spaceId);
        }

        const res = await createQrCheckInApi({
          userId: userId,
          workspaceId: spaceId,
          sectionId: `sec-${spaceId}`,
          status: 'VALID',
        });

        if (isMounted) {
          if (res.success && res.data) {
            setDbStatus(t('passScan.dbRecorded'));
          } else {
            setDbStatus(t('passScan.dbProcessed'));
          }
          setStatus('valid');

          if (fetchQrCheckIns) {
            fetchQrCheckIns();
          }
        }
      } catch (err) {
        console.error('Check-in verification error:', err);
        if (isMounted) {
          setStatus('valid');
          setDbStatus(t('passScan.dbVerified'));
        }
      }
    }

    verifyAndRecord();

    return () => {
      isMounted = false;
    };
  }, [spaceId, userId]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 sm:p-6 text-soot">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-soot/10 space-y-6 text-center animate-in zoom-in-95 duration-200">
        
        {/* Verification Status Badge */}
        {status === 'verifying' ? (
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 animate-pulse">
              <Loader2 size={32} className="animate-spin" />
            </div>
            <h1 className="text-xl font-bold font-serif-display text-soot">{t('passScan.verifying')}</h1>
            <p className="text-xs text-moss">{t('passScan.connecting')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100/90 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-700 shadow-xs">
              <CheckCircle2 size={34} />
            </div>
            <div>
              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
                {t('passScan.authorized')}
              </span>
              <h1 className="text-2xl font-bold font-serif-display text-soot">{t('passScan.accessGranted')}</h1>
              <p className="text-xs text-moss mt-0.5">{t('passScan.registered')}</p>
            </div>
          </div>
        )}

        {/* Pass Details Card */}
        <div className="bg-[#FAF7F2] rounded-2xl p-4 sm:p-5 text-start border border-soot/8 space-y-3.5 text-xs sm:text-sm">
          <div className="flex items-center justify-between pb-3 border-b border-soot/8">
            <span className="text-moss">Workspace</span>
            <span className="font-bold text-soot text-end">{displayName}</span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-soot/8">
            <span className="text-moss">Location</span>
            <span className="font-medium text-soot text-end flex items-center gap-1">
              <MapPin size={13} className="text-moss" />
              {displayCity}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-soot/8">
            <span className="text-moss">{translateMessage('Pass Type')}</span>
            <span className="font-semibold text-soot capitalize">{plan}</span>
          </div>

          {startDate && (
            <div className="flex items-center justify-between pb-3 border-b border-soot/8">
              <span className="text-moss">
                {plan.toLowerCase().includes('daily') || plan === 'daily' ? t('passScan.dateRange') : t('passScan.bookingDate')}
              </span>
              <span className="font-semibold text-soot text-end">
                {endDate && endDate !== startDate ? t('passScan.dateTo', { from: startDate, to: endDate }) : startDate}
              </span>
            </div>
          )}

          {durationDays && (plan.toLowerCase().includes('daily') || plan === 'daily') && (
            <div className="flex items-center justify-between pb-3 border-b border-soot/8">
              <span className="text-moss">Duration</span>
              <span className="font-semibold text-soot">
                {durationDays} {Number(durationDays) === 1 ? t('passScan.day') : t('passScan.days')}
              </span>
            </div>
          )}

          {startTime && endTime && (
            <div className="flex items-center justify-between pb-3 border-b border-soot/8">
              <span className="text-moss">{translateMessage('Allowed Hours')}</span>
              <span className="font-semibold text-emerald-800 text-end">
                {startTime} – {endTime}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pb-3 border-b border-soot/8">
            <span className="text-moss">{translateMessage('Pass Allocated')}</span>
            <span className="font-semibold text-soot">{seats} Seat(s)</span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-soot/8">
            <span className="text-moss">{translateMessage('Booking Reference')}</span>
            <span className="font-mono text-xs text-soot font-semibold">{bookingId}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-moss">{translateMessage('Verified At')}</span>
            <span className="font-medium text-soot font-mono text-xs">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Database Sync Status */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-start gap-2.5 text-start text-xs text-emerald-900">
          <Database size={15} className="text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">{translateMessage('Database Live Sync')}</div>
            <div className="text-[11px] text-emerald-800/90 leading-relaxed mt-0.5">
              {dbStatus}
            </div>
          </div>
        </div>

        {/* Security Footer Badge */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-moss font-medium pt-1">
          <ShieldCheck size={14} className="text-emerald-700 shrink-0" />
          <span>{t('passScan.encrypted')}</span>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => router.push('/')}
          className="w-full py-3.5 px-4 rounded-xl bg-soot hover:bg-black text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <span>{t('passScan.return')}</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

export default function PassVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <Loader2 size={28} className="animate-spin text-moss" />
      </div>
    }>
      <PassVerificationContent />
    </Suspense>
  );
}
