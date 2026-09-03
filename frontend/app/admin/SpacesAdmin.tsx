'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  MapPin,
  Star,
  AlertCircle,
  Check,
  ChevronDown,
  Building2,
  X,
  Upload,
} from 'lucide-react';
import { useApp } from '@/app/store';
import { Space } from '@/types/types';

const AMENITY_OPTIONS = [
  'WiFi',
  'Coffee',
  'Printer',
  'Parking',
  'Prayer Room',
  'Lounge',
  'Showers',
  'Kitchen',
  'Meeting Rooms',
  'Reception',
  'Event Space',
];

const CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Madinah', 'Makkah'];
const TYPES: { value: Space['type']; label: string }[] = [
  { value: 'hot-desk', label: 'Hot Desk' },
  { value: 'private-office', label: 'Private Office' },
  { value: 'meeting-room', label: 'Meeting Room' },
  { value: 'mixed', label: 'Mixed Space' },
];

const emptyForm = (): Partial<Space> => ({
  name: '',
  city: 'Riyadh',
  address: '',
  description: '',
  type: 'mixed',
  amenities: [],
  totalCapacity: 20,
  availableCapacity: 20,
  pricing: { daily: 100, monthly: 1200, yearly: 12000 },
  rating: 4.5,
  reviewCount: 0,
  isVisible: true,
  isFeatured: false,
  openHours: 'Sun–Thu: 8am–9pm',
  phone: '',
  email: '',
  images: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&auto=format',
  ],
});

export default function SpacesAdmin() {
  const { spaces, addSpace, updateSpace, toggleSpaceVisibility, deleteSpace, navigate } = useApp();
  const [query, setQuery] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modal Dropdowns
  const [modalCityOpen, setModalCityOpen] = useState(false);
  const [modalTypeOpen, setModalTypeOpen] = useState(false);
  const modalCityRef = useRef<HTMLDivElement>(null);
  const modalTypeRef = useRef<HTMLDivElement>(null);

  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [form, setForm] = useState<Partial<Space>>(emptyForm());
  const [saved, setSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setForm((p) => ({
      ...p,
      images: [...(p.images || []), imageUrlInput.trim()],
    }));
    setImageUrlInput('');
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setForm((p) => ({
          ...p,
          images: [...(p.images || []), reader.result as string],
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setForm((p) => ({
      ...p,
      images: (p.images || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (modalCityRef.current && !modalCityRef.current.contains(event.target as Node)) {
        setModalCityOpen(false);
      }
      if (modalTypeRef.current && !modalTypeRef.current.contains(event.target as Node)) {
        setModalTypeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = spaces.filter((s) => {
    const q = query.trim().toLowerCase();
    if (q && !s.name.toLowerCase().includes(q) && !s.city.toLowerCase().includes(q)) return false;
    if (filterCity && s.city !== filterCity) return false;
    return true;
  });

  const openAdd = () => {
    setEditingSpace(null);
    setForm(emptyForm());
    setEditModal(true);
    setSaved(false);
  };

  const openEdit = (e: React.MouseEvent, space: Space) => {
    e.stopPropagation();
    setEditingSpace(space);
    setForm({ ...space });
    setEditModal(true);
    setSaved(false);
  };

  const handleSave = () => {
    if (!form.name || !form.city || !form.address) return;
    if (editingSpace) {
      updateSpace(editingSpace.id, form as Space);
    } else {
      addSpace(form as Omit<Space, 'id'>);
    }
    setSaved(true);
    setTimeout(() => {
      setEditModal(false);
      setSaved(false);
    }, 900);
  };

  const handleDelete = (e: React.MouseEvent, space: Space) => {
    e.stopPropagation();
    setSpaceToDelete(space);
    setDeleteModal(true);
  };

  const handleToggleVisibility = (e: React.MouseEvent, spaceId: string) => {
    e.stopPropagation();
    toggleSpaceVisibility(spaceId);
  };

  const toggleAmenity = (amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities?.includes(amenity)
        ? prev.amenities.filter((item) => item !== amenity)
        : [...(prev.amenities || []), amenity],
    }));
  };

  const setPrice = (field: 'daily' | 'monthly' | 'yearly', val: number) => {
    setForm((prev) => ({
      ...prev,
      pricing: {
        daily: prev.pricing?.daily ?? 0,
        monthly: prev.pricing?.monthly ?? 0,
        yearly: prev.pricing?.yearly ?? 0,
        [field]: Number.isNaN(val) ? 0 : val,
      },
    }));
  };

  const visibleCount = spaces.filter((s) => s.isVisible).length;
  const hiddenCount = spaces.filter((s) => !s.isVisible).length;
  const fullyBookedCount = spaces.filter((s) => s.availableCapacity === 0).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-moss block mb-1">
            Workspace Catalog
          </span>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
            Manage Spaces
          </h1>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="btn-primary"
        >
          <Plus size={17} className="text-[#FAF8F5]/80" />
          <span>Add space</span>
        </button>
      </div>

      {/* Premium Elevated Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Spaces',
            count: spaces.length,
            badge: 'bg-soot/10 text-soot border border-soot/15',
            icon: Building2,
            iconBg: 'bg-soot text-plaster border-soot/20',
          },
          {
            label: 'Visible Listings',
            count: visibleCount,
            badge: 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
            icon: Eye,
            iconBg: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
          },
          {
            label: 'Hidden Spaces',
            count: hiddenCount,
            badge: 'bg-amber-500/15 text-amber-800 border border-amber-500/30',
            icon: EyeOff,
            iconBg: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
          },
          {
            label: 'Fully Booked',
            count: fullyBookedCount,
            badge: 'bg-red-500/15 text-red-700 border border-red-500/30',
            icon: AlertCircle,
            iconBg: 'bg-red-500/15 text-red-700 border-red-500/30',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-plaster-surface rounded-3xl border border-soot/12 p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${stat.iconBg}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <div className="text-3xl font-normal text-soot tracking-tight font-serif-display">{stat.count}</div>
                <div className="text-xs font-medium text-moss mt-0.5">{stat.label}</div>
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-2xs ${stat.badge}`}>
              {Math.round((stat.count / (spaces.length || 1)) * 100)}%
            </span>
          </div>
        ))}
      </div>

      {/* Search & Custom City Dropdown Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-plaster-surface p-3 rounded-2xl border border-soot/10 shadow-2xs relative z-30">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-moss" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by space name or city..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-soot/12 bg-plaster-dark/30 text-soot text-sm placeholder:text-moss/70 outline-none focus:border-eucalyptus focus:bg-plaster-surface transition-all"
          />
        </div>

        {/* Custom City Dropdown */}
        <div className="relative min-w-52" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-plaster-dark/30 hover:bg-plaster-dark/50 border border-soot/12 transition-all duration-200 text-left cursor-pointer focus:outline-none"
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <MapPin size={16} className="text-moss shrink-0" />
              <span className="text-sm font-medium text-soot truncate">
                {filterCity || 'All Cities'}
              </span>
            </div>
            <ChevronDown
              size={15}
              className={`text-moss transition-transform duration-200 shrink-0 ${
                dropdownOpen ? 'rotate-180 text-soot' : ''
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {['All Cities', ...CITIES].map((city) => {
                  const isSelected = (city === 'All Cities' && !filterCity) || filterCity === city;
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setFilterCity(city === 'All Cities' ? '' : city);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 text-left cursor-pointer focus:outline-none ${
                        isSelected
                          ? 'bg-soot text-plaster font-semibold'
                          : 'text-soot hover:bg-plaster-dark/60 hover:text-soot'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-eucalyptus' : 'bg-transparent'
                          }`}
                        />
                        <span>{city}</span>
                      </div>
                      {isSelected && <Check size={14} className="text-eucalyptus" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Harmonized Table Layout with Clickable Rows */}
      <div className="bg-plaster-surface rounded-3xl border border-soot/10 overflow-hidden shadow-2xs relative z-10">
        <div className="hidden md:grid grid-cols-12 gap-6 px-6 py-4 border-b border-soot/10 text-xs font-semibold uppercase tracking-wider text-moss bg-plaster-dark/40 items-center">
          <div className="col-span-5">Space Name</div>
          <div className="col-span-2">City</div>
          <div className="col-span-2">Capacity</div>
          <div className="col-span-2">Daily Price</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        <div className="divide-y divide-soot/8">
          {filtered.map((space) => {
            const occupancyRatio =
              space.totalCapacity > 0 ? (space.availableCapacity / space.totalCapacity) * 100 : 0;

            return (
              <div
                key={space.id}
                onClick={() => navigate('space-details', { spaceId: space.id })}
                className="px-6 py-4 hover:bg-plaster-dark/30 transition-colors flex flex-col md:grid md:grid-cols-12 md:gap-6 md:items-center cursor-pointer group"
              >
                {/* Space Name & Thumbnail */}
                <div className="col-span-5 flex items-center gap-3.5 min-w-0">
                  <img
                    src={space.images[0]}
                    alt={space.name}
                    className="w-11 h-11 rounded-xl object-cover border border-soot/10 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-soot group-hover:text-emerald-900 transition-colors truncate">
                        {space.name}
                      </span>
                      {!space.isVisible && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-red-500/10 text-red-700 shrink-0">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-moss mt-1 font-medium">
                      <span className="flex items-center gap-1 text-soot">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {space.rating}
                      </span>
                      <span>·</span>
                      <span className="capitalize">{space.type.replace('-', ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* City */}
                <div className="col-span-2 mt-2 md:mt-0 text-sm text-soot font-medium flex items-center gap-1.5">
                  <MapPin size={14} className="text-moss shrink-0" />
                  <span className="truncate">{space.city}</span>
                </div>

                {/* Capacity */}
                <div className="col-span-2 mt-3 md:mt-0 flex flex-col justify-center">
                  <div className="flex items-center gap-1 text-xs text-moss mb-1.5 font-medium">
                    <span className="font-semibold text-soot text-sm leading-none">
                      {space.availableCapacity}
                    </span>
                    <span>/ {space.totalCapacity}</span>
                  </div>
                  <div className="w-full max-w-[120px] h-2 bg-soot/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        space.availableCapacity === 0
                          ? 'bg-red-500'
                          : space.availableCapacity <= 5
                          ? 'bg-amber-500'
                          : 'bg-[#40534C]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, occupancyRatio))}%` }}
                    />
                  </div>
                </div>

                {/* Daily Price */}
                <div className="col-span-2 mt-3 md:mt-0 text-sm font-semibold text-soot">
                  SAR {space.pricing.daily.toLocaleString()}
                  <span className="text-xs text-moss font-normal ml-1">/ day</span>
                </div>

                {/* Actions */}
                <div className="col-span-1 mt-4 md:mt-0 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={(e) => openEdit(e, space)}
                    className="p-2 rounded-xl text-moss hover:text-soot hover:bg-plaster-surface border border-transparent hover:border-soot/10 transition-all cursor-pointer"
                    title="Edit Space"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleToggleVisibility(e, space.id)}
                    className="p-2 rounded-xl text-moss hover:text-soot hover:bg-plaster-surface border border-transparent hover:border-soot/10 transition-all cursor-pointer"
                    title={space.isVisible ? 'Hide Space' : 'Make Visible'}
                  >
                    {space.isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, space)}
                    className="p-2 rounded-xl text-moss hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer"
                    title="Delete Space"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-moss">
            <Building2 size={40} className="mx-auto mb-3 text-moss/50" />
            <div className="text-base font-medium text-soot">No spaces found</div>
            <p className="text-xs text-moss mt-1">Try changing your search terms or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Modern Add / Edit Workspace Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-soot/70 backdrop-blur-sm transition-opacity"
            onClick={() => setEditModal(false)}
          />

          <div className="relative w-full max-w-2xl bg-plaster-surface rounded-3xl shadow-2xl border border-soot/15 overflow-hidden z-10 flex flex-col max-h-[88vh]">
            <div className="px-6 sm:px-8 py-5 border-b border-soot/10 flex items-center justify-between bg-plaster-dark/30 shrink-0">
              <div>
                <h3 className="text-xl font-serif-display font-medium text-soot">
                  {editingSpace ? 'Edit Workspace' : 'Add New Workspace'}
                </h3>
                <p className="text-xs text-moss mt-0.5">Configure details, amenities, and visibility options.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditModal(false)}
                className="p-2 rounded-full text-moss hover:text-soot hover:bg-soot/8 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              {saved && (
                <div className="flex items-center gap-2.5 bg-eucalyptus/25 border border-eucalyptus text-soot rounded-2xl px-4 py-3 text-sm font-semibold shadow-xs">
                  <Check size={16} className="text-moss" />
                  <span>{editingSpace ? 'Workspace updated successfully!' : 'New workspace published successfully!'}</span>
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
                      value={form.name || ''}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Olaya Hub"
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
                      value={form.address || ''}
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
                      value={form.description || ''}
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
                        {TYPES.find((t) => t.value === (form.type || 'mixed'))?.label || 'Mixed Space'}
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
                      value={form.totalCapacity || 20}
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
                        value={form.pricing?.[plan] || 0}
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
                    const selected = form.amenities?.includes(item);
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

              {/* Workspace Photos Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-soot/10 pb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-moss">
                    Workspace Photos & Images
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDE6DF] text-soot hover:bg-[#D0DDD3] text-xs font-semibold border border-soot/8 cursor-pointer shadow-2xs"
                  >
                    <Upload size={13} />
                    <span>Upload Photo</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Add Image via URL */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={e => setImageUrlInput(e.target.value)}
                    placeholder="Or paste image URL (e.g. https://...)"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-soot/15 bg-white text-soot text-xs outline-none focus:border-soot shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="btn-secondary text-xs px-3.5 py-2"
                  >
                    Add URL
                  </button>
                </div>

                {/* Images Preview Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {(form.images || []).map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative h-24 rounded-2xl overflow-hidden border border-soot/12 group shadow-2xs"
                    >
                      <img src={imgUrl} alt={`workspace ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer"
                        title="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visibility Options */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-plaster-dark/40 border border-soot/12">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isVisible ?? true}
                    onChange={(e) => setForm((p) => ({ ...p, isVisible: e.target.checked }))}
                    className="w-4 h-4 rounded accent-soot cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-semibold text-soot">Visible to Members</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured ?? false}
                    onChange={(e) => setForm((p) => ({ ...p, isFeatured: e.target.checked }))}
                    className="w-4 h-4 rounded accent-soot cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-semibold text-soot">Feature on Highlights</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 sm:px-8 py-4 border-t border-soot/10 bg-plaster-dark/30 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn-primary"
              >
                {editingSpace ? 'Save Changes' : 'Publish Space'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="fixed inset-0 bg-soot/70 backdrop-blur-sm" onClick={() => setDeleteModal(false)} />
          <div className="relative w-full max-w-md bg-plaster-surface rounded-3xl shadow-2xl border border-soot/15 p-6 z-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-soot mb-1 font-serif-display">
                  Delete Space Permanently?
                </h3>
                <p className="text-xs text-moss leading-relaxed">
                  Are you sure you want to remove <strong className="text-soot">{spaceToDelete?.name}</strong>? All associated records will be removed.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (spaceToDelete) deleteSpace(spaceToDelete.id);
                  setDeleteModal(false);
                  setSpaceToDelete(null);
                }}
                className="btn-danger flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
