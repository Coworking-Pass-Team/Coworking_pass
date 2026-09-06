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
  Globe,
  AtSign,
  FileText
} from 'lucide-react';
import { useApp } from '@/app/store';
import UserAvatar from '@/components/ui/UserAvatar';
import Modal from '@/components/ui/Modal';
import { PaymentCard } from '@/types/types';

export default function ProfileSettings({ mode = 'profile' }: { mode?: 'profile' | 'settings' }) {
  const { currentUser, updateCurrentUser, navigate, nav, showToast, addPaymentCard, bookings } = useApp();
  if (!currentUser) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>(
    mode || (nav.screen === 'ind-settings' ? 'settings' : 'profile')
  );

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Form Fields (Exact existing Individual fields preserved)
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

  const userBookings = bookings.filter(b => b.userId === currentUser.id);

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
    showToast('Profile photo reset to default.', 'info');
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
      showToast('Individual profile updated successfully!', 'success');
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal" style={{ fontFamily: 'DM Serif Display, serif' }}>
            {activeTab === 'profile' ? 'Member Profile' : 'Account Settings'}
          </h1>
          <p className="text-moss text-xs sm:text-sm mt-1 font-normal">
            Manage your personal identity, contact details, and workspace pass preferences
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
            <span>Member Profile</span>
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
              </div>

              {/* User Name, Role Badge, Location */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2
                    className="text-2xl sm:text-3xl font-normal text-soot tracking-tight"
                    style={{ fontFamily: 'DM Serif Display, serif' }}
                  >
                    {currentUser.name}
                  </h2>

                  {/* Account Role Badge */}
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-medium bg-[#DDE6DF] text-soot border border-soot/6">
                    Individual Member
                  </span>

                  {/* Membership Tier Badge */}
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-white text-moss border border-soot/10">
                    <Check size={12} className="text-moss" />
                    <span>{currentUser.membershipTier ? `${currentUser.membershipTier} Member` : 'All-Access Pass Holder'}</span>
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-moss font-normal flex flex-wrap items-center gap-3">
                  <span>@{usernameDisplay}</span>
                  <span>•</span>
                  <span>{currentUser.city || 'Riyadh, Saudi Arabia'}</span>
                  {currentUser.university && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <GraduationCap size={13} className="text-moss/80" />
                        <span>{currentUser.university}</span>
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>{userBookings.length} Total Bookings</span>
                </div>

                {currentUser.bio && (
                  <p className="text-xs sm:text-sm text-soot/80 font-normal pt-2 max-w-2xl leading-relaxed">
                    {currentUser.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Personal Information Section Card */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-soot/8 gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  Personal Information
                </h3>
                <p className="text-moss text-xs mt-0.5 font-normal">Official personal profile details and contact methods</p>
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
                  <AtSign size={13} className="text-moss/80" />
                  Username
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  @{usernameDisplay}
                </div>
              </div>

              {/* Registered Email */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Mail size={13} className="text-moss/80" />
                  Registered Email Address
                </div>
                <div className="text-sm sm:text-base font-normal text-soot truncate" title={currentUser.email}>
                  {currentUser.email}
                </div>
              </div>

              {/* Phone Number */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Phone size={13} className="text-moss/80" />
                  Contact Phone Number
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.phone || '+966 55 123 4567'}
                </div>
              </div>

              {/* University / Education */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <GraduationCap size={13} className="text-moss/80" />
                  University / Education
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.university || 'King Saud University'}
                </div>
              </div>

              {/* Location */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <MapPin size={13} className="text-moss/80" />
                  Operating City / Location
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.city || 'Riyadh, Saudi Arabia'}
                </div>
              </div>

              {/* Bio Summary */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 sm:col-span-2 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <FileText size={13} className="text-moss/80" />
                  Personal Bio & Workspace Focus
                </div>
                <div className="text-sm font-normal text-soot leading-relaxed">
                  {currentUser.bio ||
                    'Active Coworking Pass member exploring collaborative shared spaces, quiet focus hubs, and tech incubators across Saudi Arabia.'}
                </div>
              </div>

              {/* Member Since */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 sm:col-span-2 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Calendar size={13} className="text-moss/80" />
                  Member Since
                </div>
                <div className="text-sm font-normal text-soot">
                  {currentUser.joinDate || 'March 2024'}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Active Bookings Overview */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-soot/8 gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  My Workspace Activity ({userBookings.length})
                </h3>
                <p className="text-moss text-xs mt-0.5 font-normal">Recent reservations and pass check-ins across partner spaces</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('my-bookings')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] text-xs sm:text-sm font-medium transition-all shadow-xs border border-soot/8 cursor-pointer active:scale-98"
              >
                <span>View All Bookings</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {userBookings.length === 0 ? (
              <div className="text-center py-10 text-moss text-sm">
                No active bookings found. Explore coworking spaces to make your first reservation.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userBookings.slice(0, 4).map(b => (
                  <div
                    key={b.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-[#F9F8F5] border border-soot/6 hover:border-soot/12 transition-all cursor-pointer"
                    onClick={() => navigate('my-bookings')}
                  >
                    <img
                      src={b.spaceImage}
                      alt={b.spaceName}
                      className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-soot/8"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-soot truncate">{b.spaceName}</div>
                      <div className="text-xs text-moss flex items-center gap-1 mt-0.5">
                        <MapPin size={11} />
                        <span>{b.spaceCity} · <span className="capitalize">{b.plan === 'hourly' ? `${b.durationHours || 1}h Hourly` : b.plan}</span></span>
                      </div>
                      <div className="text-xs font-medium text-soot mt-1">
                        {b.startDate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Individual Settings Tab */
        <div className="space-y-6">
          {/* Notification Preferences */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-normal text-soot mb-1" style={{ fontFamily: 'DM Serif Display, serif' }}>
              Notification Preferences
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">Manage SMS and email alerts for your bookings and pass usage</p>

            <div className="space-y-4 divide-y divide-soot/6">
              {[
                { key: 'bookings', label: 'Booking confirmations & reminders', desc: 'Real-time updates regarding your reservations and desk check-ins' },
                { key: 'waitlist', label: 'Waitlist & space availability alerts', desc: 'Get notified immediately when high-demand workspaces open up' },
                { key: 'updates', label: 'Pass features & monthly statements', desc: 'Receive summaries of your monthly usage and platform updates' },
                { key: 'promotions', label: 'Partner network discounts & perks', desc: 'Special offers from newly onboarded coworking venues' },
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
              Security & Password
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">Update your login credentials and secure your account</p>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-medium text-soot mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-soot mb-1.5">New Password</label>
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

          {/* Payment Methods */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-soot/8 gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  Saved Payment Cards
                </h3>
                <p className="text-moss text-xs mt-0.5 font-normal">Credit & Mada cards saved for instant pass checkout</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCardOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] text-xs sm:text-sm font-medium transition-all shadow-xs border border-soot/8 cursor-pointer active:scale-98"
              >
                <Plus size={14} />
                <span>Add New Card</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedCards.map(card => (
                <div key={card.id} className="p-4 rounded-2xl bg-[#F9F8F5] border border-soot/8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-soot/10 flex items-center justify-center font-bold text-xs text-soot shadow-2xs">
                      {card.brand}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-soot">•••• •••• •••• {card.last4}</div>
                      <div className="text-xs text-moss">Expires {card.expiry}</div>
                    </div>
                  </div>
                  <span className="text-xs text-moss font-medium">Default</span>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-3xl border border-red-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-normal text-red-600 mb-1" style={{ fontFamily: 'DM Serif Display, serif' }}>
              Danger Zone
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">
              Deleting your individual member account will permanently remove your reservation history and pass memberships.
            </p>
            <button
              type="button"
              onClick={() => showToast('To close your member account, please contact member support.', 'error')}
              className="btn-danger"
            >
              <AlertCircle size={15} />
              <span>Delete Member Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Individual Profile Modal */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Member Profile"
        size="lg"
      >
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 rounded-2xl bg-[#F9F8F5] border border-soot/8">
            <div className="relative shrink-0">
              <UserAvatar
                src={editAvatar}
                name={editName || currentUser.name}
                size="xl"
                ring={true}
              />
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left space-y-2.5">
              <div>
                <div className="text-sm font-medium text-soot">Profile Photo</div>
                <p className="text-xs text-moss font-normal mt-0.5">
                  Upload a clear portrait or use the clean default avatar.
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
                  <span>Upload Photo</span>
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
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-soot mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="e.g. Hadel Turki"
                className={`w-full px-4 py-3 rounded-2xl border ${
                  errors.name ? 'border-red-400 bg-red-50/20' : 'border-soot/12 bg-white'
                } text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1 font-normal">{errors.name}</p>}
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-soot mb-1.5">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editUsername}
                onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. hadel_t"
                className={`w-full px-4 py-3 rounded-2xl border ${
                  errors.username ? 'border-red-400 bg-red-50/20' : 'border-soot/12 bg-white'
                } text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal`}
              />
              {errors.username && <p className="text-red-500 text-xs mt-1 font-normal">{errors.username}</p>}
            </div>

            {/* Registered Email (Disabled) */}
            <div>
              <label className="block text-xs font-medium text-soot mb-1.5">
                Registered Email
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
                Phone Number
              </label>
              <input
                type="text"
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                placeholder="+966 55 123 4567"
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal"
              />
            </div>

            {/* University / Education */}
            <div>
              <label className="block text-xs font-medium text-soot mb-1.5">
                University / Education
              </label>
              <input
                type="text"
                value={editUniversity}
                onChange={e => setEditUniversity(e.target.value)}
                placeholder="e.g. King Saud University"
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal"
              />
            </div>

            {/* Operating City */}
            <div>
              <label className="block text-xs font-medium text-soot mb-1.5">
                City / Location
              </label>
              <input
                type="text"
                value={editCity}
                onChange={e => setEditCity(e.target.value)}
                placeholder="e.g. Riyadh, Saudi Arabia"
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs font-normal"
              />
            </div>

            {/* Bio */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-soot mb-1.5">
                Personal Bio & Focus
              </label>
              <textarea
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                rows={3}
                placeholder="Share a short bio regarding your work, studies, or workspace preferences..."
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

      {/* Add Payment Card Modal */}
      <Modal
        open={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        title="Add Payment Card"
        size="md"
      >
        <form onSubmit={handleAddCardSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-soot mb-1.5">Card Brand</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Visa', 'Mastercard', 'Mada'] as const).map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setCardBrand(b)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    cardBrand === b
                      ? 'bg-soot text-plaster border-soot shadow-2xs'
                      : 'bg-white border-soot/12 text-moss hover:text-soot'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-soot mb-1.5">Cardholder Name</label>
            <input
              type="text"
              value={cardHolder}
              onChange={e => setCardHolder(e.target.value)}
              placeholder="Name on card"
              className={`w-full px-4 py-2.5 rounded-2xl border ${
                cardErrors.holder ? 'border-red-400 bg-red-50/20' : 'border-soot/12 bg-white'
              } text-soot text-sm outline-none focus:border-soot`}
            />
            {cardErrors.holder && <p className="text-red-500 text-xs mt-1">{cardErrors.holder}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-soot mb-1.5">Card Number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 '))}
              maxLength={19}
              placeholder="4242 •••• •••• 4242"
              className={`w-full px-4 py-2.5 rounded-2xl border ${
                cardErrors.number ? 'border-red-400 bg-red-50/20' : 'border-soot/12 bg-white'
              } text-soot text-sm outline-none focus:border-soot`}
            />
            {cardErrors.number && <p className="text-red-500 text-xs mt-1">{cardErrors.number}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-soot mb-1.5">Expiry Date (MM/YY)</label>
            <input
              type="text"
              value={cardExpiry}
              onChange={e => setCardExpiry(e.target.value)}
              maxLength={5}
              placeholder="MM/YY"
              className={`w-full px-4 py-2.5 rounded-2xl border ${
                cardErrors.expiry ? 'border-red-400 bg-red-50/20' : 'border-soot/12 bg-white'
              } text-soot text-sm outline-none focus:border-soot`}
            />
            {cardErrors.expiry && <p className="text-red-500 text-xs mt-1">{cardErrors.expiry}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-soot/8">
            <button
              type="button"
              onClick={() => setIsAddCardOpen(false)}
              className="px-5 py-2.5 rounded-full border border-soot/15 text-soot text-xs font-medium hover:bg-soot/5 bg-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] text-xs font-medium shadow-xs border border-soot/8 cursor-pointer"
            >
              Save Card
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
