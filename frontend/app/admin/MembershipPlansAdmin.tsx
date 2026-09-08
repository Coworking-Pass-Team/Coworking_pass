'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  CheckCircle2, 
  Users, 
  Building2, 
  Sparkles, 
  Calendar, 
  AlertCircle,
  RefreshCw,
  Search,
  Tag,
  Edit3,
  Trash2
} from 'lucide-react';
import { useApp } from '@/app/store';
import { 
  getMembershipPlansApi, 
  createMembershipPlanApi, 
  updateMembershipPlanApi,
  deleteMembershipPlanApi,
  MembershipPlan 
} from '@/services/authApi';
import Modal from '@/components/ui/Modal';

export default function MembershipPlansAdmin() {
  const { showToast } = useApp();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'B2C' | 'B2B'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planType, setPlanType] = useState<'B2C' | 'B2B'>('B2C');
  const [totalVisitsAllowed, setTotalVisitsAllowed] = useState<number | ''>(30);
  const [price, setPrice] = useState<number | ''>(1500);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPlanName, setEditPlanName] = useState('');
  const [editPlanType, setEditPlanType] = useState<'B2C' | 'B2B'>('B2C');
  const [editTotalVisitsAllowed, setEditTotalVisitsAllowed] = useState<number | ''>(30);
  const [editPrice, setEditPrice] = useState<number | ''>(1500);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFormError, setEditFormError] = useState('');

  const fetchPlans = async () => {
    setLoading(true);
    const res = await getMembershipPlansApi();
    if (res.success && res.data) {
      setPlans(res.data);
    } else {
      showToast(res.error || 'Failed to fetch membership plans', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!planName.trim()) {
      setFormError('Please provide a descriptive plan name.');
      return;
    }
    if (!totalVisitsAllowed || Number(totalVisitsAllowed) <= 0) {
      setFormError('Please enter a valid number of allowed visits.');
      return;
    }
    if (price === '' || Number(price) < 0) {
      setFormError('Please enter a valid price in SAR.');
      return;
    }

    setSubmitting(true);

    const result = await createMembershipPlanApi({
      planName: planName.trim(),
      type: planType,
      totalVisitsAllowed: Number(totalVisitsAllowed),
      price: Number(price),
    });

    if (result.success && result.data) {
      showToast(`Membership plan "${result.data.planName}" created successfully!`, 'success');
      setPlans(prev => [result.data!, ...prev]);
      setIsCreateModalOpen(false);
      setPlanName('');
      setPlanType('B2C');
      setTotalVisitsAllowed(30);
      setPrice(1500);
    } else {
      setFormError(result.error || 'Failed to create membership plan.');
    }

    setSubmitting(false);
  };

  const handleOpenEdit = (plan: MembershipPlan) => {
    setEditingPlanId(plan.id);
    setEditPlanName(plan.planName);
    setEditPlanType(plan.type);
    setEditTotalVisitsAllowed(plan.totalVisitsAllowed);
    setEditPrice(plan.price);
    setEditFormError('');
    setIsEditModalOpen(true);
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlanId) return;
    setEditFormError('');

    if (!editPlanName.trim()) {
      setEditFormError('Plan name is required.');
      return;
    }
    if (!editTotalVisitsAllowed || Number(editTotalVisitsAllowed) <= 0) {
      setEditFormError('Allowed visits must be greater than 0.');
      return;
    }
    if (editPrice === '' || Number(editPrice) < 0) {
      setEditFormError('Price must be a valid positive amount.');
      return;
    }

    setEditSubmitting(true);

    const result = await updateMembershipPlanApi(editingPlanId, {
      planName: editPlanName.trim(),
      type: editPlanType,
      totalVisitsAllowed: Number(editTotalVisitsAllowed),
      price: Number(editPrice),
    });

    if (result.success && result.data) {
      showToast(`Plan "${result.data.planName}" updated successfully!`, 'success');
      setPlans(prev => prev.map(p => p.id === editingPlanId ? result.data! : p));
      setIsEditModalOpen(false);
      setEditingPlanId(null);
    } else {
      setEditFormError(result.error || 'Failed to update plan.');
    }

    setEditSubmitting(false);
  };

  const handleDeletePlan = async (plan: MembershipPlan) => {
    if (!window.confirm(`Are you sure you want to delete the plan "${plan.planName}"?`)) return;

    const res = await deleteMembershipPlanApi(plan.id);
    if (res.success) {
      showToast(`Plan "${plan.planName}" deleted successfully`, 'info');
      setPlans(prev => prev.filter(p => p.id !== plan.id));
    } else {
      showToast(res.error || 'Failed to delete plan', 'error');
    }
  };

  const filteredPlans = plans.filter(p => {
    const matchesType = filterType === 'ALL' || p.type === filterType;
    const matchesSearch = p.planName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header and Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-soot/8 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-moss text-xs font-semibold uppercase tracking-wider mb-1">
            <CreditCard size={14} className="text-emerald-700" />
            <span>Product Catalog</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal text-soot font-serif-display">
            Membership Plans
          </h2>
          <p className="text-xs sm:text-sm text-moss mt-1">
            Configure B2C Individual passes and B2B Corporate subscription packages across Saudi Arabia.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchPlans}
            className="p-2.5 rounded-xl border border-soot/12 text-moss hover:text-soot hover:bg-soot/5 transition-colors cursor-pointer"
            title="Refresh plans list"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary py-2.5 px-4 text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Plan</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FBF9F5] p-3 rounded-2xl border border-soot/8">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['ALL', 'B2C', 'B2B'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterType === t
                  ? 'bg-soot text-plaster shadow-xs'
                  : 'text-moss hover:text-soot hover:bg-soot/5'
              }`}
            >
              {t === 'ALL' ? 'All Audiences' : t === 'B2C' ? 'B2C (Individual)' : 'B2B (Corporate)'}
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
            placeholder="Search plans..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white border border-soot/12 text-soot placeholder:text-moss/60 focus:outline-none focus:ring-2 focus:ring-eucalyptus"
          />
        </div>
      </div>

      {/* Plans Grid */}
      {loading && plans.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-soot/8">
          <RefreshCw size={24} className="animate-spin text-moss mx-auto mb-2" />
          <p className="text-xs text-moss font-medium">Loading membership plans...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-soot/8">
          <Tag size={28} className="text-moss/50 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-soot">No membership plans found</h3>
          <p className="text-xs text-moss mt-1">Try adjusting your search query or click "Create Plan" above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlans.map(plan => {
            const isB2B = plan.type === 'B2B';
            return (
              <div 
                key={plan.id}
                className="bg-white rounded-3xl p-6 border border-soot/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      isB2B 
                        ? 'bg-soot text-plaster' 
                        : 'bg-eucalyptus/20 text-soot border border-eucalyptus/30'
                    }`}>
                      {isB2B ? <Building2 size={12} /> : <Users size={12} />}
                      <span>{plan.type} {isB2B ? 'Corporate' : 'Individual'}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(plan)}
                        className="p-1.5 rounded-lg text-moss hover:text-soot hover:bg-soot/5 transition-colors cursor-pointer"
                        title="Edit Plan (PUT)"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(plan)}
                        className="p-1.5 rounded-lg text-moss hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Plan"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-normal font-serif-display text-soot group-hover:text-emerald-900 transition-colors">
                    {plan.planName}
                  </h3>

                  <div className="mt-4 mb-5 pb-4 border-b border-soot/8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-serif-display font-normal text-soot tracking-tight">
                        SAR {plan.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-moss">/ plan</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-moss">
                    <div className="flex items-center justify-between">
                      <span>Total Visits Allowed:</span>
                      <span className="font-semibold text-soot">{plan.totalVisitsAllowed} visits</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Network Access:</span>
                      <span className="font-semibold text-emerald-800">All Partner Spaces</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-soot/6 flex items-center justify-between text-[11px] text-moss">
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 size={13} />
                    Active in API
                  </span>
                  <span className="font-mono text-[10px] text-moss/70">ID: {plan.id.slice(0, 8)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Plan Modal */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Membership Plan"
        subtitle="POST http://localhost:3001/api/membership-plans"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">
              Plan Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="e.g. Executive Quarterly Pass"
              className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 text-soot text-sm focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">
                Audience Type <span className="text-rose-600">*</span>
              </label>
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value as 'B2C' | 'B2B')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 text-soot text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
              >
                <option value="B2C">B2C — Individual Member</option>
                <option value="B2B">B2B — Corporate / Team</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">
                Total Allowed Visits <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={totalVisitsAllowed}
                onChange={(e) => setTotalVisitsAllowed(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 30"
                className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 text-soot text-sm focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">
              Price (SAR) <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs text-moss font-semibold pointer-events-none">
                SAR
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                placeholder="1500"
                className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-soot/15 text-soot text-sm focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-soot/10 mt-6">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-moss hover:text-soot hover:bg-soot/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary py-2.5 px-5 text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Creating Plan...</span>
              ) : (
                <>
                  <Plus size={15} />
                  <span>Create Plan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Plan Modal */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Membership Plan"
        subtitle={`PUT http://localhost:3001/api/membership-plans/${editingPlanId || ''}`}
      >
        <form onSubmit={handleUpdatePlan} className="space-y-4 pt-2">
          {editFormError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{editFormError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">
              Plan Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={editPlanName}
              onChange={(e) => setEditPlanName(e.target.value)}
              placeholder="e.g. Executive Quarterly Pass"
              className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 text-soot text-sm focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">
                Audience Type <span className="text-rose-600">*</span>
              </label>
              <select
                value={editPlanType}
                onChange={(e) => setEditPlanType(e.target.value as 'B2C' | 'B2B')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 text-soot text-sm bg-white focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
              >
                <option value="B2C">B2C — Individual Member</option>
                <option value="B2B">B2B — Corporate / Team</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">
                Total Allowed Visits <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={editTotalVisitsAllowed}
                onChange={(e) => setEditTotalVisitsAllowed(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 30"
                className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 text-soot text-sm focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">
              Price (SAR) <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs text-moss font-semibold pointer-events-none">
                SAR
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value ? Number(e.target.value) : '')}
                placeholder="1500"
                className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-soot/15 text-soot text-sm focus:outline-none focus:ring-2 focus:ring-eucalyptus shadow-2xs"
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
                  <span>Save Plan Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
