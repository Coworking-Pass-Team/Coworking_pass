'use client';
import { useState } from 'react';
import { Building2, Settings, Users, Globe, Phone, Mail, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/app/store';
import { Employee } from '@/types/types';
import Modal from '@/components/ui/Modal';

export default function OrgProfile() {
  const { currentUser, navigate, nav, updateCurrentUser, showToast } = useApp();
  if (!currentUser) return null;

  const activeMode = nav.screen === 'org-settings' ? 'settings' : 'profile';

  const [orgName, setOrgName] = useState(currentUser.orgName || '');
  const [orgSize, setOrgSize] = useState(String(currentUser.orgSize || ''));
  const [industry, setIndustry] = useState(currentUser.industry || '');
  const [website, setWebsite] = useState(currentUser.website || '');
  const [orgDescription, setOrgDescription] = useState(currentUser.orgDescription || '');
  const [saved, setSaved] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>(currentUser.employees || []);
  const [addEmpModal, setAddEmpModal] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: '', email: '', department: '' });

  const handleSaveProfile = () => {
    updateCurrentUser({ orgName, orgSize: parseInt(orgSize) || 0, industry, website, orgDescription });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddEmployee = () => {
    if (!newEmp.name || !newEmp.email) { showToast('Name and email are required.', 'error'); return; }
    const emp: Employee = { id: `emp-${Date.now()}`, ...newEmp };
    const updated = [...employees, emp];
    setEmployees(updated);
    updateCurrentUser({ employees: updated });
    setNewEmp({ name: '', email: '', department: '' });
    setAddEmpModal(false);
  };

  const handleRemoveEmployee = (id: string) => {
    const updated = employees.filter(e => e.id !== id);
    setEmployees(updated);
    updateCurrentUser({ employees: updated });
    showToast('Employee removed.');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl text-soot mb-8" style={{ fontFamily: 'DM Serif Display, serif' }}>
        {activeMode === 'profile' ? 'Organization Profile' : 'Settings'}
      </h1>

      {/* Tab toggle */}
      <div className="flex gap-1 bg-white border border-soot/8 rounded-xl p-1 mb-8 w-fit">
        {[
          { label: 'Profile', screen: 'org-profile' as const, icon: Building2 },
          { label: 'Settings', screen: 'org-settings' as const, icon: Settings },
        ].map(t => (
          <button
            key={t.screen}
            onClick={() => navigate(t.screen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${nav.screen === t.screen ? 'bg-soot text-plaster' : 'text-moss hover:text-soot'}`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {nav.screen === 'org-profile' && (
        <div className="space-y-6">
          {/* Org info */}
          <div className="bg-white rounded-2xl border border-soot/8 p-6">
            <h2 className="font-semibold text-soot mb-4">Organization information</h2>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-eucalyptus/20 flex items-center justify-center">
                <Building2 size={28} className="text-moss" />
              </div>
              <div>
                <div className="font-semibold text-soot">{currentUser.orgName || currentUser.name}</div>
                <div className="text-sm text-moss">{currentUser.email}</div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-moss mb-1.5">Organization name</label>
                <input value={orgName} onChange={e => setOrgName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus" />
              </div>
              <div>
                <label className="block text-xs font-medium text-moss mb-1.5">Industry</label>
                <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Technology" className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus" />
              </div>
              <div>
                <label className="block text-xs font-medium text-moss mb-1.5">Team size</label>
                <input type="number" value={orgSize} onChange={e => setOrgSize(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus" />
              </div>
              <div>
                <label className="block text-xs font-medium text-moss mb-1.5 flex items-center gap-1"><Globe size={11} />Website</label>
                <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://company.sa" className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-moss mb-1.5">Description</label>
                <textarea value={orgDescription} onChange={e => setOrgDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus resize-none" />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              className={`mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${saved ? 'bg-eucalyptus text-soot' : 'bg-soot text-plaster hover:bg-soot-light'}`}
            >
              {saved ? '✓ Saved' : 'Save changes'}
            </button>
          </div>

          {/* Team members */}
          <div className="bg-white rounded-2xl border border-soot/8 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-moss" />
                <h2 className="font-semibold text-soot">Team members ({employees.length})</h2>
              </div>
              <button
                onClick={() => setAddEmpModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-eucalyptus text-soot text-xs font-medium hover:bg-eucalyptus-dark transition-colors"
              >
                <Plus size={12} />
                Add
              </button>
            </div>

            {employees.length === 0 ? (
              <div className="text-center py-8 text-sm text-moss">
                No team members yet. Add employees to assign them to bookings.
              </div>
            ) : (
              <div className="divide-y divide-soot/5">
                {employees.map(emp => (
                  <div key={emp.id} className="flex items-center gap-3 py-3">
                    <div className="w-8 h-8 rounded-full bg-eucalyptus/20 flex items-center justify-center text-sm font-medium text-moss shrink-0">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-soot">{emp.name}</div>
                      <div className="text-xs text-moss truncate">{emp.department} · {emp.email}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveEmployee(emp.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-moss hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {nav.screen === 'org-settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-soot/8 p-6">
            <h2 className="font-semibold text-soot mb-4">Contact information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-moss mb-1.5 flex items-center gap-1"><Phone size={11} />Phone</label>
                <input value={currentUser.phone} className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus" />
              </div>
              <div>
                <label className="block text-xs font-medium text-moss mb-1.5 flex items-center gap-1"><Mail size={11} />Email</label>
                <input value={currentUser.email} disabled className="w-full px-4 py-2.5 rounded-xl border border-soot/8 bg-soot/5 text-moss text-sm" />
              </div>
            </div>
            <button className="mt-4 px-5 py-2.5 rounded-xl bg-soot text-plaster text-sm font-semibold">Save</button>
          </div>

          <div className="bg-white rounded-2xl border border-red-100 p-6">
            <h2 className="font-semibold text-red-600 mb-3">Danger zone</h2>
            <p className="text-sm text-moss mb-4">Deleting your organization account will remove all team data, bookings, and settings.</p>
            <button className="px-4 py-2 rounded-xl border border-red-200 text-red-500 text-sm font-medium">Delete organization</button>
          </div>
        </div>
      )}

      {/* Add employee modal */}
      <Modal open={addEmpModal} onClose={() => setAddEmpModal(false)} title="Add Employee" size="sm">
        <div className="p-6 space-y-4">
          {[
            { label: 'Full name', key: 'name', placeholder: 'Ahmed Al-Dosari' },
            { label: 'Email', key: 'email', placeholder: 'ahmed@company.sa' },
            { label: 'Department', key: 'department', placeholder: 'Engineering' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-moss mb-1.5">{f.label}</label>
              <input
                value={(newEmp as any)[f.key]}
                onChange={e => setNewEmp(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setAddEmpModal(false)} className="flex-1 py-2.5 rounded-xl border border-soot/15 text-soot text-sm font-medium">Cancel</button>
            <button onClick={handleAddEmployee} className="flex-1 py-2.5 rounded-xl bg-eucalyptus text-soot text-sm font-semibold">Add employee</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
