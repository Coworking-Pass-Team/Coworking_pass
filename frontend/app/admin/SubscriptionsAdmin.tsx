'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  Users, 
  Calendar, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  Tag, 
  Edit3, 
  Trash2, 
  XCircle, 
  ShieldCheck,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { useApp } from '@/app/store';
import { 
  getSubscriptionsApi, 
  createSubscriptionApi, 
  updateSubscriptionApi, 
  deleteSubscriptionApi, 
  getMembershipPlansApi,
  SubscriptionItemApi, 
  MembershipPlan 
} from '@/services/authApi';
import Modal from '@/components/ui/Modal';

export default function SubscriptionsAdmin() {
  const { showToast, users } = useApp();
  const [subscriptions, setSubscriptions] = useState<SubscriptionItemApi[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-10-01');
  const [status, setStatus] = useState<'ACTIVE' | 'CANCELLED' | 'EXPIRED'>('ACTIVE');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [createdSubId, setCreatedSubId] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'CANCELLED' | 'EXPIRED'>('CANCELLED');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFormError, setEditFormError] = useState('');

  const fetchPlans = async () => {
    const res = await getMembershipPlansApi();
    if (res.success && res.data) {
      setPlans(res.data);
      if (res.data.length > 0 && !planId) {
        setPlanId(res.data[0].id);
      }
    }
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    const res = await getSubscriptionsApi();
    if (res.success && res.data) {
      setSubscriptions(res.data);
    } else {
      showToast(res.error || 'Failed to fetch subscriptions', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
    fetchSubscriptions();
  }, []);

  // Pre-fill user if users list exists
  useEffect(() => {
    if (users.length > 0 && !userId) {
      const defaultUser = users.find(u => u.role !== 'admin') || users[0];
      if (defaultUser) setUserId(defaultUser.id);
    }
  }, [users]);

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setCreatedSubId(null);

    if (!userId.trim()) {
      setFormError('User ID is required.');
      return;
    }
    if (!planId.trim()) {
      setFormError('Plan ID is required.');
      return;
    }
    if (!startDate || !endDate) {
      setFormError('Start date and End date are required.');
      return;
    }

    setSubmitting(true);

    const result = await createSubscriptionApi({
      userId: userId.trim(),
      planId: planId.trim(),
      startDate,
      endDate,
      status,
    });

    if (result.success && result.data) {
      const createdId = result.data.id || result.subscription?.id || 'sub_new';
      setCreatedSubId(createdId);
      showToast(`Subscription created successfully! (ID: ${createdId})`, 'success');
      
      // Refresh list
      fetchSubscriptions();
    } else {
      setFormError(result.error || 'Failed to create subscription.');
    }

    setSubmitting(false);
  };

  const handleOpenEdit = (sub: SubscriptionItemApi) => {
    setEditingSubId(sub.id);
    setEditStatus(sub.status as any || 'CANCELLED');
    setEditStartDate(sub.startDate ? sub.startDate.split('T')[0] : '');
    setEditEndDate(sub.endDate ? sub.endDate.split('T')[0] : '');
    setEditFormError('');
    setIsEditModalOpen(true);
  };

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubId) return;
    setEditFormError('');

    setEditSubmitting(true);

    const result = await updateSubscriptionApi(editingSubId, {
      status: editStatus,
      ...(editStartDate ? { startDate: editStartDate } : {}),
      ...(editEndDate ? { endDate: editEndDate } : {}),
    });

    if (result.success) {
      showToast(`Subscription status updated to "${editStatus}"!`, 'success');
      setSubscriptions(prev => prev.map(s => s.id === editingSubId ? { ...s, status: editStatus } : s));
      setIsEditModalOpen(false);
      setEditingSubId(null);
    } else {
      setEditFormError(result.error || 'Failed to update subscription.');
    }

    setEditSubmitting(false);
  };

  const handleDeleteSubscription = async (sub: SubscriptionItemApi) => {
    if (!window.confirm(`Are you sure you want to delete subscription "${sub.id}"?`)) return;

    const res = await deleteSubscriptionApi(sub.id);
    if (res.success) {
      showToast(`Subscription "${sub.id}" deleted successfully from DB`, 'info');
      setSubscriptions(prev => prev.filter(s => s.id !== sub.id));
    } else {
      showToast(res.error || 'Failed to delete subscription', 'error');
    }
  };

  const filteredSubscriptions = subscriptions.filter(s => {
    const matchesStatus = filterStatus === 'ALL' || s.status === filterStatus;
    const userName = s.user?.name || '';
    const userEmail = s.user?.email || '';
    const planName = s.plan?.planName || '';
    const search = searchQuery.toLowerCase();
    const matchesSearch = 
      s.id.toLowerCase().includes(search) ||
      s.userId.toLowerCase().includes(search) ||
      userName.toLowerCase().includes(search) ||
      userEmail.toLowerCase().includes(search) ||
      planName.toLowerCase().includes(search);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header and Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-soot/8 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-moss text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles size={14} className="text-emerald-700" />
            <span>Passes &amp; Subscriptions Database</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal text-soot font-serif-display">
            Subscriptions Management
          </h2>
          <p className="text-xs sm:text-sm text-moss mt-1">
            Full CRUD operations for B2C &amp; B2B subscriptions (GET, POST, PUT, DELETE /api/subscriptions).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchSubscriptions}
            className="p-2.5 rounded-xl border border-soot/12 text-moss hover:text-soot hover:bg-soot/5 transition-colors cursor-pointer"
            title="Refresh subscriptions list (GET)"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => {
              setCreatedSubId(null);
              setFormError('');
              setIsCreateModalOpen(true);
            }}
            className="btn-primary py-2.5 px-4 text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Subscription</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FBF9F5] p-3 rounded-2xl border border-soot/8">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'ACTIVE', 'CANCELLED', 'EXPIRED'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-soot text-plaster shadow-xs'
                  : 'text-moss hover:text-soot hover:bg-soot/5'
              }`}
            >
              {st === 'ALL' ? 'All Statuses' : st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-moss">
            <Search size={14} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, User, or Plan..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white border border-soot/12 text-soot placeholder:text-moss/60 focus:outline-none focus:ring-2 focus:ring-eucalyptus"
          />
        </div>
      </div>

      {/* Subscriptions Grid */}
      {loading && subscriptions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-soot/8">
          <RefreshCw size={24} className="animate-spin text-moss mx-auto mb-2" />
          <p className="text-xs text-moss font-medium">Loading subscriptions from DB...</p>
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-soot/8">
          <Calendar size={28} className="text-moss/50 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-soot">No subscriptions found</h3>
          <p className="text-xs text-moss mt-1">Try adjusting your filter or click &quot;Create Subscription&quot; to issue a pass.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubscriptions.map(sub => {
            const isCancelled = sub.status === 'CANCELLED';
            const isExpired = sub.status === 'EXPIRED';
            const startStr = sub.startDate ? new Date(sub.startDate).toLocaleDateString() : 'N/A';
            const endStr = sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'N/A';

            return (
              <div 
                key={sub.id}
                className="bg-white rounded-3xl p-6 border border-soot/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      isCancelled
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : isExpired
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    }`}>
                      {isCancelled ? <XCircle size={12} /> : <CheckCircle2 size={12} />}
                      <span>{sub.status || 'ACTIVE'}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sub)}
                        className="p-1.5 rounded-lg text-moss hover:text-soot hover:bg-soot/5 transition-colors cursor-pointer"
                        title="Update Subscription Status (PUT)"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubscription(sub)}
                        className="p-1.5 rounded-lg text-moss hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Subscription (DELETE)"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-soot font-serif-display leading-snug">
                    {sub.plan?.planName || 'Membership Subscription'}
                  </h3>

                  <div className="mt-2 text-xs text-moss space-y-1">
                    <div className="flex items-center gap-1.5 text-soot font-medium">
                      <UserCheck size={13} className="text-emerald-700 shrink-0" />
                      <span>{sub.user?.name || 'User ID: ' + sub.userId.slice(0, 8)}</span>
                    </div>
                    {sub.user?.email && (
                      <div className="text-[11px] text-moss/80 truncate pl-4">
                        {sub.user.email}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-soot/8 space-y-1.5 text-xs text-moss">
                    <div className="flex items-center justify-between">
                      <span>Start Date:</span>
                      <span className="font-semibold text-soot">{startStr}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>End Date:</span>
                      <span className="font-semibold text-soot">{endStr}</span>
                    </div>
                    {sub.plan?.price !== undefined && (
                      <div className="flex items-center justify-between">
                        <span>Price:</span>
                        <span className="font-semibold text-emerald-800">SAR {sub.plan.price}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-soot/6 flex items-center justify-between text-[10px] text-moss/70 font-mono">
                  <span>Sub ID: {sub.id.slice(0, 10)}...</span>
                  <span className="bg-soot/5 px-2 py-0.5 rounded-md text-soot font-medium">Prisma DB</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Subscription Modal (POST) */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Subscription"
        subtitle="POST http://localhost:3000/api/subscriptions"
      >
        <form onSubmit={handleCreateSubscription} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {createdSubId && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 size={16} className="text-emerald-700" />
                <span>Subscription Activated Successfully!</span>
              </div>
              <p className="font-mono text-[11px] bg-white p-2 rounded-lg border border-emerald-200 select-all">
                Subscription ID: {createdSubId}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">
              Select User (userId) <span className="text-rose-600">*</span>
            </label>
            <div className="space-y-2">
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 text-soot text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
              >
                <option value="">-- Select Registered User --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email}) — [{u.role}]
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Or paste exact userId from register (e.g. cly123...)"
                className="w-full px-3.5 py-2 rounded-xl border border-soot/12 text-soot text-xs font-mono bg-soot/3 focus:outline-none focus:ring-2 focus:ring-eucalyptus"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">
              Select Plan (planId) <span className="text-rose-600">*</span>
            </label>
            <div className="space-y-2">
              {plans.length > 0 ? (
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 text-soot text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.planName} ({p.type}) — SAR {p.price} [ID: {p.id.slice(0, 8)}]
                    </option>
                  ))}
                </select>
              ) : null}

              <input
                type="text"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                placeholder="Or paste exact planId (e.g. plan-1)"
                className="w-full px-3.5 py-2 rounded-xl border border-soot/12 text-soot text-xs font-mono bg-soot/3 focus:outline-none focus:ring-2 focus:ring-eucalyptus"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">
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
              <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">
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
            <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 text-soot text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
            >
              <option value="ACTIVE">ACTIVE — Active Pass</option>
              <option value="CANCELLED">CANCELLED — Cancelled</option>
              <option value="EXPIRED">EXPIRED — Expired Pass</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-soot/10 mt-6">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-moss hover:text-soot hover:bg-soot/5 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary py-2.5 px-5 text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Creating Subscription...</span>
              ) : (
                <>
                  <Plus size={15} />
                  <span>Create Subscription</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Subscription Modal (PUT) */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Subscription Status"
        subtitle={`PUT http://localhost:3000/api/subscriptions/${editingSubId || ''}`}
      >
        <form onSubmit={handleUpdateSubscription} className="space-y-4 pt-2">
          {editFormError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{editFormError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">
              Subscription Status <span className="text-rose-600">*</span>
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 text-soot text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
            >
              <option value="CANCELLED">CANCELLED — Cancel Subscription</option>
              <option value="ACTIVE">ACTIVE — Reactivate Subscription</option>
              <option value="EXPIRED">EXPIRED — Mark Expired</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">
                Start Date
              </label>
              <input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 text-soot text-sm focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">
                End Date
              </label>
              <input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 text-soot text-sm focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-soot/10 mt-6">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-moss hover:text-soot hover:bg-soot/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              className="btn-primary py-2.5 px-5 text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {editSubmitting ? (
                <span>Saving Changes...</span>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Update Subscription</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
