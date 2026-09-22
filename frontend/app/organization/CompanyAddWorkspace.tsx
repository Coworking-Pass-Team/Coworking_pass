'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  Phone,
  Mail,
  Users,
  DollarSign,
  Sparkles,
  Check,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '@/app/store';
import { Space, SpaceType } from '@/types/types';

const SAUDI_CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Madinah', 'Makkah'];

const WORKSPACE_TYPES: { type: SpaceType; label: string; desc: string }[] = [
  { type: 'private-office', label: 'Private Office Suite', desc: 'Enclosed private offices for focused executive teams.' },
  { type: 'shared-desk', label: 'Dedicated Team Desks', desc: 'Reserved permanent desks in a dedicated company zone.' },
  { type: 'meeting-room', label: 'Meeting / Board Room', desc: 'Conference facilities with video and presentation screens.' },
  { type: 'training-hall', label: 'Training & Workshop Hall', desc: 'Classroom or seminar setup for workshops and events.' },
  { type: 'event-hall', label: 'Presentation & Event Space', desc: 'Large open venues for townhalls and product demos.' },
  { type: 'mixed', label: 'Flex / Open Coworking', desc: 'Flexible shared desks and hot-desking for distributed staff.' },
];

const PRESET_IMAGES = [
  {
    label: 'Modern Tech Office',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Executive Boardroom',
    url: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Innovation Lounge',
    url: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Creative Collaboration',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Private Focus Suite',
    url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&auto=format&fit=crop&q=80',
  },
];

const AVAILABLE_AMENITIES = [
  'High-Speed Wi-Fi',
  '4K Presentation Screens',
  'Video Conference Facility',
  'Whiteboards & Brainstorming',
  'Specialty Coffee & Refreshments',
  'Ergonomic Desks & Chairs',
  '24/7 Keycard Access',
  'Private Phone Booths',
  'Dedicated Parking',
  'Printing & Scanning Services',
  'Prayer Room',
  'Executive Lounge',
];

export default function CompanyAddWorkspace() {
  const { currentUser, addSpace, navigate } = useApp();

  const [name, setName] = useState('');
  const [type, setType] = useState<SpaceType>('private-office');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Riyadh');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [openHours, setOpenHours] = useState('Sun–Thu: 8:00 AM – 8:00 PM');
  const [totalCapacity, setTotalCapacity] = useState('20');
  const [availableCapacity, setAvailableCapacity] = useState('20');
  const [dailyPrice, setDailyPrice] = useState('120');
  const [monthlyPrice, setMonthlyPrice] = useState('1800');
  const [yearlyPrice, setYearlyPrice] = useState('18000');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '+966 55 123 4567');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'High-Speed Wi-Fi',
    'Specialty Coffee & Refreshments',
    'Ergonomic Desks & Chairs',
    '24/7 Keycard Access',
  ]);
  const [selectedImage, setSelectedImage] = useState(PRESET_IMAGES[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) return null;

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Workspace name is required.';
    if (!address.trim()) errs.address = 'Detailed address is required.';
    if (!description.trim()) errs.description = 'Brief workspace description is required.';
    if (!totalCapacity || parseInt(totalCapacity, 10) <= 0) {
      errs.totalCapacity = 'Total seating capacity must be at least 1.';
    }
    if (!dailyPrice || parseFloat(dailyPrice) < 0) {
      errs.dailyPrice = 'Daily rate must be a valid non-negative number.';
    }
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    const activeImage = customImageUrl.trim() || selectedImage || PRESET_IMAGES[0].url;
    const capacityNum = Math.max(1, parseInt(totalCapacity, 10) || 10);
    const availableNum = Math.min(
      capacityNum,
      Math.max(0, parseInt(availableCapacity, 10) || capacityNum)
    );
    const dailyRateNum = Math.max(0, parseFloat(dailyPrice) || 100);
    const monthlyRateNum = parseFloat(monthlyPrice) || dailyRateNum * 18;
    const yearlyRateNum = parseFloat(yearlyPrice) || monthlyRateNum * 10;

    const newSpace: Space = {
      id: `space-${Date.now()}`,
      name: name.trim(),
      city,
      district: district.trim() || undefined,
      address: address.trim(),
      description: description.trim(),
      type,
      totalCapacity: capacityNum,
      availableCapacity: availableNum,
      pricing: {
        daily: dailyRateNum,
        monthly: monthlyRateNum,
        yearly: yearlyRateNum,
      },
      amenities: selectedAmenities,
      images: [activeImage],
      rating: 5.0,
      reviewCount: 0,
      isVisible: true,
      isFeatured: false,
      openHours: openHours.trim() || 'Sun–Thu: 8:00 AM – 8:00 PM',
      phone: contactPhone.trim(),
      email: contactEmail.trim() || currentUser.email || '',
      ownerId: currentUser.id,
      status: 'published',
    };

    try {
      addSpace(newSpace);
      navigate('company-workspaces');
    } catch (err: any) {
      setErrors({ global: err?.message || 'Failed to create workspace. Please try again.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate('company-workspaces')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-soot/5 hover:bg-soot/10 border border-soot/10 text-xs font-semibold text-soot mb-3 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Company Workspaces</span>
        </button>
        <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display tracking-tight">
          Add Company Workspace
        </h1>
        <p className="text-moss text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
          Register an enterprise office suite, private conference hall, or company branch to make it bookable by your verified teams and departments.
        </p>
      </div>

      {errors.global && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-900 text-sm flex items-center gap-2.5">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{errors.global}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-soot/8">
            <div className="w-8 h-8 rounded-xl bg-soot text-plaster flex items-center justify-center shrink-0">
              <Building2 size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-soot">1. General Information</h2>
              <p className="text-xs text-moss">Specify workspace identification and layout category.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-soot uppercase tracking-wider mb-1.5">
                Workspace Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="e.g., Saudi Tech Innovation Hub - Olaya Suite A"
                className={`w-full px-4 py-2.5 rounded-xl bg-plaster border ${
                  errors.name ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-soot/15 focus-visible:ring-2 focus-visible:ring-eucalyptus'
                } text-soot placeholder:text-moss/60 text-sm shadow-xs transition-all`}
              />
              {errors.name && <p className="text-xs text-rose-600 font-medium mt-1">* {errors.name}</p>}
            </div>

            {/* Type Selection Radio Cards */}
            <div>
              <label className="block text-xs font-semibold text-soot uppercase tracking-wider mb-2">
                Workspace Category <span className="text-rose-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {WORKSPACE_TYPES.map((wt) => {
                  const isSelected = type === wt.type;
                  return (
                    <button
                      key={wt.type}
                      type="button"
                      onClick={() => setType(wt.type)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-eucalyptus-dark bg-eucalyptus/20 shadow-xs ring-1 ring-eucalyptus'
                          : 'border-soot/12 bg-plaster hover:bg-plaster-dark/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-soot">{wt.label}</span>
                        {isSelected && <Check size={14} className="text-emerald-800 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-moss leading-relaxed">{wt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-soot uppercase tracking-wider mb-1.5">
                Overview & Description <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                }}
                placeholder="Describe this corporate workspace, target team capacity, and usage guidelines..."
                className={`w-full px-4 py-2.5 rounded-xl bg-plaster border ${
                  errors.description ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-soot/15 focus-visible:ring-2 focus-visible:ring-eucalyptus'
                } text-soot placeholder:text-moss/60 text-sm shadow-xs transition-all`}
              />
              {errors.description && (
                <p className="text-xs text-rose-600 font-medium mt-1">* {errors.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Location & Address */}
        <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-soot/8">
            <div className="w-8 h-8 rounded-xl bg-soot text-plaster flex items-center justify-center shrink-0">
              <MapPin size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-soot">2. Location & Operating Hours</h2>
              <p className="text-xs text-moss">Where the corporate facility is located.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-soot uppercase tracking-wider mb-1.5">
                City <span className="text-rose-600">*</span>
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-plaster border border-soot/15 text-soot text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-eucalyptus cursor-pointer"
              >
                {SAUDI_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-soot uppercase tracking-wider mb-1.5">
                District / Area
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g., Al Olaya, KAFD, or Al Malqa"
                className="w-full px-4 py-2.5 rounded-xl bg-plaster border border-soot/15 text-soot placeholder:text-moss/60 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-eucalyptus"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-soot uppercase tracking-wider mb-1.5">
                Full Street Address <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
                }}
                placeholder="e.g., King Fahd Road, Tower 2, 14th Floor"
                className={`w-full px-4 py-2.5 rounded-xl bg-plaster border ${
                  errors.address ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-soot/15 focus-visible:ring-2 focus-visible:ring-eucalyptus'
                } text-soot placeholder:text-moss/60 text-sm shadow-xs transition-all`}
              />
              {errors.address && <p className="text-xs text-rose-600 font-medium mt-1">* {errors.address}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-soot uppercase tracking-wider mb-1.5">
                Access & Operating Hours
              </label>
              <input
                type="text"
                value={openHours}
                onChange={(e) => setOpenHours(e.target.value)}
                placeholder="e.g., Sun–Thu: 8:00 AM – 8:00 PM or 24/7 Access"
                className="w-full px-4 py-2.5 rounded-xl bg-plaster border border-soot/15 text-soot placeholder:text-moss/60 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-eucalyptus"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Capacity & Contact */}
        <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-soot/8">
            <div className="w-8 h-8 rounded-xl bg-soot text-plaster flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-soot">3. Seating Capacity & Contact Point</h2>
              <p className="text-xs text-moss">Define capacity quotas and workspace management contact.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-soot uppercase tracking-wider mb-1.5">
                Total Capacity (Seats) <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={totalCapacity}
                onChange={(e) => {
                  setTotalCapacity(e.target.value);
                  setAvailableCapacity(e.target.value);
                  if (errors.totalCapacity) setErrors((prev) => ({ ...prev, totalCapacity: '' }));
                }}
                placeholder="20"
                className={`w-full px-4 py-2.5 rounded-xl bg-plaster border ${
                  errors.totalCapacity ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-soot/15 focus-visible:ring-2 focus-visible:ring-eucalyptus'
                } text-soot text-sm shadow-xs`}
              />
              {errors.totalCapacity && (
                <p className="text-xs text-rose-600 font-medium mt-1">* {errors.totalCapacity}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-soot uppercase tracking-wider mb-1.5">
                Initial Available Seats
              </label>
              <input
                type="number"
                min="0"
                max={totalCapacity || '100'}
                value={availableCapacity}
                onChange={(e) => setAvailableCapacity(e.target.value)}
                placeholder="20"
                className="w-full px-4 py-2.5 rounded-xl bg-plaster border border-soot/15 text-soot text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-eucalyptus"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-soot uppercase tracking-wider mb-1.5">
                Contact Phone
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+966 55 123 4567"
                className="w-full px-4 py-2.5 rounded-xl bg-plaster border border-soot/15 text-soot text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-eucalyptus"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-soot uppercase tracking-wider mb-1.5">
                Contact Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="admin@company.com"
                className="w-full px-4 py-2.5 rounded-xl bg-plaster border border-soot/15 text-soot text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-eucalyptus"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Pricing & Billing Rates */}
        <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-soot/8">
            <div className="w-8 h-8 rounded-xl bg-soot text-plaster flex items-center justify-center shrink-0">
              <DollarSign size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-soot">4. Corporate Billing & Rates</h2>
              <p className="text-xs text-moss">Internal reservation cost or billing allocation rates (SAR).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-soot uppercase tracking-wider mb-1.5">
                Daily Rate (SAR) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={dailyPrice}
                  onChange={(e) => {
                    setDailyPrice(e.target.value);
                    if (errors.dailyPrice) setErrors((prev) => ({ ...prev, dailyPrice: '' }));
                  }}
                  placeholder="120"
                  className={`w-full px-4 py-2.5 rounded-xl bg-plaster border ${
                    errors.dailyPrice ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-soot/15 focus-visible:ring-2 focus-visible:ring-eucalyptus'
                  } text-soot text-sm shadow-xs`}
                />
              </div>
              {errors.dailyPrice && (
                <p className="text-xs text-rose-600 font-medium mt-1">* {errors.dailyPrice}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-soot uppercase tracking-wider mb-1.5">
                Monthly Rate (SAR)
              </label>
              <input
                type="number"
                min="0"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                placeholder="1800"
                className="w-full px-4 py-2.5 rounded-xl bg-plaster border border-soot/15 text-soot text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-eucalyptus"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-soot uppercase tracking-wider mb-1.5">
                Yearly Rate (SAR)
              </label>
              <input
                type="number"
                min="0"
                value={yearlyPrice}
                onChange={(e) => setYearlyPrice(e.target.value)}
                placeholder="18000"
                className="w-full px-4 py-2.5 rounded-xl bg-plaster border border-soot/15 text-soot text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-eucalyptus"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Amenities */}
        <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-soot/8">
            <div className="w-8 h-8 rounded-xl bg-soot text-plaster flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-soot">5. Amenities & Equipment</h2>
              <p className="text-xs text-moss">Select available tools and facilities provided at this workspace.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {AVAILABLE_AMENITIES.map((amenity) => {
              const checked = selectedAmenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer flex items-center justify-between ${
                    checked
                      ? 'border-eucalyptus-dark bg-eucalyptus/25 text-soot font-semibold shadow-xs'
                      : 'border-soot/10 bg-plaster text-moss hover:bg-plaster-dark/40 hover:text-soot'
                  }`}
                >
                  <span>{amenity}</span>
                  {checked ? (
                    <CheckCircle2 size={15} className="text-emerald-800 shrink-0 ml-1.5" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-soot/20 shrink-0 ml-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 6: Workspace Image */}
        <div className="bg-plaster-surface rounded-3xl border border-soot/12 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-soot/8">
            <div className="w-8 h-8 rounded-xl bg-soot text-plaster flex items-center justify-center shrink-0">
              <ImageIcon size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-soot">6. Workspace Photo / Image</h2>
              <p className="text-xs text-moss">Choose a high-res curated photo preset or enter a direct image URL.</p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <span className="block text-xs font-semibold text-soot uppercase tracking-wider mb-2">
              Select Preset Photo:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {PRESET_IMAGES.map((preset) => {
                const isSelected = selectedImage === preset.url && !customImageUrl;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setSelectedImage(preset.url);
                      setCustomImageUrl('');
                    }}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all group cursor-pointer ${
                      isSelected
                        ? 'border-eucalyptus-dark ring-2 ring-eucalyptus shadow-md scale-[1.02]'
                        : 'border-transparent opacity-75 hover:opacity-100 hover:border-soot/20'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-20 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-soot/80 via-transparent to-transparent flex items-end p-1.5">
                      <span className="text-[10px] text-white font-medium truncate">{preset.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom URL Input */}
          <div>
            <label className="block text-xs font-semibold text-soot uppercase tracking-wider mb-1.5">
              Or Custom Image URL
            </label>
            <input
              type="url"
              value={customImageUrl}
              onChange={(e) => setCustomImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-2.5 rounded-xl bg-plaster border border-soot/15 text-soot placeholder:text-moss/60 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-eucalyptus"
            />
          </div>

          {/* Live Preview */}
          <div className="rounded-2xl border border-soot/10 p-3 bg-plaster flex items-center gap-4">
            <img
              src={customImageUrl.trim() || selectedImage}
              alt="Preview"
              className="w-24 h-16 rounded-xl object-cover border border-soot/15 shadow-2xs shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PRESET_IMAGES[0].url;
              }}
            />
            <div className="text-xs">
              <span className="font-semibold text-soot block">Workspace Card Preview</span>
              <span className="text-moss">
                This photograph will be displayed on workspace listings, team cards, and booking vouchers.
              </span>
            </div>
          </div>
        </div>

        {/* Submit & Cancel Footer */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('company-workspaces')}
            className="btn-secondary px-5 py-3 text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary px-7 py-3 text-sm flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
          >
            <Check size={17} />
            <span>{isSubmitting ? 'Registering Workspace...' : 'Save & Publish Workspace'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
