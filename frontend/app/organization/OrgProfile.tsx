'use client';

import { useI18n } from '@/i18n';
import React, { useState, useRef } from 'react';
import {
  Building2,
  Settings,
  Users,
  Globe,
  Phone,
  Mail,
  Plus,
  Trash2,
  Upload,
  Check,
  Shield,
  Calendar,
  Briefcase,
  FileText,
  MapPin,
  Lock,
  Edit3,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Clock,
  Wallet,
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '@/app/store';
import { Employee, isValidSaudiCrNumber } from '@/types/types';
import Modal from '@/components/ui/Modal';
import UserAvatar from '@/components/ui/UserAvatar';

export default function OrgProfile() {
  const { t, translateMessage } = useI18n();
  const { currentUser, navigate, nav, updateCurrentUser, showToast, bookings } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>(
    nav.screen === 'org-settings' ? 'settings' : 'profile'
  );

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Form Fields (Exact existing Organization fields preserved)
  const [editOrgName, setEditOrgName] = useState(currentUser?.orgName || '');
  const [editOwnerName, setEditOwnerName] = useState(currentUser?.name || '');
  const [editIndustry, setEditIndustry] = useState(currentUser?.industry || 'Technology & Digital Solutions');
  const [editOrgSize, setEditOrgSize] = useState(String(currentUser?.orgSize || '15'));
  const [editWebsite, setEditWebsite] = useState(currentUser?.website || 'https://sauditech.sa');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '+966 56 456 7890');
  const [editCrNumber, setEditCrNumber] = useState(currentUser?.crNumber || '1010874921');
  const [editCity, setEditCity] = useState(currentUser?.city || 'Riyadh, Saudi Arabia');
  const [editOrgDescription, setEditOrgDescription] = useState(
    currentUser?.orgDescription ||
      'Leading enterprise technology and consulting firm specializing in distributed workspace solutions across Saudi Arabia.'
  );
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Employees State
  const [employees, setEmployees] = useState<Employee[]>(currentUser?.employees || [
    { id: 'emp-1', name: 'Sara Al-Ghamdi', email: 'sara@sauditech.sa', department: 'Product Design' },
    { id: 'emp-2', name: 'Fahad Al-Dosari', email: 'fahad@sauditech.sa', department: 'Engineering' },
    { id: 'emp-3', name: 'Noura Al-Mutairi', email: 'noura@sauditech.sa', department: 'Operations' },
  ]);
  const [addEmpModal, setAddEmpModal] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: '', email: '', department: '' });
  const [empErrors, setEmpErrors] = useState<Record<string, string>>({});

  // Password Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Notifications & Privacy Settings
  const [notifications, setNotifications] = useState({
    teamBookings: true,
    monthlyInvoices: true,
    spaceAlerts: true,
    passUsage: false,
  });
  const [privacy, setPrivacy] = useState({ allowTeamSelfBooking: true, centralBilling: true });

  if (!currentUser) return null;

  const orgBookings = bookings.filter(b => b.userId === currentUser.id);

  const handleOpenEdit = () => {
    setEditOrgName(currentUser.orgName || '');
    setEditOwnerName(currentUser.name || '');
    setEditIndustry(currentUser.industry || 'Technology & Digital Solutions');
    setEditOrgSize(String(currentUser.orgSize || '15'));
    setEditWebsite(currentUser.website || 'https://sauditech.sa');
    setEditPhone(currentUser.phone || '+966 56 456 7890');
    setEditCrNumber(currentUser.crNumber || '1010874921');
    setEditCity(currentUser.city || 'Riyadh, Saudi Arabia');
    setEditOrgDescription(
      currentUser.orgDescription ||
        'Leading enterprise technology and consulting firm specializing in distributed workspace solutions across Saudi Arabia.'
    );
    setEditAvatar(currentUser.avatar || '');
    setErrors({});
    setIsEditModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Logo file size must be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setEditAvatar(reader.result);
        showToast('Logo selected. Click "Save Changes" to apply.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setEditAvatar('');
    showToast('Company logo reset to default.', 'info');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!editOrgName.trim()) newErrors.orgName = 'Organization name is required';
    if (!editOwnerName.trim()) newErrors.ownerName = 'Owner / Representative name is required';
    if (editCrNumber.trim() && !isValidSaudiCrNumber(editCrNumber)) {
      newErrors.crNumber = 'CR Number must be 10 digits starting with a valid region code (e.g. 1010xxxxxx)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setTimeout(() => {
      updateCurrentUser({
        orgName: editOrgName.trim(),
        name: editOwnerName.trim() || currentUser.name,
        industry: editIndustry.trim(),
        orgSize: parseInt(editOrgSize) || 0,
        website: editWebsite.trim(),
        phone: editPhone.trim(),
        crNumber: editCrNumber.trim(),
        city: editCity.trim(),
        orgDescription: editOrgDescription.trim(),
        avatar: editAvatar,
      });
      setIsSaving(false);
      setIsEditModalOpen(false);
      showToast('Organization profile updated successfully!', 'success');
    }, 350);
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const eErrs: Record<string, string> = {};
    if (!newEmp.name.trim()) eErrs.name = 'Employee name is required';
    if (!newEmp.email.trim()) eErrs.email = 'Corporate email is required';

    setEmpErrors(eErrs);
    if (Object.keys(eErrs).length > 0) return;

    const emp: Employee = {
      id: `emp-${Date.now()}`,
      name: newEmp.name.trim(),
      email: newEmp.email.trim(),
      department: newEmp.department.trim() || 'General',
    };
    const updated = [...employees, emp];
    setEmployees(updated);
    updateCurrentUser({ employees: updated });
    setNewEmp({ name: '', email: '', department: '' });
    setEmpErrors({});
    setAddEmpModal(false);
    showToast(`${emp.name} added to team roster!`, 'success');
  };

  const handleRemoveEmployee = (empId: string) => {
    const updated = employees.filter(e => e.id !== empId);
    setEmployees(updated);
    updateCurrentUser({ employees: updated });
    showToast('Team member removed', 'info');
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
    showToast('Organization security password updated!', 'success');
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal" style={{ fontFamily: 'DM Serif Display, serif' }}>
            {translateMessage(activeTab === 'profile' ? 'Organization Profile' : 'Organization Settings')}
          </h1>
          <p className="text-moss text-xs sm:text-sm mt-1 font-normal">
            {t('org.op.manageYourCompanyIdentityCorporate')}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="inline-flex items-center gap-2 bg-white rounded-full p-1.5 border border-soot/8 shadow-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              navigate('org-profile');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-[#DDE6DF] text-soot shadow-xs border border-soot/5'
                : 'text-moss hover:text-soot'
            }`}
          >
            <Building2 size={15} />
            <span>{t('org.op.companyProfile')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('settings');
              navigate('org-settings');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-[#DDE6DF] text-soot shadow-xs border border-soot/5'
                : 'text-moss hover:text-soot'
            }`}
          >
            <Settings size={15} />
            <span>{t('org.op.settings')}</span>
          </button>
        </div>
      </div>

      {activeTab === 'profile' ? (
        <div className="space-y-7">
          {/* Card 1: Main Organization Header Card */}
          <div className="bg-white rounded-3xl border border-soot/8 shadow-sm overflow-hidden">
            {/* Top Patterned Decorative Banner */}
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
              {/* Header Row: Avatar / Logo & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
                <div className="relative inline-block self-start">
                  <UserAvatar
                    src={currentUser.avatar}
                    name={currentUser.orgName || translateMessage('Organization')}
                    size="2xl"
                    ring={true}
                  />
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleOpenEdit}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-soot/15 text-soot text-xs sm:text-sm font-medium hover:bg-plaster transition-all cursor-pointer bg-white shadow-2xs"
                  >
                    <Edit3 size={14} />
                    <span>{t('org.op.editProfile')}</span>
                  </button>
                </div>
              </div>

              {/* Organization Name, Role Badge, Location */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2
                    className="text-2xl sm:text-3xl font-normal text-soot tracking-tight"
                    style={{ fontFamily: 'DM Serif Display, serif' }}
                  >
                    {currentUser.orgName || translateMessage('Organization')}
                  </h2>

                  {/* Account Role Badge */}
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-medium bg-[#DDE6DF] text-soot border border-soot/6">
                    {t('org.op.organizationAccount')}
                  </span>

                  {/* Pass Membership Badge */}
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-white text-moss border border-soot/10">
                    <Check size={12} className="text-moss" />
                    <span>{currentUser.membershipTier || translateMessage('Enterprise Pass Holder')}</span>
                  </span>

                  {/* Team Members Count Badge */}
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-white text-moss border border-soot/10">
                    <Users size={12} />
                    <span>{translateMessage(`${employees.length} Team Members`)}</span>
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-moss font-normal flex flex-wrap items-center gap-3">
                  <span>{translateMessage(currentUser.industry || 'Technology & Digital Solutions')}</span>
                  <span>•</span>
                  <span>{translateMessage(currentUser.city || 'Riyadh, Saudi Arabia')}</span>
                  {currentUser.website && (
                    <>
                      <span>•</span>
                      <a
                        href={currentUser.website.startsWith('http') ? currentUser.website : `https://${currentUser.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-soot hover:underline inline-flex items-center gap-1"
                      >
                        <Globe size={13} />
                        <span>{currentUser.website.replace(/^https?:\/\//, '')}</span>
                      </a>
                    </>
                  )}
                  <span>•</span>
                  <span>{orgBookings.length} Total Bookings</span>
                </div>

                {currentUser.orgDescription && (
                  <p className="text-xs sm:text-sm text-soot/80 font-normal pt-2 max-w-2xl leading-relaxed">
                    {currentUser.orgDescription}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Organization Information Section Card */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-soot/8 gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  {t('org.op.organizationInformation')}
                </h3>
                <p className="text-moss text-xs mt-0.5 font-normal">{t('org.op.officialCorporateEntityCredentialsAnd')}</p>
              </div>
              <button
                type="button"
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] text-xs sm:text-sm font-medium transition-all shadow-xs border border-soot/8 cursor-pointer active:scale-98"
              >
                <Edit3 size={15} />
                <span>{t('org.op.editProfile')}</span>
              </button>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Organization Name */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Building2 size={13} className="text-moss/80" />
                  {t('org.op.organizationCompanyName')}
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.orgName || translateMessage('Not Set')}
                </div>
              </div>

              {/* Account Owner / Representative */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Shield size={13} className="text-moss/80" />
                  {t('org.op.companyOwnerRepresentative')}
                </div>
                <div className="text-sm sm:text-base font-normal text-soot flex items-center justify-between">
                  <span>{currentUser.name}</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#DDE6DF] text-soot">
                    {t('org.op.hrAdmin')}
                  </span>
                </div>
              </div>

              {/* Industry & Sector */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Briefcase size={13} className="text-moss/80" />
                  {t('org.op.industrySector')}
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {translateMessage(currentUser.industry || 'Technology & Digital Solutions')}
                </div>
              </div>

              {/* Registered Email */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Mail size={13} className="text-moss/80" />
                  {t('org.op.corporateBillingEmail')}
                </div>
                <div className="text-sm sm:text-base font-normal text-soot truncate" title={currentUser.email}>
                  {currentUser.email}
                </div>
              </div>

              {/* Contact Phone Number */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Phone size={13} className="text-moss/80" />
                  {t('org.op.contactPhoneNumber')}
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.phone || '+966 56 456 7890'}
                </div>
              </div>

              {/* CR Number */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <FileText size={13} className="text-moss/80" />
                  {t('org.op.commercialRegistrationCr')}
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.crNumber || '1010874921'}
                </div>
              </div>

              {/* Organization Size */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Users size={13} className="text-moss/80" />
                  {t('org.op.totalCompanySize')}
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {translateMessage(`${currentUser.orgSize || employees.length || 15} Employees`)}
                </div>
              </div>

              {/* Headquarters Location */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <MapPin size={13} className="text-moss/80" />
                  {t('org.op.headquartersCity')}
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {translateMessage(currentUser.city || 'Riyadh, Saudi Arabia')}
                </div>
              </div>

              {/* Official Website */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Globe size={13} className="text-moss/80" />
                  {t('org.op.officialWebsiteUrl')}
                </div>
                <div className="text-sm sm:text-base font-normal text-soot truncate">
                  {currentUser.website || 'https://sauditech.sa'}
                </div>
              </div>

              {/* Company Overview */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 sm:col-span-2 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <FileText size={13} className="text-moss/80" />
                  {t('org.op.companyDescriptionOverview')}
                </div>
                <div className="text-sm font-normal text-soot leading-relaxed">
                  {currentUser.orgDescription ||
                    'Leading enterprise technology and consulting firm specializing in distributed workspace solutions across Saudi Arabia.'}
                </div>
              </div>

              {/* Account Member Since */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 sm:col-span-2 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Calendar size={13} className="text-moss/80" />
                  {t('org.op.corporateAccountMemberSince')}
                </div>
                <div className="text-sm font-normal text-soot">
                  {currentUser.joinDate || 'November 2023'}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Team Roster Overview */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-soot/8 gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  {translateMessage(`Team Members Roster (${employees.length})`)}
                </h3>
                <p className="text-moss text-xs mt-0.5 font-normal">{t('org.op.colleaguesAndTeamMembersAuthorized')}</p>
              </div>
              <button
                type="button"
                onClick={() => setAddEmpModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] text-xs sm:text-sm font-medium transition-all shadow-xs border border-soot/8 cursor-pointer active:scale-98"
              >
                <Plus size={15} />
                <span>{t('org.op.addTeamMember')}</span>
              </button>
            </div>

            {employees.length === 0 ? (
              <div className="text-center py-10 text-moss text-sm">
                {t('org.op.noTeamMembersAddedYet')}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {employees.map(emp => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-[#F9F8F5] border border-soot/6 hover:border-soot/12 transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-soot/8 flex items-center justify-center font-bold text-xs text-soot shadow-2xs shrink-0">
                        {emp.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-soot truncate">{emp.name}</div>
                        <div className="text-xs text-moss truncate">{translateMessage(emp.department)} · {emp.email}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmployee(emp.id)}
                      className="p-2 text-moss/60 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0 ms-2"
                      title={t('org.op.removeMember')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Organization Settings Tab */
        <div className="space-y-6">
          {/* Notification Preferences */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-normal text-soot mb-1" style={{ fontFamily: 'DM Serif Display, serif' }}>
              {t('org.op.corporateNotificationPreferences')}
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">{t('org.op.configureAlertsForTeamReservations')}</p>

            <div className="space-y-4 divide-y divide-soot/6">
              {[
                { key: 'teamBookings', label: 'Team booking notifications', desc: 'Get notified when an employee reserves desks or meeting rooms' },
                { key: 'monthlyInvoices', label: 'Monthly billing & VAT invoices', desc: 'Consolidated corporate invoice delivered at the end of each billing cycle' },
                { key: 'spaceAlerts', label: 'Corporate workspace announcements', desc: 'Alerts regarding new corporate pass venues and enterprise amenities' },
                { key: 'passUsage', label: 'Individual employee check-in alerts', desc: 'Real-time notifications for every desk badge scan' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between pt-4 first:pt-0">
                  <div className="pe-4">
                    <div className="text-sm font-medium text-soot">{translateMessage(item.label)}</div>
                    <div className="text-xs text-moss mt-0.5 font-normal">{translateMessage(item.desc)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setNotifications(prev => ({
                        ...prev,
                        [item.key]: !prev[item.key as keyof typeof notifications],
                      }))
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                      notifications[item.key as keyof typeof notifications] ? 'bg-soot' : 'bg-soot/15'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        notifications[item.key as keyof typeof notifications] ? 'translate-x-7 rtl:-translate-x-7' : 'translate-x-1 rtl:-translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Password */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-normal text-soot mb-1" style={{ fontFamily: 'DM Serif Display, serif' }}>
              {t('org.op.corporateSecurityPassword')}
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">{t('org.op.updateTheAdministrativePasswordFor')}</p>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-medium text-soot mb-1.5">
                  {t('org.op.currentAdministratorPassword')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => {
                    setCurrentPassword(e.target.value);
                    if (passwordErrors.current) setPasswordErrors(p => ({ ...p, current: '' }));
                  }}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2.5 rounded-2xl border ${
                    passwordErrors.current ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-soot/12 bg-white'
                  } text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal`}
                />
                {passwordErrors.current && (
                  <p className="text-rose-600 text-xs mt-1 font-medium flex items-center gap-1">
                    <span>*</span> {translateMessage(passwordErrors.current)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-soot mb-1.5">
                  {t('org.op.newAdministratorPassword')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => {
                    setNewPassword(e.target.value);
                    if (passwordErrors.new) setPasswordErrors(p => ({ ...p, new: '' }));
                  }}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2.5 rounded-2xl border ${
                    passwordErrors.new ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-soot/12 bg-white'
                  } text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal`}
                />
                {passwordErrors.new && (
                  <p className="text-rose-600 text-xs mt-1 font-medium flex items-center gap-1">
                    <span>*</span> {translateMessage(passwordErrors.new)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-soot mb-1.5">
                  {t('org.op.confirmNewPassword')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    if (passwordErrors.confirm) setPasswordErrors(p => ({ ...p, confirm: '' }));
                  }}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2.5 rounded-2xl border ${
                    passwordErrors.confirm ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-soot/12 bg-white'
                  } text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal`}
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
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] text-xs sm:text-sm font-medium transition-all shadow-xs border border-soot/8 cursor-pointer active:scale-98"
                >
                  <Lock size={14} />
                  <span>{t('org.op.updatePassword')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Corporate Workspace Access & Billing Policies */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-normal text-soot mb-1" style={{ fontFamily: 'DM Serif Display, serif' }}>
              {t('org.op.corporateWorkspacePolicies')}
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">{t('org.op.managePermissionsForTeamReservations')}</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium text-soot">{t('org.op.teamSelfBookingPermission')}</div>
                  <div className="text-xs text-moss font-normal">{t('org.op.allowRosteredTeamMembersTo')}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPrivacy(p => ({ ...p, allowTeamSelfBooking: !p.allowTeamSelfBooking }))}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                    privacy.allowTeamSelfBooking ? 'bg-soot' : 'bg-soot/15'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      privacy.allowTeamSelfBooking ? 'translate-x-7 rtl:-translate-x-7' : 'translate-x-1 rtl:-translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-soot/6 pt-4">
                <div>
                  <div className="text-sm font-medium text-soot">{t('org.op.centralizedCorporateBilling')}</div>
                  <div className="text-xs text-moss font-normal">{t('org.op.automaticallyChargeAllTeamBookings')}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPrivacy(p => ({ ...p, centralBilling: !p.centralBilling }))}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                    privacy.centralBilling ? 'bg-soot' : 'bg-soot/15'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      privacy.centralBilling ? 'translate-x-7 rtl:-translate-x-7' : 'translate-x-1 rtl:-translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-3xl border border-red-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-normal text-red-600 mb-1" style={{ fontFamily: 'DM Serif Display, serif' }}>
              {t('org.op.dangerZone')}
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">
              {t('org.op.deletingYourCorporateOrganizationAccount')}
            </p>
            <button
              type="button"
              onClick={() => showToast('To close your organization account, please contact corporate account management.', 'error')}
              className="btn-danger"
            >
              <AlertCircle size={15} />
              <span>{t('org.op.deleteOrganizationAccount')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Organization Profile Modal */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('org.op.editOrganizationProfile')}
        size="lg"
      >
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 rounded-2xl bg-[#F9F8F5] border border-soot/8">
            <div className="relative shrink-0">
              <UserAvatar
                src={editAvatar}
                name={editOrgName || 'Organization'}
                size="xl"
                ring={true}
              />
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-start space-y-2.5">
              <div>
                <div className="text-sm font-medium text-soot">{t('org.op.companyLogo')}</div>
                <p className="text-xs text-moss font-normal mt-0.5">
                  {t('org.op.uploadYourCorporateBrandLogo')}
                </p>
              </div>

              {/* Side-by-Side Action Buttons */}
              <div className="flex flex-row items-center justify-center sm:justify-start gap-3 pt-1 flex-nowrap">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 px-5 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] text-xs sm:text-sm font-medium transition-all shadow-xs border border-soot/8 cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                >
                  <Upload size={14} className="shrink-0" />
                  <span>{t('org.op.uploadLogo')}</span>
                </button>

                {editAvatar && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="h-10 px-4 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-xs sm:text-sm font-medium transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Trash2 size={14} className="shrink-0" />
                    <span>{t('org.op.remove')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Organization Name */}
            <div>
              <label className="block text-xs font-medium text-soot mb-1.5">
                {t('org.op.organizationCompanyName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editOrgName}
                onChange={e => setEditOrgName(e.target.value)}
                placeholder={t('org.op.eGSaudiTechSolutions')}
                className={`w-full px-4 py-3 rounded-2xl border ${
                  errors.orgName ? 'border-red-400 bg-red-50/20' : 'border-soot/12 bg-white'
                } text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal`}
              />
              {errors.orgName && <p className="text-red-500 text-xs mt-1 font-normal">{translateMessage(errors.orgName)}</p>}
            </div>

            {/* Account Owner / Representative Name */}
            <div>
              <label className="block text-xs font-medium text-soot mb-1.5">
                Owner / Representative Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editOwnerName}
                onChange={e => setEditOwnerName(e.target.value)}
                placeholder={t('org.op.eGMohammadAlZahrani')}
                className={`w-full px-4 py-3 rounded-2xl border ${
                  errors.ownerName ? 'border-red-400 bg-red-50/20' : 'border-soot/12 bg-white'
                } text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal`}
              />
              {errors.ownerName && <p className="text-red-500 text-xs mt-1 font-normal">{translateMessage(errors.ownerName)}</p>}
            </div>

            {/* Industry */}
            <div>
              <label className="block text-xs font-medium text-soot mb-1.5">
                {t('org.op.industrySector')}
              </label>
              <input
                type="text"
                value={editIndustry}
                onChange={e => setEditIndustry(e.target.value)}
                placeholder={t('org.op.eGTechnologyDigitalSolutions')}
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal"
              />
            </div>

            {/* Registered Email (Disabled) */}
            <div>
              <label className="block text-xs font-medium text-soot mb-1.5">
                {t('org.op.corporateBillingEmail')}
              </label>
              <input
                type="email"
                value={currentUser.email}
                disabled
                className="w-full px-4 py-3 rounded-2xl border border-soot/8 bg-soot/5 text-moss text-sm cursor-not-allowed shadow-2xs font-normal"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-medium text-soot mb-1.5">
                {t('org.op.contactPhoneNumber')}
              </label>
              <input
                type="text"
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                placeholder="+966 56 456 7890"
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal"
              />
            </div>

            {/* CR Number */}
            <div>
              <label className="block text-xs font-medium text-soot mb-1.5">
                {t('org.op.commercialRegistrationCr')}
              </label>
              <input
                type="text"
                value={editCrNumber}
                onChange={e => {
                  setEditCrNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                  if (errors.crNumber) setErrors(prev => { const n = { ...prev }; delete n.crNumber; return n; });
                }}
                maxLength={10}
                placeholder="1010874921"
                className={`w-full px-4 py-3 rounded-2xl border ${errors.crNumber ? 'border-red-500' : 'border-soot/12'} bg-white text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal`}
              />
              {errors.crNumber && <p className="text-red-500 text-xs mt-1 font-medium">{translateMessage(errors.crNumber)}</p>}
            </div>

            {/* Organization Size */}
            <div>
              <label className="block text-xs font-medium text-soot mb-1.5">
                {t('org.op.teamSizeEmployees')}
              </label>
              <input
                type="number"
                min="1"
                value={editOrgSize}
                onChange={e => setEditOrgSize(e.target.value)}
                placeholder="15"
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal"
              />
            </div>

            {/* HQ City */}
            <div>
              <label className="block text-xs font-medium text-soot mb-1.5">
                {t('org.op.headquartersCity')}
              </label>
              <input
                type="text"
                value={editCity}
                onChange={e => setEditCity(e.target.value)}
                placeholder="Riyadh, Saudi Arabia"
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal"
              />
            </div>

            {/* Official Website */}
            <div>
              <label className="block text-xs font-medium text-soot mb-1.5">
                {t('org.op.officialWebsite')}
              </label>
              <input
                type="text"
                value={editWebsite}
                onChange={e => setEditWebsite(e.target.value)}
                placeholder="https://sauditech.sa"
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal"
              />
            </div>

            {/* Company Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-soot mb-1.5">
                {t('org.op.companyDescriptionOverview')}
              </label>
              <textarea
                value={editOrgDescription}
                onChange={e => setEditOrgDescription(e.target.value)}
                rows={3}
                placeholder={t('org.op.brieflyDescribeYourCompanyS')}
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs resize-none font-normal"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-soot/8">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-6 py-3 rounded-full border border-soot/15 text-soot text-xs sm:text-sm font-medium hover:bg-soot/5 transition-all bg-white cursor-pointer"
            >
              {t('org.op.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-7 py-3 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] text-xs sm:text-sm font-medium transition-all shadow-xs border border-soot/8 cursor-pointer disabled:opacity-50 active:scale-98"
            >
              {isSaving ? t('org.op.saving') : t('org.op.saveChanges')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Employee Modal */}
      <Modal
        open={addEmpModal}
        onClose={() => setAddEmpModal(false)}
        title={t('org.op.addTeamMember')}
        size="md"
      >
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-soot mb-1.5">
              {t('org.op.fullName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newEmp.name}
              onChange={e => {
                setNewEmp(p => ({ ...p, name: e.target.value }));
                if (empErrors.name) setEmpErrors(p => ({ ...p, name: '' }));
              }}
              placeholder={t('org.op.eGSaraAlGhamdi')}
              className={`w-full px-4 py-2.5 rounded-2xl border ${
                empErrors.name ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-soot/12 bg-white'
              } text-soot text-sm outline-none focus:border-soot`}
            />
            {empErrors.name && (
              <p className="text-rose-600 text-xs mt-1 font-medium flex items-center gap-1">
                <span>*</span> {translateMessage(empErrors.name)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-soot mb-1.5">
              {t('org.op.corporateEmail')} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={newEmp.email}
              onChange={e => {
                setNewEmp(p => ({ ...p, email: e.target.value }));
                if (empErrors.email) setEmpErrors(p => ({ ...p, email: '' }));
              }}
              placeholder="sara@sauditech.sa"
              className={`w-full px-4 py-2.5 rounded-2xl border ${
                empErrors.email ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-soot/12 bg-white'
              } text-soot text-sm outline-none focus:border-soot`}
            />
            {empErrors.email && (
              <p className="text-rose-600 text-xs mt-1 font-medium flex items-center gap-1">
                <span>*</span> {translateMessage(empErrors.email)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-soot mb-1.5">{t('org.op.departmentRole')}</label>
            <input
              type="text"
              value={newEmp.department}
              onChange={e => setNewEmp(p => ({ ...p, department: e.target.value }))}
              placeholder={t('org.op.eGEngineeringDesignOperations')}
              className="w-full px-4 py-2.5 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-soot"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-soot/8">
            <button
              type="button"
              onClick={() => setAddEmpModal(false)}
              className="px-5 py-2.5 rounded-full border border-soot/15 text-soot text-xs font-medium hover:bg-soot/5 bg-white cursor-pointer"
            >
              {t('org.op.cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] text-xs font-medium shadow-xs border border-soot/8 cursor-pointer"
            >
              {t('org.op.addMember')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
