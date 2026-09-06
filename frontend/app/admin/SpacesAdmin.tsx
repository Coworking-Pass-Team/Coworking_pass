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
  Presentation,
  Clapperboard,
} from 'lucide-react';
import { useApp } from '@/app/store';
import { Space, SpaceBookingPackage, SpaceCategory, ALL_SPACE_TYPES, isHourlyOnlySpace, isOfficeSpace, isHourlyAllowed, getSpaceCategory } from '@/types/types';

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
  '4K Projector',
  'Sound System',
  'Interactive Smartboard',
  'Auditorium Seating',
];

const CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Madinah', 'Makkah'];
const TYPES = ALL_SPACE_TYPES;

const emptyForm = (): Partial<Space> => ({
  name: '',
  city: 'Riyadh',
  address: '',
  description: '',
  type: 'mixed',
  bookingMode: 'subscription',
  bookingPackages: [],
  amenities: [],
  totalCapacity: 20,
  availableCapacity: 20,
  pricing: {
    hourly: 45,
    hourlyTiers: [
      { hours: 1, price: 45 },
      { hours: 2, price: 80 },
      { hours: 3, price: 110 },
      { hours: 4, price: 140 },
      { hours: 6, price: 180 },
      { hours: 8, price: 220 },
    ],
    daily: 150,
    monthly: 1800,
    monthlyTiers: [
      { months: 1, price: 1800 },
      { months: 2, price: 3400 },
      { months: 3, price: 5000 },
      { months: 6, price: 9500 },
      { months: 12, price: 18000 },
    ],
    yearly: 18000,
  },
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
  const [categoryFilter, setCategoryFilter] = useState<'all' | SpaceCategory>('all');
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
    if (categoryFilter !== 'all' && getSpaceCategory(s) !== categoryFilter) return false;
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

  const handleTypeChange = (type: Space['type']) => {
    const hourly = isHourlyOnlySpace(type);
    setForm((prev) => ({
      ...prev,
      type,
      bookingMode: hourly ? 'hourly' : 'subscription',
      bookingPackages: hourly
        ? (prev.bookingPackages?.length
            ? prev.bookingPackages
            : [{ id: `package-${Date.now()}`, name: '2 hours per day', period: 'day', hours: 2, price: 100 }])
        : [],
    }));
  };

  const updatePackage = (index: number, updates: Partial<SpaceBookingPackage>) => {
    setForm((prev) => {
      const packages = [...(prev.bookingPackages || [])];
      packages[index] = { ...packages[index], ...updates };
      return { ...prev, bookingPackages: packages };
    });
  };

  const addPackage = () => {
    setForm((prev) => ({
      ...prev,
      bookingPackages: [
        ...(prev.bookingPackages || []),
        { id: `package-${Date.now()}`, name: '', period: 'day', hours: 2, price: 0 },
      ],
    }));
  };

  const removePackage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      bookingPackages: (prev.bookingPackages || []).filter((_, i) => i !== index),
    }));
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

  const [customAmenityInput, setCustomAmenityInput] = useState('');

  const toggleAmenity = (amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities?.includes(amenity)
        ? prev.amenities.filter((item) => item !== amenity)
        : [...(prev.amenities || []), amenity],
    }));
  };

  const handleAddCustomAmenity = () => {
    const trimmed = customAmenityInput.trim();
    if (!trimmed) return;
    const current = form.amenities || [];
    const exists = current.some((a) => a.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      setForm((prev) => ({
        ...prev,
        amenities: [...(prev.amenities || []), trimmed],
      }));
    } else {
      if (!current.includes(trimmed)) {
        const match = current.find((a) => a.toLowerCase() === trimmed.toLowerCase()) || trimmed;
        setForm((prev) => ({
          ...prev,
          amenities: [...(prev.amenities || []), match],
        }));
      }
    }
    setCustomAmenityInput('');
  };

  const handleRemoveCustomAmenity = (amenityToRemove: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: (prev.amenities || []).filter((a) => a !== amenityToRemove),
    }));
  };

  const setPrice = (field: 'hourly' | 'daily' | 'monthly' | 'yearly', val: number) => {
    setForm((prev) => {
      const currentPricing = prev.pricing || { daily: 150, monthly: 1800, yearly: 18000 };
      const updatedPricing = { ...currentPricing, [field]: Number.isNaN(val) ? 0 : val };
      if (field === 'hourly') {
        const base = val || 45;
        updatedPricing.hourlyTiers = [
          { hours: 1, price: base },
          { hours: 2, price: Math.round(base * 1.8) },
          { hours: 3, price: Math.round(base * 2.5) },
          { hours: 4, price: Math.round(base * 3.1) },
          { hours: 6, price: Math.round(base * 4.4) },
          { hours: 8, price: Math.round(base * 5.5) },
        ];
      }
      if (field === 'monthly') {
        const baseMonthly = val || 1800;
        updatedPricing.monthlyTiers = [
          { months: 1, price: baseMonthly },
          { months: 2, price: Math.round(baseMonthly * 1.9) },
          { months: 3, price: Math.round(baseMonthly * 2.8) },
          { months: 6, price: Math.round(baseMonthly * 5.3) },
          { months: 12, price: updatedPricing.yearly || Math.round(baseMonthly * 10) },
        ];
      }
      if (field === 'yearly') {
        if (updatedPricing.monthlyTiers) {
          const idx = updatedPricing.monthlyTiers.findIndex((t) => t.months === 12);
          if (idx >= 0) updatedPricing.monthlyTiers[idx] = { months: 12, price: val };
        }
      }
      return { ...prev, pricing: updatedPricing };
    });
  };

  const setTierPrice = (hours: number, val: number) => {
    setForm((prev) => {
      const currentPricing = prev.pricing || { hourly: 45, daily: 150, monthly: 1800, yearly: 18000 };
      const currentTiers = currentPricing.hourlyTiers || [
        { hours: 1, price: 45 },
        { hours: 2, price: 80 },
        { hours: 3, price: 110 },
        { hours: 4, price: 140 },
        { hours: 6, price: 180 },
        { hours: 8, price: 220 },
      ];
      const existingIdx = currentTiers.findIndex(t => t.hours === hours);
      let updatedTiers = [...currentTiers];
      if (existingIdx >= 0) {
        updatedTiers[existingIdx] = { hours, price: val };
      } else {
        updatedTiers.push({ hours, price: val });
        updatedTiers.sort((a, b) => a.hours - b.hours);
      }
      return {
        ...prev,
        pricing: {
          ...currentPricing,
          hourly: hours === 1 ? val : currentPricing.hourly,
          hourlyTiers: updatedTiers,
        },
      };
    });
  };

  const setMonthlyTierPrice = (months: number, val: number) => {
    setForm((prev) => {
      const currentPricing = prev.pricing || { daily: 150, monthly: 1800, yearly: 18000 };
      const currentTiers = currentPricing.monthlyTiers || [
        { months: 1, price: currentPricing.monthly || 1800 },
        { months: 2, price: Math.round((currentPricing.monthly || 1800) * 1.9) },
        { months: 3, price: Math.round((currentPricing.monthly || 1800) * 2.8) },
        { months: 6, price: Math.round((currentPricing.monthly || 1800) * 5.3) },
        { months: 12, price: currentPricing.yearly || Math.round((currentPricing.monthly || 1800) * 10) },
      ];
      const existingIdx = currentTiers.findIndex((t) => t.months === months);
      let updatedTiers = [...currentTiers];
      if (existingIdx >= 0) {
        updatedTiers[existingIdx] = { months, price: val };
      } else {
        updatedTiers.push({ months, price: val });
        updatedTiers.sort((a, b) => a.months - b.months);
      }
      return {
        ...prev,
        pricing: {
          ...currentPricing,
          monthly: months === 1 ? val : currentPricing.monthly,
          yearly: months === 12 ? val : currentPricing.yearly,
          monthlyTiers: updatedTiers,
        },
      };
    });
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

      {/* Elevated Stats Cards */}
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

      {/* Category Tabs: All, Offices, Halls, Theaters */}
      <div className="flex flex-wrap gap-2.5">
        {[
          { id: 'all' as const, label: 'All Spaces', count: spaces.length, icon: Building2 },
          { id: 'office' as const, label: 'Offices', count: spaces.filter((s) => getSpaceCategory(s) === 'office').length, icon: Building2 },
          { id: 'hall' as const, label: 'Halls', count: spaces.filter((s) => getSpaceCategory(s) === 'hall').length, icon: Presentation },
          { id: 'theater' as const, label: 'Theaters', count: spaces.filter((s) => getSpaceCategory(s) === 'theater').length, icon: Clapperboard },
        ].map((tab) => {
          const isSelected = categoryFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-soot text-plaster shadow-xs'
                  : 'bg-plaster-surface border border-soot/10 text-moss hover:text-soot hover:border-soot/30'
              }`}
            >
              <tab.icon size={15} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isSelected ? 'bg-plaster/20 text-plaster' : 'bg-plaster-dark/60 text-soot'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
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
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
                        isSelected
                          ? 'bg-soot text-plaster font-semibold'
                          : 'text-soot hover:bg-plaster-dark/60'
                      }`}
                    >
                      <span>{city}</span>
                      {isSelected && <Check size={14} className="text-eucalyptus" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Layout */}
      <div className="bg-plaster-surface rounded-3xl border border-soot/10 overflow-hidden shadow-2xs relative z-10">
        <div className="hidden md:grid grid-cols-12 gap-6 px-6 py-4 border-b border-soot/10 text-xs font-semibold uppercase tracking-wider text-moss bg-plaster-dark/40 items-center">
          <div className="col-span-5">Space Name</div>
          <div className="col-span-2">City</div>
          <div className="col-span-2">Capacity</div>
          <div className="col-span-2">Price Rate</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        <div className="divide-y divide-soot/8">
          {filtered.map((space) => {
            const cat = getSpaceCategory(space);
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
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-soot/8 text-soot border border-soot/10 shrink-0 capitalize">
                        {cat}
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

                {/* Space Price */}
                <div className="col-span-2 mt-3 md:mt-0 text-sm font-semibold text-soot">
                  SAR {isHourlyOnlySpace(space.type) ? (space.pricing?.hourly || 150).toLocaleString() : space.pricing?.daily?.toLocaleString()}
                  <span className="text-xs text-moss font-normal ml-1">
                    {isHourlyOnlySpace(space.type) ? '/ hour' : '/ day'}
                  </span>
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

      {/* Add / Edit Workspace Modal */}
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
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm font-medium text-left transition-all duration-200 cursor-pointer focus:outline-none shadow-2xs"
                    >
                      <span className="truncate">{form.city || 'Select City'}</span>
                      <ChevronDown
                        size={15}
                        className={`text-moss shrink-0 transition-transform duration-200 ${
                          modalCityOpen ? 'rotate-180 text-soot' : ''
                        }`}
                      />
                    </button>

                    {modalCityOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100 max-h-52 overflow-y-auto">
                        <div className="space-y-0.5">
                          {CITIES.map((c) => {
                            const isSelected = form.city === c;
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  setForm((p) => ({ ...p, city: c }));
                                  setModalCityOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
                                  isSelected
                                    ? 'bg-soot text-plaster font-semibold'
                                    : 'text-soot hover:bg-plaster-dark/60'
                                }`}
                              >
                                <span>{c}</span>
                                {isSelected && <Check size={14} className="text-eucalyptus" />}
                              </button>
                            );
                          })}
                        </div>
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

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-soot mb-1.5">Description</label>
                    <textarea
                      rows={3}
                      value={form.description || ''}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Write a comprehensive description about the workspace, ambiance, facilities, and unique perks..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-soot/15 bg-white text-soot text-sm placeholder:text-moss/60 outline-none focus:border-soot transition-all resize-y shadow-2xs"
                    />
                  </div>

                  {/* Custom Workspace Type Dropdown */}
                  <div className="relative" ref={modalTypeRef}>
                    <label className="block text-xs font-semibold text-soot mb-1.5">Workspace Type</label>
                    <button
                      type="button"
                      onClick={() => setModalTypeOpen(!modalTypeOpen)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm font-medium text-left transition-all duration-200 cursor-pointer focus:outline-none shadow-2xs"
                    >
                      <span className="capitalize truncate">
                        {TYPES.find((t) => t.value === (form.type || 'mixed'))?.label || 'Mixed Space'}
                      </span>
                      <ChevronDown
                        size={15}
                        className={`text-moss shrink-0 transition-transform duration-200 ${
                          modalTypeOpen ? 'rotate-180 text-soot' : ''
                        }`}
                      />
                    </button>

                    {modalTypeOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100 max-h-52 overflow-y-auto">
                        <div className="space-y-0.5">
                          {TYPES.map((t) => {
                            const isSelected = form.type === t.value;
                            return (
                              <button
                                key={t.value}
                                type="button"
                                onClick={() => {
                                  handleTypeChange(t.value);
                                  setModalTypeOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
                                  isSelected
                                    ? 'bg-soot text-plaster font-semibold'
                                    : 'text-soot hover:bg-plaster-dark/60'
                                }`}
                              >
                                <span>{t.label}</span>
                                {isSelected && <Check size={14} className="text-eucalyptus" />}
                              </button>
                            );
                          })}
                        </div>
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

              {/* Booking System / Hourly Packages (الزيادة من كودهم بتصميم متناسق) */}
              <div className="rounded-2xl border border-soot/12 bg-plaster-dark/40 p-4 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-moss block">
                  Booking Mode & Packages
                </span>
                {isHourlyOnlySpace(form.type) ? (
                  <div className="space-y-3">
                    <p className="text-xs text-moss">
                      Halls and Theaters use hourly booking packages.
                    </p>
                    <div className="space-y-2">
                      {(form.bookingPackages || []).map((pkg, index) => (
                        <div key={pkg.id} className="grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-end bg-white p-2.5 rounded-xl border border-soot/10">
                          <div>
                            <label className="block text-[10px] font-medium text-moss mb-1">Package name</label>
                            <input
                              value={pkg.name}
                              onChange={(e) => updatePackage(index, { name: e.target.value })}
                              placeholder="e.g. 2 hours per day"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-soot/12 text-xs outline-none focus:border-soot"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-moss mb-1">Period</label>
                            <div className="flex bg-plaster-dark/30 p-0.5 rounded-lg border border-soot/12">
                              <button
                                type="button"
                                onClick={() => updatePackage(index, { period: 'day' })}
                                className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                                  pkg.period === 'day' ? 'bg-soot text-plaster shadow-2xs' : 'text-moss hover:text-soot'
                                }`}
                              >
                                Day
                              </button>
                              <button
                                type="button"
                                onClick={() => updatePackage(index, { period: 'month' })}
                                className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                                  pkg.period === 'month' ? 'bg-soot text-plaster shadow-2xs' : 'text-moss hover:text-soot'
                                }`}
                              >
                                Month
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-moss mb-1">Hours</label>
                            <input
                              type="number"
                              min="1"
                              value={pkg.hours}
                              onChange={(e) => updatePackage(index, { hours: +e.target.value })}
                              className="w-full px-2 py-1.5 rounded-lg border border-soot/12 text-xs outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-moss mb-1">Price SAR</label>
                            <input
                              type="number"
                              min="0"
                              value={pkg.price}
                              onChange={(e) => updatePackage(index, { price: +e.target.value })}
                              className="w-full px-2 py-1.5 rounded-lg border border-soot/12 text-xs outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removePackage(index)}
                            className="p-2 text-moss hover:text-red-600 transition-colors"
                            title="Remove package"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addPackage}
                      className="text-xs font-semibold text-soot hover:underline cursor-pointer block pt-1"
                    >
                      + Add hourly package
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-moss">
                    Shared desks and private offices support standard subscription pricing (Daily, Monthly, Yearly).
                  </p>
                )}
              </div>

              {/* Standard Pricing Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-soot/10 pb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-moss">
                    {isHourlyAllowed(form.type)
                      ? `${getSpaceCategory(form.type).toUpperCase()} Rates (Hourly, Daily, Monthly, Yearly)`
                      : 'Office Periodic Rates (Daily, Monthly, Yearly)'}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E5ECE9] text-soot">
                    {isHourlyAllowed(form.type)
                      ? 'Hourly • Daily • Monthly • Yearly'
                      : 'Daily • Monthly • Yearly (No Hourly)'}
                  </span>
                </div>

                {/* Standard Plans Grid */}
                <div className={`grid gap-3 ${isOfficeSpace(form.type) ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
                  {(isOfficeSpace(form.type)
                    ? (['daily', 'monthly', 'yearly'] as const)
                    : (['hourly', 'daily', 'monthly', 'yearly'] as const)
                  ).map((plan) => (
                    <div key={plan} className="space-y-1">
                      <span className="block text-[10px] font-bold text-moss uppercase tracking-wider">
                        {plan === 'hourly' ? '1 Hour (Base Rate)' : plan}
                      </span>
                      <input
                        type="number"
                        value={form.pricing?.[plan] ?? (plan === 'hourly' ? (isHourlyAllowed(form.type) ? 250 : 45) : plan === 'daily' ? 150 : plan === 'monthly' ? 1800 : 18000)}
                        onChange={(e) => setPrice(plan, +e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-soot/15 bg-white text-soot text-sm font-semibold outline-none focus:border-soot shadow-2xs"
                      />
                    </div>
                  ))}
                </div>

                {/* Hourly Duration Tiers */}
                {!isOfficeSpace(form.type) && (
                  <div className="p-3.5 rounded-2xl bg-plaster-dark/40 border border-soot/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-soot">
                        Multi-Hour Duration Pricing (SAR)
                      </span>
                      <span className="text-[10px] text-moss">Custom pricing for specific hourly durations</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[1, 2, 3, 4, 6, 8].map((hours) => {
                        const baseRate = form.pricing?.hourly || (isHourlyOnlySpace(form.type) ? 250 : 45);
                        const currentPrice =
                          form.pricing?.hourlyTiers?.find((t) => t.hours === hours)?.price ||
                          (hours === 1
                            ? baseRate
                            : Math.round(
                                baseRate *
                                  (hours === 2 ? 1.8 : hours === 3 ? 2.5 : hours === 4 ? 3.1 : hours === 6 ? 4.4 : 5.5)
                              ));
                        return (
                          <div key={hours} className="space-y-1 bg-white p-2 rounded-xl border border-soot/10">
                            <span className="block text-[10px] font-semibold text-moss text-center">{hours}h Duration</span>
                            <input
                              type="number"
                              value={currentPrice}
                              onChange={(e) => setTierPrice(hours, +e.target.value)}
                              className="w-full text-center px-1.5 py-1 rounded-lg border border-soot/10 bg-plaster-dark/20 text-soot text-xs font-semibold outline-none focus:border-soot"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Multi-Month Duration Tiers (Available for ALL space types) */}
                <div className="p-3.5 rounded-2xl bg-plaster-dark/40 border border-soot/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-soot">
                      Multi-Month Duration Pricing (SAR)
                    </span>
                    <span className="text-[10px] text-moss">Custom pricing for specific monthly durations</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[1, 2, 3, 6, 12].map((months) => {
                      const baseMonthly = form.pricing?.monthly || 1800;
                      const currentPrice =
                        form.pricing?.monthlyTiers?.find((t) => t.months === months)?.price ||
                        (months === 1
                          ? baseMonthly
                          : months === 12
                          ? form.pricing?.yearly || baseMonthly * 10
                          : Math.round(baseMonthly * (months === 2 ? 1.9 : months === 3 ? 2.8 : 5.3)));
                      return (
                        <div key={months} className="space-y-1 bg-white p-2 rounded-xl border border-soot/10">
                          <span className="block text-[10px] font-semibold text-moss text-center">{months} Mo{months > 1 ? 's' : ''} Duration</span>
                          <input
                            type="number"
                            value={currentPrice}
                            onChange={(e) => setMonthlyTierPrice(months, +e.target.value)}
                            className="w-full text-center px-1.5 py-1 rounded-lg border border-soot/10 bg-plaster-dark/20 text-soot text-xs font-semibold outline-none focus:border-soot"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-3 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-moss block border-b border-soot/10 pb-1.5">
                  Available Amenities
                </span>

                {/* Custom Amenity Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customAmenityInput}
                    onChange={(e) => setCustomAmenityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomAmenity();
                      }
                    }}
                    placeholder="Add custom amenity..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-soot/12 bg-plaster-dark/30 text-soot text-xs placeholder:text-moss/70 outline-none focus:border-eucalyptus focus:bg-plaster-surface transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAmenity}
                    className="px-3.5 py-2 rounded-xl bg-soot text-plaster hover:bg-soot/90 text-xs font-semibold cursor-pointer transition-all shrink-0 flex items-center gap-1 shadow-2xs"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {/* Preset AMENITY_OPTIONS Chips */}
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

                  {/* Custom Added Amenities Chips */}
                  {(form.amenities || [])
                    .filter((item) => !AMENITY_OPTIONS.includes(item))
                    .map((item) => {
                      const selected = form.amenities?.includes(item);
                      return (
                        <div
                          key={item}
                          onClick={() => toggleAmenity(item)}
                          className={`inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl border font-medium transition-all cursor-pointer ${
                            selected
                              ? 'bg-soot border-soot text-plaster shadow-xs font-semibold'
                              : 'bg-white border-soot/15 text-soot hover:border-soot/30 hover:bg-plaster-dark/30'
                          }`}
                        >
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCustomAmenity(item);
                            }}
                            className="p-0.5 hover:bg-white/20 rounded-md transition-colors"
                            title="Remove custom amenity"
                          >
                            <X size={13} className={selected ? 'text-plaster/80 hover:text-white' : 'text-soot/70 hover:text-soot'} />
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Photos Section */}
              <div className="space-y-3 pt-1">
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

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
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
