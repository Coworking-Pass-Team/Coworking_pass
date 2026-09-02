'use client';

import React, { useState, useRef } from 'react';
import {
  User,
  Settings,
  Mail,
  Phone,
  Calendar,
  Shield,
  Edit3,
  Check,
  Trash2,
  Upload,
  Lock,
  GraduationCap,
  CreditCard,
  Plus,
  Sparkles,
  MapPin,
  AlertCircle,
  Clock,
  ArrowRight,
  Globe
} from 'lucide-react';
import { useApp } from '@/app/store';
import UserAvatar from '@/components/ui/UserAvatar';
import Modal from '@/components/ui/Modal';
import { PaymentCard } from '@/types/types';

export default function ProfileSettings({ mode = 'profile' }: { mode?: 'profile' | 'settings' }) {
  const { currentUser, updateCurrentUser, navigate, nav, showToast, addPaymentCard } = useApp();
  if (!currentUser) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>(
    mode || (nav.screen === 'ind-settings' ? 'settings' : 'profile')
  );

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Form Fields
  const [editName, setEditName] = useState(currentUser.name || '');
  const [editUsername, setEditUsername] = useState(
    currentUser.username || currentUser.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || ''
  );
  const [editPhone, setEditPhone] = useState(currentUser.phone || '');
  const [editUniversity, setEditUniversity] = useState(currentUser.university || '');
  const [editCity, setEditCity] = useState(currentUser.city || 'Riyadh, Saudi Arabia');
  const [editBio, setEditBio] = useState(currentUser.bio || '');
  const [editAvatar, setEditAvatar] = useState(currentUser.avatar || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add Payment Card Modal State
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [cardHolder, setCardHolder] = useState(currentUser.name || '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardBrand, setCardBrand] = useState<'Visa' | 'Mastercard' | 'Mada'>('Visa');
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  // Password Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  // Notifications & Privacy Settings
  const [notifications, setNotifications] = useState({
    bookings: true,
    promotions: false,
    updates: true,
    waitlist: true,
  });
  const [privacy, setPrivacy] = useState({ profileVisible: true, showBookings: false });

  const usernameDisplay = currentUser.username || currentUser.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user';
  const savedCards: PaymentCard[] = currentUser.savedCards || [
    { id: 'card-1', brand: 'Visa', last4: '4242', holderName: currentUser.name, expiry: '08/28' },
    { id: 'card-2', brand: 'Mada', last4: '8890', holderName: currentUser.name, expiry: '11/27' },
  ];

  const handleOpenEdit = () => {
    setEditName(currentUser.name || '');
    setEditUsername(currentUser.username || usernameDisplay);
    setEditPhone(currentUser.phone || '');
    setEditUniversity(currentUser.university || '');
    setEditCity(currentUser.city || 'Riyadh, Saudi Arabia');
    setEditBio(currentUser.bio || '');
    setEditAvatar(currentUser.avatar || '');
    setErrors({});
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

  const handleRemovePhoto = () => {
    setEditAvatar('');
    showToast('Profile photo removed. Default avatar will be used.', 'info');
  };

  const validateProfile = () => {
    const newErrors: Record<string, string> = {};
    if (!editName.trim()) newErrors.name = 'Full name is required';
    if (!editUsername.trim()) newErrors.username = 'Username is required';
    else if (!/^[a-zA-Z0-9_]+$/.test(editUsername)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) return;

    setIsSaving(true);
    setTimeout(() => {
      updateCurrentUser({
        name: editName.trim(),
        username: editUsername.trim().toLowerCase(),
        phone: editPhone.trim(),
        university: editUniversity.trim(),
        city: editCity.trim(),
        bio: editBio.trim(),
        avatar: editAvatar,
      });
      setIsSaving(false);
      setIsEditModalOpen(false);
      showToast('Profile updated successfully!', 'success');
    }, 350);
  };

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!cardNumber.trim() || cardNumber.replace(/\s/g, '').length < 15) errs.number = 'Enter a valid 16-digit card number';
    if (!cardExpiry.trim() || !/^\d{2}\/\d{2}$/.test(cardExpiry)) errs.expiry = 'Enter expiry date in MM/YY format';
    if (!cardHolder.trim()) errs.holder = 'Cardholder name is required';

    setCardErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const newCard = addPaymentCard({
      brand: cardBrand,
      last4: cardNumber.replace(/\s/g, '').slice(-4),
      holderName: cardHolder.trim(),
      expiry: cardExpiry.trim(),
    });

    const updated = [...savedCards, newCard];
    updateCurrentUser({ savedCards: updated });
    setIsAddCardOpen(false);
    setCardNumber('');
    setCardExpiry('');
    showToast(`${cardBrand} card ending in ${newCard.last4} added successfully!`, 'success');
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
    showToast('Security password updated successfully!', 'success');
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal" style={{ fontFamily: 'DM Serif Display, serif' }}>
            {activeTab === 'profile' ? 'User Profile' : 'Account Settings'}
          </h1>
          <p className="text-moss text-xs sm:text-sm mt-1 font-normal">
            Manage your personal identity, pass membership, and account security
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="inline-flex items-center gap-2 bg-white rounded-full p-1.5 border border-soot/8 shadow-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              navigate('ind-profile');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-[#DDE6DF] text-soot shadow-xs border border-soot/5'
                : 'text-moss hover:text-soot'
            }`}
          >
            <User size={15} />
            <span>Profile</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('settings');
              navigate('ind-settings');
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
          {/* Card 1: Main User Header Card */}
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
              {/* Header Row: Avatar */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
                <div className="relative inline-block self-start">
                  <UserAvatar
                    src={currentUser.avatar}
                    name={currentUser.name}
                    size="2xl"
                    ring={true}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleOpenEdit}
                    className="btn-secondary"
                  >
                    <Edit3 size={15} />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>

              {/* User Name, Role Badge, Username */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2
                    className="text-2xl sm:text-3xl font-normal text-soot tracking-tight"
                    style={{ fontFamily: 'DM Serif Display, serif' }}
                  >
                    {currentUser.name}
                  </h2>

                  {/* Account Role Badge */}
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-medium bg-[#DDE6DF] text-soot border border-soot/6 capitalize">
                    {currentUser.role === 'individual' ? 'Individual Member' : currentUser.role}
                  </span>

                  {/* All-Access Pass Membership Badge */}
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-eucalyptus/30 text-soot border border-eucalyptus/40 shadow-2xs">
                    <Check size={13} className="text-moss" />
                    <span>{currentUser.membershipTier || 'All-Access Pass Holder'}</span>
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-moss font-normal flex flex-wrap items-center gap-3">
                  <span>@{usernameDisplay}</span>
                  {currentUser.university && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <GraduationCap size={14} className="text-moss/80" />
                        <span>{currentUser.university}</span>
                      </span>
                    </>
                  )}
                  {currentUser.city && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} className="text-moss/80" />
                        <span>{currentUser.city}</span>
                      </span>
                    </>
                  )}
                </div>

                {currentUser.bio && (
                  <p className="text-xs sm:text-sm text-soot/80 font-normal pt-2 max-w-2xl leading-relaxed">
                    {currentUser.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Personal Information Section */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-soot/8 gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  Personal Information
                </h3>
                <p className="text-moss text-xs mt-0.5 font-normal">Official account profile details and contact methods</p>
              </div>
              <button
                type="button"
                onClick={handleOpenEdit}
                className="btn-secondary"
              >
                <Edit3 size={15} />
                <span>Edit Details</span>
              </button>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Full Name */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <User size={13} className="text-moss/80" />
                  Full Name
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.name}
                </div>
              </div>

              {/* Username */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <span className="font-mono text-xs">@</span>
                  Username
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  @{usernameDisplay}
                </div>
              </div>

              {/* Email Address */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Mail size={13} className="text-moss/80" />
                  Email Address
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
                  {currentUser.phone || '+966 55 123 4567'}
                </div>
              </div>

              {/* University / Affiliation */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <GraduationCap size={13} className="text-moss/80" />
                  University / Affiliation
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.university || currentUser.orgName || 'King Saud University (KSU)'}
                </div>
              </div>

              {/* Location / City */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <MapPin size={13} className="text-moss/80" />
                  City / Location
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.city || 'Riyadh, Saudi Arabia'}
                </div>
              </div>

              {/* Member Since */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 sm:col-span-2 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Calendar size={13} className="text-moss/80" />
                  Member Since
                </div>
                <div className="text-sm font-normal text-soot">
                  {currentUser.joinDate || 'January 2024'}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Membership & Subscription Pass Details */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-soot/8 gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  Pass Membership & Access
                </h3>
                <p className="text-moss text-xs mt-0.5 font-normal">Active workspace pass benefits and billing renewal</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('browse')}
                className="btn-primary text-xs sm:text-sm"
              >
                <Sparkles size={15} />
                <span>Explore Spaces</span>
              </button>
            </div>

            <div className="bg-[#F9F8F5] rounded-2xl p-5 border border-soot/6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-semibold text-soot">
                    {currentUser.membershipTier || 'All-Access Pass (Monthly)'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-eucalyptus/30 text-soot border border-eucalyptus/40">
                    Active
                  </span>
                </div>
                <p className="text-xs text-moss font-normal">
                  Unlimited access to Hot Desks, Meeting Rooms, and Mixed Coworking Workspaces across 7 Saudi cities.
                </p>
                <div className="text-[11px] text-moss/80 font-mono pt-1">
                  Next Billing Renewal: Oct 1, 2026 • Covered by Pass (SAR 0 Booking Rate)
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('browse')}
                className="btn-secondary text-xs shrink-0 self-stretch sm:self-auto"
              >
                <span>Book Workspace</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Card 4: Saved Payment Methods */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-soot/8 gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  Saved Payment Cards
                </h3>
                <p className="text-moss text-xs mt-0.5 font-normal">Payment methods saved for instant checkouts & auto-booking</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCardOpen(true)}
                className="btn-secondary"
              >
                <Plus size={15} />
                <span>Add Card</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedCards.map(card => (
                <div
                  key={card.id}
                  className="bg-[#F9F8F5] rounded-2xl p-5 border border-soot/8 flex items-center justify-between transition-all hover:border-soot/15"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-soot text-plaster flex items-center justify-center font-bold text-xs shrink-0">
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-soot">
                        {card.brand} •••• {card.last4}
                      </div>
                      <div className="text-xs text-moss font-normal">
                        Exp {card.expiry} • {card.holderName}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-moss bg-soot/5 px-2.5 py-1 rounded-full font-medium">Saved</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Settings Tab */
        <div className="space-y-6">
          {/* Security & Password Settings */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-soot/8">
              <div>
                <h3 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  Account Security
                </h3>
                <p className="text-moss text-xs mt-0.5 font-normal">Update your account password and security credentials</p>
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
                  New Password
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
                  {passwordSaved ? '✓ Password Updated' : 'Update Security Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-normal text-soot mb-1" style={{ fontFamily: 'DM Serif Display, serif' }}>
              Notification Preferences
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">Choose how and when you receive updates</p>

            <div className="space-y-4 divide-y divide-soot/6">
              {[
                { key: 'bookings', label: 'Booking confirmations & pass reminders', desc: 'Get SMS and email notifications for active bookings' },
                { key: 'updates', label: 'Coworking space announcements', desc: 'Receive notices about opening hours, maintenance, and new spaces' },
                { key: 'waitlist', label: 'Waitlist availability alerts', desc: 'Instant alert when a reserved desk becomes available' },
                { key: 'promotions', label: 'Partner deals & promotions', desc: 'Occasional discounts from our coworking network' },
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

          {/* Privacy Controls */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-normal text-soot mb-1" style={{ fontFamily: 'DM Serif Display, serif' }}>
              Privacy & Data Sharing
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">Manage data sharing with coworking space hosts</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium text-soot">Public Member Profile</div>
                  <div className="text-xs text-moss font-normal">Allow verified space hosts to see your name on check-in</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPrivacy(p => ({ ...p, profileVisible: !p.profileVisible }))}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                    privacy.profileVisible ? 'bg-soot' : 'bg-soot/15'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      privacy.profileVisible ? 'translate-x-7' : 'translate-x-1'
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
              Deleting your account will cancel all active pass memberships and erase your reservation history.
            </p>
            <button
              type="button"
              onClick={() => showToast('To close your member account, please contact customer support.', 'error')}
              className="btn-danger"
            >
              <AlertCircle size={15} />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile Information"
        subtitle="Update your display name, photo, university, and personal bio."
        size="lg"
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
              name={editName || 'User'}
              size="lg"
            />
            <div className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-moss">Profile Photo</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  <Upload size={13} />
                  <span>Upload Photo</span>
                </button>
                {editAvatar && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="btn-danger text-xs px-3 py-1.5"
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </button>
                )}
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

          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
              <span>Full Name *</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Editable</span>
            </label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="e.g. Faisal Al-Otaibi"
              className={`w-full px-4 py-3 rounded-2xl border text-sm text-soot outline-none transition-all font-normal ${
                errors.name ? 'border-red-400 bg-red-50/20' : 'border-soot/12 bg-white focus:border-eucalyptus'
              }`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
              <span>Username *</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Editable</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-moss font-semibold text-sm">@</span>
              <input
                type="text"
                value={editUsername}
                onChange={e => setEditUsername(e.target.value)}
                placeholder="username"
                className={`w-full pl-8 pr-4 py-3 rounded-2xl border text-sm text-soot outline-none transition-all font-normal ${
                  errors.username ? 'border-red-400 bg-red-50/20' : 'border-soot/12 bg-white focus:border-eucalyptus'
                }`}
              />
            </div>
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail size={12} />
                <span>Email Address</span>
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

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
              <span>Phone Number</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Editable</span>
            </label>
            <input
              type="tel"
              value={editPhone}
              onChange={e => setEditPhone(e.target.value)}
              placeholder="+966 55 123 4567"
              className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
            />
          </div>

          {/* City / Location */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
              <span>City / Location</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Editable</span>
            </label>
            <input
              type="text"
              value={editCity}
              onChange={e => setEditCity(e.target.value)}
              placeholder="e.g. Riyadh, Saudi Arabia"
              className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
            />
          </div>

          {/* University / Affiliation */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
              <span>University / Affiliation</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Editable</span>
            </label>
            <input
              type="text"
              value={editUniversity}
              onChange={e => setEditUniversity(e.target.value)}
              placeholder="e.g. King Saud University (KSU)"
              className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
              <span>About / Bio</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Editable</span>
            </label>
            <textarea
              value={editBio}
              onChange={e => setEditBio(e.target.value)}
              rows={3}
              placeholder="A brief introduction about yourself or your work..."
              className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal resize-none"
            />
          </div>
        </form>
      </Modal>

      {/* Add Payment Card Modal */}
      <Modal
        open={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        title="Add Saved Payment Method"
        subtitle="Add a credit card or Mada card for instant booking checkouts."
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddCardOpen(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddCardSubmit}
              className="btn-primary flex-1"
            >
              <CreditCard size={15} />
              <span>Save Card</span>
            </button>
          </>
        }
      >
        <form onSubmit={handleAddCardSubmit} className="space-y-4 py-2">
          {/* Card Brand */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
              Card Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Visa', 'Mastercard', 'Mada'] as const).map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setCardBrand(b)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    cardBrand === b
                      ? 'bg-soot text-plaster border-soot shadow-xs'
                      : 'border-soot/12 bg-white text-moss hover:border-soot/30'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Cardholder Name */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
              Cardholder Name *
            </label>
            <input
              type="text"
              value={cardHolder}
              onChange={e => setCardHolder(e.target.value)}
              placeholder="Name on card"
              className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
            />
            {cardErrors.holder && <p className="text-red-500 text-xs mt-1">{cardErrors.holder}</p>}
          </div>

          {/* Card Number */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
              Card Number *
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={e => setCardNumber(e.target.value)}
              placeholder="4242 4242 4242 4242"
              maxLength={19}
              className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-mono"
            />
            {cardErrors.number && <p className="text-red-500 text-xs mt-1">{cardErrors.number}</p>}
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
              Expiry Date (MM/YY) *
            </label>
            <input
              type="text"
              value={cardExpiry}
              onChange={e => setCardExpiry(e.target.value)}
              placeholder="08/28"
              maxLength={5}
              className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-mono"
            />
            {cardErrors.expiry && <p className="text-red-500 text-xs mt-1">{cardErrors.expiry}</p>}
          </div>
        </form>
      </Modal>
    </div>
  );
}
