'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  Edit3, 
  Trash2, 
  XCircle, 
  AlertCircle, 
  Sparkles,
  Layers,
  Package,
  UserCheck,
  Calendar,
  Building2,
  SlidersHorizontal,
  Check,
  Zap,
  Tag
} from 'lucide-react';
import { useApp } from '@/app/store';
import { 
  getHourlyBookingsApi, 
  createHourlyBookingApi, 
  updateHourlyBookingApi, 
  deleteHourlyBookingApi, 
  getWorkspaceSectionsApi,
  getHourlyPackagesApi,
  HourlyBookingItemApi 
} from '@/services/authApi';
import Modal from '@/components/ui/Modal';

export default function HourlyBookingsAdmin() {
  const { showToast, users, hourlyBookingsApi, fetchHourlyBookings, bookings: storeBookings, spaces } = useApp();
  const [bookings, setBookings] = useState<HourlyBookingItemApi[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [startDate, setStartDate] = useState('2026-09-05');
  const [endDate, setEndDate] = useState('2026-09-05');
  const [status, setStatus] = useState<'ACTIVE' | 'CANCELLED' | 'EXPIRED'>('ACTIVE');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'CANCELLED' | 'EXPIRED'>('CANCELLED');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFormError, setEditFormError] = useState('');

  const fetchOptions = async () => {
    const secRes = await getWorkspaceSectionsApi();
    if (secRes.success && secRes.data) {
      setSections(secRes.data);
      if (secRes.data.length > 0 && !sectionId) {
        setSectionId(secRes.data[0].id);
      }
    }

    const pkgRes = await getHourlyPackagesApi();
    if (pkgRes.success && pkgRes.data) {
      setPackages(pkgRes.data);
      if (pkgRes.data.length > 0 && !packageId) {
        setPackageId(pkgRes.data[0].id);
      }
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    await fetchHourlyBookings();
    const res = await getHourlyBookingsApi();

    const apiList: HourlyBookingItemApi[] = res.success && Array.isArray(res.data) ? res.data : [];
    const storeApiList: HourlyBookingItemApi[] = Array.isArray(hourlyBookingsApi) ? (hourlyBookingsApi as any) : [];

    const userHourlyBookings: HourlyBookingItemApi[] = storeBookings
      .filter(b => b.plan === 'hourly' || (b as any).isHourly)
      .map(b => {
        const matchedSpace = spaces.find(s => s.id === b.spaceId || s.name.toLowerCase() === b.spaceName.toLowerCase());
        const userObj = users.find(u => u.id === b.userId);
        return {
          id: b.id,
          userId: b.userId,
          sectionId: matchedSpace?.id || 'sec-default',
          packageId: 'pkg-default',
          startDate: b.startDate || new Date().toISOString(),
          endDate: b.endDate || b.startDate || new Date().toISOString(),
          hoursUsed: b.durationHours || 1,
          status: b.status === 'cancelled' ? 'CANCELLED' : (b.status as string) === 'completed' || b.status === 'previous' ? 'EXPIRED' : 'ACTIVE',
          createdAt: b.createdAt || new Date().toISOString(),
          user: { name: userObj?.name || (b as any).userName || 'User', email: userObj?.email || 'user@coworkingpass.sa' },
          section: { id: matchedSpace?.id || 'sec-1', name: b.spaceName || matchedSpace?.name || 'Meeting Room', type: 'MEETING_ROOM' },
          package: { id: 'pkg-1', packageName: `${b.durationHours || 1} Hour Package`, hoursAmount: b.durationHours || 1, price: b.totalPrice || 45 },
        };
      });

    const mergedMap = new Map<string, HourlyBookingItemApi>();
    apiList.forEach(item => mergedMap.set(item.id, item));
    storeApiList.forEach(item => mergedMap.set(item.id, item as any));
    userHourlyBookings.forEach(item => {
      if (!mergedMap.has(item.id)) {
        mergedMap.set(item.id, item);
      }
    });

    setBookings(Array.from(mergedMap.values()));
    setLoading(false);
  };

  useEffect(() => {
    fetchOptions();
    fetchBookings();
  }, [storeBookings, hourlyBookingsApi]);

  useEffect(() => {
    if (users.length > 0 && !userId) {
      const defaultUser = users.find(u => u.role !== 'admin') || users[0];
      if (defaultUser) setUserId(defaultUser.id);
    }
  }, [users]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setCreatedBookingId(null);

    if (!userId.trim()) {
      setFormError('User selection is required');
      return;
    }
    if (!sectionId.trim()) {
      setFormError('Workspace section selection is required');
      return;
    }
    if (!packageId.trim()) {
      setFormError('Hourly package selection is required');
      return;
    }
    if (!startDate || !endDate) {
      setFormError('Start date and End date are required');
      return;
    }

    setSubmitting(true);

    const result = await createHourlyBookingApi({
      userId: userId.trim(),
      sectionId: sectionId.trim(),
      packageId: packageId.trim(),
      startDate,
      endDate,
      status,
    });

    if (result.success && result.data) {
      const createdId = result.data.id || result.booking?.id || 'hb_new';
      setCreatedBookingId(createdId);
      showToast(`Hourly booking created successfully! (ID: ${createdId})`, 'success');
      fetchBookings();
    } else {
      setFormError(result.error || 'Failed to create hourly booking.');
    }

    setSubmitting(false);
  };

  const handleOpenEdit = (b: HourlyBookingItemApi) => {
    setEditingBookingId(b.id);
    setEditStatus((b.status as any) || 'CANCELLED');
    setEditFormError('');
    setIsEditModalOpen(true);
  };

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBookingId) return;
    setEditFormError('');
    setEditSubmitting(true);

    const result = await updateHourlyBookingApi(editingBookingId, {
      status: editStatus,
    });

    if (result.success) {
      showToast(`Hourly booking status updated to "${editStatus}"`, 'success');
      setBookings(prev => prev.map(b => b.id === editingBookingId ? { ...b, status: editStatus } : b));
      setIsEditModalOpen(false);
      setEditingBookingId(null);
    } else {
      setEditFormError(result.error || 'Failed to update hourly booking status');
    }

    setEditSubmitting(false);
  };

  const handleDeleteBooking = async (b: HourlyBookingItemApi) => {
    if (!window.confirm(`Are you sure you want to permanently delete hourly booking "${b.id}" from database?`)) return;

    const res = await deleteHourlyBookingApi(b.id);
    if (res.success) {
      showToast(`Hourly booking deleted successfully from database`, 'info');
      setBookings(prev => prev.filter(item => item.id !== b.id));
    } else {
      showToast(res.error || 'Failed to delete hourly booking', 'error');
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesStatus = filterStatus === 'ALL' || b.status === filterStatus;
    const userName = b.user?.name || '';
    const userEmail = b.user?.email || '';
    const sectionName = b.section?.name || '';
    const pkgName = b.package?.packageName || '';
    const search = searchQuery.toLowerCase();
    const matchesSearch = 
      b.id.toLowerCase().includes(search) ||
      b.userId.toLowerCase().includes(search) ||
      userName.toLowerCase().includes(search) ||
      userEmail.toLowerCase().includes(search) ||
      sectionName.toLowerCase().includes(search) ||
      pkgName.toLowerCase().includes(search);
    return matchesStatus && matchesSearch;
  });

  const totalCount = bookings.length;
  const activeCount = bookings.filter(b => b.status === 'ACTIVE').length;
  const cancelledCount = bookings.filter(b => b.status === 'CANCELLED').length;
  const packagesCount = packages.length;

  return (
    <div className="space-y-8">
      {/* 4 Theme-Aligned Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Hourly Bookings',
            count: totalCount,
            badge: 'bg-soot/10 text-soot border border-soot/15',
            icon: Clock,
            iconBg: 'bg-soot text-plaster border-soot/20',
          },
          {
            label: 'Active Bookings',
            count: activeCount,
            badge: 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
            icon: CheckCircle2,
            iconBg: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
          },
          {
            label: 'Cancelled Bookings',
            count: cancelledCount,
            badge: 'bg-rose-500/15 text-rose-800 border border-rose-500/30',
            icon: XCircle,
            iconBg: 'bg-rose-500/15 text-rose-800 border-rose-500/30',
          },
          {
            label: 'Available Packages',
            count: packagesCount,
            badge: 'bg-moss/10 text-moss border border-moss/20',
            icon: Package,
            iconBg: 'bg-moss/10 text-moss border-moss/20',
          },
        ].map((st, i) => (
          <div
            key={i}
            className="bg-white rounded-3xl p-5 border border-soot/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-moss uppercase block">
                  Metrics Overview
                </span>
                <h4 className="text-sm font-semibold text-soot mt-0.5">
                  {st.label}
                </h4>
              </div>
              <div className={`p-2.5 rounded-2xl border ${st.iconBg} shrink-0`}>
                <st.icon size={18} />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-serif-display font-bold text-soot">
                {st.count}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${st.badge}`}>
                Prisma DB
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Container Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-soot/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-moss text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles size={14} className="text-emerald-700" />
            <span>Hourly Bookings Management</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal text-soot font-serif-display">
            Hourly Bookings Table
          </h2>
          <p className="text-xs sm:text-sm text-moss mt-1 max-w-2xl leading-relaxed">
            Monitor, create, and manage all hourly bookings for meeting rooms and theaters synced with PostgreSQL database.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchBookings}
            className="p-3 rounded-2xl border border-soot/12 text-moss hover:text-soot hover:bg-soot/5 transition-all cursor-pointer flex items-center gap-2 text-xs font-medium"
            title="Refresh database records"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-700' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCreatedBookingId(null);
              setFormError('');
              setIsCreateModalOpen(true);
            }}
            className="bg-soot text-plaster hover:bg-soot/90 text-xs sm:text-sm font-semibold py-3 px-5 rounded-2xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Hourly Booking</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FAFAF7] p-3.5 rounded-2xl border border-soot/10">
        {/* Status Switcher */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(
            [
              { key: 'ALL', label: 'All Statuses' },
              { key: 'ACTIVE', label: 'Active' },
              { key: 'CANCELLED', label: 'Cancelled' },
              { key: 'EXPIRED', label: 'Expired' },
            ] as const
          ).map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterStatus(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === tab.key
                  ? 'bg-soot text-plaster shadow-xs'
                  : 'text-moss hover:text-soot hover:bg-soot/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-moss">
            <Search size={15} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, User, or Section..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white border border-soot/12 text-soot placeholder:text-moss/60 focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
          />
        </div>
      </div>

      {/* Bookings Grid View */}
      {loading && bookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-soot/10 shadow-xs">
          <RefreshCw size={28} className="animate-spin text-emerald-700 mx-auto mb-3" />
          <p className="text-sm text-soot font-medium">Loading hourly bookings from database...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-soot/10 shadow-xs">
          <Clock size={36} className="text-moss/40 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-soot font-serif-display">No hourly bookings found</h3>
          <p className="text-xs text-moss mt-1">Try adjusting your filter or create a new hourly booking.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map(b => {
            const isCancelled = b.status === 'CANCELLED';
            const isExpired = b.status === 'EXPIRED';
            const startStr = b.startDate ? new Date(b.startDate).toLocaleDateString() : 'N/A';
            const endStr = b.endDate ? new Date(b.endDate).toLocaleDateString() : 'N/A';

            return (
              <div 
                key={b.id}
                className="bg-white rounded-3xl p-6 border border-soot/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
              >
                <div>
                  {/* Card Status & Actions Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider ${
                      isCancelled
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : isExpired
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    }`}>
                      {isCancelled ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                      <span>{b.status || 'ACTIVE'}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(b)}
                        className="p-2 rounded-xl text-moss hover:text-soot hover:bg-soot/6 transition-colors cursor-pointer"
                        title="Update status (PUT)"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBooking(b)}
                        className="p-2 rounded-xl text-moss hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete booking (DELETE)"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Package Info */}
                  <h3 className="text-lg font-semibold text-soot font-serif-display leading-snug">
                    {b.package?.packageName || b.section?.name || 'Hourly Package Booking'}
                  </h3>

                  {/* User Section */}
                  <div className="mt-3 p-3 rounded-2xl bg-[#FAFAF7] border border-soot/8 space-y-1">
                    <div className="flex items-center gap-2 text-soot text-xs font-semibold">
                      <div className="w-6 h-6 rounded-full bg-soot text-plaster flex items-center justify-center text-[10px] font-bold">
                        {(b.user?.name || 'U').slice(0, 1).toUpperCase()}
                      </div>
                      <span className="truncate">{b.user?.name || 'User'}</span>
                    </div>
                    {b.user?.email && (
                      <div className="text-[11px] text-moss/80 truncate pl-8">
                        {b.user.email}
                      </div>
                    )}
                  </div>

                  {/* Booking Metadata Details */}
                  <div className="mt-4 pt-3 border-t border-soot/8 space-y-2 text-xs text-moss">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Layers size={13} className="text-emerald-700" /> Section:</span>
                      <span className="font-mono text-[11px] text-soot bg-soot/5 px-2 py-0.5 rounded-md">
                        {b.section?.name || b.sectionId.slice(0, 8) + '...'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Package size={13} className="text-emerald-700" /> Package:</span>
                      <span className="font-medium text-soot">
                        {b.package?.packageName ? `${b.package.packageName} (${b.package.hoursAmount}h)` : b.packageId.slice(0, 8) + '...'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-soot/6">
                      <span className="flex items-center gap-1.5"><Calendar size={13} /> Start Date:</span>
                      <span className="font-semibold text-soot">{startStr}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Calendar size={13} /> End Date:</span>
                      <span className="font-semibold text-soot">{endStr}</span>
                    </div>
                  </div>
                </div>

                {/* Footer DB Marker */}
                <div className="mt-5 pt-3 border-t border-soot/6 flex items-center justify-between text-[11px] text-moss/70 font-mono">
                  <span>ID: {b.id.slice(0, 10)}...</span>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-lg text-[10px] font-medium">
                    Prisma DB
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Hourly Booking Modal (POST) */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Hourly Booking"
        subtitle="Create a new hourly booking record synced directly to the PostgreSQL database"
      >
        <form onSubmit={handleCreateBooking} className="space-y-4 pt-2 text-left">
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {createdBookingId && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 size={18} className="text-emerald-700" />
                <span>Hourly Booking Created Successfully!</span>
              </div>
              <p className="font-mono text-xs bg-white p-2 rounded-xl border border-emerald-200 select-all">
                Booking ID: {createdBookingId}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-soot mb-1.5">
              Select User (userId) <span className="text-rose-600">*</span>
            </label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 text-soot text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
            >
              <option value="">-- Select User --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email}) — [{u.role}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-soot mb-1.5">
              Select Workspace Section (sectionId) <span className="text-rose-600">*</span>
            </label>
            {sections.length > 0 ? (
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 text-soot text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
              >
                {sections.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.type}) — [ID: {s.id.slice(0, 8)}]
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-rose-600">No workspace sections available</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-soot mb-1.5">
              Select Package (packageId) <span className="text-rose-600">*</span>
            </label>
            {packages.length > 0 ? (
              <select
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 text-soot text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
              >
                {packages.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.packageName} ({p.hoursAmount} hrs - SAR {p.price})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-rose-600">No hourly packages available</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-soot mb-1.5">
                Start Date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 text-soot text-sm focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-soot mb-1.5">
                End Date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 text-soot text-sm focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-soot mb-1.5">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 text-soot text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-soot/15 text-moss text-xs font-semibold hover:bg-soot/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-soot text-plaster hover:bg-soot/90 text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Booking in Database'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Hourly Booking Modal (PUT) */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Booking Status"
        subtitle={`Update booking status for ID (${editingBookingId?.slice(0, 10)}...) in database`}
      >
        <form onSubmit={handleUpdateBooking} className="space-y-4 pt-2 text-left">
          {editFormError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{editFormError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-soot mb-2">
              Select New Booking Status:
            </label>
            <div className="space-y-2">
              {(
                [
                  { value: 'ACTIVE', label: 'ACTIVE', desc: 'Booking is active and valid' },
                  { value: 'CANCELLED', label: 'CANCELLED', desc: 'Booking has been cancelled by user or admin' },
                  { value: 'EXPIRED', label: 'EXPIRED', desc: 'Booking duration has expired' },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    editStatus === opt.value
                      ? 'border-eucalyptus bg-emerald-50/50 text-soot'
                      : 'border-soot/12 bg-white text-moss hover:bg-soot/3'
                  }`}
                >
                  <input
                    type="radio"
                    name="editStatus"
                    value={opt.value}
                    checked={editStatus === opt.value}
                    onChange={() => setEditStatus(opt.value)}
                    className="mt-0.5 text-emerald-800 focus:ring-eucalyptus"
                  />
                  <div>
                    <div className="text-xs font-bold text-soot">{opt.label}</div>
                    <div className="text-[11px] text-moss/80">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-soot/15 text-moss text-xs font-semibold hover:bg-soot/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              className="bg-soot text-plaster hover:bg-soot/90 text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {editSubmitting ? 'Updating...' : 'Save Status Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
