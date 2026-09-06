'use client';

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
  Clock
} from 'lucide-react';
import { useApp } from '@/app/store';
import { Employee } from '@/types/types';
import Modal from '@/components/ui/Modal';
import UserAvatar from '@/components/ui/UserAvatar';

export default function OrgProfile() {
  const { currentUser, navigate, nav, updateCurrentUser, showToast, bookings } = useApp();
  if (!currentUser) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>(
    nav.screen === 'org-settings' ? 'settings' : 'profile'
  );

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Form Fields (Exact existing Organization fields preserved)
  const [editOrgName, setEditOrgName] = useState(currentUser.orgName || currentUser.name || '');
  const [editIndustry, setEditIndustry] = useState(currentUser.industry || 'Technology & Digital Solutions');
  const [editOrgSize, setEditOrgSize] = useState(String(currentUser.orgSize || '15'));
  const [editWebsite, setEditWebsite] = useState(currentUser.website || 'https://sauditech.sa');
  const [editPhone, setEditPhone] = useState(currentUser.phone || '+966 56 456 7890');
  const [editCrNumber, setEditCrNumber] = useState(currentUser.crNumber || '1010874921');
  const [editCity, setEditCity] = useState(currentUser.city || 'Riyadh, Saudi Arabia');
  const [editOrgDescription, setEditOrgDescription] = useState(
    currentUser.orgDescription ||
      'Leading enterprise technology and consulting firm specializing in distributed workspace solutions across Saudi Arabia.'
  );
  const [editAvatar, setEditAvatar] = useState(currentUser.avatar || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Employees State
  const [employees, setEmployees] = useState<Employee[]>(currentUser.employees || [
    { id: 'emp-1', name: 'Sara Al-Ghamdi', email: 'sara@sauditech.sa', department: 'Product Design' },
    { id: 'emp-2', name: 'Fahad Al-Dosari', email: 'fahad@sauditech.sa', department: 'Engineering' },
    { id: 'emp-3', name: 'Noura Al-Mutairi', email: 'noura@sauditech.sa', department: 'Operations' },
  ]);
  const [addEmpModal, setAddEmpModal] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: '', email: '', department: '' });

  // Password Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  // Notifications & Privacy Settings
  const [notifications, setNotifications] = useState({
    teamBookings: true,
    monthlyInvoices: true,
    spaceAlerts: true,
    passUsage: false,
  });
  const [privacy, setPrivacy] = useState({ allowTeamSelfBooking: true, centralBilling: true });

  const orgBookings = bookings.filter(b => b.userId === currentUser.id);

  const handleOpenEdit = () => {
    setEditOrgName(currentUser.orgName || currentUser.name || '');
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
        name: editOrgName.trim(),
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
    if (!newEmp.name.trim() || !newEmp.email.trim()) {
      showToast('Please provide employee name and corporate email', 'error');
      return;
    }
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
    if (!currentPassword) {
      showToast('Please enter current security password', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    setPasswordSaved(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Organization security password updated!', 'success');
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal" style={{ fontFamily: 'DM Serif Display, serif' }}>
            {activeTab === 'profile' ? 'Organization Profile' : 'Organization Settings'}
          </h1>
          <p className="text-moss text-xs sm:text-sm mt-1 font-normal">
            Manage your company identity, corporate pass credentials, and team workspace access
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
            <span>Company Profile</span>
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
            <span>Settings</span>
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
              {/* Header Row: Avatar / Logo */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
                <div className="relative inline-block self-start">
                  <UserAvatar
                    src={currentUser.avatar}
                    name={currentUser.orgName || currentUser.name}
                    size="2xl"
                    ring={true}
                  />
                </div>
              </div>

              {/* Organization Name, Role Badge, Location */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2
                    className="text-2xl sm:text-3xl font-normal text-soot tracking-tight"
                    style={{ fontFamily: 'DM Serif Display, serif' }}
                  >
                    {currentUser.orgName || currentUser.name}
                  </h2>

                  {/* Account Role Badge */}
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-medium bg-[#DDE6DF] text-soot border border-soot/6">
                    Organization Account
                  </span>

                  {/* Pass Membership Badge */}
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-white text-moss border border-soot/10">
                    <Check size={12} className="text-moss" />
                    <span>{currentUser.membershipTier || 'Enterprise Pass Holder'}</span>
                  </span>

                  {/* Team Members Count Badge */}
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-white text-moss border border-soot/10">
                    <Users size={12} />
                    <span>{employees.length} Team Members</span>
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-moss font-normal flex flex-wrap items-center gap-3">
                  <span>{currentUser.industry || 'Technology & Digital Solutions'}</span>
                  <span>•</span>
                  <span>{currentUser.city || 'Riyadh, Saudi Arabia'}</span>
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
                  Organization Information
                </h3>
                <p className="text-moss text-xs mt-0.5 font-normal">Official corporate entity credentials and business profile</p>
              </div>
              <button
                type="button"
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] text-xs sm:text-sm font-medium transition-all shadow-xs border border-soot/8 cursor-pointer active:scale-98"
              >
                <Edit3 size={15} />
                <span>Edit Profile</span>
              </button>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Organization Name */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Building2 size={13} className="text-moss/80" />
                  Organization / Company Name
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.orgName || currentUser.name}
                </div>
              </div>

              {/* Industry & Sector */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Briefcase size={13} className="text-moss/80" />
                  Industry & Sector
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.industry || 'Technology & Digital Solutions'}
                </div>
              </div>

              {/* Registered Email */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Mail size={13} className="text-moss/80" />
                  Corporate Billing Email
                </div>
                <div className="text-sm sm:text-base font-normal text-soot truncate" title={currentUser.email}>
                  {currentUser.email}
                </div>
              </div>

              {/* Contact Phone Number */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Phone size={13} className="text-moss/80" />
                  Contact Phone Number
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.phone || '+966 56 456 7890'}
                </div>
              </div>

              {/* CR Number */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <FileText size={13} className="text-moss/80" />
                  Commercial Registration (CR)
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.crNumber || '1010874921'}
                </div>
              </div>

              {/* Organization Size */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Users size={13} className="text-moss/80" />
                  Total Company Size
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.orgSize || employees.length || 15} Employees
                </div>
              </div>

              {/* Headquarters Location */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <MapPin size={13} className="text-moss/80" />
                  Headquarters City
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.city || 'Riyadh, Saudi Arabia'}
                </div>
              </div>

              {/* Official Website */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Globe size={13} className="text-moss/80" />
                  Official Website URL
                </div>
                <div className="text-sm sm:text-base font-normal text-soot truncate">
                  {currentUser.website || 'https://sauditech.sa'}
                </div>
              </div>

              {/* Company Overview */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 sm:col-span-2 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <FileText size={13} className="text-moss/80" />
                  Company Description & Overview
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
                  Corporate Account Member Since
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
                  Team Members Roster ({employees.length})
                </h3>
                <p className="text-moss text-xs mt-0.5 font-normal">Colleagues and team members authorized to book workspaces</p>
              </div>
              <button
                type="button"
                onClick={() => setAddEmpModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] text-xs sm:text-sm font-medium transition-all shadow-xs border border-soot/8 cursor-pointer active:scale-98"
              >
                <Plus size={15} />
                <span>Add Team Member</span>
              </button>
            </div>

            {employees.length === 0 ? (
              <div className="text-center py-10 text-moss text-sm">
                No team members added yet. Click &quot;Add Team Member&quot; to invite your team.
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
                        <div className="text-xs text-moss truncate">{emp.department} · {emp.email}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmployee(emp.id)}
                      className="p-2 text-moss/60 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0 ml-2"
                      title="Remove member"
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
              Corporate Notification Preferences
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">Configure alerts for team reservations, billing summaries, and workspace access</p>

            <div className="space-y-4 divide-y divide-soot/6">
              {[
                { key: 'teamBookings', label: 'Team booking notifications', desc: 'Get notified when an employee reserves desks or meeting rooms' },
                { key: 'monthlyInvoices', label: 'Monthly billing & VAT invoices', desc: 'Consolidated corporate invoice delivered at the end of each billing cycle' },
                { key: 'spaceAlerts', label: 'Corporate workspace announcements', desc: 'Alerts regarding new corporate pass venues and enterprise amenities' },
                { key: 'passUsage', label: 'Individual employee check-in alerts', desc: 'Real-time notifications for every desk badge scan' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between pt-4 first:pt-0">
                  <div className="pr-4">
                    <div className="text-sm font-medium text-soot">{item.label}</div>
                    <div className="text-xs text-moss mt-0.5 font-normal">{item.desc}</div>
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
                        notifications[item.key as keyof typeof notifications] ? 'translate-x-7' : 'translate-x-1'
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
              Corporate Security & Password
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">Update the administrative password for your organization account</p>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-medium text-soot mb-1.5">Current Administrator Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-soot mb-1.5">New Administrator Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-soot mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] text-xs sm:text-sm font-medium transition-all shadow-xs border border-soot/8 cursor-pointer active:scale-98"
                >
                  <Lock size={14} />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>

          {/* Corporate Workspace Access & Billing Policies */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-normal text-soot mb-1" style={{ fontFamily: 'DM Serif Display, serif' }}>
              Corporate Workspace Policies
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">Manage permissions for team reservations and automated billing</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium text-soot">Team Self-Booking Permission</div>
                  <div className="text-xs text-moss font-normal">Allow rostered team members to book hot desks directly under the enterprise pass</div>
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
                      privacy.allowTeamSelfBooking ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-soot/6 pt-4">
                <div>
                  <div className="text-sm font-medium text-soot">Centralized Corporate Billing</div>
                  <div className="text-xs text-moss font-normal">Automatically charge all team bookings to the primary organization invoice</div>
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
                      privacy.centralBilling ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-3xl border border-red-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-normal text-red-600 mb-1" style={{ fontFamily: 'DM Serif Display, serif' }}>
              Danger Zone
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">
              Deleting your corporate organization account will immediately terminate all team passes and workspace bookings.
            </p>
            <button
              type="button"
              onClick={() => showToast('To close your organization account, please contact corporate account management.', 'error')}
              className="btn-danger"
            >
              <AlertCircle size={15} />
              <span>Delete Organization Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Organization Profile Modal */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Organization Profile"
        size="lg"
      >
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 rounded-2xl bg-[#F9F8F5] border border-soot/8">
            <div className="relative shrink-0">
              <UserAvatar
                src={editAvatar}
                name={editOrgName || currentUser.name}
                size="xl"
                ring={true}
              />
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left space-y-2.5">
              <div>
                <div className="text-sm font-medium text-soot">Company Logo</div>
                <p className="text-xs text-moss font-normal mt-0.5">
                  Upload your corporate brand logo or use the clean default avatar.
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
                  <span>Upload Logo</span>
                </button>

                {editAvatar && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="h-10 px-4 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-xs sm:text-sm font-medium transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Trash2 size={14} className="shrink-0" />
                    <span>Remove</span>
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
                Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editOrgName}
                onChange={e => setEditOrgName(e.target.value)}
                placeholder="e.g. Saudi Tech Solutions"
                className={`w-full px-4 py-3 rounded-2xl border ${
                  errors.orgName ? 'border-red-400 bg-red-50/20' : 'border-soot/12 bg-white'
                } text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal`}
              />
              {errors.orgName && <p className="text-red-500 text-xs mt-1 font-normal">{errors.orgName}</p>}
            </div>

            {/* Industry */}
            <div>
              <label className="block text-xs font-medium text-soot mb-1.5">
                Industry & Sector
              </label>
              <input
                type="text"
                value={editIndustry}
                onChange={e => setEditIndustry(e.target.value)}
                placeholder="e.g. Technology & Digital Solutions"
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal"
              />
            </div>

            {/* Registered Email (Disabled) */}
            <div>
              <label className="block text-xs font-medium text-soot mb-1.5">
                Corporate Billing Email
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
                Contact Phone Number
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
                Commercial Registration (CR)
              </label>
              <input
                type="text"
                value={editCrNumber}
                onChange={e => setEditCrNumber(e.target.value)}
                placeholder="1010874921"
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal"
              />
            </div>

            {/* Organization Size */}
            <div>
              <label className="block text-xs font-medium text-soot mb-1.5">
                Team Size (Employees)
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
                Headquarters City
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
                Official Website
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
                Company Description & Overview
              </label>
              <textarea
                value={editOrgDescription}
                onChange={e => setEditOrgDescription(e.target.value)}
                rows={3}
                placeholder="Briefly describe your company's core operations and workspace requirements..."
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-7 py-3 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] text-xs sm:text-sm font-medium transition-all shadow-xs border border-soot/8 cursor-pointer disabled:opacity-50 active:scale-98"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Employee Modal */}
      <Modal
        open={addEmpModal}
        onClose={() => setAddEmpModal(false)}
        title="Add Team Member"
        size="md"
      >
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-soot mb-1.5">Full Name</label>
            <input
              type="text"
              value={newEmp.name}
              onChange={e => setNewEmp(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Sara Al-Ghamdi"
              className="w-full px-4 py-2.5 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-soot"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-soot mb-1.5">Corporate Email</label>
            <input
              type="email"
              value={newEmp.email}
              onChange={e => setNewEmp(p => ({ ...p, email: e.target.value }))}
              placeholder="sara@sauditech.sa"
              className="w-full px-4 py-2.5 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-soot"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-soot mb-1.5">Department / Role</label>
            <input
              type="text"
              value={newEmp.department}
              onChange={e => setNewEmp(p => ({ ...p, department: e.target.value }))}
              placeholder="e.g. Engineering, Design, Operations"
              className="w-full px-4 py-2.5 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-soot"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-soot/8">
            <button
              type="button"
              onClick={() => setAddEmpModal(false)}
              className="px-5 py-2.5 rounded-full border border-soot/15 text-soot text-xs font-medium hover:bg-soot/5 bg-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] text-xs font-medium shadow-xs border border-soot/8 cursor-pointer"
            >
              Add Member
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
