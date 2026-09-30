'use client';

import { useI18n } from '@/i18n';
import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  Trash2,
  Coins,
  ArrowRight,
  Award,
  ChevronRight,
  Info,
  Gift
} from 'lucide-react';
import { useApp } from '@/app/store';
import { LoyaltyRule, LoyaltyRuleType, ApprovalStatus } from '@/types/types';
import Modal from '@/components/ui/Modal';

export default function ProviderLoyaltyProposals() {
  const { t, translateMessage, formatDate } = useI18n();
  const { currentUser, spaces, partners, loyaltyRules, fetchLoyaltyRules, createLoyaltyProposal, deleteLoyaltyRule, showToast } = useApp();

  useEffect(() => {
    fetchLoyaltyRules().catch(() => {});
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRuleDetail, setSelectedRuleDetail] = useState<LoyaltyRule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ApprovalStatus>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | LoyaltyRuleType>('ALL');

  // Form State
  const [ruleName, setRuleName] = useState('');
  const [ruleType, setRuleType] = useState<LoyaltyRuleType>('EARNING');
  const [pointsValue, setPointsValue] = useState<number | ''>(25);
  const [monetaryValue, setMonetaryValue] = useState<number | ''>(100);
  const [description, setDescription] = useState('');
  const [workspaceId, setWorkspaceId] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) return null;

  const userPartner = partners.find((p) => p.contactEmail?.toLowerCase() === currentUser.email?.toLowerCase());
  const mySpaces = spaces.filter(
    (s) =>
      s.ownerId === currentUser.id ||
      (userPartner && s.ownerId === userPartner.id) ||
      (s.email && s.email.toLowerCase() === currentUser.email?.toLowerCase())
  );

  // Filter ONLY this specific provider's proposals
  const myProposals = loyaltyRules.filter((r) => {
    const isOwnerId = r.proposedBy === currentUser.id;
    const isOwnerEmail = !!(
      r.proposerEmail &&
      currentUser.email &&
      r.proposerEmail.toLowerCase() === currentUser.email.toLowerCase()
    );
    const isPartnerId = !!(userPartner && r.proposedBy === userPartner.id);
    return isOwnerId || isOwnerEmail || isPartnerId;
  });

  // Metrics
  const totalProposals = myProposals.length;
  const approvedProposals = myProposals.filter((r) => r.status === 'APPROVED');
  const pendingProposals = myProposals.filter((r) => r.status === 'PENDING_APPROVAL');
  const rejectedProposals = myProposals.filter((r) => r.status === 'REJECTED');

  // Filtered List
  const filteredProposals = myProposals.filter((r) => {
    const matchesQuery =
      r.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.workspaceName && r.workspaceName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || r.ruleType === typeFilter;

    return matchesQuery && matchesStatus && matchesType;
  });

  const handleOpenModal = (preset?: { name: string; type: LoyaltyRuleType; points: number; money: number; desc: string }) => {
    if (preset) {
      setRuleName(preset.name);
      setRuleType(preset.type);
      setPointsValue(preset.points);
      setMonetaryValue(preset.money);
      setDescription(preset.desc);
    } else {
      setRuleName('');
      setRuleType('EARNING');
      setPointsValue(25);
      setMonetaryValue(100);
      setDescription('');
      setWorkspaceId('ALL');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) {
      showToast('Please enter a proposal rule name', 'error');
      return;
    }
    if (!pointsValue || pointsValue <= 0) {
      showToast('Please enter a valid points value', 'error');
      return;
    }
    if (!monetaryValue || monetaryValue <= 0) {
      showToast('Please enter a valid monetary value (SAR)', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await createLoyaltyProposal({
        ruleName: ruleName.trim(),
        ruleType,
        pointsValue: Number(pointsValue),
        monetaryValue: Number(monetaryValue),
        description: description.trim(),
        workspaceId: workspaceId === 'ALL' ? undefined : workspaceId,
      });

      setIsModalOpen(false);
      setRuleName('');
      setDescription('');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (ruleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to withdraw and delete this proposal?')) {
      await deleteLoyaltyRule(ruleId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-soot/8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold tracking-wider uppercase text-moss bg-soot/5 px-2.5 py-0.5 rounded-md">
              {t('prov.loy.spacePartnerRewardsProgram')}
            </span>
            <span className="text-xs font-medium text-emerald-800 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {t('prov.loy.adminModerated')}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display tracking-tight flex items-center gap-3">
            <span>{t('prov.loy.loyaltyPointsProposals')}</span>
            <Sparkles className="text-emerald-700 w-7 h-7 shrink-0 hidden sm:inline" />
          </h1>
          <p className="text-moss text-sm mt-1 max-w-2xl">
            {t('prov.loy.proposeCustomPointsEarningRules')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-soot text-plaster hover:bg-soot/90 text-sm font-medium transition-colors cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>{t('prov.loy.proposeNewRule')}</span>
        </button>
      </div>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-soot/10 text-soot border border-soot/15 shrink-0">
              <Award size={20} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-soot tracking-tight font-sans">{totalProposals}</div>
              <div className="text-xs font-medium text-moss mt-0.5">{t('prov.loy.totalProposals')}</div>
            </div>
          </div>
        </div>

        <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-emerald-800 tracking-tight font-sans">
                {approvedProposals.length}
              </div>
              <div className="text-xs font-medium text-moss mt-0.5">{t('prov.loy.approvedActive')}</div>
            </div>
          </div>
        </div>

        <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-amber-500/15 text-amber-800 border border-amber-500/30 shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-amber-800 tracking-tight font-sans">
                {pendingProposals.length}
              </div>
              <div className="text-xs font-medium text-moss mt-0.5">{t('prov.loy.underAdminReview')}</div>
            </div>
          </div>
        </div>

        <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-rose-500/15 text-rose-800 border border-rose-500/30 shrink-0">
              <XCircle size={20} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-rose-800 tracking-tight font-sans">
                {rejectedProposals.length}
              </div>
              <div className="text-xs font-medium text-moss mt-0.5">{t('prov.loy.rejectedProposals')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-soot/5 rounded-2xl overflow-x-auto">
            {(
              [
                { key: 'ALL', label: 'All Proposals', count: totalProposals },
                { key: 'PENDING_APPROVAL', label: 'Pending Review', count: pendingProposals.length },
                { key: 'APPROVED', label: t('prov.loy.approvedActive'), count: approvedProposals.length },
                { key: 'REJECTED', label: 'Rejected', count: rejectedProposals.length },
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
                  <span>{translateMessage(tab.label)}</span>
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

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3.5 py-2 rounded-xl bg-plaster-surface border border-soot/15 text-xs text-soot font-medium focus:outline-none focus:ring-2 focus:ring-soot/20 cursor-pointer"
            >
              <option value="ALL">{t('prov.loy.allRuleTypes')}</option>
              <option value="EARNING">{t('prov.loy.earningRulesPointsAccumulation')}</option>
              <option value="REDEMPTION">{t('prov.loy.redemptionRulesDiscounts')}</option>
            </select>
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-moss" />
          <input
            type="text"
            placeholder={t('prov.loy.searchProposalsByRuleName')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 rounded-2xl bg-plaster-surface border border-soot/15 text-sm text-soot placeholder:text-moss/60 focus:outline-none focus:ring-2 focus:ring-soot/20"
          />
        </div>
      </div>

      {/* Proposals List */}
      {filteredProposals.length === 0 ? (
        <div className="bg-plaster-surface rounded-3xl border border-soot/10 p-12 text-center shadow-2xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#DDE6DF] text-soot flex items-center justify-center mx-auto shadow-2xs">
            <Sparkles size={26} className="text-moss" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-serif-display text-soot">{t('prov.loy.noLoyaltyProposalsFound')}</h3>
            <p className="text-moss text-xs sm:text-sm mt-1">
              {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                ? translateMessage('Try adjusting your search criteria or filter options.')
                : translateMessage('You have not submitted any loyalty point proposals yet. Create your first custom rule to reward your space visitors!')}
            </p>
          </div>

          <div className="pt-4 border-t border-soot/8 max-w-2xl mx-auto text-start">
            <span className="text-xs font-bold text-moss uppercase tracking-wider block mb-3 text-center">
              {t('prov.loy.orStartFromAPopular')}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  name: 'Weekend Hot-Desk Points',
                  type: 'EARNING' as LoyaltyRuleType,
                  points: 30,
                  money: 100,
                  desc: 'Loyalty points for customers booking desks during weekends.',
                },
                {
                  name: '500 Pts Meeting Discount',
                  type: 'REDEMPTION' as LoyaltyRuleType,
                  points: 500,
                  money: 25,
                  desc: 'Redeem 500 points for SAR 25 discount on any meeting room booking.',
                },
                {
                  name: 'Monthly Member Reward',
                  type: 'EARNING' as LoyaltyRuleType,
                  points: 150,
                  money: 1200,
                  desc: 'Give 150 loyalty points on monthly pass subscriptions.',
                },
              ].map((template) => (
                <button
                  key={translateMessage(template.name)}
                  type="button"
                  onClick={() => handleOpenModal(template)}
                  className="p-3.5 rounded-2xl bg-white border border-soot/10 hover:border-soot/30 hover:shadow-sm text-start transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-soot group-hover:text-emerald-800">
                    <span>{translateMessage(template.name)}</span>
                    <ArrowRight size={13} className="text-moss group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-moss mt-1 line-clamp-2">{translateMessage(template.desc)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProposals.map((rule) => {
            const isEarning = rule.ruleType === 'EARNING';
            const isPending = rule.status === 'PENDING_APPROVAL';
            const isApproved = rule.status === 'APPROVED';
            const isRejected = rule.status === 'REJECTED';

            return (
              <div
                key={rule.id}
                onClick={() => setSelectedRuleDetail(rule)}
                className="bg-plaster-surface rounded-3xl border border-soot/12 p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                        isEarning
                          ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30'
                          : 'bg-blue-500/15 text-blue-800 border border-blue-500/30'
                      }`}
                    >
                      {isEarning ? <Coins size={12} /> : <Gift size={12} />}
                      {isEarning ? t('prov.loy.earningRule') : 'Redemption Rule'}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${
                        isPending
                          ? 'bg-amber-500/15 text-amber-900 border border-amber-500/30'
                          : isApproved
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-rose-500/15 text-rose-800 border border-rose-500/30'
                      }`}
                    >
                      {isPending && <Clock size={12} className="animate-spin text-amber-700" />}
                      {isApproved && <CheckCircle2 size={12} />}
                      {isRejected && <XCircle size={12} />}
                      <span>
                        {isPending ? 'Pending Review' : isApproved ? t('prov.loy.approvedActive') : 'Rejected'}
                      </span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-serif-display font-medium text-soot group-hover:text-emerald-950 transition-colors">
                      {rule.ruleName}
                    </h3>
                    <p className="text-moss text-xs sm:text-sm line-clamp-2 mt-1.5 leading-relaxed">
                      {rule.description || translateMessage('No additional rationale provided.')}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/70 border border-soot/8 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-moss font-medium">{t('prov.loy.pointsExchange')}</span>
                      <span className="font-bold text-soot">
                        {isEarning
                          ? `+${rule.pointsValue} ${t('loyaltyAdmin.pts')} / ${rule.monetaryValue} ${t('common.sar')}`
                          : `${rule.pointsValue} ${t('loyaltyAdmin.pts')} = ${rule.monetaryValue} ${t('common.sar')}`}
                      </span>
                    </div>

                    {rule.bonusMultiplier && rule.bonusMultiplier > 1 && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-soot/6">
                        <span className="text-moss font-medium">{t('prov.loy.multiplier')}</span>
                        <span className="font-bold text-emerald-800">{rule.bonusMultiplier}× {t('prov.loy.boost')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-soot/8 flex items-center justify-between text-[11px] text-moss">
                  <div className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-moss/70" />
                    <span className="truncate max-w-[140px]">
                      {rule.workspaceName || translateMessage('All Listed Spaces')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(rule.id, e)}
                        className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title={t('prov.loy.withdrawDeleteProposal')}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <span className="text-soot font-medium group-hover:text-emerald-900 flex items-center gap-0.5">
                      Details <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Proposal Modal - Updated with size="2xl" */}
      <Modal
        open={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={t('prov.loy.proposeLoyaltyPointsRule')}
        size="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-xs text-moss">
            {t('prov.loy.createACustomLoyaltyRule')}
          </p>

          {/* Rule Type Selector */}
          <div>
            <label className="block text-xs font-bold text-soot uppercase tracking-wider mb-2">
              {t('prov.loy.ruleType2')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRuleType('EARNING')}
                className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                  ruleType === 'EARNING'
                    ? 'bg-[#E2EBE5] border-emerald-700/40 text-soot shadow-xs'
                    : 'bg-white border-soot/12 text-moss hover:bg-soot/5'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-soot">
                  <Coins size={15} className="text-amber-600" />
                  <span>{t('prov.loy.earningRule')}</span>
                </div>
                <p className="text-[11px] text-moss mt-1">
                  {t('prov.loy.awardLoyaltyPointsToUsers')}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRuleType('REDEMPTION')}
                className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                  ruleType === 'REDEMPTION'
                    ? 'bg-[#E2EBE5] border-emerald-700/40 text-soot shadow-xs'
                    : 'bg-white border-soot/12 text-moss hover:bg-soot/5'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-soot">
                  <Gift size={15} className="text-blue-600" />
                  <span>{t('prov.loy.redemptionDiscount')}</span>
                </div>
                <p className="text-[11px] text-moss mt-1">
                  {t('prov.loy.allowUsersToExchangePoints')}
                </p>
              </button>
            </div>
          </div>

          {/* Rule Name */}
          <div>
            <label className="block text-xs font-bold text-soot uppercase tracking-wider mb-1.5">
              {t('prov.loy.proposalRuleName')}
            </label>
            <input
              type="text"
              required
              placeholder={t('prov.loy.eGWeekendCoworkingPoints')}
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-soot/15 text-sm text-soot placeholder:text-moss/60 focus:outline-none focus:ring-2 focus:ring-soot/20"
            />
          </div>

          {/* Applicable Workspace */}
          <div>
            <label className="block text-xs font-bold text-soot uppercase tracking-wider mb-1.5">
              {t('prov.loy.targetWorkspace')}
            </label>
            <select
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-soot/15 text-sm text-soot focus:outline-none focus:ring-2 focus:ring-soot/20 cursor-pointer"
            >
              <option value="ALL">{t('prov.loy.allMyListedWorkspaces')}</option>
              {mySpaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>

          {/* Numeric Values Row with whitespace-nowrap and truncation protection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-soot uppercase tracking-wider mb-1.5 truncate">
                {translateMessage(ruleType === 'EARNING' ? 'Points Earned *' : 'Points Required to Redeem *')}
              </label>
              <input
                type="number"
                min="1"
                required
                value={pointsValue}
                onChange={(e) => setPointsValue(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={t('prov.loy.eG50')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-soot/15 text-sm text-soot focus:outline-none focus:ring-2 focus:ring-soot/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-soot uppercase tracking-wider mb-1.5 whitespace-nowrap">
                {ruleType === 'EARNING' ? 'Per Spend Amount (SAR) *' : 'Discount Given (SAR) *'}
              </label>
              <input
                type="number"
                min="1"
                required
                value={monetaryValue}
                onChange={(e) => setMonetaryValue(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={t('prov.loy.eG100')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-soot/15 text-sm text-soot focus:outline-none focus:ring-2 focus:ring-soot/20"
              />
            </div>
          </div>

          {/* Description & Business Rationale */}
          <div>
            <label className="block text-xs font-bold text-soot uppercase tracking-wider mb-1.5">
              {t('prov.loy.descriptionBusinessRationale')}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('prov.loy.explainHowThisRuleBoosts')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-soot/15 text-sm text-soot placeholder:text-moss/60 focus:outline-none focus:ring-2 focus:ring-soot/20 resize-none"
            />
          </div>

          {/* Live Preview Inside Modal */}
          <div className="p-4 rounded-2xl bg-[#F2EFE2] border border-soot/10 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-soot">
              <Info size={14} className="text-moss" />
              <span>{t('prov.loy.liveProposalSummaryPreview')}</span>
            </div>
            <div className="text-xs text-moss space-y-1">
              <div>
                <span className="font-semibold text-soot">{t('prov.loy.type')}</span> {translateMessage(ruleType === 'EARNING' ? 'Earning Points on Booking' : 'Points Redemption Discount')}
              </div>
              <div>
                <span className="font-semibold text-soot">{t('prov.loy.mechanism')}</span>{' '}
                {ruleType === 'EARNING'
                  ? translateMessage(`Members receive +${pointsValue || 0} points for every SAR ${monetaryValue || 0} spent`)
                  : translateMessage(`Members can redeem ${pointsValue || 0} points to receive an instant SAR ${monetaryValue || 0} discount`)}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-soot/8">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-moss hover:text-soot hover:bg-soot/5 transition-colors cursor-pointer"
            >
              {t('prov.loy.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-soot text-plaster hover:bg-soot/90 text-sm font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {translateMessage(isSubmitting ? 'Submitting Proposal...' : 'Submit to Admin')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Rule Detail View Modal - Updated with size="2xl" */}
      {selectedRuleDetail && (
        <Modal
          open={Boolean(selectedRuleDetail)}
          onClose={() => setSelectedRuleDetail(null)}
          title={t('prov.loy.proposalDetailsStatus')}
          size="2xl"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-soot/8">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-moss">
                  {t('prov.loy.ruleName')}
                </span>
                <h3 className="text-xl font-serif-display text-soot font-medium">
                  {selectedRuleDetail.ruleName}
                </h3>
              </div>
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold ${
                  selectedRuleDetail.status === 'PENDING_APPROVAL'
                    ? 'bg-amber-500/15 text-amber-900 border border-amber-500/30'
                    : selectedRuleDetail.status === 'APPROVED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-500/15 text-rose-800 border border-rose-500/30'
                }`}
              >
                {selectedRuleDetail.status === 'PENDING_APPROVAL'
                  ? 'Pending Review'
                  : selectedRuleDetail.status === 'APPROVED'
                  ? t('prov.loy.approvedActive')
                  : 'Rejected'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-2xl border border-soot/10">
                <span className="text-moss font-medium block">{t('prov.loy.ruleType')}</span>
                <span className="font-bold text-soot text-sm mt-0.5 block">
                  {selectedRuleDetail.ruleType === 'EARNING' ? translateMessage('Points Earning') : translateMessage('Points Redemption')}
                </span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-soot/10">
                <span className="text-moss font-medium block">{t('prov.loy.exchangeRate')}</span>
                <span className="font-bold text-soot text-sm mt-0.5 block">
                  {selectedRuleDetail.pointsValue} {t('loyaltyAdmin.pts')} / {selectedRuleDetail.monetaryValue} {t('common.sar')}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-soot block mb-1">{t('prov.loy.descriptionRationale')}</span>
              <p className="text-xs sm:text-sm text-moss bg-white p-3.5 rounded-2xl border border-soot/10 leading-relaxed">
                {selectedRuleDetail.description || translateMessage('No detailed description provided.')}
              </p>
            </div>

            {selectedRuleDetail.adminFeedback && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <span className="text-xs font-bold text-amber-900 block">{t('prov.loy.adminReviewNote')}</span>
                <p className="text-xs text-amber-800">{selectedRuleDetail.adminFeedback}</p>
              </div>
            )}

            <div className="text-[11px] text-moss space-y-1 pt-2 border-t border-soot/8">
              <div>{t('prov.loy.submittedBy')} {selectedRuleDetail.proposerName || translateMessage('Space Provider')}</div>
              <div>{t('prov.loy.submittedOn')} {formatDate(selectedRuleDetail.createdAt)}</div>
              {selectedRuleDetail.approverName && (
                <div>{t('prov.loy.reviewedBy')} {selectedRuleDetail.approverName}</div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedRuleDetail(null)}
                className="px-5 py-2 rounded-xl bg-soot text-plaster text-xs font-medium cursor-pointer"
              >
                {t('prov.loy.close')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
