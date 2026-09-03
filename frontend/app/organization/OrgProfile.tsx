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
  AlertCircle
} from 'lucide-react';
import { useApp } from '@/app/store';
import { Employee } from '@/types/types';
import Modal from '@/components/ui/Modal';
import UserAvatar from '@/components/ui/UserAvatar';

export default function OrgProfile() {
  const { currentUser, navigate, nav, updateCurrentUser, showToast } = useApp();
  if (!currentUser) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>(
    nav.screen === 'org-settings' ? 'settings' : 'profile'
  );

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Form Fields
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

  // Notifications & Privacy Settings
  const [notifications, setNotifications] = useState({
    teamBookings: true,
    monthlyInvoices: true,
    spaceAlerts: true,
    passUsage: false,
  });
  const [privacy, setPrivacy] = useState({ allowTeamSelfBooking: true, centralBilling: true });

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
      showToast('Name and email are required.', 'error');
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
    showToast('Team member added successfully.', 'success');
  };

  const handleRemoveEmployee = (id: string) => {
    const updated = employees.filter(e => e.id !== id);
    setEmployees(updated);
    updateCurrentUser({ employees: updated });
    showToast('Team member removed.');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal" style={{ fontFamily: 'DM Serif Display, serif' }}>
            {activeTab === 'profile' ? 'Organization Profile' : 'Company Settings'}
          </h1>
          <p className="text-moss text-xs sm:text-sm mt-1 font-normal">
            Manage company identity, team members, and enterprise preferences
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
            <span>Profile & Team</span>
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
              {/* Header Row: Logo */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
                {/* Logo with Ring */}
                <div className="relative inline-block self-start">
                  <UserAvatar
                    src={currentUser.avatar}
                    name={currentUser.orgName || currentUser.name}
                    size="2xl"
                    ring={true}
                  />
                </div>
              </div>

              {/* Organization Name, Role Badge, Website */}
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

                  {/* Team Count Badge */}
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-white text-moss border border-soot/10">
                    <Users size={12} />
                    <span>{employees.length} Team Members</span>
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-moss font-normal flex flex-wrap items-center gap-3">
                  <span>{currentUser.industry || 'Technology & Digital Solutions'}</span>
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
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Company Information Section */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-soot/8 gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  Company Information
                </h3>
                <p className="text-moss text-xs mt-0.5 font-normal">Official business registration and contact details</p>
              </div>
              <button
                type="button"
                onClick={handleOpenEdit}
                className="btn-secondary"
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
                  Company Name
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.orgName || currentUser.name}
                </div>
              </div>

              {/* Industry / Sector */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Briefcase size={13} className="text-moss/80" />
                  Industry / Sector
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.industry || 'Technology & Digital Solutions'}
                </div>
              </div>

              {/* Official Email */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Mail size={13} className="text-moss/80" />
                  Official Email Address
                </div>
                <div className="text-sm sm:text-base font-normal text-soot truncate" title={currentUser.email}>
                  {currentUser.email}
                </div>
              </div>

              {/* Phone Number */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Phone size={13} className="text-moss/80" />
                  Phone Number
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.phone || '+966 56 456 7890'}
                </div>
              </div>

              {/* Website */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Globe size={13} className="text-moss/80" />
                  Website
                </div>
                <div className="text-sm sm:text-base font-normal text-soot truncate">
                  {currentUser.website || 'https://sauditech.sa'}
                </div>
              </div>

              {/* Total Team Size */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Users size={13} className="text-moss/80" />
                  Team Size
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.orgSize || '15'} Employees
                </div>
              </div>

              {/* Commercial Registration (CR) */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <FileText size={13} className="text-moss/80" />
                  CR / Registration Number
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.crNumber || '1010874921'}
                </div>
              </div>

              {/* Location */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <MapPin size={13} className="text-moss/80" />
                  Headquarters Location
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.city || 'Riyadh, Saudi Arabia'}
                </div>
              </div>

              {/* Company Overview */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 sm:col-span-2 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <FileText size={13} className="text-moss/80" />
                  Company Overview
                </div>
                <div className="text-sm font-normal text-soot leading-relaxed">
                  {currentUser.orgDescription ||
                    'Leading enterprise technology and consulting firm specializing in distributed workspace solutions across Saudi Arabia.'}
                </div>
              </div>

              {/* Member Since */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 sm:col-span-2 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Calendar size={13} className="text-moss/80" />
                  Account Created
                </div>
                <div className="text-sm font-normal text-soot">
                  {currentUser.joinDate || 'January 2024'}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Team Members Card */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-soot/8 gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  Team Members ({employees.length})
                </h3>
                <p className="text-moss text-xs mt-0.5 font-normal">Colleagues with corporate pass booking access</p>
              </div>
              <button
                type="button"
                onClick={() => setAddEmpModal(true)}
                className="btn-primary"
              >
                <Plus size={15} />
                <span>Add Member</span>
              </button>
            </div>

            {employees.length === 0 ? (
              <div className="text-center py-10 text-moss text-sm">
                No team members added yet. Click &quot;Add Member&quot; to invite colleagues.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {employees.map(emp => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-[#F9F8F5] border border-soot/6 hover:border-soot/12 transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#DDE6DF] text-soot flex items-center justify-center text-sm font-medium shrink-0 border border-soot/6">
                        {emp.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-soot truncate">{emp.name}</div>
                        <div className="text-xs text-moss truncate">
                          {emp.department} • {emp.email}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmployee(emp.id)}
                      className="p-2 rounded-xl hover:bg-red-50 text-moss hover:text-red-600 transition-colors cursor-pointer shrink-0 ml-2"
                      title="Remove member"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Settings Tab */
        <div className="space-y-6">
          {/* Notification Preferences */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-normal text-soot mb-1" style={{ fontFamily: 'DM Serif Display, serif' }}>
              Company Notification Preferences
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">Choose which alerts administrators and team leaders receive</p>

            <div className="space-y-4 divide-y divide-soot/6">
              {[
                { key: 'teamBookings', label: 'Team booking confirmations', desc: 'Receive instant notifications when employees book desks or meeting rooms' },
                { key: 'monthlyInvoices', label: 'Monthly billing & invoice summaries', desc: 'Centralized consolidated invoice delivery at the end of each billing cycle' },
                { key: 'spaceAlerts', label: 'Partner network & space alerts', desc: 'Notices regarding partner venue updates, maintenance, and premium rooms' },
                { key: 'passUsage', label: 'Weekly pass utilization reports', desc: 'Summary report on team attendance and active workspace usage' },
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

          {/* Access & Central Billing */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-normal text-soot mb-1" style={{ fontFamily: 'DM Serif Display, serif' }}>
              Enterprise Policies
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">Control employee booking permissions and billing controls</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium text-soot">Self-Service Employee Booking</div>
                  <div className="text-xs text-moss font-normal">Allow verified employees to directly reserve workspaces using corporate credits</div>
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
                  <div className="text-xs text-moss font-normal">Consolidate all employee bookings to the organization primary corporate card</div>
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
              Deleting your organization account will remove all team access, active bookings, and company profiles.
            </p>
            <button
              type="button"
              onClick={() => showToast('To delete your organization account, please contact enterprise support.', 'error')}
              className="btn-danger"
            >
              <AlertCircle size={15} />
              <span>Delete Organization</span>
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
          {/* Logo Section */}
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
                  Upload an official company logo or use the default enterprise placeholder.
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
                  className="btn-secondary"
                >
                  <Upload size={14} className="shrink-0" />
                  <span>Upload Logo</span>
                </button>

                {editAvatar && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="btn-danger"
                  >
                    <Trash2 size={14} className="shrink-0" />
                    <span>Reset to Default</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields with generous spacing and clear distinction */}
          <div className="space-y-5">
            {/* Organization Name */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
                <span>Organization Name <span className="text-red-500">*</span></span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Editable</span>
              </label>
              <input
                type="text"
                value={editOrgName}
                onChange={e => setEditOrgName(e.target.value)}
                placeholder="e.g. Saudi Tech Solutions LLC"
                className={`w-full px-4 py-3 rounded-2xl border text-sm text-soot outline-none transition-all font-normal ${
                  errors.orgName ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-200' : 'border-soot/12 bg-white focus:border-eucalyptus focus:ring-2 focus:ring-eucalyptus/20'
                }`}
              />
              {errors.orgName && <p className="text-red-500 text-xs mt-1 font-normal">{errors.orgName}</p>}
            </div>

            {/* Industry / Sector & Team Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
                  <span>Industry / Sector</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Editable</span>
                </label>
                <input
                  type="text"
                  value={editIndustry}
                  onChange={e => setEditIndustry(e.target.value)}
                  placeholder="e.g. Technology & Consulting"
                  className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus focus:ring-2 focus:ring-eucalyptus/20 font-normal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
                  <span>Total Team Size</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Editable</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={editOrgSize}
                  onChange={e => setEditOrgSize(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus focus:ring-2 focus:ring-eucalyptus/20 font-normal"
                />
              </div>
            </div>

            {/* Official Email Address (Non-Editable / Read-Only with distinction) */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail size={12} />
                  <span>Admin Contact Email</span>
                </span>
                <span className="text-[10px] text-moss/80 bg-soot/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock size={10} /> Read-only
                </span>
              </label>
              <input
                type="email"
                value={currentUser.email}
                disabled
                className="w-full px-4 py-3 rounded-2xl border border-soot/8 bg-soot/5 text-moss text-sm cursor-not-allowed font-normal"
              />
            </div>

            {/* Phone Number & Website */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
                  <span>Phone Number</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Editable</span>
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="+966 56 456 7890"
                  className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus focus:ring-2 focus:ring-eucalyptus/20 font-normal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
                  <span>Company Website</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Editable</span>
                </label>
                <input
                  type="url"
                  value={editWebsite}
                  onChange={e => setEditWebsite(e.target.value)}
                  placeholder="https://sauditech.sa"
                  className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus focus:ring-2 focus:ring-eucalyptus/20 font-normal"
                />
              </div>
            </div>

            {/* Commercial Registration (CR) & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
                  <span>CR / Registration Number</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Editable</span>
                </label>
                <input
                  type="text"
                  value={editCrNumber}
                  onChange={e => setEditCrNumber(e.target.value)}
                  placeholder="1010874921"
                  className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus focus:ring-2 focus:ring-eucalyptus/20 font-normal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
                  <span>Headquarters Location</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Editable</span>
                </label>
                <input
                  type="text"
                  value={editCity}
                  onChange={e => setEditCity(e.target.value)}
                  placeholder="Riyadh, Saudi Arabia"
                  className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus focus:ring-2 focus:ring-eucalyptus/20 font-normal"
                />
              </div>
            </div>

            {/* Role / Account Type (Non-Editable distinction) */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Shield size={12} />
                  <span>Account Role</span>
                </span>
                <span className="text-[10px] text-moss/80 bg-soot/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock size={10} /> Read-only
                </span>
              </label>
              <input
                type="text"
                value="Organization Account"
                disabled
                className="w-full px-4 py-3 rounded-2xl border border-soot/8 bg-soot/5 text-moss text-sm cursor-not-allowed font-normal"
              />
            </div>

            {/* Company Overview / Bio */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
                <span>Company Overview</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Editable</span>
              </label>
              <textarea
                value={editOrgDescription}
                onChange={e => setEditOrgDescription(e.target.value)}
                rows={3}
                placeholder="A brief overview about your company and operations..."
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus focus:ring-2 focus:ring-eucalyptus/20 font-normal resize-none"
              />
            </div>
          </div>

          {/* Modal Actions: Same sizes, matching heights, consistent gaps, and no text wrapping */}
          <div className="flex items-center gap-4 pt-4 border-t border-soot/8">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex-1 disabled:opacity-60"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check size={16} className="shrink-0" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Team Member Modal */}
      <Modal open={addEmpModal} onClose={() => setAddEmpModal(false)} title="Add Team Member" size="md">
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newEmp.name}
              onChange={e => setNewEmp(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Fahad Al-Dosari"
              className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus font-normal"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={newEmp.email}
              onChange={e => setNewEmp(prev => ({ ...prev, email: e.target.value }))}
              placeholder="e.g. fahad@sauditech.sa"
              className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus font-normal"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
              Department
            </label>
            <input
              type="text"
              value={newEmp.department}
              onChange={e => setNewEmp(prev => ({ ...prev, department: e.target.value }))}
              placeholder="e.g. Engineering, Design, Operations"
              className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus font-normal"
            />
          </div>
          <div className="flex items-center gap-4 pt-4 border-t border-soot/8">
            <button
              type="button"
              onClick={() => setAddEmpModal(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              <Plus size={16} />
              <span>Add Member</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
