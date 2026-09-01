'use client';
import { CalendarDays, Users, MapPin, ArrowRight, Search, TrendingUp, Briefcase } from 'lucide-react';
import { useApp } from '@/app/store';

export default function OrgDashboard() {
  const { currentUser, bookings, spaces, navigate } = useApp();
  if (!currentUser) return null;

  const orgBookings = bookings.filter(b => b.userId === currentUser.id);
  const activeBookings = orgBookings.filter(b => b.status === 'active');
  const totalSeats = activeBookings.reduce((sum, b) => sum + b.seats, 0);
  const totalSpend = orgBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + b.totalPrice, 0);
  const employees = currentUser.employees || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-moss text-sm mb-1">Organization dashboard</p>
          <h1 className="text-3xl text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>{currentUser.orgName || currentUser.name}</h1>
          <p className="text-moss text-sm mt-1">{currentUser.industry || 'Organization'} · {currentUser.orgSize || 0} employees</p>
        </div>
        <button
          onClick={() => navigate('browse')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-eucalyptus text-soot font-medium text-sm hover:bg-eucalyptus-dark transition-colors"
        >
          <Search size={15} />
          Book workspace
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active bookings', value: activeBookings.length, icon: CalendarDays, color: 'text-eucalyptus' },
          { label: 'Seats booked', value: totalSeats, icon: Users, color: 'text-moss' },
          { label: 'Team members', value: employees.length, icon: Briefcase, color: 'text-soot' },
          { label: 'Total spend', value: `SAR ${totalSpend.toLocaleString()}`, icon: TrendingUp, color: 'text-mist' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-soot/8">
            <div className={`${s.color} mb-3`}><s.icon size={18} /></div>
            <div className="text-xl font-semibold text-soot">{s.value}</div>
            <div className="text-xs text-moss mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Active bookings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-soot">Active bookings</h2>
            <button onClick={() => navigate('team-bookings')} className="text-xs text-moss hover:text-soot flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>

          {activeBookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-soot/8 p-8 text-center">
              <CalendarDays size={28} className="text-moss mx-auto mb-3" />
              <div className="text-sm text-moss mb-3">No active team bookings</div>
              <button onClick={() => navigate('browse')} className="px-4 py-2 rounded-xl bg-eucalyptus text-soot text-sm font-medium">
                Book a space
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeBookings.map(booking => (
                <div key={booking.id} className="bg-white rounded-2xl border border-soot/8 p-4">
                  <div className="flex items-start gap-3">
                    <img src={booking.spaceImage} alt={booking.spaceName} className="w-12 h-12 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-soot text-sm">{booking.spaceName}</div>
                      <div className="flex items-center gap-1 text-xs text-moss mt-0.5">
                        <MapPin size={10} />
                        {booking.spaceCity}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-moss">
                        <span>{booking.seats} seats</span>
                        <span className="capitalize bg-eucalyptus/15 px-2 py-0.5 rounded-full text-moss">{booking.plan}</span>
                        <span>{booking.type.replace('-', ' ')}</span>
                      </div>
                      {booking.employees.length > 0 && (
                        <div className="mt-2 text-xs text-moss">
                          {booking.employees.length} employee{booking.employees.length > 1 ? 's' : ''} assigned
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team members */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-soot">Team members</h2>
            <button onClick={() => navigate('org-profile')} className="text-xs text-moss hover:text-soot flex items-center gap-1">
              Manage <ArrowRight size={12} />
            </button>
          </div>

          {employees.length === 0 ? (
            <div className="bg-white rounded-2xl border border-soot/8 p-8 text-center">
              <Users size={28} className="text-moss mx-auto mb-3" />
              <div className="text-sm text-moss">No team members added yet</div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-soot/8 divide-y divide-soot/5">
              {employees.slice(0, 5).map(emp => (
                <div key={emp.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-eucalyptus/20 flex items-center justify-center text-sm font-medium text-moss">
                    {emp.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-soot truncate">{emp.name}</div>
                    <div className="text-xs text-moss truncate">{emp.department}</div>
                  </div>
                </div>
              ))}
              {employees.length > 5 && (
                <div className="px-4 py-3 text-xs text-moss text-center">
                  +{employees.length - 5} more members
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick book */}
      <div className="mt-8 bg-soot rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-white text-lg font-semibold mb-1" style={{ fontFamily: 'DM Serif Display, serif' }}>Book for your team</h2>
            <p className="text-white/60 text-sm">Hot desks, private offices, and meeting rooms for your entire team.</p>
          </div>
          <button
            onClick={() => navigate('browse')}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-eucalyptus text-soot font-medium text-sm"
          >
            Browse spaces
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
