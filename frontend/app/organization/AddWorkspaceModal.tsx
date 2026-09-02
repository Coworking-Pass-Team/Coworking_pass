'use client';

import React, { useState, useRef } from 'react';
import {
  Building2,
  MapPin,
  Users,
  DollarSign,
  Check,
  Plus,
  Trash2,
  Upload,
  X,
  Image as ImageIcon,
  Clock,
  Phone,
  Mail,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { useApp } from '@/app/store';
import { SpaceType } from '@/types/types';
import Modal from '@/components/ui/Modal';

const REGIONS = [
  'Riyadh Region',
  'Makkah Region',
  'Eastern Province',
  'Madinah Region',
  'Asir Region',
  'Qassim Region',
  'Tabuk Region',
  'Jazan Region',
  'Hail Region',
  'Najran Region',
  'Al Bahah Region',
  'Northern Borders Region',
];

const CITIES_BY_REGION: Record<string, string[]> = {
  'Riyadh Region': ['Riyadh', 'Al Kharj', 'Dawadmi', 'Al Majmaah'],
  'Makkah Region': ['Jeddah', 'Makkah', 'Taif', 'Rabigh'],
  'Eastern Province': ['Dammam', 'Khobar', 'Dhahran', 'Jubail', 'Qatif'],
  'Madinah Region': ['Madinah', 'Yanbu', 'Al Ula'],
  'Asir Region': ['Abha', 'Khamis Mushait', 'Bisha'],
  'Qassim Region': ['Buraydah', 'Unaizah', 'Ar Rass'],
  'Tabuk Region': ['Tabuk', 'Al Wajh', 'Haql'],
  'Jazan Region': ['Jazan', 'Sabya', 'Abu Arish'],
  'Hail Region': ['Hail', 'Baqaa', 'Al Shamli'],
  'Najran Region': ['Najran', 'Sharurah'],
  'Al Bahah Region': ['Al Bahah', 'Baljurashi'],
  'Northern Borders Region': ["Ar'ar", 'Rafha', 'Turaif'],
};

const AMENITIES_LIST = [
  'High-Speed WiFi',
  'Parking',
  'Coffee & Tea',
  'Printing',
  'Meeting Rooms',
  'Phone Booths',
  'Reception',
  '24/7 Access',
  'Accessibility',
  'Prayer Room',
  'Locker',
  'Gym Access',
  'Rooftop',
  'Event Space',
  'Bike Storage',
];

const WORKSPACE_TYPES: { type: SpaceType; label: string; desc: string }[] = [
  { type: 'hot-desk', label: 'Hot Desk', desc: 'Flexible open seating, first-come first-served' },
  { type: 'private-office', label: 'Private Office', desc: 'Dedicated enclosed private office' },
  { type: 'meeting-room', label: 'Meeting Room', desc: 'Conference and team collaboration rooms' },
  { type: 'mixed', label: 'Mixed Workspace', desc: 'Combination of desks and offices' },
];

const DEFAULT_WORKSPACE_IMAGES = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=800&fit=crop&auto=format',
];

interface AddWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddWorkspaceModal({ open, onClose, onSuccess }: AddWorkspaceModalProps) {
  const { currentUser, addSpace, showToast } = useApp();

  // Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<SpaceType>('hot-desk');

  // Location
  const [region, setRegion] = useState('Riyadh Region');
  const [city, setCity] = useState('Riyadh');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');

  // Capacity & Amenities
  const [totalCapacity, setTotalCapacity] = useState(25);
  const [availableCapacity, setAvailableCapacity] = useState(25);
  const [amenities, setAmenities] = useState<string[]>([
    'High-Speed WiFi',
    'Coffee & Tea',
    'Parking',
    'Meeting Rooms',
  ]);
  const [openHours, setOpenHours] = useState('Sun–Thu: 8am–9pm');
  const [phone, setPhone] = useState(currentUser?.phone || '+966 11 456 7890');
  const [email, setEmail] = useState(currentUser?.email || 'workspace@company.sa');

  // Pricing
  const [dailyPrice, setDailyPrice] = useState(150);
  const [monthlyPrice, setMonthlyPrice] = useState(1800);
  const [yearlyPrice, setYearlyPrice] = useState(18000);

  // Settings
  const [allowWaitlist, setAllowWaitlist] = useState(true);
  const [autoApproval, setAutoApproval] = useState(true);
  const [publicBooking, setPublicBooking] = useState(true);

  // Images
  const [images, setImages] = useState<string[]>(DEFAULT_WORKSPACE_IMAGES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleAmenity = (a: string) => {
    setAmenities(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image must be under 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    showToast('Image added', 'info');
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setType('hot-desk');
    setRegion('Riyadh Region');
    setCity('Riyadh');
    setDistrict('');
    setAddress('');
    setTotalCapacity(25);
    setAvailableCapacity(25);
    setAmenities(['High-Speed WiFi', 'Coffee & Tea', 'Parking', 'Meeting Rooms']);
    setOpenHours('Sun–Thu: 8am–9pm');
    setPhone(currentUser?.phone || '+966 11 456 7890');
    setEmail(currentUser?.email || 'workspace@company.sa');
    setDailyPrice(150);
    setMonthlyPrice(1800);
    setYearlyPrice(18000);
    setImages(DEFAULT_WORKSPACE_IMAGES);
    setErrors({});
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Workspace name is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!city.trim()) newErrors.city = 'City is required';
    if (!address.trim()) newErrors.address = 'Address is required';
    if (totalCapacity <= 0) newErrors.totalCapacity = 'Total capacity must be at least 1';
    if (!phone.trim()) newErrors.phone = 'Contact phone is required';
    if (!email.trim()) newErrors.email = 'Contact email is required';
    if (dailyPrice <= 0) newErrors.dailyPrice = 'Daily price must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (asDraft: boolean = false) => {
    if (!validate()) {
      showToast('Please fill all required fields correctly', 'error');
      return;
    }

    if (!currentUser) return;

    setIsSubmitting(true);
    setTimeout(() => {
      addSpace({
        name: name.trim(),
        description: description.trim(),
        type,
        city: city.trim(),
        region: region.trim(),
        district: district.trim(),
        address: address.trim(),
        images: images.length > 0 ? images : DEFAULT_WORKSPACE_IMAGES,
        amenities,
        totalCapacity,
        availableCapacity: Math.min(availableCapacity, totalCapacity),
        pricing: {
          daily: dailyPrice,
          monthly: monthlyPrice,
          yearly: yearlyPrice,
        },
        rating: 4.8,
        reviewCount: 0,
        isVisible: !asDraft,
        isFeatured: false,
        openHours,
        phone: phone.trim(),
        email: email.trim(),
        ownerId: currentUser.id,
        status: asDraft ? 'draft' : 'published',
      });

      setIsSubmitting(false);
      resetForm();
      onClose();
      showToast(asDraft ? 'Workspace saved as draft' : 'Workspace created successfully!', 'success');
      if (onSuccess) onSuccess();
    }, 300);
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New Workspace" size="xl">
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSubmit(false);
        }}
        className="space-y-6"
      >
        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-soot/8">
            <Building2 size={16} className="text-moss" />
            <h4 className="text-sm font-semibold text-soot uppercase tracking-wider">
              Basic Information
            </h4>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
              <span>Workspace Name <span className="text-red-500">*</span></span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Required</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. KAFD Innovation Hub"
              className={`w-full px-4 py-3 rounded-2xl border text-sm text-soot outline-none transition-all font-normal ${
                errors.name
                  ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-200'
                  : 'border-soot/12 bg-white focus:border-eucalyptus focus:ring-2 focus:ring-eucalyptus/20'
              }`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1 font-normal">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
              Workspace Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {WORKSPACE_TYPES.map(wt => {
                const active = type === wt.type;
                return (
                  <button
                    key={wt.type}
                    type="button"
                    onClick={() => setType(wt.type)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-[#DDE6DF] border-soot/20 text-soot shadow-xs'
                        : 'bg-[#F9F8F5] border-soot/8 text-moss hover:border-soot/20'
                    }`}
                  >
                    <div className="text-xs font-semibold text-soot mb-0.5">{wt.label}</div>
                    <div className="text-[10px] text-moss/80 line-clamp-2 leading-tight">{wt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5 flex items-center justify-between">
              <span>Description <span className="text-red-500">*</span></span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Required</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the workspace ambiance, ergonomic seating, high-speed amenities, and location advantages..."
              className={`w-full px-4 py-3 rounded-2xl border text-sm text-soot outline-none transition-all font-normal resize-none ${
                errors.description
                  ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-200'
                  : 'border-soot/12 bg-white focus:border-eucalyptus focus:ring-2 focus:ring-eucalyptus/20'
              }`}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1 font-normal">{errors.description}</p>}
          </div>
        </div>

        {/* Section 2: Location & Address */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-soot/8">
            <MapPin size={16} className="text-moss" />
            <h4 className="text-sm font-semibold text-soot uppercase tracking-wider">
              Location & Address
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
                Region <span className="text-red-500">*</span>
              </label>
              <select
                value={region}
                onChange={e => {
                  setRegion(e.target.value);
                  setCity(CITIES_BY_REGION[e.target.value]?.[0] || 'Riyadh');
                }}
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
              >
                {REGIONS.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
                City <span className="text-red-500">*</span>
              </label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
              >
                {(CITIES_BY_REGION[region] || ['Riyadh', 'Jeddah', 'Dammam']).map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
                District / Neighborhood
              </label>
              <input
                type="text"
                value={district}
                onChange={e => setDistrict(e.target.value)}
                placeholder="e.g. Al Olaya, KAFD, Al Rawdah"
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
                Full Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. Building 4, Floor 2, King Fahd Rd"
                className={`w-full px-4 py-3 rounded-2xl border text-sm text-soot outline-none transition-all font-normal ${
                  errors.address
                    ? 'border-red-400 bg-red-50/20'
                    : 'border-soot/12 bg-white focus:border-eucalyptus'
                }`}
              />
              {errors.address && <p className="text-red-500 text-xs mt-1 font-normal">{errors.address}</p>}
            </div>
          </div>
        </div>

        {/* Section 3: Capacity, Opening Hours & Contact */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-soot/8">
            <Users size={16} className="text-moss" />
            <h4 className="text-sm font-semibold text-soot uppercase tracking-wider">
              Capacity & Contact
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
                Total Capacity (Seats) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={totalCapacity}
                onChange={e => {
                  const val = parseInt(e.target.value) || 1;
                  setTotalCapacity(val);
                  setAvailableCapacity(Math.min(availableCapacity, val));
                }}
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
                Available Capacity
              </label>
              <input
                type="number"
                min="0"
                max={totalCapacity}
                value={availableCapacity}
                onChange={e => {
                  const val = parseInt(e.target.value) || 0;
                  setAvailableCapacity(Math.min(val, totalCapacity));
                }}
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
                Opening Hours
              </label>
              <input
                type="text"
                value={openHours}
                onChange={e => setOpenHours(e.target.value)}
                placeholder="Sun–Thu: 8am–9pm"
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+966 11 456 7890"
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
                Contact Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="workspace@company.sa"
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Pricing (SAR) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-soot/8">
            <DollarSign size={16} className="text-moss" />
            <h4 className="text-sm font-semibold text-soot uppercase tracking-wider">
              Pricing Rates (SAR)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
                Daily Rate (SAR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={dailyPrice}
                onChange={e => setDailyPrice(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
                Monthly Rate (SAR)
              </label>
              <input
                type="number"
                min="1"
                value={monthlyPrice}
                onChange={e => setMonthlyPrice(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-moss mb-1.5">
                Yearly Rate (SAR)
              </label>
              <input
                type="number"
                min="1"
                value={yearlyPrice}
                onChange={e => setYearlyPrice(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-2xl border border-soot/12 bg-white text-sm text-soot outline-none focus:border-eucalyptus font-normal"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Amenities */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-soot/8">
            <Sparkles size={16} className="text-moss" />
            <h4 className="text-sm font-semibold text-soot uppercase tracking-wider">
              Included Amenities
            </h4>
          </div>

          <div className="flex flex-wrap gap-2">
            {AMENITIES_LIST.map(amenity => {
              const active = amenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#DDE6DF] border-soot/15 text-soot shadow-2xs'
                      : 'bg-[#F9F8F5] border-soot/8 text-moss hover:border-soot/20'
                  }`}
                >
                  {active && <Check size={12} className="text-soot shrink-0" />}
                  <span>{amenity}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 6: Workspace Photos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-soot/8">
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className="text-moss" />
              <h4 className="text-sm font-semibold text-soot uppercase tracking-wider">
                Workspace Photos ({images.length})
              </h4>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] text-xs font-medium border border-soot/8 cursor-pointer shadow-xs"
            >
              <Upload size={13} />
              <span>Upload Photo</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative h-24 rounded-2xl overflow-hidden border border-soot/10 group"
              >
                <img src={imgUrl} alt={`workspace ${idx}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer"
                  title="Remove image"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-soot/8">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 py-3 px-6 rounded-full border border-soot/15 hover:bg-soot/5 text-soot text-sm font-medium transition-colors cursor-pointer inline-flex items-center justify-center whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="hidden sm:inline-flex flex-1 h-12 py-3 px-6 rounded-full border border-soot/15 hover:bg-soot/5 text-soot text-sm font-medium transition-colors cursor-pointer items-center justify-center whitespace-nowrap"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-12 py-3 px-6 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] disabled:opacity-60 text-sm font-medium transition-all shadow-xs border border-soot/8 inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            {isSubmitting ? (
              <span>Creating...</span>
            ) : (
              <>
                <Plus size={16} className="shrink-0" />
                <span>Create Workspace</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
