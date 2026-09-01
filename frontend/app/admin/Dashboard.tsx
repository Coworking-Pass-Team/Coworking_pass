'use client';
import { Building2, Users, CalendarDays, TrendingUp, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useApp } from '@/app/store';

export default function AdminDashboard() {
  const { spaces, users, bookings, navigate } = useApp();

  const totalRevenue = bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + b.totalPrice, 0);
  const activeBookings = bookings.filter(b => b.status === 'active');
  const individuals = users.filter(u => u.role === 'individual');
  const orgs = users.filter(u => u.role === 'organization');
  const visibleSpaces = spaces.filter(s => s.isVisible);
  const fullyBooked = spaces.filter(s => s.availableCapacity === 0 && s.isVisible).length;

  const recentBookings = bookings.slice(-5).reverse();
  const recentUsers = users.filter(u => u.role !== 'admin').slice(-4);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <p className="text-moss text-sm mb-1">Admin overview</p>
        <h1 className="text-3xl text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>Dashboard</h1>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total revenue', value: `SAR ${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-moss', change: '+12%' },
          { label: 'Active bookings', value: activeBookings.length, icon: CalendarDays, color: 'text-eucalyptus', change: '+5%' },
          { label: 'Total users', value: users.filter(u => u.role !== 'admin').length, icon: Users, color: 'text-soot', change: '+8%' },
          { label: 'Active spaces', value: visibleSpaces.length, icon: Building2, color: 'text-mist', change: '+2' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-soot/8">
            <div className="flex items-center justify-between mb-3">
              <div className={s.color}><s.icon size={18} /></div>
              <span className="text-xs font-medium text-moss bg-eucalyptus/15 px-2 py-0.5 rounded-full">{s.change}</span>
            </div>
            <div className="text-2xl font-semibold text-soot">{s.value}</div>
            <div className="text-xs text-moss mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* More stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Individuals', value: individuals.length },
          { label: 'Organizations', value: orgs.length },
          { label: 'Fully booked', value: fullyBooked },
          { label: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-soot/8 text-center">
            <div className="text-2xl font-semibold text-soot">{s.value}</div>
            <div className="text-xs text-moss mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent bookings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-soot">Recent bookings</h2>
            <button onClick={() => navigate('admin-bookings')} className="text-xs text-moss hover:text-soot flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-soot/8 divide-y divide-soot/5">
            {recentBookings.map(b => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                <img src={b.spaceImage} alt={b.spaceName} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-soot truncate">{b.spaceName}</div>
                  <div className="text-xs text-moss truncate">{b.spaceCity} · {b.plan}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-medium text-soot">SAR {b.totalPrice.toLocaleString()}</div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${b.status === 'active' ? 'bg-eucalyptus/15 text-moss' : b.status === 'previous' ? 'bg-mist/30 text-soot' : 'bg-red-50 text-red-500'}`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent users */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-soot">Recent users</h2>
            <button onClick={() => navigate('admin-users')} className="text-xs text-moss hover:text-soot flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-soot/8 divide-y divide-soot/5">
            {recentUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-soot truncate">{u.role === 'organization' ? u.orgName || u.name : u.name}</div>
                  <div className="text-xs text-moss truncate">{u.email}</div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${u.isBlocked ? 'bg-red-50 text-red-500' : 'bg-eucalyptus/15 text-moss'}`}>
                    {u.isBlocked ? 'Blocked' : u.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        {[
          { label: 'Manage spaces', desc: 'Add, edit, or remove coworking spaces', screen: 'admin-spaces' as const, accent: '' },
          { label: 'Manage users', desc: 'View, block, or edit user accounts', screen: 'admin-users' as const, accent: 'border-l-4 border-l-mist' },
          { label: 'View reports', desc: 'Revenue and booking analytics', screen: 'admin-reports' as const, accent: '' },
        ].map(l => (
          <button
            key={l.screen}
            onClick={() => navigate(l.screen)}
            className={`flex items-start justify-between gap-2 bg-white rounded-2xl border border-soot/8 p-5 text-left hover:border-eucalyptus/40 hover:shadow-sm transition-all group ${l.accent}`}
          >
            <div>
              <div className="font-semibold text-soot text-sm">{l.label}</div>
              <div className="text-xs text-moss mt-1">{l.desc}</div>
            </div>
            <ArrowUpRight size={14} className="text-moss group-hover:text-soot mt-0.5 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
