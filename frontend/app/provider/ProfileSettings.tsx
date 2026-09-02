'use client';

import React, { useState, useRef } from 'react';
import {
  Warehouse,
  Settings,
  Phone,
  Mail,
  FileText,
  Building2,
  User,
  MapPin,
  Globe,
  Shield,
  Calendar,
  Edit3,
  Check,
  Trash2,
  Upload,
  Lock,
  ArrowRight,
  CreditCard,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { useApp } from '@/app/store';
import { Space } from '@/types/types';
import Modal from '@/components/ui/Modal';
import UserAvatar from '@/components/ui/UserAvatar';

export default function ProviderProfileSettings() {
  const { currentUser, navigate, nav, updateCurrentUser, spaces, showToast } = useApp();
  if (!currentUser) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>(
    nav.screen === 'provider-settings' ? 'settings' : 'profile'
  );

  const providerSpaces = spaces.filter((s: Space) => s.ownerId === currentUser.id);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form Fields
  const [editBusinessName, setEditBusinessName] = useState(currentUser.businessName || 'The Hub Riyadh Holdings');
  const [editName, setEditName] = useState(currentUser.name || 'Nawaf Al-Qahtani');
  const [editCrNumber, setEditCrNumber] = useState(currentUser.crNumber || '1010456789');
  const [editPhone, setEditPhone] = useState(currentUser.phone || '+966 50 234 5678');
  const [editCity, setEditCity] = useState(currentUser.city || 'Riyadh, Saudi Arabia');
  const [editWebsite, setEditWebsite] = useState(currentUser.website || 'https://thehubriyadh.sa');
  const [editBusinessDescription, setEditBusinessDescription] = useState(
    currentUser.businessDescription ||
      'Operator of premium coworking spaces in Riyadh, including The Hub Riyadh and Desk Society. Dedicated to providing flexible, tech-enabled productive work environments.'
  );
  const [editAvatar, setEditAvatar] = useState(currentUser.avatar || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings: Notifications & Payouts
  const [notifications, setNotifications] = useState({
    bookingAlerts: true,
    passCheckins: true,
    reviewAlerts: true,
    monthlyPayouts: true,
  });

  const [payoutSettings, setPayoutSettings] = useState({
    autoPayout: true,
    instantBooking: true,
  });

  const handleOpenEdit = () => {
    setEditBusinessName(currentUser.businessName || 'The Hub Riyadh Holdings');
    setEditName(currentUser.name || '');
    setEditCrNumber(currentUser.crNumber || '1010456789');
    setEditPhone(currentUser.phone || '');
    setEditCity(currentUser.city || 'Riyadh, Saudi Arabia');
    setEditWebsite(currentUser.website || 'https://thehubriyadh.sa');
    setEditBusinessDescription(
      currentUser.businessDescription ||
        'Operator of premium coworking spaces in Riyadh, including The Hub Riyadh and Desk Society.'
    );
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

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!editBusinessName.trim()) newErrors.businessName = 'Business name is required';
    if (!editName.trim()) newErrors.name = 'Contact manager name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setTimeout(() => {
      updateCurrentUser({
        businessName: editBusinessName.trim(),
        name: editName.trim(),
        crNumber: editCrNumber.trim(),
        phone: editPhone.trim(),
        city: editCity.trim(),
        website: editWebsite.trim(),
        businessDescription: editBusinessDescription.trim(),
        avatar: editAvatar,
      });
      setIsSaving(false);
      setIsEditModalOpen(false);
      showToast('Provider profile updated successfully!', 'success');
    }, 350);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal" style={{ fontFamily: 'DM Serif Display, serif' }}>
            {activeTab === 'profile' ? 'Business Profile' : 'Provider Settings'}
          </h1>
          <p className="text-moss text-xs sm:text-sm mt-1 font-normal">
            Manage your workspace brand, contact information, and hosting preferences
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="inline-flex items-center gap-2 bg-white rounded-full p-1.5 border border-soot/8 shadow-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              navigate('provider-profile');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-[#DDE6DF] text-soot shadow-xs border border-soot/5'
                : 'text-moss hover:text-soot'
            }`}
          >
            <Warehouse size={15} />
            <span>Business Profile</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('settings');
              navigate('provider-settings');
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
          {/* Card 1: Provider Profile Header Card */}
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
                    name={currentUser.businessName || currentUser.name}
                    size="2xl"
                    ring={true}
                  />
                </div>
              </div>

              {/* Business Name, Role Badge, Location */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2
                    className="text-2xl sm:text-3xl font-normal text-soot tracking-tight"
                    style={{ fontFamily: 'DM Serif Display, serif' }}
                  >
                    {currentUser.businessName || currentUser.name}
                  </h2>

                  {/* Account Role Badge */}
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-medium bg-[#DDE6DF] text-soot border border-soot/6">
                    Space Provider Account
                  </span>

                  {/* Managed Spaces Count Badge */}
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-white text-moss border border-soot/10">
                    <Building2 size={12} />
                    <span>{providerSpaces.length} Managed Spaces</span>
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-moss font-normal flex flex-wrap items-center gap-3">
                  <span>Manager: {currentUser.name}</span>
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
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Business Information Section Card */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-soot/8 gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  Business Information
                </h3>
                <p className="text-moss text-xs mt-0.5 font-normal">Official space operator credentials and business profile</p>
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
              {/* Business Name */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Building2 size={13} className="text-moss/80" />
                  Business / Brand Name
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.businessName || 'The Hub Riyadh Holdings'}
                </div>
              </div>

              {/* Contact Manager Name */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <User size={13} className="text-moss/80" />
                  Authorized Representative
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.name}
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
                  {currentUser.phone || '+966 50 234 5678'}
                </div>
              </div>

              {/* CR Number */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <FileText size={13} className="text-moss/80" />
                  Commercial Registration (CR)
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.crNumber || '1010456789'}
                </div>
              </div>

              {/* Location */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <MapPin size={13} className="text-moss/80" />
                  Operating City
                </div>
                <div className="text-sm sm:text-base font-normal text-soot">
                  {currentUser.city || 'Riyadh, Saudi Arabia'}
                </div>
              </div>

              {/* Website */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 sm:col-span-2 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Globe size={13} className="text-moss/80" />
                  Official Website URL
                </div>
                <div className="text-sm sm:text-base font-normal text-soot truncate">
                  {currentUser.website || 'https://thehubriyadh.sa'}
                </div>
              </div>

              {/* Business Overview */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 sm:col-span-2 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <FileText size={13} className="text-moss/80" />
                  Business Description & Operations
                </div>
                <div className="text-sm font-normal text-soot leading-relaxed">
                  {currentUser.businessDescription ||
                    'Operator of premium coworking spaces in Riyadh, including The Hub Riyadh and Desk Society. Dedicated to providing flexible, tech-enabled productive work environments.'}
                </div>
              </div>

              {/* Partner Since */}
              <div className="bg-[#F9F8F5] rounded-2xl p-4 border border-soot/6 sm:col-span-2 transition-all hover:border-soot/12">
                <div className="text-[11px] font-medium uppercase tracking-wider text-moss mb-1 flex items-center gap-1.5">
                  <Calendar size={13} className="text-moss/80" />
                  Partner Network Member Since
                </div>
                <div className="text-sm font-normal text-soot">
                  {currentUser.joinDate || 'May 2023'}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Managed Spaces Overview */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-soot/8 gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-normal text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
                  Managed Spaces ({providerSpaces.length})
                </h3>
                <p className="text-moss text-xs mt-0.5 font-normal">Active coworking spaces listed under your provider account</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('provider-spaces')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] text-xs sm:text-sm font-medium transition-all shadow-xs border border-soot/8 cursor-pointer active:scale-98"
              >
                <span>Manage Spaces</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {providerSpaces.length === 0 ? (
              <div className="text-center py-10 text-moss text-sm">
                No spaces registered yet. Click &quot;Manage Spaces&quot; to list your first workspace.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {providerSpaces.map(space => (
                  <div
                    key={space.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-[#F9F8F5] border border-soot/6 hover:border-soot/12 transition-all"
                  >
                    <img
                      src={space.images[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300'}
                      alt={space.name}
                      className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-soot/8"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-soot truncate">{space.name}</div>
                      <div className="text-xs text-moss flex items-center gap-1 mt-0.5">
                        <MapPin size={11} />
                        <span>{space.city} · <span className="capitalize">{space.type.replace('-', ' ')}</span></span>
                      </div>
                      <div className="text-xs font-medium text-soot mt-1">
                        SAR {space.pricing.daily} <span className="text-[10px] text-moss font-normal">/day</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Provider Settings Tab */
        <div className="space-y-6">
          {/* Notification Preferences */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-normal text-soot mb-1" style={{ fontFamily: 'DM Serif Display, serif' }}>
              Hosting Notification Preferences
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">Configure alerts for space bookings, customer arrivals, and payouts</p>

            <div className="space-y-4 divide-y divide-soot/6">
              {[
                { key: 'bookingAlerts', label: 'Instant booking reservations', desc: 'Get SMS and email notifications whenever a client books a desk or meeting room' },
                { key: 'passCheckins', label: 'Coworking pass check-in alerts', desc: 'Real-time alert when a pass holder checks in at your front desk' },
                { key: 'reviewAlerts', label: 'Guest reviews and ratings', desc: 'Instant feedback alerts when a customer rates your workspace' },
                { key: 'monthlyPayouts', label: 'Monthly payout & earnings statement', desc: 'Detailed revenue statement delivered at the end of each settlement period' },
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

          {/* Hosting Policies & Payouts */}
          <div className="bg-white rounded-3xl border border-soot/8 p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-normal text-soot mb-1" style={{ fontFamily: 'DM Serif Display, serif' }}>
              Payout & Hosting Policies
            </h3>
            <p className="text-moss text-xs mb-6 font-normal">Manage financial settlements and space availability automations</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium text-soot">Automated Monthly Direct Deposit</div>
                  <div className="text-xs text-moss font-normal">Automatically transfer accumulated booking earnings to your Saudi IBAN on the 1st of each month</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPayoutSettings(p => ({ ...p, autoPayout: !p.autoPayout }))}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                    payoutSettings.autoPayout ? 'bg-soot' : 'bg-soot/15'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      payoutSettings.autoPayout ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-soot/6 pt-4">
                <div>
                  <div className="text-sm font-medium text-soot">Instant Desk Confirmation</div>
                  <div className="text-xs text-moss font-normal">Automatically approve hot desk reservations without manual host approval</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPayoutSettings(p => ({ ...p, instantBooking: !p.instantBooking }))}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                    payoutSettings.instantBooking ? 'bg-soot' : 'bg-soot/15'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      payoutSettings.instantBooking ? 'translate-x-7' : 'translate-x-1'
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
              Deleting your space provider account will unlist all your coworking spaces and cancel upcoming reservations.
            </p>
            <button
              type="button"
              onClick={() => showToast('To close your space provider account, please contact provider support.', 'error')}
              className="btn-danger"
            >
              <AlertCircle size={15} />
              <span>Delete Provider Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Provider Profile Modal */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Business Profile"
        size="lg"
      >
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 rounded-2xl bg-[#F9F8F5] border border-soot/8">
            <div className="relative shrink-0">
              <UserAvatar
                src={editAvatar}
                name={editBusinessName || currentUser.name}
                size="xl"
                ring={true}
              />
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left space-y-2.5">
              <div>
                <div className="text-sm font-medium text-soot">Brand Logo / Profile Picture</div>
                <p className="text-xs text-moss font-normal mt-0.5">
                  Upload your venue brand logo or use the clean default avatar.
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
                    className="h-10 px-5 rounded-full bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs sm:text-sm font-medium transition-all cursor-pointer shadow-xs inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <Trash2 size={14} className="shrink-0" />
                    <span>Reset to Default</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields with generous spacing */}
          <div className="space-y-5">
            {/* Business / Brand Name */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
                <span>Business / Brand Name <span className="text-red-500">*</span></span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Editable</span>
              </label>
              <input
                type="text"
                value={editBusinessName}
                onChange={e => setEditBusinessName(e.target.value)}
                placeholder="e.g. The Hub Riyadh Holdings"
                className={`w-full px-4 py-3 rounded-2xl border text-sm text-soot outline-none transition-all font-normal ${
                  errors.businessName ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-200' : 'border-soot/12 bg-white focus:border-eucalyptus focus:ring-2 focus:ring-eucalyptus/20'
                }`}
              />
              {errors.businessName && <p className="text-red-500 text-xs mt-1 font-normal">{errors.businessName}</p>}
            </div>

            {/* Manager Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
                  <span>Manager / Contact Name <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Editable</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="e.g. Nawaf Al-Qahtani"
                  className={`w-full px-4 py-3 rounded-2xl border text-sm text-soot outline-none transition-all font-normal ${
                    errors.name ? 'border-red-400 bg-red-50/20' : 'border-soot/12 bg-white focus:border-eucalyptus'
                  }`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1 font-normal">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
                  <span>Phone Number</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Editable</span>
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="+966 50 234 5678"
                  className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
                />
              </div>
            </div>

            {/* Email Address (Non-Editable) */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail size={12} />
                  <span>Registered Contact Email</span>
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

            {/* CR Number & Operating City */}
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
                  placeholder="1010456789"
                  className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
                  <span>Operating City</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Editable</span>
                </label>
                <input
                  type="text"
                  value={editCity}
                  onChange={e => setEditCity(e.target.value)}
                  placeholder="Riyadh, Saudi Arabia"
                  className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
                />
              </div>
            </div>

            {/* Website URL */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
                <span>Official Website</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Editable</span>
              </label>
              <input
                type="url"
                value={editWebsite}
                onChange={e => setEditWebsite(e.target.value)}
                placeholder="https://thehubriyadh.sa"
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
              />
            </div>

            {/* Business Description */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
                <span>Business & Space Overview</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Editable</span>
              </label>
              <textarea
                value={editBusinessDescription}
                onChange={e => setEditBusinessDescription(e.target.value)}
                rows={3}
                placeholder="Tell guests about your venue amenities, atmosphere, and booking services..."
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal resize-none"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-soot/8">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 h-12 py-3 px-6 rounded-full border border-soot/15 hover:bg-soot/5 text-soot text-sm font-medium transition-colors cursor-pointer inline-flex items-center justify-center whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 h-12 py-3 px-6 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] disabled:opacity-60 text-sm font-medium transition-all shadow-xs border border-soot/8 inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
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
    </div>
  );
}