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
} from 'lucide-react';
import { useApp } from '@/app/store';
import { Booking, Space } from '@/types/types';
import Modal from '@/components/ui/Modal';

const CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Madinah', 'Makkah'];

export default function MyWorkspaces() {
  const { currentUser, spaces, navigate, toggleSpaceVisibility, deleteSpace, bookings } = useApp();
  const [query, setQuery] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [deleteModal, setDeleteModal] = useState<Space | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const companySpaces = spaces.filter((s: Space) => s.ownerId === currentUser.id);

  const filtered = companySpaces.filter((s: Space) => {
    const q = query.trim().toLowerCase();
    if (q && !s.name.toLowerCase().includes(q) && !s.city.toLowerCase().includes(q)) return false;
    if (filterCity && s.city !== filterCity) return false;
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
  const fullyBookedCount = companySpaces.filter((s) => s.availableCapacity === 0).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-moss block mb-1">
            Company Workspace Catalog
          </span>
          <h1 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
            My Workspaces
          </h1>
          <p className="text-moss text-sm mt-1">Manage corporate workspace locations and visibility.</p>
        </div>
      </div>

      {/* Admin-Matching Elevated Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Workspaces',
            count: companySpaces.length,
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
            label: 'Hidden Listings',
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
              {Math.round((stat.count / (companySpaces.length || 1)) * 100)}%
            </span>
          </div>
        ))}
      </div>

      {/* Admin-Matching Search & Custom City Filter Bar */}
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

      {/* Admin-Matching Table Layout */}
      <div className="bg-plaster-surface rounded-3xl border border-soot/10 overflow-hidden shadow-2xs relative z-10">
        <div className="hidden md:grid grid-cols-12 gap-6 px-6 py-4 border-b border-soot/10 text-xs font-semibold uppercase tracking-wider text-moss bg-plaster-dark/40 items-center">
          <div className="col-span-5">Space Name</div>
          <div className="col-span-2">City</div>
          <div className="col-span-2">Capacity</div>
          <div className="col-span-2">Daily Price</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-moss">
            <Warehouse size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No workspaces match your filter criteria.</p>
          </div>
        ) : (
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

                  {/* Daily Price */}
                  <div className="col-span-2 mt-3 md:mt-0 text-sm font-semibold text-soot">
                    SAR {space.pricing.daily.toLocaleString()}
                    <span className="text-xs text-moss font-normal ml-1">/ day</span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 mt-4 md:mt-0 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleToggleVisibility(e, space.id)}
                      className="p-2 rounded-xl text-moss hover:text-soot hover:bg-plaster-surface border border-transparent hover:border-soot/10 transition-all cursor-pointer"
                      title={space.isVisible ? 'Hide Listing' : 'Show Listing'}
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
                      title="Remove Listing"
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

      {/* Delete Modal */}
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
              Are you sure you want to remove <span className="font-semibold">{deleteModal.name}</span> from your company catalog?
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
