'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Building2,
  Eye,
  EyeOff,
  Trash2,
  MapPin,
  Star,
  AlertCircle,
  Check,
  ChevronDown,
  Warehouse,
  Plus,
  ArrowLeft,
  CalendarDays,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '@/app/store';
import { Space } from '@/types/types';
import Modal from '@/components/ui/Modal';

const CITIES = ['All Cities', 'Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Madinah', 'Makkah'];
const SPACE_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'private-office', label: 'Private Office' },
  { value: 'shared-desk', label: 'Dedicated Desk' },
  { value: 'meeting-room', label: 'Meeting Room' },
  { value: 'training-hall', label: 'Training Hall' },
  { value: 'event-hall', label: 'Event Space' },
  { value: 'mixed', label: 'Flex / Mixed' },
];

export default function CompanyWorkspaces() {
  const { currentUser, spaces, navigate, toggleSpaceVisibility, deleteSpace, getSpaceCrowding } = useApp();
  const [query, setQuery] = useState('');
  const [filterCity, setFilterCity] = useState('All Cities');
  const [filterType, setFilterType] = useState('all');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);

  const [deleteModal, setDeleteModal] = useState<Space | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setCityDropdownOpen(false);
      }
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) {
        setTypeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  // Filter spaces owned by or associated with this organization
  const companySpaces = spaces.filter(
    (s: Space) =>
      s.ownerId === currentUser.id ||
      (currentUser.email && s.email?.toLowerCase() === currentUser.email.toLowerCase())
  );

  const filtered = companySpaces.filter((s: Space) => {
    const q = query.trim().toLowerCase();
    if (q && !s.name.toLowerCase().includes(q) && !s.city.toLowerCase().includes(q) && !(s.district && s.district.toLowerCase().includes(q))) {
      return false;
    }
    if (filterCity !== 'All Cities' && s.city !== filterCity) return false;
    if (filterType !== 'all' && s.type !== filterType) return false;
    return true;
  });

  const handleDeleteConfirm = () => {
    if (deleteModal) {
      deleteSpace(deleteModal.id);
      setDeleteModal(null);
    }
  };

  const handleToggleVisibility = (e: React.MouseEvent, spaceId: string) => {
    e.stopPropagation();
    toggleSpaceVisibility(spaceId);
  };

  const visibleCount = companySpaces.filter((s) => s.isVisible).length;
  const hiddenCount = companySpaces.filter((s) => !s.isVisible).length;
  const totalCapacitySum = companySpaces.reduce((acc, s) => acc + (s.totalCapacity || 0), 0);
  const availableCapacitySum = companySpaces.reduce((acc, s) => acc + (s.availableCapacity ?? s.totalCapacity ?? 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-moss uppercase tracking-wider mb-1.5">
            <button
              type="button"
              onClick={() => navigate('org-dashboard')}
              className="hover:text-soot transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Dashboard</span>
            </button>
            <span>/</span>
            <span className="text-soot">Company Workspaces</span>
          </div>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display tracking-tight">
            Company Workspaces
          </h1>
          <p className="text-moss text-xs sm:text-sm mt-1">
            Manage your organization&apos;s corporate branches, dedicated suites, and bookable team locations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('team-bookings')}
            className="btn-secondary px-4 py-2.5 text-xs sm:text-sm flex items-center gap-2"
          >
            <CalendarDays size={16} />
            <span>Team Bookings</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('company-add-workspace')}
            className="btn-primary px-4 py-2.5 text-xs sm:text-sm flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Workspace</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Workspaces',
            count: companySpaces.length,
            desc: 'Company locations',
            badge: 'bg-soot/10 text-soot border border-soot/15',
            icon: Building2,
            iconBg: 'bg-soot text-plaster border-soot/20',
          },
          {
            label: 'Active & Bookable',
            count: visibleCount,
            desc: 'Visible to team',
            badge: 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
            icon: Eye,
            iconBg: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
          },
          {
            label: 'Hidden Listings',
            count: hiddenCount,
            desc: 'Offline or private',
            badge: 'bg-amber-500/15 text-amber-800 border border-amber-500/30',
            icon: EyeOff,
            iconBg: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
          },
          {
            label: 'Total Seats',
            count: totalCapacitySum,
            desc: `${availableCapacitySum} seats available`,
            badge: 'bg-eucalyptus/25 text-soot border border-eucalyptus/30',
            icon: Warehouse,
            iconBg: 'bg-eucalyptus text-soot border-eucalyptus-dark/30',
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
                <div className="text-xs font-semibold text-soot mt-0.5">{stat.label}</div>
                <div className="text-[11px] text-moss">{stat.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-plaster-surface p-3 rounded-2xl border border-soot/10 shadow-2xs relative z-30">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-moss pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by space name, city, or district..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-soot/12 bg-plaster-dark/30 text-soot text-sm placeholder:text-moss/70 outline-none focus:border-eucalyptus focus:bg-plaster-surface transition-all"
          />
        </div>

        {/* City Filter */}
        <div className="relative min-w-44" ref={cityRef}>
          <button
            type="button"
            onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
            className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-plaster-dark/30 hover:bg-plaster-dark/50 border border-soot/12 transition-all duration-200 text-left cursor-pointer focus:outline-none"
          >
            <div className="flex items-center gap-2 min-w-0">
              <MapPin size={15} className="text-moss shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-soot truncate">{filterCity}</span>
            </div>
            <ChevronDown
              size={14}
              className={`text-moss transition-transform duration-200 shrink-0 ${cityDropdownOpen ? 'rotate-180 text-soot' : ''}`}
            />
          </button>

          {cityDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
              <div className="max-h-52 overflow-y-auto space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
                {CITIES.map((city) => {
                  const isSelected = filterCity === city;
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setFilterCity(city);
                        setCityDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors duration-150 text-left cursor-pointer ${
                        isSelected
                          ? 'bg-soot text-plaster font-semibold'
                          : 'text-soot hover:bg-plaster-dark/60'
                      }`}
                    >
                      <span>{city}</span>
                      {isSelected && <Check size={13} className="text-eucalyptus" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Type Filter */}
        <div className="relative min-w-44" ref={typeRef}>
          <button
            type="button"
            onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
            className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-plaster-dark/30 hover:bg-plaster-dark/50 border border-soot/12 transition-all duration-200 text-left cursor-pointer focus:outline-none"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 size={15} className="text-moss shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-soot truncate">
                {SPACE_TYPES.find((t) => t.value === filterType)?.label || 'All Types'}
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-moss transition-transform duration-200 shrink-0 ${typeDropdownOpen ? 'rotate-180 text-soot' : ''}`}
            />
          </button>

          {typeDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-plaster-surface border border-soot/15 rounded-2xl shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
              <div className="max-h-52 overflow-y-auto space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
                {SPACE_TYPES.map((typeObj) => {
                  const isSelected = filterType === typeObj.value;
                  return (
                    <button
                      key={typeObj.value}
                      type="button"
                      onClick={() => {
                        setFilterType(typeObj.value);
                        setTypeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors duration-150 text-left cursor-pointer ${
                        isSelected
                          ? 'bg-soot text-plaster font-semibold'
                          : 'text-soot hover:bg-plaster-dark/60'
                      }`}
                    >
                      <span>{typeObj.label}</span>
                      {isSelected && <Check size={13} className="text-eucalyptus" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Table / Grid Content */}
      <div className="bg-plaster-surface rounded-3xl border border-soot/10 overflow-hidden shadow-2xs relative z-10">
        <div className="hidden md:grid grid-cols-12 gap-6 px-6 py-4 border-b border-soot/10 text-xs font-semibold uppercase tracking-wider text-moss bg-plaster-dark/40 items-center">
          <div className="col-span-5">Space Name & Type</div>
          <div className="col-span-2">City & District</div>
          <div className="col-span-2">Capacity & Status</div>
          <div className="col-span-2">Daily Rate</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {companySpaces.length === 0 ? (
          /* Empty State when no workspaces are added yet */
          <div className="py-16 px-6 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-eucalyptus/20 text-soot flex items-center justify-center mx-auto mb-4 border border-eucalyptus/30">
              <Building2 size={30} className="text-eucalyptus-dark" />
            </div>
            <h2 className="text-xl font-serif-display font-medium text-soot mb-1.5">
              No Company Workspaces Registered Yet
            </h2>
            <p className="text-xs sm:text-sm text-moss leading-relaxed mb-6">
              Add your organization&apos;s corporate branches, innovation hubs, or meeting suites to make them available for your distributed teams.
            </p>
            <button
              type="button"
              onClick={() => navigate('company-add-workspace')}
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm shadow-sm cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Your First Workspace</span>
            </button>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State when search/filter produces no matches */
          <div className="py-16 text-center text-moss">
            <Warehouse size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No workspaces match your filter criteria.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFilterCity('All Cities');
                setFilterType('all');
              }}
              className="mt-3 text-xs text-soot font-semibold underline hover:text-eucalyptus transition-colors cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-soot/8">
            {filtered.map((space) => {
              const crowding = getSpaceCrowding ? getSpaceCrowding(space) : {
                scannedCount: 0,
                totalCapacity: space.totalCapacity || 30,
                availableCapacity: space.availableCapacity ?? 15,
                occupiedSeats: (space.totalCapacity || 30) - (space.availableCapacity ?? 15),
                occupancyPercentage: 50,
                level: 'Moderate' as const,
                badgeClass: 'bg-amber-100/90 text-amber-900 border-amber-200/90',
                barColor: 'bg-[#D97706]',
                textColor: 'text-[#D97706]',
                trackColor: 'bg-[#E5EBE7]',
              };

              return (
                <div
                  key={space.id}
                  onClick={() => navigate('space-details', { spaceId: space.id })}
                  className="px-6 py-4 hover:bg-plaster-dark/30 transition-colors flex flex-col md:grid md:grid-cols-12 md:gap-6 md:items-center cursor-pointer group"
                >
                  {/* Space Name & Thumbnail */}
                  <div className="col-span-5 flex items-center gap-3.5 min-w-0">
                    <img
                      src={space.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80'}
                      alt={space.name}
                      className="w-12 h-12 rounded-xl object-cover border border-soot/10 shadow-2xs group-hover:scale-105 transition-transform shrink-0"
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
                          {space.rating || '4.9'}
                        </span>
                        <span>·</span>
                        <span className="capitalize">{space.type.replace('-', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* City & District */}
                  <div className="col-span-2 mt-2 md:mt-0 text-xs sm:text-sm text-soot font-medium flex items-center gap-1.5">
                    <MapPin size={14} className="text-moss shrink-0" />
                    <span className="truncate">{space.city}{space.district ? ` · ${space.district}` : ''}</span>
                  </div>

                  {/* Capacity & Crowding Indicator */}
                  <div className="col-span-2 mt-3 md:mt-0 flex flex-col justify-center space-y-1">
                    <div className="flex items-center justify-between text-xs max-w-[130px]">
                      <span className="text-moss">{crowding.availableCapacity}/{crowding.totalCapacity} seats</span>
                      <span className={`font-semibold ${crowding.textColor}`}>{crowding.level}</span>
                    </div>
                    <div className="w-full max-w-[130px] h-1.5 bg-[#E5EBE7] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${crowding.barColor}`}
                        style={{
                          width: `${
                            crowding.level === 'Busy'
                              ? 100
                              : Math.min(100, Math.max(10, crowding.occupancyPercentage))
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Daily Price */}
                  <div className="col-span-2 mt-3 md:mt-0 text-sm font-semibold text-soot">
                    SAR {(space.pricing?.daily || 0).toLocaleString()}
                    <span className="text-xs text-moss font-normal ml-1">/ day</span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 mt-4 md:mt-0 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleToggleVisibility(e, space.id)}
                      className="p-2 rounded-xl text-moss hover:text-soot hover:bg-plaster-surface border border-transparent hover:border-soot/10 transition-all cursor-pointer"
                      title={space.isVisible ? 'Hide from team catalog' : 'Make visible to team'}
                    >
                      {space.isVisible ? <EyeOff size={15} /> : <Eye size={15} className="text-emerald-700" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModal(space);
                      }}
                      className="p-2 rounded-xl text-moss hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                      title="Remove Workspace"
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

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <Modal
          open={!!deleteModal}
          onClose={() => setDeleteModal(null)}
          title="Remove Workspace Listing"
          size="sm"
          footer={
            <>
              <button type="button" onClick={() => setDeleteModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={handleDeleteConfirm} className="btn-danger">
                Remove Workspace
              </button>
            </>
          }
        >
          <div className="text-sm text-soot space-y-2 py-2">
            <p>
              Are you sure you want to remove <span className="font-semibold">{deleteModal.name}</span> from your company workspace catalog?
            </p>
            <p className="text-xs text-moss">
              This will remove the workspace from active corporate listings. Existing historical bookings will be retained.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
