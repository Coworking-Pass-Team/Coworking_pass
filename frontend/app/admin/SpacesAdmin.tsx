'use client';
import { useState } from 'react';
import { Search, Plus, Eye, EyeOff, Pencil, Trash2, MapPin, Star, Users, AlertCircle, Check, X, ChevronDown } from 'lucide-react';
import { useApp } from '@/app/store';
import { Space } from '@/types/types';
import Modal from '@/components/ui/Modal';

const AMENITY_OPTIONS = ['WiFi', 'Coffee', 'Printer', 'Parking', 'Prayer Room', 'Lounge', 'Showers', 'Kitchen', 'Meeting Rooms', 'Reception', 'Event Space'];
const CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Madinah', 'Makkah'];
const TYPES = ['hot-desk', 'private-office', 'meeting-room', 'mixed'];

const emptyForm = (): Partial<Space> => ({
  name: '', city: 'Riyadh', address: '', description: '',
  type: 'mixed', amenities: [], totalCapacity: 20, availableCapacity: 20,
  pricing: { daily: 100, monthly: 1200, yearly: 12000 },
  rating: 4.5, reviewCount: 0, isVisible: true, isFeatured: false,
  openHours: 'Sun–Thu: 8am–9pm', phone: '', email: '',
  images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&auto=format'],
});

export default function SpacesAdmin() {
  const { spaces, addSpace, updateSpace, toggleSpaceVisibility, deleteSpace } = useApp();
  const [query, setQuery] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [form, setForm] = useState<Partial<Space>>(emptyForm());
  const [saved, setSaved] = useState(false);

  const filtered = spaces.filter(s => {
    if (query && !s.name.toLowerCase().includes(query.toLowerCase()) && !s.city.toLowerCase().includes(query.toLowerCase())) return false;
    if (filterCity && s.city !== filterCity) return false;
    return true;
  });

  const openAdd = () => { setEditingSpace(null); setForm(emptyForm()); setEditModal(true); setSaved(false); };
  const openEdit = (space: Space) => { setEditingSpace(space); setForm({ ...space }); setEditModal(true); setSaved(false); };

  const handleSave = () => {
    if (!form.name || !form.city || !form.address) return;
    if (editingSpace) {
      updateSpace(editingSpace.id, form as Space);
    } else {
      addSpace(form as Omit<Space, 'id'>);
    }
    setSaved(true);
    setTimeout(() => { setEditModal(false); setSaved(false); }, 1200);
  };

  const handleDelete = () => {
    if (spaceToDelete) {
      deleteSpace(spaceToDelete.id);
      setDeleteModal(false);
      setSpaceToDelete(null);
    }
  };

  const toggleAmenity = (a: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities?.includes(a)
        ? prev.amenities.filter(x => x !== a)
        : [...(prev.amenities || []), a],
    }));
  };

  const setPrice = (field: 'daily' | 'monthly' | 'yearly', val: number) => {
    setForm(prev => ({ ...prev, pricing: { ...(prev.pricing || { daily: 0, monthly: 0, yearly: 0 }), [field]: val } }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>Manage Spaces</h1>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-eucalyptus text-soot font-medium text-sm hover:bg-eucalyptus-dark">
          <Plus size={15} />
          Add space
        </button>
      </div>

      {/* Search & filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-moss" />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search spaces..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus"
          />
        </div>
        <div className="relative">
          <select
            value={filterCity} onChange={e => setFilterCity(e.target.value)}
            className="pl-3 pr-8 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none appearance-none cursor-pointer"
          >
            <option value="">All cities</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-moss pointer-events-none" />
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mb-5 text-sm text-moss">
        <span>{spaces.length} total</span>
        <span>{spaces.filter(s => s.isVisible).length} visible</span>
        <span>{spaces.filter(s => !s.isVisible).length} hidden</span>
        <span>{spaces.filter(s => s.availableCapacity === 0).length} fully booked</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-soot/8 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-soot/8 text-xs font-medium text-moss uppercase tracking-wide">
          <div className="col-span-4">Space</div>
          <div className="col-span-2">City</div>
          <div className="col-span-2">Availability</div>
          <div className="col-span-2">Price/day</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-soot/5">
          {filtered.map(space => (
            <div key={space.id} className="px-5 py-4">
              {/* Mobile */}
              <div className="md:hidden flex items-start gap-3 mb-3">
                <img src={space.images[0]} alt={space.name} className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-soot text-sm">{space.name}</div>
                      <div className="flex items-center gap-1 text-xs text-moss mt-0.5"><MapPin size={10} />{space.city}</div>
                    </div>
                    {!space.isVisible && <span className="text-[10px] bg-soot/10 text-moss px-2 py-0.5 rounded-full">Hidden</span>}
                  </div>
                </div>
              </div>

              {/* Desktop */}
              <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                <div className="col-span-4 flex items-center gap-3">
                  <img src={space.images[0]} alt={space.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-soot text-sm truncate">{space.name}</div>
                    <div className="flex items-center gap-1 text-xs text-moss">
                      <Star size={9} fill="#98AA9D" className="text-eucalyptus" />
                      {space.rating} · {space.type.replace('-', ' ')}
                    </div>
                  </div>
                  {!space.isVisible && <span className="text-[10px] bg-soot/10 text-moss px-1.5 py-0.5 rounded-full shrink-0">Hidden</span>}
                </div>
                <div className="col-span-2 flex items-center gap-1 text-sm text-moss">
                  <MapPin size={11} />{space.city}
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 bg-soot/8 rounded-full">
                      <div
                        className={`h-full rounded-full ${space.availableCapacity === 0 ? 'bg-red-400' : space.availableCapacity <= 5 ? 'bg-amber-400' : 'bg-eucalyptus'}`}
                        style={{ width: `${(space.availableCapacity / space.totalCapacity) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-moss">{space.availableCapacity}/{space.totalCapacity}</span>
                  </div>
                </div>
                <div className="col-span-2 text-sm font-medium text-soot">SAR {space.pricing.daily}</div>
                <div className="col-span-2 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => openEdit(space)}
                    className="p-1.5 rounded-lg hover:bg-soot/8 text-moss hover:text-soot transition-colors"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => toggleSpaceVisibility(space.id)}
                    className="p-1.5 rounded-lg hover:bg-soot/8 text-moss hover:text-soot transition-colors"
                    title={space.isVisible ? 'Hide' : 'Show'}
                  >
                    {space.isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button
                    onClick={() => { setSpaceToDelete(space); setDeleteModal(true); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-moss hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Mobile actions */}
              <div className="md:hidden flex gap-2">
                <button onClick={() => openEdit(space)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-soot/12 text-xs text-soot">
                  <Pencil size={11} /> Edit
                </button>
                <button onClick={() => toggleSpaceVisibility(space.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-soot/12 text-xs text-moss">
                  {space.isVisible ? <EyeOff size={11} /> : <Eye size={11} />}
                  {space.isVisible ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => { setSpaceToDelete(space); setDeleteModal(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 text-xs text-red-500">
                  <Trash2 size={11} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-moss text-sm">No spaces found.</div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title={editingSpace ? 'Edit Space' : 'Add New Space'} size="xl">
        <div className="p-6 space-y-5">
          {saved && (
            <div className="flex items-center gap-2 bg-eucalyptus/15 text-moss rounded-xl px-4 py-3 text-sm">
              <Check size={14} /> {editingSpace ? 'Space updated!' : 'Space added!'}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-moss mb-1.5">Space name *</label>
              <input value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus" placeholder="The Hub Riyadh" />
            </div>
            <div>
              <label className="block text-xs font-medium text-moss mb-1.5">City *</label>
              <select value={form.city || 'Riyadh'} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none appearance-none cursor-pointer">
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-moss mb-1.5">Address *</label>
              <input value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus" placeholder="Full address" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-moss mb-1.5">Description</label>
              <textarea value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-moss mb-1.5">Space type</label>
              <select value={form.type || 'mixed'} onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))} className="w-full px-3 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none appearance-none cursor-pointer">
                {TYPES.map(t => <option key={t} value={t}>{t.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-moss mb-1.5">Total capacity</label>
              <input type="number" value={form.totalCapacity || 20} onChange={e => setForm(p => ({ ...p, totalCapacity: +e.target.value, availableCapacity: +e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus" />
            </div>
          </div>

          {/* Pricing */}
          <div>
            <label className="block text-xs font-medium text-moss mb-2">Pricing (SAR)</label>
            <div className="grid grid-cols-3 gap-3">
              {(['daily', 'monthly', 'yearly'] as const).map(p => (
                <div key={p}>
                  <label className="block text-[10px] text-moss mb-1 capitalize">{p}</label>
                  <input type="number" value={form.pricing?.[p] || 0} onChange={e => setPrice(p, +e.target.value)} className="w-full px-3 py-2 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus" />
                </div>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-xs font-medium text-moss mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map(a => {
                const sel = form.amenities?.includes(a);
                return (
                  <button key={a} onClick={() => toggleAmenity(a)} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${sel ? 'bg-eucalyptus border-eucalyptus text-soot' : 'border-soot/12 text-moss hover:border-eucalyptus/50'}`}>
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-moss mb-1.5">Phone</label>
              <input value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus" placeholder="+966 11 234 5678" />
            </div>
            <div>
              <label className="block text-xs font-medium text-moss mb-1.5">Email</label>
              <input value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus" placeholder="space@email.sa" />
            </div>
            <div>
              <label className="block text-xs font-medium text-moss mb-1.5">Open hours</label>
              <input value={form.openHours || ''} onChange={e => setForm(p => ({ ...p, openHours: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus" placeholder="Sun–Thu: 8am–9pm" />
            </div>
            <div className="flex items-center gap-6 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isVisible ?? true} onChange={e => setForm(p => ({ ...p, isVisible: e.target.checked }))} className="accent-eucalyptus w-4 h-4 rounded" />
                <span className="text-sm text-soot">Visible</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured ?? false} onChange={e => setForm(p => ({ ...p, isFeatured: e.target.checked }))} className="accent-eucalyptus w-4 h-4 rounded" />
                <span className="text-sm text-soot">Featured</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditModal(false)} className="flex-1 py-2.5 rounded-xl border border-soot/15 text-soot text-sm font-medium">Cancel</button>
            <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-eucalyptus text-soot text-sm font-semibold hover:bg-eucalyptus-dark">
              {editingSpace ? 'Update space' : 'Add space'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Space" size="sm">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <AlertCircle size={18} className="text-red-500" />
            </div>
            <p className="text-sm text-moss leading-relaxed">
              Are you sure you want to delete <strong className="text-soot">{spaceToDelete?.name}</strong>? This will permanently remove the space and all associated data.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setDeleteModal(false)} className="flex-1 py-2.5 rounded-xl border border-soot/15 text-soot text-sm font-medium">Cancel</button>
            <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
