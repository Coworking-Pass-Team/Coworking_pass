'use client';
import { useState } from 'react';
import { ArrowLeft, Check, Users, Calendar, ChevronRight, MapPin, CreditCard } from 'lucide-react';
import { useApp } from '@/app/store';
import { BookingPlan, BookingType } from '@/types/types';

const STEPS = ['Type', 'Team', 'Schedule', 'Review'];

export default function TeamBooking() {
  const { nav, goBack, spaces, currentUser, addBooking, navigate } = useApp();
  const spaceId = nav.params?.spaceId;
  const space = spaces.find(s => s.id === spaceId);

  const [step, setStep] = useState(0);
  const [bookingType, setBookingType] = useState<BookingType>('hot-desk');
  const [plan, setPlan] = useState<BookingPlan>((nav.params?.plan as BookingPlan) || 'monthly');
  const [seats, setSeats] = useState(1);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const employees = currentUser?.employees || [];

  if (!space || !currentUser) return null;

  const getEndDate = (start: string, p: BookingPlan) => {
    if (!start) return '';
    const d = new Date(start);
    if (p === 'monthly') d.setMonth(d.getMonth() + 1);
    else if (p === 'yearly') d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  const endDate = getEndDate(startDate, plan);
  const pricePerSeat = space.pricing[plan];
  const totalPrice = pricePerSeat * seats;
  const planLabel = plan === 'daily' ? '/day' : plan === 'monthly' ? '/month' : '/year';

  const toggleEmployee = (id: string) => {
    setSelectedEmployees(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
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
        type: bookingType,
        plan,
        startDate,
        endDate,
        seats,
        employees: selectedEmployees,
        totalPrice,
        status: 'active',
      });
      setConfirmedBooking(booking);
      setStep(4);
      setLoading(false);
    }, 1000);
  };

  // Success
  if (step === 4 && confirmedBooking) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-eucalyptus/20 flex items-center justify-center mx-auto mb-5">
            <Check size={28} className="text-moss" />
          </div>
          <h1 className="text-2xl text-soot mb-2" style={{ fontFamily: 'DM Serif Display, serif' }}>Team booking confirmed!</h1>
          <p className="text-moss text-sm mb-8">Your workspace for {seats} team member{seats > 1 ? 's' : ''} is reserved.</p>

          <div className="bg-white rounded-2xl border border-soot/8 p-5 text-left mb-6">
            <div className="flex items-start gap-3 mb-4 pb-4 border-b border-soot/8">
              <img src={space.images[0]} alt={space.name} className="w-12 h-12 rounded-xl object-cover" />
              <div>
                <div className="font-semibold text-soot">{space.name}</div>
                <div className="flex items-center gap-1 text-xs text-moss">
                  <MapPin size={10} />
                  {space.city}
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { l: 'Type', v: bookingType.replace('-', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) },
                { l: 'Plan', v: plan.charAt(0).toUpperCase() + plan.slice(1) },
                { l: 'Team size', v: `${seats} seats` },
                { l: 'Start', v: startDate },
                ...(plan !== 'daily' ? [{ l: 'End', v: endDate }] : []),
              ].map(r => (
                <div key={r.l} className="flex justify-between">
                  <span className="text-moss">{r.l}</span>
                  <span className="text-soot font-medium">{r.v}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-soot/8 flex justify-between font-semibold">
                <span className="text-soot">Total</span>
                <span className="text-soot">SAR {totalPrice.toLocaleString()}{planLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate('team-bookings')} className="flex-1 py-2.5 rounded-xl bg-soot text-plaster font-medium text-sm">
              View team bookings
            </button>
            <button onClick={() => navigate('browse')} className="flex-1 py-2.5 rounded-xl border border-soot/15 text-soot font-medium text-sm">
              Browse more
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={step === 0 ? goBack : () => setStep(s => s - 1)} className="flex items-center gap-2 text-moss hover:text-soot text-sm font-medium mb-6">
        <ArrowLeft size={15} /> Back
      </button>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${i < step ? 'text-moss' : i === step ? 'text-soot' : 'text-moss/40'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${i < step ? 'bg-eucalyptus text-soot' : i === step ? 'bg-soot text-plaster' : 'bg-soot/10 text-moss/50'}`}>
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              <span className="text-sm hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && <ChevronRight size={14} className={`mx-1 ${i < step ? 'text-eucalyptus' : 'text-soot/20'}`} />}
          </div>
        ))}
      </div>

      {/* Space card */}
      <div className="flex items-center gap-3 bg-white rounded-2xl border border-soot/8 p-4 mb-6">
        <img src={space.images[0]} alt={space.name} className="w-12 h-12 rounded-xl object-cover" />
        <div className="flex-1">
          <div className="font-semibold text-soot">{space.name}</div>
          <div className="flex items-center gap-1 text-xs text-moss">
            <MapPin size={10} />
            {space.city}
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-soot text-sm">SAR {pricePerSeat.toLocaleString()}</div>
          <div className="text-xs text-moss">per seat{planLabel}</div>
        </div>
      </div>

      {/* Step 0: Booking type */}
      {step === 0 && (
        <div>
          <h2 className="text-xl font-semibold text-soot mb-5">Booking type & plan</h2>
          <div className="space-y-3 mb-6">
            {([
              { type: 'hot-desk' as BookingType, label: 'Hot Desks', desc: 'Flexible open seating for your team' },
              { type: 'meeting-room' as BookingType, label: 'Meeting Room', desc: 'Private room for team meetings' },
              { type: 'private-office' as BookingType, label: 'Private Office', desc: 'Dedicated office space for your team' },
            ]).map(t => (
              <button
                key={t.type}
                onClick={() => setBookingType(t.type)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${bookingType === t.type ? 'border-eucalyptus bg-eucalyptus/8' : 'border-soot/10 bg-white hover:border-eucalyptus/40'}`}
              >
                <div>
                  <div className="font-medium text-soot">{t.label}</div>
                  <div className="text-xs text-moss mt-0.5">{t.desc}</div>
                </div>
                {bookingType === t.type && <Check size={16} className="text-moss shrink-0" />}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-soot mb-3">Select plan</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['daily', 'monthly', 'yearly'] as BookingPlan[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={`py-3 px-2 rounded-xl border text-center transition-all ${plan === p ? 'bg-soot text-plaster border-soot' : 'border-soot/10 text-moss hover:border-soot/30'}`}
                >
                  <div className="text-xs font-medium capitalize">{p}</div>
                  <div className={`text-[10px] mt-0.5 ${plan === p ? 'text-plaster/70' : 'text-moss/60'}`}>
                    SAR {space.pricing[p].toLocaleString()}/seat
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-moss mb-2 flex items-center gap-1.5">
              <Users size={13} />
              Number of seats
            </label>
            <div className="flex items-center gap-3">
              <button onClick={() => setSeats(s => Math.max(1, s - 1))} className="w-9 h-9 rounded-xl border border-soot/12 text-soot hover:bg-soot/5">−</button>
              <span className="text-soot font-semibold w-8 text-center">{seats}</span>
              <button onClick={() => setSeats(s => Math.min(space.availableCapacity, s + 1))} className="w-9 h-9 rounded-xl border border-soot/12 text-soot hover:bg-soot/5">+</button>
              <span className="text-xs text-moss">max {space.availableCapacity}</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Team */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold text-soot mb-2">Select team members</h2>
          <p className="text-sm text-moss mb-5">Choose up to {seats} employee{seats > 1 ? 's' : ''} ({selectedEmployees.length}/{seats} selected)</p>

          {employees.length === 0 ? (
            <div className="bg-white rounded-2xl border border-soot/8 p-8 text-center">
              <Users size={28} className="text-moss mx-auto mb-3" />
              <div className="text-sm text-moss">No employees added to your organization yet.</div>
              <button onClick={() => navigate('org-profile')} className="mt-3 text-xs font-medium text-soot hover:underline">Add employees →</button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-soot/8 divide-y divide-soot/5">
              {employees.map(emp => {
                const sel = selectedEmployees.includes(emp.id);
                const disabled = !sel && selectedEmployees.length >= seats;
                return (
                  <button
                    key={emp.id}
                    onClick={() => { if (!disabled || sel) toggleEmployee(emp.id); }}
                    disabled={disabled && !sel}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${sel ? 'bg-eucalyptus/8' : disabled ? 'opacity-40' : 'hover:bg-soot/3'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${sel ? 'bg-eucalyptus text-soot' : 'bg-eucalyptus/20 text-moss'}`}>
                      {sel ? <Check size={14} /> : emp.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-soot">{emp.name}</div>
                      <div className="text-xs text-moss">{emp.department} · {emp.email}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <p className="text-xs text-moss mt-3">You can also proceed without selecting specific employees.</p>
        </div>
      )}

      {/* Step 2: Schedule */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-semibold text-soot mb-5">Select dates</h2>
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
                <label className="block text-xs font-medium text-moss mb-1.5">End date</label>
                <div className="w-full px-4 py-2.5 rounded-xl border border-soot/8 bg-soot/3 text-soot text-sm">{endDate}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-semibold text-soot mb-5">Review team booking</h2>
          <div className="bg-white rounded-2xl border border-soot/8 p-5 space-y-3 text-sm mb-4">
            {[
              { l: 'Type', v: bookingType.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) },
              { l: 'Plan', v: plan.charAt(0).toUpperCase() + plan.slice(1) },
              { l: 'Seats', v: seats.toString() },
              { l: 'Start', v: startDate },
              ...(plan !== 'daily' ? [{ l: 'End', v: endDate }] : []),
              { l: 'Team members', v: selectedEmployees.length > 0 ? `${selectedEmployees.length} assigned` : 'Not specified' },
            ].map(r => (
              <div key={r.l} className="flex justify-between">
                <span className="text-moss">{r.l}</span>
                <span className="text-soot font-medium">{r.v}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-soot/8">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-soot">Total</span>
                <div className="text-right">
                  <div className="font-semibold text-soot text-lg">SAR {totalPrice.toLocaleString()}</div>
                  <div className="text-xs text-moss">{planLabel} ({seats} seats × SAR {pricePerSeat.toLocaleString()})</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-eucalyptus/10 rounded-xl p-4 flex items-center gap-2 text-sm text-moss">
            <CreditCard size={14} />
            Payment will be processed upon confirmation
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        <button onClick={step === 0 ? goBack : () => setStep(s => s - 1)} className="flex-1 py-3 rounded-xl border border-soot/15 text-soot font-medium text-sm">
          Back
        </button>
        {step < 3 ? (
          <button
            onClick={() => { if (step === 2 && !startDate) return; setStep(s => s + 1); }}
            disabled={step === 2 && !startDate}
            className="flex-1 py-3 rounded-xl bg-soot text-plaster font-semibold text-sm hover:bg-soot-light disabled:opacity-50"
          >
            Continue
          </button>
        ) : (
          <button onClick={confirmBooking} disabled={loading} className="flex-1 py-3 rounded-xl bg-eucalyptus text-soot font-semibold text-sm hover:bg-eucalyptus-dark disabled:opacity-60">
            {loading ? 'Confirming...' : 'Confirm team booking'}
          </button>
        )}
      </div>
    </div>
  );
}
