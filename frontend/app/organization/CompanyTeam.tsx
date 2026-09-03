'use client';

import { useState } from 'react';
import { Users, Plus, Search, Trash2, Edit2, Mail, Phone, Shield } from 'lucide-react';
import { useApp } from '@/app/store';
import { Employee } from '@/types';
import Modal from '@/components/ui/Modal';

type CompanyRole = 'Company Owner' | 'Company Manager' | 'Booking Manager' | 'Team Member';

interface TeamMemberExt extends Employee {
  role: CompanyRole;
  status: 'active' | 'invited';
  lastActive: string;
}

const COMPANY_ROLES: CompanyRole[] = ['Company Owner', 'Company Manager', 'Booking Manager', 'Team Member'];

const ROLE_DESC: Record<CompanyRole, string> = {
  'Company Owner': 'Full access to all company data and settings',
  'Company Manager': 'Manage workspaces and bookings',
  'Booking Manager': 'Manage bookings only',
  'Team Member': 'View assigned workspaces and bookings',
};

const ROLE_BADGE: Record<CompanyRole, string> = {
  'Company Owner': 'bg-soot/10 text-soot',
  'Company Manager': 'bg-eucalyptus/15 text-moss',
  'Booking Manager': 'bg-mist/30 text-soot',
  'Team Member': 'bg-plaster text-moss border border-soot/8',
};

export default function CompanyTeam() {
  const { currentUser, updateCurrentUser, showToast } = useApp();
  if (!currentUser) return null;

  const rawEmployees = currentUser.employees || [];

  const [members, setMembers] = useState<TeamMemberExt[]>([
    { id: 'owner', name: currentUser.name, email: currentUser.email, department: 'Leadership', role: 'Company Owner', status: 'active', lastActive: '2026-09-01' },
    ...rawEmployees.map((e: Employee, i: number) => ({
      ...e,
      role: (['Company Manager', 'Booking Manager', 'Team Member', 'Team Member', 'Team Member', 'Team Member'][i] || 'Team Member') as CompanyRole,
      status: 'active' as const,
      lastActive: '2026-08-' + String(20 + i).padStart(2, '0'),
    })),
  ]);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<TeamMemberExt | null>(null);
  const [deleteModal, setDeleteModal] = useState<TeamMemberExt | null>(null);
  const [newMember, setNewMember] = useState({ name: '', email: '', department: '', role: 'Team Member' as CompanyRole });

  const filtered = members.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()) || m.department.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleAdd = () => {
    if (!newMember.name || !newMember.email) { showToast('Name and email are required.', 'error'); return; }
    const member: TeamMemberExt = {
      id: `team-${Date.now()}`,
      name: newMember.name,
      email: newMember.email,
      department: newMember.department,
      role: newMember.role,
      status: 'invited',
      lastActive: '-',
    };
    const updated = [...members, member];
    setMembers(updated);
    const newEmployees = updated.filter(m => m.id !== 'owner').map(m => ({ id: m.id, name: m.name, email: m.email, department: m.department }));
    updateCurrentUser({ employees: newEmployees });
    setNewMember({ name: '', email: '', department: '', role: 'Team Member' });
    setAddModal(false);
    showToast(`${newMember.name} invited to the team.`, 'success');
  };

  const handleDelete = (member: TeamMemberExt) => {
    const updated = members.filter(m => m.id !== member.id);
    setMembers(updated);
    const newEmployees = updated.filter(m => m.id !== 'owner').map(m => ({ id: m.id, name: m.name, email: m.email, department: m.department }));
    updateCurrentUser({ employees: newEmployees });
    setDeleteModal(null);
    showToast(`${member.name} removed from team.`, 'success');
  };

  const handleEditSave = () => {
    if (!editModal) return;
    setMembers(prev => prev.map(m => m.id === editModal.id ? editModal : m));
    setEditModal(null);
    showToast('Team member updated.', 'success');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>Team Members</h1>
          <p className="text-moss text-sm mt-1">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setAddModal(true)} className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#374142] text-[#FAF8F5] text-sm font-medium ring-1 ring-white/15 shadow-sm hover:bg-[#2D3536] transition-all duration-200 active:scale-[0.98] cursor-pointer">
          <Plus size={15} />
          Invite member
        </button>
      </div>

      {/* Role permissions overview */}
      <div className="bg-mist/15 border border-mist/40 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={15} className="text-moss" />
          <span className="text-sm font-semibold text-soot">Company roles & permissions</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {COMPANY_ROLES.map(r => (
            <div key={r} className="bg-white rounded-xl p-3 border border-soot/8">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[r]} block w-fit mb-2`}>{r}</span>
              <p className="text-[11px] text-moss leading-relaxed">{ROLE_DESC[r]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2 flex-1 min-w-40 px-3 py-2 rounded-xl border border-soot/10 bg-white">
          <Search size={14} className="text-moss shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." className="flex-1 bg-transparent text-soot text-sm outline-none" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-soot/10 bg-white text-soot text-sm outline-none">
          <option>All</option>
          {COMPANY_ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* Members list */}
      <div className="bg-white rounded-2xl border border-soot/8 divide-y divide-soot/5">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={28} className="text-moss mx-auto mb-3" />
            <p className="text-sm text-moss">No team members match your search.</p>
          </div>
        ) : filtered.map(member => (
          <div key={member.id} className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-full bg-eucalyptus/20 flex items-center justify-center text-sm font-semibold text-moss shrink-0">
              {member.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-medium text-soot text-sm">{member.name}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[member.role]}`}>{member.role}</span>
                {member.status === 'invited' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">Invited</span>
                )}
              </div>
              <div className="text-xs text-moss mt-0.5 truncate">{member.department} · {member.email}</div>
              <div className="text-[10px] text-moss/60 mt-0.5">Last active: {member.lastActive}</div>
            </div>
            {member.id !== 'owner' && (
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setEditModal({ ...member })} className="p-1.5 rounded-lg hover:bg-soot/5 text-moss transition-colors">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => setDeleteModal(member)} className="p-1.5 rounded-lg hover:bg-red-50 text-moss hover:text-red-500 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add member modal */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="Invite team member"
        size="sm"
        footer={
          <>
            <button onClick={() => setAddModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleAdd} className="btn-primary flex-1">Send invite</button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          {[
            { label: 'Full name', key: 'name', placeholder: 'Ahmed Al-Dosari', type: 'text' },
            { label: 'Email address', key: 'email', placeholder: 'ahmed@company.sa', type: 'email' },
            { label: 'Department', key: 'department', placeholder: 'Engineering, Design, Marketing...', type: 'text' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-moss mb-1.5">{f.label}</label>
              <input
                type={f.type}
                value={(newMember as any)[f.key]}
                onChange={e => setNewMember(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-moss mb-1.5">Role</label>
            <select value={newMember.role} onChange={e => setNewMember(prev => ({ ...prev, role: e.target.value as CompanyRole }))} className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus">
              {COMPANY_ROLES.filter(r => r !== 'Company Owner').map(r => <option key={r}>{r}</option>)}
            </select>
            <p className="text-[10px] text-moss mt-1">{ROLE_DESC[newMember.role]}</p>
          </div>
        </div>
      </Modal>

      {/* Edit member modal */}
      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title="Edit team member"
        size="sm"
        footer={
          <>
            <button onClick={() => setEditModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleEditSave} className="btn-primary flex-1">Save changes</button>
          </>
        }
      >
        {editModal && (
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-medium text-moss mb-1.5">Full name</label>
              <input value={editModal.name} onChange={e => setEditModal(m => m ? { ...m, name: e.target.value } : m)} className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus" />
            </div>
            <div>
              <label className="block text-xs font-medium text-moss mb-1.5">Department</label>
              <input value={editModal.department} onChange={e => setEditModal(m => m ? { ...m, department: e.target.value } : m)} className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus" />
            </div>
            <div>
              <label className="block text-xs font-medium text-moss mb-1.5">Role</label>
              <select value={editModal.role} onChange={e => setEditModal(m => m ? { ...m, role: e.target.value as CompanyRole } : m)} className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus">
                {COMPANY_ROLES.filter(r => r !== 'Company Owner').map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Remove member"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => handleDelete(deleteModal!)} className="btn-danger flex-1">Remove</button>
          </>
        }
      >
        {deleteModal && (
          <div className="py-2">
            <p className="text-sm text-moss mb-1">Remove <span className="font-semibold text-soot">{deleteModal.name}</span> from the team?</p>
            <p className="text-xs text-moss/70">They will lose access to all company workspaces and data.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
