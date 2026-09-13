'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  Trash2,
  Coins,
  Gift,
  Award,
  AlertCircle,
  ChevronRight,
  Eye,
  Check,
  X,
  MessageSquare,
  TrendingUp,
  Sliders,
  User,
  Calendar,
  Zap,
  Info
} from 'lucide-react';
import { useApp } from '@/app/store';
import { LoyaltyRule, LoyaltyRuleType, ApprovalStatus } from '@/types/types';
import Modal from '@/components/ui/Modal';

export default function LoyaltyProposalsAdmin() {
  const { currentUser, loyaltyRules, updateLoyaltyRuleStatus, deleteLoyaltyRule, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ApprovalStatus>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | LoyaltyRuleType>('ALL');

  // Modal States
  const [selectedDetailRule, setSelectedDetailRule] = useState<LoyaltyRule | null>(null);
  const [approveConfirmRule, setApproveConfirmRule] = useState<LoyaltyRule | null>(null);
  const [rejectRule, setRejectRule] = useState<LoyaltyRule | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Metrics
  const totalCount = loyaltyRules.length;
  const pendingCount = loyaltyRules.filter((r) => r.status === 'PENDING_APPROVAL').length;
  const approvedCount = loyaltyRules.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = loyaltyRules.filter((r) => r.status === 'REJECTED').length;

  // Filter proposals
  const filteredRules = loyaltyRules.filter((rule) => {
    const matchesQuery =
      rule.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rule.description && rule.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rule.proposerName && rule.proposerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rule.proposerEmail && rule.proposerEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rule.workspaceName && rule.workspaceName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || rule.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || rule.ruleType === typeFilter;

    return matchesQuery && matchesStatus && matchesType;
  });

  // Open Approval Confirmation
  const handleOpenApproveModal = (rule: LoyaltyRule, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setApproveConfirmRule(rule);
  };

  // Confirm Approval
  const handleConfirmApproval = async () => {
    if (!approveConfirmRule) return;
    setIsProcessing(true);
    try {
      await updateLoyaltyRuleStatus(approveConfirmRule.id, 'APPROVED');
      setApproveConfirmRule(null);
      if (selectedDetailRule?.id === approveConfirmRule.id) {
        setSelectedDetailRule((prev) => (prev ? { ...prev, status: 'APPROVED', isActive: true } : null));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Open Rejection Modal
  const handleOpenRejectModal = (rule: LoyaltyRule, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRejectRule(rule);
    setRejectionReason(rule.adminFeedback || '');
    setRejectionError('');
  };

  // Confirm Rejection
  const handleConfirmRejection = async () => {
    if (!rejectRule) return;
    if (!rejectionReason.trim()) {
      setRejectionError('Please provide a reason or feedback for rejecting this proposal.');
      return;
    }

    setIsProcessing(true);
    try {
      await updateLoyaltyRuleStatus(rejectRule.id, 'REJECTED', rejectionReason.trim());
      setRejectRule(null);
      setRejectionReason('');
      setRejectionError('');
      if (selectedDetailRule?.id === rejectRule.id) {
        setSelectedDetailRule((prev) =>
          prev ? { ...prev, status: 'REJECTED', isActive: false, adminFeedback: rejectionReason.trim() } : null
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (ruleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this loyalty rule proposal?')) {
      await deleteLoyaltyRule(ruleId);
      if (selectedDetailRule?.id === ruleId) {
        setSelectedDetailRule(null);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-soot/8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold tracking-wider uppercase text-moss bg-soot/5 px-2.5 py-0.5 rounded-md">
              Super Admin Management
            </span>
            {pendingCount > 0 && (
              <span className="text-xs font-bold text-amber-900 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                {pendingCount} Pending Review
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display tracking-tight flex items-center gap-3">
            <span>Loyalty Points Proposals</span>
            <Sparkles className="text-emerald-700 w-7 h-7 shrink-0 hidden sm:inline" />
          </h1>
          <p className="text-moss text-sm mt-1 max-w-2xl">
            Review, evaluate economic impact, approve, or reject point-earning and redemption discount rules submitted by Space Providers.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-soot/12 p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-soot/10 text-soot border border-soot/15 shrink-0">
              <Award size={20} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-soot tracking-tight font-sans">{totalCount}</div>
              <div className="text-xs font-medium text-moss mt-0.5">Total Proposals</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-soot/12 p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-amber-500/15 text-amber-800 border border-amber-500/30 shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-amber-800 tracking-tight font-sans">{pendingCount}</div>
              <div className="text-xs font-medium text-moss mt-0.5">Pending Approval</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-soot/12 p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-emerald-800 tracking-tight font-sans">{approvedCount}</div>
              <div className="text-xs font-medium text-moss mt-0.5">Approved & Active</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-soot/12 p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-rose-500/15 text-rose-800 border border-rose-500/30 shrink-0">
              <XCircle size={20} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-rose-800 tracking-tight font-sans">{rejectedCount}</div>
              <div className="text-xs font-medium text-moss mt-0.5">Rejected Proposals</div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filtering */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-soot/5 rounded-2xl overflow-x-auto">
            {(
              [
                { key: 'ALL', label: 'All Proposals', count: totalCount },
                { key: 'PENDING_APPROVAL', label: 'Pending Review', count: pendingCount },
                { key: 'APPROVED', label: 'Approved', count: approvedCount },
                { key: 'REJECTED', label: 'Rejected', count: rejectedCount },
              ] as const
            ).map((tab) => {
              const active = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-white text-soot shadow-xs font-bold'
                      : 'text-moss hover:text-soot hover:bg-white/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      active ? 'bg-soot text-white' : 'bg-soot/10 text-moss'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3.5 py-2 rounded-xl bg-white border border-soot/15 text-xs text-soot font-medium focus:outline-none focus:ring-2 focus:ring-soot/20 cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Rule Types</option>
              <option value="EARNING">Earning Rules (Points Accumulation)</option>
              <option value="REDEMPTION">Redemption Rules (Discounts)</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-moss" />
          <input
            type="text"
            placeholder="Search by rule title, provider name, email, workspace, or rationale..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-soot/15 text-sm text-soot placeholder:text-moss/60 focus:outline-none focus:ring-2 focus:ring-soot/20 shadow-2xs"
          />
        </div>
      </div>

      {/* Proposals List */}
      {filteredRules.length === 0 ? (
        <div className="bg-white rounded-3xl border border-soot/10 p-12 text-center shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#DDE6DF] text-soot flex items-center justify-center mx-auto shadow-2xs">
            <Sparkles size={26} className="text-moss" />
          </div>
          <h3 className="text-lg font-serif-display text-soot">No Loyalty Proposals Found</h3>
          <p className="text-moss text-xs sm:text-sm max-w-md mx-auto">
            {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
              ? 'No proposals matched your active filters. Try clearing your search query.'
              : 'There are no loyalty points proposals submitted by space providers currently.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRules.map((rule) => {
            const isPending = rule.status === 'PENDING_APPROVAL';
            const isApproved = rule.status === 'APPROVED';
            const isRejected = rule.status === 'REJECTED';
            const isEarning = rule.ruleType === 'EARNING';

            return (
              <div
                key={rule.id}
                className="bg-white rounded-3xl border border-soot/12 p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3.5">
                  {/* Header Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                        isEarning
                          ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30'
                          : 'bg-blue-500/15 text-blue-800 border border-blue-500/30'
                      }`}
                    >
                      {isEarning ? <Coins size={12} /> : <Gift size={12} />}
                      {isEarning ? 'Earning Rule' : 'Redemption Rule'}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${
                        isPending
                          ? 'bg-amber-500/15 text-amber-900 border border-amber-500/30'
                          : isApproved
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-rose-500/15 text-rose-800 border border-rose-500/30'
                      }`}
                    >
                      {isPending && <Clock size={12} className="text-amber-700 animate-spin" />}
                      {isApproved && <CheckCircle2 size={12} />}
                      {isRejected && <XCircle size={12} />}
                      <span>{isPending ? 'Pending Review' : isApproved ? 'Approved & Active' : 'Rejected'}</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-lg font-serif-display font-medium text-soot group-hover:text-emerald-950 transition-colors">
                      {rule.ruleName}
                    </h3>
                    <p className="text-moss text-xs mt-1 line-clamp-2 leading-relaxed">
                      {rule.description || 'No business rationale provided.'}
                    </p>
                  </div>

                  {/* Economic Parameters Box */}
                  <div className="p-3.5 rounded-2xl bg-plaster-surface border border-soot/8 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-soot">
                      <span className="text-moss font-medium">Exchange Rate:</span>
                      <span className="font-bold">
                        {isEarning
                          ? `+${rule.pointsValue} pts / SAR ${rule.monetaryValue}`
                          : `${rule.pointsValue} pts = SAR ${rule.monetaryValue} off`}
                      </span>
                    </div>

                    {rule.bonusMultiplier && rule.bonusMultiplier > 1 && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-soot/6">
                        <span className="text-moss font-medium">Multiplier:</span>
                        <span className="font-bold text-emerald-800">{rule.bonusMultiplier}× Boost</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-soot/6">
                      <span className="text-moss font-medium">Submitted By:</span>
                      <span className="font-semibold text-soot truncate max-w-[150px]">
                        {rule.proposerName || 'Space Provider'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-soot/6">
                      <span className="text-moss font-medium">Target Space:</span>
                      <span className="text-soot font-medium truncate max-w-[150px]">
                        {rule.workspaceName || 'All Listed Workspaces'}
                      </span>
                    </div>
                  </div>

                  {/* Admin Rejection Reason Display if Rejected */}
                  {isRejected && rule.adminFeedback && (
                    <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1">
                      <span className="font-bold text-rose-900 block">Rejection Feedback:</span>
                      <p className="text-rose-800 leading-relaxed">{rule.adminFeedback}</p>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 border-t border-soot/8 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDetailRule(rule)}
                      className="flex-1 py-2 px-3 rounded-xl bg-plaster hover:bg-plaster-dark/40 text-soot text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>View Details</span>
                    </button>

                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleOpenApproveModal(rule, e)}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          title="Approve Proposal"
                        >
                          <Check size={13} />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenRejectModal(rule, e)}
                          className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          title="Reject Proposal"
                        >
                          <X size={13} />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {!isPending && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(rule.id, e)}
                        className="p-2 text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. VIEW COMPLETE DETAILS MODAL */}
      {selectedDetailRule && (
        <Modal
          open={Boolean(selectedDetailRule)}
          onClose={() => setSelectedDetailRule(null)}
          title="Complete Proposal Details"
        >
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-soot/8">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-moss">
                  Proposal Rule Title
                </span>
                <h3 className="text-xl font-serif-display text-soot font-medium">
                  {selectedDetailRule.ruleName}
                </h3>
              </div>
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold shrink-0 ${
                  selectedDetailRule.status === 'PENDING_APPROVAL'
                    ? 'bg-amber-500/15 text-amber-900 border border-amber-500/30'
                    : selectedDetailRule.status === 'APPROVED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-500/15 text-rose-800 border border-rose-500/30'
                }`}
              >
                {selectedDetailRule.status === 'PENDING_APPROVAL'
                  ? 'Pending Review'
                  : selectedDetailRule.status === 'APPROVED'
                  ? 'Approved & Active'
                  : 'Rejected'}
              </span>
            </div>

            {/* Grid specs */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-plaster-surface rounded-2xl border border-soot/8">
                <span className="text-moss font-medium block">Rule Type</span>
                <span className="font-bold text-soot text-sm mt-0.5 block">
                  {selectedDetailRule.ruleType === 'EARNING' ? 'Points Earning' : 'Points Redemption'}
                </span>
              </div>
              <div className="p-3 bg-plaster-surface rounded-2xl border border-soot/8">
                <span className="text-moss font-medium block">Exchange Value</span>
                <span className="font-bold text-soot text-sm mt-0.5 block">
                  {selectedDetailRule.pointsValue} pts / SAR {selectedDetailRule.monetaryValue}
                </span>
              </div>
            </div>

            {/* Provider & Space details */}
            <div className="p-4 bg-plaster-surface rounded-2xl border border-soot/8 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-moss">Proposer / Space Provider:</span>
                <span className="font-bold text-soot">{selectedDetailRule.proposerName || 'Space Provider'}</span>
              </div>
              {selectedDetailRule.proposerEmail && (
                <div className="flex justify-between">
                  <span className="text-moss">Contact Email:</span>
                  <span className="text-soot font-medium">{selectedDetailRule.proposerEmail}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-moss">Target Workspace:</span>
                <span className="text-soot font-semibold">
                  {selectedDetailRule.workspaceName || 'All Listed Workspaces'}
                </span>
              </div>
              {selectedDetailRule.bonusMultiplier && selectedDetailRule.bonusMultiplier > 1 && (
                <div className="flex justify-between">
                  <span className="text-moss">Bonus Multiplier:</span>
                  <span className="font-bold text-emerald-800">{selectedDetailRule.bonusMultiplier}× Boost</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-soot/6">
                <span className="text-moss">Submission Date:</span>
                <span className="text-soot">{new Date(selectedDetailRule.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Description / Business Rationale */}
            <div>
              <span className="text-xs font-bold text-soot block mb-1">Provider Business Rationale:</span>
              <p className="text-xs sm:text-sm text-moss bg-plaster-surface p-3.5 rounded-2xl border border-soot/8 leading-relaxed">
                {selectedDetailRule.description || 'No detailed business rationale was provided by the space partner.'}
              </p>
            </div>

            {/* Admin Feedback note if present */}
            {selectedDetailRule.adminFeedback && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                <span className="text-xs font-bold text-rose-900 block">Rejection Feedback / Notes:</span>
                <p className="text-xs text-rose-800 leading-relaxed">{selectedDetailRule.adminFeedback}</p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-soot/8">
              <button
                type="button"
                onClick={() => setSelectedDetailRule(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-moss hover:text-soot cursor-pointer"
              >
                Close
              </button>

              {selectedDetailRule.status === 'PENDING_APPROVAL' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const r = selectedDetailRule;
                      setSelectedDetailRule(null);
                      handleOpenRejectModal(r);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Reject Proposal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const r = selectedDetailRule;
                      setSelectedDetailRule(null);
                      handleOpenApproveModal(r);
                    }}
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Approve Proposal
                  </button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* 2. APPROVAL CONFIRMATION MODAL */}
      {approveConfirmRule && (
        <Modal
          open={Boolean(approveConfirmRule)}
          onClose={() => !isProcessing && setApproveConfirmRule(null)}
          title="Confirm Proposal Approval"
        >
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <CheckCircle2 size={22} className="text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-950">Approve & Activate Loyalty Rule</h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Are you sure you want to approve <span className="font-bold text-emerald-950">"{approveConfirmRule.ruleName}"</span>?
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-plaster-surface rounded-2xl border border-soot/8 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-moss">Rule Type:</span>
                <span className="font-bold text-soot">
                  {approveConfirmRule.ruleType === 'EARNING' ? 'Points Earning' : 'Points Redemption'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-moss">Exchange Value:</span>
                <span className="font-bold text-soot">
                  {approveConfirmRule.pointsValue} pts / SAR {approveConfirmRule.monetaryValue}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-moss">Provider:</span>
                <span className="font-semibold text-soot">{approveConfirmRule.proposerName || 'Space Provider'}</span>
              </div>
            </div>

            <p className="text-xs text-moss">
              Once approved, this loyalty points rule will immediately become active on the platform and members booking this space will receive or redeem points accordingly.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-soot/8">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setApproveConfirmRule(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-moss hover:text-soot cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmApproval}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>{isProcessing ? 'Approving...' : 'Confirm & Approve'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. REJECTION CONFIRMATION & FEEDBACK MODAL */}
      {rejectRule && (
        <Modal
          open={Boolean(rejectRule)}
          onClose={() => !isProcessing && setRejectRule(null)}
          title="Reject Loyalty Points Proposal"
        >
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
              <AlertCircle size={22} className="text-rose-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-rose-950">Provide Rejection Reason</h4>
                <p className="text-xs text-rose-800 leading-relaxed">
                  Rejecting <span className="font-bold text-rose-950">"{rejectRule.ruleName}"</span> requires explaining the reason or providing actionable feedback to the space provider.
                </p>
              </div>
            </div>

            {/* Rejection Reason Form */}
            <div>
              <label className="block text-xs font-bold text-soot uppercase tracking-wider mb-1.5">
                Rejection Feedback & Notes *
              </label>
              <textarea
                rows={4}
                required
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (rejectionError) setRejectionError('');
                }}
                placeholder="e.g. The proposed points exchange value of 500 pts = SAR 100 exceeds our platform cap. Please adjust to 500 pts = SAR 25 and resubmit..."
                className={`w-full px-3.5 py-2.5 rounded-xl bg-white border ${
                  rejectionError ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-soot/15'
                } text-xs sm:text-sm text-soot placeholder:text-moss/60 focus:outline-none focus:ring-2 focus:ring-soot/20 resize-none`}
              />
              {rejectionError && (
                <p className="text-xs font-semibold text-rose-600 mt-1 flex items-center gap-1">
                  <span>*</span> {rejectionError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-soot/8">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setRejectRule(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-moss hover:text-soot cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmRejection}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <X size={14} />
                <span>{isProcessing ? 'Rejecting...' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
