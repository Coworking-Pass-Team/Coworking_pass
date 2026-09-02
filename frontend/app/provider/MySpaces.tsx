'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Eye, EyeOff, Pencil, Trash2, MapPin, Users, AlertCircle, Check, Warehouse, ChevronDown } from 'lucide-react';
import { useApp } from '@/app/store';
import { Space, SpaceType } from '@/types';
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
];

const CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Madinah', 'Makkah', 'Abha', 'Tabuk'];

const TYPES: { value: SpaceType; label: string }[] = [
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
  amenities: ['High-Speed WiFi', 'Coffee & Tea', 'Parking'],
  totalCapacity: 20,
  availableCapacity: 20,
  pricing: { daily: 100, monthly: 1200, yearly: 12000 },
  rating: 0,
  reviewCount: 0,
  isVisible: true,
  isFeatured: false,
  openHours: 'Sun–Thu: 8am–9pm',
  phone: '',
  email: '',
  images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&auto=format'],
});

export default function ProviderMySpaces() {
  const { currentUser, spaces, bookings, addSpace, updateSpace, toggleSpaceVisibility, deleteSpace } = useApp();
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [form, setForm] = useState<Partial<Space>>(emptyForm());
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

  if (!currentUser) return null;

  const mySpaces = spaces.filter((s) => s.ownerId === currentUser.id);

  const bookingCountFor = (spaceId: string) => bookings.filter((b) => b.spaceId === spaceId && b.status !== 'cancelled').length;

  const openAdd = () => {
    setEditingSpace(null);
    setForm(emptyForm());
    setEditModal(true);
    setSaved(false);
  };

  const openEdit = (space: Space) => {
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
      addSpace({ ...(form as Omit<Space, 'id'>), ownerId: currentUser.id });
    }
    setSaved(true);
    setTimeout(() => {
      setEditModal(false);
      setSaved(false);
    }, 1200);
  };

  const handleDelete = () => {
    if (spaceToDelete) {
      deleteSpace(spaceToDelete.id);
      setDeleteModal(false);
      setSpaceToDelete(null);
    }
  };

  const toggleAmenity = (a: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities?.includes(a)
        ? prev.amenities.filter((x) => x !== a)
        : [...(prev.amenities || []), a],
    }));
  };

  const setPrice = (field: 'daily' | 'monthly' | 'yearly', val: number) => {
    setForm((prev) => ({
      ...prev,
      pricing: { ...(prev.pricing || { daily: 0, monthly: 0, yearly: 0 }), [field]: val },
    }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>
            My Spaces
          </h1>
          <p className="text-moss text-sm mt-1">Manage the workspaces you list on Coworking Pass.</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={15} />
          <span>Add space</span>
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mb-5 text-sm text-moss">
        <span>{mySpaces.length} total</span>
        <span>{mySpaces.filter((s) => s.isVisible).length} visible</span>
        <span>{mySpaces.filter((s) => !s.isVisible).length} hidden</span>
        <span>{mySpaces.filter((s) => s.availableCapacity === 0).length} fully booked</span>
      </div>

      {mySpaces.length === 0 ? (
        <div className="bg-white rounded-2xl border border-soot/8 py-16 text-center">
          <Warehouse size={32} className="text-moss mx-auto mb-3" />
          <div className="text-sm text-moss mb-4">You haven't listed a workspace yet.</div>
          <button onClick={openAdd} className="btn-primary">
            <Plus size={15} />
            <span>Add your first space</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-soot/8 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-soot/8 text-xs font-medium text-moss uppercase tracking-wide">
            <div className="col-span-3">Space</div>
            <div className="col-span-2">City</div>
            <div className="col-span-2">Availability</div>
            <div className="col-span-2">Bookings</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>

          <div className="divide-y divide-soot/8">
            {mySpaces.map((space) => (
              <div key={space.id} className="p-5 flex flex-col md:grid md:grid-cols-12 gap-4 md:items-center">
                <div className="col-span-3 font-medium text-soot flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-eucalyptus/20 text-soot flex items-center justify-center font-semibold text-xs shrink-0">
                    {space.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{space.name}</div>
                    <div className="text-xs text-moss capitalize">{space.type}</div>
                  </div>
                </div>

                <div className="col-span-2 text-sm text-moss flex items-center gap-1">
                  <MapPin size={13} /> {space.city}
                </div>

                <div className="col-span-2 text-sm text-moss flex items-center gap-1">
                  <Users size={13} /> {space.availableCapacity} / {space.totalCapacity} seats
                </div>

                <div className="col-span-2 text-sm text-moss font-medium">
                  {bookingCountFor(space.id)} active
                </div>

                <div className="col-span-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEdit(space)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-soot/12 text-xs text-moss hover:text-soot hover:bg-plaster transition-colors"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                  <button
                    onClick={() => toggleSpaceVisibility(space.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-soot/12 text-xs text-moss hover:text-soot hover:bg-plaster transition-colors"
                  >
                    {space.isVisible ? <EyeOff size={11} /> : <Eye size={11} />}
                    {space.isVisible ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => {
                      setSpaceToDelete(space);
                      setDeleteModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 text-xs text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Workspace Modal matching SpacesAdmin 100% */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={editingSpace ? 'Edit Workspace' : 'Add New Workspace'}
        subtitle="Configure details, amenities, and visibility options."
        size="2xl"
        footer={
          <>
            <button type="button" onClick={() => setEditModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={handleSave} className="btn-primary">
              {editingSpace ? 'Save Changes' : 'Publish Space'}
            </button>
          </>
        }
      >
        <div className="space-y-6">
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
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Space"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteModal(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button onClick={handleDelete} className="btn-danger flex-1">
              Delete
            </button>
          </>
        }
      >
        <div className="py-2">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <AlertCircle size={18} className="text-red-500" />
            </div>
            <p className="text-sm text-moss leading-relaxed">
              Are you sure you want to delete <strong className="text-soot">{spaceToDelete?.name}</strong>? This will permanently remove the space and all associated data.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}