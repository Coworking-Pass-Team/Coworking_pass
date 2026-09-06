'use client';

import React, { useState, useRef } from 'react';
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
  UserCheck
} from 'lucide-react';
import { useApp } from '@/app/store';
import UserAvatar from '@/components/ui/UserAvatar';
import Modal from '@/components/ui/Modal';

export default function AdminSettings() {
  const { currentUser, updateCurrentUser, logout, showToast, navigate, nav } = useApp();
  if (!currentUser) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>(
    nav.screen === 'admin-settings' ? 'profile' : 'profile'
  );

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(currentUser.name || 'System Admin');
  const [editPhone, setEditPhone] = useState(currentUser.phone || '+966 50 000 0001');
  const [editAvatar, setEditAvatar] = useState(currentUser.avatar || '');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

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
      showToast('Admin name is required', 'error');
      return;
    }

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
    if (!currentPassword) {
      showToast('Please enter your current password', 'error');
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
    showToast('Admin security password updated successfully!', 'success');
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal" style={{ fontFamily: 'DM Serif Display, serif' }}>
            {activeTab === 'profile' ? 'Admin Profile & Security' : 'Platform Settings'}
          </h1>
          <p className="text-moss text-xs sm:text-sm mt-1 font-normal">
            Super Admin system administration, security controls, and platform governance
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
            <span>Profile & Security</span>
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
            <span>System Settings</span>
          </button>
        </div>
      </div>

      {activeTab === 'profile' ? (
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
                    <span>Super Admin Portal</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full text-xs font-medium bg-[#DDE6DF] text-soot border border-soot/6 shadow-2xs">
                    <UserCheck size={12} className="text-soot" />
                    <span>Full Platform Privileges</span>
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-moss font-normal flex flex-wrap items-center gap-3">
                  <span>{currentUser.email}</span>
                  <span>•</span>
                  <span>System Administrator ID: ADM-001</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Administrator Information */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-soot/8 gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  Administrator Information
                </h3>
                <p className="text-moss text-xs mt-0.5 font-normal">System credentials and platform contact details</p>
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
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Shield size={13} className="text-moss/80" />
                  Full Administrator Name
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.name}
                </div>
              </div>

              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Mail size={13} className="text-moss/80" />
                  Admin Email Address
                </div>
                <div className="text-sm sm:text-base font-normal text-soot truncate" title={currentUser.email}>
                  {currentUser.email}
                </div>
              </div>

              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Phone size={13} className="text-moss/80" />
                  Direct Phone Contact
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.phone || '+966 50 000 0001'}
                </div>
              </div>

              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Key size={13} className="text-moss/80" />
                  Access Level
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  SUPER_ADMIN (Root Privileges)
                </div>
              </div>

              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 sm:col-span-2 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Calendar size={13} className="text-moss/80" />
                  System Provision Date
                </div>
                <div className="text-sm font-normal text-soot">
                  {currentUser.joinDate || 'January 15, 2023'}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Platform Security & Password */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-soot/8">
              <div>
                <h3 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  System Security & Password
                </h3>
                <p className="text-moss text-xs mt-0.5 font-normal">Update super administrator authentication credentials</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
                  New Admin Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
                />
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
              Platform System Settings
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">Global system switches and administrative defaults</p>

            <div className="space-y-4 divide-y divide-soot/6">
              <div className="flex items-center justify-between pt-4 first:pt-0">
                <div>
                  <div className="text-sm font-medium text-soot">Auto-Approve Partner Workspaces</div>
                  <div className="text-xs text-moss mt-0.5 font-normal">Automatically make new provider spaces visible without manual audit</div>
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
                      systemSettings.autoApproveSpaces ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <div className="text-sm font-medium text-soot">System Audit Logging</div>
                  <div className="text-xs text-moss mt-0.5 font-normal">Log all super admin role modifications and booking cancellations</div>
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
                      systemSettings.auditLogging ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <div className="text-sm font-medium text-soot">System Maintenance Mode</div>
                  <div className="text-xs text-moss mt-0.5 font-normal">Temporarily pause new booking requests for platform updates</div>
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
                      systemSettings.maintenanceMode ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-3xl border border-red-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-normal text-red-600 mb-1" style={{ fontFamily: 'DM Serif Display, serif' }}>
              Super Admin Session
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">
              Log out of your super administrator portal session.
            </p>
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="btn-danger"
            >
              <LogOut size={15} />
              <span>Log Out Admin Session</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Administrator Info"
        subtitle="Update display name, photo, and direct phone contact."
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleSaveProfile(e as any)}
              disabled={isSaving}
              className="btn-primary flex-1 disabled:opacity-60"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check size={16} className="shrink-0 text-eucalyptus" />
                  <span>Save Changes</span>
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
              <div className="text-xs font-semibold uppercase tracking-wider text-moss">Admin Avatar</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  <Upload size={13} />
                  <span>Upload Photo</span>
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
              Full Administrator Name *
            </label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
              Direct Phone Contact
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
        title="Confirm Logout"
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setShowLogoutModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="button" onClick={() => { setShowLogoutModal(false); logout(); }} className="btn-danger flex-1">Log Out</button>
          </>
        }
      >
        <p className="text-sm text-soot py-2">Are you sure you want to log out of your super administrator session?</p>
      </Modal>
    </div>
  );
}
