'use client';

import { useState } from 'react';
import {
  Search,
  Building2,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  LayoutGrid,
  List,
  MapPin,
  Users,
  CalendarDays,
  MoreVertical,
} from 'lucide-react';
import { useApp } from '@/app/store';
import { Booking, Space } from '@/types/types';
import Modal from '@/components/ui/Modal';
import AddWorkspace from './AddWorkspace';
import AddWorkspaceModal from './AddWorkspaceModal';

const SPACE_TYPES = ['All types', 'hot-desk', 'private-office', 'meeting-room', 'mixed'];
const CITIES = ['All cities', 'Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Madinah', 'Makkah'];
const STATUSES = ['All', 'published', 'draft', 'hidden'];

export default function MyWorkspaces() {
  const { currentUser, spaces, navigate, toggleSpaceVisibility, deleteSpace, bookings } = useApp();
  if (!currentUser) return null;

  const companySpaces = spaces.filter((s: Space) => s.ownerId === currentUser.id);

  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('All cities');
  const [typeFilter, setTypeFilter] = useState('All types');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [deleteModal, setDeleteModal] = useState<Space | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filtered = companySpaces.filter((s: Space) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase());
    const matchCity = cityFilter === 'All cities' || s.city === cityFilter;
    const matchType = typeFilter === 'All types' || s.type === typeFilter;
    const matchStatus =
      statusFilter === 'All' ||
      (statusFilter === 'published' && s.isVisible && s.status !== 'draft') ||
      (statusFilter === 'draft' && s.status === 'draft') ||
      (statusFilter === 'hidden' && !s.isVisible && s.status !== 'draft');
    return matchSearch && matchCity && matchType && matchStatus;
  });

  const getBookingCount = (spaceId: string) =>
    bookings.filter((b: Booking) => b.spaceId === spaceId && b.status !== 'cancelled').length;

  const getStatusLabel = (space: Space) => {
    if (space.status === 'draft') return { label: 'Draft', cls: 'bg-amber-50 text-amber-600 border-amber-100' };
    if (!space.isVisible) return { label: 'Hidden', cls: 'bg-soot/8 text-moss border-soot/12' };
    return { label: 'Active', cls: 'bg-[#DDE6DF] text-soot border-soot/6' };
  };

  const handleDelete = (space: Space) => {
    deleteSpace(space.id);
    setDeleteModal(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl text-soot font-normal" style={{ fontFamily: 'DM Serif Display, serif' }}>
            My Workspaces
          </h1>
          <p className="text-moss text-xs sm:text-sm mt-1 font-normal">
            {companySpaces.length} workspace{companySpaces.length !== 1 ? 's' : ''} managed
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="btn-primary"
        >
          <Plus size={15} />
          <span>Add workspace</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl border border-soot/8 p-4 mb-6 flex flex-wrap gap-3 items-center shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-40 px-3.5 py-2 rounded-2xl border border-soot/10 bg-[#F9F8F5]">
          <Search size={14} className="text-moss shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search workspaces..."
            className="flex-1 bg-transparent text-soot text-sm outline-none font-normal"
          />
        </div>

        <select
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
          className="px-4 py-2 rounded-2xl border border-soot/10 bg-[#F9F8F5] text-soot text-sm outline-none font-normal cursor-pointer"
        >
          {CITIES.map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-4 py-2 rounded-2xl border border-soot/10 bg-[#F9F8F5] text-soot text-sm outline-none capitalize font-normal cursor-pointer"
        >
          {SPACE_TYPES.map(t => (
            <option key={t} className="capitalize">
              {t === 'All types' ? t : t.replace('-', ' ')}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-2xl border border-soot/10 bg-[#F9F8F5] text-soot text-sm outline-none capitalize font-normal cursor-pointer"
        >
          {STATUSES.map(s => (
            <option key={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => setViewMode('card')}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              viewMode === 'card' ? 'bg-[#DDE6DF] text-soot' : 'text-moss hover:bg-soot/5'
            }`}
            title="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-[#DDE6DF] text-soot' : 'text-moss hover:bg-soot/5'
            }`}
            title="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-soot/8 p-16 text-center shadow-sm">
          <Building2 size={36} className="text-moss mx-auto mb-4" />
          <h3 className="font-medium text-soot mb-2 text-lg" style={{ fontFamily: 'DM Serif Display, serif' }}>
            {companySpaces.length === 0 ? 'No workspaces added yet' : 'No workspaces match your filters'}
          </h3>
          <p className="text-sm text-moss mb-6 font-normal">
            {companySpaces.length === 0
              ? 'Add your first workspace to start accepting bookings and team reservations.'
              : 'Try adjusting the filters above to find what you are looking for.'}
          </p>
          {companySpaces.length === 0 && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#374142] text-[#FAF8F5] text-sm font-medium ring-1 ring-white/15 shadow-sm hover:bg-[#2D3536] transition-all duration-200 active:scale-[0.98] cursor-pointer"            >
              <Plus size={16} />
              <span>Add your first workspace</span>
            </button>
          )}
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((space: Space) => {
            const { label, cls } = getStatusLabel(space);
            const occupancy =
              space.totalCapacity > 0
                ? Math.round(((space.totalCapacity - space.availableCapacity) / space.totalCapacity) * 100)
                : 0;
            const bookingCount = getBookingCount(space.id);
            return (
              <div
                key={space.id}
                className="bg-white rounded-3xl border border-soot/8 overflow-hidden hover:shadow-md transition-all group"
              >
                <div className="relative h-44">
                  <img
                    src={space.images[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop'}
                    alt={space.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`text-[11px] px-3 py-1 rounded-full font-medium border shadow-2xs ${cls}`}>
                      {label}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMenuOpen(menuOpen === space.id ? null : space.id)}
                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs hover:bg-white transition-colors cursor-pointer"
                      >
                        <MoreVertical size={14} className="text-soot" />
                      </button>
                      {menuOpen === space.id && (
                        <div className="absolute right-0 top-9 bg-white rounded-2xl border border-soot/8 shadow-lg z-10 w-48 py-1.5 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => {
                              navigate('company-workspace-details', { spaceId: space.id });
                              setMenuOpen(null);
                            }}
                            className="w-full px-4 py-2 text-xs font-medium text-soot text-left hover:bg-soot/5 cursor-pointer"
                          >
                            View details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              toggleSpaceVisibility(space.id);
                              setMenuOpen(null);
                            }}
                            className="w-full px-4 py-2 text-xs font-medium text-soot text-left hover:bg-soot/5 flex items-center gap-2 cursor-pointer"
                          >
                            {space.isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                            <span>{space.isVisible ? 'Hide workspace' : 'Show workspace'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteModal(space);
                              setMenuOpen(null);
                            }}
                            className="w-full px-4 py-2 text-xs font-medium text-red-600 text-left hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="font-medium text-soot text-base mb-1">{space.name}</div>
                  <div className="flex items-center gap-1.5 text-xs text-moss mb-3">
                    <MapPin size={12} />
                    <span>{space.city} · <span className="capitalize">{space.type.replace('-', ' ')}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-moss mb-3">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      <span>{space.availableCapacity}/{space.totalCapacity} available</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays size={12} />
                      <span>{bookingCount} bookings</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 h-1.5 bg-soot/8 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#98AA9D]" style={{ width: `${occupancy}%` }} />
                    </div>
                    <span className="text-[10px] text-moss font-medium">{occupancy}%</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-soot/6">
                    <div className="text-sm font-medium text-soot">
                      SAR {space.pricing.daily}
                      <span className="text-xs font-normal text-moss">/day</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('company-workspace-details', { spaceId: space.id })}
                      className="text-xs text-moss hover:text-soot font-medium transition-colors cursor-pointer"
                    >
                      Manage →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table view */
        <div className="bg-white rounded-3xl border border-soot/8 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-soot/8 bg-[#F9F8F5]">
                  {['Workspace', 'City', 'Type', 'Capacity', 'Occupancy', 'Price/day', 'Bookings', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-moss uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-soot/6">
                {filtered.map((space: Space) => {
                  const { label, cls } = getStatusLabel(space);
                  const occupancy =
                    space.totalCapacity > 0
                      ? Math.round(((space.totalCapacity - space.availableCapacity) / space.totalCapacity) * 100)
                      : 0;
                  return (
                    <tr key={space.id} className="hover:bg-[#F9F8F5]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={space.images[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200'}
                            alt={space.name}
                            className="w-10 h-10 rounded-xl object-cover shrink-0"
                          />
                          <span className="font-medium text-soot">{space.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-moss text-xs">{space.city}</td>
                      <td className="px-4 py-3 text-moss text-xs capitalize">{space.type.replace('-', ' ')}</td>
                      <td className="px-4 py-3 text-moss text-xs">{space.availableCapacity}/{space.totalCapacity}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-soot/8 rounded-full overflow-hidden">
                            <div className="h-full bg-[#98AA9D] rounded-full" style={{ width: `${occupancy}%` }} />
                          </div>
                          <span className="text-xs text-moss">{occupancy}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-soot text-xs">SAR {space.pricing.daily}</td>
                      <td className="px-4 py-3 text-moss text-xs">{getBookingCount(space.id)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium border ${cls}`}>{label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSpaceVisibility(space.id)}
                            className="p-1.5 rounded-lg hover:bg-soot/5 text-moss transition-colors cursor-pointer"
                            title={space.isVisible ? 'Hide' : 'Show'}
                          >
                            {space.isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteModal(space)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-moss hover:text-red-500 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete workspace"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteModal(null)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button onClick={() => deleteModal && handleDelete(deleteModal)} className="btn-danger flex-1">
              Delete workspace
            </button>
          </>
        }
      >
        {deleteModal && (
          <div className="py-2">
            <p className="text-sm text-moss mb-1">
              Are you sure you want to delete <span className="font-semibold text-soot">{deleteModal.name}</span>?
            </p>
            <p className="text-xs text-moss/70">This action cannot be undone. All workspace data will be permanently removed.</p>
          </div>
        )}
      </Modal>

      {/* Add Workspace Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Workspace"
        subtitle="List a new coworking space or office for your organization."
        size="2xl"
      >
        <AddWorkspace onCloseModal={() => setAddModalOpen(false)} />
      </Modal>
    </div>
  );
}
