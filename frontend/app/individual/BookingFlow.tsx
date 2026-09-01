'use client';
import { useState } from 'react';
import { ArrowLeft, Check, Calendar, Users, CreditCard, MapPin, ChevronRight } from 'lucide-react';
import { useApp } from '@/app/store';
import { BookingPlan, BookingType } from '@/types/types';

const STEPS = ['Plan', 'Details', 'Review', 'Confirm'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`flex items-center gap-2 ${i < current ? 'text-moss' : i === current ? 'text-soot' : 'text-moss/40'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              i < current ? 'bg-eucalyptus text-soot' : i === current ? 'bg-soot text-plaster' : 'bg-soot/10 text-moss/50'
            }`}>
              {i < current ? <Check size={13} /> : i + 1}
            </div>
            <span className="text-sm hidden sm:block">{s}</span>
          </div>
          {i < STEPS.length - 1 && (
            <ChevronRight size={14} className={`mx-1 ${i < current ? 'text-eucalyptus' : 'text-soot/20'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function BookingFlow() {
  const { nav, navigate, goBack, spaces, currentUser, addBooking, showToast } = useApp();
  const spaceId = nav.params?.spaceId;
  const space = spaces.find(s => s.id === spaceId);

  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<BookingPlan>((nav.params?.plan as BookingPlan) || 'monthly');
  const [deskType, setDeskType] = useState<BookingType>('hot-desk');
  const [startDate, setStartDate] = useState('');
  const [seats, setSeats] = useState(1);
  const [notes, setNotes] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  if (!space || !currentUser) return null;

  const getEndDate = (start: string, p: BookingPlan) => {
    if (!start) return '';
    const d = new Date(start);
    if (p === 'monthly') d.setMonth(d.getMonth() + 1);
    else if (p === 'yearly') d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  const endDate = getEndDate(startDate, plan);
  const planPrice = space.pricing[plan];
  const totalPrice = planPrice * seats;
  const priceLabel = plan === 'daily' ? '/day' : plan === 'monthly' ? '/month' : '/year';

  const validateStep = () => {
    if (step === 1 && !startDate) { showToast('Please select a start date.', 'error'); return false; }
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep(s => Math.min(s + 1, 3));
  };

  const back = () => {
    if (step === 0) { goBack(); return; }
    setStep(s => s - 1);
  };

  const confirmBooking = () => {
    setLoading(true);
    setTimeout(() => {
      const booking = addBooking({
        userId: currentUser.id,
        spaceId: space.id,
        spaceName: space.name,
        spaceCity: space.city,
        spaceAddress: space.address,
        spaceImage: space.images[0],
        type: deskType,
        plan,
        startDate,
        endDate,
        seats,
        employees: [],
        totalPrice,
        status: 'active',
        notes,
      });
      setConfirmedBooking(booking);
      setStep(3);
      setLoading(false);
    }, 1000);
  };

  // Confirmation screen
  if (step === 3 && confirmedBooking) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-eucalyptus/20 flex items-center justify-center mx-auto mb-5">
            <Check size={28} className="text-moss" />
          </div>
          <h1 className="text-2xl text-soot mb-2" style={{ fontFamily: 'DM Serif Display, serif' }}>Booking confirmed!</h1>
          <p className="text-moss text-sm mb-8">Your workspace is reserved and ready for you.</p>

          <div className="bg-white rounded-2xl border border-soot/8 p-5 text-left mb-6">
            <div className="flex items-start gap-3 mb-4 pb-4 border-b border-soot/8">
              <img src={space.images[0]} alt={space.name} className="w-12 h-12 rounded-xl object-cover" />
              <div>
                <div className="font-semibold text-soot">{space.name}</div>
                <div className="flex items-center gap-1 text-xs text-moss mt-0.5">
                  <MapPin size={10} />
                  {space.city}
                </div>
              </div>
            </div>
            <div className="space-y-2.5 text-sm">
              <Row label="Booking ID" value={confirmedBooking.id.slice(-8).toUpperCase()} />
              <Row label="Type" value={deskType.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} />
              <Row label="Plan" value={plan.charAt(0).toUpperCase() + plan.slice(1)} />
              <Row label="Start date" value={startDate} />
              {plan !== 'daily' && <Row label="End date" value={endDate} />}
              <Row label="Seats" value={seats.toString()} />
              <div className="pt-2 border-t border-soot/8 flex justify-between font-semibold">
                <span className="text-soot">Total</span>
                <span className="text-soot">SAR {totalPrice.toLocaleString()}{priceLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('my-bookings')}
              className="flex-1 py-2.5 rounded-xl bg-soot text-plaster font-medium text-sm"
            >
              View my bookings
            </button>
            <button
              onClick={() => navigate('browse')}
              className="flex-1 py-2.5 rounded-xl border border-soot/15 text-soot font-medium text-sm"
            >
              Browse more
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={back} className="flex items-center gap-2 text-moss hover:text-soot text-sm font-medium mb-6 transition-colors">
        <ArrowLeft size={15} /> Back
      </button>

      <StepIndicator current={step} />

      {/* Space summary */}
      <div className="flex items-center gap-3 bg-white rounded-2xl border border-soot/8 p-4 mb-6">
        <img src={space.images[0]} alt={space.name} className="w-12 h-12 rounded-xl object-cover" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-soot truncate">{space.name}</div>
          <div className="flex items-center gap-1 text-xs text-moss">
            <MapPin size={10} />
            {space.city}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-semibold text-soot text-sm">SAR {planPrice.toLocaleString()}</div>
          <div className="text-xs text-moss">{priceLabel}</div>
        </div>
      </div>

      {/* Step 0: Plan */}
      {step === 0 && (
        <div>
          <h2 className="text-xl font-semibold text-soot mb-5">Choose your plan</h2>

          <div className="space-y-3 mb-6">
            {(['daily', 'monthly', 'yearly'] as BookingPlan[]).map(p => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${plan === p ? 'border-eucalyptus bg-eucalyptus/8' : 'border-soot/10 bg-white hover:border-eucalyptus/40'}`}
              >
                <div className="text-left">
                  <div className="font-medium text-soot capitalize">{p}</div>
                  <div className="text-xs text-moss mt-0.5">
                    {p === 'daily' ? 'Perfect for occasional use' : p === 'monthly' ? 'Ideal for regular professionals' : 'Best value for dedicated users'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-soot">SAR {space.pricing[p].toLocaleString()}</div>
                  <div className="text-xs text-moss">/{p === 'daily' ? 'day' : p === 'monthly' ? 'month' : 'year'}</div>
                  {p === 'yearly' && (
                    <div className="text-[10px] text-moss bg-eucalyptus/20 px-2 py-0.5 rounded-full mt-1">
                      Save {Math.round((1 - space.pricing.yearly / (space.pricing.monthly * 12)) * 100)}%
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-soot mb-3">Workspace type</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['hot-desk', 'private-office', 'meeting-room'] as BookingType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setDeskType(t)}
                  className={`py-2 px-2 rounded-xl border text-xs font-medium text-center transition-all ${deskType === t ? 'bg-soot text-plaster border-soot' : 'border-soot/10 text-moss hover:border-soot/30'}`}
                >
                  {t.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold text-soot mb-5">Booking details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-moss mb-1.5 flex items-center gap-1.5">
                <Calendar size={13} />
                Start date
              </label>
              <input
                type="date"
                value={startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus"
              />
            </div>

            {startDate && plan !== 'daily' && (
              <div>
                <label className="block text-xs font-medium text-moss mb-1.5">End date (auto-calculated)</label>
                <div className="w-full px-4 py-2.5 rounded-xl border border-soot/8 bg-soot/3 text-soot text-sm">{endDate}</div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-moss mb-1.5 flex items-center gap-1.5">
                <Users size={13} />
                Number of seats
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSeats(s => Math.max(1, s - 1))}
                  className="w-9 h-9 rounded-xl border border-soot/12 flex items-center justify-center text-soot hover:bg-soot/5"
                >
                  −
                </button>
                <span className="text-soot font-semibold w-8 text-center">{seats}</span>
                <button
                  onClick={() => setSeats(s => Math.min(space.availableCapacity, s + 1))}
                  className="w-9 h-9 rounded-xl border border-soot/12 flex items-center justify-center text-soot hover:bg-soot/5"
                >
                  +
                </button>
                <span className="text-xs text-moss">(max {space.availableCapacity})</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-moss mb-1.5">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Any special requirements..."
                className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-semibold text-soot mb-5">Review booking</h2>

          <div className="bg-white rounded-2xl border border-soot/8 p-5 space-y-3 text-sm">
            <Row label="Space" value={space.name} />
            <Row label="Location" value={space.city} />
            <Row label="Type" value={deskType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} />
            <Row label="Plan" value={plan.charAt(0).toUpperCase() + plan.slice(1)} />
            <Row label="Start" value={startDate} />
            {plan !== 'daily' && <Row label="End" value={endDate} />}
            <Row label="Seats" value={seats.toString()} />
            {notes && <Row label="Notes" value={notes} />}
            <div className="pt-3 border-t border-soot/8">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-soot">Total</span>
                <div className="text-right">
                  <div className="font-semibold text-soot text-lg">SAR {totalPrice.toLocaleString()}</div>
                  <div className="text-xs text-moss">{priceLabel}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-eucalyptus/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-moss">
              <CreditCard size={14} />
              <span>Payment will be processed upon confirmation</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={back}
          className="flex-1 py-3 rounded-xl border border-soot/15 text-soot font-medium text-sm hover:bg-soot/5"
        >
          Back
        </button>
        {step < 2 ? (
          <button
            onClick={next}
            className="flex-1 py-3 rounded-xl bg-soot text-plaster font-semibold text-sm hover:bg-soot-light transition-colors"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={confirmBooking}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-eucalyptus text-soot font-semibold text-sm hover:bg-eucalyptus-dark disabled:opacity-60 transition-colors"
          >
            {loading ? 'Confirming...' : 'Confirm booking'}
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-moss">{label}</span>
      <span className="text-soot font-medium text-right">{value}</span>
    </div>
  );
}
