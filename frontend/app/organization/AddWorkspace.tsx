'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Building2, X } from 'lucide-react';
import { useApp } from '@/app/store';
import { SpaceType } from '@/types';

const CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Madinah', 'Makkah', 'Abha', 'Tabuk'];

const TYPES: { value: SpaceType; label: string }[] = [
  { value: 'hot-desk', label: 'Hot Desk' },
  { value: 'private-office', label: 'Private Office' },
  { value: 'meeting-room', label: 'Meeting Room' },
  { value: 'mixed', label: 'Mixed Space' },
];

const AMENITY_OPTIONS = [
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
];

export interface AddWorkspaceProps {
  onCloseModal?: () => void;
}

export default function AddWorkspace({ onCloseModal }: AddWorkspaceProps = {}) {
  const { currentUser, navigate, addSpace, showToast } = useApp();
  if (!currentUser) return null;

  const [form, setForm] = useState({
    name: '',
    city: 'Riyadh',
    address: '',
    description: '',
    type: 'hot-desk' as SpaceType,
    totalCapacity: 20,
    availableCapacity: 20,
    pricing: { daily: 150, monthly: 1800, yearly: 18000 },
    amenities: ['High-Speed WiFi', 'Coffee & Tea', 'Parking'] as string[],
    isVisible: true,
    isFeatured: false,
  });

  const [saved, setSaved] = useState(false);
  const [modalCityOpen, setModalCityOpen] = useState(false);
  const [modalTypeOpen, setModalTypeOpen] = useState(false);

  const modalCityRef = useRef<HTMLDivElement>(null);
  const modalTypeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalCityRef.current && !modalCityRef.current.contains(e.target as Node)) {
        setModalCityOpen(false);
      }
      if (modalTypeRef.current && !modalTypeRef.current.contains(e.target as Node)) {
        setModalTypeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClose = () => {
    if (onCloseModal) {
      onCloseModal();
    } else {
      navigate('company-workspaces');
    }
  };

  const toggleAmenity = (item: string) => {
    setForm((p) => {
      const exists = p.amenities.includes(item);
      return {
        ...p,
        amenities: exists ? p.amenities.filter((a) => a !== item) : [...p.amenities, item],
      };
    });
  };

  const setPrice = (plan: 'daily' | 'monthly' | 'yearly', val: number) => {
    setForm((p) => ({
      ...p,
      pricing: { ...p.pricing, [plan]: val },
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      showToast('Please enter a space name', 'error');
      return;
    }
    if (!form.address.trim()) {
      showToast('Please enter a full address', 'error');
      return;
    }

    const defaultImages = [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=800&fit=crop&auto=format',
    ];

    addSpace({
      name: form.name,
      city: form.city,
      district: form.city + ' Center',
      region: form.city + ' Region',
      address: form.address,
      description: form.description || 'Modern flexible workspace designed for corporate teams and remote professionals.',
      type: form.type,
      totalCapacity: form.totalCapacity,
      availableCapacity: form.totalCapacity,
      pricing: form.pricing,
      amenities: form.amenities,
      images: defaultImages,
      ownerId: currentUser.id,
      rating: 4.9,
      reviewCount: 1,
      isVisible: form.isVisible,
      isFeatured: form.isFeatured,
      status: 'published',
      openHours: 'Sun–Thu: 8:00 AM – 9:00 PM',
      phone: currentUser.phone || '+966 11 000 0000',
      email: currentUser.email || 'info@coworkingpass.sa',
    });

    setSaved(true);
    showToast('New workspace published successfully!', 'success');
    setTimeout(() => {
      handleClose();
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {saved && (
        <div className="flex items-center gap-2.5 bg-eucalyptus/25 border border-eucalyptus text-soot rounded-2xl px-4 py-3 text-sm font-semibold shadow-xs">
          <Check size={16} className="text-moss" />
          <span>New workspace published successfully!</span>
        </div>
      )}

      <div className="space-y-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-moss block border-b border-soot/10 pb-1.5">
          General Details
        </span>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-soot mb-1.5">Space Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Olaya Business Hub"
              className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 bg-white text-soot text-sm placeholder:text-moss/60 outline-none focus:border-soot transition-all shadow-2xs"
            />
          </div>

          {/* Custom Styled City Dropdown */}
          <div className="relative" ref={modalCityRef}>
            <label className="block text-xs font-semibold text-soot mb-1.5">City *</label>
            <button
              type="button"
              onClick={() => setModalCityOpen(!modalCityOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-soot/15 bg-white hover:bg-plaster-dark/30 text-soot text-sm text-left transition-all cursor-pointer focus:outline-none shadow-2xs"
            >
              <span className="truncate">{form.city || 'Select City'}</span>
              <ChevronDown size={14} className={`text-moss transition-transform ${modalCityOpen ? 'rotate-180' : ''}`} />
            </button>

            {modalCityOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 p-1 bg-white border border-soot/15 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                {CITIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setForm((p) => ({ ...p, city: c }));
                      setModalCityOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                      form.city === c ? 'bg-soot text-plaster' : 'text-soot hover:bg-plaster-dark/50'
                    }`}
                  >
                    <span>{c}</span>
                    {form.city === c && <Check size={12} className="text-eucalyptus" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-soot mb-1.5">Full Address *</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              placeholder="District, Street Name, Building Number"
              className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 bg-white text-soot text-sm placeholder:text-moss/60 outline-none focus:border-soot transition-all shadow-2xs"
            />
          </div>

          {/* Expanded Description */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-soot mb-1.5">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Write a comprehensive description about the workspace, ambiance, facilities, and unique perks..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 bg-white text-soot text-sm placeholder:text-moss/60 outline-none focus:border-soot transition-all resize-y shadow-2xs"
            />
          </div>

          {/* Custom Styled Workspace Type Dropdown */}
          <div className="relative" ref={modalTypeRef}>
            <label className="block text-xs font-semibold text-soot mb-1.5">Workspace Type</label>
            <button
              type="button"
              onClick={() => setModalTypeOpen(!modalTypeOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-soot/15 bg-white hover:bg-plaster-dark/30 text-soot text-sm text-left transition-all cursor-pointer focus:outline-none shadow-2xs"
            >
              <span className="capitalize truncate">
                {TYPES.find((t) => t.value === form.type)?.label || 'Mixed Space'}
              </span>
              <ChevronDown size={14} className={`text-moss transition-transform ${modalTypeOpen ? 'rotate-180' : ''}`} />
            </button>

            {modalTypeOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 p-1 bg-white border border-soot/15 rounded-xl shadow-xl z-50">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setForm((p) => ({ ...p, type: t.value }));
                      setModalTypeOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                      form.type === t.value ? 'bg-soot text-plaster' : 'text-soot hover:bg-plaster-dark/50'
                    }`}
                  >
                    <span>{t.label}</span>
                    {form.type === t.value && <Check size={12} className="text-eucalyptus" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-soot mb-1.5">Total Capacity (Desks)</label>
            <input
              type="number"
              value={form.totalCapacity}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  totalCapacity: +e.target.value,
                  availableCapacity: +e.target.value,
                }))
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 bg-white text-soot text-sm outline-none focus:border-soot transition-all shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="space-y-3 pt-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-moss block border-b border-soot/10 pb-1.5">
          Pricing Plans (SAR)
        </span>
        <div className="grid grid-cols-3 gap-3">
          {(['daily', 'monthly', 'yearly'] as const).map((plan) => (
            <div key={plan} className="space-y-1">
              <span className="block text-[10px] font-bold text-moss uppercase tracking-wider">{plan}</span>
              <input
                type="number"
                value={form.pricing[plan]}
                onChange={(e) => setPrice(plan, +e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-soot/15 bg-white text-soot text-sm font-semibold outline-none focus:border-soot shadow-2xs"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div className="space-y-3 pt-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-moss block border-b border-soot/10 pb-1.5">
          Available Amenities
        </span>
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map((item) => {
            const selected = form.amenities.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleAmenity(item)}
                className={`text-xs px-3.5 py-1.5 rounded-xl border font-medium transition-all cursor-pointer ${
                  selected
                    ? 'bg-soot border-soot text-plaster shadow-xs'
                    : 'bg-white border-soot/15 text-soot hover:border-soot/30 hover:bg-plaster-dark/30'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visibility Options */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-plaster-dark/40 border border-soot/12">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isVisible}
            onChange={(e) => setForm((p) => ({ ...p, isVisible: e.target.checked }))}
            className="w-4 h-4 rounded accent-soot cursor-pointer"
          />
          <span className="text-xs sm:text-sm font-semibold text-soot">Visible to Members</span>
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => setForm((p) => ({ ...p, isFeatured: e.target.checked }))}
            className="w-4 h-4 rounded accent-soot cursor-pointer"
          />
          <span className="text-xs sm:text-sm font-semibold text-soot">Feature on Highlights</span>
        </label>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-soot/10 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleClose}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="btn-primary"
        >
          Publish Space
        </button>
      </div>
    </div>
  );
}
