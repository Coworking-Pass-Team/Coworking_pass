'use client';

import { useI18n } from '@/i18n';
import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Settings,
  Mail,
  Phone,
  Calendar,
  Lock,
  Edit3,
  Check,
  Trash2,
  Upload,
  AlertCircle,
  Clock,
  Key,
  Globe,
  Sliders,
  Bell,
  Cpu,
  LogOut,
  UserCheck,
  CreditCard,
  DollarSign,
  Sparkles,
  Coins,
  Gift,
  CheckCircle2,
  XCircle,
  Building2
} from 'lucide-react';
import { useApp } from '@/app/store';
import UserAvatar from '@/components/ui/UserAvatar';
import Modal from '@/components/ui/Modal';
import MembershipPlansAdmin from './MembershipPlansAdmin';
import SubscriptionsAdmin from './SubscriptionsAdmin';
import HourlyBookingsAdmin from './HourlyBookingsAdmin';
import PaymentsAdmin from './PaymentsAdmin';
import PayoutsAdmin from './PayoutsAdmin';

export default function AdminSettings() {
  const { t, translateMessage, lang } = useI18n();
  const { currentUser, updateCurrentUser, logout, showToast, navigate, nav, loyaltyRules, fetchLoyaltyRules, updateLoyaltyRuleStatus, deleteLoyaltyRule } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'plans' | 'subscriptions' | 'payments' | 'payouts' | 'loyalty' | 'settings'>('profile');
  const [adminFeedbackInput, setAdminFeedbackInput] = useState<Record<string, string>>({});

  useEffect(() => {
    if (activeTab === 'loyalty') {
      fetchLoyaltyRules().catch(() => {});
    }
  }, [activeTab]);


  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || 'System Admin');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '+966 50 000 0001');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Logout Modal State
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Platform System Settings State
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    autoApproveSpaces: true,
    emailAlerts: true,
    auditLogging: true,
    revenueSharePercent: 15,
  });

  if (!currentUser) return null;

  const handleOpenEdit = () => {
    setEditName(currentUser.name || '');
    setEditPhone(currentUser.phone || '+966 50 000 0001');
    setEditAvatar(currentUser.avatar || '');
    setIsEditModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setEditAvatar(reader.result);
        showToast('Photo selected. Click "Save Changes" to apply.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditErrors({ name: 'Full Administrator Name is required' });
      return;
    }

    setEditErrors({});
    setIsSaving(true);
    setTimeout(() => {
      updateCurrentUser({
        name: editName.trim(),
        phone: editPhone.trim(),
        avatar: editAvatar,
      });
      setIsSaving(false);
      setIsEditModalOpen(false);
      showToast('Admin profile updated successfully!', 'success');
    }, 350);
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pErrs: Record<string, string> = {};
    if (!currentPassword) pErrs.current = 'Current password is required';
    if (!newPassword) pErrs.new = 'New password is required';
    else if (newPassword.length < 6) pErrs.new = 'New password must be at least 6 characters';
    if (!confirmPassword) pErrs.confirm = 'Please confirm new password';
    else if (newPassword && newPassword !== confirmPassword) pErrs.confirm = 'New passwords do not match';

    setPasswordErrors(pErrs);
    if (Object.keys(pErrs).length > 0) return;

    setPasswordSaved(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordErrors({});
    showToast('Admin security password updated successfully!', 'success');
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal" style={{ fontFamily: 'DM Serif Display, serif' }}>
            {activeTab === 'profile' ? 'Admin Profile & Security' : activeTab === 'plans' ? 'Membership Plans Management' : 'Platform Settings'}
          </h1>
          <p className="text-moss text-xs sm:text-sm mt-1 font-normal">
            {t('admin.set.superAdminSystemAdministrationSecurity')}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="inline-flex items-center gap-2 bg-white rounded-full p-1.5 border border-soot/8 shadow-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#DDE6DF] text-soot shadow-xs border border-soot/5 font-semibold'
                : 'text-moss hover:text-soot'
            }`}
          >
            <Shield size={15} />
            <span>{t('admin.set.profileSecurity')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'plans'
                ? 'bg-[#DDE6DF] text-soot shadow-xs border border-soot/5 font-semibold'
                : 'text-moss hover:text-soot'
            }`}
          >
            <CreditCard size={15} />
            <span>{t('admin.set.membershipPlans')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subscriptions')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'subscriptions'
                ? 'bg-[#DDE6DF] text-soot shadow-xs border border-soot/5 font-semibold'
                : 'text-moss hover:text-soot'
            }`}
          >
            <Calendar size={15} />
            <span>{t('admin.set.subscriptions')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-[#DDE6DF] text-soot shadow-xs border border-soot/5 font-semibold'
                : 'text-moss hover:text-soot'
            }`}
          >
            <CreditCard size={15} />
            <span>{t('admin.set.payments')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payouts')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'payouts'
                ? 'bg-[#DDE6DF] text-soot shadow-xs border border-soot/5 font-semibold'
                : 'text-moss hover:text-soot'
            }`}
          >
            <DollarSign size={15} />
            <span>{t('admin.set.partnerPayouts')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('loyalty')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'loyalty'
                ? 'bg-[#DDE6DF] text-soot shadow-xs border border-soot/5 font-semibold'
                : 'text-moss hover:text-soot'
            }`}
          >
            <Sparkles size={15} />
            <span>{t('admin.set.loyaltyProposals')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#DDE6DF] text-soot shadow-xs border border-soot/5 font-semibold'
                : 'text-moss hover:text-soot'
            }`}
          >
            <Settings size={15} />
            <span>{t('admin.set.systemSettings')}</span>
          </button>
        </div>
      </div>

      {activeTab === 'plans' ? (
        <MembershipPlansAdmin />
      ) : activeTab === 'subscriptions' ? (
        <SubscriptionsAdmin />
      ) : activeTab === 'payments' ? (
        <PaymentsAdmin />
      ) : activeTab === 'payouts' ? (
        <PayoutsAdmin />
      ) : activeTab === 'loyalty' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-soot/8 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-moss uppercase tracking-wider bg-soot/5 px-2 py-0.5 rounded">
                  {t('admin.set.superAdminPortal')}
                </span>
                <span className="text-xs text-emerald-800 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                  {loyaltyRules.filter((r) => r.status === 'PENDING_APPROVAL').length} Pending Review
                </span>
              </div>
              <h2 className="text-2xl font-serif-display text-soot font-normal">
                {t('admin.set.providerLoyaltyRulesProposalsReview')}
              </h2>
              <p className="text-moss text-xs sm:text-sm mt-1">
                {t('admin.set.reviewApproveOrRejectPoint')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loyaltyRules.map((rule) => {
              const isPending = rule.status === 'PENDING_APPROVAL';
              const isApproved = rule.status === 'APPROVED';
              const isRejected = rule.status === 'REJECTED';
              const isEarning = rule.ruleType === 'EARNING';

              return (
                <div
                  key={rule.id}
                  className="bg-white rounded-3xl border border-soot/10 p-6 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                          isEarning
                            ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/20'
                            : 'bg-blue-500/15 text-blue-800 border border-blue-500/20'
                        }`}
                      >
                        {isEarning ? <Coins size={12} /> : <Gift size={12} />}
                        {translateMessage(isEarning ? 'Earning Rule' : 'Redemption Rule')}
                      </span>

                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          isPending
                            ? 'bg-amber-500/15 text-amber-900 border border-amber-500/30'
                            : isApproved
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-500/15 text-rose-800 border border-rose-500/30'
                        }`}
                      >
                        {translateMessage(isPending ? 'Pending Review' : isApproved ? 'Approved & Active' : 'Rejected')}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-serif-display text-soot font-medium">{rule.ruleName}</h3>
                      <p className="text-xs text-moss mt-1 line-clamp-2">{rule.description || 'No description provided.'}</p>
                    </div>

                    <div className="p-3 bg-plaster-surface rounded-2xl border border-soot/8 text-xs space-y-1">
                      <div className="flex justify-between text-soot">
                        <span className="text-moss">{t('admin.set.exchangeRate')}</span>
                        <span className="font-bold">
                          {isEarning
                            ? `+${rule.pointsValue} ${t('loyaltyAdmin.pts')} / ${rule.monetaryValue} ${t('common.sar')}`
                            : `${rule.pointsValue} ${t('loyaltyAdmin.pts')} = ${rule.monetaryValue} ${t('common.sar')}`}
                        </span>
                      </div>
                      {rule.bonusMultiplier && rule.bonusMultiplier > 1 && (
                        <div className="flex justify-between text-emerald-800 pt-1 border-t border-soot/6">
                          <span>{t('admin.set.multiplier')}</span>
                          <span className="font-bold">{rule.bonusMultiplier}× {t('prov.loy.boost')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-moss pt-1 border-t border-soot/6">
                        <span>{t('admin.set.proposedBy')}</span>
                        <span className="text-soot font-medium">{rule.proposerName || translateMessage('Space Provider')}</span>
                      </div>
                    </div>

                    {isPending && (
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[11px] text-moss font-medium block">{t('admin.set.adminFeedbackNoteOptional')}</label>
                        <input
                          type="text"
                          placeholder={t('admin.set.eGApprovedWithStandard')}
                          value={adminFeedbackInput[rule.id] || ''}
                          onChange={(e) =>
                            setAdminFeedbackInput((prev: any) => ({ ...prev, [rule.id]: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 rounded-xl bg-plaster-surface border border-soot/15 text-xs text-soot focus:outline-none focus:ring-1 focus:ring-soot/20"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-soot/8 flex items-center justify-between gap-2">
                    {isPending ? (
                      <div className="flex items-center gap-2 w-full">
                        <button
                          type="button"
                          onClick={() => updateLoyaltyRuleStatus(rule.id, 'APPROVED', adminFeedbackInput[rule.id])}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 size={13} />
                          <span>{t('admin.set.approveActivate')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateLoyaltyRuleStatus(rule.id, 'REJECTED', adminFeedbackInput[rule.id])}
                          className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <XCircle size={13} />
                          <span>{t('admin.set.reject')}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] text-moss">
                          {isApproved ? 'Status: Active on platform' : 'Status: Rejected'}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteLoyaltyRule(rule.id)}
                          className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={t('admin.set.deleteRule')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : activeTab === 'profile' ? (
        <div className="space-y-7">

          {/* Card 1: Main Admin Header Card */}
          <div className="bg-white rounded-3xl border border-soot/8 shadow-sm overflow-hidden">
            {/* Decorative Header Banner */}
            <div className="h-32 sm:h-40 w-full relative bg-gradient-to-r from-[#E5ECE9] via-[#E2EBE5] to-[#D9E5E0] border-b border-soot/6 overflow-hidden">
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: `radial-gradient(#2D3536 1px, transparent 1px)`,
                  backgroundSize: '16px 16px',
                }}
              />
            </div>

            {/* Profile Content Details */}
            <div className="px-6 sm:px-8 pb-8 pt-0 relative">
              {/* Avatar Row */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
                <div className="relative inline-block self-start">
                  <UserAvatar
                    src={currentUser.avatar}
                    name={currentUser.name}
                    size="2xl"
                    ring={true}
                  />
                </div>
              </div>

              {/* Admin Name, Role Badges */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2
                    className="text-2xl sm:text-3xl font-normal text-soot tracking-tight"
                    style={{ fontFamily: 'DM Serif Display, serif' }}
                  >
                    {currentUser.name}
                  </h2>

                  {/* Super Admin Badge matching Org Badge styling */}
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#DDE6DF] text-soot border border-soot/6 shadow-2xs">
                    <Shield size={13} className="text-soot" />
                    <span>{t('admin.set.superAdminPortal')}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full text-xs font-medium bg-[#DDE6DF] text-soot border border-soot/6 shadow-2xs">
                    <UserCheck size={12} className="text-soot" />
                    <span>{t('admin.set.fullPlatformPrivileges')}</span>
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-moss font-normal flex flex-wrap items-center gap-3">
                  <span>{currentUser.email}</span>
                  <span>•</span>
                  <span>{t('admin.set.systemAdministratorIdAdm001')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Administrator Information */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-soot/8 gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  {t('admin.set.administratorInformation')}
                </h3>
                <p className="text-moss text-xs mt-0.5 font-normal">{t('admin.set.systemCredentialsAndPlatformContact')}</p>
              </div>
              <button
                type="button"
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] text-xs sm:text-sm font-medium transition-all shadow-xs border border-soot/8 cursor-pointer active:scale-98"
              >
                <Edit3 size={15} />
                <span>{t('admin.set.editProfile')}</span>
              </button>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Shield size={13} className="text-moss/80" />
                  {t('admin.set.fullAdministratorName')}
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.name}
                </div>
              </div>

              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Mail size={13} className="text-moss/80" />
                  {t('admin.set.adminEmailAddress')}
                </div>
                <div className="text-sm sm:text-base font-normal text-soot truncate" title={currentUser.email}>
                  {currentUser.email}
                </div>
              </div>

              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Phone size={13} className="text-moss/80" />
                  {t('admin.set.directPhoneContact')}
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.phone || '+966 50 000 0001'}
                </div>
              </div>

              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Key size={13} className="text-moss/80" />
                  {t('admin.set.accessLevel')}
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {translateMessage('SUPER_ADMIN (Root Privileges)')}
                </div>
              </div>

              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 sm:col-span-2 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Calendar size={13} className="text-moss/80" />
                  {t('admin.set.systemProvisionDate')}
                </div>
                <div className="text-sm font-normal text-soot">
                  {currentUser.joinDate || translateMessage('January 15, 2023')}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Platform Security & Password */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-soot/8">
              <div>
                <h3 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  {t('admin.set.systemSecurityPassword')}
                </h3>
                <p className="text-moss text-xs mt-0.5 font-normal">{t('admin.set.updateSuperAdministratorAuthenticationCredentials')}</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
                  {t('admin.set.currentPassword')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => {
                    setCurrentPassword(e.target.value);
                    if (passwordErrors.current) setPasswordErrors(p => ({ ...p, current: '' }));
                  }}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-2xl border ${
                    passwordErrors.current ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-soot/12 bg-white'
                  } text-sm text-soot outline-none focus:border-eucalyptus font-normal`}
                />
                {passwordErrors.current && (
                  <p className="text-rose-600 text-xs mt-1 font-medium flex items-center gap-1">
                    <span>*</span> {translateMessage(passwordErrors.current)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
                  {t('admin.set.newAdminPassword')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => {
                    setNewPassword(e.target.value);
                    if (passwordErrors.new) setPasswordErrors(p => ({ ...p, new: '' }));
                  }}
                  placeholder={t('admin.set.atLeast6Characters')}
                  className={`w-full px-4 py-3 rounded-2xl border ${
                    passwordErrors.new ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-soot/12 bg-white'
                  } text-sm text-soot outline-none focus:border-eucalyptus font-normal`}
                />
                {passwordErrors.new && (
                  <p className="text-rose-600 text-xs mt-1 font-medium flex items-center gap-1">
                    <span>*</span> {translateMessage(passwordErrors.new)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
                  {t('admin.set.confirmNewPassword')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    if (passwordErrors.confirm) setPasswordErrors(p => ({ ...p, confirm: '' }));
                  }}
                  placeholder={t('admin.set.reEnterNewPassword')}
                  className={`w-full px-4 py-3 rounded-2xl border ${
                    passwordErrors.confirm ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-soot/12 bg-white'
                  } text-sm text-soot outline-none focus:border-eucalyptus font-normal`}
                />
                {passwordErrors.confirm && (
                  <p className="text-rose-600 text-xs mt-1 font-medium flex items-center gap-1">
                    <span>*</span> {translateMessage(passwordErrors.confirm)}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {passwordSaved ? '✓ Admin Password Updated' : 'Update Admin Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* System Settings Tab */
        <div className="space-y-6">
          {/* Platform Operating Controls */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-normal text-soot mb-1" style={{ fontFamily: 'DM Serif Display, serif' }}>
              {t('admin.set.platformSystemSettings')}
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">{t('admin.set.globalSystemSwitchesAndAdministrative')}</p>

            <div className="space-y-4 divide-y divide-soot/6">
              <div className="flex items-center justify-between pt-4 first:pt-0">
                <div>
                  <div className="text-sm font-medium text-soot">{t('admin.set.autoApprovePartnerWorkspaces')}</div>
                  <div className="text-xs text-moss mt-0.5 font-normal">{t('admin.set.automaticallyMakeNewProviderSpaces')}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSystemSettings(s => ({ ...s, autoApproveSpaces: !s.autoApproveSpaces }))}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                    systemSettings.autoApproveSpaces ? 'bg-soot' : 'bg-soot/15'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      systemSettings.autoApproveSpaces ? 'translate-x-7 rtl:-translate-x-7' : 'translate-x-1 rtl:-translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <div className="text-sm font-medium text-soot">{t('admin.set.systemAuditLogging')}</div>
                  <div className="text-xs text-moss mt-0.5 font-normal">{t('admin.set.logAllSuperAdminRole')}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSystemSettings(s => ({ ...s, auditLogging: !s.auditLogging }))}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                    systemSettings.auditLogging ? 'bg-soot' : 'bg-soot/15'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      systemSettings.auditLogging ? 'translate-x-7 rtl:-translate-x-7' : 'translate-x-1 rtl:-translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <div className="text-sm font-medium text-soot">{t('admin.set.systemMaintenanceMode')}</div>
                  <div className="text-xs text-moss mt-0.5 font-normal">{t('admin.set.temporarilyPauseNewBookingRequests')}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSystemSettings(s => ({ ...s, maintenanceMode: !s.maintenanceMode }))}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                    systemSettings.maintenanceMode ? 'bg-red-600' : 'bg-soot/15'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      systemSettings.maintenanceMode ? 'translate-x-7 rtl:-translate-x-7' : 'translate-x-1 rtl:-translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-3xl border border-red-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-normal text-red-600 mb-1" style={{ fontFamily: 'DM Serif Display, serif' }}>
              {t('admin.set.superAdminSession')}
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">
              {t('admin.set.logOutOfYourSuper')}
            </p>
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="btn-danger"
            >
              <LogOut size={15} />
              <span>{t('admin.set.logOutAdminSession')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('admin.set.editAdministratorInfo')}
        subtitle="Update display name, photo, and direct phone contact."
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="btn-secondary flex-1"
            >
              {t('admin.set.cancel')}
            </button>
            <button
              type="button"
              onClick={(e) => handleSaveProfile(e as any)}
              disabled={isSaving}
              className="btn-primary flex-1 disabled:opacity-60"
            >
              {isSaving ? (
                <span>{t('admin.set.saving')}</span>
              ) : (
                <>
                  <Check size={16} className="shrink-0 text-eucalyptus" />
                  <span>{t('admin.set.saveChanges')}</span>
                </>
              )}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 py-2">
          {/* Avatar Photo Section */}
          <div className="flex items-center gap-4 pb-4 border-b border-soot/10">
            <UserAvatar
              src={editAvatar}
              name={editName || 'Admin'}
              size="lg"
            />
            <div className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-moss">{t('admin.set.adminAvatar')}</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  <Upload size={13} />
                  <span>{t('admin.set.uploadPhoto')}</span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
              {t('admin.set.fullAdministratorName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editName}
              onChange={e => {
                setEditName(e.target.value);
                if (editErrors.name) setEditErrors(p => ({ ...p, name: '' }));
              }}
              className={`w-full px-4 py-3 rounded-2xl border ${
                editErrors.name ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-soot/12 bg-white'
              } text-sm text-soot outline-none focus:border-eucalyptus font-normal`}
            />
            {editErrors.name && (
              <p className="text-rose-600 text-xs mt-1 font-medium flex items-center gap-1">
                <span>*</span> {translateMessage(editErrors.name)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
              {t('admin.set.directPhoneContact')}
            </label>
            <input
              type="tel"
              value={editPhone}
              onChange={e => setEditPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
            />
          </div>
        </form>
      </Modal>

      {/* Logout Modal */}
      <Modal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title={t('admin.set.confirmLogout')}
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setShowLogoutModal(false)} className="btn-secondary flex-1">{t('admin.set.cancel')}</button>
            <button type="button" onClick={() => { setShowLogoutModal(false); logout(); }} className="btn-danger flex-1">{t('admin.set.logOut')}</button>
          </>
        }
      >
        <p className="text-sm text-soot py-2">{t('admin.set.areYouSureYouWant')}</p>
      </Modal>
    </div>
  );
}
