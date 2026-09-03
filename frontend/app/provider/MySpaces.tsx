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
  Warehouse,
  Upload,
  Presentation,
  Clapperboard,
  X,
} from 'lucide-react';
import { useApp } from '@/app/store';
import { Space, SpaceType, SpaceCategory, ALL_SPACE_TYPES, isHourlyOnlySpace, isOfficeSpace, isHourlyAllowed, getSpaceCategory } from '@/types/types';
import Modal from '@/components/ui/Modal';

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
  '4K Projector',
  'Surround Sound',
  'Stage Lighting',
];

const CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Madinah', 'Makkah', 'Abha', 'Tabuk'];

const TYPES = ALL_SPACE_TYPES;

export default function ProviderMySpaces() {
  const { currentUser, spaces, addSpace, updateSpace, toggleSpaceVisibility, deleteSpace } = useApp();
  const [query, setQuery] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | SpaceCategory>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [form, setForm] = useState<Partial<Space>>({});
  const [saved, setSaved] = useState(false);

  const [modalCityOpen, setModalCityOpen] = useState(false);
  const [modalTypeOpen, setModalTypeOpen] = useState(false);

  const modalCityRef = useRef<HTMLDivElement>(null);
  const modalTypeRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
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

  if (!currentUser) return null;

  const mySpaces = spaces.filter((s) => s.ownerId === currentUser.id);

  const filteredSpaces = mySpaces.filter((s) => {
    const q = query.trim().toLowerCase();
    if (q && !s.name.toLowerCase().includes(q) && !s.city.toLowerCase().includes(q)) return false;
    if (filterCity && s.city !== filterCity) return false;
    if (categoryFilter !== 'all' && getSpaceCategory(s) !== categoryFilter) return false;
    return true;
  });

  const openAdd = () => {
    setEditingSpace(null);
    setForm({
      name: '',
      city: 'Riyadh',
      address: '',
      description: '',
      type: 'mixed',
      amenities: ['High-Speed WiFi', 'Coffee & Tea', 'Parking'],
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
      rating: 4.8,
      reviewCount: 0,
      isVisible: true,
      isFeatured: false,
      openHours: 'Sun–Thu: 8am–9pm',
      phone: '',
      email: '',
      images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&auto=format'],
      ownerId: currentUser.id,
    });
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
      addSpace({
        ...form,
        ownerId: currentUser.id,
      } as Omit<Space, 'id'>);
    }
    setSaved(true);
    setTimeout(() => {
      setEditModal(false);
      setSaved(false);
    }, 800);
  };

  const handleDelete = (e: React.MouseEvent, space: Space) => {
    e.stopPropagation();
    setSpaceToDelete(space);
    setDeleteModal(true);
  };

  const confirmDelete = () => {
    if (spaceToDelete) {
      deleteSpace(spaceToDelete.id);
      setDeleteModal(false);
      setSpaceToDelete(null);
    }
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
      // If it exists but isn't selected, select it
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
      const existingIdx = currentTiers.findIndex((t) => t.hours === hours);
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

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setForm((p) => ({
      ...p,
      images: [...(p.images || []), imageUrlInput.trim()],
    }));
    setImageUrlInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setForm((prev) => ({
            ...prev,
            images: [...(prev.images || []), result],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

  const visibleCount = mySpaces.filter((s) => s.isVisible).length;
  const hiddenCount = mySpaces.filter((s) => !s.isVisible).length;
  const fullyBookedCount = mySpaces.filter((s) => s.availableCapacity === 0).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-moss block mb-1">
            Space Management
          </span>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
            My Workspaces
          </h1>
          <p className="text-moss text-sm mt-1">Manage and update your listed workspace properties.</p>
        </div>

        <button type="button" onClick={openAdd} className="btn-primary">
          <Plus size={17} className="text-[#FAF8F5]/80" />
          <span>Add space</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Spaces',
            count: mySpaces.length,
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
              {Math.round((stat.count / (mySpaces.length || 1)) * 100)}%
            </span>
          </div>
        ))}
      </div>

      {/* Category Tabs: All, Offices, Halls, Theaters */}
      <div className="flex flex-wrap gap-2.5">
        {[
          { id: 'all' as const, label: 'All Workspaces', count: mySpaces.length, icon: Building2 },
          { id: 'office' as const, label: 'Offices', count: mySpaces.filter((s) => getSpaceCategory(s) === 'office').length, icon: Building2 },
          { id: 'hall' as const, label: 'Halls', count: mySpaces.filter((s) => getSpaceCategory(s) === 'hall').length, icon: Presentation },
          { id: 'theater' as const, label: 'Theaters', count: mySpaces.filter((s) => getSpaceCategory(s) === 'theater').length, icon: Clapperboard },
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

      {/* Search & Custom City Filter Bar */}
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

        {filteredSpaces.length === 0 ? (
          <div className="py-16 text-center text-moss">
            <Warehouse size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No workspaces match your search filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-soot/8">
            {filteredSpaces.map((space) => {
              const cat = getSpaceCategory(space);
              const occupancyRatio =
                space.totalCapacity > 0 ? (space.availableCapacity / space.totalCapacity) * 100 : 0;

              return (
                <div
                  key={space.id}
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
                          {space.rating || '4.8'}
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
                      title={space.isVisible ? 'Hide Space' : 'Show Space'}
                    >
                      {space.isVisible ? <EyeOff size={15} /> : <Eye size={15} className="text-emerald-700" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, space)}
                      className="p-2 rounded-xl text-moss hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                      title="Delete Space"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Workspace Modal */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={editingSpace ? 'Edit Workspace' : 'Add New Workspace'}
        subtitle="Configure details, amenities, pricing, and media options."
        size="2xl"
        footer={
          <>
            <button type="button" onClick={() => setEditModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={handleSave} className="btn-primary">
              Save Changes
            </button>
          </>
        }
      >
        {saved ? (
          <div className="py-12 text-center text-emerald-800">
            <Check size={40} className="mx-auto mb-2" />
            <div className="text-lg font-semibold">Workspace updated successfully!</div>
          </div>
        ) : (
          <div className="space-y-6 text-sm text-soot">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1">
                  Workspace Name *
                </label>
                <input
                  value={form.name || ''}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. The Hub Olaya"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus"
                />
              </div>

              {/* City Custom Dropdown */}
              <div className="relative" ref={modalCityRef}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1">
                  City *
                </label>
                <button
                  type="button"
                  onClick={() => setModalCityOpen(!modalCityOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-sm font-medium text-left transition-all duration-200 cursor-pointer focus:outline-none"
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
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1">
                Address / Location *
              </label>
              <input
                value={form.address || ''}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="District, Street Name, City"
                className="w-full px-3.5 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1">
                Description
              </label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="Describe your workspace, vibe, and amenities..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus resize-none"
              />
            </div>

            {/* Type & Capacity */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="relative" ref={modalTypeRef}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1">
                  Type *
                </label>
                <button
                  type="button"
                  onClick={() => setModalTypeOpen(!modalTypeOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-soot/12 text-soot text-sm font-medium text-left transition-all duration-200 cursor-pointer focus:outline-none"
                >
                  <span className="truncate">
                    {TYPES.find((t) => t.value === form.type)?.label || 'Select Type'}
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
                              setForm((p) => ({ ...p, type: t.value }));
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-moss mb-1">
                  Total Capacity
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.totalCapacity ?? 20}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      totalCapacity: parseInt(e.target.value) || 0,
                      availableCapacity: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus"
                />
              </div>
            </div>

            {/* Pricing Section (Dynamically adapted based on space category) */}
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

              {/* Hourly Duration Tiers (Only for Halls and Theaters; hidden for Offices) */}
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

            {/* Images Section */}
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-moss block border-b border-soot/10 pb-1.5">
                Workspace Photos
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Paste direct image URL..."
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-soot/12 bg-white text-soot text-xs outline-none focus:border-eucalyptus"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3.5 py-2 rounded-xl bg-soot text-plaster text-xs font-medium cursor-pointer hover:bg-soot/90"
                  >
                    Add URL
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-soot/15 bg-white text-xs font-medium text-soot hover:bg-plaster-dark/40 cursor-pointer"
                  >
                    <Upload size={14} />
                    <span>Upload</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              {form.images && form.images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-soot/10 aspect-video">
                      <img src={img} alt={`Space photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Amenities Section */}
            <div className="space-y-3 pt-2">
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
                {AMENITY_OPTIONS.map((a) => {
                  const sel = form.amenities?.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        sel ? 'bg-soot text-plaster font-semibold' : 'bg-plaster-dark/40 text-soot hover:bg-plaster-dark/70'
                      }`}
                    >
                      {a}
                    </button>
                  );
                })}

                {/* Custom Added Amenities Chips */}
                {(form.amenities || [])
                  .filter((a) => !AMENITY_OPTIONS.includes(a))
                  .map((a) => {
                    const sel = form.amenities?.includes(a);
                    return (
                      <div
                        key={a}
                        onClick={() => toggleAmenity(a)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                          sel
                            ? 'bg-soot text-plaster font-semibold'
                            : 'bg-plaster-dark/40 text-soot hover:bg-plaster-dark/70'
                        }`}
                      >
                        <span>{a}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCustomAmenity(a);
                          }}
                          className="p-0.5 hover:bg-white/20 rounded-md transition-colors"
                          title="Remove custom amenity"
                        >
                          <X size={13} className={sel ? 'text-plaster/80 hover:text-white' : 'text-soot/70 hover:text-soot'} />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Workspace Listing"
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setDeleteModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={confirmDelete} className="btn-danger">
              Confirm Delete
            </button>
          </>
        }
      >
        <div className="text-sm text-soot space-y-2 py-2">
          <p>
            Are you sure you want to delete <span className="font-semibold">{spaceToDelete?.name}</span>?
          </p>
          <p className="text-xs text-moss">This workspace listing will be removed from the platform catalog.</p>
        </div>
      </Modal>
    </div>
  );
}
